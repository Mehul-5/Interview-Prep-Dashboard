import { useState, useContext } from "react";
import { AuthContext } from "../provider/AuthContext"; 

function AddProblemForm({ onUpdate }) {
  const { token } = useContext(AuthContext); 
  
  const [name,  setName]  = useState("");
  const [level, setLevel] = useState("Easy");
  const [date,  setDate]  = useState("");
  const [note,  setNote]  = useState("");
  const [topic, setTopic] = useState("arrays");
  const [url,   setUrl]   = useState(""); // <-- The URL field you requested
  const [loading, setLoading] = useState(false);

  const handlesubmit = async (e) => {
    e.preventDefault();

    if (!name || !level || !topic) {
      alert("Please fill out the Problem Name and Topic.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("https://interview-prep-dashboard.onrender.com/custom-problems", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, 
        },
        body: JSON.stringify({ 
          title: name, 
          difficulty: level, 
          url: url, // <-- Sending the URL
          topic: topic,
          date: date, 
          note: note  
        }),
      });

      if (res.ok) {
        setName("");
        setLevel("Easy");
        setDate("");
        setNote("");
        setTopic("arrays");
        setUrl("");
        
        // Trigger the global update wire to refresh the charts
        if (onUpdate) onUpdate();
      } else {
        const errorData = await res.json();
        alert("BACKEND REJECTED IT: " + JSON.stringify(errorData));
      }
    } catch (err) {
      alert("CRITICAL NETWORK ERROR: Is the Python backend running?");
    } finally {
      setLoading(false);
    }
  };

  const topics = [
    { value: "complexity",           label: "Time & Space Complexity"   },
    { value: "arrays",               label: "Arrays"                    },
    { value: "strings",              label: "Strings"                   },
    { value: "recursion",            label: "Recursion"                 },
    { value: "backtracking",         label: "Backtracking"              },
    { value: "bit-manipulation",     label: "Bit Manipulation"          },
    { value: "linked-list",          label: "Linked List"               },
    { value: "stack",                label: "Stack"                     },
    { value: "queue",                label: "Queue"                     },
    { value: "hashing",              label: "Hashing"                   },
    { value: "sorting",              label: "Sorting Algorithms"        },
    { value: "searching",            label: "Searching (Binary Search)" },
    { value: "trees",                label: "Binary Trees"              },
    { value: "bst",                  label: "Binary Search Trees"       },
    { value: "heaps",                label: "Heaps / Priority Queue"    },
    { value: "graphs",               label: "Graphs"                    },
    { value: "greedy",               label: "Greedy Algorithms"         },
    { value: "dynamic-programming",  label: "Dynamic Programming"       },
    { value: "trie",                 label: "Trie"                      },
    { value: "dsu",                  label: "Disjoint Set Union"        },
    { value: "segment-tree",         label: "Segment Tree"              },
    { value: "sliding-window",       label: "Sliding Window"            },
    { value: "two-pointers",         label: "Two Pointers"              },
  ];

  const difficultyConfig = {
    Easy:   { active: "bg-green-500/20 text-green-400 border-green-500/40",   inactive: "text-slate-500 border-white/10 hover:border-white/20" },
    Medium: { active: "bg-amber-500/20  text-amber-400  border-amber-500/40", inactive: "text-slate-500 border-white/10 hover:border-white/20" },
    Hard:   { active: "bg-red-500/20   text-red-400   border-red-500/40",     inactive: "text-slate-500 border-white/10 hover:border-white/20" },
  };

  const inputCls = `
    w-full px-4 py-2.5 rounded-xl text-sm text-gray-100
    bg-white/[0.06] border border-white/10
    placeholder-gray-600
    focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/30
    transition duration-150
  `;

  return (
    <div className="w-full bg-white/[0.04] border border-white/10 backdrop-blur-xl rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.25)]">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-base">
          ➕
        </div>
        <div>
          <h2 className="text-base font-semibold text-white">Add a Problem</h2>
          <p className="text-xs text-slate-400 mt-0.5">Log a custom problem to your tracker</p>
        </div>
      </div>

      <form onSubmit={handlesubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
            Problem Name <span className="text-red-400">*</span>
          </label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Two Sum..." className={inputCls} />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
            Difficulty <span className="text-red-400">*</span>
          </label>
          <div className="flex gap-2">
            {["Easy", "Medium", "Hard"].map((lvl) => (
              <button key={lvl} type="button" onClick={() => setLevel(lvl)} className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all duration-150 active:scale-95 ${level === lvl ? difficultyConfig[lvl].active : difficultyConfig[lvl].inactive}`}>
                {lvl}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
              Date <span className="text-red-400">*</span>
            </label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Topic</label>
            <select value={topic} onChange={(e) => setTopic(e.target.value)} className={inputCls}>
              {topics.map((t) => (
                <option key={t.value} value={t.value} className="bg-slate-900 text-gray-100">{t.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
            Problem Link <span className="text-slate-600 normal-case ml-1">(optional)</span>
          </label>
          <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://leetcode.com/..." className={inputCls} />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
            Note <span className="text-slate-600 normal-case ml-1">(optional)</span>
          </label>
          <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Key insight, approach used, time taken..." className={inputCls} />
        </div>

        <button type="submit" disabled={loading} className="w-full py-3 rounded-2xl text-sm font-semibold bg-orange-500 hover:bg-orange-400 text-white transition-all duration-150 active:scale-[0.98] shadow-[0_0_20px_rgba(249,115,22,0.25)] mt-2 disabled:opacity-50">
          {loading ? "Saving..." : "Add Problem →"}
        </button>
      </form>
    </div>
  );
}

export default AddProblemForm;