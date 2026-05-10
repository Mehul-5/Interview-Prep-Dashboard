import requests
import re
from sqlalchemy.orm import Session
import models

def normalize_title(title: str) -> str:
    """Strips punctuation and spaces to ensure an exact match."""
    if not title:
        return ""
    return re.sub(r'[^a-z0-9]', '', title.lower())

def fetch_recent_solved(username: str):
    """Hits LeetCode's undocumented GraphQL API."""
    url = "https://leetcode.com/graphql"
    query = """
    query recentAcSubmissions($username: String!, $limit: Int!) {
        recentAcSubmissionList(username: $username, limit: $limit) {
            title
            titleSlug
            timestamp
        }
    }
    """
    variables = {"username": username, "limit": 50}
    
    try:
        # 10 second timeout to prevent the external API from hanging your server
        response = requests.post(url, json={"query": query, "variables": variables}, timeout=10)
        if response.status_code == 200:
            return response.json().get("data", {}).get("recentAcSubmissionList", [])
    except Exception as e:
        print(f"GraphQL extraction failed for {username}: {e}")
    return []

def sync_user_leetcode_data(db: Session, user: models.User, target_username: str):
    recent_submissions = fetch_recent_solved(target_username)
    
    if not recent_submissions:
        # Profile might be private or invalid
        return 0

    # Pull all standard problems into memory for fast matching
    all_problems = db.query(models.Problem).all()
    problem_map = {normalize_title(p.title): p for p in all_problems}
    
    imported_count = 0
    
    for sub in recent_submissions:
        lc_title = sub.get("title")
        if not lc_title: continue
        
        normalized_lc_title = normalize_title(lc_title)
        matched_problem = problem_map.get(normalized_lc_title)
        
        if matched_problem:
            # Verify they haven't already marked this as solved in your DB
            existing = db.query(models.UserSolution).filter(
                models.UserSolution.user_id == user.id,
                models.UserSolution.problem_id == matched_problem.id
            ).first()
            
            if not existing:
                new_solution = models.UserSolution(
                    user_id=user.id,
                    problem_id=matched_problem.id
                )
                db.add(new_solution)
                imported_count += 1
                
    if imported_count > 0 or user.leetcode_username != target_username:
        # Save their username so we can auto-sync later
        user.leetcode_username = target_username
        db.commit()
        
    return imported_count