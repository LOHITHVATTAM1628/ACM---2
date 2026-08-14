import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { executeDryRun } from '../../lib/sqlEngine';
import { 
  Terminal, 
  Plus, 
  Edit3, 
  Trash2, 
  Save, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Search, 
  Play, 
  Code2, 
  Database, 
  X,
  Trophy,
  Video,
  ExternalLink,
  Info,
  Link2,
  Cpu,
  Lock,
  Unlock
} from 'lucide-react';

const initialChallengeForm = {
  id: null,
  day_number: '',
  title: '',
  description: '',
  difficulty: 'Easy',
  points: 100,
  video_url: '',
  leetcode_url: '',
  init_sql: `-- Schema & Seed Data\nCREATE TABLE students (\n  id INT PRIMARY KEY,\n  full_name TEXT,\n  gpa REAL,\n  is_active INT\n);\n\nINSERT INTO students VALUES\n(1, 'Alice Johnson', 3.85, 1),\n(2, 'Bob Smith', 3.20, 1),\n(3, 'Charlie Brown', 3.92, 0);`,
  solution_query: `SELECT id, full_name, gpa FROM students WHERE is_active = 1 AND gpa > 3.5 ORDER BY gpa DESC;`,
};

const ChallengeManager = () => {
  const [formData, setFormData] = useState(initialChallengeForm);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState(null); // { type: 'success' | 'error', text: '' }

  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const [isTestingWasm, setIsTestingWasm] = useState(false);
  const [wasmResult, setWasmResult] = useState(null);

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .order('day_number', { ascending: true });

      if (error) throw error;
      setChallenges(data || []);

      if (!isEditing && (!formData.day_number || formData.day_number === '')) {
        const nextDay = (data && data.length > 0)
          ? Math.max(...data.map((c) => Number(c.day_number) || 0)) + 1
          : 1;
        setFormData((prev) => ({
          ...prev,
          day_number: nextDay <= 21 ? nextDay : '',
        }));
      }
    } catch (err) {
      console.error('Error loading challenges:', err);
      setNotice({ type: 'error', text: `Failed to load challenges: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (challenge) => {
    setIsEditing(true);
    setWasmResult(null);
    setNotice(null);
    setFormData({
      id: challenge.id || null,
      day_number: challenge.day_number ?? '',
      title: challenge.title || '',
      description: challenge.description || '',
      difficulty: challenge.difficulty || 'Easy',
      points: challenge.points ?? 100,
      video_url: challenge.video_url || '',
      leetcode_url: challenge.leetcode_url || '',
      init_sql: challenge.init_sql || '',
      solution_query: challenge.solution_query || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    setIsEditing(false);
    setWasmResult(null);
    setNotice(null);
    const nextDay = challenges.length > 0
      ? Math.max(...challenges.map((c) => Number(c.day_number) || 0)) + 1
      : 1;
    setFormData({
      ...initialChallengeForm,
      day_number: nextDay <= 21 ? nextDay : '',
    });
  };

  const handleTestWasm = async () => {
    if (!formData.init_sql.trim()) {
      setNotice({ type: 'error', text: 'Please enter schema init_sql first.' });
      return;
    }
    if (!formData.solution_query.trim()) {
      setNotice({ type: 'error', text: 'Please enter solution_query first.' });
      return;
    }

    setIsTestingWasm(true);
    setWasmResult(null);

    try {
      const res = await executeDryRun({
        initSql: formData.init_sql,
        studentQuery: formData.solution_query,
      });
      setWasmResult(res);

      if (res.error) {
        setNotice({ type: 'error', text: `SQL Error: ${res.error}` });
      } else {
        setNotice({
          type: 'success',
          text: `SQL Query Validated in ${res.executionTimeMs}ms (${res.studentOutput.values.length} rows returned).`,
        });
      }
    } catch (err) {
      setWasmResult({ error: err.message });
      setNotice({ type: 'error', text: `WASM execution failed: ${err.message}` });
    } finally {
      setIsTestingWasm(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setNotice(null);

    try {
      const dayNum = Number(formData.day_number);
      const pointsNum = Number(formData.points);

      if (!dayNum || dayNum < 1) throw new Error('Please enter a valid Day Number.');
      if (!formData.title.trim()) throw new Error('Please enter a challenge title.');
      if (!formData.description.trim()) throw new Error('Please enter a description.');
      if (!formData.init_sql.trim()) throw new Error('Please enter the init_sql schema.');
      if (!formData.solution_query.trim()) throw new Error('Please enter the solution_query.');

      const payload = {
        day_number: dayNum,
        title: formData.title.trim(),
        description: formData.description.trim(),
        difficulty: formData.difficulty || 'Easy',
        points: pointsNum || 100,
        video_url: formData.video_url.trim() || null,
        leetcode_url: formData.leetcode_url.trim() || null,
        init_sql: formData.init_sql.trim(),
        solution_query: formData.solution_query.trim(),
      };

      if (isEditing && formData.id) {
        // Update existing challenge
        const { error } = await supabase
          .from('challenges')
          .update(payload)
          .eq('id', formData.id);
        if (error) throw error;
        setNotice({ type: 'success', text: `Day ${dayNum} Challenge updated successfully in Supabase!` });
      } else {
        // Insert / Upsert new challenge
        const { error } = await supabase
          .from('challenges')
          .insert([payload]);
        if (error) {
          // If already exists on day_number, perform fallback upsert
          const { error: upsertErr } = await supabase
            .from('challenges')
            .upsert(payload, { onConflict: 'day_number' });
          if (upsertErr) throw upsertErr;
        }
        setNotice({ type: 'success', text: `Day ${dayNum} Challenge published successfully to Supabase!` });
      }

      handleReset();
      await fetchChallenges();
    } catch (err) {
      console.error('Submit challenge error:', err);
      setNotice({ type: 'error', text: `Save failed: ${err.message}` });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (challenge) => {
    const confirmDelete = window.confirm(`Permanently delete Day ${challenge.day_number}: "${challenge.title}"?`);
    if (!confirmDelete) return;

    const targetId = challenge.id || challenge.day_number;
    setDeletingId(targetId);

    try {
      let query;
      if (challenge.id) {
        query = supabase.from('challenges').delete().eq('id', challenge.id);
      } else {
        query = supabase.from('challenges').delete().eq('day_number', challenge.day_number);
      }

      const { error } = await query;
      if (error) throw error;

      setNotice({ type: 'success', text: `Day ${challenge.day_number} challenge deleted.` });
      setChallenges((prev) => prev.filter((c) => (c.id ? c.id !== challenge.id : c.day_number !== challenge.day_number)));

      if (formData.day_number === challenge.day_number) {
        handleReset();
      }
    } catch (err) {
      console.error('Delete challenge error:', err);
      setNotice({ type: 'error', text: `Delete failed: ${err.message}` });
    } finally {
      setDeletingId(null);
    }
  };

  const [togglingId, setTogglingId] = useState(null);

  const toggleUnlockStatus = async (challenge) => {
    const newStatus = !challenge.is_unlocked;
    const targetId = challenge.id || challenge.day_number;
    setTogglingId(targetId);

    try {
      let query;
      if (challenge.id) {
        query = supabase.from('challenges').update({ is_unlocked: newStatus }).eq('id', challenge.id);
      } else {
        query = supabase.from('challenges').update({ is_unlocked: newStatus }).eq('day_number', challenge.day_number);
      }

      const { error } = await query;
      if (error) throw error;

      // Update local state reactively
      setChallenges((prev) =>
        prev.map((c) => {
          const match = c.id ? c.id === challenge.id : c.day_number === challenge.day_number;
          return match ? { ...c, is_unlocked: newStatus } : c;
        })
      );

      setNotice({
        type: 'success',
        text: `Day ${challenge.day_number} ${newStatus ? 'Unlocked 🔓 (Live on Student Portal)' : 'Locked 🔒 (Hidden from Students)'}`,
      });
    } catch (err) {
      console.error('Error toggling unlock status:', err);
      setNotice({ type: 'error', text: `Failed to toggle unlock status: ${err.message}` });
    } finally {
      setTogglingId(null);
    }
  };

  const filteredChallenges = challenges.filter((c) => {
    const q = search.toLowerCase();
    return (
      (c.title && c.title.toLowerCase().includes(q)) ||
      (c.day_number && String(c.day_number).includes(q)) ||
      (c.difficulty && c.difficulty.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-5 sm:p-6 rounded-3xl backdrop-blur-xl">
        <div>
          <div className="flex items-center space-x-2.5 mb-1">
            <span className="p-2 rounded-xl bg-gradient-to-tr from-rose-600 to-indigo-600 text-white shadow-md">
              <Terminal className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              21-Day SQL Challenge Management
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Author 4-part daily curriculum: Video Lesson, Knowledge Check, WebAssembly SQL Sandbox, and LeetCode link.
          </p>
        </div>

        <span className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-bold flex items-center space-x-1.5 self-start sm:self-auto">
          <Trophy className="w-4 h-4 text-rose-400" />
          <span>{challenges.length} of 21 Published</span>
        </span>
      </div>

      {/* Notice Banner */}
      {notice && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between text-xs sm:text-sm font-semibold animate-in fade-in duration-200 ${
          notice.type === 'success' ? 'bg-teal-950/80 border-teal-500/40 text-teal-200' : 'bg-rose-950/80 border-rose-500/40 text-rose-200'
        }`}>
          <div className="flex items-center space-x-2.5">
            {notice.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0" /> : <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}
            <span>{notice.text}</span>
          </div>
          <button onClick={() => setNotice(null)} className="p-1 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2-Column Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Form */}
        <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl backdrop-blur-xl sticky top-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-rose-600/20 text-rose-400 flex items-center justify-center font-bold">
                {isEditing ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              </div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                {isEditing ? `Edit Day ${formData.day_number} Challenge` : 'Add New SQL Challenge'}
              </h2>
            </div>
            {isEditing && (
              <button
                type="button"
                onClick={handleReset}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-semibold flex items-center space-x-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* GROUP 1: Basic Challenge Info */}
            <div className="space-y-3.5 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Info className="w-3.5 h-3.5" />
                <span>1. Basic Challenge Info</span>
              </span>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Day *</label>
                  <input
                    type="number"
                    min="1"
                    max="21"
                    required
                    value={formData.day_number}
                    onChange={(e) => setFormData({ ...formData, day_number: e.target.value })}
                    placeholder="1-21"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Difficulty</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">XP Points *</label>
                  <input
                    type="number"
                    min="10"
                    step="10"
                    required
                    value={formData.points}
                    onChange={(e) => setFormData({ ...formData, points: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Challenge Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Aggregations & GROUP BY Categories"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description & Goal *</label>
                <textarea
                  rows={3}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe problem statement and expected output schema..."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400 leading-relaxed"
                />
              </div>
            </div>

            {/* GROUP 2: External Resources & Links */}
            <div className="space-y-3.5 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Link2 className="w-3.5 h-3.5" />
                <span>2. External Resources & Links</span>
              </span>

              {/* YouTube Video URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center space-x-1.5">
                  <Video className="w-3.5 h-3.5 text-rose-400" />
                  <span>YouTube Video URL (<code className="text-rose-300 font-mono">video_url</code>)</span>
                </label>
                <input
                  type="url"
                  value={formData.video_url}
                  onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* LeetCode Practice URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center space-x-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                  <span>LeetCode URL (<code className="text-amber-300 font-mono">leetcode_url</code>)</span>
                </label>
                <input
                  type="url"
                  value={formData.leetcode_url}
                  onChange={(e) => setFormData({ ...formData, leetcode_url: e.target.value })}
                  placeholder="https://leetcode.com/problems/..."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            {/* GROUP 3: WebAssembly SQL Engine */}
            <div className="space-y-3.5 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Cpu className="w-3.5 h-3.5" />
                <span>3. WebAssembly SQL Engine</span>
              </span>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1">
                    <Database className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Schema Setup (init_sql) *</span>
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">SQLite In-Memory</span>
                </div>
                <textarea
                  rows={4}
                  required
                  value={formData.init_sql}
                  onChange={(e) => setFormData({ ...formData, init_sql: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1">
                    <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Expected Answer (solution_query) *</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleTestWasm}
                    disabled={isTestingWasm}
                    className="px-2 py-0.5 rounded bg-indigo-600/30 text-indigo-300 text-[10px] font-bold inline-flex items-center space-x-1 hover:bg-indigo-600/50 transition"
                  >
                    {isTestingWasm ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3 text-cyan-400" />}
                    <span>Test WASM</span>
                  </button>
                </div>
                <textarea
                  rows={2}
                  required
                  value={formData.solution_query}
                  onChange={(e) => setFormData({ ...formData, solution_query: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-400"
                />
              </div>

              {wasmResult && (
                <div className={`p-3 rounded-xl text-xs border ${
                  wasmResult.error ? 'bg-rose-950/40 border-rose-500/40 text-rose-300' : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                }`}>
                  <div className="font-bold flex items-center space-x-1.5 mb-1">
                    {wasmResult.error ? <AlertCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    <span>{wasmResult.error ? 'Syntax Error' : `Validated (${wasmResult.executionTimeMs}ms)`}</span>
                  </div>
                  {wasmResult.error ? (
                    <p className="font-mono text-[11px]">{wasmResult.error}</p>
                  ) : (
                    <p className="text-[11px] text-slate-300 font-mono">
                      Columns: {wasmResult.studentOutput?.columns?.join(', ')} ({wasmResult.studentOutput?.values?.length} rows)
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center space-x-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 shadow-md shadow-rose-600/30 flex items-center justify-center space-x-2 transition disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving to Supabase...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{isEditing ? `Update Day ${formData.day_number}` : 'Publish Challenge'}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition"
                title="Reset form"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Existing Challenges List */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              Live Challenges ({challenges.length})
            </h2>

            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search challenges..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3 bg-slate-900/40 border border-slate-800 rounded-3xl">
              <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
              <p className="text-xs text-slate-400">Loading from Supabase...</p>
            </div>
          ) : filteredChallenges.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl space-y-2">
              <Database className="w-8 h-8 text-slate-600 mx-auto" />
              <h3 className="text-xs font-bold text-slate-300">No Challenges Found</h3>
              <p className="text-[11px] text-slate-500">Use the form on the left to author daily challenges.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredChallenges.map((c) => {
                const targetId = c.id || c.day_number;
                const isCurrent = isEditing && formData.day_number === c.day_number;

                return (
                  <div
                    key={c.id || c.day_number}
                    className={`bg-slate-900/90 border rounded-2xl p-4 transition flex items-center justify-between gap-3 shadow-lg ${
                      isCurrent
                        ? 'border-cyan-400 bg-slate-900 ring-1 ring-cyan-400/40'
                        : 'border-slate-800/90 hover:border-slate-700'
                    }`}
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center space-x-2 flex-wrap gap-1">
                        <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-black">
                          Day {c.day_number}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                          c.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-400' : c.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-400' : 'bg-rose-500/10 text-rose-400'
                        }`}>
                          {c.difficulty}
                        </span>
                        <span className="text-[10px] font-semibold text-cyan-300">
                          +{c.points} XP
                        </span>
                        {c.video_url && (
                          <span className="flex items-center text-[10px] font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.2 rounded border border-rose-500/20">
                            <Video className="w-3 h-3 mr-0.5" />
                            <span>Video</span>
                          </span>
                        )}
                        {c.leetcode_url && (
                          <span className="flex items-center text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                            <ExternalLink className="w-3 h-3 mr-0.5" />
                            <span>LeetCode</span>
                          </span>
                        )}
                      </div>
                      <h3 className="text-xs sm:text-sm font-bold text-white truncate">{c.title}</h3>
                      <p className="text-[11px] text-slate-400 line-clamp-1">{c.description}</p>
                    </div>

                    <div className="flex items-center space-x-1.5 shrink-0">
                      {/* Unlock/Lock Toggle Button */}
                      <button
                        type="button"
                        disabled={togglingId === targetId}
                        onClick={() => toggleUnlockStatus(c)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition border ${
                          c.is_unlocked
                            ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border-slate-700'
                        }`}
                        title={c.is_unlocked ? 'Unlocked for students (Click to Lock)' : 'Locked (Click to Unlock for students)'}
                      >
                        {togglingId === targetId ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                        ) : c.is_unlocked ? (
                          <>
                            <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Unlocked</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3.5 h-3.5 text-slate-400" />
                            <span>Locked</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleEdit(c)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center space-x-1 border border-slate-700 transition"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        disabled={deletingId === targetId}
                        onClick={() => handleDelete(c)}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs transition"
                        title="Delete challenge"
                      >
                        {deletingId === targetId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default ChallengeManager;
