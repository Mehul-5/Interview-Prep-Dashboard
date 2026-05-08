import Navbar from "./Navbar";
import { useNavigate } from "react-router-dom";

function Dashboard({ problems = [], setProblems }) {
  const navigate = useNavigate();
  const sheets = [];

  // ── HARD PROBLEMS ─────────────────────────────────────────────────────────
  const hardproblems = problems.filter((problem) => {
    return problem.level === "Hard";
  });

  // ── WEEKLY PROBLEMS ───────────────────────────────────────────────────────
  const today = new Date();
  const oneWeekAgo = new Date();

  today.setHours(0, 0, 0, 0);
  oneWeekAgo.setHours(0, 0, 0, 0);
  oneWeekAgo.setDate(today.getDate() - 6);

  const weeklyproblems = problems.filter((problem) => {
    const problemdate = new Date(problem.date);
    problemdate.setHours(0, 0, 0, 0);
    return problemdate >= oneWeekAgo && problemdate <= today;
  });

  // ── STREAK CALCULATION ────────────────────────────────────────────────────
  const solveddates = problems.map((problem) => {
    const d = new Date(problem.date);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  });

  const set = new Set(solveddates);
  const uniquedates = [...set];

  let streak = 0;
  let currentdate = new Date();
  currentdate.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const yesterdaysolved = uniquedates.includes(yesterday.getTime());
  const todaysolved = uniquedates.includes(today.getTime());

  if (todaysolved) {
    while (uniquedates.includes(currentdate.getTime())) {
      streak++;
      currentdate.setDate(currentdate.getDate() - 1);
    }
  } else if (yesterdaysolved) {
    currentdate = new Date(yesterday);
    while (uniquedates.includes(currentdate.getTime())) {
      streak++;
      currentdate.setDate(currentdate.getDate() - 1);
    }
  } else {
    streak = 0;
  }

  // ── STAT CARD CONFIG ──────────────────────────────────────────────────────
  const statCards = [
    {
      title: "Total Problems",
      value: problems.length,
      icon: "📘",
      accent: "blue",
      route: "/problems",
    },
    {
      title: "Last 7 Days",
      value: weeklyproblems.length,
      icon: "📅",
      accent: "orange",
      route: "/weekly",
    },
    {
      title: "Current Streak",
      value: `${streak} days`,
      icon: streak > 0 ? "🔥" : "💤",
      accent: "amber",
      route: "/streak",
    },
    {
      title: "Hard Problems",
      value: hardproblems.length,
      icon: "💪",
      accent: "red",
      route: "/hard",
    },
  ];

  // sheet progress — count how many problems solved per sheet
  const sheetProgress = sheets.map((sheet) => {
    const solved = problems.filter((p) => p.fromSheet === sheet.id).length;
    return { ...sheet, solved };
  });

  // recent activity — last 5 problems solved, newest first
  const recentProblems = [...problems]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  // Accent color map → Tailwind classes per card
  const accentClasses = {
    blue: {
      border: "hover:border-blue-500/70",
      icon: "bg-blue-500/10 border-blue-400/20 text-blue-300",
      text: "text-blue-300",
      glow: "group-hover:shadow-blue-500/10",
    },
    orange: {
      border: "hover:border-orange-500/70",
      icon: "bg-orange-500/10 border-orange-400/20 text-orange-300",
      text: "text-orange-300",
      glow: "group-hover:shadow-orange-500/10",
    },
    amber: {
      border: "hover:border-yellow-500/70",
      icon: "bg-yellow-500/10 border-yellow-400/20 text-yellow-300",
      text: "text-yellow-300",
      glow: "group-hover:shadow-yellow-500/10",
    },
    red: {
      border: "hover:border-red-500/70",
      icon: "bg-red-500/10 border-red-400/20 text-red-300",
      text: "text-red-300",
      glow: "group-hover:shadow-red-500/10",
    },
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col relative overflow-hidden">
      {/* background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-[28rem] h-[28rem] bg-indigo-500/10 blur-3xl rounded-full" />
        <div className="absolute bottom-0 right-0 w-[24rem] h-[24rem] bg-cyan-400/10 blur-3xl rounded-full" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.08),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(34,211,238,0.08),_transparent_30%)]" />
      </div>

      <Navbar />

      <main className="relative z-10 flex-1 px-6 lg:px-10 py-10 max-w-7xl mx-auto w-full">
        {/* ── PAGE HEADER ─────────────────────────────────────────────── */}
        <div className="mb-10">
          <p className="text-xs tracking-[0.25em] text-indigo-300 uppercase mb-2 font-semibold">
            DSA Tracker
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            Dashboard
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        {/* ── STAT CARDS ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          {statCards.map(({ title, value, icon, accent, route }) => {
            const cls = accentClasses[accent];
            return (
              <div
                key={title}
            
                className={`
                  rounded-2xl p-5
                  flex items-center justify-between
                  border border-white/10
                  bg-white/[0.04]
                  backdrop-blur-xl
                  shadow-[0_8px_30px_rgba(0,0,0,0.25)]
                  transition-all duration-300
                  
                `}
              >
                <div>
                  <p className="text-[11px] text-slate-400 uppercase tracking-[0.18em] mb-2">
                    {title}
                  </p>
                  <p className={`text-4xl font-bold ${cls.text}`}>
                    {value}
                  </p>
                  <p className="text-xs text-slate-400 mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
           
                  </p>
                </div>

                <div
                  className={`
                    w-14 h-14 rounded-2xl border flex items-center
                    justify-center text-2xl shrink-0
                    shadow-inner
                    ${cls.icon}
                  `}
                >
                  {icon}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── BOTTOM SECTION ───────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sheet Progress */}
          <div className="rounded-3xl p-6 border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.25)]">
            <h2 className="text-base font-semibold text-white mb-1">
              Sheet progress
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              Your progress across all sheets
            </p>

            <div className="flex flex-col gap-5">
              {sheetProgress.map((sheet) => {
                const pct = Math.round((sheet.solved / sheet.totalProblems) * 100);
                return (
                  <div key={sheet.id}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-slate-200">
                        {sheet.name}
                      </span>
                      <span className="text-xs text-slate-400">
                        {sheet.solved} / {sheet.totalProblems}
                      </span>
                    </div>

                    <div className="w-full h-2.5 bg-slate-800/80 rounded-full overflow-hidden">
                      <div
                        className="h-2.5 rounded-full transition-all duration-500 shadow-[0_0_18px_rgba(255,255,255,0.08)]"
                        style={{
                          width: `${pct}%`,
                          background: `linear-gradient(90deg, ${sheet.color}, #a78bfa)`,
                        }}
                      />
                    </div>

                    <p className="text-xs text-slate-400 mt-2">{pct}% complete</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="rounded-3xl p-6 border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.25)]">
            <h2 className="text-base font-semibold text-white mb-1">
              Recent activity
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              Last {recentProblems.length} problems solved
            </p>

            {recentProblems.length === 0 ? (
              <div className="flex items-center justify-center h-32 rounded-2xl border border-dashed border-white/10 bg-white/[0.02]">
                <p className="text-sm text-slate-400">
                  No problems solved yet. Start from Sheets!
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {recentProblems.map((problem) => (
                  <div
                    key={problem.id}
                    className="flex items-center justify-between rounded-2xl px-4 py-3 border border-white/5 bg-white/[0.025] hover:bg-white/[0.05] transition-all duration-300"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-100">
                        {problem.name}
                      </p>
                      <p className="text-xs text-slate-400 capitalize mt-1">
                        {problem.topic} · {problem.date}
                      </p>
                    </div>

                    <span
                      className={`
                        text-xs font-semibold px-3 py-1.5 rounded-full border
                        ${
                          problem.level === "Easy"
                            ? "bg-emerald-500/10 text-emerald-300 border-emerald-400/20"
                            : problem.level === "Hard"
                            ? "bg-rose-500/10 text-rose-300 border-rose-400/20"
                            : "bg-amber-500/10 text-amber-300 border-amber-400/20"
                        }
                      `}
                    >
                      {problem.level}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;