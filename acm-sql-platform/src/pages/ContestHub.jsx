import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useEvent } from '../context/EventContext';
import { 
  Flame, 
  Trophy, 
  Calendar, 
  CheckCircle2, 
  Lock, 
  Play, 
  Sparkles, 
  Zap, 
  X,
  Code2,
  Database,
  Loader2,
  AlertCircle,
  Unlock,
  Video,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import ThankYouScreen from '../components/ThankYouScreen';

const ContestHub = () => {
  const { profile } = useAuth();
  const { isEventClosed } = useEvent();
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedChallenge, setSelectedChallenge] = useState(null);

  const currentStreak = profile?.streak_count ?? 0;
  const totalPoints = profile?.total_points ?? 0;

  useEffect(() => {
    const fetchChallenges = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: fetchErr } = await supabase
          .from('challenges')
          .select('*')
          .order('day_number', { ascending: true });

        if (fetchErr) throw fetchErr;
        setChallenges(data || []);
      } catch (err) {
        console.error('Error fetching live challenges:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchChallenges();
  }, []);

  // Strict dynamic status: locked/unlocked state depends on database is_unlocked and global kill switch
  const getStatus = (challenge) => {
    if (isEventClosed) {
      const dayNum = Number(challenge.day_number);
      if (currentStreak >= dayNum) return 'completed';
      return 'locked';
    }
    if (!challenge.is_unlocked) {
      return 'locked';
    }
    const dayNum = Number(challenge.day_number);
    if (currentStreak >= dayNum) {
      return 'completed';
    }
    return 'active';
  };

  const getMotivationalQuote = (streak) => {
    if (isEventClosed) {
      return '🛑 The 21-Day SQL Marathon is officially closed by the Chapter Leadership. Submissions are paused.';
    }
    if (streak >= 21) return '🏆 Legend! You conquered the entire 21-Day SQL Marathon!';
    if (streak >= 14) return '⚡ 2/3 Finished! Your query intuition is sharp as lightning!';
    if (streak >= 7) return '🚀 One full week completed! You have built unbreakable momentum!';
    if (streak >= 3) return '🔥 3-Day streak on fire! Solve today’s problem to keep the flame alive!';
    return '💡 Consistency beats intensity. Solve unlocked daily challenges to ignite your chapter streak!';
  };

  const unlockedCount = challenges.filter(c => c.is_unlocked).length;

  if (isEventClosed) {
    return <ThankYouScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-300">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-cyan-950 border border-slate-800 p-6 sm:p-8 shadow-2xl">
          {/* Ambient Glows */}
          <div className="absolute top-0 right-1/4 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                <span>ACM Chapter 21-Day SQL Sprint</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Daily SQL Contest Hub
              </h1>
              <p className="text-sm sm:text-base text-slate-300 font-normal leading-relaxed">
                {getMotivationalQuote(currentStreak)}
              </p>
              
              {/* Progress Summary Bar */}
              <div className="pt-2 space-y-1.5 max-w-md">
                <div className="flex justify-between text-xs font-medium text-slate-400">
                  <span>Sprint Progress ({unlockedCount} of {challenges.length || 21} Days Released)</span>
                  <span className="text-cyan-300 font-semibold">
                    {challenges.length > 0 ? Math.round((currentStreak / challenges.length) * 100) : 0}% Solved
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-teal-400 rounded-full transition-all duration-500"
                    style={{ width: `${challenges.length > 0 ? Math.min(100, (currentStreak / challenges.length) * 100) : 0}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Streak & XP Metric Cards */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-4">
              <div className="flex-1 sm:flex-initial flex items-center space-x-4 bg-slate-950/80 border border-amber-500/30 px-5 py-4 rounded-2xl shadow-xl backdrop-blur-md">
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <Flame className="w-8 h-8 text-amber-400 fill-amber-500/30 animate-bounce" />
                </div>
                <div>
                  <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Active Streak</div>
                  <div className="text-2xl font-black text-amber-400 flex items-center">
                    {currentStreak} Days
                  </div>
                  <div className="text-[11px] text-amber-300 font-semibold">
                    {currentStreak > 0 ? 'Flame is alive 🔥' : 'Start Day 1! 🚀'}
                  </div>
                </div>
              </div>

              <div className="flex-1 sm:flex-initial flex items-center space-x-4 bg-slate-950/80 border border-cyan-500/30 px-5 py-4 rounded-2xl shadow-xl backdrop-blur-md">
                <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
                  <Trophy className="w-8 h-8 text-cyan-400" />
                </div>
                <div>
                  <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Contest XP</div>
                  <div className="text-2xl font-black text-cyan-300">{totalPoints} pts</div>
                  <div className="text-[11px] text-teal-400 font-semibold">Chapter Standing</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Event Concluded Alert Notification */}
        {isEventClosed && (
          <div className="bg-gradient-to-r from-rose-950/80 via-slate-900 to-rose-950/80 border border-rose-500/40 p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in duration-300">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold text-white flex items-center space-x-2">
                  <span>21-Day Sprint Submissions Closed</span>
                  <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-black uppercase tracking-wider border border-rose-500/30">
                    Kill Switch Active
                  </span>
                </h3>
                <p className="text-xs text-slate-300">
                  The chapter administrators have locked the 21-day contest. No new challenge submissions or XP will be recorded until the event is re-opened.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Loading Spinner */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-4">
            <div className="relative flex items-center justify-center">
              <div className="w-14 h-14 rounded-full border-4 border-indigo-500/20 border-t-indigo-400 animate-spin" />
              <Loader2 className="w-6 h-6 text-indigo-400 absolute animate-pulse" />
            </div>
            <p className="text-xs sm:text-sm font-semibold text-slate-400 animate-pulse">
              Loading 21-Day challenges from Supabase...
            </p>
          </div>
        ) : error && challenges.length === 0 ? (
          <div className="p-12 text-center bg-rose-950/20 border border-rose-500/30 rounded-3xl space-y-3 max-w-lg mx-auto">
            <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
            <h3 className="text-base font-bold text-white">Failed to load challenges</h3>
            <p className="text-xs text-rose-300 leading-relaxed">{error}</p>
          </div>
        ) : challenges.length === 0 ? (
          /* Empty State */
          <div className="p-16 text-center bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl space-y-4 max-w-xl mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto text-cyan-400">
              <Database className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">Challenges in Progress</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Daily challenges are being prepared by the chapter lead. Check back shortly!
            </p>
          </div>
        ) : (
          <>
            {/* 21-Day Grid Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <h2 className="text-xl font-bold text-white">
                  Sprint Timeline ({unlockedCount} of {challenges.length} Unlocked)
                </h2>
              </div>
              <div className="flex items-center space-x-4 text-xs font-medium">
                <span className="flex items-center space-x-1.5 text-emerald-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>Completed</span>
                </span>
                <span className="flex items-center space-x-1.5 text-cyan-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span>Unlocked / Active</span>
                </span>
                <span className="flex items-center space-x-1.5 text-slate-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                  <span>Locked by Admin</span>
                </span>
              </div>
            </div>

            {/* 21-Day Responsive Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {challenges.map((item) => {
                const status = getStatus(item);
                const isCompleted = status === 'completed';
                const isActive = status === 'active';
                const isLocked = status === 'locked';

                return (
                  <div
                    key={item.id || item.day_number}
                    onClick={() => !isLocked && setSelectedChallenge(item)}
                    className={`group relative rounded-3xl p-5 transition-all duration-300 flex flex-col justify-between ${
                      isLocked
                        ? 'bg-slate-950/60 border border-slate-800/60 opacity-60 cursor-not-allowed select-none'
                        : isActive
                        ? 'bg-slate-900/95 border-2 border-cyan-400/80 hover:border-cyan-300 ring-2 ring-cyan-500/20 shadow-xl shadow-cyan-500/15 cursor-pointer transform hover:-translate-y-1'
                        : 'bg-slate-900/90 border border-emerald-500/40 hover:border-emerald-400 shadow-lg shadow-emerald-500/5 cursor-pointer transform hover:-translate-y-1'
                    }`}
                  >
                    <div>
                      {/* Top Bar on Card */}
                      <div className="flex items-center justify-between mb-3.5">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`text-xs font-black px-2.5 py-1 rounded-xl uppercase tracking-wider ${
                              isLocked
                                ? 'bg-slate-800 text-slate-400 border border-slate-700/60'
                                : isActive
                                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30 font-black'
                                : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold'
                            }`}
                          >
                            Day {String(item.day_number).padStart(2, '0')}
                          </span>

                          {item.is_unlocked && (
                            <span className="flex items-center space-x-1 px-2 py-0.5 rounded-lg bg-cyan-400/15 text-cyan-300 text-[10px] font-bold uppercase tracking-wider border border-cyan-400/30">
                              <Unlock className="w-2.5 h-2.5" />
                              <span>Unlocked</span>
                            </span>
                          )}
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                            isLocked
                              ? 'bg-slate-800/80 text-slate-500'
                              : item.difficulty === 'Easy'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : item.difficulty === 'Medium'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {item.difficulty || 'Easy'}
                        </span>
                      </div>

                      {/* Challenge Title & Info */}
                      <h3 className={`text-base font-bold mb-2 line-clamp-2 leading-snug ${
                        isLocked ? 'text-slate-400' : isActive ? 'text-white' : 'text-slate-200'
                      }`}>
                        {item.title}
                      </h3>

                      <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                        {item.description}
                      </p>

                      {/* Feature badges if unlocked */}
                      {!isLocked && (item.video_url || item.leetcode_url) && (
                        <div className="flex items-center gap-1.5 mb-4 flex-wrap">
                          {item.video_url && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-300 border border-rose-500/30 flex items-center space-x-1">
                              <Video className="w-3 h-3" />
                              <span>Video</span>
                            </span>
                          )}
                          {item.leetcode_url && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center space-x-1">
                              <ExternalLink className="w-3 h-3" />
                              <span>LeetCode</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Footer State & Action CTA */}
                    <div className="pt-3.5 border-t border-slate-800/80 flex items-center justify-between">
                      {isLocked ? (
                        <>
                          <div className="flex items-center space-x-1.5 text-slate-500 text-xs font-semibold">
                            <Lock className="w-4 h-4 text-slate-500" />
                            <span>Locked by Admin</span>
                          </div>
                          <span className="text-[11px] text-slate-600 font-mono">
                            +{item.points} XP
                          </span>
                        </>
                      ) : isCompleted ? (
                        <>
                          <div className="flex items-center space-x-1.5 text-emerald-400 text-xs font-semibold">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>+{item.points} XP Solved</span>
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/student/contest/day/${item.day_number}`);
                            }}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/30 transition"
                          >
                            Review
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center space-x-1.5 text-cyan-300 text-xs font-bold">
                            <Zap className="w-4 h-4 text-cyan-400 fill-cyan-400 animate-pulse" />
                            <span>+{item.points} XP</span>
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/student/contest/day/${item.day_number}`);
                            }}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-teal-300 hover:from-cyan-300 hover:to-teal-200 shadow-md shadow-cyan-400/30 flex items-center space-x-1.5 transition transform group-hover:scale-105"
                          >
                            <Play className="w-3.5 h-3.5 fill-slate-950" />
                            <span>Solve Challenge</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Modal / Quick View Slide-over (Only for unlocked challenges) */}
        {selectedChallenge && selectedChallenge.is_unlocked && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-6 relative animate-in zoom-in-95 duration-150">
              <button
                onClick={() => setSelectedChallenge(null)}
                className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider px-2.5 py-1 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Day {selectedChallenge.day_number}
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                    +{selectedChallenge.points} XP
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {selectedChallenge.difficulty || 'Easy'}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white">
                  {selectedChallenge.title}
                </h3>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                {selectedChallenge.description}
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  onClick={() => setSelectedChallenge(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    const dayNum = parseInt(selectedChallenge.day_number, 10) || 1;
                    setSelectedChallenge(null);
                    navigate(`/student/contest/day/${dayNum}`);
                  }}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 shadow-lg shadow-indigo-600/30 flex items-center space-x-2 transition"
                >
                  <Code2 className="w-4 h-4" />
                  <span>Launch Learning Loop</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContestHub;
