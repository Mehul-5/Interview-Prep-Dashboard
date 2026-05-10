from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.orm import Session
from datetime import timedelta, datetime, timezone
from typing import List, Optional
from pydantic import BaseModel
import jwt
import os
import json
import re
import traceback
import google.generativeai as genai
from dotenv import load_dotenv

import models, schemas, crud, auth
from db import engine, get_db

# --- INITIALIZATION ---
load_dotenv()
models.Base.metadata.create_all(bind=engine)
app = FastAPI(title="Interview Prep Dashboard API")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# --- AUTHENTICATION DEPENDENCY ---
def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token structure")
        return user_id
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

# --- CORS POLICY ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://127.0.0.1:5173", 
        "https://dsa-tracker-sage.vercel.app", 
        "https://dsa-tracker-git-main-mehul-s-projects09.vercel.app"
    ],
    allow_origin_regex=r"chrome-extension://.*",  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- AUTHENTICATION ROUTES ---
@app.post("/signup", response_model=schemas.UserResponse)
def signup(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db=db, username=user.username, email=user.email, password=user.password)

@app.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, email=form_data.username)
    if not user or not auth.verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password", headers={"WWW-Authenticate": "Bearer"})
    access_token = auth.create_access_token(data={"sub": str(user.id)}, expires_delta=timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES))
    return {"access_token": access_token, "token_type": "bearer"}

# --- SHEETS & PROBLEMS ROUTES ---
@app.get("/sheets")
def get_available_sheets(user_id: str = Depends(get_current_user), db: Session = Depends(get_db)):
    sheet_names = crud.get_all_sheet_names(db)
    result = []
    for sn in sheet_names:
        name = sn[0] if isinstance(sn, tuple) else sn
        count = db.query(models.Problem).filter(models.Problem.sheet_name == name).count()
        result.append({"id": name, "name": name, "totalProblems": count})
        
    custom_count = db.query(models.CustomProblem).filter(models.CustomProblem.user_id == user_id).count()
    result.append({"id": "Custom Problems", "name": "Custom Problems", "totalProblems": custom_count if custom_count > 0 else 1})
    return result

@app.get("/problems/{sheet_name}")
def get_problems(sheet_name: str, user_id: str = Depends(get_current_user), db: Session = Depends(get_db)):
    if sheet_name == "Custom Problems":
        cps = db.query(models.CustomProblem).filter(models.CustomProblem.user_id == user_id).all()
        return [{"id": f"custom-{cp.id}", "title": cp.title, "difficulty": cp.difficulty, "url": cp.url, "topic": cp.topic, "sheet_name": "Custom Problems"} for cp in cps]
        
    problems = crud.get_problems_by_sheet(db, sheet_name=sheet_name)
    if not problems:
        raise HTTPException(status_code=404, detail="Sheet not found")
    return [{"id": str(p.id), "title": p.title, "difficulty": p.difficulty, "url": p.url, "topic": getattr(p, 'topic', 'General'), "sheet_name": p.sheet_name} for p in problems]

# --- PROGRESS TOGGLES ROUTES ---
@app.get("/solutions", response_model=List[str])
def get_my_solutions(user_id: str = Depends(get_current_user), db: Session = Depends(get_db)):
    solutions = crud.get_user_solutions(db, user_id=user_id)
    solved_ids = [str(sol.problem_id) for sol in solutions]
    custom_probs = db.query(models.CustomProblem).filter(models.CustomProblem.user_id == user_id).all()
    for cp in custom_probs:
        if cp.source == "Custom": 
            solved_ids.append(f"custom-{cp.id}")
    return solved_ids

@app.post("/solutions/{problem_id}")
def mark_problem_solved(problem_id: int, user_id: str = Depends(get_current_user), db: Session = Depends(get_db)):
    existing = db.query(models.UserSolution).filter(models.UserSolution.user_id == user_id, models.UserSolution.problem_id == problem_id).first()
    if not existing:
        crud.create_user_solution(db, user_id=user_id, problem_id=problem_id)
    return {"message": "Problem marked as solved"}

@app.delete("/solutions/{problem_id}")
def unmark_problem_solved(problem_id: int, user_id: str = Depends(get_current_user), db: Session = Depends(get_db)):
    existing = db.query(models.UserSolution).filter(models.UserSolution.user_id == user_id, models.UserSolution.problem_id == problem_id).first()
    if existing:
        db.delete(existing)
        db.commit()
    return {"message": "Problem unmarked"}

# --- CUSTOM PROBLEMS ROUTES ---
class CustomProblemInput(BaseModel):
    title: str
    difficulty: str
    url: str = ""
    topic: str = "Custom"
    date: str = ""  
    note: str = ""  

@app.post("/custom-problems")
def add_custom_problem(prob: CustomProblemInput, user_id: str = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        parsed_date = datetime.strptime(prob.date, "%Y-%m-%d").replace(tzinfo=timezone.utc) if prob.date else datetime.now(timezone.utc)
    except ValueError:
        parsed_date = datetime.now(timezone.utc)

    new_cp = models.CustomProblem(
        user_id=user_id, title=prob.title, difficulty=prob.difficulty, url=prob.url,
        topic=prob.topic, source="Custom", notes=prob.note
    )
    if hasattr(new_cp, 'solved_at'):
        new_cp.solved_at = parsed_date
        
    db.add(new_cp)
    db.commit()
    return {"message": "Custom problem saved successfully"}

@app.put("/custom-problems/{problem_id}/toggle")
def toggle_custom_problem(problem_id: int, user_id: str = Depends(get_current_user), db: Session = Depends(get_db)):
    cp = db.query(models.CustomProblem).filter(models.CustomProblem.id == problem_id, models.CustomProblem.user_id == user_id).first()
    if cp:
        cp.source = "Custom-Revise" if cp.source == "Custom" else "Custom"
        db.commit()
        return {"status": cp.source}
    raise HTTPException(status_code=404, detail="Problem not found")

@app.get("/my-progress")
def get_my_progress(user_id: str = Depends(get_current_user), db: Session = Depends(get_db)):
    result = []
    solutions = crud.get_user_solutions(db, user_id=user_id)
    for sol in solutions:
        prob = db.query(models.Problem).filter(models.Problem.id == sol.problem_id).first()
        if prob:
            date_val = getattr(sol, 'solved_at', None) or getattr(sol, 'created_at', None) or datetime.utcnow()
            result.append({
                "id": str(prob.id), "name": prob.title, "level": prob.difficulty,
                "topic": getattr(prob, 'topic', 'General'), "url": prob.url,
                "date": date_val.strftime("%Y-%m-%d") if isinstance(date_val, datetime) else str(date_val)[:10],
                "fromSheet": prob.sheet_name
            })
            
    custom_probs = db.query(models.CustomProblem).filter(models.CustomProblem.user_id == user_id, models.CustomProblem.source == "Custom").all()
    for cp in custom_probs:
        cp_date = getattr(cp, 'solved_at', None) or getattr(cp, 'created_at', None) or datetime.utcnow()
        result.append({
            "id": f"custom-{cp.id}", "name": cp.title, "level": cp.difficulty,
            "topic": getattr(cp, 'topic', 'Custom'), "url": cp.url,
            "date": cp_date.strftime("%Y-%m-%d") if isinstance(cp_date, datetime) else str(cp_date)[:10],
            "fromSheet": "Custom Problems" 
        })
    return result

class PrepRequest(BaseModel):
    company: str
    role: str

@app.post("/generate-prep")
def generate_prep(req: PrepRequest, user_id: str = Depends(get_current_user)):
    """Pings the LLM to generate a targeted prep list."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("CRITICAL: GEMINI_API_KEY not found in environment.")
        raise HTTPException(status_code=500, detail="API Key missing. Add GEMINI_API_KEY to your .env file.")
        
    genai.configure(api_key=api_key)
    
    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        
        prompt = f"""
        You are a strict technical interviewer. 
        Generate exactly 5 highly-tested Data Structures & Algorithms problems for a {req.role} interview at {req.company}.
        Respond ONLY with a raw JSON array of objects. Do NOT use markdown code blocks like ```json.
        Each object MUST have exactly these keys:
        - "title": (string) Problem name
        - "difficulty": (string) "Easy", "Medium", or "Hard"
        - "topic": (string) Core DSA topic (e.g., "Arrays", "Graphs")
        - "url": (string) A realistic LeetCode URL for the problem
        """
        
        response = model.generate_content(prompt)
        raw_text = response.text.strip()
        
        # Strip markdown safely
        if raw_text.startswith("```json"): 
            raw_text = raw_text[7:]
        if raw_text.startswith("```"): 
            raw_text = raw_text[3:]
        if raw_text.endswith("```"): 
            raw_text = raw_text[:-3]
            
        return json.loads(raw_text.strip())
        
    except Exception as e:
        print(f"AI Generation Error: {e}")
        raise HTTPException(status_code=500, detail="AI generation failed. Please try again.")
    
# --- EXTENSION BULK SYNC ROUTE ---
class BulkProblem(BaseModel):
    title: Optional[str] = None
    titleSlug: Optional[str] = ""
    timestamp: Optional[int] = 0

class BulkSyncRequest(BaseModel):
    submissions: List[BulkProblem]

def normalize_title_safe(title: str) -> str:
    if not title: return ""
    return re.sub(r'[^a-z0-9]', '', title.lower())

@app.post("/bulk-sync-leetcode")
def bulk_sync_leetcode(
    request: BulkSyncRequest, 
    db: Session = Depends(get_db), 
    user_id: str = Depends(get_current_user)
):
    try:
        current_user = db.query(models.User).filter(models.User.id == user_id).first()
        if not current_user:
            raise HTTPException(status_code=404, detail="User not found")

        unique_subs = {}
        for sub in request.submissions:
            if sub.title: 
                unique_subs[sub.title] = sub
            
        recent_submissions = list(unique_subs.values())

        all_problems = db.query(models.Problem).all()
        problem_map = {normalize_title_safe(p.title): p for p in all_problems}
        
        existing_custom = db.query(models.CustomProblem).filter(models.CustomProblem.user_id == current_user.id).all()
        custom_map = {normalize_title_safe(cp.title): cp for cp in existing_custom}
        
        existing_solutions = db.query(models.UserSolution).filter(models.UserSolution.user_id == current_user.id).all()
        solved_map = {sol.problem_id: True for sol in existing_solutions}

        imported_count = 0
        
        for sub in recent_submissions:
            normalized_title = normalize_title_safe(sub.title)
            matched_problem = problem_map.get(normalized_title)
            
            try:
                solved_date = datetime.fromtimestamp(sub.timestamp, tz=timezone.utc) if sub.timestamp else datetime.now(timezone.utc)
            except Exception:
                solved_date = datetime.now(timezone.utc)
            
            if matched_problem:
                if not solved_map.get(matched_problem.id):
                    new_sol = models.UserSolution(user_id=current_user.id, problem_id=matched_problem.id)
                    if hasattr(new_sol, 'solved_at'):
                        new_sol.solved_at = solved_date
                    db.add(new_sol)
                    solved_map[matched_problem.id] = True
                    imported_count += 1
            else:
                if normalized_title not in custom_map:
                    new_cp = models.CustomProblem(
                        user_id=current_user.id, 
                        title=sub.title, 
                        difficulty="Unknown", 
                        url=f"https://leetcode.com/problems/{sub.titleSlug}/" if sub.titleSlug else "",
                        topic="Full History Sync", 
                        source="Custom", 
                        notes="Imported via Extension"
                    )
                    if hasattr(new_cp, 'solved_at'):
                        new_cp.solved_at = solved_date
                        
                    db.add(new_cp)
                    custom_map[normalized_title] = new_cp 
                    imported_count += 1
                    
        db.commit()
        return {"imported_count": imported_count, "message": "Bulk sync complete"}
        
    except Exception as e:
        db.rollback()
        print("--- BULK SYNC ERROR ---")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")