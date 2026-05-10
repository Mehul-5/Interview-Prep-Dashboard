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
        return 0

    # 1. Pull standard problems for fast matching
    all_problems = db.query(models.Problem).all()
    problem_map = {normalize_title(p.title): p for p in all_problems}
    
    # 2. Pull existing custom problems so we don't duplicate imports
    existing_custom = db.query(models.CustomProblem).filter(models.CustomProblem.user_id == user.id).all()
    custom_map = {normalize_title(cp.title): cp for cp in existing_custom}
    
    imported_count = 0
    
    for sub in recent_submissions:
        lc_title = sub.get("title")
        lc_slug = sub.get("titleSlug")
        if not lc_title: continue
        
        normalized_lc_title = normalize_title(lc_title)
        matched_problem = problem_map.get(normalized_lc_title)
        
        if matched_problem:
            # ROUTE A: It's a standard sheet problem
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
                
        else:
            # ROUTE B: It's an unknown problem. Send to Custom Problems.
            if normalized_lc_title not in custom_map:
                new_cp = models.CustomProblem(
                    user_id=user.id,
                    title=lc_title,
                    difficulty="Medium", # LeetCode's lightweight query doesn't return difficulty, defaulting to Medium
                    url=f"https://leetcode.com/problems/{lc_slug}/" if lc_slug else "",
                    topic="LeetCode Sync",
                    source="Custom",
                    notes="Auto-imported from LeetCode"
                )
                db.add(new_cp)
                # Add to local map so we don't insert it twice in the same loop
                custom_map[normalized_lc_title] = new_cp 
                imported_count += 1
                
    if imported_count > 0 or user.leetcode_username != target_username:
        user.leetcode_username = target_username
        db.commit()
        
    return imported_count