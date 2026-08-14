import React from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Layers, 
  Users, 
  ArrowLeft, 
  ExternalLink,
  Database,
  Terminal
} from 'lucide-react';

const AdminLayout = () => {
  const adminTabs = [
    { name: 'Content Manager', path: '/admin', icon: Database, end: true },
    { name: 'SQL Sandbox & Tester', path: '/admin/challenges', icon: Terminal },
    { name: 'Student Data & Roles', path: '/admin/students', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Admin Top Header Banner */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 via-indigo-600 to-cyan-500 p-0.5 shadow-lg shadow-rose-600/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-rose-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-black text-white tracking-tight">
                  ACM Chapter Admin Console
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase tracking-widest">
                  Admin Access
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Configure 21-day SQL challenges, test schemas with WebAssembly, and manage chapter permissions.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              to="/contest"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
            >
              <span>View Contest</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <Link
              to="/"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Exit Admin</span>
            </Link>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="max-w-7xl mx-auto mt-5 flex items-center space-x-2 border-t border-slate-800/80 pt-3">
          {adminTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <NavLink
                key={tab.path}
                to={tab.path}
                end={tab.end}
                className={({ isActive }) =>
                  `flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-rose-600 to-indigo-600 text-white shadow-md shadow-rose-600/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{tab.name}</span>
              </NavLink>
            );
          })}
        </div>
      </header>

      {/* Main Admin Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
