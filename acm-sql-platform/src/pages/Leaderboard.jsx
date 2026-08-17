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
    <div
      className="min-h-screen text-slate-100 py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #020817 0%, #06091a 50%, #040711 100%)' }}
    >
      {/* Subtle drifting background glows */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)', top: '10%', left: '20%', animation: 'lbBgDrift 20s ease-in-out infinite' }} />
        <div className="absolute w-[400px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.07) 0%, transparent 70%)', bottom: '15%', right: '15%', animation: 'lbBgDrift 26s ease-in-out infinite reverse' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6"
          style={{ borderBottom: '1px solid rgba(99,102,241,0.18)' }}>
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold"
              style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.28)', color: '#fbbf24', boxShadow: '0 0 10px rgba(251,191,36,0.10)' }}>
              <Trophy className="w-3.5 h-3.5" style={{ filter: 'drop-shadow(0 0 3px rgba(251,191,36,0.6))' }} />
              <span>Live Chapter Rankings</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight"
              style={{ background: 'linear-gradient(90deg, #f1f5f9, #a5b4fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Global Leaderboard
            </h1>
            <p className="text-sm" style={{ color: 'rgba(148,163,184,0.80)' }}>
              Live ranking of ACM chapter members based on verified SQL challenge completions and daily streaks.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#67e8f9' }} />
            <input
              type="text"
              placeholder="Search contestant..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none transition"
              style={{ background: 'rgba(8,10,24,0.85)', border: '1px solid rgba(99,102,241,0.25)' }}
              onFocus={e => { e.target.style.border = '1px solid rgba(34,211,238,0.55)'; e.target.style.boxShadow = '0 0 10px rgba(34,211,238,0.12)'; }}
              onBlur={e  => { e.target.style.border = '1px solid rgba(99,102,241,0.25)'; e.target.style.boxShadow = 'none'; }}
            />
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-3 rounded-3xl"
            style={{ background: 'rgba(6,8,20,0.60)', border: '1px solid rgba(99,102,241,0.15)' }}>
            <div className="w-12 h-12 rounded-full border-4 animate-spin"
              style={{ borderColor: 'rgba(251,191,36,0.15)', borderTopColor: '#fbbf24' }} />
            <p className="text-xs font-semibold animate-pulse" style={{ color: '#94a3b8' }}>
              Fetching live rankings from Supabase...
            </p>
          </div>
        ) : error && leaders.length === 0 ? (
          <div className="p-12 text-center rounded-3xl space-y-2 max-w-md mx-auto"
            style={{ background: 'rgba(127,29,29,0.18)', border: '1px solid rgba(244,63,94,0.28)' }}>
            <Trophy className="w-10 h-10 mx-auto" style={{ color: '#fb7185' }} />
            <h3 className="text-sm font-bold text-white">Failed to load leaderboard</h3>
            <p className="text-xs" style={{ color: '#fda4af' }}>{error}</p>
          </div>
        ) : leaders.length === 0 ? (
          <div className="p-16 text-center rounded-3xl space-y-3 max-w-md mx-auto"
            style={{ background: 'rgba(6,8,20,0.60)', border: '1px dashed rgba(99,102,241,0.20)' }}>
            <Users className="w-10 h-10 mx-auto" style={{ color: '#475569' }} />
            <h3 className="text-base font-bold text-white">No Contestants Yet</h3>
            <p className="text-xs" style={{ color: '#64748b' }}>
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
                {/* ── Rank 2 — Silver ── */}
                {leaders.length >= 2 && (
                  <div className="lb-silver-card rounded-3xl p-7 flex flex-col items-center text-center relative order-2 md:order-1"
                    style={{
                      background: 'linear-gradient(160deg, rgba(8,12,26,0.97) 0%, rgba(16,22,44,0.94) 100%)',
                      border: '1px solid rgba(203,213,225,0.22)',
                    }}>
                    {/* Silver medal rank badge */}
                    <div className="relative z-10 w-11 h-11 rounded-full font-black text-lg flex items-center justify-center mb-4"
                      style={{
                        background: 'linear-gradient(145deg, rgba(226,232,240,0.18) 0%, rgba(148,163,184,0.08) 100%)',
                        border: '1.5px solid rgba(203,213,225,0.42)',
                        color: '#e2e8f0',
                        boxShadow: '0 0 12px rgba(203,213,225,0.12), inset 0 1px 0 rgba(255,255,255,0.08)',
                      }}>2</div>
                    <h3 className="relative z-10 font-bold text-slate-100 text-lg truncate max-w-full">{resolveName(leaders[1])}</h3>
                    <p className="relative z-10 text-xs mb-5 capitalize" style={{ color: '#94a3b8' }}>{leaders[1]?.role || 'Student'}</p>
                    <div className="relative z-10 flex items-center space-x-3 text-xs">
                      <span className="flex items-center font-semibold" style={{ color: '#fbbf24' }}>
                        <Flame className="w-3.5 h-3.5 mr-1" style={{ filter: 'drop-shadow(0 0 3px rgba(251,191,36,0.5))' }} />{leaders[1]?.streak_count ?? 0}d streak
                      </span>
                      <span className="flex items-center font-bold" style={{ color: '#67e8f9', textShadow: '0 0 6px rgba(34,211,238,0.4)' }}>
                        <Sparkles className="w-3.5 h-3.5 mr-1" />{leaders[1]?.total_points ?? 0} XP
                      </span>
                    </div>
                  </div>
                )}

                {/* ── Rank 1 — Gold Champion ── */}
                {leaders.length >= 1 && (
                  <div className="lb-gold-card rounded-3xl p-7 flex flex-col items-center text-center relative order-1 md:order-2 md:-translate-y-3"
                    style={{
                      background: 'linear-gradient(160deg, rgba(10,8,22,0.98) 0%, rgba(18,12,4,0.97) 55%, rgba(8,6,18,0.98) 100%)',
                      border: '2px solid rgba(251,191,36,0.38)',
                    }}>

                    {/* Champion badge — metallic gold */}
                    <div className="absolute -top-4 px-4 py-1 rounded-full flex items-center gap-2 z-10"
                      style={{
                        background: 'linear-gradient(90deg, #92400e 0%, #d97706 30%, #fbbf24 50%, #d97706 70%, #92400e 100%)',
                        boxShadow: '0 0 10px rgba(251,191,36,0.22), 0 2px 8px rgba(0,0,0,0.5)',
                      }}>
                      <Crown className="w-3.5 h-3.5 lb-crown-spark" style={{ color: '#1c1100' }} />
                      <span className="text-xs font-extrabold uppercase tracking-widest" style={{ color: '#1c1100', letterSpacing: '0.1em' }}>CHAMPION</span>
                    </div>

                    {/* Gold medal rank circle */}
                    <div className="relative z-10 w-16 h-16 rounded-full font-black text-2xl flex items-center justify-center mb-4 mt-3"
                      style={{
                        background: 'linear-gradient(145deg, rgba(251,191,36,0.22) 0%, rgba(180,83,9,0.10) 100%)',
                        border: '2px solid rgba(251,191,36,0.42)',
                        color: '#fbbf24',
                        boxShadow: '0 0 12px rgba(251,191,36,0.18), inset 0 1px 0 rgba(255,215,0,0.10), inset 0 0 10px rgba(217,119,6,0.05)',
                      }}>1</div>

                    <h3 className="relative z-10 font-extrabold text-white text-xl truncate max-w-full">{resolveName(leaders[0])}</h3>
                    <p className="relative z-10 text-xs mb-5 capitalize" style={{ color: '#c4b5fd' }}>{leaders[0]?.role || 'Student'}</p>
                    <div className="relative z-10 flex items-center space-x-4 text-xs">
                      <span className="flex items-center font-bold" style={{ color: '#fbbf24' }}>
                        <Flame className="w-4 h-4 mr-1" style={{ filter: 'drop-shadow(0 0 4px rgba(251,191,36,0.6))' }} />{leaders[0]?.streak_count ?? 0}d streak
                      </span>
                      <span className="flex items-center font-extrabold text-sm" style={{ color: '#67e8f9', textShadow: '0 0 6px rgba(34,211,238,0.4)' }}>
                        <Sparkles className="w-4 h-4 mr-1" style={{ filter: 'drop-shadow(0 0 3px rgba(34,211,238,0.5))' }} />{leaders[0]?.total_points ?? 0} XP
                      </span>
                    </div>
                  </div>
                )}

                {/* ── Rank 3 — Bronze ── */}
                {leaders.length >= 3 && (
                  <div className="lb-bronze-card rounded-3xl p-7 flex flex-col items-center text-center relative order-3"
                    style={{
                      background: 'linear-gradient(160deg, rgba(8,12,26,0.97) 0%, rgba(20,12,4,0.94) 100%)',
                      border: '1px solid rgba(180,83,9,0.26)',
                    }}>
                    {/* Bronze medal rank badge */}
                    <div className="relative z-10 w-11 h-11 rounded-full font-black text-lg flex items-center justify-center mb-4"
                      style={{
                        background: 'linear-gradient(145deg, rgba(180,83,9,0.20) 0%, rgba(120,53,15,0.10) 100%)',
                        border: '1.5px solid rgba(180,83,9,0.42)',
                        color: '#d97706',
                        boxShadow: '0 0 12px rgba(180,83,9,0.14), inset 0 1px 0 rgba(217,119,6,0.08)',
                      }}>3</div>
                    <h3 className="relative z-10 font-bold text-slate-100 text-lg truncate max-w-full">{resolveName(leaders[2])}</h3>
                    <p className="relative z-10 text-xs mb-5 capitalize" style={{ color: '#94a3b8' }}>{leaders[2]?.role || 'Student'}</p>
                    <div className="relative z-10 flex items-center space-x-3 text-xs">
                      <span className="flex items-center font-semibold" style={{ color: '#fbbf24' }}>
                        <Flame className="w-3.5 h-3.5 mr-1" style={{ filter: 'drop-shadow(0 0 3px rgba(251,191,36,0.5))' }} />{leaders[2]?.streak_count ?? 0}d streak
                      </span>
                      <span className="flex items-center font-bold" style={{ color: '#67e8f9', textShadow: '0 0 6px rgba(34,211,238,0.4)' }}>
                        <Sparkles className="w-3.5 h-3.5 mr-1" />{leaders[2]?.total_points ?? 0} XP
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Full Rankings Table */}
            <div className="rounded-3xl overflow-hidden shadow-2xl"
              style={{ background: 'rgba(6,9,22,0.90)', border: '1px solid rgba(99,102,241,0.18)', boxShadow: '0 0 40px rgba(99,102,241,0.06), 0 20px 60px rgba(0,0,0,0.5)', backdropFilter: 'blur(16px)' }}>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(99,102,241,0.22)', background: 'rgba(8,10,26,0.95)' }}>
                      <th className="py-4 px-6 text-xs font-black uppercase tracking-widest" style={{ color: '#a5b4fc', textShadow: '0 0 8px rgba(99,102,241,0.4)' }}>Rank</th>
                      <th className="py-4 px-6 text-xs font-black uppercase tracking-widest" style={{ color: '#a5b4fc', textShadow: '0 0 8px rgba(99,102,241,0.4)' }}>Contestant</th>
                      <th className="py-4 px-6 text-xs font-black uppercase tracking-widest" style={{ color: '#a5b4fc', textShadow: '0 0 8px rgba(99,102,241,0.4)' }}>Role</th>
                      <th className="py-4 px-6 text-xs font-black uppercase tracking-widest" style={{ color: '#a5b4fc', textShadow: '0 0 8px rgba(99,102,241,0.4)' }}>Streak</th>
                      <th className="py-4 px-6 text-right text-xs font-black uppercase tracking-widest" style={{ color: '#67e8f9', textShadow: '0 0 8px rgba(34,211,238,0.4)' }}>Total XP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeaders.map((student, index) => {
                      const isCurrent = currentUser?.id === student.id;
                      const studentName = resolveName(student);
                      const rankEl = index === 0 ? (
                        <span className="flex items-center gap-1 font-extrabold" style={{ color: '#fbbf24', textShadow: '0 0 8px rgba(251,191,36,0.5)' }}>
                          <Crown className="w-3.5 h-3.5" style={{ filter: 'drop-shadow(0 0 3px rgba(251,191,36,0.7))' }} /><span>#1</span>
                        </span>
                      ) : index === 1 ? (
                        <span className="font-bold" style={{ color: '#cbd5e1', textShadow: '0 0 6px rgba(203,213,225,0.3)' }}>#2</span>
                      ) : index === 2 ? (
                        <span className="font-bold" style={{ color: '#d97706', textShadow: '0 0 6px rgba(180,83,9,0.4)' }}>#3</span>
                      ) : (
                        <span className="font-semibold" style={{ color: '#64748b' }}>#{index + 1}</span>
                      );
                      return (
                        <tr key={student.id || index} className="lb-row-sweep transition-all duration-200"
                          style={isCurrent ? { background: 'linear-gradient(90deg, rgba(99,102,241,0.10), rgba(34,211,238,0.05))', borderLeft: '3px solid rgba(99,102,241,0.60)', boxShadow: 'inset 0 0 20px rgba(99,102,241,0.06)' } : { borderLeft: '3px solid transparent', borderBottom: '1px solid rgba(99,102,241,0.08)' }}
                          onMouseEnter={e => { if (!isCurrent) e.currentTarget.style.background = 'rgba(99,102,241,0.05)'; }}
                          onMouseLeave={e => { if (!isCurrent) e.currentTarget.style.background = 'transparent'; }}>
                          <td className="py-4 px-6">{rankEl}</td>
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white shadow"
                                style={{ background: index === 0 ? 'linear-gradient(135deg, #d97706, #fbbf24)' : index === 1 ? 'linear-gradient(135deg, #64748b, #cbd5e1)' : index === 2 ? 'linear-gradient(135deg, #92400e, #d97706)' : 'linear-gradient(135deg, #4f46e5, #06b6d4)', boxShadow: index === 0 ? '0 0 8px rgba(251,191,36,0.3)' : 'none' }}>
                                {studentName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <span className="font-semibold text-white">{studentName}</span>
                                {isCurrent && (
                                  <span className="ml-2 px-1.5 py-0.5 text-[10px] rounded font-bold"
                                    style={{ background: 'rgba(99,102,241,0.18)', border: '1px solid rgba(99,102,241,0.38)', color: '#a5b4fc', boxShadow: '0 0 6px rgba(99,102,241,0.15)' }}>You</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className="capitalize text-xs px-2 py-0.5 rounded"
                              style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.18)', color: '#94a3b8' }}>
                              {student.role || 'student'}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-1 font-semibold text-xs" style={{ color: '#fbbf24' }}>
                              <Flame className="w-4 h-4" style={{ filter: 'drop-shadow(0 0 3px rgba(251,191,36,0.5))' }} />
                              <span>{student.streak_count ?? 0} days</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-right font-bold" style={{ color: '#67e8f9', textShadow: '0 0 6px rgba(34,211,238,0.25)' }}>
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
