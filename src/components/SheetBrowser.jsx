import { useState, useEffect } from "react";
import SheetCard from "./SheetCard";
import ProblemTable from "./ProblemTable";
import Navbar from "./Navbar";

function SheetBrowser({ problems = [], onUpdate }) {
  // ── API STATE ────────────────────────────────────────────────────────
  const [sheetNames, setSheetNames] = useState([]);
  const [selectedSheetName, setSelectedSheetName] = useState("");
  const [activeProblems, setActiveProblems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // <--- ADD THIS LINE

  // ── FETCH SHEETS ON LOAD ─────────────────────────────────────────────
  useEffect(() => {
    fetch("http://127.0.0.1:8000/sheets")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch sheets");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setSheetNames(data);
          if (data.length > 0) {
            setSelectedSheetName(data[0]); 
          } else {
            setIsLoading(false);
          }
        }
      })
      .catch((err) => {
        console.error("API Error:", err);
        setIsLoading(false);
      });
  }, []);

  // ── FETCH PROBLEMS WHEN SHEET CHANGES ────────────────────────────────
  useEffect(() => {
    if (!selectedSheetName) return;

    setIsLoading(true);
    fetch(`http://127.0.0.1:8000/problems/${encodeURIComponent(selectedSheetName)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Sheet empty or not found");
        return res.json();
      })
      .then((data) => {
        setActiveProblems(Array.isArray(data) ? data : []);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("API Error:", err);
        setActiveProblems([]); 
        setIsLoading(false);
      });
  }, [selectedSheetName]);

  // ── MODAL & FORM STATE ────────────────────────────────────────────────────
  const [showModal, setShowModal] = useState(false);
  const [formName, setFormName] = useState("");
  const [formLevel, setFormLevel] = useState("Easy");
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [formNote, setFormNote] = useState("");
  const [formTopic, setFormTopic] = useState("arrays");
  const [formSource, setFormSource] = useState("contest");
  const [formPlatform, setFormPlatform] = useState("Codeforces");
  const [formLink, setFormLink] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  // ── LOCALSTORAGE HELPERS (BULLETPROOFED) ──────────────────────────────────
  const getSaved = () => {
    try {
      const data = JSON.parse(localStorage.getItem("problems"));
      // Force it to be an array and strip out any null/corrupted objects
      return Array.isArray(data) ? data.filter(p => p && typeof p === 'object') : [];
    } catch (e) {
      // If the data is corrupted, burn it down and start fresh
      localStorage.removeItem("problems");
      return [];
    }
  };

  const getSolvedCount = (sheetId) => problems.filter((p) => p.fromSheet === sheetId).length;

  // ── SUBMIT HANDLER ────────────────────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formName || !formDate) {
      alert("Problem name and date are required.");
      return;
    }

    const saved = getSaved();
    const newProblem = {
      id: Date.now(),
      name: formName.trim(),
      level: formLevel,
      date: formDate,
      note: formNote.trim(),
      topic: formTopic,
      fromSheet: null,
      source: formSource,
      platform: formPlatform,
      link: formLink.trim(),
    };

    localStorage.setItem("problems", JSON.stringify([...saved, newProblem]));
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setShowModal(false);
      resetForm();
    }, 1200);
  };

  const resetForm = () => {
    setFormName("");
    setFormLevel("Easy");
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormNote("");
    setFormTopic("arrays");
    setFormSource("contest");
    setFormPlatform("Codeforces");
    setFormLink("");
  };

  // ── FORM CONSTANTS ─────────────────────────────────────────────────────────
  const topics = [
    { value: "complexity", label: "Time & Space Complexity" },
    { value: "arrays", label: "Arrays" },
    { value: "strings", label: "Strings" },
    { value: "recursion", label: "Recursion" },
    { value: "backtracking", label: "Backtracking" },
    { value: "bit-manipulation", label: "Bit Manipulation" },
    { value: "linked-list", label: "Linked List" },
    { value: "stack", label: "Stack" },
    { value: "queue", label: "Queue" },
    { value: "hashing", label: "Hashing" },
    { value: "sorting", label: "Sorting Algorithms" },
    { value: "searching", label: "Searching (Binary Search)" },
    { value: "trees", label: "Binary Trees" },
    { value: "bst", label: "Binary Search Trees" },
    { value: "heaps", label: "Heaps / Priority Queue" },
    { value: "graphs", label: "Graphs" },
    { value: "greedy", label: "Greedy Algorithms" },
    { value: "dynamic-programming", label: "Dynamic Programming" },
    { value: "trie", label: "Trie" },
    { value: "dsu", label: "Disjoint Set Union" },
    { value: "segment-tree", label: "Segment Tree" },
    { value: "sliding-window", label: "Sliding Window" },
    { value: "two-pointers", label: "Two Pointers" },
  ];

  const platforms = [
    "Codeforces", "LeetCode", "CodeChef", "AtCoder", "HackerRank", 
    "GeeksForGeeks", "InterviewBit", "Other"
  ];

  const inputCls = `
    w-full px-4 py-2.5 rounded-xl text-sm text-gray-100
    bg-white/[0.06] border border-white/10
    placeholder-gray-600
    focus:outline-none focus:ring-2 focus:ring-orange-500/40
    focus:border-orange-500/30 transition duration-150
  `;

  const diffStyle = {
    Easy: { on: "bg-green-500/20 text-green-400 border-green-500/40", off: "text-gray-500 border-white/10 hover:border-white/20" },
    Medium: { on: "bg-amber-500/20 text-amber-400 border-amber-500/40", off: "text-gray-500 border-white/10 hover:border-white/20" },
    Hard: { on: "bg-red-500/20 text-red-400 border-red-500/40", off: "text-gray-500 border-white/10 hover:border-white/20" },
  };

  // ── RENDER UI ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col relative overflow-hidden">
      {/* ── BACKGROUND GLOW ───────────────────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-[28rem] h-[28rem] bg-indigo-500/10 blur-3xl rounded-full" />
        <div className="absolute bottom-0 right-0 w-[24rem] h-[24rem] bg-cyan-400/10 blur-3xl rounded-full" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.08),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(34,211,238,0.08),_transparent_30%)]" />
      </div>

      <Navbar />

      <main className="relative z-10 flex-1 px-6 lg:px-10 py-10 max-w-7xl mx-auto w-full">
        {/* ── PAGE HEADER ─────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <p className="text-xs tracking-[0.25em] text-orange-300 uppercase mb-2 font-semibold">
              DSA Tracker
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              Practice Sheets
            </h1>
            <p className="text-slate-400 text-sm mt-2">
              Pick a sheet and start solving
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm
                       font-semibold bg-orange-500 hover:bg-orange-400 text-white
                       transition-all duration-150 active:scale-95 shrink-0
                       shadow-[0_0_20px_rgba(249,115,22,0.3)]"
          >
            <span className="text-base">+</span>
            Log Problem
          </button>
        </div>

        {/* ── CURRENT FOCUS STRIP ──────────────────────────────────────────── */}
        <div className="mb-8 rounded-3xl border border-white/10 bg-white/[0.04]
                        backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.25)] p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400 mb-1">
                Current Focus
              </p>
              <h2 className="text-lg font-semibold text-white">
                {selectedSheetName || "Loading..."}
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                {getSolvedCount(selectedSheetName)} of {activeProblems.length} solved
              </p>
            </div>

            <span className="w-fit text-xs px-4 py-2 rounded-full border
                             bg-orange-500/10 text-orange-300 border-orange-400/20
                             shadow-[0_0_20px_rgba(251,146,60,0.08)]">
              {activeProblems.length > 0 ? Math.round(
                (getSolvedCount(selectedSheetName) / activeProblems.length) * 100
              ) : 0}
              % complete
            </span>
          </div>
        </div>

        {/* ── SHEET CARDS ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {sheetNames.map((name) => (
            <SheetCard
              key={name}
              sheet={{ name: name, totalProblems: "Live" }}
              solvedCount={getSolvedCount(name)}
              isSelected={selectedSheetName === name}
              onClick={() => setSelectedSheetName(name)}
            />
          ))}
        </div>

        {/* ── ACTIVE SHEET HEADER ───────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div>
            <h2 className="text-xl font-semibold text-white">
              {selectedSheetName || "Loading..."}
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Explore problems and mark your progress sheet by sheet
            </p>
          </div>

          <span className="w-fit text-xs px-3.5 py-1.5 rounded-full border
                           bg-white/[0.04] text-slate-300 border-white/10">
            Total Problems: {activeProblems.length}
          </span>
        </div>

        {/* ── PROBLEM TABLE ─────────────────────────────────────────────────── */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] ...">
          {isLoading ? (
            <div className="text-center py-10 text-slate-400 animate-pulse">Loading database...</div>
          ) : (
            <ProblemTable
              onUpdate={onUpdate} 
              problems={activeProblems.map((p) => ({
                id: p.id,
                name: p.title,       
                level: p.difficulty, 
                link: p.url,         
                fromSheet: selectedSheetName,
              }))}
            />
          )}
        </div>
      </main>

      {/* ── LOG PROBLEM MODAL ─────────────────────────────────────────────── */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center
                     bg-black/70 backdrop-blur-sm px-4"
          onClick={() => {
            setShowModal(false);
            resetForm();
          }}
        >
          <div
            className="relative w-full max-w-lg bg-[#0f172a] border border-white/10
                       rounded-3xl shadow-[0_24px_60px_rgba(0,0,0,0.6)]
                       max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── MODAL HEADER ──────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/10">
              <div>
                <h2 className="text-base font-semibold text-white">
                  Log a Problem
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Manually add a problem to your tracker
                </p>
              </div>

              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="w-8 h-8 flex items-center justify-center
                           rounded-full bg-white/[0.06] hover:bg-white/10
                           text-slate-400 hover:text-white transition-all text-lg"
              >
                ✕
              </button>
            </div>

            {/* ── FORM ──────────────────────────────────────────────────── */}
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl
                              bg-orange-500/10 border border-orange-500/20">
                <span className="text-orange-400 text-xs">📌</span>
                <span className="text-xs text-orange-300">
                  This problem will be added to your tracker only
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                  Problem Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Longest Substring Without Repeating"
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                  Difficulty
                </label>
                <div className="flex gap-2">
                  {["Easy", "Medium", "Hard"].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setFormLevel(lvl)}
                      className={`flex-1 py-2 rounded-xl text-xs font-medium border
                                  transition-all duration-150 active:scale-95
                                  ${
                                    formLevel === lvl
                                      ? diffStyle[lvl].on
                                      : diffStyle[lvl].off
                                  }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                    Source
                  </label>
                  <select
                    value={formSource}
                    onChange={(e) => setFormSource(e.target.value)}
                    className={inputCls}
                  >
                    <option value="contest">Contest</option>
                    <option value="practice">Practice</option>
                    <option value="interview">Mock Interview</option>
                    <option value="daily">Daily Challenge</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                    Platform
                  </label>
                  <select
                    value={formPlatform}
                    onChange={(e) => setFormPlatform(e.target.value)}
                    className={inputCls}
                  >
                    {platforms.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                    Date <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                    Topic
                  </label>
                  <select
                    value={formTopic}
                    onChange={(e) => setFormTopic(e.target.value)}
                    className={inputCls}
                  >
                    {topics.map((t) => (
                      <option
                        key={t.value}
                        value={t.value}
                        className="bg-slate-900"
                      >
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                  Problem Link
                  <span className="text-slate-600 normal-case ml-1">
                    (optional)
                  </span>
                </label>
                <input
                  type="url"
                  value={formLink}
                  onChange={(e) => setFormLink(e.target.value)}
                  placeholder="https://codeforces.com/..."
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                  Note
                  <span className="text-slate-600 normal-case ml-1">
                    (optional)
                  </span>
                </label>
                <input
                  type="text"
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  placeholder="Approach used, key insight, time taken..."
                  className={inputCls}
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl text-sm font-semibold
                           bg-orange-500 hover:bg-orange-400 text-white
                           transition-all duration-150 active:scale-[0.98]
                           shadow-[0_0_20px_rgba(249,115,22,0.25)]"
              >
                {showSuccess ? "Added! ✓" : "Log Problem →"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SheetBrowser;