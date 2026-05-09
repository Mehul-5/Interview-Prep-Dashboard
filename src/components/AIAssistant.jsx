import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";

function AIAssistant({ onUpdate }) {
  const { token } = useContext(AuthContext);
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("SDE 1");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!company) return alert("Enter a company name");
    setLoading(true);
    
    try {
      const res = await fetch("https://interview-prep-dashboard.onrender.com/generate-prep", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ company, role })
      });
      
      if (!res.ok) throw new Error("AI API Failed");
      const data = await res.json();
      setSuggestions(data);
    } catch (err) {
      alert("Failed to generate problems. Make sure your Gemini API Key is in the .env file.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToTracker = async (prob) => {
    try {
      const res = await fetch("https://interview-prep-dashboard.onrender.com/custom-problems", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: prob.title,
          difficulty: prob.difficulty,
          url: prob.url,
          topic: prob.topic,
          date: new Date().toISOString().slice(0, 10),
          note: `Targeted prep for ${company} - ${role}`
        })
      });

      if (res.ok) {
        setSuggestions(prev => prev.filter(p => p.title !== prob.title));
        if (onUpdate) onUpdate();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const diffColor = (level) => {
    if (level === "Easy") return "text-emerald-300 border-emerald-400/20 bg-emerald-500/10";
    if (level === "Medium") return "text-amber-300 border-amber-400/20 bg-amber-500/10";
    if (level === "Hard") return "text-rose-300 border-rose-400/20 bg-rose-500/10";
    return "text-slate-300";
  };

  return (
    <div className="w-full bg-white/[0.04] border border-indigo-500/30 backdrop-blur-xl rounded-3xl p-6 shadow-[0_8px_30px_rgba(99,102,241,0.1)] relative overflow-hidden">
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-500/20 blur-3xl rounded-full pointer-events-none"></div>

      <div className="flex items-center gap-3 mb-6 relative z-10">
        <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-base">✨</div>
        <div>
          <h2 className="text-base font-semibold text-white">AI Target Prep</h2>
          <p className="text-xs text-indigo-300 mt-0.5">Generate curated questions for specific companies</p>
        </div>
      </div>

      <form onSubmit={handleGenerate} className="flex flex-col sm:flex-row gap-3 mb-6 relative z-10">
        <input type="text" placeholder="Company (e.g. Amazon)" value={company} onChange={e => setCompany(e.target.value)} className="flex-1 px-4 py-2.5 rounded-xl text-sm bg-white/[0.06] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-all" />
        <input type="text" placeholder="Role (e.g. SDE 2)" value={role} onChange={e => setRole(e.target.value)} className="w-full sm:w-32 px-4 py-2.5 rounded-xl text-sm bg-white/[0.06] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-all" />
        <button type="submit" disabled={loading} className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all disabled:opacity-50 disabled:cursor-wait whitespace-nowrap shadow-[0_0_15px_rgba(79,70,229,0.4)]">
          {loading ? "Scanning..." : "Generate"}
        </button>
      </form>

      {suggestions.length > 0 && (
        <div className="space-y-3 relative z-10">
          <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3 border-b border-white/10 pb-2">AI Suggestions</h3>
          {suggestions.map((prob, i) => (
            <div key={i} className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all">
              <div>
                <p className="text-sm text-white font-medium">{prob.title}</p>
                <div className="flex gap-2 mt-1">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${diffColor(prob.difficulty)}`}>{prob.difficulty}</span>
                  <span className="text-[10px] text-slate-400 capitalize bg-white/[0.05] px-2 py-0.5 rounded-full">{prob.topic}</span>
                </div>
              </div>
              <button onClick={() => handleAddToTracker(prob)} className="text-xs font-semibold px-4 py-1.5 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20 transition-all">
                + Add
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AIAssistant;