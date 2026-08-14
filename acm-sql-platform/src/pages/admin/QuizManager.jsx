import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  HelpCircle, 
  Plus, 
  Edit3, 
  Trash2, 
  Save, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Search, 
  Layers, 
  Check, 
  X,
  Calendar,
  Sparkles
} from 'lucide-react';

const initialQuizForm = {
  id: null,
  topic_id: '',
  challenge_id: '',
  question: '',
  options: ['', '', '', ''],
  correct_option_index: 0,
  explanation: '',
};

const QuizManager = () => {
  const [formData, setFormData] = useState(initialQuizForm);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState(null);

  const [questions, setQuestions] = useState([]);
  const [topics, setTopics] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedChallengeFilter, setSelectedChallengeFilter] = useState('ALL');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // 1. Fetch 21-Day challenges for dropdown & lookup
      const { data: challengesData } = await supabase
        .from('challenges')
        .select('id, day_number, title')
        .order('day_number', { ascending: true });

      setChallenges(challengesData || []);

      // 2. Fetch curriculum topics
      const { data: topicsData } = await supabase
        .from('topics')
        .select('id, title')
        .order('order_index', { ascending: true });

      setTopics(topicsData || []);

      if (challengesData && challengesData.length > 0 && !formData.challenge_id) {
        setFormData(prev => ({ ...prev, challenge_id: challengesData[0].id }));
      }

      // 3. Fetch questions from Supabase
      const { data: qData, error } = await supabase
        .from('quiz_questions')
        .select('*')
        .order('id', { ascending: true });

      if (error) {
        console.warn('quiz_questions query notice:', error.message);
      }
      setQuestions(qData || []);
    } catch (err) {
      console.error('Quiz fetch notice:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionChange = (idx, value) => {
    const newOptions = [...formData.options];
    newOptions[idx] = value;
    setFormData({ ...formData, options: newOptions });
  };

  const handleEdit = (item) => {
    setIsEditing(true);
    setNotice(null);
    let parsedOpts = item.options;
    if (typeof parsedOpts === 'string') {
      try { parsedOpts = JSON.parse(parsedOpts); } catch (e) { parsedOpts = ['', '', '', '']; }
    }
    
    // Support both correct_answer and correct_option_index schema variants
    const resolvedCorrectIndex = item.correct_answer !== undefined 
      ? Number(item.correct_answer) 
      : (item.correct_option_index !== undefined ? Number(item.correct_option_index) : 0);

    setFormData({
      id: item.id,
      challenge_id: item.challenge_id || '',
      topic_id: item.topic_id || '',
      question: item.question || '',
      options: Array.isArray(parsedOpts) && parsedOpts.length >= 4 ? parsedOpts : ['', '', '', ''],
      correct_option_index: resolvedCorrectIndex,
      explanation: item.explanation || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    setIsEditing(false);
    setNotice(null);
    setFormData({
      ...initialQuizForm,
      challenge_id: challenges[0]?.id || '',
      topic_id: topics[0]?.id || '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setNotice(null);

    try {
      if (!formData.question.trim()) throw new Error('Please enter the question text.');
      if (formData.options.some(opt => !opt.trim())) throw new Error('Please fill in all 4 multiple choice options.');

      // Map payload key to correct_answer & challenge_id in Supabase
      const payload = {
        challenge_id: formData.challenge_id || null,
        topic_id: formData.topic_id || null,
        question: formData.question.trim(),
        options: formData.options.map(o => o.trim()),
        correct_answer: Number(formData.correct_option_index),
        explanation: formData.explanation.trim(),
      };

      if (isEditing && formData.id) {
        const { error } = await supabase
          .from('quiz_questions')
          .update(payload)
          .eq('id', formData.id);
        if (error) throw error;
        setNotice({ type: 'success', text: 'Quiz question updated successfully in Supabase!' });
      } else {
        const { error } = await supabase
          .from('quiz_questions')
          .insert([payload]);
        if (error) throw error;
        setNotice({ type: 'success', text: 'Quiz question published successfully to Supabase!' });
      }

      handleReset();
      await fetchInitialData();
    } catch (err) {
      console.error('Submit quiz error:', err);
      setNotice({ type: 'error', text: `Failed to save question: ${err.message}` });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item) => {
    const confirmDelete = window.confirm('Delete this quiz question?');
    if (!confirmDelete) return;

    setDeletingId(item.id);
    try {
      const { error } = await supabase.from('quiz_questions').delete().eq('id', item.id);
      if (error) throw error;

      setNotice({ type: 'success', text: 'Quiz question deleted.' });
      setQuestions(prev => prev.filter(q => q.id !== item.id));
      if (formData.id === item.id) handleReset();
    } catch (err) {
      console.error('Delete quiz error:', err);
      setNotice({ type: 'error', text: `Delete failed: ${err.message}` });
    } finally {
      setDeletingId(null);
    }
  };

  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.question && q.question.toLowerCase().includes(search.toLowerCase());
    const matchesChallenge = selectedChallengeFilter === 'ALL' || q.challenge_id === selectedChallengeFilter;
    return matchesSearch && matchesChallenge;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-5 sm:p-6 rounded-3xl backdrop-blur-xl">
        <div>
          <div className="flex items-center space-x-2.5 mb-1">
            <span className="p-2 rounded-xl bg-gradient-to-tr from-emerald-600 to-indigo-600 text-white shadow-md">
              <HelpCircle className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              Quiz & Knowledge Check Question Bank
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Author conceptual multiple-choice questions mapped to specific 21-Day Contest Challenges and Curriculum Topics.
          </p>
        </div>

        <span className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold self-start sm:self-auto">
          {questions.length} Questions in Bank
        </span>
      </div>

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

      {/* Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left: Form */}
        <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl backdrop-blur-xl sticky top-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold">
                {isEditing ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              </div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                {isEditing ? 'Edit Knowledge Check' : 'Create Knowledge Check Question'}
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

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Target 21-Day Challenge Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                <span>Target Contest Day (<code className="text-cyan-300 font-mono">challenge_id</code>) *</span>
              </label>
              <select
                value={formData.challenge_id}
                onChange={(e) => setFormData({ ...formData, challenge_id: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="">-- Optional: Link to Contest Day --</option>
                {challenges.map(ch => (
                  <option key={ch.id} value={ch.id}>
                    Day {ch.day_number}: {ch.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Target Topic Selection */}
            {topics.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center space-x-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Target Curriculum Topic (Optional)</span>
                </label>
                <select
                  value={formData.topic_id}
                  onChange={(e) => setFormData({ ...formData, topic_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="">-- Optional: Select Topic --</option>
                  {topics.map(t => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Question Statement *</label>
              <textarea
                rows={3}
                required
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                placeholder="What is the result of applying an INNER JOIN between two tables when..."
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400 leading-relaxed"
              />
            </div>

            {/* Options List */}
            <div className="space-y-2.5">
              <label className="block text-xs font-semibold text-slate-300">
                Options & Correct Answer Selection (<code className="text-emerald-400 font-mono">correct_answer</code>) *
              </label>
              {formData.options.map((opt, idx) => {
                const isCorrect = Number(formData.correct_option_index) === idx;
                return (
                  <div key={idx} className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, correct_option_index: idx })}
                      className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center border transition shrink-0 ${
                        isCorrect
                          ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-md shadow-emerald-500/30'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                      title={isCorrect ? 'Correct Option (Selected)' : 'Mark as Correct Answer'}
                    >
                      {String.fromCharCode(65 + idx)}
                    </button>
                    <input
                      type="text"
                      required
                      value={opt}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      placeholder={`Option ${String.fromCharCode(65 + idx)} text`}
                      className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-xs text-white focus:outline-none transition ${
                        isCorrect ? 'border-emerald-500/60 ring-1 ring-emerald-500/30' : 'border-slate-800 focus:border-cyan-400'
                      }`}
                    />
                  </div>
                );
              })}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Answer Explanation</label>
              <textarea
                rows={2}
                value={formData.explanation}
                onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                placeholder="Explain why the marked option is correct..."
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="pt-2 flex items-center space-x-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 shadow-md shadow-emerald-600/30 flex items-center justify-center space-x-2 transition disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving to Supabase...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{isEditing ? 'Update Question' : 'Save Question'}</span>
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

        {/* Right: List */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
            <select
              value={selectedChallengeFilter}
              onChange={(e) => setSelectedChallengeFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 focus:outline-none focus:border-cyan-400"
            >
              <option value="ALL">All Days & Questions ({questions.length})</option>
              {challenges.map(ch => (
                <option key={ch.id} value={ch.id}>
                  Day {ch.day_number}: {ch.title}
                </option>
              ))}
            </select>

            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search questions..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3 bg-slate-900/40 border border-slate-800 rounded-3xl">
              <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
              <p className="text-xs text-slate-400">Loading question bank from Supabase...</p>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl space-y-2">
              <HelpCircle className="w-8 h-8 text-slate-600 mx-auto" />
              <h3 className="text-xs font-bold text-slate-300">No Questions Found</h3>
              <p className="text-[11px] text-slate-500">Create multiple choice questions on the left for this day.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredQuestions.map((q) => {
                const isCurrent = isEditing && formData.id === q.id;
                let parsedOpts = q.options;
                if (typeof parsedOpts === 'string') {
                  try { parsedOpts = JSON.parse(parsedOpts); } catch (e) { parsedOpts = []; }
                }

                const resolvedCorrect = q.correct_answer !== undefined 
                  ? Number(q.correct_answer) 
                  : (q.correct_option_index !== undefined ? Number(q.correct_option_index) : 0);

                // Resilient in-memory lookup for linked challenge & topic
                const linkedChallenge = challenges.find(c => c.id === q.challenge_id);
                const linkedTopic = topics.find(t => t.id === q.topic_id);

                return (
                  <div
                    key={q.id}
                    className={`bg-slate-900/90 border rounded-2xl p-4 sm:p-5 transition flex flex-col gap-3 shadow-lg ${
                      isCurrent ? 'border-cyan-400 bg-slate-900 ring-1 ring-cyan-400/40' : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center space-x-2 flex-wrap gap-1">
                          {linkedChallenge ? (
                            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center space-x-1">
                              <Calendar className="w-3 h-3" />
                              <span>Day {linkedChallenge.day_number}: {linkedChallenge.title}</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                              Unassigned Day
                            </span>
                          )}
                          {linkedTopic && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                              {linkedTopic.title}
                            </span>
                          )}
                        </div>
                        <h3 className="text-xs sm:text-sm font-bold text-white leading-snug">{q.question}</h3>
                      </div>

                      <div className="flex items-center space-x-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleEdit(q)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center space-x-1 border border-slate-700 transition"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          disabled={deletingId === q.id}
                          onClick={() => handleDelete(q)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs transition"
                          title="Delete question"
                        >
                          {deletingId === q.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Render options preview */}
                    {Array.isArray(parsedOpts) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                        {parsedOpts.map((opt, idx) => {
                          const isCorrect = resolvedCorrect === idx;
                          return (
                            <div
                              key={idx}
                              className={`p-2 rounded-xl text-[11px] flex items-center space-x-2 border ${
                                isCorrect
                                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 font-bold'
                                  : 'bg-slate-950/60 border-slate-800 text-slate-400'
                              }`}
                            >
                              <span className="w-4 h-4 rounded-full bg-slate-800 text-[10px] flex items-center justify-center font-mono">
                                {String.fromCharCode(65 + idx)}
                              </span>
                              <span className="truncate">{opt}</span>
                              {isCorrect && (
                                <span className="ml-auto text-[9px] font-bold text-emerald-400 uppercase tracking-widest">
                                  CORRECT
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
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

export default QuizManager;
