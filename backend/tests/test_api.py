from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_app_initialization():
    """Ensure the FastAPI app boots without instantly crashing."""
    assert app.title == "Interview Prep Dashboard API"

def test_unauthorized_access_blocked():
    """Ensure the API rejects unauthenticated requests to protected routes."""
    response = client.get("/sheets")
    assert response.status_code == 401
    assert response.json()["detail"] == "Not authenticated"