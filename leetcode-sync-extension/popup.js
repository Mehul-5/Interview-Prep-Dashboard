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

      try {
        let offset = 0;
        let allAccepted = [];
        let hasMore = true;

        // --- THE DEEP CRAWLER ENGINE ---
        while (hasMore) {
          statusDiv.innerText = `Scanning deep history... (Found ${allAccepted.length} accepted so far)`;
          
          const lcResponse = await fetch(`https://leetcode.com/api/submissions/?offset=${offset}&limit=100`, {
            method: 'GET',
            credentials: 'include'
          });

          if (lcResponse.status === 401 || lcResponse.status === 403) {
            throw new Error("LeetCode rejected the request. Open a LeetCode tab and log in.");
          }

          const lcData = await lcResponse.json();
          
          if (!lcData.submissions_dump || lcData.submissions_dump.length === 0) {
            hasMore = false;
            break;
          }

          const acceptedSubs = lcData.submissions_dump
            .filter(sub => sub.status_display === "Accepted")
            .map(sub => ({
              title: sub.title,
              titleSlug: sub.title_slug,
              timestamp: sub.timestamp
            }));

          allAccepted.push(...acceptedSubs);

          // If LeetCode says there is more data, increment the offset and keep digging
          if (lcData.has_next) {
            offset += 100;
            // Polite delay to prevent Cloudflare from banning your IP
            await new Promise(resolve => setTimeout(resolve, 500)); 
          } else {
            hasMore = false;
          }
        }

        if (allAccepted.length === 0) {
          throw new Error("No accepted submissions found on this LeetCode profile.");
        }

        statusDiv.innerText = `Total extracted: ${allAccepted.length} problems. Pushing to Render...`;

        // --- PUSH TO DATABASE ---
        const backendResponse = await fetch('https://interview-prep-dashboard.onrender.com/bulk-sync-leetcode', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ submissions: allAccepted })
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
            statusDiv.innerText = `Sync Complete! All ${allAccepted.length} unique problems are already safely in your database.`;
        } else {
            statusDiv.innerText = `Success! Imported ${result.imported_count} new problems.`;
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