import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

const AdminRoute = ({ children }) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  // Wait until both session AND profile data are fully resolved
  if (loading || (user && !profile)) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-200">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 rounded-full border-4 border-rose-500/20 border-t-rose-500 animate-spin" />
          <Loader2 className="w-6 h-6 text-rose-400 absolute animate-pulse" />
        </div>
        <p className="mt-4 text-sm font-medium text-slate-400 animate-pulse">
          Verifying administrator permissions...
        </p>
      </div>
    );
  }

  // Not logged in -> redirect to /auth
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If user is a student -> strictly eject to /student/dashboard
  if (profile?.role !== 'admin') {
    return <Navigate to="/student/dashboard" replace />;
  }

  return children ? children : <Outlet />;
};

export default AdminRoute;
