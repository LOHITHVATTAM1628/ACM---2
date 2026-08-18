import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
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
  ExternalLink
} from 'lucide-react';

const ContestHub = () => {
  const { profile } = useAuth();
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
          .select('id, day_number, title, description, difficulty, points, is_unlocked, video_url, leetcode_url')
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

  // Strict dynamic status: locked/unlocked state depends strictly on database `is_unlocked`
  const getStatus = (challenge) => {
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
    if (streak >= 21) return '🏆 Legend! You conquered the entire 21-Day SQL Marathon!';
    if (streak >= 14) return '⚡ 2/3 Finished! Your query intuition is sharp as lightning!';
    if (streak >= 7) return '🚀 One full week completed! You have built unbreakable momentum!';
    if (streak >= 3) return `🔥 3-Day streak on fire! Solve today's problem to keep the flame alive!`;
    return '💡 Consistency beats intensity. Solve unlocked daily challenges to ignite your chapter streak!';
  };

  const unlockedCount = challenges.filter(c => c.is_unlocked).length;
  const progressPercent = challenges.length > 0 ? Math.min(100, (currentStreak / challenges.length) * 100) : 0;

  // Difficulty badge config
  const difficultyConfig = {
    Easy: {
      bg: 'ch-diff-easy',
      text: 'text-emerald-300',
    },
    Medium: {
      bg: 'ch-diff-medium',
      text: 'text-amber-300',
    },
    Hard: {
      bg: 'ch-diff-hard',
      text: 'text-rose-300',
    },
  };

  return (
    <div className="min-h-screen text-slate-100 py-8 px-4 sm:px-6 lg:px-8 ch-page-bg">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* ═══════════════ HERO BANNER ═══════════════ */}
        <div className="ch-hero relative overflow-hidden rounded-3xl p-6 sm:p-8">
          {/* Animated background glows */}
          <div className="ch-hero-glow-1" />
          <div className="ch-hero-glow-2" />
          <div className="ch-hero-glow-3" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              {/* Sprint badge */}
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full ch-badge-sprint text-xs font-semibold">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                <span>ACM Chapter 21-Day SQL Sprint</span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight ch-hero-title">
                Daily SQL Contest Hub
              </h1>

              <p className="text-sm sm:text-base text-slate-300/90 font-normal leading-relaxed">
                {getMotivationalQuote(currentStreak)}
              </p>
              
              {/* ──── Progress Bar ──── */}
              <div className="pt-2 space-y-1.5 max-w-md">
                <div className="flex justify-between text-xs font-medium text-slate-400">
                  <span>Sprint Progress ({unlockedCount} of {challenges.length || 21} Days Released)</span>
                  <span className="ch-progress-label font-semibold">
                    {challenges.length > 0 ? Math.round((currentStreak / challenges.length) * 100) : 0}% Solved
                  </span>
                </div>
                <div className="ch-progress-track">
                  <div 
                    className="ch-progress-fill"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* ──── Streak & XP Metric Cards ──── */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-4">
              {/* Streak Card */}
              <div className="ch-stat-card ch-stat-streak flex-1 sm:flex-initial flex items-center space-x-4 px-5 py-4 rounded-2xl">
                <div className="ch-stat-icon-wrap ch-stat-icon-streak">
                  <Flame className="w-8 h-8 text-amber-400 fill-amber-500/30" />
                </div>
                <div>
                  <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Active Streak</div>
                  <div className="text-2xl font-black text-amber-400 flex items-center">
                    {currentStreak} Days
                  </div>
                  <div className="text-[11px] text-amber-300/80 font-semibold">
                    {currentStreak > 0 ? 'Flame is alive 🔥' : 'Start Day 1! 🚀'}
                  </div>
                </div>
              </div>

              {/* XP Card */}
              <div className="ch-stat-card ch-stat-xp flex-1 sm:flex-initial flex items-center space-x-4 px-5 py-4 rounded-2xl">
                <div className="ch-stat-icon-wrap ch-stat-icon-xp">
                  <Trophy className="w-8 h-8 text-cyan-400" />
                </div>
                <div>
                  <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Contest XP</div>
                  <div className="text-2xl font-black text-cyan-300">{totalPoints} pts</div>
                  <div className="text-[11px] text-violet-400/80 font-semibold">Chapter Standing</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════ LOADING / ERROR / EMPTY ═══════════════ */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-4">
            <div className="relative flex items-center justify-center">
              <div className="w-14 h-14 rounded-full border-4 border-indigo-500/20 border-t-cyan-400 animate-spin" />
              <Loader2 className="w-6 h-6 text-cyan-400 absolute animate-pulse" />
            </div>
            <p className="text-xs sm:text-sm font-semibold text-slate-400 animate-pulse">
              Loading 21-Day challenges from Supabase...
            </p>
          </div>
        ) : error && challenges.length === 0 ? (
          <div className="p-12 text-center ch-glass-card border-rose-500/30 rounded-3xl space-y-3 max-w-lg mx-auto">
            <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
            <h3 className="text-base font-bold text-white">Failed to load challenges</h3>
            <p className="text-xs text-rose-300 leading-relaxed">{error}</p>
          </div>
        ) : challenges.length === 0 ? (
          /* Empty State */
          <div className="p-16 text-center ch-glass-card border-dashed rounded-3xl space-y-4 max-w-xl mx-auto">
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
            {/* ═══════════════ TIMELINE HEADER ═══════════════ */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-cyan-400 ch-sparkle-icon" />
                <h2 className="text-xl font-bold text-white">
                  Sprint Timeline ({unlockedCount} of {challenges.length} Unlocked)
                </h2>
              </div>
              <div className="flex items-center space-x-4 text-xs font-medium">
                <span className="flex items-center space-x-1.5 text-emerald-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ch-legend-dot" />
                  <span>Completed</span>
                </span>
                <span className="flex items-center space-x-1.5 text-cyan-400">
                  <span className="w-2.5 h-2.5 rounded-full ch-legend-active" />
                  <span>Unlocked / Active</span>
                </span>
                <span className="flex items-center space-x-1.5 text-slate-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-600/80" />
                  <span>Locked by Admin</span>
                </span>
              </div>
            </div>

            {/* ═══════════════ 21-DAY CARD GRID ═══════════════ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {challenges.map((item, index) => {
                const status = getStatus(item);
                const isCompleted = status === 'completed';
                const isActive = status === 'active';
                const isLocked = status === 'locked';
                const diff = difficultyConfig[item.difficulty] || difficultyConfig.Easy;

                return (
                  <div
                    key={item.id || item.day_number}
                    onClick={() => !isLocked && setSelectedChallenge(item)}
                    className={`ch-card group relative rounded-2xl p-5 flex flex-col justify-between ${
                      isLocked
                        ? 'ch-card-locked cursor-not-allowed select-none'
                        : isActive
                        ? 'ch-card-active cursor-pointer'
                        : 'ch-card-completed cursor-pointer'
                    }`}
                    style={{ animationDelay: `${index * 60}ms` }}
                  >
                    <div>
                      {/* ── Top Bar ── */}
                      <div className="flex items-center justify-between mb-3.5">
                        <div className="flex items-center space-x-2">
                          {/* Day Badge */}
                          <span
                            className={`text-xs font-black px-2.5 py-1 rounded-xl uppercase tracking-wider ${
                              isLocked
                                ? 'ch-day-badge-locked'
                                : isActive
                                ? 'ch-day-badge-active'
                                : 'ch-day-badge-completed'
                            }`}
                          >
                            Day {String(item.day_number).padStart(2, '0')}
                          </span>

                          {item.is_unlocked && (
                            <span className="ch-unlocked-badge flex items-center space-x-1 px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                              <Unlock className="w-2.5 h-2.5" />
                              <span>Unlocked</span>
                            </span>
                          )}
                        </div>

                        {/* Difficulty Badge */}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                            isLocked
                              ? 'ch-diff-locked'
                              : diff.bg
                          }`}
                        >
                          {item.difficulty || 'Easy'}
                        </span>
                      </div>

                      {/* ── Title & Description ── */}
                      <h3 className={`text-base font-bold mb-2 line-clamp-2 leading-snug ${
                        isLocked ? 'text-slate-400/80' : isActive ? 'text-white' : 'text-slate-200'
                      }`}>
                        {item.title}
                      </h3>

                      <p className={`text-xs line-clamp-2 mb-4 leading-relaxed ${
                        isLocked ? 'text-slate-500/70' : 'text-slate-400'
                      }`}>
                        {item.description}
                      </p>

                      {/* ── Feature badges (Video / LeetCode) ── */}
                      {!isLocked && (item.video_url || item.leetcode_url) && (
                        <div className="flex items-center gap-1.5 mb-4 flex-wrap">
                          {item.video_url && (
                            <span className="ch-feature-badge-video text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center space-x-1">
                              <Video className="w-3 h-3" />
                              <span>Video</span>
                            </span>
                          )}
                          {item.leetcode_url && (
                            <span className="ch-feature-badge-leet text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center space-x-1">
                              <ExternalLink className="w-3 h-3" />
                              <span>LeetCode</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* ── Footer: State & Action ── */}
                    <div className={`pt-3.5 flex items-center justify-between ${
                      isLocked ? 'ch-card-footer-locked' : 'ch-card-footer'
                    }`}>
                      {isLocked ? (
                        <>
                          <div className="flex items-center space-x-1.5 text-slate-500/80 text-xs font-semibold">
                            <Lock className="w-4 h-4 ch-lock-icon" />
                            <span>Locked by Admin</span>
                          </div>
                          <span className="text-[11px] text-slate-600/80 font-mono">
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
                            className="ch-btn-review px-3 py-1.5 rounded-xl text-xs font-semibold transition"
                          >
                            Review
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center space-x-1.5 text-xs font-bold ch-xp-label">
                            <Zap className="w-4 h-4 ch-zap-icon" />
                            <span>+{item.points} XP</span>
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/student/contest/day/${item.day_number}`);
                            }}
                            className="ch-btn-solve px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition"
                          >
                            <Play className="w-3.5 h-3.5" />
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

        {/* ═══════════════ MODAL / QUICK VIEW ═══════════════ */}
        {selectedChallenge && selectedChallenge.is_unlocked && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 ch-modal-overlay">
            <div className="ch-modal-card max-w-xl w-full p-6 sm:p-8 space-y-6 relative">
              <button
                onClick={() => setSelectedChallenge(null)}
                className="absolute top-5 right-5 p-2 rounded-xl ch-modal-close transition"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider px-2.5 py-1 rounded ch-modal-day-badge">
                    Day {selectedChallenge.day_number}
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded ch-modal-xp-badge">
                    +{selectedChallenge.points} XP
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded ch-modal-diff-badge">
                    {selectedChallenge.difficulty || 'Easy'}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white">
                  {selectedChallenge.title}
                </h3>
              </div>

              <div className="ch-modal-desc p-4 rounded-xl text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                {selectedChallenge.description}
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 ch-modal-footer">
                <button
                  onClick={() => setSelectedChallenge(null)}
                  className="ch-modal-btn-close px-4 py-2.5 rounded-xl text-xs font-semibold transition"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    const dayNum = parseInt(selectedChallenge.day_number, 10) || 1;
                    setSelectedChallenge(null);
                    navigate(`/student/contest/day/${dayNum}`);
                  }}
                  className="ch-modal-btn-launch px-5 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition"
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
