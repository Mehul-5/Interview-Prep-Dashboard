import models

def test_mark_and_unmark_progress(client, db_session, auth_headers):
    # STEP 1: Manually create a problem so the Foreign Key exists
    test_problem = models.Problem(
        id=1, 
        title="Test Problem", 
        difficulty="Easy", 
        url="https://leetcode.com", 
        sheet_name="Test Sheet"
    )
    db_session.add(test_problem)
    db_session.commit()

    # 1. Initially, progress should be empty for a new user
    initial_res = client.get("/my-progress", headers=auth_headers)
    assert len(initial_res.json()) == 0

    # 2. Mark the problem as solved
    mark_res = client.post("/solutions/1", headers=auth_headers)
    assert mark_res.status_code == 200

    # 3. Verify it appears in progress
    progress_res = client.get("/my-progress", headers=auth_headers)
    # Ensure we check the title or ID correctly
    assert any(p["id"] == "1" for p in progress_res.json())

    # 4. Unmark and verify removal
    client.delete("/solutions/1", headers=auth_headers)
    final_res = client.get("/my-progress", headers=auth_headers)
    assert not any(p["id"] == "1" for p in final_res.json())