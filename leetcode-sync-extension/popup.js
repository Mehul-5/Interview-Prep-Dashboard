document.addEventListener('DOMContentLoaded', () => {
  const syncBtn = document.getElementById('syncBtn');
  const statusDiv = document.getElementById('status');

  syncBtn.addEventListener('click', async () => {
    chrome.storage.local.get(['dsaToken'], async (result) => {
      const token = result.dsaToken;
      
      if (!token) {
        statusDiv.innerText = "Error: Not connected. Log out and log back into your Dashboard to trigger the bridge.";
        statusDiv.style.color = "#f43f5e";
        return;
      }

      syncBtn.disabled = true;
      statusDiv.innerText = "1/2: Authenticating with LeetCode...";
      statusDiv.style.color = "#94a3b8";

      try {
        // --- 1. EXTRACT FROM LEETCODE ---
        const lcResponse = await fetch('https://leetcode.com/api/submissions/?offset=0&limit=500', {
          method: 'GET',
          credentials: 'include' // CRITICAL FIX: Forces Chrome to attach your active LeetCode session cookies
        });

        if (lcResponse.status === 401 || lcResponse.status === 403) {
          throw new Error("LeetCode rejected the request. Open a new tab, go to LeetCode.com, and ensure you are fully logged in.");
        }

        const lcData = await lcResponse.json();
        
        if (!lcData.submissions_dump || lcData.submissions_dump.length === 0) {
          throw new Error("No accepted submissions found on this LeetCode profile.");
        }

        const acceptedSubs = lcData.submissions_dump
          .filter(sub => sub.status_display === "Accepted")
          .map(sub => ({
            title: sub.title,
            titleSlug: sub.title_slug,
            timestamp: sub.timestamp
          }));

        statusDiv.innerText = `2/2: Found ${acceptedSubs.length} problems. Pushing to Render...`;

        // --- 2. PUSH TO RENDER ---
        const backendResponse = await fetch('https://interview-prep-dashboard.onrender.com/bulk-sync-leetcode', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ submissions: acceptedSubs })
        });

        if (!backendResponse.ok) {
          // CRITICAL FIX: Explicitly call out a 404 Not Found
          if (backendResponse.status === 404) {
              throw new Error("404 Not Found: Your Render server is still running the old code. The deployment has not finished yet.");
          }

          let serverError = "Unknown server error";
          try {
             const errorData = await backendResponse.json();
             serverError = typeof errorData.detail === 'string' 
                ? errorData.detail 
                : JSON.stringify(errorData.detail || errorData);
          } catch(e) {
             serverError = `HTTP ${backendResponse.status} - ${backendResponse.statusText}`;
          }
          throw new Error(`Render Server Error: ${serverError}`);
        }

        const result = await backendResponse.json();
        statusDiv.innerText = `Success! Imported ${result.imported_count} new problems.`;
        statusDiv.style.color = "#10b981";

      } catch (err) {
        statusDiv.innerText = err.message;
        statusDiv.style.color = "#f43f5e";
      } finally {
        syncBtn.disabled = false;
      }
    });
  });
});