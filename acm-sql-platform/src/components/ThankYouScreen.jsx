import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEvent } from '../context/EventContext';
import { 
  Trophy, 
  Flame, 
  Sparkles, 
  Award, 
  CheckCircle2, 
  Share2, 
  ArrowRight, 
  Star, 
  ShieldCheck, 
  Heart, 
  Calendar, 
  Database, 
  Code2, 
  LogOut,
  ExternalLink,
  ChevronRight,
  PartyPopper
} from 'lucide-react';

const ThankYouScreen = () => {
  const { user, profile, logout } = useAuth();
  const { isEventClosed, setIsEventClosed } = useEvent();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const displayName = profile?.name || profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Contestant';
  const streak = profile?.streak_count ?? 0;
  const points = profile?.total_points ?? 0;
  const isAdmin = profile?.role === 'admin';

  const handleShare = () => {
    const text = `🎉 I completed the ACM Chapter 21-Day SQL Marathon with ${points} XP and a ${streak}-day streak! 🚀`;
    if (navigator.share) {
      navigator.share({
        title: 'ACM 21-Day SQL Sprint Completion',
        text: text,
        url: window.location.origin,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-10 overflow-hidden font-sans select-none">
      
      {/* Background Animated Glowing Orbs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute top-1/3 -right-32 w-96 h-96 bg-cyan-500/20 rounded-full blur-[140px] pointer-events-none animate-pulse" />
      <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-rose-600/15 rounded-full blur-[130px] pointer-events-none" />

      {/* Floating Particle Sparkles (CSS Animation) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[12%] left-[18%] w-2 h-2 rounded-full bg-cyan-400/60 animate-ping" />
        <div className="absolute top-[28%] right-[22%] w-2.5 h-2.5 rounded-full bg-amber-400/70 animate-bounce" />
        <div className="absolute bottom-[20%] left-[25%] w-2 h-2 rounded-full bg-rose-400/60 animate-pulse" />
        <div className="absolute top-[65%] right-[15%] w-3 h-3 rounded-full bg-indigo-400/50 animate-ping" />
      </div>

      {/* Main Glassmorphic Celebration Card */}
      <div className="relative z-10 max-w-3xl w-full bg-slate-900/90 border border-slate-800/90 backdrop-blur-2xl rounded-3xl p-6 sm:p-10 shadow-2xl shadow-indigo-950/60 text-center space-y-8 animate-in zoom-in-95 fade-in duration-500">
        
        {/* Top Trophy & Celebration Crown Animation */}
        <div className="relative inline-block mx-auto">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 p-1 shadow-2xl shadow-amber-500/30 animate-bounce">
            <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/15 via-transparent to-indigo-500/20" />
              <Trophy className="w-12 h-12 sm:w-14 sm:h-14 text-amber-400 fill-amber-400/20 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]" />
            </div>
          </div>
          
          {/* Floating Confetti Badges around Trophy */}
          <div className="absolute -top-2 -right-3 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-white text-[10px] font-black uppercase tracking-wider shadow-lg animate-pulse flex items-center space-x-1">
            <Sparkles className="w-2.5 h-2.5" />
            <span>Sprint Complete!</span>
          </div>

          <div className="absolute -bottom-2 -left-3 px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-[10px] font-bold shadow flex items-center space-x-1">
            <PartyPopper className="w-2.5 h-2.5" />
            <span>21 Days</span>
          </div>
        </div>

        {/* Heading & Congratulatory Text */}
        <div className="space-y-3 max-w-xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-black uppercase tracking-widest">
            <Calendar className="w-3.5 h-3.5 text-rose-400" />
            <span>21-Day SQL Marathon Concluded</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Thank You, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-rose-400 to-cyan-300">
              {displayName}
            </span>!
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
            The official submission window for the ACM Chapter 21-Day SQL Sprint has come to a close. 
            Thank you for pushing your SQL mastery, solving challenging schema puzzles, and showing relentless daily discipline!
          </p>
        </div>

        {/* Contestant Performance Showcase Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          
          {/* Total Points */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-cyan-500/30 space-y-1 shadow-lg shadow-cyan-950/20">
            <div className="flex items-center justify-center space-x-1.5 text-cyan-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Contest XP</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-cyan-300">
              {points}
            </div>
            <p className="text-[10px] text-slate-400">Total Points Earned</p>
          </div>

          {/* Longest Streak */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-amber-500/30 space-y-1 shadow-lg shadow-amber-950/20">
            <div className="flex items-center justify-center space-x-1.5 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Flame className="w-4 h-4 fill-amber-500/20" />
              <span>Day Streak</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-400">
              {streak} Days
            </div>
            <p className="text-[10px] text-slate-400">Consistency Record</p>
          </div>

          {/* Achievement Standing */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-indigo-500/30 space-y-1 shadow-lg shadow-indigo-950/20">
            <div className="flex items-center justify-center space-x-1.5 text-indigo-400 text-xs font-bold uppercase tracking-wider">
              <Award className="w-4 h-4" />
              <span>Badge Tier</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-indigo-300 truncate">
              {streak >= 21 ? '🥇 SQL Master' : streak >= 14 ? '🥈 Advanced' : streak >= 7 ? '🥉 Achiever' : '🌟 Participant'}
            </div>
            <p className="text-[10px] text-slate-400">Chapter Distinction</p>
          </div>

        </div>

        {/* Quote / Special ACM Chapter Note */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 italic leading-relaxed">
          &ldquo;Query optimization is not just a skill—it is an art of structural thinking. Keep building, querying, and exploring.&rdquo;
          <div className="not-italic font-bold text-slate-300 mt-1 text-[11px]">
            — ACM Student Chapter Leadership Team
          </div>
        </div>

        {/* Action CTAs */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <Link
            to="/student/leaderboard"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white text-xs font-extrabold shadow-xl shadow-indigo-600/30 flex items-center justify-center space-x-2 transition transform hover:scale-105 active:scale-95"
          >
            <Trophy className="w-4 h-4" />
            <span>View Final Chapter Standings</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>

          <button
            onClick={handleShare}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold flex items-center justify-center space-x-2 transition active:scale-95"
          >
            <Share2 className="w-4 h-4 text-cyan-400" />
            <span>{copied ? 'Copied to Clipboard! 🎉' : 'Share Achievement'}</span>
          </button>

          {/* Admin shortcut if testing as Admin */}
          {isAdmin && (
            <Link
              to="/admin/dashboard"
              className="w-full sm:w-auto px-4 py-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center justify-center space-x-1.5 transition"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Admin Console</span>
            </Link>
          )}
        </div>

      </div>

    </div>
  );
};

export default ThankYouScreen;
