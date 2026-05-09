def test_duplicate_signup_prevention(client):
    payload = {"email": "unique@example.com", "username": "user", "password": "password"}
    client.post("/signup", json=payload)
    
    # Try again with same email
    response = client.post("/signup", json=payload)
    assert response.status_code == 400
    assert "Email already registered" in response.text

def test_invalid_login_credentials(client):
    response = client.post("/login", data={"username": "wrong@email.com", "password": "wrongpassword"})
    assert response.status_code == 401
    assert "Incorrect email or password" in response.text

def test_expired_token_handling(client):
    # Manually create an expired token
    import auth
    from datetime import timedelta
    expired_token = auth.create_access_token(
        data={"sub": "1"}, 
        expires_delta=timedelta(minutes=-1) # Expired 1 minute ago
    )
    
    headers = {"Authorization": f"Bearer {expired_token}"}
    response = client.get("/sheets", headers=headers)
    assert response.status_code == 401
    assert "Invalid or expired token" in response.text