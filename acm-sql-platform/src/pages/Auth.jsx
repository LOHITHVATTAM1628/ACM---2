import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Database, 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Eye, 
  EyeOff,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const { login, signup, user, profile } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in based on role
  useEffect(() => {
    if (user && profile) {
      if (profile.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/student/dashboard', { replace: true });
      }
    }
  }, [user, profile, navigate]);

  const handleWhatsAppReset = (e) => {
    e.preventDefault();
    
    // Grab the email from state, or use a placeholder if they left it blank
    const userEmail = email ? email : "[Insert your email here]";
    
    // Create the message and encode it for a URL
    const message = `Hi, I forgot my password for the ACM SQL Platform. My email is: ${userEmail}`;
    const whatsappUrl = `https://wa.me/919100521109?text=${encodeURIComponent(message)}`;
    
    // Open WhatsApp in a new tab
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Basic client-side validation
    if (!email.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (!isLogin && !fullName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { data, error, profile: loggedProfile } = await login({ email: email.trim(), password });
        if (error) {
          setErrorMsg(error.message || 'Failed to sign in. Please verify your credentials.');
        } else if (data?.user) {
          setSuccessMsg('Welcome back! Redirecting to your portal...');
          const targetRole = loggedProfile?.role || 'student';
          if (targetRole === 'admin') {
            navigate('/admin/dashboard', { replace: true });
          } else {
            navigate('/student/dashboard', { replace: true });
          }
        }
      } else {
        const { data, error, profile: signedProfile } = await signup({
          email: email.trim(),
          password,
          fullName: fullName.trim(),
        });

        if (error) {
          setErrorMsg(error.message || 'Failed to create account.');
        } else if (data?.user) {
          if (data.session) {
            setSuccessMsg('Account created successfully! Redirecting...');
            const targetRole = signedProfile?.role || 'student';
            if (targetRole === 'admin') {
              navigate('/admin/dashboard', { replace: true });
            } else {
              navigate('/student/dashboard', { replace: true });
            }
          } else {
            // Confirmation email was sent
            setSuccessMsg(
              'Account created! Please check your email to verify your account before logging in.'
            );
            setIsLogin(true);
          }
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      setErrorMsg('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (toLogin) => {
    setIsLogin(toLogin);
    setErrorMsg('');
    setSuccessMsg('');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 relative overflow-hidden bg-slate-950">
      {/* Dynamic Ambient Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-1/3 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-10 right-1/4 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Card Container */}
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl shadow-2xl backdrop-blur-xl p-6 sm:p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20 mb-3">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Database className="w-7 h-7 text-cyan-400" />
              </div>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              {isLogin ? 'Welcome Back' : 'Join ACM SQL Chapter'}
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              {isLogin
                ? 'Continue your SQL mastery and contest streak'
                : 'Start solving interactive queries & 21-day challenges'}
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="grid grid-cols-2 p-1 mb-6 bg-slate-950/70 border border-slate-800/80 rounded-xl">
            <button
              type="button"
              onClick={() => switchTab(true)}
              className={`py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                isLogin
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchTab(false)}
              className={`py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                !isLogin
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Status Messages */}
          {errorMsg && (
            <div className="mb-5 flex items-start space-x-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 flex items-start space-x-2.5 p-3 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name for Signup */}
            {!isLogin && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required={!isLogin}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Alex Turing"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@university.edu"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Password
                </label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={handleWhatsAppReset}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors focus:outline-none cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 shadow-lg shadow-indigo-600/30 hover:shadow-cyan-500/40 focus:outline-none transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed transform active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>{isLogin ? 'Authenticating...' : 'Creating Account...'}</span>
                </>
              ) : (
                <>
                  <span>{isLogin ? 'Sign In to Platform' : 'Join Chapter'}</span>
                  <ArrowRight className="w-4 h-4 text-cyan-200" />
                </>
              )}
            </button>
          </form>

          {/* Footer Highlights */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center space-x-1.5 text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Postgres & Supabase Auth</span>
            </div>
            <div className="flex items-center space-x-1 text-slate-400">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Daily SQL Streak Tracker</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
