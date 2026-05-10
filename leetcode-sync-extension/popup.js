document.addEventListener('DOMContentLoaded', () => {
  const syncBtn = document.getElementById('syncBtn');
  const statusDiv = document.getElementById('status');

  syncBtn.addEventListener('click', async () => {
    chrome.storage.local.get(['dsaToken'], async (result) => {
      const token = result.dsaToken;
      
      if (!token) {
        statusDiv.innerText = "Error: Not connected. Log out and log back into your Dashboard.";
        statusDiv.style.color = "#f43f5e";
        return;
      }

      syncBtn.disabled = true;
      statusDiv.style.color = "#94a3b8";
      statusDiv.innerText = "Authenticating and fetching Master Problem List...";

      try {
        // --- THE MASTER STATE ENGINE ---
        // Instead of paginating through limited history, we hit the core API 
        // that tracks the 'Solved' status for every problem on the platform.
        const lcResponse = await fetch('https://leetcode.com/api/problems/all/', {
          method: 'GET',
          credentials: 'include'
        });

        if (lcResponse.status === 401 || lcResponse.status === 403) {
          throw new Error("LeetCode rejected the request. Open a LeetCode tab and log in.");
        }

        const lcData = await lcResponse.json();
        
        if (!lcData.stat_status_pairs) {
          throw new Error("Failed to parse LeetCode problem data.");
        }

        const currentTime = Math.floor(Date.now() / 1000);

        // Filter for only the problems where status is 'ac' (Accepted)
        const acceptedSubs = lcData.stat_status_pairs
          .filter(pair => pair.status === "ac")
          .map(pair => ({
            title: pair.stat.question__title,
            titleSlug: pair.stat.question__title_slug,
            timestamp: currentTime // Fallback to current time since this endpoint doesn't track exact submission dates
          }));

        if (acceptedSubs.length === 0) {
          throw new Error("No accepted problems found on this LeetCode profile.");
        }

        statusDiv.innerText = `Found exactly ${acceptedSubs.length} solved problems. Pushing to Render...`;

        // --- PUSH TO DATABASE ---
        const backendResponse = await fetch('https://interview-prep-dashboard.onrender.com/bulk-sync-leetcode', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ submissions: acceptedSubs })
        });

        if (!backendResponse.ok) {
          let serverError = "Unknown server error";
          try {
             const errorData = await backendResponse.json();
             serverError = errorData.detail || JSON.stringify(errorData);
          } catch(e) {
             serverError = `HTTP ${backendResponse.status}`;
          }
          throw new Error(`Render Error: ${serverError}`);
        }

        const result = await backendResponse.json();
        
        // --- IDEMPOTENCY AWARENESS UI ---
        if (result.imported_count === 0) {
            statusDiv.innerText = `Sync Complete! All ${acceptedSubs.length} problems are already safely in your database.`;
        } else {
            statusDiv.innerText = `Success! Imported ${result.imported_count} new problems. (Total Solved: ${acceptedSubs.length})`;
        }
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