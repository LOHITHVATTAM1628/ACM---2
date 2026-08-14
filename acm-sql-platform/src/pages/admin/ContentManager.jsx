import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { executeDryRun } from '../../lib/sqlEngine';
import { 
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
  Sparkles, 
  Trophy,
  Terminal,
  Clock,
  Check,
  X
} from 'lucide-react';

const defaultFormState = {
  id: null,
  day_number: '',
  title: '',
  description: '',
  difficulty: 'Easy',
  points: 100,
  init_sql: `-- Schema & Seed Data (SQLite / PostgreSQL compatible)\nCREATE TABLE students (\n  id INT PRIMARY KEY,\n  full_name TEXT,\n  gpa REAL,\n  is_active INT\n);\n\nINSERT INTO students VALUES\n(1, 'Alice Johnson', 3.85, 1),\n(2, 'Bob Smith', 3.20, 1),\n(3, 'Charlie Brown', 3.92, 0);`,
  solution_query: `SELECT id, full_name, gpa FROM students WHERE is_active = 1 AND gpa > 3.5 ORDER BY gpa DESC;`,
};

const ContentManager = () => {
  // Form State (Left Side)
  const [formData, setFormData] = useState(defaultFormState);
  const [isEditing, setIsEditing] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formNotice, setFormNotice] = useState(null); // { type: 'success' | 'error', text: '' }

  // SQL Test State
  const [isTestingSql, setIsTestingSql] = useState(false);
  const [testResult, setTestResult] = useState(null); // { error: string, output: obj, executionTimeMs: number }

  // Challenges List State (Right Side)
  const [challenges, setChallenges] = useState([]);
  const [loadingChallenges, setLoadingChallenges] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  // Auto-dismiss form notice
  useEffect(() => {
    if (formNotice) {
      const timer = setTimeout(() => setFormNotice(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [formNotice]);

  // Fetch all challenges on mount
  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    setLoadingChallenges(true);
    try {
      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .order('day_number', { ascending: true });

      if (error) throw error;
      setChallenges(data || []);

      // If adding new, auto-suggest next day number
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
      console.error('Error fetching challenges:', err);
      setFormNotice({ type: 'error', text: `Failed to load challenges: ${err.message}` });
    } finally {
      setLoadingChallenges(false);
    }
  };

  // Populate form with existing challenge data
  const handleEditClick = (challenge) => {
    setIsEditing(true);
    setTestResult(null);
    setFormNotice(null);
    setFormData({
      id: challenge.id || null,
      day_number: challenge.day_number ?? '',
      title: challenge.title || '',
      description: challenge.description || '',
      difficulty: challenge.difficulty || 'Easy',
      points: challenge.points ?? 100,
      init_sql: challenge.init_sql || '',
      solution_query: challenge.solution_query || '',
    });

    // Scroll smoothly to top of form on mobile
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reset form to clean state
  const handleResetForm = () => {
    setIsEditing(false);
    setTestResult(null);
    setFormNotice(null);

    const nextDay = challenges.length > 0
      ? Math.max(...challenges.map((c) => Number(c.day_number) || 0)) + 1
      : 1;

    setFormData({
      ...defaultFormState,
      day_number: nextDay <= 21 ? nextDay : '',
    });
  };

  // Test SQL Challenge with WASM Engine
  const handleTestSql = async () => {
    if (!formData.init_sql.trim()) {
      setFormNotice({ type: 'error', text: 'Please enter schema init_sql before testing.' });
      return;
    }
    if (!formData.solution_query.trim()) {
      setFormNotice({ type: 'error', text: 'Please enter a solution_query before testing.' });
      return;
    }

    setIsTestingSql(true);
    setTestResult(null);

    try {
      const res = await executeDryRun({
        initSql: formData.init_sql,
        studentQuery: formData.solution_query,
      });

      setTestResult(res);

      if (res.error) {
        setFormNotice({ type: 'error', text: `SQL Error: ${res.error}` });
      } else {
        setFormNotice({ 
          type: 'success', 
          text: `SQL Query Validated! Executed in ${res.executionTimeMs}ms (${res.studentOutput.values.length} rows returned).` 
        });
      }
    } catch (err) {
      setTestResult({ error: err.message });
      setFormNotice({ type: 'error', text: `Execution failed: ${err.message}` });
    } finally {
      setIsTestingSql(false);
    }
  };

  // Handle Form Submit: Upsert to Supabase
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormNotice(null);

    try {
      const dayNum = Number(formData.day_number);
      const pointsNum = Number(formData.points);

      if (!dayNum || dayNum < 1) {
        throw new Error('Please enter a valid Day Number (e.g. 1 to 21).');
      }
      if (!formData.title.trim()) {
        throw new Error('Please provide a challenge title.');
      }
      if (!formData.description.trim()) {
        throw new Error('Please provide a challenge description.');
      }
      if (!formData.init_sql.trim()) {
        throw new Error('Please provide the initial SQL schema/seed script.');
      }
      if (!formData.solution_query.trim()) {
        throw new Error('Please provide the solution SQL query.');
      }

      const payload = {
        day_number: dayNum,
        title: formData.title.trim(),
        description: formData.description.trim(),
        difficulty: formData.difficulty || 'Easy',
        points: pointsNum || 100,
        init_sql: formData.init_sql.trim(),
        solution_query: formData.solution_query.trim(),
      };

      // If updating an existing record with an id, include it
      if (formData.id) {
        payload.id = formData.id;
      }

      // Upsert into Supabase challenges table
      const { data, error } = await supabase
        .from('challenges')
        .upsert(payload, {
          onConflict: 'day_number',
        })
        .select();

      if (error) throw error;

      setFormNotice({
        type: 'success',
        text: `🎉 Day ${dayNum} Challenge ("${payload.title}") successfully saved to Supabase!`,
      });

      // Clear & reset form
      handleResetForm();

      // Refresh challenges list to instantly sync UI
      await fetchChallenges();
    } catch (err) {
      console.error('Submit error:', err);
      setFormNotice({
        type: 'error',
        text: `Save failed: ${err.message}`,
      });
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Delete Challenge
  const handleDelete = async (challenge) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to permanently delete Day ${challenge.day_number}: "${challenge.title}"?`
    );
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

      setFormNotice({
        type: 'success',
        text: `Deleted Day ${challenge.day_number} challenge.`,
      });

      // If currently editing the deleted challenge, reset the form
      if (formData.day_number === challenge.day_number) {
        handleResetForm();
      }

      // Instant state update
      setChallenges((prev) => prev.filter((c) => (c.id ? c.id !== challenge.id : c.day_number !== challenge.day_number)));
    } catch (err) {
      console.error('Delete error:', err);
      setFormNotice({
        type: 'error',
        text: `Delete failed: ${err.message}`,
      });
    } finally {
      setDeletingId(null);
    }
  };

  // Filter challenges on the right side
  const filteredChallenges = challenges.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      (c.title && c.title.toLowerCase().includes(q)) ||
      (c.day_number && String(c.day_number).includes(q)) ||
      (c.difficulty && c.difficulty.toLowerCase().includes(q)) ||
      (c.description && c.description.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800/90 p-5 sm:p-6 rounded-3xl backdrop-blur-xl">
        <div>
          <div className="flex items-center space-x-2.5 mb-1.5">
            <span className="p-2 rounded-xl bg-gradient-to-tr from-rose-600 to-indigo-600 text-white shadow-md shadow-rose-600/30">
              <Database className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              21-Day SQL Content Management Portal
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Create, update, test with in-browser WebAssembly, and sync SQL challenges directly to Supabase.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="px-3.5 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold flex items-center space-x-1.5">
            <Trophy className="w-4 h-4 text-cyan-400" />
            <span>{challenges.length} Challenges Active</span>
          </span>
        </div>
      </div>

      {/* Dynamic Status / Feedback Alert */}
      {formNotice && (
        <div
          className={`flex items-start justify-between p-4 rounded-2xl border backdrop-blur-md animate-in slide-in-from-top-3 duration-200 ${
            formNotice.type === 'success'
              ? 'bg-teal-950/80 border-teal-500/40 text-teal-200'
              : 'bg-rose-950/80 border-rose-500/40 text-rose-200'
          }`}
        >
          <div className="flex items-center space-x-3 text-xs sm:text-sm font-semibold">
            {formNotice.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span>{formNotice.text}</span>
          </div>
          <button
            onClick={() => setFormNotice(null)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Add / Edit Challenge Form (5 cols on lg, 6 cols on xl) */}
        <div className="lg:col-span-6 xl:col-span-5 bg-slate-900/90 border border-slate-800/90 rounded-3xl p-6 sm:p-7 shadow-2xl backdrop-blur-xl sticky top-20">
          
          <div className="flex items-center justify-between pb-5 border-b border-slate-800 mb-6">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
                {isEditing ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              </div>
              <div>
                <h2 className="text-base font-extrabold text-white">
                  {isEditing ? `Edit Day ${formData.day_number} Challenge` : 'Add New Challenge'}
                </h2>
                <p className="text-[11px] text-slate-400">
                  {isEditing ? 'Updating live record in Supabase' : 'Fill details to publish a new day challenge'}
                </p>
              </div>
            </div>

            {isEditing && (
              <button
                type="button"
                onClick={handleResetForm}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-semibold flex items-center space-x-1 transition"
                title="Cancel edit mode and create a new challenge"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Day Number & Difficulty & Points */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Day Number *
                </label>
                <input
                  type="number"
                  min="1"
                  max="21"
                  required
                  value={formData.day_number}
                  onChange={(e) => setFormData({ ...formData, day_number: e.target.value })}
                  placeholder="1-21"
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-cyan-400 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Difficulty
                </label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-cyan-400 transition"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Points (XP) *
                </label>
                <input
                  type="number"
                  min="10"
                  step="10"
                  required
                  value={formData.points}
                  onChange={(e) => setFormData({ ...formData, points: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-cyan-400 transition"
                />
              </div>
            </div>

            {/* Challenge Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Challenge Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Basic SELECT & Filtering with WHERE"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-400 transition"
              />
            </div>

            {/* Problem Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Description & Problem Statement *
              </label>
              <textarea
                rows={3}
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Retrieve all active student members registered after 2024..."
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400 leading-relaxed transition"
              />
            </div>

            {/* Init SQL Schema Script */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                  <Database className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Initial Schema & Seed SQL (init_sql) *</span>
                </label>
                <span className="text-[10px] text-slate-500 font-mono">SQLite In-Memory</span>
              </div>
              <textarea
                rows={5}
                required
                value={formData.init_sql}
                onChange={(e) => setFormData({ ...formData, init_sql: e.target.value })}
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-400 leading-normal"
              />
            </div>

            {/* Solution Query */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                  <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Expected Solution Query (solution_query) *</span>
                </label>
                <button
                  type="button"
                  onClick={handleTestSql}
                  disabled={isTestingSql}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 text-[11px] font-bold inline-flex items-center space-x-1 transition"
                >
                  {isTestingSql ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3 text-cyan-400" />}
                  <span>Test WASM</span>
                </button>
              </div>
              <textarea
                rows={3}
                required
                value={formData.solution_query}
                onChange={(e) => setFormData({ ...formData, solution_query: e.target.value })}
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-400 leading-normal"
              />
            </div>

            {/* SQL Execution Test Feedback */}
            {testResult && (
              <div
                className={`p-3.5 rounded-xl text-xs border ${
                  testResult.error
                    ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                    : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                }`}
              >
                <div className="flex items-center justify-between font-bold mb-1">
                  <span className="flex items-center space-x-1.5">
                    {testResult.error ? <AlertCircle className="w-3.5 h-3.5 text-rose-400" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                    <span>{testResult.error ? 'Syntax Error' : 'Validation Success'}</span>
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">
                    {testResult.executionTimeMs}ms
                  </span>
                </div>
                {testResult.error ? (
                  <p className="font-mono text-[11px]">{testResult.error}</p>
                ) : (
                  <p className="text-[11px] text-slate-300">
                    Returned <strong className="text-white">{testResult.studentOutput?.values?.length}</strong> rows. Columns: {testResult.studentOutput?.columns?.join(', ')}
                  </p>
                )}
              </div>
            )}

            {/* Submit & Reset Buttons */}
            <div className="pt-3 flex items-center space-x-3">
              <button
                type="submit"
                disabled={formSubmitting}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-rose-600 via-indigo-600 to-cyan-600 hover:from-rose-500 hover:to-cyan-500 shadow-lg shadow-rose-600/25 flex items-center justify-center space-x-2 transition-all transform active:scale-98 disabled:opacity-60"
              >
                {formSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
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
                onClick={handleResetForm}
                className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
                title="Reset form"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

          </form>
        </div>

        {/* RIGHT COLUMN: Existing Challenges List (7 cols on lg, 7 cols on xl) */}
        <div className="lg:col-span-6 xl:col-span-7 space-y-4">
          
          {/* List Controls & Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-extrabold text-white">
                Published Challenges ({challenges.length})
              </h2>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Day, Title, Difficulty..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition"
              />
            </div>
          </div>

          {/* Cards List Body */}
          {loadingChallenges ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3 bg-slate-900/40 border border-slate-800/80 rounded-3xl">
              <div className="w-10 h-10 rounded-full border-4 border-indigo-500/20 border-t-indigo-400 animate-spin" />
              <p className="text-xs font-semibold text-slate-400 animate-pulse">
                Loading challenges from Supabase...
              </p>
            </div>
          ) : filteredChallenges.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl space-y-3">
              <Database className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-sm font-bold text-slate-300">No Challenges Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchQuery
                  ? `No challenges match "${searchQuery}".`
                  : 'No 21-day challenges exist in your database. Use the form on the left to add Day 1!'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredChallenges.map((challenge) => {
                const targetId = challenge.id || challenge.day_number;
                const isDeleting = deletingId === targetId;
                const isCurrentEdit = isEditing && formData.day_number === challenge.day_number;

                return (
                  <div
                    key={challenge.id || challenge.day_number}
                    className={`bg-slate-900/90 border rounded-2xl p-4 sm:p-5 transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group shadow-lg ${
                      isCurrentEdit
                        ? 'border-cyan-400/80 bg-slate-900 shadow-cyan-500/10 ring-1 ring-cyan-400/40'
                        : 'border-slate-800/90 hover:border-slate-700/90 hover:bg-slate-800/40'
                    }`}
                  >
                    {/* Left info */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-black">
                          Day {challenge.day_number}
                        </span>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            challenge.difficulty === 'Easy'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : challenge.difficulty === 'Medium'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {challenge.difficulty || 'Easy'}
                        </span>

                        <span className="text-[10px] font-semibold text-cyan-300">
                          +{challenge.points || 100} XP
                        </span>

                        {isCurrentEdit && (
                          <span className="text-[10px] font-bold text-cyan-400 animate-pulse">
                            ● Editing Now
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                        {challenge.title}
                      </h3>

                      <p className="text-xs text-slate-400 line-clamp-1">
                        {challenge.description}
                      </p>
                    </div>

                    {/* Right actions */}
                    <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => handleEditClick(challenge)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold flex items-center space-x-1.5 transition"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={() => handleDelete(challenge)}
                        className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold flex items-center space-x-1.5 transition disabled:opacity-50"
                      >
                        {isDeleting ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                        <span>Delete</span>
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

export default ContentManager;
