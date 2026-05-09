import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

from main import app
from db import get_db
from models import Base  # Correct: Base is in models.py

# Use the CI database URL or a local test one
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://testuser:testpassword@localhost:5432/testdb")

engine = create_engine(SQLALCHEMY_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session", autouse=True)
def setup_db():
    """Builds the database tables once for the entire test session."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def db_session():
    """Provides a fresh database session for every individual test."""
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    yield session
    session.close()
    if transaction.is_active:
        transaction.rollback()
    connection.close()

@pytest.fixture
def client(db_session):
    """Provides a TestClient that uses the test database session."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    app.dependency_overrides[get_db] = override_get_db
    return TestClient(app)

@pytest.fixture
def auth_headers(client):
    """Creates a test user and returns the valid JWT headers for authenticated routes."""
    email = "tester@example.com"
    password = "password123"
    # Create the user
    client.post("/signup", json={"email": email, "username": "tester", "password": password})
    # Log in to get the token
    login_res = client.post("/login", data={"username": email, "password": password})
    token = login_res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}