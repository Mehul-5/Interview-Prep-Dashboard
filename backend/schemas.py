from pydantic import BaseModel, EmailStr
from datetime import datetime
from uuid import UUID

# --- USER SCHEMAS ---

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: UUID
    username: str
    email: EmailStr
    created_at: datetime

    class Config:
        from_attributes = True

# --- TOKEN SCHEMAS ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: str | None = None

class ProblemResponse(BaseModel):
    id: int
    title: str
    difficulty: str
    url: str
    sheet_name: str
    
    class Config:
        from_attributes = True