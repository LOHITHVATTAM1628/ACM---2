import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { EventProvider } from './context/EventContext';
import { Loader2 } from 'lucide-react';

// Route Guards
import StudentRoute from './components/StudentRoute';
import AdminRoute from './components/AdminRoute';

// Layouts
import StudentLayout from './layouts/StudentLayout';
import AdminLayout from './layouts/AdminLayout';

// Public Pages
import Auth from './pages/Auth';

// Student Portal Pages
import StudentDashboard from './pages/student/StudentDashboard';
import ContestHub from './pages/ContestHub';
import ChallengePlayground from './pages/ChallengePlayground';
import Leaderboard from './pages/Leaderboard';

// Admin Portal Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ChallengeManager from './pages/admin/ChallengeManager';
import QuizManager from './pages/admin/QuizManager';
import StudentManager from './pages/admin/StudentManager';

// Root & Catch-all redirection dispatcher
const RootRedirect = () => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-200">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 rounded-full border-4 border-indigo-500/20 border-t-cyan-400 animate-spin" />
          <Loader2 className="w-6 h-6 text-cyan-400 absolute animate-pulse" />
        </div>
        <p className="mt-4 text-xs font-semibold text-slate-400 animate-pulse">
          Connecting to ACM Platform...
        </p>
      </div>
    );
  }

  // Unauthenticated visitors redirect strictly to /auth
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Role-based destination
  if (profile?.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Navigate to="/student/dashboard" replace />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <EventProvider>
          <Routes>
            {/* Public Authentication Route */}
            <Route path="/auth" element={<Auth />} />

            {/* Root Redirector */}
            <Route path="/" element={<RootRedirect />} />

            {/* Legacy Aliases for seamless backwards compatibility */}
            <Route path="/contest" element={<Navigate to="/student/contest" replace />} />
            <Route path="/contest/day/:dayNumber" element={<Navigate to="/student/contest/day/:dayNumber" replace />} />
            <Route path="/leaderboard" element={<Navigate to="/student/leaderboard" replace />} />

            {/* STUDENT PORTAL (Strictly guarded by StudentRoute & StudentLayout) */}
            <Route
              path="/student"
              element={
                <StudentRoute>
                  <StudentLayout />
                </StudentRoute>
              }
            >
              <Route index element={<Navigate to="/student/dashboard" replace />} />
              <Route path="dashboard" element={<StudentDashboard />} />
              <Route path="contest" element={<ContestHub />} />
              <Route path="contest/day/:dayNumber" element={<ChallengePlayground />} />
              <Route path="leaderboard" element={<Leaderboard />} />
              <Route path="*" element={<Navigate to="/student/dashboard" replace />} />
            </Route>

            {/* ADMIN PORTAL (Strictly guarded by AdminRoute & AdminLayout) */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }
            >
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="challenges" element={<ChallengeManager />} />
              <Route path="quizzes" element={<QuizManager />} />
              <Route path="leaderboard" element={<Leaderboard />} />
              <Route path="students" element={<StudentManager />} />
              <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
            </Route>

            {/* Global Fallback */}
            <Route path="*" element={<RootRedirect />} />
          </Routes>
        </EventProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
