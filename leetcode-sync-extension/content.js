// content.js - Runs in the context of your React web app

// 1. Listen for messages broadcasted by the React app
window.addEventListener("message", (event) => {
  // Security check: Ensure the message came from the same window
  if (event.source !== window) return;

  // 2. Identify the specific sync message
  if (event.data && event.data.type === "DSA_TRACKER_AUTH_SYNC") {
    const token = event.data.token;
    
    // 3. Save the token into the Extension's isolated local storage
    chrome.storage.local.set({ dsaToken: token }, () => {
      console.log("DSA Tracker Extension: Successfully captured auth token.");
    });
  }
});

// Edge Case: If the user is already logged in when they install the extension, 
// the login broadcast won't fire. We can politely ask the webpage for it.
// (You can implement a ping-pong pattern for this if needed).