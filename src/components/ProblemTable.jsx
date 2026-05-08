import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";

function ProblemTable({ problems, onUpdate }) {
  const { token } = useContext(AuthContext);
  const [solvedIds, setSolvedIds] = useState(new Set());
  const [selectedTopic, setSelectedTopic] = useState("All");
  const [search, setSearch] = useState("");

  // ── 1. FETCH LIVE CHECKBOX STATE ──
  useEffect(() => {
    if (!token) return;
    fetch("http://127.0.0.1:8000/solutions", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setSolvedIds(new Set(data));
      })
      .catch((err) => console.error("Failed to fetch solutions:", err));
  }, [token]);

  const topics = ["All", ...new Set(problems.map((p) => p.topic || "General"))];

  const filtered = problems.filter((p) => {
    const topicMatch = selectedTopic === "All" || p.topic === selectedTopic || (!p.topic && selectedTopic === "General");
    const searchMatch = p.name.toLowerCase().includes(search.toLowerCase());
    return topicMatch && searchMatch;
  });

  // ── 2. SECURE DATABASE TOGGLE ──
  const toggleSolved = async (problem) => {
    const isSolved = solvedIds.has(problem.id);

    // Instant Optimistic UI Update
    const newIds = new Set(solvedIds);
    if (isSolved) newIds.delete(problem.id);
    else newIds.add(problem.id);
    setSolvedIds(newIds);

    try {
      const res = await fetch(`http://127.0.0.1:8000/solutions/${problem.id}`, {
        method: isSolved ? "DELETE" : "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Database update failed");

      // Database accepted the change. Tell App.jsx to fetch the new Dashboard charts.
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error(err);
      setSolvedIds(solvedIds); // Revert the UI if the backend failed
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
      <div className="flex flex-wrap items-center gap-2 mb-5">
        {topics.map((topic) => (
          <button
            key={topic}
            onClick={() => setSelectedTopic(topic)}
            className={`
              px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all duration-300
              ${selectedTopic === topic ? "bg-orange-500/20 text-orange-300 border-orange-400/30 shadow-[0_0_15px_rgba(251,146,60,0.15)]" : "bg-white/[0.03] text-slate-400 border-white/10 hover:bg-white/[0.06] hover:text-white"}
            `}
          >
            {topic}
          </button>
        ))}

        <input
          type="text"
          placeholder="Search problems..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="ml-auto px-4 py-2 rounded-xl text-xs bg-white/[0.04] border border-white/10 text-slate-300 placeholder-slate-500 focus:outline-none focus:border-indigo-400/40 focus:bg-white/[0.06] transition-all duration-300 backdrop-blur"
        />
      </div>

      <div className="rounded-3xl border border-white/10 overflow-hidden bg-white/[0.03] backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.25)]">
        <div className="grid grid-cols-[2rem_1fr_6rem_5rem_4rem_3rem] gap-2 px-4 py-3 bg-white/[0.04] border-b border-white/10">
          {["#", "Problem", "Topic", "Difficulty", "Link", "Done"].map((h) => (
            <span key={h} className="text-[11px] text-slate-400 uppercase tracking-wider">{h}</span>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="px-4 py-12 text-center text-slate-500 text-sm">No problems found.</div>
        ) : (
          filtered.map((problem, index) => {
            const solved = solvedIds.has(problem.id);

            return (
              <div
                key={problem.id}
                className={`grid grid-cols-[2rem_1fr_6rem_5rem_4rem_3rem] gap-2 px-4 py-3 items-center border-b border-white/5 last:border-b-0 transition-all duration-200 ${solved ? "opacity-40" : "hover:bg-white/[0.05] hover:scale-[1.005]"}`}
              >
                <span className="text-xs text-slate-500">{index + 1}</span>
                <span className={`text-sm ${solved ? "line-through text-slate-500" : "text-slate-100"}`}>{problem.name}</span>
                <span className="text-xs text-slate-400 capitalize">{problem.topic || "General"}</span>
                <span className={`text-xs font-semibold ${diffColor(problem.level)}`}>{problem.level}</span>
                <a href={problem.link} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-xs text-indigo-300 hover:text-indigo-200 hover:underline transition">LC →</a>
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

      <p className="text-xs text-slate-500 mt-4 text-right">
        {filtered.length} problems shown {selectedTopic !== "All" && ` in ${selectedTopic}`}
      </p>
    </div>
  );
}

export default ProblemTable;