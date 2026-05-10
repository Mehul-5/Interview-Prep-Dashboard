import { useState } from "react";
import Navbar from "./Navbar";

function Problemspage({ problems = [] }) {
  const [expandedTopics, setExpandedTopics] = useState({});

  const toggleTopic = (topic) => {
    setExpandedTopics((prev) => ({
      ...prev,
      [topic]: !prev[topic],
    }));
  };

  // Group problems by topic dynamically
  const groupedProblems = problems.reduce((acc, problem) => {
    const topic = problem.topic || "General";
    if (!acc[topic]) acc[topic] = [];
    acc[topic].push(problem);
    return acc;
  }, {});

  const topics = Object.keys(groupedProblems).sort();

  // Calculate bubble chart math
  const chartData = topics.map(topic => ({
    topic,
    count: groupedProblems[topic].length
  }));
  const maxCount = Math.max(...chartData.map(d => d.count), 1); // Avoid division by zero

  const difficultyStyle = (level) => {
    if (level === "Easy") return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
    if (level === "Medium") return "text-amber-400 bg-amber-400/10 border-amber-400/20";
    if (level === "Hard") return "text-rose-400 bg-rose-400/10 border-rose-400/20";
    return "text-slate-400 bg-slate-400/10 border-slate-400/20";
  };

  // Beautiful glowing colors for the bubbles
  const bubbleColors = [
    "bg-indigo-500/10 border-indigo-400/30 text-indigo-300 shadow-[0_0_20px_rgba(99,102,241,0.15)]",
    "bg-emerald-500/10 border-emerald-400/30 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.15)]",
    "bg-rose-500/10 border-rose-400/30 text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.15)]",
    "bg-amber-500/10 border-amber-400/30 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.15)]",
    "bg-cyan-500/10 border-cyan-400/30 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.15)]",
    "bg-fuchsia-500/10 border-fuchsia-400/30 text-fuchsia-300 shadow-[0_0_20px_rgba(217,70,239,0.15)]"
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-white relative overflow-hidden flex flex-col">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-[28rem] h-[28rem] bg-indigo-500/10 blur-3xl rounded-full" />
        <div className="absolute bottom-0 right-0 w-[24rem] h-[24rem] bg-cyan-400/10 blur-3xl rounded-full" />
      </div>

      <Navbar />

      <main className="relative z-10 flex-1 px-6 lg:px-10 py-10 max-w-4xl mx-auto w-full">
        <div className="mb-8">
          <p className="text-xs tracking-[0.25em] text-orange-300 uppercase mb-2 font-semibold">DSA Tracker</p>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">Solved Problems</h1>
        </div>

        {/* 1. Dynamic Bubble Chart Visualization */}
        {chartData.length > 0 && (
          <div className="mb-10 p-8 rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.25)]">
            <h2 className="text-xs text-slate-400 uppercase tracking-wider mb-8 text-center">Topic Distribution</h2>
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
              {chartData.map((data, i) => {
                // Math: Scale bubble size smoothly based on relative count
                const ratio = data.count / maxCount;
                const size = 80 + (ratio * 80); // Sizes between 80px and 160px
                const colorClass = bubbleColors[i % bubbleColors.length];

                return (
                  <div 
                    key={data.topic} 
                    style={{ width: `${size}px`, height: `${size}px` }}
                    className={`flex flex-col items-center justify-center rounded-full border transition-all duration-300 hover:scale-110 cursor-pointer ${colorClass} p-3 text-center`}
                    onClick={() => {
                      // Clicking a bubble automatically opens its accordion below
                      setExpandedTopics(prev => ({ ...prev, [data.topic]: true }));
                      // Smooth scroll down to the accordion
                      window.scrollBy({ top: 300, behavior: 'smooth' });
                    }}
                    title={`${data.topic}: ${data.count} problems`}
                  >
                    <span className="font-bold text-xl sm:text-2xl mb-0.5">{data.count}</span>
                    <span className="text-[10px] sm:text-xs leading-tight opacity-90 truncate w-full px-1">{data.topic}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. LeetCode Style Accordion Container */}
        <div className="flex flex-col gap-3">
          {topics.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border border-white/10 bg-white/[0.02]">
              <span className="text-4xl block mb-3">📭</span>
              <p className="text-slate-400">No problems solved yet.</p>
            </div>
          ) : (
            topics.map((topic) => {
              const topicProblems = groupedProblems[topic];
              const isExpanded = expandedTopics[topic];

              return (
                <div key={topic} className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden backdrop-blur-md transition-all duration-300">
                  <button
                    onClick={() => toggleTopic(topic)}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.04] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <svg
                        className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                      <span className="font-semibold text-slate-200 capitalize tracking-wide">{topic}</span>
                    </div>
                    
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-white/[0.06] text-slate-300 border border-white/10">
                      {topicProblems.length}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-white/5 bg-black/20">
                      {topicProblems.map((p, index) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between px-5 py-3 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors"
                        >
                          <div className="flex items-center gap-4 overflow-hidden">
                            <span className="text-xs text-slate-500 font-mono w-6">{index + 1}</span>
                            <span className="text-sm font-medium text-slate-300 truncate">{p.name}</span>
                          </div>

                          <div className="flex items-center gap-4 shrink-0">
                            <span className="hidden sm:block text-xs text-slate-500">
                              {new Date(p.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </span>
                            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${difficultyStyle(p.level)}`}>
                              {p.level}
                            </span>
                            {p.url && (
                              <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 transition-colors p-1">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}

export default Problemspage;