import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Database, 
  Flame, 
  Trophy, 
  Layers, 
  Calendar, 
  LogOut, 
  Menu, 
  X, 
  Sparkles,
  ChevronDown,
  LayoutDashboard,
  User
} from 'lucide-react';

const StudentLayout = () => {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileRef = useRef(null);

  // Close profile dropdown on click outside
  useEffect(() => {
    if (!profileDropdownOpen) return;
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileDropdownOpen]);

  const handleLogout = async () => {
    await logout();
    setProfileDropdownOpen(false);
    navigate('/auth');
  };

  const displayName = profile?.name || profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Student';
  const streak = profile?.streak_count ?? 0;
  const points = profile?.total_points ?? 0;

  const studentNavLinks = [
    { name: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
    { name: '21-Day Contest', path: '/student/contest', icon: Calendar, highlight: true },
    { name: 'Leaderboard', path: '/student/leaderboard', icon: Trophy },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      
      {/* Student Top Navigation Bar — Premium Neon */}
      <nav
        className="sticky top-0 z-50 w-full nav-entrance nav-sweep-bg"
        style={{
          background: 'linear-gradient(180deg, rgba(6,8,20,0.96) 0%, rgba(8,10,24,0.92) 100%)',
          borderBottom: '1px solid rgba(99,102,241,0.18)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 1px 30px rgba(34,211,238,0.04), 0 4px 24px rgba(0,0,0,0.5)',
        }}
      >
        {/* Inner content — above ::before sweep */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* ── Brand / Logo ── */}
            <div className="flex items-center space-x-3">
              <Link
                to="/student/dashboard"
                className="group flex items-center space-x-2.5 text-slate-100 transition duration-200"
              >
                {/* Icon container — breathing neon glow */}
                <div
                  className="logo-breathe w-10 h-10 rounded-xl p-0.5 transition-all duration-300"
                  style={{
                    background: 'linear-gradient(135deg, #38bdf8, #6366f1, #a855f7)',
                    boxShadow: '0 0 8px rgba(34,211,238,0.35), 0 0 20px rgba(99,102,241,0.20)',
                  }}
                >
                  <div className="w-full h-full rounded-[10px] flex items-center justify-center"
                    style={{ background: 'rgba(6,8,20,0.92)' }}>
                    <Database
                      className="w-5 h-5 group-hover:scale-110 transition-transform duration-200"
                      style={{ color: '#67e8f9', filter: 'drop-shadow(0 0 5px rgba(34,211,238,0.7))' }}
                    />
                  </div>
                </div>

                {/* Text */}
                <div className="flex flex-col">
                  <div className="flex items-center space-x-1.5">
                    <span
                      className="font-extrabold tracking-wider text-transparent bg-clip-text text-lg"
                      style={{ backgroundImage: 'linear-gradient(90deg, #38bdf8, #818cf8, #c084fc)' }}
                    >
                      ACM SQL
                    </span>
                    <span
                      className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded"
                      style={{
                        background: 'rgba(99,102,241,0.12)',
                        border: '1px solid rgba(99,102,241,0.35)',
                        color: '#a5b4fc',
                        boxShadow: '0 0 8px rgba(99,102,241,0.15)',
                      }}
                    >
                      Student
                    </span>
                  </div>
                  <span className="text-[11px] font-medium -mt-0.5 tracking-tight" style={{ color: 'rgba(148,163,184,0.75)' }}>
                    Interactive Practice Portal
                  </span>
                </div>
              </Link>
            </div>

            {/* ── Desktop Navigation Links ── */}
            <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
              {studentNavLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    className={({ isActive }) =>
                      `flex items-center space-x-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 relative group ${
                        isActive
                          ? 'text-white'
                          : 'text-slate-400 hover:text-white'
                      }`
                    }
                    style={({ isActive }) => isActive ? {
                      background: 'linear-gradient(135deg, rgba(56,189,248,0.12) 0%, rgba(99,102,241,0.18) 50%, rgba(168,85,247,0.12) 100%)',
                      border: '1px solid rgba(99,102,241,0.40)',
                      boxShadow: '0 0 16px rgba(99,102,241,0.18), 0 0 32px rgba(34,211,238,0.08)',
                    } : {
                      background: 'transparent',
                      border: '1px solid transparent',
                    }}
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          className="w-4 h-4 transition-all duration-200"
                          style={{
                            color: isActive ? '#67e8f9' : (link.highlight ? '#a5b4fc' : '#94a3b8'),
                            filter: isActive ? 'drop-shadow(0 0 4px rgba(34,211,238,0.6))' : 'none',
                          }}
                        />
                        <span>{link.name}</span>
                        {/* Hover underline glow */}
                        {!isActive && (
                          <span
                            className="absolute bottom-0 left-1/2 -translate-x-1/2 h-px w-0 group-hover:w-3/4 transition-all duration-300 rounded-full"
                            style={{ background: 'linear-gradient(90deg, #38bdf8, #a855f7)' }}
                          />
                        )}
                        {link.highlight && (
                          <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>

            {/* ── Desktop Right User Controls ── */}
            <div className="hidden md:flex items-center space-x-3">

              {/* Streak Badge */}
              <div
                title={`${streak} Day Streak! Keep practicing daily.`}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 hover:scale-105"
                style={{
                  background: 'rgba(251,191,36,0.08)',
                  border: '1px solid rgba(251,191,36,0.25)',
                  color: '#fbbf24',
                  boxShadow: '0 0 10px rgba(251,191,36,0.08)',
                }}
              >
                <Flame
                  className="w-3.5 h-3.5 animate-pulse"
                  style={{ filter: 'drop-shadow(0 0 4px rgba(251,191,36,0.7))' }}
                />
                <span>{streak}d</span>
              </div>

              {/* XP Badge */}
              <div
                title={`${points} Total XP / Points`}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 hover:scale-105"
                style={{
                  background: 'rgba(34,211,238,0.08)',
                  border: '1px solid rgba(34,211,238,0.25)',
                  color: '#67e8f9',
                  boxShadow: '0 0 10px rgba(34,211,238,0.08)',
                }}
              >
                <Sparkles
                  className="w-3.5 h-3.5"
                  style={{ filter: 'drop-shadow(0 0 4px rgba(34,211,238,0.6))' }}
                />
                <span>{points} XP</span>
              </div>

              {/* Profile dropdown */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center space-x-2.5 p-1.5 pr-3 rounded-full transition-all duration-200 focus:outline-none hover:scale-105"
                  style={{
                    background: 'rgba(15,18,36,0.85)',
                    border: '1px solid rgba(99,102,241,0.30)',
                    boxShadow: '0 0 12px rgba(99,102,241,0.12)',
                  }}
                >
                  {/* Avatar */}
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs"
                    style={{
                      background: 'linear-gradient(135deg, #6366f1, #38bdf8)',
                      boxShadow: '0 0 8px rgba(99,102,241,0.45)',
                    }}
                  >
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-semibold text-slate-200 max-w-[100px] truncate">
                    {displayName}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown */}
                {profileDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 rounded-2xl py-2 z-50 animate-fade-in-up"
                    style={{
                      background: 'rgba(8,10,24,0.97)',
                      border: '1px solid rgba(99,102,241,0.25)',
                      boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 30px rgba(99,102,241,0.08)',
                      backdropFilter: 'blur(20px)',
                    }}
                  >
                    <div className="px-4 py-2.5" style={{ borderBottom: '1px solid rgba(99,102,241,0.12)' }}>
                      <p className="text-xs font-semibold text-slate-200 truncate">{displayName}</p>
                      <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                      <span
                        className="inline-block mt-1.5 px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-md"
                        style={profile?.role === 'admin' ? {
                          background: 'rgba(244,63,94,0.15)',
                          border: '1px solid rgba(244,63,94,0.30)',
                          color: '#fda4af',
                        } : {
                          background: 'rgba(99,102,241,0.15)',
                          border: '1px solid rgba(99,102,241,0.30)',
                          color: '#a5b4fc',
                        }}
                      >
                        {profile?.role === 'admin' ? 'ADMIN' : 'STUDENT'}
                      </span>
                    </div>

                    {profile?.role === 'admin' && (
                      <Link
                        to="/admin/dashboard"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="w-full text-left flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold transition-colors"
                        style={{ color: '#fda4af', borderBottom: '1px solid rgba(99,102,241,0.10)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(244,63,94,0.08)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <span>⚙️ Switch to Admin Console</span>
                      </Link>
                    )}

                    <button
                      onClick={handleLogout}
                      className="w-full text-left flex items-center space-x-2 px-4 py-2.5 text-xs transition-colors"
                      style={{ color: '#f87171' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(244,63,94,0.08)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* ── Mobile: streak + hamburger ── */}
            <div className="flex md:hidden items-center space-x-2">
              <div
                className="flex items-center space-x-1.5 px-2 py-1 rounded-full text-xs font-bold"
                style={{
                  background: 'rgba(251,191,36,0.08)',
                  border: '1px solid rgba(251,191,36,0.25)',
                  color: '#fbbf24',
                }}
              >
                <Flame className="w-3.5 h-3.5" style={{ filter: 'drop-shadow(0 0 3px rgba(251,191,36,0.6))' }} />
                <span>{streak}d</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl transition-all duration-200 focus:outline-none"
                style={{
                  background: 'rgba(99,102,241,0.10)',
                  border: '1px solid rgba(99,102,241,0.25)',
                  color: '#a5b4fc',
                }}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>

          </div>
        </div>

        {/* ── Mobile Menu Dropdown ── */}
        {mobileMenuOpen && (
          <div
            className="md:hidden px-4 pt-3 pb-5 space-y-2 relative z-10"
            style={{
              borderTop: '1px solid rgba(99,102,241,0.15)',
              background: 'rgba(6,8,20,0.97)',
              backdropFilter: 'blur(20px)',
            }}
          >
            {studentNavLinks.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive ? 'text-white' : 'text-slate-400 hover:text-white'
                    }`
                  }
                  style={({ isActive }) => isActive ? {
                    background: 'linear-gradient(135deg, rgba(56,189,248,0.10), rgba(99,102,241,0.16))',
                    border: '1px solid rgba(99,102,241,0.35)',
                  } : {
                    background: 'transparent',
                    border: '1px solid transparent',
                  }}
                >
                  {({ isActive }) => (
                    <>
                      <Icon className="w-4 h-4" style={{ color: isActive ? '#67e8f9' : '#94a3b8' }} />
                      <span>{link.name}</span>
                    </>
                  )}
                </NavLink>
              );
            })}

            {/* Mobile profile strip */}
            <div className="pt-3 mt-2 space-y-3" style={{ borderTop: '1px solid rgba(99,102,241,0.12)' }}>
              <div className="flex items-center space-x-3 px-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
                  style={{
                    background: 'linear-gradient(135deg, #6366f1, #38bdf8)',
                    boxShadow: '0 0 8px rgba(99,102,241,0.4)',
                  }}
                >
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-200">{displayName}</p>
                  <p className="text-[11px] text-slate-400">{user?.email}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2 px-2">
                <div
                  className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                  style={{
                    background: 'rgba(34,211,238,0.08)',
                    border: '1px solid rgba(34,211,238,0.25)',
                    color: '#67e8f9',
                  }}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{points} Total XP</span>
                </div>
              </div>

              <button
                onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors"
                style={{
                  background: 'rgba(244,63,94,0.08)',
                  border: '1px solid rgba(244,63,94,0.20)',
                  color: '#fca5a5',
                }}
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Main Student Portal Content */}
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>

    </div>
  );
};

export default StudentLayout;
