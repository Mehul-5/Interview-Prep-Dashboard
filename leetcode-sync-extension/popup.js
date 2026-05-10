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
      statusDiv.innerText = "Accessing LeetCode GraphQL layer...";

      try {
        // --- THE GRAPHQL ENGINE ---
        // We query LeetCode's internal database directly, filtering by 'AC' (Accepted),
        // and demanding the exact 'topicTags' for every problem.
        const lcResponse = await fetch('https://leetcode.com/graphql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            query: `
              query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QFilter) {
                problemsetQuestionList: questionList(
                  categorySlug: $categorySlug
                  limit: $limit
                  skip: $skip
                  filters: $filters
                ) {
                  data {
                    title
                    titleSlug
                    topicTags { name }
                  }
                }
              }
            `,
            variables: {
              categorySlug: "",
              skip: 0,
              limit: 5000,
              filters: { status: "AC" }
            }
          })
        });

        if (lcResponse.status === 401 || lcResponse.status === 403) {
          throw new Error("LeetCode rejected the request. Open a LeetCode tab and log in.");
        }

        const lcData = await lcResponse.json();
        const problems = lcData.data?.problemsetQuestionList?.data;
        
        if (!problems || problems.length === 0) {
          throw new Error("No accepted problems found on this LeetCode profile.");
        }

        const currentTime = Math.floor(Date.now() / 1000);

        // Map the GraphQL response to our backend payload, extracting the exact first tag
        const acceptedSubs = problems.map(p => {
          const exactTopic = p.topicTags && p.topicTags.length > 0 ? p.topicTags[0].name : "General";
          return {
            title: p.title,
            titleSlug: p.titleSlug,
            timestamp: currentTime,
            topic: exactTopic 
          };
        });

        statusDiv.innerText = `Extracted ${acceptedSubs.length} perfectly tagged problems. Pushing to Render...`;

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
        
        if (result.imported_count === 0) {
            statusDiv.innerText = `Sync Complete! All ${acceptedSubs.length} problems are already in your database.`;
        } else {
            statusDiv.innerText = `Success! Imported ${result.imported_count} new perfectly tagged problems.`;
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