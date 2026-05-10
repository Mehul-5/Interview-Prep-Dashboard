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
      statusDiv.innerText = "Fetching Master Problem List...";

      try {
        const lcResponse = await fetch('https://leetcode.com/api/problems/all/', {
          method: 'GET',
          credentials: 'include'
        });

        if (lcResponse.status === 401 || lcResponse.status === 403) {
          throw new Error("LeetCode rejected the request. Open a LeetCode tab and log in.");
        }

        const lcData = await lcResponse.json();
        const currentTime = Math.floor(Date.now() / 1000);

        const acceptedSubs = lcData.stat_status_pairs
          .filter(pair => pair.status === "ac")
          .map(pair => ({
            title: pair.stat.question__title,
            titleSlug: pair.stat.question__title_slug,
            timestamp: currentTime
          }));

        if (acceptedSubs.length === 0) throw new Error("No accepted problems found.");

        statusDiv.innerText = `Found ${acceptedSubs.length} problems. Pushing to Render...`;

        const backendResponse = await fetch('https://interview-prep-dashboard.onrender.com/bulk-sync-leetcode', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ submissions: acceptedSubs })
        });

        if (!backendResponse.ok) throw new Error(`HTTP ${backendResponse.status}`);

        const result = await backendResponse.json();
        
        if (result.imported_count === 0) {
            statusDiv.innerText = `Sync Complete! All ${acceptedSubs.length} problems already safely stored.`;
        } else {
            statusDiv.innerText = `Success! Imported ${result.imported_count} perfectly tagged problems.`;
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