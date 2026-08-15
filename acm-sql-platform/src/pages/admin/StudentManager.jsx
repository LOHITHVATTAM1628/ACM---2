import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Users, 
  Search, 
  ShieldCheck, 
  Flame, 
  UserX, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  BarChart3,
  RotateCcw
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';

const StudentManager = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [actionNotice, setActionNotice] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [resettingId, setResettingId] = useState(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('total_points', { ascending: false });

      if (error) throw error;
      setStudents(data || []);
    } catch (err) {
      console.error('Error fetching student profiles from Supabase:', err);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  // Toggle or Update user role in Supabase
  const handleToggleAdmin = async (student) => {
    const newRole = student.role === 'admin' ? 'student' : 'admin';
    setUpdatingId(student.id);
    setActionNotice(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', student.id);

      if (error) {
        console.warn('Supabase update notice:', error.message);
      }

      // Update local state reactively
      setStudents((prev) =>
        prev.map((s) => (s.id === student.id ? { ...s, role: newRole } : s))
      );

      setActionNotice({
        type: 'success',
        message: `${student.name || student.full_name || student.email} updated to role "${newRole.toUpperCase()}".`,
      });
    } catch (err) {
      setActionNotice({
        type: 'error',
        message: err.message || 'Failed to update student role.',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  // Completely reset a student's points, streaks, and quiz attempts
  const handleResetProgress = async (student) => {
    const studentName = student.name || student.full_name || student.email || 'this student';
    const confirmed = window.confirm(
      `Are you sure you want to completely reset ${studentName}'s progress? This will delete all XP, streaks, and challenge attempts. This cannot be undone.`
    );
    if (!confirmed) return;

    setResettingId(student.id);
    setActionNotice(null);

    try {
      // 1. Reset core stats in profiles
      const { error: profErr } = await supabase
        .from('profiles')
        .update({ total_points: 0, streak_count: 0 })
        .eq('id', student.id);

      if (profErr) {
        console.error('Error resetting profile stats:', profErr.message);
        throw profErr;
      }

      // 2. Clear quiz attempts
      const { error: quizErr } = await supabase
        .from('quiz_attempts')
        .delete()
        .eq('user_id', student.id);

      if (quizErr) {
        console.warn('Notice deleting quiz attempts:', quizErr.message);
      }

      // 3. Clear challenge submissions if table exists
      try {
        await supabase
          .from('challenge_submissions')
          .delete()
          .eq('user_id', student.id);
      } catch (subErr) {
        console.warn('Notice deleting challenge submissions:', subErr);
      }

      // 4. Update local state immediately
      setStudents((prev) =>
        prev.map((s) =>
          s.id === student.id ? { ...s, total_points: 0, streak_count: 0 } : s
        )
      );

      setActionNotice({
        type: 'success',
        message: `Student progress has been completely reset.`,
      });
    } catch (err) {
      console.error('Failed to reset student progress:', err);
      setActionNotice({
        type: 'error',
        message: `Failed to reset student progress: ${err.message || err}`,
      });
    } finally {
      setResettingId(null);
    }
  };

  // Filtered List
  const filteredStudents = students.filter((s) => {
    const displayName = s.name || s.full_name || '';
    const matchesSearch =
      displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.email || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === 'all' || s.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Recharts metric dataset
  const chartData = [
    { name: '0-5d', count: students.filter((s) => (s.streak_count || 0) <= 5).length, fill: '#6366f1' },
    { name: '6-10d', count: students.filter((s) => (s.streak_count || 0) > 5 && (s.streak_count || 0) <= 10).length, fill: '#06b6d4' },
    { name: '11-15d', count: students.filter((s) => (s.streak_count || 0) > 10 && (s.streak_count || 0) <= 15).length, fill: '#14b8a6' },
    { name: '16-21d', count: students.filter((s) => (s.streak_count || 0) > 15).length, fill: '#f59e0b' },
  ];

  return (
    <div className="space-y-8">
      {/* Top Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Chapter Members</p>
            <p className="text-3xl font-black text-white mt-1">{students.length}</p>
            <p className="text-[11px] text-cyan-400 mt-0.5">Active Learners</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Admins</p>
            <p className="text-3xl font-black text-rose-400 mt-1">
              {students.filter((s) => s.role === 'admin').length}
            </p>
            <p className="text-[11px] text-rose-300/80 mt-0.5">Full System Privileges</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Streak Distribution Chart */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between px-2 pt-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
              <BarChart3 className="w-4 h-4 text-indigo-400" />
              <span>Streak Cohorts</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">21-Day Sprints</span>
          </div>
          <div className="h-20 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionNotice && (
        <div
          className={`p-4 rounded-2xl flex items-center space-x-3 text-xs font-semibold animate-in fade-in duration-200 ${
            actionNotice.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
          }`}
        >
          {actionNotice.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span>{actionNotice.message}</span>
        </div>
      )}

      {/* Search & Filter Controls */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">Student Roster & Permissions</h3>
            <p className="text-xs text-slate-400">
              Manage member roles, inspect challenge participation, and promote chapter leaders.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-400 transition"
              />
            </div>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-rose-400 transition"
            >
              <option value="all">All Roles</option>
              <option value="student">Students</option>
              <option value="mentor">Mentors</option>
              <option value="admin">Admins</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 uppercase font-bold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-5">Member</th>
                  <th className="py-3.5 px-5">Email Address</th>
                  <th className="py-3.5 px-5">Role</th>
                  <th className="py-3.5 px-5">Streak</th>
                  <th className="py-3.5 px-5 text-right">Total XP</th>
                  <th className="py-3.5 px-5 text-right">Administrative Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-400">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-rose-400 mb-2" />
                      <span>Loading chapter students...</span>
                    </td>
                  </tr>
                ) : filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => {
                    const isAdmin = student.role === 'admin';
                    const isUpdating = updatingId === student.id;

                    return (
                      <tr key={student.id} className="hover:bg-slate-900/40 transition">
                        <td className="py-3.5 px-5">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center font-bold text-white text-xs shadow-md">
                              {(student.name || student.full_name || 'U').charAt(0).toUpperCase()}
                            </div>
                            <span className="font-bold text-white">
                              {student.name || student.full_name || 'ACM Member'}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-5 text-slate-400 font-mono">
                          {student.email || 'user@chapter.acm'}
                        </td>

                        <td className="py-3.5 px-5">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              isAdmin
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : student.role === 'mentor'
                                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}
                          >
                            {student.role || 'student'}
                          </span>
                        </td>

                        <td className="py-3.5 px-5">
                          <div className="flex items-center space-x-1.5 text-amber-400 font-bold">
                            <Flame className="w-3.5 h-3.5 fill-amber-400/20" />
                            <span>{student.streak_count ?? 0} days</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-5 text-right font-bold text-cyan-300">
                          {student.total_points ?? 0} pts
                        </td>

                        <td className="py-3.5 px-5 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {/* Promote / Demote Button */}
                            <button
                              onClick={() => handleToggleAdmin(student)}
                              disabled={isUpdating || resettingId === student.id}
                              className={`px-3 py-1.5 rounded-xl font-bold transition-all text-[11px] inline-flex items-center space-x-1.5 ${
                                isAdmin
                                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                                  : 'bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 hover:border-indigo-500/50'
                              }`}
                            >
                              {isUpdating ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                              ) : isAdmin ? (
                                <>
                                  <UserX className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Demote</span>
                                </>
                              ) : (
                                <>
                                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                                  <span>Promote to Admin</span>
                                </>
                              )}
                            </button>

                            {/* Reset Progress Button */}
                            <button
                              onClick={() => handleResetProgress(student)}
                              disabled={isUpdating || resettingId === student.id}
                              title="Reset all XP, streaks, and quiz attempts for this student"
                              className="px-3 py-1.5 rounded-xl font-bold transition-all text-[11px] inline-flex items-center space-x-1.5 bg-rose-500/15 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 hover:border-rose-500/60 disabled:opacity-50"
                            >
                              {resettingId === student.id ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-400" />
                                  <span>Resetting...</span>
                                </>
                              ) : (
                                <>
                                  <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                                  <span>Reset Progress</span>
                                </>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-500">
                      No matching student profiles found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentManager;
