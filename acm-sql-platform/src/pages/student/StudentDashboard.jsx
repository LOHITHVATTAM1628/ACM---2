import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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
  Lock
} from 'lucide-react';

const StudentDashboard = () => {
  const { user, profile } = useAuth();
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

  // Compute today's active challenge or next incomplete challenge
  const activeDay = Math.min(Math.max(streak + 1, 1), 21);
  const todaysChallenge = challenges.find(c => Number(c.day_number) === activeDay) || challenges[0];

  return (
    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in-up">
      
      {/* ACM Watermark — subtle, behind hero */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none select-none z-0 overflow-hidden w-full flex justify-center"
      >
        <span
          className="font-black text-[clamp(80px,18vw,220px)] text-white/[0.025] tracking-[0.35em] leading-none"
          style={{ userSelect: 'none' }}
        >
          ACM
        </span>
      </div>

      {/* ══════════════════════════════════════════
          HERO WELCOME SECTION — redesigned
      ══════════════════════════════════════════ */}
      <div
        className="relative z-10 rounded-3xl overflow-hidden animate-fade-in-up animate-neon-border"
        style={{
          background: 'linear-gradient(135deg, #020817 0%, #0c1428 35%, #0a0e1e 65%, #060a15 100%)',
          border: '1px solid rgba(99,102,241,0.28)',
          boxShadow: '0 0 60px rgba(34,211,238,0.08), 0 0 120px rgba(99,102,241,0.06), 0 25px 50px rgba(0,0,0,0.7)',
        }}
      >
        {/* Animated sweeping background glows — NO layout impact, overflow:hidden clips them */}
        <div
          className="absolute inset-0 pointer-events-none animate-bg-sweep"
          style={{
            background: 'radial-gradient(ellipse 55% 45% at 70% 30%, rgba(59,130,246,0.10) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none animate-bg-sweep-2"
          style={{
            background: 'radial-gradient(ellipse 50% 50% at 30% 70%, rgba(139,92,246,0.09) 0%, transparent 70%)',
          }}
        />
        {/* Fixed ambient blobs */}
        <div style={{ position:'absolute', top:'-5rem', right:'-5rem', width:'20rem', height:'20rem', background:'rgba(99,102,241,0.07)', borderRadius:'9999px', filter:'blur(60px)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:'-4rem', left:'20%', width:'18rem', height:'18rem', background:'rgba(168,85,247,0.08)', borderRadius:'9999px', filter:'blur(60px)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', top:'50%', right:'25%', transform:'translateY(-50%)', width:'12rem', height:'12rem', background:'rgba(236,72,153,0.04)', borderRadius:'9999px', filter:'blur(48px)', pointerEvents:'none' }} />

        {/* Neon top hairline — electric-blue → violet → magenta */}
        <div
          className="absolute top-0 left-0 right-0 h-px pointer-events-none"
          style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(59,130,246,0.6) 25%, rgba(139,92,246,0.7) 55%, rgba(236,72,153,0.5) 80%, transparent 100%)' }}
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center gap-8 sm:gap-10 p-6 sm:p-10">

          {/* ── LEFT COLUMN ── */}
          <div className="flex-1 space-y-5 min-w-0">

            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-bold uppercase tracking-widest animate-fade-in-up"
              style={{
                background: 'rgba(99,102,241,0.10)',
                borderColor: 'rgba(99,102,241,0.40)',
                color: '#a5b4fc',
                boxShadow: '0 0 14px rgba(99,102,241,0.18), 0 0 28px rgba(139,92,246,0.08)',
              }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>ACM Chapter Student Portal</span>
            </div>

            {/* Heading */}
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-[1.1]">
              <span className="text-white">Welcome Back,&nbsp;</span>
              <br className="sm:hidden" />
              <span
                className="text-transparent bg-clip-text animate-glow-pulse"
                style={{
                  backgroundImage: 'linear-gradient(90deg, #38bdf8 0%, #6366f1 35%, #a855f7 65%, #ec4899 100%)',
                  backgroundSize: '200% auto',
                  filter: 'drop-shadow(0 0 18px rgba(99,102,241,0.55)) drop-shadow(0 0 40px rgba(168,85,247,0.25))',
                }}
              >
                B.lakshmipriya!
              </span>
              <span className="text-white"> 👋</span>
            </h1>

            {/* Supporting text */}
            <p className="text-sm text-slate-400 leading-relaxed max-w-lg">
              Continue your 21-Day SQL Contest sprint, build your daily streak, and master SQL through daily challenges, practice, and problem-solving.
            </p>

            {/* SQL Quote */}
            <div
              className="flex items-start gap-3 p-4 rounded-2xl animate-fade-in-slow"
              style={{
                background: 'linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(168,85,247,0.04) 100%)',
                border: '1px solid rgba(139,92,246,0.22)',
                boxShadow: '0 0 20px rgba(139,92,246,0.08), 0 0 40px rgba(99,102,241,0.05)',
              }}
            >
              <svg className="w-5 h-5 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" stroke="rgba(34,211,238,0.5)" strokeWidth="1.5"/>
                <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" stroke="rgba(139,92,246,0.5)" strokeWidth="1.5"/>
              </svg>
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(148,163,184,0.9)' }}>
                Every query you write makes you better.{' '}
                <span style={{ color: 'rgba(103,232,249,0.75)' }}>
                  Keep learning. Keep querying. Keep improving.
                </span>
              </p>
            </div>

            {/* Streak + XP badges */}
            <div className="flex flex-wrap items-center gap-3">
              <div
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 hover:scale-105"
                style={{
                  background: 'rgba(251,191,36,0.08)',
                  border: '1px solid rgba(251,191,36,0.25)',
                  color: '#fbbf24',
                  boxShadow: '0 0 12px rgba(251,191,36,0.08)',
                }}
              >
                <Flame className="w-4 h-4 animate-pulse" style={{ filter: 'drop-shadow(0 0 4px rgba(251,191,36,0.6))' }} />
                <span>{streak} Day Active Streak</span>
              </div>

              <div
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 hover:scale-105"
                style={{
                  background: 'rgba(34,211,238,0.08)',
                  border: '1px solid rgba(34,211,238,0.30)',
                  color: '#67e8f9',
                  boxShadow: '0 0 16px rgba(34,211,238,0.14), 0 0 32px rgba(99,102,241,0.07)',
                }}
              >
                <Sparkles className="w-4 h-4" style={{ filter: 'drop-shadow(0 0 5px rgba(34,211,238,0.7))' }} />
                <span>{points} Total XP Points</span>
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN — SQL/ACM 3D Holographic Database ── */}
          <div
            className="shrink-0 flex items-center justify-center lg:justify-end"
            style={{
              minWidth: '200px',
              filter: 'drop-shadow(0 0 18px rgba(99,102,241,0.50)) drop-shadow(0 0 36px rgba(34,211,238,0.20)) drop-shadow(0 0 60px rgba(168,85,247,0.15))',
            }}
          >
            {/* Perspective scene wrapper */}
            <div className="db-scene w-44 sm:w-52 lg:w-56" style={{ height: '260px' }}>
              {/* Spinner: rotates Y-axis with subtle float */}
              <div className="db-spinner" style={{ width: '100%', height: '100%' }}>

                {/* ── FRONT FACE: SQL ── */}
                <div className="db-face db-face-front">
                  <svg viewBox="0 0 220 260" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <defs>
                      <linearGradient id="cylTopF" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%"   stopColor="#38bdf8" stopOpacity="0.95"/>
                        <stop offset="50%"  stopColor="#818cf8" stopOpacity="0.95"/>
                        <stop offset="100%" stopColor="#c084fc" stopOpacity="0.90"/>
                      </linearGradient>
                      <linearGradient id="cylBodyF" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%"   stopColor="#0b1733"/>
                        <stop offset="100%" stopColor="#05090f"/>
                      </linearGradient>
                      <linearGradient id="cylShineF" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%"   stopColor="#6366f1" stopOpacity="0.18"/>
                        <stop offset="50%"  stopColor="#a855f7" stopOpacity="0.08"/>
                        <stop offset="100%" stopColor="#ec4899" stopOpacity="0.05"/>
                      </linearGradient>
                      <filter id="neonGlowF">
                        <feGaussianBlur stdDeviation="3.5" result="blur"/>
                        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                      </filter>
                      <filter id="softGlowF">
                        <feGaussianBlur stdDeviation="2" result="blur"/>
                        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                      </filter>
                    </defs>

                    {/* Outer glow ring */}
                    <ellipse cx="110" cy="72" rx="76" ry="24" fill="none" stroke="rgba(99,102,241,0.18)" strokeWidth="16"
                      style={{ animation: 'neonRingPulse 4s ease-in-out infinite' }}/>
                    {/* Body */}
                    <rect x="34" y="72" width="152" height="130" rx="4" fill="url(#cylBodyF)" stroke="rgba(99,102,241,0.28)" strokeWidth="1"/>
                    <rect x="34" y="72" width="152" height="130" rx="4" fill="url(#cylShineF)"/>
                    {/* Top ellipses */}
                    <ellipse cx="110" cy="72" rx="76" ry="24" fill="url(#cylTopF)" opacity="0.85"/>
                    <ellipse cx="110" cy="72" rx="60" ry="18" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
                    <ellipse cx="110" cy="72" rx="40" ry="12" fill="rgba(34,211,238,0.12)"/>
                    {/* DB label on top */}
                    <text x="110" y="77" textAnchor="middle" fontFamily="monospace" fontWeight="900" fontSize="13" fill="white" opacity="0.9" filter="url(#neonGlowF)">DATABASE</text>
                    {/* Ring lines */}
                    <ellipse cx="110" cy="110" rx="76" ry="12" fill="none" stroke="rgba(34,211,238,0.18)" strokeWidth="1"/>
                    <ellipse cx="110" cy="148" rx="76" ry="12" fill="none" stroke="rgba(129,140,248,0.18)" strokeWidth="1"/>
                    <ellipse cx="110" cy="186" rx="76" ry="12" fill="none" stroke="rgba(167,139,250,0.14)" strokeWidth="1"/>

                    {/* Large SQL label — front identity */}
                    <text x="110" y="148" textAnchor="middle" fontFamily="monospace" fontWeight="900" fontSize="38"
                      fill="url(#cylTopF)" opacity="0.85" filter="url(#neonGlowF)">SQL</text>

                    {/* Query lines below — subtle flicker */}
                    <g filter="url(#softGlowF)" style={{ animation: 'sqlFlicker 8s ease-in-out infinite' }}>
                      <text x="54" y="172" fontFamily="monospace" fontSize="7" fill="#38bdf8" opacity="0.80">SELECT * FROM students</text>
                      <text x="54" y="183" fontFamily="monospace" fontSize="7" fill="#c084fc" opacity="0.80">ORDER BY xp DESC</text>
                      <text x="54" y="194" fontFamily="monospace" fontSize="7" fill="#f0abfc" opacity="0.65">LIMIT 21;</text>
                    </g>

                    {/* Bottom ellipse */}
                    <ellipse cx="110" cy="202" rx="76" ry="24" fill="none" stroke="rgba(34,211,238,0.12)" strokeWidth="1"/>

                    {/* Orbiting particles */}
                    <circle cx="30"  cy="100" r="5"   fill="rgba(236,72,153,0.80)"  filter="url(#neonGlowF)" style={{ animation: 'particleOrbit1 9s ease-in-out infinite' }}/>
                    <circle cx="190" cy="140" r="4"   fill="rgba(168,85,247,0.80)"  filter="url(#neonGlowF)" style={{ animation: 'particleOrbit2 11s ease-in-out infinite' }}/>
                    <circle cx="20"  cy="165" r="3.5" fill="rgba(99,102,241,0.75)"  filter="url(#neonGlowF)" style={{ animation: 'particleOrbit1 13s ease-in-out infinite reverse' }}/>
                    <circle cx="200" cy="90"  r="3.5" fill="rgba(56,189,248,0.75)"  filter="url(#neonGlowF)" style={{ animation: 'particleOrbit2 7s ease-in-out infinite reverse' }}/>
                  </svg>

                  {/* Holographic shimmer overlay */}
                  <div
                    className="db-holo-shimmer absolute inset-0 rounded-lg overflow-hidden"
                    style={{ background: 'linear-gradient(105deg, transparent 40%, rgba(139,92,246,0.15) 50%, transparent 60%)' }}
                  />
                </div>{/* end front face */}

                {/* ── BACK FACE: ACM ── */}
                <div className="db-face db-face-back">
                  <svg viewBox="0 0 220 260" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <defs>
                      <linearGradient id="cylTopB" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%"   stopColor="#ec4899" stopOpacity="0.95"/>
                        <stop offset="50%"  stopColor="#a855f7" stopOpacity="0.95"/>
                        <stop offset="100%" stopColor="#6366f1" stopOpacity="0.90"/>
                      </linearGradient>
                      <linearGradient id="cylBodyB" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%"   stopColor="#1a0b33"/>
                        <stop offset="100%" stopColor="#0a0515"/>
                      </linearGradient>
                      <linearGradient id="cylShineB" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%"   stopColor="#ec4899" stopOpacity="0.18"/>
                        <stop offset="50%"  stopColor="#a855f7" stopOpacity="0.10"/>
                        <stop offset="100%" stopColor="#6366f1" stopOpacity="0.05"/>
                      </linearGradient>
                      <filter id="neonGlowB">
                        <feGaussianBlur stdDeviation="3.5" result="blur"/>
                        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                      </filter>
                      <filter id="softGlowB">
                        <feGaussianBlur stdDeviation="2" result="blur"/>
                        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                      </filter>
                    </defs>

                    {/* Outer glow ring */}
                    <ellipse cx="110" cy="72" rx="76" ry="24" fill="none" stroke="rgba(168,85,247,0.20)" strokeWidth="16"
                      style={{ animation: 'neonRingPulse 4s ease-in-out infinite 2s' }}/>
                    {/* Body */}
                    <rect x="34" y="72" width="152" height="130" rx="4" fill="url(#cylBodyB)" stroke="rgba(168,85,247,0.30)" strokeWidth="1"/>
                    <rect x="34" y="72" width="152" height="130" rx="4" fill="url(#cylShineB)"/>
                    {/* Top ellipses */}
                    <ellipse cx="110" cy="72" rx="76" ry="24" fill="url(#cylTopB)" opacity="0.85"/>
                    <ellipse cx="110" cy="72" rx="60" ry="18" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
                    <ellipse cx="110" cy="72" rx="40" ry="12" fill="rgba(168,85,247,0.15)"/>
                    {/* DB label on top */}
                    <text x="110" y="77" textAnchor="middle" fontFamily="monospace" fontWeight="900" fontSize="13" fill="white" opacity="0.9" filter="url(#neonGlowB)">DATABASE</text>
                    {/* Ring lines */}
                    <ellipse cx="110" cy="110" rx="76" ry="12" fill="none" stroke="rgba(236,72,153,0.18)" strokeWidth="1"/>
                    <ellipse cx="110" cy="148" rx="76" ry="12" fill="none" stroke="rgba(168,85,247,0.18)" strokeWidth="1"/>
                    <ellipse cx="110" cy="186" rx="76" ry="12" fill="none" stroke="rgba(99,102,241,0.14)" strokeWidth="1"/>

                    {/* Large ACM label — back identity */}
                    <text x="110" y="148" textAnchor="middle" fontFamily="monospace" fontWeight="900" fontSize="38"
                      fill="url(#cylTopB)" opacity="0.85" filter="url(#neonGlowB)">ACM</text>

                    {/* Tagline */}
                    <g filter="url(#softGlowB)" style={{ animation: 'sqlFlicker 8s ease-in-out infinite 4s' }}>
                      <text x="110" y="172" textAnchor="middle" fontFamily="monospace" fontSize="7.5" fill="#f0abfc" opacity="0.80">ACM Chapter</text>
                      <text x="110" y="184" textAnchor="middle" fontFamily="monospace" fontSize="7.5" fill="#c084fc" opacity="0.75">Practice Portal</text>
                      <text x="110" y="196" textAnchor="middle" fontFamily="monospace" fontSize="7.5" fill="#a5b4fc" opacity="0.65">21-Day SQL Sprint</text>
                    </g>

                    {/* Bottom ellipse */}
                    <ellipse cx="110" cy="202" rx="76" ry="24" fill="none" stroke="rgba(168,85,247,0.14)" strokeWidth="1"/>

                    {/* Orbiting particles — offset timing for variety */}
                    <circle cx="190" cy="100" r="5"   fill="rgba(236,72,153,0.80)"  filter="url(#neonGlowB)" style={{ animation: 'particleOrbit2 9s ease-in-out infinite 1s' }}/>
                    <circle cx="30"  cy="140" r="4"   fill="rgba(168,85,247,0.80)"  filter="url(#neonGlowB)" style={{ animation: 'particleOrbit1 11s ease-in-out infinite 2s' }}/>
                    <circle cx="200" cy="165" r="3.5" fill="rgba(99,102,241,0.75)"  filter="url(#neonGlowB)" style={{ animation: 'particleOrbit2 13s ease-in-out infinite reverse' }}/>
                    <circle cx="20"  cy="90"  r="3.5" fill="rgba(56,189,248,0.75)"  filter="url(#neonGlowB)" style={{ animation: 'particleOrbit1 7s ease-in-out infinite reverse 3s' }}/>
                  </svg>

                  {/* Holographic shimmer overlay */}
                  <div
                    className="db-holo-shimmer absolute inset-0 rounded-lg overflow-hidden"
                    style={{ background: 'linear-gradient(105deg, transparent 40%, rgba(236,72,153,0.12) 50%, transparent 60%)', animationDelay: '5s' }}
                  />
                </div>{/* end back face */}

              </div>{/* end db-spinner */}
            </div>{/* end db-scene */}
          </div>{/* end right column */}

        </div>{/* end flex row */}
      </div>{/* end Hero */}

      {/* Grid: 21-Day Contest Overview & Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* ══ Left Column: 21-Day Contest Sprint (8 cols) ══ */}
        <div className="lg:col-span-8 space-y-5">

          {/* Section header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Glowing calendar icon */}
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: 'linear-gradient(135deg, rgba(34,211,238,0.12), rgba(99,102,241,0.15))',
                  border: '1px solid rgba(34,211,238,0.25)',
                  boxShadow: '0 0 12px rgba(34,211,238,0.20)',
                }}
              >
                <Calendar className="w-4 h-4" style={{ color: '#67e8f9', filter: 'drop-shadow(0 0 4px rgba(34,211,238,0.7))' }} />
              </div>
              <div>
                <h2
                  className="text-sm font-black uppercase tracking-widest"
                  style={{
                    background: 'linear-gradient(90deg, #e2e8f0, #a5b4fc)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  21-Day SQL Contest Sprint
                </h2>
                {/* Neon underline */}
                <div
                  className="h-px mt-0.5 w-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, rgba(34,211,238,0.5), rgba(99,102,241,0.4), transparent)' }}
                />
              </div>
            </div>

            {/* "View Full Contest" link with animated arrow */}
            <Link
              to="/student/contest"
              className="group flex items-center gap-1.5 text-xs font-bold transition-all duration-200"
              style={{ color: '#67e8f9' }}
            >
              <span className="group-hover:text-white transition-colors duration-200">View Full Contest</span>
              <ArrowRight
                className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1"
                style={{ filter: 'drop-shadow(0 0 3px rgba(34,211,238,0.5))' }}
              />
            </Link>
          </div>

          {/* Loading state */}
          {loading ? (
            <div
              className="py-16 flex justify-center rounded-3xl"
              style={{
                background: 'rgba(6,8,20,0.60)',
                border: '1px solid rgba(99,102,241,0.15)',
              }}
            >
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#67e8f9' }} />
            </div>
          ) : (
            <div className="relative">
              {/* Subtle progression connector line behind cards */}
              <div
                aria-hidden="true"
                className="absolute top-1/2 left-0 right-0 h-px -translate-y-1/2 pointer-events-none z-0"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(34,211,238,0.08) 15%, rgba(99,102,241,0.12) 50%, rgba(168,85,247,0.08) 85%, transparent)',
                }}
              />

              {/* Cards grid */}
              <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {challenges.map((c) => {
                  const day = parseInt(c.day_number, 10) || 1;
                  const isUnlocked = Boolean(c.is_unlocked);
                  const isCompleted = isUnlocked && streak >= day;
                  const isCurrent = isUnlocked && !isCompleted;

                  // ── Difficulty badge color system ──
                  const diff = (c.difficulty || 'Easy').toLowerCase();
                  const diffStyle = diff === 'hard'
                    ? { color: '#f472b6', border: '1px solid rgba(244,114,182,0.35)', background: 'rgba(244,114,182,0.08)', glow: 'rgba(244,114,182,0.4)' }
                    : diff === 'medium'
                    ? { color: '#fbbf24', border: '1px solid rgba(251,191,36,0.35)', background: 'rgba(251,191,36,0.08)', glow: 'rgba(251,191,36,0.4)' }
                    : { color: '#34d399', border: '1px solid rgba(52,211,153,0.35)', background: 'rgba(52,211,153,0.08)', glow: 'rgba(52,211,153,0.4)' };

                  // ── LOCKED card ──
                  if (!isUnlocked) {
                    return (
                      <div
                        key={c.id || day}
                        className="sprint-card-locked p-3 rounded-2xl flex flex-col justify-between cursor-not-allowed select-none"
                        style={{
                          background: 'linear-gradient(160deg, rgba(8,10,20,0.85), rgba(12,14,28,0.75))',
                          border: '1px solid rgba(251,191,36,0.12)',
                          boxShadow: '0 0 8px rgba(0,0,0,0.4)',
                          minHeight: '88px',
                        }}
                      >
                        {/* Day label + lock */}
                        <div className="flex justify-between items-center">
                          <span
                            className="text-[10px] font-black font-mono"
                            style={{ color: 'rgba(100,116,139,0.7)' }}
                          >
                            D{String(day).padStart(2,'0')}
                          </span>
                          <Lock
                            className="w-3 h-3 lock-gold-pulse"
                            style={{ color: '#d97706' }}
                          />
                        </div>

                        {/* Locked label */}
                        <div className="flex-1 flex items-center justify-center my-1">
                          <span
                            className="text-[10px] font-bold tracking-wide"
                            style={{ color: 'rgba(100,116,139,0.6)' }}
                          >
                            LOCKED
                          </span>
                        </div>

                        {/* XP — muted */}
                        <span
                          className="text-[9px] font-bold text-center block"
                          style={{ color: 'rgba(251,191,36,0.35)' }}
                        >
                          +{c.points} XP
                        </span>
                      </div>
                    );
                  }

                  // ── COMPLETED card ──
                  if (isCompleted) {
                    return (
                      <Link
                        key={c.id || day}
                        to={`/student/contest/day/${day}`}
                        className="sprint-card-unlocked p-3 rounded-2xl flex flex-col justify-between"
                        style={{
                          background: 'linear-gradient(160deg, rgba(6,40,30,0.85), rgba(5,30,22,0.80))',
                          border: '1px solid rgba(52,211,153,0.30)',
                          boxShadow: '0 0 12px rgba(52,211,153,0.08)',
                          minHeight: '88px',
                          animationDuration: '5s',
                        }}
                      >
                        {/* Day + check */}
                        <div className="flex justify-between items-center relative z-10">
                          <span
                            className="text-[10px] font-black font-mono"
                            style={{ color: '#6ee7b7' }}
                          >
                            D{String(day).padStart(2,'0')}
                          </span>
                          <CheckCircle2
                            className="w-3.5 h-3.5"
                            style={{ color: '#34d399', filter: 'drop-shadow(0 0 4px rgba(52,211,153,0.6))' }}
                          />
                        </div>

                        {/* Difficulty badge */}
                        <div className="flex-1 flex items-center justify-center my-1 relative z-10">
                          <span
                            className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md"
                            style={{
                              color: '#34d399',
                              background: 'rgba(52,211,153,0.12)',
                              border: '1px solid rgba(52,211,153,0.30)',
                            }}
                          >
                            {c.difficulty || 'Easy'}
                          </span>
                        </div>

                        {/* XP */}
                        <span
                          className="text-[9px] font-bold text-center block relative z-10"
                          style={{ color: 'rgba(110,231,183,0.7)' }}
                        >
                          +{c.points} XP ✓
                        </span>
                      </Link>
                    );
                  }

                  // ── CURRENT / ACTIVE UNLOCKED card ──
                  return (
                    <Link
                      key={c.id || day}
                      to={`/student/contest/day/${day}`}
                      className="sprint-card-unlocked p-3 rounded-2xl flex flex-col justify-between"
                      style={{
                        background: 'linear-gradient(160deg, rgba(10,14,36,0.92), rgba(14,10,30,0.88))',
                        border: '1px solid rgba(99,102,241,0.45)',
                        boxShadow: '0 0 14px rgba(34,211,238,0.10), 0 0 28px rgba(99,102,241,0.08)',
                        minHeight: '88px',
                      }}
                    >
                      {/* Day label + animated dot */}
                      <div className="flex justify-between items-center relative z-10">
                        <span
                          className="text-[10px] font-black font-mono"
                          style={{
                            background: 'linear-gradient(90deg, #67e8f9, #a5b4fc)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                          }}
                        >
                          D{String(day).padStart(2,'0')}
                        </span>
                        {/* Animated active dot */}
                        <span
                          className="w-2 h-2 rounded-full dot-pulse"
                          style={{
                            background: '#67e8f9',
                            boxShadow: '0 0 6px rgba(34,211,238,0.8)',
                          }}
                        />
                      </div>

                      {/* Difficulty badge — color-coded */}
                      <div className="flex-1 flex items-center justify-center my-1 relative z-10">
                        <span
                          className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md"
                          style={{
                            color: diffStyle.color,
                            background: diffStyle.background,
                            border: diffStyle.border,
                            textShadow: `0 0 6px ${diffStyle.glow}`,
                          }}
                        >
                          {c.difficulty || 'Easy'}
                        </span>
                      </div>

                      {/* XP with glow */}
                      <span
                        className="text-[9px] font-bold text-center block relative z-10"
                        style={{
                          color: '#67e8f9',
                          textShadow: '0 0 6px rgba(34,211,238,0.4)',
                        }}
                      >
                        +{c.points} XP
                      </span>
                    </Link>
                  );
                })}
              </div>
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
