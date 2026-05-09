import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../provider/AuthContext";

function ProblemTable({ problems, onUpdate }) {
  const { token } = useContext(AuthContext);
  const [solvedIds, setSolvedIds] = useState(new Set());
  const [selectedTopic, setSelectedTopic] = useState("All");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!token) return;
    fetch("https://interview-prep-dashboard.onrender.com/solutions", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setSolvedIds(new Set(data));
      })
      .catch((err) => console.error("Failed to fetch solutions:", err));
  }, [token]);

  // FIX 1: Filter out "General" and null/undefined topics from the buttons
  const topics = ["All", ...new Set(problems.map((p) => p.topic).filter(t => t && t !== "General"))];

  const filtered = problems.filter((p) => {
    // If the selected topic is "All", show everything. Otherwise, require an exact match.
    const topicMatch = selectedTopic === "All" || p.topic === selectedTopic;
    const searchMatch = p.name.toLowerCase().includes(search.toLowerCase());
    return topicMatch && searchMatch;
  });

  const toggleSolved = async (problem) => {
    const strId = String(problem.id);
    const isCustom = strId.startsWith("custom-");
    const isSolved = solvedIds.has(strId);

    // Instant UI Response
    const newIds = new Set(solvedIds);
    if (isSolved) newIds.delete(strId);
    else newIds.add(strId);
    setSolvedIds(newIds);

    try {
      let res;
      if (isCustom) {
        const cpId = strId.split("-")[1];
        res = await fetch(`https://interview-prep-dashboard.onrender.com/custom-problems/${cpId}/toggle`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        res = await fetch(`https://interview-prep-dashboard.onrender.com/solutions/${strId}`, {
          method: isSolved ? "DELETE" : "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      if (!res.ok) throw new Error("Database update failed");
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error(err);
      setSolvedIds(solvedIds); // Revert if failed
    }
  };

  const diffColor = (level) => {
    if (level === "Easy") return "text-emerald-300";
    if (level === "Medium") return "text-amber-300";
    if (level === "Hard") return "text-rose-300";
    return "text-slate-400";
  };

  return (
    <div>
      {/* Mobile-friendly flex container for filters */}
      <div className="flex flex-wrap items-center gap-2 mb-5 px-4 pt-4">
        {topics.map((topic) => (
          <button
            key={topic}
            onClick={() => setSelectedTopic(topic)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all duration-300 whitespace-nowrap ${selectedTopic === topic ? "bg-orange-500/20 text-orange-300 border-orange-400/30 shadow-[0_0_15px_rgba(251,146,60,0.15)]" : "bg-white/[0.03] text-slate-400 border-white/10 hover:bg-white/[0.06] hover:text-white"}`}
          >
            {topic}
          </button>
        ))}

        <input 
          type="text" 
          placeholder="Search problems..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          className="flex-1 min-w-[200px] sm:ml-auto px-4 py-2 rounded-xl text-xs bg-white/[0.04] border border-white/10 text-slate-300 placeholder-slate-500 focus:outline-none focus:border-indigo-400/40 focus:bg-white/[0.06] transition-all duration-300 backdrop-blur" 
        />
      </div>

      <div className="rounded-3xl border border-white/10 overflow-hidden bg-white/[0.03] backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.25)]">
        
        {/* FIX 2: overflow-x-auto allows horizontal scrolling on mobile */}
        <div className="w-full overflow-x-auto">
          
          {/* FIX 3: min-w-[650px] prevents the columns from crushing into each other */}
          <div className="min-w-[650px]">
            <div className="grid grid-cols-[2rem_1fr_6rem_5rem_4rem_3rem] gap-2 px-4 py-3 bg-white/[0.04] border-b border-white/10">
              {["#", "Problem", "Topic", "Difficulty", "Link", "Done"].map((h) => (
                <span key={h} className="text-[11px] text-slate-400 uppercase tracking-wider">{h}</span>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div className="px-4 py-12 text-center text-slate-500 text-sm">No problems found.</div>
            ) : (
              filtered.map((problem, index) => {
                const solved = solvedIds.has(String(problem.id));

                return (
                  <div key={problem.id} className={`grid grid-cols-[2rem_1fr_6rem_5rem_4rem_3rem] gap-2 px-4 py-3 items-center border-b border-white/5 last:border-b-0 transition-all duration-200 ${solved ? "opacity-40" : "hover:bg-white/[0.05] hover:scale-[1.005]"}`}>
                    <span className="text-xs text-slate-500">{index + 1}</span>
                    <span className={`text-sm ${solved ? "line-through text-slate-500" : "text-slate-100"}`}>{problem.name}</span>
                    <span className="text-xs text-slate-400 capitalize">{problem.topic || "General"}</span>
                    <span className={`text-xs font-semibold ${diffColor(problem.level)}`}>{problem.level}</span>
                    {problem.link ? (
                      <a href={problem.link} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-xs text-indigo-300 hover:text-indigo-200 hover:underline transition">LC →</a>
                    ) : (
                      <span className="text-xs text-slate-600">-</span>
                    )}
                    <button onClick={() => toggleSolved(problem)} className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all duration-300 mx-auto ${solved ? "bg-emerald-500 border-emerald-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]" : "border-slate-500 hover:border-emerald-400 hover:scale-110"}`}>
                      {solved && (
                        <svg className="w-3 h-3 text-white" viewBox="0 0 10 10" fill="none">
                          <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default ProblemTable;