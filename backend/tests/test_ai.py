from unittest.mock import patch, MagicMock

@patch("google.generativeai.GenerativeModel.generate_content")
def test_generate_prep_success(mock_generate, client, auth_headers):
    # Mock a perfect JSON response from Gemini
    mock_response = MagicMock()
    mock_response.text = '[{"title": "Two Sum", "difficulty": "Easy", "topic": "Arrays", "url": "https://leetcode.com"}]'
    mock_generate.return_value = mock_response

    response = client.post(
        "/generate-prep", 
        json={"company": "Google", "role": "SWE"}, 
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data[0]["title"] == "Two Sum"
    assert data[0]["topic"] == "Arrays"

def test_generate_prep_unauthorized(client):
    # Ensure it fails without a token
    response = client.post("/generate-prep", json={"company": "Meta", "role": "Intern"})
    assert response.status_code == 401