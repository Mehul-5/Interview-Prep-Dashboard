def test_mark_and_unmark_progress(client, auth_headers):
    # 1. Initially, progress should be empty
    initial_res = client.get("/my-progress", headers=auth_headers)
    assert len(initial_res.json()) == 0

    # 2. Mark a specific problem as solved (Assumes problem ID 1 exists from seed)
    mark_res = client.post("/solutions/1", headers=auth_headers)
    assert mark_res.status_code == 200

    # 3. Verify it appears in progress
    progress_res = client.get("/my-progress", headers=auth_headers)
    assert any(p["id"] == "1" for p in progress_res.json())

    # 4. Unmark and verify removal
    client.delete("/solutions/1", headers=auth_headers)
    final_res = client.get("/my-progress", headers=auth_headers)
    assert not any(p["id"] == "1" for p in final_res.json())