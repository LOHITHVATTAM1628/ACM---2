import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Loader2 } from 'lucide-react';

// Route Guards
import StudentRoute from './components/StudentRoute';
import AdminRoute from './components/AdminRoute';

// Layouts
import StudentLayout from './layouts/StudentLayout';
import AdminLayout from './layouts/AdminLayout';

// Public Pages (Lazy Loaded)
const Auth = React.lazy(() => import('./pages/Auth'));

// Student Portal Pages (Lazy Loaded)
const StudentDashboard = React.lazy(() => import('./pages/student/StudentDashboard'));
const ContestHub = React.lazy(() => import('./pages/ContestHub'));
const ChallengePlayground = React.lazy(() => import('./pages/ChallengePlayground'));
const Leaderboard = React.lazy(() => import('./pages/Leaderboard'));

// Admin Portal Pages (Lazy Loaded)
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'));
const ChallengeManager = React.lazy(() => import('./pages/admin/ChallengeManager'));
const QuizManager = React.lazy(() => import('./pages/admin/QuizManager'));
const StudentManager = React.lazy(() => import('./pages/admin/StudentManager'));

// Suspense Fallback Loader
const RouteLoadingFallback = () => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center text-slate-200 py-12">
    <div className="relative flex items-center justify-center">
      <div className="w-12 h-12 rounded-full border-3 border-indigo-500/20 border-t-cyan-400 animate-spin" />
      <Loader2 className="w-5 h-5 text-cyan-400 absolute animate-pulse" />
    </div>
  </div>
);

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
        <React.Suspense fallback={<RouteLoadingFallback />}>
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
        </React.Suspense>
      </AuthProvider>
    </Router>
  );
}

export default App;
