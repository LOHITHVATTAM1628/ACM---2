import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
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
  ShieldCheck,
  Settings
} from 'lucide-react';

const Navbar = () => {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setProfileDropdownOpen(false);
    navigate('/auth');
  };

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Member';
  const streak = profile?.streak_count ?? 0;
  const points = profile?.total_points ?? 0;
  const role = profile?.role || 'student';
  const isAdmin = role === 'admin';

  // Navigation links - always rendered for everyone
  const navLinks = [
    { name: '21-Day Contest', path: '/contest', icon: Calendar, highlight: true },
    { name: 'Leaderboard', path: '/leaderboard', icon: Trophy },
    { name: '⚙️ Admin Portal', path: '/admin', icon: ShieldCheck, isAdminBadge: true },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-900/85 backdrop-blur-md transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand / Logo */}
          <div className="flex items-center space-x-3">
            <Link 
              to="/" 
              className="group flex items-center space-x-2.5 text-slate-100 transition duration-200"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/25 group-hover:shadow-cyan-500/35 transition-all">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Database className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center space-x-1.5">
                  <span className="font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-300 to-teal-300 text-lg">
                    ACM SQL
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    Chapter
                  </span>
                </div>
                <span className="text-[11px] font-medium text-slate-400 -mt-1 tracking-tight">
                  Learning & Contest Platform
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links (Always includes Admin Portal) */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.path}
                  to={link.path}
                  className={({ isActive }) =>
                    `flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 relative ${
                      link.isAdminBadge
                        ? isActive
                          ? 'text-rose-300 bg-rose-950/50 border border-rose-500/40 shadow-sm shadow-rose-500/10'
                          : 'text-rose-300 hover:text-rose-200 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30'
                        : isActive
                        ? 'text-cyan-300 bg-slate-800/90 shadow-sm border border-cyan-500/30'
                        : link.highlight
                        ? 'text-indigo-300 hover:text-white bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-500/20'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`
                  }
                >
                  <Icon className={`w-4 h-4 ${link.isAdminBadge ? 'text-rose-400' : ''}`} />
                  <span>{link.name}</span>
                  {link.highlight && (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                    </span>
                  )}
                  {link.isAdminBadge && (
                    <span className="text-[9px] uppercase font-bold tracking-widest px-1 py-0.2 rounded bg-rose-500/30 text-rose-200 border border-rose-500/40">
                      ADMIN
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>

          {/* Desktop Right User Controls */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                {/* Streak Badge */}
                <div 
                  title={`${streak} Day Streak! Keep practicing daily.`}
                  className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold shadow-inner"
                >
                  <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse fill-amber-500/30" />
                  <span>{streak}d</span>
                </div>

                {/* Points Badge */}
                <div 
                  title={`${points} Total XP / Points`}
                  className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{points} pts</span>
                </div>

                {/* Profile dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center space-x-2.5 p-1.5 pr-2.5 rounded-full bg-slate-800/80 border border-slate-700/80 hover:border-slate-600 hover:bg-slate-800 transition-all focus:outline-none"
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-md ${
                      isAdmin ? 'bg-gradient-to-br from-rose-500 to-indigo-600 ring-2 ring-rose-500/30' : 'bg-gradient-to-br from-indigo-500 to-cyan-500'
                    }`}>
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs font-semibold text-slate-200 max-w-[100px] truncate">
                      {displayName}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900/95 backdrop-blur-lg border border-slate-700/80 shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-4 py-2.5 border-b border-slate-800">
                        <p className="text-xs font-semibold text-slate-200 truncate">
                          {displayName}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                        <span className={`inline-block mt-1.5 px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-md border ${
                          isAdmin 
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                            : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                        }`}>
                          {role}
                        </span>
                      </div>

                      {/* Admin Portal link in dropdown */}
                      <Link
                        to="/admin"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="w-full text-left flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/10 transition-colors border-b border-slate-800"
                      >
                        <ShieldCheck className="w-4 h-4 text-rose-400" />
                        <span>⚙️ Admin Portal</span>
                      </Link>

                      <button
                        onClick={handleLogout}
                        className="w-full text-left flex items-center space-x-2 px-4 py-2.5 text-xs text-slate-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/auth"
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/auth"
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 shadow-md shadow-indigo-600/30 hover:shadow-cyan-500/40 transition-all duration-200 transform hover:-translate-y-0.5"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center space-x-2">
            {user && (
              <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
                <Flame className="w-3.5 h-3.5 fill-amber-500/30" />
                <span>{streak}d</span>
              </div>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown (Always includes Admin Portal) */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-900/95 backdrop-blur-xl px-4 pt-3 pb-5 space-y-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                    link.isAdminBadge
                      ? isActive
                        ? 'text-rose-300 bg-rose-950/60 border border-rose-500/40'
                        : 'text-rose-300 bg-rose-500/10 border border-rose-500/30'
                      : isActive
                      ? 'text-cyan-300 bg-slate-800 border border-cyan-500/30'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`
                }
              >
                <Icon className={`w-4 h-4 ${link.isAdminBadge ? 'text-rose-400' : ''}`} />
                <span>{link.name}</span>
                {link.isAdminBadge && (
                  <span className="text-[9px] uppercase font-bold tracking-widest px-1 py-0.2 rounded bg-rose-500/30 text-rose-200 ml-auto border border-rose-500/40">
                    ADMIN
                  </span>
                )}
              </NavLink>
            );
          })}

          <div className="pt-3 mt-2 border-t border-slate-800">
            {user ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-3 px-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs ${
                    isAdmin ? 'bg-gradient-to-tr from-rose-500 to-indigo-600' : 'bg-gradient-to-tr from-indigo-500 to-cyan-500'
                  }`}>
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-200">{displayName}</p>
                    <p className="text-[11px] text-slate-400">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 px-2">
                  <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{points} Total XP</span>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded-md border ${
                    isAdmin ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                  }`}>
                    {role}
                  </span>
                </div>

                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold hover:bg-rose-500/20 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <Link
                to="/auth"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-cyan-600 shadow-md shadow-indigo-600/30"
              >
                Sign In / Join Chapter
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
