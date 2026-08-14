import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import CodeMirror from '@uiw/react-codemirror';
import { sql } from '@codemirror/lang-sql';
import { oneDark } from '@codemirror/theme-one-dark';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { executeChallenge, executeDryRun, getSqlInstance, inspectSchema } from '../lib/sqlEngine';
import AiMentor from '../components/AiMentor';
import { 
  Play, 
  Send, 
  ArrowLeft, 
  Database, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  Terminal as TerminalIcon, 
  Table as TableIcon,
  HelpCircle,
  ChevronRight,
  Loader2,
  AlertCircle,
  Video,
  BookOpen,
  Check,
  Award,
  RefreshCw,
  Tv,
  FileQuestion,
  Code2,
  ExternalLink
} from 'lucide-react';

function getYouTubeEmbedUrl(url) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11)
    ? `https://www.youtube-nocookie.com/embed/${match[2]}`
    : url;
}

const ChallengePlayground = () => {
  const { dayNumber } = useParams();
  const { profile, refreshProfile } = useAuth();

  // Top-level learning loop tab: 'lesson' | 'quiz' | 'workspace'
  const [learningTab, setLearningTab] = useState('lesson');

  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [schemaData, setSchemaData] = useState(null);

  // Quiz State
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState({}); // { [questionId]: selectedOptionIndex }
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(null);

  // SQL Workspace State (Preserved across tab switches)
  const [code, setCode] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [editorSubTab, setEditorSubTab] = useState('output'); // 'output' | 'expected' | 'console'
  const [results, setResults] = useState(null);
  const [logs, setLogs] = useState([]);
  const [engineReady, setEngineReady] = useState(false);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);

  // Pre-load sql.js WASM
  useEffect(() => {
    getSqlInstance()
      .then(() => setEngineReady(true))
      .catch((err) => {
        console.error('Failed to initialize WebAssembly SQL engine:', err);
        setLogs((prev) => [...prev, { type: 'error', text: `WASM Load Error: ${err.message}` }]);
      });
  }, []);

  const parsedDay = parseInt(dayNumber, 10);

  // Fetch Challenge & Quizzes from Supabase by day_number
  useEffect(() => {
    if (isNaN(parsedDay) || parsedDay < 1) {
      setError(`Invalid challenge day "${dayNumber || 'undefined'}". Please select a valid challenge from 1 to 21.`);
      setLoading(false);
      setChallenge(null);
      return;
    }

    const fetchChallengeData = async () => {
      setLoading(true);
      setError(null);
      setShowSuccessBanner(false);
      setResults(null);
      setQuizSubmitted(false);
      setQuizAnswers({});
      setQuizScore(null);

      try {
        const { data, error: fetchErr } = await supabase
          .from('challenges')
          .select('*')
          .eq('day_number', parsedDay)
          .maybeSingle();

        if (fetchErr) throw fetchErr;

        if (!data) {
          setError(`Day ${parsedDay} challenge has not been published yet by the chapter administrators.`);
          setChallenge(null);
        } else {
          setChallenge(data);

          // Generate starter code
          const starter = `-- Day ${String(data.day_number).padStart(2, '0')}: ${data.title}\n-- Write your SQL query below:\n\nSELECT \n`;
          setCode(starter);

          // Dynamically inspect schema from init_sql
          if (data.init_sql) {
            const inspected = await inspectSchema(data.init_sql);
            setSchemaData(inspected);
          }

          setLogs([{ 
            type: 'info', 
            text: `Loaded Day ${data.day_number} environment ("${data.title}"). Ready to execute.` 
          }]);

          // Fetch knowledge check quiz questions linked to this challenge
          fetchQuizQuestions(data.id);
        }
      } catch (err) {
        console.error('Error loading challenge:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchChallengeData();
  }, [dayNumber, parsedDay]);

  const fetchQuizQuestions = async (challengeId) => {
    if (!challengeId) return;
    setQuizLoading(true);
    try {
      const { data, error: qErr } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('challenge_id', challengeId)
        .order('id', { ascending: true });

      if (qErr) throw qErr;
      setQuizQuestions(data || []);
    } catch (err) {
      console.warn('Notice: quiz_questions for challenge:', err.message);
      setQuizQuestions([]);
    } finally {
      setQuizLoading(false);
    }
  };

  // Quiz submission & scoring
  const handleQuizSubmit = (e) => {
    e.preventDefault();
    if (quizQuestions.length === 0) return;

    let correctCount = 0;
    quizQuestions.forEach((q) => {
      const selected = quizAnswers[q.id];
      const correct = q.correct_answer !== undefined 
        ? Number(q.correct_answer) 
        : (q.correct_option_index !== undefined ? Number(q.correct_option_index) : 0);

      if (selected === correct) {
        correctCount += 1;
      }
    });

    setQuizScore({
      correct: correctCount,
      total: quizQuestions.length,
      percentage: Math.round((correctCount / quizQuestions.length) * 100),
    });
    setQuizSubmitted(true);
  };

  const handleQuizReset = () => {
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);
  };

  // Execute dry-run ("Run Code")
  const handleRunCode = async () => {
    if (!challenge) return;
    setIsRunning(true);
    setShowSuccessBanner(false);
    
    try {
      const dryResult = await executeDryRun({
        initSql: challenge.init_sql,
        studentQuery: code,
      });

      setResults({
        studentOutput: dryResult.studentOutput,
        expectedOutput: null,
        isCorrect: null,
        error: dryResult.error,
        executionTimeMs: dryResult.executionTimeMs,
      });

      if (dryResult.error) {
        setEditorSubTab('console');
        setLogs((prev) => [
          ...prev,
          { type: 'error', text: `[Syntax Error] ${dryResult.error} (${dryResult.executionTimeMs}ms)` },
        ]);
      } else {
        setEditorSubTab('output');
        setLogs((prev) => [
          ...prev,
          { 
            type: 'success', 
            text: `[Dry Run] Query executed successfully in ${dryResult.executionTimeMs}ms. Returned ${dryResult.studentOutput.values.length} rows.` 
          },
        ]);
      }
    } catch (err) {
      setEditorSubTab('console');
      setLogs((prev) => [...prev, { type: 'error', text: err.message }]);
    } finally {
      setIsRunning(false);
    }
  };

  // Submit & Auto-grade solution ("Submit Solution")
  const handleSubmit = async () => {
    if (!challenge) return;
    setIsRunning(true);
    setShowSuccessBanner(false);

    try {
      const gradeResult = await executeChallenge({
        initSql: challenge.init_sql,
        studentQuery: code,
        solutionQuery: challenge.solution_query,
      });

      setResults(gradeResult);

      if (gradeResult.error) {
        setEditorSubTab('console');
        setLogs((prev) => [
          ...prev,
          { type: 'error', text: `[Submission Failed] ${gradeResult.error}` },
        ]);
      } else if (gradeResult.isCorrect) {
        setEditorSubTab('output');
        setShowSuccessBanner(true);
        setLogs((prev) => [
          ...prev,
          { 
            type: 'success', 
            text: `🎉 [ACCEPTED] All test cases passed! +${challenge.points} XP earned. (${gradeResult.executionTimeMs}ms)` 
          },
        ]);

        // Award points in profiles table if logged in
        if (profile?.id) {
          try {
            const newPoints = (profile.total_points || 0) + (challenge.points || 100);
            const newStreak = Math.max(profile.streak_count || 0, challenge.day_number);
            await supabase
              .from('profiles')
              .update({
                total_points: newPoints,
                streak_count: newStreak,
              })
              .eq('id', profile.id);
            await refreshProfile();
          } catch (e) {
            console.warn('Profile points sync notice:', e);
          }
        }
      } else {
        setEditorSubTab('expected');
        setLogs((prev) => [
          ...prev,
          { 
            type: 'warn', 
            text: `❌ [INCORRECT OUTPUT] Output does not match expected solution. Check the 'Expected Output' tab.` 
          },
        ]);
      }
    } catch (err) {
      setEditorSubTab('console');
      setLogs((prev) => [...prev, { type: 'error', text: err.message }]);
    } finally {
      setIsRunning(false);
    }
  };

  const handleEditorReset = () => {
    if (challenge) {
      setCode(`-- Day ${String(challenge.day_number).padStart(2, '0')}: ${challenge.title}\n-- Write your SQL query below:\n\nSELECT \n`);
    }
    setResults(null);
    setShowSuccessBanner(false);
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-slate-950 flex flex-col items-center justify-center space-y-4 text-slate-300">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 rounded-full border-4 border-indigo-500/20 border-t-cyan-400 animate-spin" />
          <Loader2 className="w-6 h-6 text-cyan-400 absolute animate-pulse" />
        </div>
        <p className="text-sm font-semibold text-slate-400 animate-pulse">
          Loading Day {dayNumber} Learning Loop...
        </p>
      </div>
    );
  }

  // Not Found / Error State
  if (error || !challenge) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-slate-950 flex items-center justify-center p-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full text-center space-y-5 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">Challenge Not Found</h2>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              {error || `Day ${dayNumber} challenge has not been published yet by the chapter administrators.`}
            </p>
          </div>
          <Link
            to="/student/contest"
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 text-white text-xs font-bold shadow-md transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Contest Hub</span>
          </Link>
        </div>
      </div>
    );
  }

  const embedVideoUrl = getYouTubeEmbedUrl(challenge.video_url);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 text-slate-100 flex flex-col">
      
      {/* Top Header Bar & Learning Loop Tab Switcher */}
      <div className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md px-4 sm:px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4 z-20">
        
        {/* Left: Day info & Title */}
        <div className="flex items-center space-x-3">
          <Link
            to="/student/contest"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition shrink-0"
            title="Back to Contest Hub"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center space-x-2 min-w-0">
            <span className="text-xs font-black px-2.5 py-1 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
              DAY {String(challenge.day_number).padStart(2, '0')}
            </span>
            <h1 className="text-sm sm:text-base font-bold text-white truncate max-w-[200px] sm:max-w-md">
              {challenge.title}
            </h1>
          </div>
        </div>

        {/* Center: Learning Loop 3-Step Tabs */}
        <div className="flex items-center p-1 rounded-2xl bg-slate-950 border border-slate-800 self-center md:self-auto shadow-inner">
          <button
            onClick={() => setLearningTab('lesson')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              learningTab === 'lesson'
                ? 'bg-gradient-to-r from-rose-600 to-indigo-600 text-white shadow-md shadow-rose-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Tv className="w-4 h-4" />
            <span>📺 Lesson</span>
          </button>

          <button
            onClick={() => setLearningTab('quiz')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all relative ${
              learningTab === 'quiz'
                ? 'bg-gradient-to-r from-emerald-600 to-indigo-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <FileQuestion className="w-4 h-4" />
            <span>📝 Knowledge Check</span>
            {quizQuestions.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] font-black">
                {quizQuestions.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setLearningTab('workspace')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              learningTab === 'workspace'
                ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>💻 Commit2Query</span>
          </button>
        </div>

        {/* Right: Points & Difficulty */}
        <div className="hidden lg:flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>+{challenge.points} XP</span>
          </div>

          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-md ${
              challenge.difficulty === 'Easy'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : challenge.difficulty === 'Medium'
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}
          >
            {challenge.difficulty || 'Easy'}
          </span>
        </div>
      </div>

      {/* TAB 1: 📺 LESSON (YouTube Video Embed & Key Concept Overview) */}
      <div className={`flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto ${learningTab === 'lesson' ? 'block' : 'hidden'}`}>
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center space-x-1.5">
                  <Video className="w-4 h-4" />
                  <span>Day {challenge.day_number} Video Lecture</span>
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                  {challenge.title}
                </h2>
              </div>

              <button
                onClick={() => setLearningTab('quiz')}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center space-x-2 shadow-lg shadow-emerald-600/30 transition self-start sm:self-auto"
              >
                <span>Take Knowledge Check</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Video Player Frame */}
            {embedVideoUrl ? (
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl">
                <iframe
                  src={embedVideoUrl}
                  title={`Day ${challenge.day_number} Video Lesson`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              </div>
            ) : (
              <div className="p-12 text-center bg-slate-950/70 border border-dashed border-slate-800 rounded-2xl space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/20">
                  <Video className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white">No Video Lecture Attached</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  A video lecture has not been assigned for this challenge yet. You can review the challenge requirements and proceed to the Knowledge Check or SQL Workspace!
                </p>
                <div className="pt-2 flex justify-center space-x-3">
                  <button
                    onClick={() => setLearningTab('quiz')}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition"
                  >
                    Go to Knowledge Check
                  </button>
                  <button
                    onClick={() => setLearningTab('workspace')}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition"
                  >
                    Open SQL Workspace
                  </button>
                </div>
              </div>
            )}

            {/* Problem Overview Description */}
            <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-cyan-400" />
                <span>Lecture Synopsis & SQL Target</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                {challenge.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* TAB 2: 📝 KNOWLEDGE CHECK (Interactive MCQs for this challenge) */}
      <div className={`flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto ${learningTab === 'quiz' ? 'block' : 'hidden'}`}>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center space-x-1.5">
                  <FileQuestion className="w-4 h-4" />
                  <span>Day {challenge.day_number} Knowledge Check</span>
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                  Validate Your Understanding
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Answer the conceptual questions before committing your SQL query.
                </p>
              </div>

              {quizSubmitted && quizScore && (
                <div className="flex items-center space-x-3 px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                  <Award className="w-5 h-5 text-emerald-400" />
                  <span>Score: {quizScore.correct} / {quizScore.total} ({quizScore.percentage}%)</span>
                </div>
              )}
            </div>

            {quizLoading ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-3">
                <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                <p className="text-xs text-slate-400">Loading knowledge check questions...</p>
              </div>
            ) : quizQuestions.length === 0 ? (
              <div className="p-12 text-center bg-slate-950/70 border border-dashed border-slate-800 rounded-2xl space-y-3">
                <FileQuestion className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="text-base font-bold text-white">No Quiz Questions Configured Yet</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  There are currently no quiz questions assigned to Day {challenge.day_number}. You can proceed directly to the SQL query workspace!
                </p>
                <button
                  onClick={() => setLearningTab('workspace')}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 text-white text-xs font-bold shadow-md transition inline-flex items-center space-x-2"
                >
                  <span>Launch Commit2Query Workspace</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <form onSubmit={handleQuizSubmit} className="space-y-6">
                {quizQuestions.map((q, qIdx) => {
                  let parsedOpts = q.options;
                  if (typeof parsedOpts === 'string') {
                    try { parsedOpts = JSON.parse(parsedOpts); } catch (e) { parsedOpts = []; }
                  }

                  const selectedIdx = quizAnswers[q.id];
                  const correctIdx = q.correct_answer !== undefined 
                    ? Number(q.correct_answer) 
                    : (q.correct_option_index !== undefined ? Number(q.correct_option_index) : 0);

                  const isCorrect = selectedIdx === correctIdx;

                  return (
                    <div
                      key={q.id}
                      className={`p-5 sm:p-6 rounded-2xl border transition shadow-lg space-y-4 ${
                        quizSubmitted
                          ? isCorrect
                            ? 'bg-emerald-950/20 border-emerald-500/40'
                            : 'bg-rose-950/20 border-rose-500/40'
                          : 'bg-slate-950/80 border-slate-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center space-x-2">
                          <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 text-xs font-bold flex items-center justify-center">
                            {qIdx + 1}
                          </span>
                          <h3 className="text-sm font-bold text-white leading-snug">
                            {q.question}
                          </h3>
                        </div>

                        {quizSubmitted && (
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 ${
                            isCorrect ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}>
                            {isCorrect ? 'Correct (+20 XP)' : 'Incorrect'}
                          </span>
                        )}
                      </div>

                      {/* Options Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {Array.isArray(parsedOpts) && parsedOpts.map((opt, optIdx) => {
                          const isOptionSelected = selectedIdx === optIdx;
                          const isAnswerKey = correctIdx === optIdx;

                          let optionStyle = 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900';

                          if (quizSubmitted) {
                            if (isAnswerKey) {
                              optionStyle = 'bg-emerald-950/60 border-emerald-500/60 text-emerald-200 font-bold ring-1 ring-emerald-500/40';
                            } else if (isOptionSelected && !isAnswerKey) {
                              optionStyle = 'bg-rose-950/60 border-rose-500/60 text-rose-200 font-bold';
                            } else {
                              optionStyle = 'bg-slate-950/40 border-slate-900 text-slate-500 opacity-60';
                            }
                          } else if (isOptionSelected) {
                            optionStyle = 'bg-indigo-950/80 border-cyan-400 text-white font-bold ring-1 ring-cyan-400/40 shadow-md';
                          }

                          return (
                            <button
                              key={optIdx}
                              type="button"
                              disabled={quizSubmitted}
                              onClick={() => setQuizAnswers(prev => ({ ...prev, [q.id]: optIdx }))}
                              className={`p-3 rounded-xl text-xs text-left flex items-center space-x-2.5 border transition ${optionStyle}`}
                            >
                              <span className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                                isOptionSelected ? 'bg-cyan-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-400'
                              }`}>
                                {String.fromCharCode(65 + optIdx)}
                              </span>
                              <span className="flex-1 truncate">{opt}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Explanation box after submission */}
                      {quizSubmitted && q.explanation && (
                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-1 animate-in fade-in">
                          <span className="font-bold text-cyan-300 uppercase text-[10px] tracking-wider block">
                            💡 Explanation:
                          </span>
                          <p>{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Bottom Action Controls */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                  {quizSubmitted ? (
                    <button
                      type="button"
                      onClick={handleQuizReset}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center space-x-2 transition"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Retake Knowledge Check</span>
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={Object.keys(quizAnswers).length === 0}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center space-x-2 transition disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      <span>Submit Answers</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setLearningTab('workspace')}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-bold shadow-md transition flex items-center space-x-2"
                  >
                    <span>Proceed to Commit2Query</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      </div>

      {/* TAB 3: 💻 COMMIT2QUERY (Preserved Interactive WebAssembly SQL Workspace) */}
      <div className={`flex-1 flex flex-col ${learningTab === 'workspace' ? 'flex' : 'hidden'}`}>
        
        {/* Accepted Reward Banner */}
        {showSuccessBanner && (
          <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 border-b border-emerald-500/40 px-6 py-3 flex items-center justify-between animate-in slide-in-from-top duration-300">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-black text-emerald-300">
                  Challenge Solved Successfully!
                </span>
                <p className="text-xs text-emerald-400/80">
                  You earned +{challenge.points} XP and kept your active streak intact!
                </p>
              </div>
            </div>
            <Link
              to="/student/contest"
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md transition flex items-center space-x-1"
            >
              <span>Contest Hub</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Main Split-Screen Workspace (Left 40% / Right 60%) */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          
          {/* LEFT PANE: Problem Context & Schema (40%) */}
          <div className="w-full lg:w-[40%] border-b lg:border-b-0 lg:border-r border-slate-800/90 bg-slate-900/40 p-5 sm:p-6 overflow-y-auto space-y-6">
            
            {/* Problem Statement */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <Database className="w-4 h-4 text-cyan-400" />
                <span>Problem Description</span>
              </div>
              <div className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-4 sm:p-5 text-sm text-slate-200 leading-relaxed whitespace-pre-line shadow-inner">
                {challenge.description}
              </div>
            </div>

            {/* External LeetCode Practice Link */}
            {challenge.leetcode_url && (
              <div className="pt-1">
                <a
                  href={challenge.leetcode_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-orange-500/15 hover:from-amber-500/25 hover:to-orange-500/25 border border-amber-500/30 hover:border-amber-400 text-amber-300 text-xs font-extrabold flex items-center justify-between shadow-lg shadow-amber-500/5 group transition duration-200"
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 group-hover:scale-110 transition-transform">
                      <ExternalLink className="w-4 h-4" />
                    </span>
                    <span>🔗 Solve on LeetCode</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-200 uppercase tracking-widest border border-amber-400/30">
                    External Practice ↗
                  </span>
                </a>
              </div>
            )}

            {/* Database Schema & Seed Data Table (Dynamically Inspected from init_sql) */}
            {schemaData && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                    <TableIcon className="w-4 h-4 text-indigo-400" />
                    <span>Table: `{schemaData.tableName}`</span>
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">WASM SQLite</span>
                </div>

                <div className="bg-slate-950 border border-slate-800/90 rounded-xl overflow-hidden shadow-lg">
                  <div className="overflow-x-auto max-h-56">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-slate-900/90 text-cyan-400 border-b border-slate-800 sticky top-0">
                        <tr>
                          {schemaData.columns.map((col, idx) => (
                            <th key={idx} className="py-2.5 px-3 font-semibold whitespace-nowrap">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-300">
                        {schemaData.sampleRows.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-slate-900/50 transition">
                            {row.map((cell, cIdx) => (
                              <td key={cIdx} className="py-2 px-3 whitespace-nowrap">
                                {cell === null ? <span className="text-slate-500 italic">NULL</span> : String(cell)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Schema Hint context */}
            {challenge.schema_hint && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <HelpCircle className="w-4 h-4 text-amber-400" />
                  <span>Schema Context</span>
                </span>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300">
                  {challenge.schema_hint}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT PANE: Code Editor & Terminal (60%) */}
          <div className="w-full lg:w-[60%] flex flex-col bg-slate-950 justify-between">
            
            {/* Top Editor Toolbar & Action Buttons */}
            <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="ml-2 text-xs font-mono text-slate-400 font-semibold">
                  query.sql
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleEditorReset}
                  title="Reset to Starter Code"
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={handleRunCode}
                  disabled={isRunning || !engineReady}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 shadow flex items-center space-x-1.5 transition disabled:opacity-50"
                >
                  {isRunning ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                  ) : (
                    <Play className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400" />
                  )}
                  <span>Run Code</span>
                </button>

                <button
                  onClick={handleSubmit}
                  disabled={isRunning || !engineReady}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-emerald-600 via-emerald-500 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white shadow-lg shadow-emerald-600/30 flex items-center space-x-1.5 transition disabled:opacity-50"
                >
                  {isRunning ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  ) : (
                    <Send className="w-3.5 h-3.5 text-white" />
                  )}
                  <span>Submit Solution</span>
                </button>
              </div>
            </div>

            {/* Interactive CodeMirror Editor */}
            <div className="flex-1 min-h-[260px] bg-[#282c34] overflow-y-auto">
              <CodeMirror
                value={code}
                height="100%"
                theme={oneDark}
                extensions={[sql()]}
                onChange={(value) => setCode(value)}
                className="text-sm font-mono"
              />
            </div>

            {/* Bottom Tabbed Terminal Results Area */}
            <div className="h-64 border-t border-slate-800/90 bg-slate-900/95 flex flex-col">
              
              {/* Sub-tab Navigation Headers */}
              <div className="flex items-center justify-between border-b border-slate-800 px-4 bg-slate-950/60">
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setEditorSubTab('output')}
                    className={`px-3 py-2 text-xs font-bold border-b-2 transition flex items-center space-x-1.5 ${
                      editorSubTab === 'output'
                        ? 'border-cyan-400 text-cyan-400'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <TableIcon className="w-3.5 h-3.5" />
                    <span>Query Output</span>
                  </button>

                  <button
                    onClick={() => setEditorSubTab('expected')}
                    className={`px-3 py-2 text-xs font-bold border-b-2 transition flex items-center space-x-1.5 ${
                      editorSubTab === 'expected'
                        ? 'border-amber-400 text-amber-400'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Expected Output</span>
                  </button>

                  <button
                    onClick={() => setEditorSubTab('console')}
                    className={`px-3 py-2 text-xs font-bold border-b-2 transition flex items-center space-x-1.5 ${
                      editorSubTab === 'console'
                        ? 'border-indigo-400 text-indigo-300'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <TerminalIcon className="w-3.5 h-3.5" />
                    <span>Console Logs ({logs.length})</span>
                  </button>
                </div>

                {results?.executionTimeMs !== undefined && (
                  <span className="text-[11px] font-mono text-slate-500">
                    Execution: {results.executionTimeMs}ms
                  </span>
                )}
              </div>

              {/* Sub-tab Content Panes */}
              <div className="flex-1 p-3 overflow-auto font-mono text-xs">
                {/* OUTPUT SUB-TAB */}
                {editorSubTab === 'output' && (
                  <div>
                    {results?.error ? (
                      <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 space-y-1">
                        <div className="font-bold flex items-center space-x-1.5">
                          <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                          <span>PostgreSQL Query Execution Error</span>
                        </div>
                        <p className="text-[11px] leading-relaxed">{results.error}</p>
                      </div>
                    ) : results?.studentOutput?.values?.length > 0 ? (
                      <table className="w-full text-left border border-slate-800">
                        <thead className="bg-slate-950 text-cyan-400 border-b border-slate-800 sticky top-0">
                          <tr>
                            {results.studentOutput.columns.map((col, idx) => (
                              <th key={idx} className="py-2 px-3 whitespace-nowrap">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-slate-300">
                          {results.studentOutput.values.map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-slate-800/40">
                              {row.map((cell, cIdx) => (
                                <td key={cIdx} className="py-1.5 px-3 whitespace-nowrap">
                                  {cell === null ? <span className="text-slate-500 italic">NULL</span> : String(cell)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : results?.studentOutput?.values ? (
                      <p className="text-slate-500 italic p-3">Query returned 0 rows.</p>
                    ) : (
                      <p className="text-slate-500 italic p-3">
                        Click "Run Code" or "Submit Solution" to inspect query results.
                      </p>
                    )}
                  </div>
                )}

                {/* EXPECTED OUTPUT SUB-TAB */}
                {editorSubTab === 'expected' && (
                  <div>
                    {results?.expectedOutput?.values?.length > 0 ? (
                      <table className="w-full text-left border border-slate-800">
                        <thead className="bg-slate-950 text-amber-400 border-b border-slate-800 sticky top-0">
                          <tr>
                            {results.expectedOutput.columns.map((col, idx) => (
                              <th key={idx} className="py-2 px-3 whitespace-nowrap">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-slate-300">
                          {results.expectedOutput.values.map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-slate-800/40">
                              {row.map((cell, cIdx) => (
                                <td key={cIdx} className="py-1.5 px-3 whitespace-nowrap">
                                  {cell === null ? <span className="text-slate-500 italic">NULL</span> : String(cell)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="text-slate-500 italic p-3">
                        Click "Submit Solution" to compare your query output against test benchmarks.
                      </p>
                    )}
                  </div>
                )}

                {/* CONSOLE LOGS SUB-TAB */}
                {editorSubTab === 'console' && (
                  <div className="space-y-1.5 font-mono">
                    {logs.length === 0 ? (
                      <p className="text-slate-500 italic p-3">Console initialized. No messages.</p>
                    ) : (
                      logs.map((log, idx) => (
                        <div
                          key={idx}
                          className={`p-2 rounded-lg text-xs leading-relaxed ${
                            log.type === 'error'
                              ? 'bg-rose-950/40 text-rose-300 border border-rose-500/30'
                              : log.type === 'warn'
                              ? 'bg-amber-950/40 text-amber-300 border border-amber-500/30'
                              : log.type === 'success'
                              ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30'
                              : 'bg-slate-950/60 text-slate-400'
                          }`}
                        >
                          {log.text}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Embedded Floating AI Mentor Drawer */}
      <AiMentor 
        problemContext={challenge.description}
        studentCode={code}
      />

    </div>
  );
};

export default ChallengePlayground;
