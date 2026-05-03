from passlib.context import CryptContext

# Creating the hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    # pwd_context.hash() automatically generates the salt and returns the final string
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    # Returns True if they match, False if they don't
    return pwd_context.verify(plain_password, hashed_password)