from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware # <-- ADD THIS IMPORT
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import List
from datetime import datetime
import jwt

import models, schemas, crud, auth
from db import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Interview Prep Dashboard API")

# --- SECURITY GATEKEEPER ---
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def get_current_user(token: str = Depends(oauth2_scheme)):
    """
    Intercepts the request, reads the JWT token, and returns the user's UUID.
    If the token is fake, expired, or missing, it violently rejects the request.
    """
    try:
        # Decode the token using the secret key from auth.py
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        user_id: str = payload.get("sub")
        
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token structure")
            
        return user_id
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

# --- CORS SETUP ---
# This allows your React frontend to communicate with this FastAPI backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"], # Vite's default ports
    allow_credentials=True,
    allow_methods=["*"], # Allows GET, POST, PUT, DELETE
    allow_headers=["*"],
)

# --- AUTHENTICATION ROUTES ---

@app.post("/signup", response_model=schemas.UserResponse)
def signup(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    Registers a new user. 
    Notice how `user` is typed as `schemas.UserCreate`. Pydantic handles the validation automatically.
    """
    # 1. Check if email already exists
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # 2. Create the user
    new_user = crud.create_user(
        db=db, 
        username=user.username, 
        email=user.email, 
        password=user.password
    )
    
    # 3. Return the user (FastAPI automatically filters out the password because of schemas.UserResponse)
    return new_user

@app.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    
    # 1. Fetch the user from the database
    # Note: OAuth2PasswordRequestForm forces the field name to be 'username', 
    # even though our frontend will be sending an email address in that field.
    user = crud.get_user_by_email(db, email=form_data.username)

    # 2. Security Check: Does the user exist AND does the password match?
    if not user or not auth.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 3. Generate the JWT token
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # We cast user.id to a string because UUIDs cannot be serialized into JSON directly
    access_token = auth.create_access_token(
        data={"sub": str(user.id)}, 
        expires_delta=access_token_expires
    )

    # 4. Return the token exactly as schemas.Token demands
    return {"access_token": access_token, "token_type": "bearer"}

# --- DATA DELIVERY ROUTES ---

@app.get("/sheets", response_model=List[str])
def get_available_sheets(db: Session = Depends(get_db)):
    """
    Returns a simple list of strings containing the names of all seeded sheets.
    """
    return crud.get_all_sheet_names(db)

@app.get("/problems/{sheet_name}", response_model=List[schemas.ProblemResponse])
def get_problems(sheet_name: str, db: Session = Depends(get_db)):
    """
    Fetches all problems for a specific sheet. 
    """
    problems = crud.get_problems_by_sheet(db, sheet_name=sheet_name)
    
    if not problems:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Sheet not found or empty"
        )
        
    return problems

# --- PROGRESS TRACKING ROUTES ---

@app.get("/solutions", response_model=List[int])
def get_my_solutions(user_id: str = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Fetches the user's solved problems.
    Instead of returning massive JSON objects, we map it down to a simple 
    array of IDs: [1, 5, 23, 104] so React can easily load it into a Set().
    """
    solutions = crud.get_user_solutions(db, user_id=user_id)
    return [sol.problem_id for sol in solutions]

@app.post("/solutions/{problem_id}")
def mark_problem_solved(problem_id: int, user_id: str = Depends(get_current_user), db: Session = Depends(get_db)):
    """Saves a solved problem to PostgreSQL"""
    # Safety Check: Don't let the user insert duplicates
    existing = db.query(models.UserSolution).filter(
        models.UserSolution.user_id == user_id, 
        models.UserSolution.problem_id == problem_id
    ).first()
    
    if not existing:
        crud.create_user_solution(db, user_id=user_id, problem_id=problem_id)
        
    return {"message": "Problem marked as solved"}

@app.delete("/solutions/{problem_id}")
def unmark_problem_solved(problem_id: int, user_id: str = Depends(get_current_user), db: Session = Depends(get_db)):
    """Removes a solved problem from PostgreSQL"""
    existing = db.query(models.UserSolution).filter(
        models.UserSolution.user_id == user_id, 
        models.UserSolution.problem_id == problem_id
    ).first()
    
    if existing:
        db.delete(existing)
        db.commit()
        
    return {"message": "Problem unmarked"}

@app.get("/my-progress")
def get_my_progress(user_id: str = Depends(get_current_user), db: Session = Depends(get_db)):
    """Returns the full detailed problem objects for the React Dashboard/Streak charts"""
    solutions = crud.get_user_solutions(db, user_id=user_id)
    
    result = []
    for sol in solutions:
        prob = db.query(models.Problem).filter(models.Problem.id == sol.problem_id).first()
        if prob:
            # Safely grab the creation date or fallback to today
            solved_date = getattr(sol, 'created_at', datetime.utcnow())
            result.append({
                "id": prob.id,
                "name": prob.title,
                "level": prob.difficulty,
                "topic": getattr(prob, 'topic', 'General'), 
                "date": solved_date.strftime("%Y-%m-%d") if isinstance(solved_date, datetime) else str(solved_date)[:10],
                "fromSheet": prob.sheet_name
            })
    return result