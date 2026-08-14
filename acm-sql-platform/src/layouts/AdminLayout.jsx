import React, { useState } from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, 
  LayoutDashboard, 
  Layers, 
  Users, 
  BookOpen, 
  HelpCircle, 
  LogOut, 
  Menu, 
  X, 
  Terminal, 
  ArrowLeft,
  ChevronRight,
  Database
} from 'lucide-react';

const AdminLayout = () => {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  const adminNavItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: '21-Day Challenges', path: '/admin/challenges', icon: Terminal },
    { name: 'Quizzes & MCQs', path: '/admin/quizzes', icon: HelpCircle },
    { name: 'Curriculum Tracks', path: '/admin/tracks', icon: Layers },
    { name: 'Learning Topics', path: '/admin/topics', icon: BookOpen },
    { name: 'Students & Roles', path: '/admin/students', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col lg:flex-row font-sans selection:bg-rose-500 selection:text-white">
      
      {/* Mobile Top Header */}
      <header className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between z-40">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-rose-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <span className="text-sm font-black text-white tracking-tight">Admin Console</span>
        </div>

        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Left Sidebar Navigation (Desktop Fixed / Mobile Slide-over) */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-slate-900/95 lg:bg-slate-900/80 border-r border-slate-800/90 backdrop-blur-xl p-5 flex flex-col justify-between transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        lg:static lg:w-64 xl:w-72 shrink-0
      `}>
        <div className="space-y-6">
          
          {/* Sidebar Top Brand Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 via-indigo-600 to-cyan-500 p-0.5 shadow-lg shadow-rose-600/20">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-rose-400" />
                </div>
              </div>
              <div>
                <h1 className="text-sm font-extrabold text-white tracking-tight">
                  Admin Console
                </h1>
                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest block -mt-0.5">
                  ACM Chapter Lead
                </span>
              </div>
            </div>

            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items List */}
          <nav className="space-y-1.5">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-rose-600 to-indigo-600 text-white shadow-md shadow-rose-600/25'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer: Admin Profile & Logout */}
        <div className="pt-4 border-t border-slate-800 space-y-3">
          <div className="flex items-center space-x-3 px-2 py-2 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 to-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-md shrink-0">
              {(profile?.name || profile?.full_name || 'Admin').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-1.5">
                <p className="text-xs font-bold text-white truncate">
                  {profile?.name || profile?.full_name || 'Admin'}
                </p>
                <span className="px-1.5 py-0.2 text-[9px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded shrink-0">
                  ADMIN
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate mt-0.5">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Admin Workspace Panel */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Admin Top Header Banner */}
        <header className="hidden lg:flex items-center justify-between bg-slate-900/60 border-b border-slate-800 px-8 py-3.5 backdrop-blur-md">
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <span className="text-rose-400 font-bold uppercase tracking-wider">ACM Chapter</span>
            <span>/</span>
            <span className="text-slate-300 font-medium">Administrator Portal</span>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Supabase Connected</span>
            </span>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>

    </div>
  );
};

export default AdminLayout;
