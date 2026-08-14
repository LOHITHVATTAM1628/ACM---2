import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  Terminal, 
  Layers, 
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
  Plus
} from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    challengesCount: 0,
    tracksCount: 0,
    studentsCount: 0,
    topicsCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentChallenges, setRecentChallenges] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch challenges count & recent
        const { data: challengesData } = await supabase
          .from('challenges')
          .select('id, day_number, title, difficulty, points')
          .order('day_number', { ascending: true });

        // Fetch tracks count
        const { data: tracksData } = await supabase
          .from('tracks')
          .select('id');

        // Fetch students count
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, role');

        // Fetch topics count
        const { data: topicsData } = await supabase
          .from('topics')
          .select('id');

        setStats({
          challengesCount: challengesData?.length || 0,
          tracksCount: tracksData?.length || 0,
          studentsCount: profilesData?.filter(p => p.role !== 'admin').length || 0,
          topicsCount: topicsData?.length || 0,
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
      title: 'Curriculum Tracks', 
      value: stats.tracksCount, 
      sub: `${stats.topicsCount} learning topics published`, 
      icon: Layers, 
      color: 'indigo', 
      link: '/admin/tracks' 
    },
    { 
      title: 'Registered Students', 
      value: stats.studentsCount, 
      sub: 'Active chapter contestants', 
      icon: Users, 
      color: 'cyan', 
      link: '/admin/students' 
    },
    { 
      title: 'Quizzes & Evaluations', 
      value: stats.topicsCount, 
      sub: 'Interactive knowledge checks', 
      icon: HelpCircle, 
      color: 'emerald', 
      link: '/admin/quizzes' 
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
              Author 21-day SQL challenges, manage student roles, and publish learning curriculum dynamically backed by Supabase.
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

      {/* Metrics Row */}
      {loading ? (
        <div className="py-12 flex justify-center">
          <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
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
              to="/admin/tracks"
              className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-indigo-500/40 hover:bg-slate-950 transition flex items-center justify-between group"
            >
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 transition">Curriculum Tracks</h4>
                  <p className="text-[10px] text-slate-400">Manage tracks & competency roadmaps</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
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
