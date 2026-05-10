import { useState } from "react";

function LeetCodeConnector({ token, onSyncComplete }) {
  const [username, setUsername] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });

  const handleSync = async () => {
    if (!username.trim()) return;
    
    setIsSyncing(true);
    setStatus({ type: "loading", message: "Extracting data from LeetCode..." });

    try {
      const res = await fetch("https://interview-prep-dashboard.onrender.com/sync-leetcode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ leetcode_username: username.trim() })
      });

      if (!res.ok) {
        throw new Error("Failed to sync. Please verify your LeetCode username.");
      }
      
      const data = await res.json();
      setStatus({ 
        type: "success", 
        message: `Success! Imported ${data.imported_count} new problems.` 
      });
      
      // Fire the callback to tell App.jsx to re-fetch the user's progress
      if (onSyncComplete) {
        onSyncComplete();
      }
      
    } catch (err) {
      setStatus({ type: "error", message: err.message });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.25)] p-6 mb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-orange-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.541l11.967 11.608a1.353 1.353 0 0 0 .957.382l5.064-.002a1.332 1.332 0 0 0 .93-.383 1.309 1.309 0 0 0 .385-.929 1.307 1.307 0 0 0-.38-.934L11.516 17.51l8.508-8.232a1.328 1.328 0 0 0 .383-.934 1.314 1.314 0 0 0-.388-.935L13.483 0zm-1.895 2.138l5.228 5.594-8.847 8.558-4.992-4.839 8.611-9.313z"/>
            </svg>
            Connect LeetCode
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Enter your public LeetCode username to automatically import your solved problems.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
          <input 
            type="text" 
            placeholder="e.g. neetcode"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSync()}
            className="w-full sm:w-64 bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-colors placeholder:text-slate-600"
          />
          <button 
            onClick={handleSync}
            disabled={isSyncing || !username.trim()}
            className="whitespace-nowrap px-6 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:hover:bg-orange-500 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {isSyncing ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Syncing...
              </>
            ) : "Sync Now"}
          </button>
        </div>
      </div>
      
      {status.message && (
        <div className={`mt-4 px-4 py-3 rounded-lg text-sm font-medium border ${
          status.type === "error" ? "bg-rose-500/10 border-rose-500/20 text-rose-400" :
          status.type === "loading" ? "bg-blue-500/10 border-blue-500/20 text-blue-400" :
          "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
        }`}>
          {status.message}
        </div>
      )}
    </div>
  );
}

export default LeetCodeConnector;