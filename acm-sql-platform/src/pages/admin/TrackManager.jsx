import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Layers, 
  Plus, 
  Edit3, 
  Trash2, 
  Save, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Search, 
  Sparkles,
  X
} from 'lucide-react';

const initialTrackForm = {
  id: null,
  title: '',
  slug: '',
  description: '',
  icon: 'Layers',
  order_index: 1,
};

const TrackManager = () => {
  const [formData, setFormData] = useState(initialTrackForm);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState(null);

  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchTracks();
  }, []);

  const fetchTracks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tracks')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;
      setTracks(data || []);

      if (!isEditing) {
        const nextOrder = (data && data.length > 0)
          ? Math.max(...data.map(t => Number(t.order_index) || 0)) + 1
          : 1;
        setFormData(prev => ({ ...prev, order_index: nextOrder }));
      }
    } catch (err) {
      console.error('Error fetching tracks:', err);
      setNotice({ type: 'error', text: `Failed to load tracks: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (track) => {
    setIsEditing(true);
    setNotice(null);
    setFormData({
      id: track.id,
      title: track.title || '',
      slug: track.slug || '',
      description: track.description || '',
      icon: track.icon || 'Layers',
      order_index: track.order_index ?? 1,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    setIsEditing(false);
    setNotice(null);
    const nextOrder = tracks.length > 0
      ? Math.max(...tracks.map(t => Number(t.order_index) || 0)) + 1
      : 1;
    setFormData({
      ...initialTrackForm,
      order_index: nextOrder,
    });
  };

  const generateSlug = (title) => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  const handleTitleChange = (e) => {
    const val = e.target.value;
    setFormData(prev => ({
      ...prev,
      title: val,
      slug: !isEditing || !prev.slug ? generateSlug(val) : prev.slug,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setNotice(null);

    try {
      if (!formData.title.trim()) throw new Error('Please enter a track title.');
      if (!formData.slug.trim()) throw new Error('Please enter a track URL slug.');

      const payload = {
        title: formData.title.trim(),
        slug: formData.slug.trim(),
        description: formData.description.trim(),
        icon: formData.icon || 'Layers',
        order_index: Number(formData.order_index) || 1,
      };

      if (isEditing && formData.id) {
        const { error } = await supabase
          .from('tracks')
          .update(payload)
          .eq('id', formData.id);
        if (error) throw error;
        setNotice({ type: 'success', text: `Track "${payload.title}" updated!` });
      } else {
        const { error } = await supabase
          .from('tracks')
          .insert([payload]);
        if (error) throw error;
        setNotice({ type: 'success', text: `Track "${payload.title}" created successfully!` });
      }

      handleReset();
      await fetchTracks();
    } catch (err) {
      console.error('Submit track error:', err);
      setNotice({ type: 'error', text: `Failed to save track: ${err.message}` });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (track) => {
    const confirmDelete = window.confirm(`Delete Track "${track.title}"? Associated topics might also be removed.`);
    if (!confirmDelete) return;

    setDeletingId(track.id);
    try {
      const { error } = await supabase.from('tracks').delete().eq('id', track.id);
      if (error) throw error;

      setNotice({ type: 'success', text: `Track "${track.title}" deleted.` });
      setTracks(prev => prev.filter(t => t.id !== track.id));
      if (formData.id === track.id) handleReset();
    } catch (err) {
      console.error('Delete track error:', err);
      setNotice({ type: 'error', text: `Delete failed: ${err.message}` });
    } finally {
      setDeletingId(null);
    }
  };

  const filteredTracks = tracks.filter(t => 
    t.title.toLowerCase().includes(search.toLowerCase()) || 
    t.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-5 sm:p-6 rounded-3xl backdrop-blur-xl">
        <div>
          <div className="flex items-center space-x-2.5 mb-1">
            <span className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white shadow-md">
              <Layers className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              Curriculum Tracks Manager
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Structure the SQL syllabus into progressive learning tracks stored dynamically in Supabase.
          </p>
        </div>

        <span className="px-3.5 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold self-start sm:self-auto">
          {tracks.length} Tracks Published
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
              <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold">
                {isEditing ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              </div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                {isEditing ? 'Edit Track' : 'Create New Track'}
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
              <label className="block text-xs font-semibold text-slate-300 mb-1">Track Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={handleTitleChange}
                placeholder="e.g. Intermediate SQL & Joins"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Slug *</label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="intermediate-sql"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
                />
              </div>

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
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Master multi-table relations, joins, and aggregations..."
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400 leading-relaxed"
              />
            </div>

            <div className="pt-2 flex items-center space-x-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 shadow-md shadow-indigo-600/30 flex items-center justify-center space-x-2 transition disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{isEditing ? 'Update Track' : 'Save Track'}</span>
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
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              Published Tracks ({tracks.length})
            </h2>

            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tracks..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3 bg-slate-900/40 border border-slate-800 rounded-3xl">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
              <p className="text-xs text-slate-400">Loading tracks...</p>
            </div>
          ) : filteredTracks.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl space-y-2">
              <Layers className="w-8 h-8 text-slate-600 mx-auto" />
              <h3 className="text-xs font-bold text-slate-300">No Tracks Found</h3>
              <p className="text-[11px] text-slate-500">Create your first curriculum track on the left.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTracks.map((t) => {
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
                        <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">
                          #{t.order_index}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                          /{t.slug}
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

export default TrackManager;
