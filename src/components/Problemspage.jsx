import { useState } from "react";
import Navbar from "./Navbar";
import TopicBubbles from "./TopicBubbles"; // Ensure this file exists in the same folder

function Problemspage({ problems = [] }) {
  // State to track which topic accordions are open
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

  // Sort topics alphabetically
  const topics = Object.keys(groupedProblems).sort();

  // Prepare data for the D3 physics bubble chart
  const chartData = topics.map(topic => ({
    topic,
    count: groupedProblems[topic].length
  }));

  const difficultyStyle = (level) => {
    if (level === "Easy") return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
    if (level === "Medium") return "text-amber-400 bg-amber-400/10 border-amber-400/20";
    if (level === "Hard") return "text-rose-400 bg-rose-400/10 border-rose-400/20";
    return "text-slate-400 bg-slate-400/10 border-slate-400/20";
  };

  const easyCount = problems.filter((p) => p.level === "Easy").length;
  const mediumCount = problems.filter((p) => p.level === "Medium").length;
  const hardCount = problems.filter((p) => p.level === "Hard").length;

  return (
    <div className="min-h-screen bg-[#020617] text-white relative overflow-hidden flex flex-col">
      {/* Background Glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-[28rem] h-[28rem] bg-indigo-500/10 blur-3xl rounded-full" />
        <div className="absolute bottom-0 right-0 w-[24rem] h-[24rem] bg-cyan-400/10 blur-3xl rounded-full" />
      </div>

      <Navbar />

      <main className="relative z-10 flex-1 px-6 lg:px-10 py-10 max-w-4xl mx-auto w-full">
        <div className="mb-8">
          <p className="text-xs tracking-[0.25em] text-orange-300 uppercase mb-2 font-semibold">DSA Tracker</p>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">Solved Problems</h1>
          
          {/* Stats Bar */}
          <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
            <span className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-slate-300">
              Total: <span className="text-white ml-1">{problems.length}</span>
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              Easy: <span className="text-white ml-1">{easyCount}</span>
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
              Medium: <span className="text-white ml-1">{mediumCount}</span>
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
              Hard: <span className="text-white ml-1">{hardCount}</span>
            </span>
          </div>
        </div>

        {/* 1. Dynamic Physics Bubble Chart Visualization */}
        {chartData.length > 0 && (
          <div className="mb-10 p-2 sm:p-8 rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.25)]">
            <h2 className="text-xs text-slate-400 uppercase tracking-wider mb-2 text-center">Interactive Topic Distribution</h2>
            <p className="text-xs text-slate-500 text-center mb-6">Drag and throw bubbles to interact. Click a bubble to view problems.</p>
            
            <TopicBubbles 
               data={chartData} 
               onTopicClick={(topic) => {
                 // When user clicks a bubble, open the accordion and scroll to it
                 setExpandedTopics(prev => ({ ...prev, [topic]: true }));
                 window.scrollBy({ top: 500, behavior: 'smooth' });
               }} 
            />
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
                  {/* Accordion Header */}
                  <button
                    onClick={() => toggleTopic(topic)}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.04] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {/* Dropdown Chevron */}
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

                  {/* Accordion Content */}
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
                              <a
                                href={p.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-400 hover:text-indigo-300 transition-colors p-1"
                                title="Open in LeetCode"
                              >
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