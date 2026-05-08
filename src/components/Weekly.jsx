import React from "react";
import Navbar from "./Navbar";
import {
  PieChart, Pie, Cell, BarChart, Legend,
  CartesianGrid, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";

// ADD { problems = [] } as a prop
function Weekly({ problems = [] }) {

  const today = new Date();
  const oneWeekAgo = new Date();
  today.setHours(0, 0, 0, 0);
  oneWeekAgo.setHours(0, 0, 0, 0);
  oneWeekAgo.setDate(today.getDate() - 6);

  const weeklyProblems = problems.filter((problem) => {
    const problemDate = new Date(problem.date);
    problemDate.setHours(0, 0, 0, 0);
    return problemDate >= oneWeekAgo && problemDate <= today;
  });

  let easy = 0, medium = 0, hard = 0;
  weeklyProblems.forEach((p) => {
    if (p.level === "Easy") easy++;
    else if (p.level === "Medium") medium++;
    else if (p.level === "Hard") hard++;
  });

  const difficultyData = [
    { name: "Easy", value: easy },
    { name: "Medium", value: medium },
    { name: "Hard", value: hard },
  ];

  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    last7Days.push(d);
  }

  const problemsPerDay = Array(7).fill(0);
  weeklyProblems.forEach((problem) => {
    const problemDate = new Date(problem.date);
    problemDate.setHours(0, 0, 0, 0);
    last7Days.forEach((d, idx) => {
      if (problemDate.toDateString() === d.toDateString()) {
        problemsPerDay[idx]++;
      }
    });
  });

  const chartData = last7Days.map((d, idx) => ({
    day: d.toLocaleDateString("en-US", { weekday: "short" }),
    problems: problemsPerDay[idx],
  }));

  const DIFF_COLORS = ["#22c55e", "#f59e0b", "#ef4444"];

  const CustomBarTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/[0.06] backdrop-blur-xl border border-white/10 rounded-xl px-4 py-2 text-sm shadow-xl">
          <p className="text-slate-400">{label}</p>
          <p className="text-orange-300 font-semibold">{payload[0].value} problems</p>
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/[0.06] backdrop-blur-xl border border-white/10 rounded-xl px-4 py-2 text-sm shadow-xl">
          <p style={{ color: payload[0].payload.fill }}>{payload[0].name}</p>
          <p className="text-slate-300">{payload[0].value} problems</p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }) => (
    <div className="flex justify-center gap-6 mt-4">
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ background: entry.color }} />
          <span className="text-sm text-slate-400">{entry.value}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-white relative overflow-hidden">

      {/* background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-[28rem] h-[28rem] bg-indigo-500/10 blur-3xl rounded-full" />
        <div className="absolute bottom-0 right-0 w-[24rem] h-[24rem] bg-cyan-400/10 blur-3xl rounded-full" />
      </div>

      <Navbar />

      {/* HEADER */}
      <header className="relative z-10 px-6 lg:px-10 py-6 mt-6 max-w-7xl mx-auto">
        <p className="text-xs tracking-[0.25em] text-orange-300 uppercase mb-2">
          DSA Tracker
        </p>

        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold text-white">Weekly Performance</h1>
            <p className="text-slate-400 text-sm mt-1">
              Your coding progress in last 7 days
            </p>
          </div>

          <span className="text-xs text-slate-400 bg-white/[0.05] border border-white/10 rounded-full px-3 py-1.5">
            {oneWeekAgo.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            {" — "}
            {today.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        </div>
      </header>

      <main className="relative z-10 px-6 lg:px-10 py-6 max-w-7xl mx-auto">

        {/* STAT CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">

          {[
            { label: "Total Problems", value: weeklyProblems.length, icon: "📘", color: "blue" },
            { label: "Hard Problems", value: hard, icon: "🔥", color: "red" },
            { label: "Problems / Day", value: (weeklyProblems.length / 7).toFixed(1), icon: "📈", color: "green" },
          ].map((card, i) => (
            <div key={i}
              className="group rounded-3xl p-5 border border-white/10 bg-white/[0.04] backdrop-blur-xl
                         shadow-[0_8px_30px_rgba(0,0,0,0.25)]
                         flex justify-between items-center
                         hover:-translate-y-1 hover:bg-white/[0.06] transition-all duration-300"
            >
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400 mb-1">
                  {card.label}
                </p>
                <p className="text-4xl font-bold text-white">{card.value}</p>
              </div>

              <div className="w-12 h-12 rounded-xl bg-white/[0.06] flex items-center justify-center text-2xl">
                {card.icon}
              </div>
            </div>
          ))}

        </div>

        {/* CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* BAR */}
          <div className="lg:col-span-3 rounded-3xl p-6 border border-white/10 bg-white/[0.04] backdrop-blur-xl">
            <h2 className="text-xs text-slate-400 uppercase mb-6">
              Problems solved per day
            </h2>

            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} barSize={32}>
                <CartesianGrid stroke="#1e293b" vertical={false}/>
                <XAxis dataKey="day" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false}/>
                <YAxis allowDecimals={false} tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false}/>
                <Tooltip content={<CustomBarTooltip />} cursor={{ fill: "rgba(255,255,255,0.05)" }}/>
                <Bar dataKey="problems" fill="#f97316" radius={[6,6,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* PIE */}
          <div className="lg:col-span-2 rounded-3xl p-6 border border-white/10 bg-white/[0.04] backdrop-blur-xl flex flex-col">

            <h2 className="text-xs text-slate-400 uppercase mb-6">
              Difficulty distribution
            </h2>

            {weeklyProblems.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
                No problems this week
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={difficultyData}
                    dataKey="value"
                    cx="50%" cy="45%"
                    outerRadius={90}
                    innerRadius={50}
                    paddingAngle={3}
                  >
                    {difficultyData.map((_, i) => (
                      <Cell key={i} fill={DIFF_COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                  <Legend content={<CustomLegend />} />
                </PieChart>
              </ResponsiveContainer>
            )}

          </div>
        </div>

      </main>
    </div>
  );
}

export default Weekly;