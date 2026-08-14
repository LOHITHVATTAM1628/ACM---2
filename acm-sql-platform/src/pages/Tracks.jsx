import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  BookOpen, 
  Layers, 
  Terminal, 
  Briefcase, 
  Clock, 
  ArrowRight, 
  Award,
  Loader2,
  Sparkles,
  Database
} from 'lucide-react';

const iconMap = {
  Terminal: Terminal,
  Briefcase: Briefcase,
  Layers: Layers,
  BookOpen: BookOpen,
  Database: Database,
};

const Tracks = () => {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTracks = async () => {
      setLoading(true);
      setError(null);
      try {
        // Attempt fetch with order_index, fall back to id
        let { data, error: fetchErr } = await supabase
          .from('tracks')
          .select('*')
          .order('order_index', { ascending: true });

        if (fetchErr) {
          const fallback = await supabase
            .from('tracks')
            .select('*')
            .order('id', { ascending: true });
          if (fallback.error) throw fallback.error;
          data = fallback.data;
        }

        setTracks(data || []);
      } catch (err) {
        console.error('Error fetching tracks from Supabase:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTracks();
  }, []);

  const handleStartTrack = (track) => {
    const topicId = track.first_topic_id || 'select-basics';
    navigate(`/student/tracks/${track.slug}/${topicId}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-800/80 pb-8">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Live Curriculum Tracks</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              SQL Mastery Curriculum
            </h1>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
              Targeted skill tracks tailored for university coursework, competitive placements, and real-world database engineering.
            </p>
          </div>

          {/* Quick Info Badge */}
          <div className="flex items-center space-x-3 bg-slate-900/80 border border-slate-800 px-5 py-3 rounded-2xl">
            <Award className="w-6 h-6 text-indigo-400" />
            <div className="text-xs">
              <span className="font-semibold text-slate-200 block">
                {tracks.length} Active {tracks.length === 1 ? 'Track' : 'Tracks'}
              </span>
              <span className="text-slate-400">Interactive practice & verified syllabus</span>
            </div>
          </div>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-4">
            <div className="relative flex items-center justify-center">
              <div className="w-14 h-14 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin" />
              <Loader2 className="w-6 h-6 text-cyan-400 absolute animate-pulse" />
            </div>
            <p className="text-xs sm:text-sm font-semibold text-slate-400 animate-pulse">
              Loading curriculum tracks from Supabase...
            </p>
          </div>
        ) : error && tracks.length === 0 ? (
          /* Error State */
          <div className="p-12 text-center bg-rose-950/20 border border-rose-500/30 rounded-3xl space-y-3 max-w-lg mx-auto">
            <Database className="w-10 h-10 text-rose-400 mx-auto" />
            <h3 className="text-base font-bold text-white">Failed to load tracks</h3>
            <p className="text-xs text-rose-300 leading-relaxed">{error}</p>
          </div>
        ) : tracks.length === 0 ? (
          /* Professional Empty State */
          <div className="p-16 text-center bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl space-y-4 max-w-xl mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">Curriculum in Preparation</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              New tracks are being crafted by the ACM team. Check back soon or visit the 21-Day Contest to practice daily queries!
            </p>
            <button
              onClick={() => navigate('/student/contest')}
              className="mt-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-cyan-600 shadow-md shadow-indigo-600/30 inline-flex items-center space-x-2"
            >
              <span>Explore 21-Day Contest</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* Dynamic Tracks Grid */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {tracks.map((track) => {
              const IconComponent = (track.icon && iconMap[track.icon]) || Layers;
              const highlightsArray = Array.isArray(track.highlights)
                ? track.highlights
                : typeof track.highlights === 'string'
                ? track.highlights.split(',').map((s) => s.trim()).filter(Boolean)
                : ['Core SQL', 'Query Optimization', 'Relational Schemas'];
              
              const progressVal = track.progress ?? 0;

              return (
                <div
                  key={track.id || track.slug}
                  className="bg-slate-900/85 border border-slate-800/90 rounded-3xl p-6 sm:p-7 hover:border-slate-700/90 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
                    {/* Top Bar on Card */}
                    <div className="flex items-start justify-between mb-5">
                      <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center p-3 group-hover:border-cyan-500/40 group-hover:scale-105 transition-all">
                        <IconComponent className="w-7 h-7 text-cyan-400" />
                      </div>

                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                          track.difficulty === 'Easy'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : track.difficulty === 'Medium'
                            ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/30'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {track.difficulty || 'All Levels'}
                      </span>
                    </div>

                    {/* Title & Description */}
                    <h3 className="text-xl font-bold text-white mb-2.5 group-hover:text-cyan-300 transition-colors">
                      {track.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-6">
                      {track.description}
                    </p>

                    {/* Highlights Bullet Badges */}
                    {highlightsArray.length > 0 && (
                      <div className="space-y-2 mb-6">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                          Core Competencies
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {highlightsArray.map((hl, idx) => (
                            <span
                              key={idx}
                              className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-300"
                            >
                              {hl}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Track Metrics & Progress Section */}
                  <div className="space-y-4 pt-5 border-t border-slate-800/80">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center space-x-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                        <span>{track.topic_count || 0} Topics</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>~{track.estimated_hours || 0} Hours</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-400">Track Progress</span>
                        <span className="text-cyan-300">{progressVal}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-teal-400 rounded-full transition-all duration-500"
                          style={{ width: `${progressVal}%` }}
                        />
                      </div>
                    </div>

                    {/* Action CTA */}
                    <button
                      onClick={() => handleStartTrack(track)}
                      className="w-full mt-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 shadow-md shadow-indigo-600/30 hover:shadow-cyan-500/40 flex items-center justify-center space-x-2 transition-all transform active:scale-[0.99]"
                    >
                      <span>{progressVal > 0 ? 'Continue Track' : 'Start Track'}</span>
                      <ArrowRight className="w-4 h-4 text-cyan-200" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Tracks;
