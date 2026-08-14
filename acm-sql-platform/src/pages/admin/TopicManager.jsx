import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  BookOpen, 
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
  X
} from 'lucide-react';

const initialTopicForm = {
  id: null,
  track_id: '',
  title: '',
  description: '',
  content_markdown: '# Introduction\n\nExplain the core SQL concept here.\n\n```sql\nSELECT * FROM table_name;\n```',
  order_index: 1,
};

const TopicManager = () => {
  const [formData, setFormData] = useState(initialTopicForm);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState(null);

  const [topics, setTopics] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTrackFilter, setSelectedTrackFilter] = useState('ALL');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // Fetch tracks for dropdown selection
      const { data: tracksData } = await supabase
        .from('tracks')
        .select('id, title, slug')
        .order('order_index', { ascending: true });

      setTracks(tracksData || []);

      if (tracksData && tracksData.length > 0 && !formData.track_id) {
        setFormData(prev => ({ ...prev, track_id: tracksData[0].id }));
      }

      // Fetch topics
      const { data: topicsData, error } = await supabase
        .from('topics')
        .select('*, tracks(title)')
        .order('order_index', { ascending: true });

      if (error) throw error;
      setTopics(topicsData || []);
    } catch (err) {
      console.error('Error loading topics/tracks:', err);
      setNotice({ type: 'error', text: `Failed to load topics: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (topic) => {
    setIsEditing(true);
    setNotice(null);
    setFormData({
      id: topic.id,
      track_id: topic.track_id || (tracks[0]?.id ?? ''),
      title: topic.title || '',
      description: topic.description || '',
      content_markdown: topic.content_markdown || initialTopicForm.content_markdown,
      order_index: topic.order_index ?? 1,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    setIsEditing(false);
    setNotice(null);
    setFormData({
      ...initialTopicForm,
      track_id: tracks[0]?.id || '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setNotice(null);

    try {
      if (!formData.title.trim()) throw new Error('Please enter a topic title.');
      if (!formData.track_id) throw new Error('Please select a parent track.');

      const payload = {
        track_id: formData.track_id,
        title: formData.title.trim(),
        description: formData.description.trim(),
        content_markdown: formData.content_markdown.trim(),
        order_index: Number(formData.order_index) || 1,
      };

      if (isEditing && formData.id) {
        const { error } = await supabase
          .from('topics')
          .update(payload)
          .eq('id', formData.id);
        if (error) throw error;
        setNotice({ type: 'success', text: `Topic "${payload.title}" updated!` });
      } else {
        const { error } = await supabase
          .from('topics')
          .insert([payload]);
        if (error) throw error;
        setNotice({ type: 'success', text: `Topic "${payload.title}" created successfully!` });
      }

      handleReset();
      await fetchInitialData();
    } catch (err) {
      console.error('Submit topic error:', err);
      setNotice({ type: 'error', text: `Failed to save topic: ${err.message}` });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (topic) => {
    const confirmDelete = window.confirm(`Delete Topic "${topic.title}"?`);
    if (!confirmDelete) return;

    setDeletingId(topic.id);
    try {
      const { error } = await supabase.from('topics').delete().eq('id', topic.id);
      if (error) throw error;

      setNotice({ type: 'success', text: `Topic "${topic.title}" deleted.` });
      setTopics(prev => prev.filter(t => t.id !== topic.id));
      if (formData.id === topic.id) handleReset();
    } catch (err) {
      console.error('Delete topic error:', err);
      setNotice({ type: 'error', text: `Delete failed: ${err.message}` });
    } finally {
      setDeletingId(null);
    }
  };

  const filteredTopics = topics.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(search.toLowerCase()));
    const matchesTrack = selectedTrackFilter === 'ALL' || t.track_id === selectedTrackFilter;
    return matchesSearch && matchesTrack;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-5 sm:p-6 rounded-3xl backdrop-blur-xl">
        <div>
          <div className="flex items-center space-x-2.5 mb-1">
            <span className="p-2 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white shadow-md">
              <BookOpen className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              Learning Topics & Lessons
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Write markdown lessons and assign them to curriculum tracks dynamically.
          </p>
        </div>

        <span className="px-3.5 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-bold self-start sm:self-auto">
          {topics.length} Topics Total
        </span>
      </div>

      {notice && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between text-xs sm:text-sm font-semibold ${
          notice.type === 'success' ? 'bg-teal-950/80 border-teal-500/40 text-teal-200' : 'bg-rose-950/80 border-rose-500/40 text-rose-200'
        }`}>
          <div className="flex items-center space-x-2.5">
            {notice.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-teal-400" /> : <AlertCircle className="w-5 h-5 text-rose-400" />}
            <span>{notice.text}</span>
          </div>
          <button onClick={() => setNotice(null)} className="p-1 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Form Column */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl backdrop-blur-xl sticky top-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center font-bold">
                {isEditing ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              </div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                {isEditing ? 'Edit Topic' : 'Add Topic'}
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
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Parent Track *</label>
              <select
                required
                value={formData.track_id}
                onChange={(e) => setFormData({ ...formData, track_id: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-cyan-400"
              >
                {tracks.map(tr => (
                  <option key={tr.id} value={tr.id}>{tr.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Topic Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. INNER JOIN & Cross Tables"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Order Index</label>
                <input
                  type="number"
                  min="1"
                  value={formData.order_index}
                  onChange={(e) => setFormData({ ...formData, order_index: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Short Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Query related relational rows..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Lesson Content (Markdown) *</label>
              <textarea
                rows={6}
                required
                value={formData.content_markdown}
                onChange={(e) => setFormData({ ...formData, content_markdown: e.target.value })}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-400 leading-normal"
              />
            </div>

            <div className="pt-2 flex items-center space-x-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 shadow-md shadow-cyan-600/30 flex items-center justify-center space-x-2 transition disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{isEditing ? 'Update Topic' : 'Save Topic'}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>

        {/* List Column */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
            <select
              value={selectedTrackFilter}
              onChange={(e) => setSelectedTrackFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 focus:outline-none focus:border-cyan-400"
            >
              <option value="ALL">All Tracks ({topics.length})</option>
              {tracks.map(tr => (
                <option key={tr.id} value={tr.id}>{tr.title}</option>
              ))}
            </select>

            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search topics..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3 bg-slate-900/40 border border-slate-800 rounded-3xl">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
              <p className="text-xs text-slate-400">Loading topics...</p>
            </div>
          ) : filteredTopics.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl space-y-2">
              <BookOpen className="w-8 h-8 text-slate-600 mx-auto" />
              <h3 className="text-xs font-bold text-slate-300">No Topics Found</h3>
              <p className="text-[11px] text-slate-500">Create a topic lesson on the left.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTopics.map((t) => {
                const isCurrent = isEditing && formData.id === t.id;
                return (
                  <div
                    key={t.id}
                    className={`bg-slate-900/90 border rounded-2xl p-4 sm:p-5 transition flex items-center justify-between gap-4 shadow-lg ${
                      isCurrent ? 'border-cyan-400 bg-slate-900 ring-1 ring-cyan-400/40' : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-bold">
                          #{t.order_index}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400 truncate">
                          {t.tracks?.title || 'General Track'}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white truncate">{t.title}</h3>
                      <p className="text-xs text-slate-400 line-clamp-1">{t.description}</p>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleEdit(t)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center space-x-1 border border-slate-700"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        disabled={deletingId === t.id}
                        onClick={() => handleDelete(t)}
                        className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs"
                      >
                        {deletingId === t.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
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

export default TopicManager;
