from passlib.context import CryptContext
import os
import jwt
from datetime import datetime, timedelta, timezone

# Creating the hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    # pwd_context.hash() automatically generates the salt and returns the final string
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    # Returns True if they match, False if they don't
    return pwd_context.verify(plain_password, hashed_password)


SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

if not SECRET_KEY:
    raise ValueError("SECRET_KEY is missing in .env")

def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    # 1. Make a copy of the data so we don't accidentally mutate the original dictionary
    to_encode = data.copy()

    # 2. Calculate the exact moment this token should die
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        # Fallback security: If no delta is passed, kill the token in 15 minutes
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    
    # 3. Inject the expiration timestamp into the payload
    to_encode.update({"exp": expire})

    # 4. Sign the token mathematically
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    return encoded_jwt