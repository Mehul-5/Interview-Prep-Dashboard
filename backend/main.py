from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta

import models, schemas, crud, auth
from db import engine, get_db

# This line ensures all tables are created if you didn't use Alembic 
# (Since Alembic is used, this is just a safe fallback)
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Interview Prep Dashboard API")

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