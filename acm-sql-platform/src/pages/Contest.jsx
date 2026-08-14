import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Calendar, 
  Flame, 
  Lock, 
  CheckCircle, 
  Play, 
  ChevronRight
} from 'lucide-react';

const Contest = () => {
  const { profile } = useAuth();
  const streak = profile?.streak_count ?? 0;

  // Mock days data for the 21-day contest
  const days = Array.from({ length: 21 }, (_, i) => {
    const dayNum = i + 1;
    const isCompleted = dayNum <= streak && streak > 0;
    const isUnlocked = dayNum <= (streak + 1);
    
    let difficulty = 'Easy';
    if (dayNum > 7) difficulty = 'Medium';
    if (dayNum > 15) difficulty = 'Hard';

    const titles = [
      'Simple SELECT & Filters',
      'Aggregate Functions & GROUP BY',
      'INNER JOIN vs LEFT JOIN',
      'Handling NULLs with COALESCE',
      'Date & Time Formatting in Postgres',
      'Subqueries in WHERE Clause',
      'Multi-Table Joins & Aliases',
      'HAVING vs WHERE Deep-Dive',
      'UNION and UNION ALL Operators',
      'CASE WHEN Conditional Queries',
      'Window Functions: ROW_NUMBER',
      'Window Functions: RANK & DENSE_RANK',
      'LAG and LEAD Temporal Shifts',
      'Self-Joins and Hierarchies',
      'Cumulative Sums & Running Totals',
      'Common Table Expressions (CTEs)',
      'Recursive CTEs for Graphs & Trees',
      'EXISTS vs IN Optimization',
      'Partitioning & Index Insights',
      'Complex Financial Reconciliation Query',
      'Grand Finale: Real-world Analytics Engine',
    ];

    return {
      day: dayNum,
      title: titles[i],
      points: dayNum * 20 + 50,
      difficulty,
      isCompleted,
      isUnlocked,
    };
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Banner */}
        <div className="rounded-2xl bg-gradient-to-r from-indigo-900/60 via-slate-900 to-cyan-950/60 border border-slate-800 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold">
              <Calendar className="w-3.5 h-3.5" />
              <span>21-Day Chapter SQL Sprint</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white">Daily SQL Challenge</h1>
            <p className="text-sm text-slate-400 max-w-xl">
              Solve one SQL challenge every day for 21 consecutive days. Build habits, reinforce database fundamentals, and earn exclusive chapter prizes.
            </p>
          </div>

          {/* Quick Streak Card */}
          <div className="flex items-center space-x-4 bg-slate-950/80 border border-slate-800 px-6 py-4 rounded-xl shadow-lg">
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <Flame className="w-8 h-8 text-amber-400 fill-amber-500/30 animate-pulse" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Your Progress</div>
              <div className="text-2xl font-black text-slate-100">{streak} / 21 Days</div>
              <div className="text-[11px] text-amber-400 font-medium">Keep your flame burning!</div>
            </div>
          </div>
        </div>

        {/* 21 Days Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {days.map((item) => (
            <div
              key={item.day}
              className={`rounded-xl border p-5 transition-all duration-200 flex flex-col justify-between ${
                item.isCompleted
                  ? 'bg-slate-900/90 border-teal-500/40 shadow-sm shadow-teal-500/5'
                  : item.isUnlocked
                  ? 'bg-slate-900/90 border-indigo-500/40 hover:border-cyan-400/60 hover:shadow-lg hover:shadow-cyan-500/10'
                  : 'bg-slate-950/60 border-slate-800/60 opacity-60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20">
                    Day {item.day.toString().padStart(2, '0')}
                  </span>
                  
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        item.difficulty === 'Easy'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : item.difficulty === 'Medium'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {item.difficulty}
                    </span>
                    <span className="text-xs font-semibold text-cyan-300">
                      +{item.points} XP
                    </span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-white mb-2 leading-snug">
                  {item.title}
                </h3>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                {item.isCompleted ? (
                  <div className="flex items-center space-x-1.5 text-teal-400 text-xs font-semibold">
                    <CheckCircle className="w-4 h-4" />
                    <span>Completed</span>
                  </div>
                ) : item.isUnlocked ? (
                  <div className="flex items-center space-x-1.5 text-cyan-400 text-xs font-semibold">
                    <Play className="w-4 h-4 fill-cyan-400" />
                    <span>Available to Solve</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1.5 text-slate-500 text-xs font-medium">
                    <Lock className="w-4 h-4" />
                    <span>Locked (Unlocks on day {item.day})</span>
                  </div>
                )}

                <button
                  disabled={!item.isUnlocked}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition ${
                    item.isCompleted
                      ? 'bg-teal-500/10 text-teal-300 hover:bg-teal-500/20 border border-teal-500/30'
                      : item.isUnlocked
                      ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow hover:opacity-95'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <span>{item.isCompleted ? 'Review' : 'Solve'}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Contest;
