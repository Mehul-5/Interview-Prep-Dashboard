import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../Context/AuthContext";
import SheetCard from "./SheetCard";
import ProblemTable from "./ProblemTable";
import Navbar from "./Navbar";

function SheetBrowser({ problems = [], onUpdate }) {
  const { token } = useContext(AuthContext);
  const [sheets, setSheets] = useState([]);
  const [selectedSheetName, setSelectedSheetName] = useState("");
  const [activeProblems, setActiveProblems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Fetch ALL sheets and their true totals dynamically
  useEffect(() => {
    if (!token) return;
    fetch("https://interview-prep-dashboard.onrender.com/sheets", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch sheets");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setSheets(data);
          // Auto-select the first sheet only on initial load
          if (data.length > 0 && !selectedSheetName) {
            setSelectedSheetName(data[0].name);
          }
        }
      })
      .catch((err) => console.error("API Error:", err));
  }, [token, problems]); 

  // 2. Fetch problems for the selected sheet (includes unticked custom problems)
  useEffect(() => {
    if (!selectedSheetName || !token) return;

    setIsLoading(true);
    fetch(`https://interview-prep-dashboard.onrender.com/problems/${encodeURIComponent(selectedSheetName)}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
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
  }, [selectedSheetName, token]);

  const getSolvedCount = (sheetId) => problems.filter((p) => p.fromSheet === sheetId).length;

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-[28rem] h-[28rem] bg-indigo-500/10 blur-3xl rounded-full" />
        <div className="absolute bottom-0 right-0 w-[24rem] h-[24rem] bg-cyan-400/10 blur-3xl rounded-full" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.08),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(34,211,238,0.08),_transparent_30%)]" />
      </div>

      <Navbar />

      <main className="relative z-10 flex-1 px-6 lg:px-10 py-10 max-w-7xl mx-auto w-full">
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <p className="text-xs tracking-[0.25em] text-orange-300 uppercase mb-2 font-semibold">DSA Tracker</p>
            <h1 className="text-3xl md:text-4xl font-bold text-white">Practice Sheets</h1>
            <p className="text-slate-400 text-sm mt-2">Pick a sheet and start solving</p>
          </div>
        </div>

        <div className="mb-8 rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.25)] p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400 mb-1">Current Focus</p>
              <h2 className="text-lg font-semibold text-white">{selectedSheetName || "Loading..."}</h2>
              <p className="text-sm text-slate-400 mt-1">{getSolvedCount(selectedSheetName)} of {activeProblems.length} solved</p>
            </div>
            <span className="w-fit text-xs px-4 py-2 rounded-full border bg-orange-500/10 text-orange-300 border-orange-400/20 shadow-[0_0_20px_rgba(251,146,60,0.08)]">
              {activeProblems.length > 0 ? Math.round((getSolvedCount(selectedSheetName) / activeProblems.length) * 100) : 0}% complete
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {sheets.map((sheet) => (
            <SheetCard
              key={sheet.name}
              sheet={{ name: sheet.name, totalProblems: sheet.totalProblems }} // Passes real database number
              solvedCount={getSolvedCount(sheet.name)}
              isSelected={selectedSheetName === sheet.name}
              onClick={() => setSelectedSheetName(sheet.name)}
            />
          ))}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div>
            <h2 className="text-xl font-semibold text-white">{selectedSheetName || "Loading..."}</h2>
            <p className="text-sm text-slate-400 mt-1">Explore problems and mark your progress sheet by sheet</p>
          </div>
          <span className="w-fit text-xs px-3.5 py-1.5 rounded-full border bg-white/[0.04] text-slate-300 border-white/10">
            Total Problems: {activeProblems.length}
          </span>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] overflow-hidden">
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
    </div>
  );
}

export default SheetBrowser;