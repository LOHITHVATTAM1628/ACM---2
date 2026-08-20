import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useEvent } from '../../context/EventContext';
import { 
  Terminal, 
  Users, 
  HelpCircle, 
  Trophy, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Database, 
  Loader2, 
  TrendingUp, 
  Plus,
  Power,
  AlertTriangle,
  ShieldAlert,
  Flame
} from 'lucide-react';

const AdminDashboard = () => {
  const { isEventClosed, setIsEventClosed } = useEvent();
  const [stats, setStats] = useState({
    challengesCount: 0,
    studentsCount: 0,
    quizzesCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentChallenges, setRecentChallenges] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch challenges count & recent
        const { data: challengesData, count: challengesTotal } = await supabase
          .from('challenges')
          .select('id, day_number, title, difficulty, points', { count: 'exact' })
          .order('day_number', { ascending: true });

        // Fetch students count
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, role');

        // Fetch MCQ count from quiz_questions table
        const { count: mcqCount, error: mcqError } = await supabase
          .from('quiz_questions')
          .select('*', { count: 'exact', head: true });

        if (mcqError) {
          console.error("Error fetching MCQ count:", mcqError);
        }

        setStats({
          challengesCount: challengesTotal ?? (challengesData?.length || 0),
          studentsCount: profilesData?.filter(p => p.role !== 'admin').length || 0,
          quizzesCount: mcqCount || 0,
        });

        setRecentChallenges(challengesData?.slice(0, 5) || []);
      } catch (err) {
        console.warn('Dashboard fetch notice:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const metricCards = [
    { 
      title: '21-Day SQL Challenges', 
      value: stats.challengesCount, 
      sub: `${21 - stats.challengesCount} remaining to goal`, 
      icon: Terminal, 
      color: 'rose', 
      link: '/admin/challenges' 
    },
    { 
      title: 'Quizzes & MCQs', 
      value: stats.quizzesCount, 
      sub: 'Interactive knowledge checks', 
      icon: HelpCircle, 
      color: 'emerald', 
      link: '/admin/quizzes' 
    },
    { 
      title: 'Registered Students', 
      value: stats.studentsCount, 
      sub: 'Active chapter contestants', 
      icon: Users, 
      color: 'cyan', 
      link: '/admin/students' 
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-rose-950/80 via-slate-900 to-indigo-950/80 border border-slate-800 p-6 sm:p-8 rounded-3xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-10 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Chapter Administration Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Executive Management Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Author 21-day SQL challenges, manage quizzes and evaluations, and configure student permissions dynamically backed by Supabase.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              to="/admin/challenges"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 flex items-center space-x-2 transition transform active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>New Challenge</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Manual Kill Switch Executive Control Card */}
      <div className={`p-5 sm:p-6 rounded-3xl border transition-all duration-300 shadow-xl ${
        isEventClosed
          ? 'bg-gradient-to-r from-rose-950/60 via-slate-900 to-rose-950/40 border-rose-500/50 shadow-rose-950/40'
          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start space-x-4">
            <div className={`p-3 rounded-2xl border shrink-0 transition-colors ${
              isEventClosed
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-lg shadow-rose-500/20 animate-pulse'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
            }`}>
              {isEventClosed ? <ShieldAlert className="w-7 h-7" /> : <Power className="w-7 h-7" />}
            </div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2 flex-wrap">
                <h3 className="text-base font-extrabold text-white">
                  21-Day Sprint Manual Kill Switch
                </h3>
                <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                  isEventClosed
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                    : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                }`}>
                  {isEventClosed ? '🛑 Program Terminated / Closed' : '🟢 Program Active / Live'}
                </span>
                <span className="text-[10px] font-mono text-slate-500 px-1.5 py-0.5 rounded bg-slate-950/60 border border-slate-800">
                  Pure Frontend State
                </span>
              </div>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                {isEventClosed
                  ? 'The 21-day contest is currently closed. Student portal contest hub and playground are instantly locked from submissions in real-time.'
                  : 'The 21-day contest is live and accepting student queries. Flipping this switch will immediately pause all challenges across the student portal.'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 shrink-0 self-end md:self-center">
            <button
              onClick={() => setIsEventClosed(!isEventClosed)}
              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center space-x-2 transition-all transform active:scale-95 shadow-lg ${
                isEventClosed
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-emerald-600/30'
                  : 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-rose-600/40'
              }`}
            >
              <Power className="w-4 h-4" />
              <span>{isEventClosed ? 'Reactivate 21-Day Program' : 'Emergency Kill Program'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      {loading ? (
        <div className="py-12 flex justify-center">
          <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {metricCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <Link
                key={idx}
                to={card.link}
                className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 hover:border-slate-700 hover:bg-slate-900 transition flex flex-col justify-between group shadow-xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center group-hover:border-rose-500/40 transition">
                    <Icon className="w-5 h-5 text-rose-400" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-rose-400 group-hover:translate-x-1 transition-all" />
                </div>
                <div>
                  <span className="text-3xl font-black text-white block tracking-tight">
                    {card.value}
                  </span>
                  <h3 className="text-xs font-bold text-slate-300 mt-1">
                    {card.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {card.sub}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Quick Access Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Recent Challenges Overview (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Active SQL Sprint Challenges
              </h2>
            </div>
            <Link
              to="/admin/challenges"
              className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
            >
              <span>Manage All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {recentChallenges.map((c) => (
              <div
                key={c.id || c.day_number}
                className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono font-bold text-[11px]">
                    Day {c.day_number}
                  </span>
                  <span className="font-bold text-white truncate max-w-xs">{c.title}</span>
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                  <span className="text-[10px] font-semibold text-slate-400">{c.difficulty}</span>
                  <span className="text-[10px] font-bold text-cyan-400">+{c.points} XP</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Authoring Links (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
            <Sparkles className="w-4 h-4 text-rose-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Admin Quick Actions
            </h2>
          </div>

          <div className="space-y-3">
            <Link
              to="/admin/challenges"
              className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-rose-500/40 hover:bg-slate-950 transition flex items-center justify-between group"
            >
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400">
                  <Terminal className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-rose-300 transition">Author SQL Challenge</h4>
                  <p className="text-[10px] text-slate-400">Write schema and solution query</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-rose-400 group-hover:translate-x-0.5 transition-all" />
            </Link>

            <Link
              to="/admin/quizzes"
              className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-emerald-500/40 hover:bg-slate-950 transition flex items-center justify-between group"
            >
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-emerald-300 transition">Quizzes & Evaluations</h4>
                  <p className="text-[10px] text-slate-400">Manage multiple choice questions</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
            </Link>

            <Link
              to="/admin/students"
              className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-cyan-500/40 hover:bg-slate-950 transition flex items-center justify-between group"
            >
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition">Manage Student Roles</h4>
                  <p className="text-[10px] text-slate-400">Promote moderators & chapter leads</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
};

export default AdminDashboard;
