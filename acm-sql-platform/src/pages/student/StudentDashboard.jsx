import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useEvent } from '../../context/EventContext';
import { supabase } from '../../lib/supabase';
import { 
  Flame, 
  Sparkles, 
  Trophy, 
  Calendar, 
  ArrowRight, 
  Play, 
  CheckCircle2, 
  Clock, 
  Database,
  Terminal,
  Loader2,
  Award,
  Lock,
  ShieldAlert
} from 'lucide-react';

import ThankYouScreen from '../../components/ThankYouScreen';

const StudentDashboard = () => {
  const { user, profile } = useAuth();
  const { isEventClosed } = useEvent();
  const [challenges, setChallenges] = useState([]);
  const [topStudents, setTopStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const streak = profile?.streak_count ?? 0;
  const points = profile?.total_points ?? 0;
  const displayName = profile?.name || profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Student';

  useEffect(() => {
    const fetchStudentPortalData = async () => {
      setLoading(true);
      try {
        // Fetch 21-Day challenges live from Supabase
        const { data: challengesData } = await supabase
          .from('challenges')
          .select('*')
          .order('day_number', { ascending: true });

        setChallenges(challengesData || []);

        // Fetch top students using `name` column
        const { data: leaderData } = await supabase
          .from('profiles')
          .select('id, name, email, total_points, streak_count')
          .order('total_points', { ascending: false })
          .limit(5);

        setTopStudents(leaderData || []);
      } catch (err) {
        console.error('Error fetching student dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentPortalData();
  }, []);

  // When kill switch is active, immediately lock down dashboard and present animated Thank You celebration screen
  if (isEventClosed) {
    return <ThankYouScreen />;
  }

  // Compute today's active challenge or next incomplete challenge
  const activeDay = Math.min(Math.max(streak + 1, 1), 21);
  const todaysChallenge = challenges.find(c => Number(c.day_number) === activeDay) || challenges[0];

  return (
    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-[fadeIn_0.8s_ease-out]">
      
      {/* Background ACM Chapter Watermark */}
      <div className="absolute top-12 right-0 pointer-events-none select-none opacity-[0.03] text-indigo-200 flex items-center justify-center z-0 overflow-hidden">
        <svg
          viewBox="0 0 400 400"
          className="w-[450px] h-[450px] sm:w-[600px] sm:h-[600px] fill-current transform rotate-12"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M200 30 L370 125 L370 275 L200 370 L30 275 L30 125 Z" stroke="currentColor" strokeWidth="20" fill="none" />
          <text
            x="200"
            y="235"
            textAnchor="middle"
            fontFamily="monospace, sans-serif"
            fontWeight="900"
            fontSize="100"
            fill="currentColor"
            letterSpacing="10"
          >
            ACM
          </text>
        </svg>
      </div>

      {/* Hero Welcome Banner (Frosted Glassmorphic Card) */}
      <div className="relative z-10 rounded-2xl overflow-hidden bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] p-6 sm:p-10 transition-all duration-300">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-10 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>ACM Chapter Student Portal</span>
            </div>
            
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Welcome Back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">{displayName}</span>!
            </h1>
            
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Continue your 21-Day SQL Contest, build your daily streak, and sharpen your SQL skills through hands-on challenges in our interactive playground.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <div className="flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold shadow-inner">
                <Flame className="w-4 h-4 animate-pulse fill-amber-500/30" />
                <span>{streak} Day Active Streak</span>
              </div>

              <div className="flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold shadow-inner">
                <Sparkles className="w-4 h-4" />
                <span>{points} Total XP Points</span>
              </div>
            </div>
          </div>

          {/* Today's Sprint Challenge Card */}
          {todaysChallenge && (
            <div className="bg-slate-950/80 border border-cyan-500/30 rounded-2xl p-5 lg:w-80 shadow-2xl backdrop-blur-xl shrink-0 space-y-4 animate-fade-in-up">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-mono text-xs font-black">
                  DAY {todaysChallenge.day_number}
                </span>
                <span className="text-xs font-bold text-cyan-400">+{todaysChallenge.points || 100} XP</span>
              </div>

              <div>
                <h3 className="text-sm font-extrabold text-white line-clamp-1">{todaysChallenge.title}</h3>
                <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">{todaysChallenge.description}</p>
              </div>

              {isEventClosed ? (
                <div className="w-full py-2.5 px-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs font-semibold flex items-center justify-center space-x-2 cursor-not-allowed">
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Submissions Closed</span>
                </div>
              ) : (
                <Link
                  to={`/student/contest/day/${parseInt(todaysChallenge.day_number, 10) || 1}`}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-bold flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/30 transition transform active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Solve Day {todaysChallenge.day_number}</span>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Grid: 21-Day Contest Overview & Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: 21-Day Contest Timeline Preview (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-bold text-white uppercase tracking-wider">
                21-Day SQL Contest Sprint
              </h2>
            </div>
            <Link
              to="/student/contest"
              className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
            >
              <span>View Full Contest</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="py-16 flex justify-center bg-slate-900/60 border border-slate-800 rounded-3xl">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {challenges.map((c) => {
                const day = parseInt(c.day_number, 10) || 1;
                const isUnlocked = Boolean(c.is_unlocked);
                const isCompleted = isUnlocked && streak >= day;
                const isCurrent = isUnlocked && !isCompleted;

                if (!isUnlocked) {
                  return (
                    <div
                      key={c.id || day}
                      className="p-3 rounded-2xl border text-center flex flex-col justify-between bg-slate-950/60 border-slate-800/60 opacity-60 cursor-not-allowed select-none"
                    >
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                        <span className="font-mono">D{day}</span>
                        <Lock className="w-3 h-3 text-slate-600" />
                      </div>
                      <div className="my-2">
                        <span className="text-xs font-black truncate block text-slate-500">
                          Locked
                        </span>
                      </div>
                      <span className="text-[9px] font-bold text-slate-600">
                        +{c.points} XP
                      </span>
                    </div>
                  );
                }

                return (
                  <Link
                    key={c.id || day}
                    to={`/student/contest/day/${day}`}
                    className={`p-3 rounded-2xl border text-center transition-all flex flex-col justify-between group ${
                      isCompleted
                        ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                        : isCurrent
                        ? 'bg-indigo-950/80 border-cyan-400 ring-2 ring-cyan-400/40 shadow-lg shadow-cyan-500/10'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <span className="font-mono">D{day}</span>
                      {isCompleted && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                    </div>
                    <div className="my-2">
                      <span className={`text-xs font-black truncate block ${isCurrent ? 'text-cyan-300' : 'text-white'}`}>
                        {c.difficulty || 'Easy'}
                      </span>
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 group-hover:text-cyan-300 transition">
                      +{c.points} XP
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Leaderboard Podium & Fast Links (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Leaderboard Podium Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 animate-fade-in-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                  Chapter Leaderboard
                </h2>
              </div>
              <Link
                to="/student/leaderboard"
                className="text-xs font-bold text-cyan-400 hover:text-cyan-300"
              >
                Full Board
              </Link>
            </div>

            <div className="space-y-3">
              {topStudents.map((st, index) => (
                <div
                  key={st.id}
                  className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                      index === 0
                        ? 'bg-amber-400 text-slate-950'
                        : index === 1
                        ? 'bg-slate-300 text-slate-950'
                        : 'bg-amber-700 text-white'
                    }`}>
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{st.name || st.full_name || 'Contestant'}</p>
                      <p className="text-[10px] text-slate-400">{st.streak_count || 0}d streak</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-cyan-400 shrink-0">
                    {st.total_points || 0} pts
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Access Card */}
          <div className="bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3 animate-fade-in-up">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">SQL Sandbox Playground</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Test custom queries, experiment with JOINs, and practice writing SQL independently with AI mentor assistance.
            </p>
            <Link
              to="/student/contest"
              className="inline-flex items-center space-x-2 text-xs font-bold text-cyan-400 hover:text-cyan-300 pt-1"
            >
              <span>Launch Playground</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

        </div>

      </div>

    </div>
  );
};

export default StudentDashboard;
