import { useMemo } from "react";
import Navbar from "./Navbar";

// Accept the data from App.jsx via props
function Streak({ problems = [] }) { 

  const dayKey = (d) => {
    const copy = new Date(d);
    copy.setHours(0, 0, 0, 0);
    return copy.toISOString().slice(0, 10);
  };

  const stats = useMemo(() => {
    const dateCountMap = {};
    problems.forEach((p) => {
      const k = dayKey(p.date);
      dateCountMap[k] = (dateCountMap[k] || 0) + 1;
    });

    const allKeys = Object.keys(dateCountMap).sort();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yest = new Date(today);
    yest.setDate(today.getDate() - 1);

    const todayKey = dayKey(today);
    const yestKey = dayKey(yest);

    let streak = 0;
    const walkStart = dateCountMap[todayKey]
      ? new Date(today)
      : dateCountMap[yestKey]
      ? new Date(yest)
      : null;

    if (walkStart) {
      const cursor = new Date(walkStart);
      while (dateCountMap[dayKey(cursor)]) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
      }
    }

    const addOneDay = (dateStr) => {
      const d = new Date(dateStr + "T00:00:00");
      d.setDate(d.getDate() + 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        "0"
      )}-${String(d.getDate()).padStart(2, "0")}`;
    };

    let longestStreak = 0;
    let runStreak = 0;

    allKeys.forEach((k, i) => {
      if (i === 0) runStreak = 1;
      else runStreak = addOneDay(allKeys[i - 1]) === k ? runStreak + 1 : 1;
      if (runStreak > longestStreak) longestStreak = runStreak;
    });

    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 6);

    const monthAgo = new Date(today);
    monthAgo.setMonth(today.getMonth() - 1);

    const thisWeek = problems.filter((p) => new Date(p.date) >= weekAgo).length;
    const thisMonth = problems.filter((p) => new Date(p.date) >= monthAgo).length;

    let activeLast30 = 0;
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      if (dateCountMap[dayKey(d)]) activeLast30++;
    }

    const completionRate = Math.round((activeLast30 / 30) * 100);

    const diffMap = { Easy: 0, Medium: 0, Hard: 0 };
    problems.forEach((p) => {
      if (p.level && diffMap[p.level] !== undefined) diffMap[p.level]++;
    });

    const topicMap = {};
    problems.forEach((p) => {
      if (p.topic) topicMap[p.topic] = (topicMap[p.topic] || 0) + 1;
    });

    const topicsSorted = Object.entries(topicMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    const activeDays = allKeys.length;
    const avgPerDay = activeDays > 0
      ? (problems.length / activeDays).toFixed(1)
      : "0.0";

    return {
      streak,
      longestStreak,
      totalSolved: problems.length,
      thisWeek,
      thisMonth,
      completionRate,
      activeDays,
      diffMap,
      topicsSorted,
      avgPerDay,
    };
  }, [problems]);

  const streakMessage =
    stats.streak === 0 ? "Start today ⚡" :
    stats.streak < 3 ? "Good start 💪" :
    stats.streak < 7 ? "Momentum building 🚀" :
    stats.streak < 14 ? "Strong consistency 🎯" :
    stats.streak < 30 ? "Unstoppable 🔥" :
    "Legend 🏆";

  const isBest = stats.streak > 0 && stats.streak === stats.longestStreak;
  const maxTopicCount = stats.topicsSorted[0]?.[1] || 1;

  const statCards = [
    {
      label: "Total",
      value: stats.totalSolved,
      icon: "✅",
      sub: "Problems logged",
      accent: "text-white",
      ring: "border-white/10",
      iconBg: "bg-white/[0.06]",
    },
    {
      label: "Week",
      value: stats.thisWeek,
      icon: "📅",
      sub: "Last 7 days",
      accent: "text-blue-300",
      ring: "border-blue-400/15",
      iconBg: "bg-blue-500/10",
    },
    {
      label: "Month",
      value: stats.thisMonth,
      icon: "📆",
      sub: "Last 30 days",
      accent: "text-violet-300",
      ring: "border-violet-400/15",
      iconBg: "bg-violet-500/10",
    },
    {
      label: "Active",
      value: stats.activeDays,
      icon: "🗓️",
      sub: "Days practiced",
      accent: "text-cyan-300",
      ring: "border-cyan-400/15",
      iconBg: "bg-cyan-500/10",
    },
    {
      label: "Avg",
      value: stats.avgPerDay,
      icon: "📊",
      sub: "Problems / active day",
      accent: "text-amber-300",
      ring: "border-amber-400/15",
      iconBg: "bg-amber-500/10",
    },
    {
      label: "30d %",
      value: `${stats.completionRate}%`,
      icon: "🎯",
      sub: "Consistency score",
      accent: "text-orange-300",
      ring: "border-orange-400/15",
      iconBg: "bg-orange-500/10",
    },
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-white relative overflow-hidden">
      {/* glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-[28rem] h-[28rem] bg-indigo-500/10 blur-3xl rounded-full" />
        <div className="absolute bottom-0 right-0 w-[24rem] h-[24rem] bg-cyan-400/10 blur-3xl rounded-full" />
      </div>

      <Navbar />

      {/* HERO */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-8">
        <p className="text-xs tracking-[0.25em] text-orange-300 uppercase mb-4">
          DSA Tracker · Streak
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* streak card */}
          <div className="relative rounded-3xl p-6 border border-white/10 bg-white/[0.05] backdrop-blur-xl text-center shadow-xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none" />

            {isBest && (
              <div className="absolute top-4 right-4 text-xs bg-amber-400/10 text-amber-300 px-2.5 py-1 rounded-full border border-amber-400/20">
                🏆 Best
              </div>
            )}

            <div className="relative z-10 text-5xl mb-2">
              {stats.streak > 0 ? "🔥" : "💤"}
            </div>

            <div className="relative z-10 text-7xl font-bold text-orange-300 drop-shadow-[0_0_18px_rgba(251,146,60,0.35)]">
              {stats.streak}
            </div>

            <p className="relative z-10 text-sm text-slate-400 mt-2">day streak</p>

            <p className="relative z-10 text-xs text-slate-500 mt-3">{streakMessage}</p>


            {!isBest && stats.longestStreak > 0 && (
              <div className="relative z-10 mt-5 pt-4 border-t border-white/10">
                <p className="text-xs text-slate-500">Personal Best</p>
                <p className="text-lg text-orange-400 font-semibold mt-1">
                  🏆 {stats.longestStreak} days
                </p>
              </div>
            )}
          </div>

          {/* upgraded analysis cards */}
          <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
            {statCards.map(({ label, value, icon, sub, accent, ring, iconBg }) => (
              <div
                key={label}
                className={`rounded-2xl p-4 border ${ring} bg-white/[0.04] backdrop-blur hover:bg-white/[0.06] transition-all duration-300`}
              >
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-[0.16em]">
                      {label}
                    </p>
                    <p className={`text-3xl font-bold mt-2 ${accent}`}>
                      {value}
                    </p>
                  </div>

                  <div className={`w-10 h-10 rounded-xl ${iconBg} border border-white/10 flex items-center justify-center text-lg`}>
                    {icon}
                  </div>
                </div>

                <div className="pt-3 border-t border-white/5">
                  <p className="text-xs text-slate-500">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MAIN */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 pb-10 space-y-6">
        {/* difficulty */}
        <section className="rounded-3xl p-6 border border-white/10 bg-white/[0.04] backdrop-blur">
          <h3 className="text-xs text-slate-400 uppercase mb-6 tracking-[0.16em]">
            Difficulty Breakdown
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                key: "Easy",
                value: stats.diffMap.Easy,
                text: "text-emerald-300",
                bg: "bg-emerald-500/10",
                border: "border-emerald-400/15",
              },
              {
                key: "Medium",
                value: stats.diffMap.Medium,
                text: "text-amber-300",
                bg: "bg-amber-500/10",
                border: "border-amber-400/15",
              },
              {
                key: "Hard",
                value: stats.diffMap.Hard,
                text: "text-rose-300",
                bg: "bg-rose-500/10",
                border: "border-rose-400/15",
              },
            ].map((item) => (
              <div
                key={item.key}
                className={`rounded-2xl p-5 border ${item.border} ${item.bg} text-center`}
              >
                <p className={`text-4xl font-bold ${item.text}`}>{item.value}</p>
                <p className="text-sm text-slate-400 mt-1">{item.key}</p>
              </div>
            ))}
          </div>
        </section>

        {/* topics */}
        <section className="rounded-3xl p-6 border border-white/10 bg-white/[0.04] backdrop-blur">
          <h3 className="text-xs text-slate-400 uppercase mb-6 tracking-[0.16em]">
            Top Topics
          </h3>

          {stats.topicsSorted.length === 0 ? (
            <p className="text-sm text-slate-500">No topics available yet.</p>
          ) : (
            <div className="space-y-4">
              {stats.topicsSorted.map(([topic, count]) => {
                const widthPercent = (count / maxTopicCount) * 100;

                return (
                  <div key={topic} className="grid grid-cols-[120px_1fr_36px] sm:grid-cols-[160px_1fr_40px] items-center gap-4">
                    <span className="text-sm text-slate-300 truncate capitalize">
                      {topic}
                    </span>

                    <div className="w-full bg-slate-800/90 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-orange-400 to-amber-300 h-2.5 rounded-full transition-all duration-700"
                        style={{ width: `${widthPercent}%` }}
                      />
                    </div>

                    <span className="text-xs text-slate-400 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default Streak;