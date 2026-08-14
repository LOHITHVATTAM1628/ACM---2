import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { 
  Trophy, 
  Flame, 
  Sparkles, 
  Crown, 
  Search,
  Loader2,
  Users
} from 'lucide-react';

const Leaderboard = () => {
  const { user: currentUser } = useAuth();
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      setError(null);
      try {
        // Query live student profiles ordered by total XP points using `name` column
        const { data, error: fetchErr } = await supabase
          .from('profiles')
          .select('id, name, email, role, total_points, streak_count')
          .order('total_points', { ascending: false })
          .limit(100);

        if (fetchErr) throw fetchErr;
        setLeaders(data || []);
      } catch (err) {
        console.error('Error fetching live leaderboard rankings:', err);
        setError(err.message);
        setLeaders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const resolveName = (student) => {
    return student?.name || student?.full_name || student?.email?.split('@')[0] || 'ACM Contestant';
  };

  const filteredLeaders = leaders.filter((student) =>
    resolveName(student).toLowerCase().includes(searchTerm.toLowerCase()) ||
    (student.email && student.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-300">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
              <Trophy className="w-3.5 h-3.5" />
              <span>Live Chapter Rankings</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Global Leaderboard</h1>
            <p className="text-sm text-slate-400">
              Live ranking of ACM chapter members based on verified SQL challenge completions and daily streaks.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search contestant..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-3 bg-slate-900/40 border border-slate-800 rounded-3xl">
            <div className="w-12 h-12 rounded-full border-4 border-amber-500/20 border-t-amber-400 animate-spin" />
            <p className="text-xs font-semibold text-slate-400 animate-pulse">
              Fetching live rankings from Supabase...
            </p>
          </div>
        ) : error && leaders.length === 0 ? (
          <div className="p-12 text-center bg-rose-950/20 border border-rose-500/30 rounded-3xl space-y-2 max-w-md mx-auto">
            <Trophy className="w-10 h-10 text-rose-400 mx-auto" />
            <h3 className="text-sm font-bold text-white">Failed to load leaderboard</h3>
            <p className="text-xs text-rose-300">{error}</p>
          </div>
        ) : leaders.length === 0 ? (
          <div className="p-16 text-center bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl space-y-3 max-w-md mx-auto">
            <Users className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">No Contestants Yet</h3>
            <p className="text-xs text-slate-400">
              Solve the 21-Day SQL Challenges to earn points and claim the #1 spot on the leaderboard!
            </p>
          </div>
        ) : (
          <>
            {/* Podium Top 3 Cards */}
            {leaders.length >= 1 && !searchTerm && (
              <div className={`grid grid-cols-1 gap-6 pt-4 ${
                leaders.length === 1 ? 'max-w-md mx-auto' : leaders.length === 2 ? 'md:grid-cols-2 max-w-3xl mx-auto' : 'md:grid-cols-3'
              }`}>
                {/* Rank 2 (Silver) */}
                {leaders.length >= 2 && (
                  <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 flex flex-col items-center text-center relative order-2 md:order-1 shadow-xl">
                    <div className="w-10 h-10 rounded-full bg-slate-400/20 text-slate-300 font-black flex items-center justify-center mb-3 border border-slate-400/30">
                      2
                    </div>
                    <h3 className="font-bold text-slate-100 text-lg truncate max-w-full">
                      {resolveName(leaders[1])}
                    </h3>
                    <p className="text-xs text-slate-400 mb-4 capitalize">{leaders[1]?.role || 'Student'}</p>
                    <div className="flex items-center space-x-3 text-xs">
                      <span className="flex items-center text-amber-400 font-semibold">
                        <Flame className="w-3.5 h-3.5 mr-1 fill-amber-400/20" />
                        {leaders[1]?.streak_count ?? 0}d streak
                      </span>
                      <span className="flex items-center text-cyan-300 font-bold">
                        <Sparkles className="w-3.5 h-3.5 mr-1" />
                        {leaders[1]?.total_points ?? 0} XP
                      </span>
                    </div>
                  </div>
                )}

                {/* Rank 1 (Gold Champion) */}
                {leaders.length >= 1 && (
                  <div className="bg-gradient-to-b from-indigo-950/80 to-slate-900 border-2 border-amber-400/40 rounded-3xl p-6 flex flex-col items-center text-center relative order-1 md:order-2 shadow-2xl shadow-amber-500/10 md:-translate-y-2">
                    <div className="absolute -top-4 bg-amber-400 text-slate-950 text-xs font-extrabold px-3.5 py-1 rounded-full flex items-center space-x-1 shadow-md uppercase tracking-wider">
                      <Crown className="w-3.5 h-3.5 fill-slate-950" />
                      <span>CHAMPION</span>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 font-black text-xl flex items-center justify-center mb-3 border border-amber-400/40 mt-1">
                      1
                    </div>
                    <h3 className="font-extrabold text-white text-xl truncate max-w-full">
                      {resolveName(leaders[0])}
                    </h3>
                    <p className="text-xs text-indigo-300 mb-4 capitalize">{leaders[0]?.role || 'Student'}</p>
                    <div className="flex items-center space-x-4 text-xs">
                      <span className="flex items-center text-amber-400 font-bold">
                        <Flame className="w-4 h-4 mr-1 fill-amber-400/30" />
                        {leaders[0]?.streak_count ?? 0}d streak
                      </span>
                      <span className="flex items-center text-cyan-300 font-extrabold text-sm">
                        <Sparkles className="w-4 h-4 mr-1 text-cyan-400" />
                        {leaders[0]?.total_points ?? 0} XP
                      </span>
                    </div>
                  </div>
                )}

                {/* Rank 3 (Bronze) */}
                {leaders.length >= 3 && (
                  <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 flex flex-col items-center text-center relative order-3 shadow-xl">
                    <div className="w-10 h-10 rounded-full bg-amber-700/20 text-amber-500 font-black flex items-center justify-center mb-3 border border-amber-700/30">
                      3
                    </div>
                    <h3 className="font-bold text-slate-100 text-lg truncate max-w-full">
                      {resolveName(leaders[2])}
                    </h3>
                    <p className="text-xs text-slate-400 mb-4 capitalize">{leaders[2]?.role || 'Student'}</p>
                    <div className="flex items-center space-x-3 text-xs">
                      <span className="flex items-center text-amber-400 font-semibold">
                        <Flame className="w-3.5 h-3.5 mr-1 fill-amber-400/20" />
                        {leaders[2]?.streak_count ?? 0}d streak
                      </span>
                      <span className="flex items-center text-cyan-300 font-bold">
                        <Sparkles className="w-3.5 h-3.5 mr-1" />
                        {leaders[2]?.total_points ?? 0} XP
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Full Rankings Table */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-950/90 text-xs uppercase font-bold text-slate-400 tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-4 px-6">Rank</th>
                      <th className="py-4 px-6">Contestant</th>
                      <th className="py-4 px-6">Role</th>
                      <th className="py-4 px-6">Streak</th>
                      <th className="py-4 px-6 text-right">Total XP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredLeaders.map((student, index) => {
                      const isCurrent = currentUser?.id === student.id;
                      const studentName = resolveName(student);

                      return (
                        <tr
                          key={student.id || index}
                          className={`hover:bg-slate-800/40 transition ${
                            isCurrent ? 'bg-indigo-950/40 border-l-4 border-indigo-400 font-semibold' : ''
                          }`}
                        >
                          <td className="py-4 px-6 font-bold text-slate-400">
                            {index === 0 ? (
                              <span className="text-amber-400 font-extrabold flex items-center space-x-1">
                                <Crown className="w-3.5 h-3.5 inline" />
                                <span>#1</span>
                              </span>
                            ) : index === 1 ? (
                              <span className="text-slate-300 font-bold">#2</span>
                            ) : index === 2 ? (
                              <span className="text-amber-600 font-bold">#3</span>
                            ) : (
                              `#${index + 1}`
                            )}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center font-bold text-xs text-white shadow">
                                {studentName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <span className="font-semibold text-white">
                                  {studentName}
                                </span>
                                {isCurrent && (
                                  <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-cyan-500/20 text-cyan-300 rounded font-semibold border border-cyan-500/30">
                                    You
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className="capitalize text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                              {student.role || 'student'}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-1 text-amber-400 font-semibold text-xs">
                              <Flame className="w-4 h-4 fill-amber-400/20" />
                              <span>{student.streak_count ?? 0} days</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-right font-bold text-cyan-300">
                            {student.total_points ?? 0} pts
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default Leaderboard;
