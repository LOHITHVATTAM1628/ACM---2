import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Calendar, 
  Trophy, 
  Flame, 
  ArrowRight, 
  Layers, 
  Award,
  Sparkles,
  Zap,
  Terminal
} from 'lucide-react';

const Home = () => {
  const { user, profile } = useAuth();
  const streak = profile?.streak_count ?? 0;
  const points = profile?.total_points ?? 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 p-8 sm:p-12 shadow-2xl">
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-12 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-6">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>ACM Student Chapter Exclusive</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
              Master SQL & Conquer the{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-300 to-teal-300">
                21-Day Challenge
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed">
              Elevate your database query skills from fundamental joins to advanced window functions and query optimization. Compete with peers, build daily streaks, and climb the chapter leaderboard.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                to="/contest"
                className="inline-flex items-center space-x-2 px-6 py-3.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 shadow-lg shadow-indigo-600/30 hover:shadow-cyan-500/40 transition-all duration-200 transform hover:-translate-y-0.5"
              >
                <Calendar className="w-4 h-4" />
                <span>Enter 21-Day Contest</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
              
              <Link
                to="/tracks"
                className="inline-flex items-center space-x-2 px-6 py-3.5 rounded-xl font-semibold text-sm text-slate-200 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 transition duration-200"
              >
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>Explore Learning Tracks</span>
              </Link>
            </div>
          </div>
        </div>

        {/* User Quick Stats (if logged in) */}
        {user && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-6 flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Flame className="w-6 h-6 text-amber-400 fill-amber-500/30" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Current Streak</p>
                <p className="text-2xl font-bold text-slate-100">{streak} Days</p>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-6 flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total XP Earned</p>
                <p className="text-2xl font-bold text-slate-100">{points} XP</p>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-6 flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <Terminal className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Account Role</p>
                <p className="text-2xl font-bold text-slate-100 capitalize">{profile?.role || 'Student'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mb-4">
              <Zap className="w-5 h-5 text-indigo-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Interactive SQL Engine</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Execute live queries in a real PostgreSQL environment with instant feedback and automatic test cases.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-4">
              <Calendar className="w-5 h-5 text-cyan-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">21-Day SQL Sprint</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Curated daily problems building in difficulty from day 1 to day 21. Earn badges and rank on the leaderboards.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition">
            <div className="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center mb-4">
              <Award className="w-5 h-5 text-teal-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Chapter Recognition</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Compete among chapter peers. Top performers receive certificates and prizes at the chapter summit.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
