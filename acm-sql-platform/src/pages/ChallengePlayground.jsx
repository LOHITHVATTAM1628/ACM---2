import React, { useState, useEffect, useRef } from 'react';
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
  ExternalLink,
  Clock
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
  const { user, profile, refreshProfile } = useAuth();

  // Anti-Cheat: Internal clipboard tracker for on-page text copying
  const internalClipboard = useRef("");

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
  const [quizAttempt, setQuizAttempt] = useState(null); // null = loading, false = no attempt, object = existing attempt
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10);
  const [quizSaveError, setQuizSaveError] = useState(null);
  const [isSavingQuiz, setIsSavingQuiz] = useState(false);

  // SQL Workspace State (Preserved across tab switches)
  const [code, setCode] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [editorSubTab, setEditorSubTab] = useState('output'); // 'output' | 'expected' | 'console'
  const [results, setResults] = useState(null);
  const [logs, setLogs] = useState([]);
  const [engineReady, setEngineReady] = useState(false);
  const [engineError, setEngineError] = useState(null);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);

  // SQL Workspace Countdown Timer & Locking State
  const [sqlTimeLeft, setSqlTimeLeft] = useState(300);
  const [isSqlLocked, setIsSqlLocked] = useState(false);

  // Pre-load sql.js WASM
  useEffect(() => {
    let isMounted = true;

    const initWasmEngine = async () => {
      try {
        setEngineError(null);
        await getSqlInstance();
        if (isMounted) {
          setEngineReady(true);
          setEngineError(null);
          setLogs((prev) => [
            ...prev,
            { type: 'info', text: 'WebAssembly SQL engine initialized successfully.' },
          ]);
        }
      } catch (error) {
        console.error('SQL Engine Init Failed:', error);
        if (isMounted) {
          setEngineReady(false);
          const errorMsg = error?.message || String(error);
          setEngineError(errorMsg);
          setLogs((prev) => [
            ...prev,
            { type: 'error', text: `SQL Engine Init Failed: ${errorMsg}` },
          ]);
        }
      }
    };

    initWasmEngine();
    return () => {
      isMounted = false;
    };
  }, []);

  const parsedDay = parseInt(dayNumber, 10);

  // Fetch Challenge & Quizzes & User Attempt from Supabase
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
      setQuizAttempt(null);
      setCurrentQuestionIdx(0);
      setIsQuizActive(false);
      setQuizSaveError(null);

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
          const initialQuizTimer = Number(data.quiz_timer_seconds) || 10;
          const initialSqlTimer = Number(data.sql_timer_seconds) || 300;
          setTimeLeft(initialQuizTimer);
          setSqlTimeLeft(initialSqlTimer);
          setIsSqlLocked(false);

          // Generate starter code
          const starter = `-- Day ${String(data.day_number).padStart(2, '0')}: ${data.title}\n-- Write your SQL query below:\n\nSELECT \n`;
          setCode(starter);

          // Dynamically inspect schema from init_sql
          if (data.init_sql) {
            try {
              const inspected = await inspectSchema(data.init_sql);
              setSchemaData(inspected);
            } catch (schemaErr) {
              console.error('Schema Setup Error:', schemaErr);
              const schemaErrMsg = `Schema Setup Error: ${schemaErr?.message || schemaErr}`;
              setEngineError(schemaErrMsg);
              setLogs((prev) => [
                ...prev,
                { type: 'error', text: schemaErrMsg },
              ]);
            }
          }

          setLogs((prev) => [
            ...prev,
            { 
              type: 'info', 
              text: `Loaded Day ${data.day_number} environment ("${data.title}"). Ready to execute.` 
            }
          ]);

          // Fetch knowledge check quiz questions and check for existing attempt
          fetchQuizQuestionsAndAttempt(data.id);
        }
      } catch (err) {
        console.error('Error loading challenge:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchChallengeData();
  }, [dayNumber, parsedDay, profile?.id, user?.id]);

  // SQL Workspace Countdown Timer (Only ticks down when actively on workspace tab)
  useEffect(() => {
    if (learningTab !== 'workspace' || isSqlLocked || showSuccessBanner || !challenge) {
      return;
    }

    const timer = setInterval(() => {
      setSqlTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsSqlLocked(true);
          alert("Time is up! The SQL editor is now locked.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [learningTab, isSqlLocked, showSuccessBanner, challenge]);

  // Format seconds into MM:SS format
  const formatSqlTime = (totalSecs) => {
    const mins = Math.floor(Math.max(0, totalSecs) / 60);
    const secs = Math.max(0, totalSecs) % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Fetch Questions and check one-time attempt status
  const fetchQuizQuestionsAndAttempt = async (challengeId) => {
    if (!challengeId) return;
    setQuizLoading(true);
    try {
      // 1. Fetch questions for this challenge
      const { data: qData, error: qErr } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('challenge_id', challengeId)
        .order('id', { ascending: true });

      if (qErr) throw qErr;
      const questionsList = qData || [];
      setQuizQuestions(questionsList);

      // 2. Check if user already submitted this quiz in quiz_attempts
      const currentUserId = user?.id || profile?.id;
      if (currentUserId) {
        const { data: attemptData, error: attErr } = await supabase
          .from('quiz_attempts')
          .select('*')
          .eq('user_id', currentUserId)
          .eq('challenge_id', challengeId)
          .maybeSingle();

        if (!attErr && attemptData) {
          setQuizAttempt(attemptData);
          setQuizSubmitted(true);
          const scoreVal = attemptData.score ?? 0;
          const pointsVal = attemptData.score_xp ?? attemptData.points_earned ?? (scoreVal * 20);
          setQuizScore({
            correct: scoreVal,
            total: attemptData.total_questions || questionsList.length,
            percentage: Math.round((scoreVal / (attemptData.total_questions || questionsList.length || 1)) * 100),
            pointsEarned: pointsVal,
          });
          return;
        }
      }

      setQuizAttempt(false);
      setQuizSubmitted(false);
    } catch (err) {
      console.warn('Notice: quiz_questions for challenge:', err.message);
      setQuizQuestions([]);
      setQuizAttempt(false);
      setQuizSubmitted(false);
    } finally {
      setQuizLoading(false);
    }
  };

  const timerDuration = Number(challenge?.quiz_timer_seconds) || 10;

  // Dynamic Countdown Timer per Question
  useEffect(() => {
    if (!isQuizActive || quizSubmitted || quizQuestions.length === 0 || currentQuestionIdx >= quizQuestions.length) {
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Timeout reached: automatically mark as unanswered/timed-out and advance
          handleQuestionTimeout();
          return timerDuration;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isQuizActive, quizSubmitted, currentQuestionIdx, quizQuestions.length, quizAnswers, timerDuration]);

  // Handle Question Timeout (Auto-Skip / Auto-Submit)
  const handleQuestionTimeout = () => {
    const currentQ = quizQuestions[currentQuestionIdx];
    if (!currentQ) return;

    const updatedAnswers = {
      ...quizAnswers,
      [currentQ.id]: -1, // -1 signifies timed out / unanswered
    };
    setQuizAnswers(updatedAnswers);

    if (currentQuestionIdx + 1 < quizQuestions.length) {
      setCurrentQuestionIdx((prev) => prev + 1);
      setTimeLeft(timerDuration);
    } else {
      // Last question finished
      finalizeQuiz(updatedAnswers);
    }
  };

  // Handle user selecting an option
  const handleOptionSelect = (optionIdx) => {
    if (!isQuizActive || quizSubmitted) return;

    const currentQ = quizQuestions[currentQuestionIdx];
    if (!currentQ) return;

    const updatedAnswers = {
      ...quizAnswers,
      [currentQ.id]: optionIdx,
    };
    setQuizAnswers(updatedAnswers);

    if (currentQuestionIdx + 1 < quizQuestions.length) {
      setCurrentQuestionIdx((prev) => prev + 1);
      setTimeLeft(timerDuration);
    } else {
      // Last question finished
      finalizeQuiz(updatedAnswers);
    }
  };

  // Finalize Quiz & Calculate Points
  const finalizeQuiz = async (finalAnswers) => {
    setIsQuizActive(false);
    setQuizSaveError(null);
    if (quizQuestions.length === 0 || !challenge) return;

    let correctCount = 0;
    quizQuestions.forEach((q) => {
      const selected = finalAnswers[q.id];
      const correct = q.correct_answer !== undefined 
        ? Number(q.correct_answer) 
        : (q.correct_option_index !== undefined ? Number(q.correct_option_index) : 0);

      if (selected === correct) {
        correctCount += 1;
      }
    });

    const earnedXP = correctCount * 20; // 20 XP per correct question
    const finalScore = {
      correct: correctCount,
      total: quizQuestions.length,
      percentage: Math.round((correctCount / quizQuestions.length) * 100),
      pointsEarned: earnedXP,
    };

    let validUserId = user?.id || profile?.id;
    if (!validUserId) {
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user?.id) {
          validUserId = authData.user.id;
        }
      } catch (authLookupErr) {
        console.warn("Auth lookup fallback error:", authLookupErr);
      }
    }

    if (!validUserId) {
      console.error("Missing User ID. Cannot save quiz.");
      alert("Authentication error: Could not identify your user profile. Please refresh the page.");
      setQuizSaveError("Authentication error: Could not identify your user profile. Please refresh the page.");
      return;
    }

    if (!challenge?.id) {
      console.error("Missing Challenge ID. Cannot save quiz.");
      alert("Error: Challenge ID is missing. Please refresh the page.");
      setQuizSaveError("Error: Challenge ID is missing. Please refresh the page.");
      return;
    }

    setIsSavingQuiz(true);
    try {
      // 1. Fully awaited INSERT into quiz_attempts with strict validUserId
      const attemptInsertPayload = {
        user_id: validUserId,
        challenge_id: challenge.id,
        score: correctCount,
        score_xp: earnedXP,
        points_earned: earnedXP,
        total_questions: quizQuestions.length,
      };

      const { data, error } = await supabase
        .from('quiz_attempts')
        .insert([attemptInsertPayload])
        .select();

      if (error) {
        console.error("Quiz Save Failed:", error.message || error);
        throw new Error(error.message || "Failed to save quiz results to database");
      }

      // 2. Update total_points in Supabase profiles table
      if (earnedXP > 0) {
        try {
          const { data: profRow } = await supabase
            .from('profiles')
            .select('total_points')
            .eq('id', validUserId)
            .maybeSingle();

          const currentTotal = profRow?.total_points ?? profile?.total_points ?? 0;
          const newPoints = currentTotal + earnedXP;

          await supabase
            .from('profiles')
            .update({ total_points: newPoints })
            .eq('id', validUserId);

          await refreshProfile();
        } catch (pointErr) {
          console.warn('Profile XP update notice:', pointErr);
        }
      }

      // 3. Only lock the quiz UI and show completion if database insert was completely successful
      setQuizScore(finalScore);
      setQuizAttempt((data && data[0]) || attemptInsertPayload);
      setQuizSubmitted(true);
      setQuizSaveError(null);

      // Persist backup in localStorage
      try {
        localStorage.setItem(`quiz_attempt_${validUserId}_${challenge.id}`, JSON.stringify((data && data[0]) || attemptInsertPayload));
      } catch (e) {}

    } catch (err) {
      console.error("Quiz Save Failed:", err.message || err);
      const errMsg = err?.message || "Failed to save quiz results to database. Please check your connection.";
      setQuizSaveError(errMsg);
    } finally {
      setIsSavingQuiz(false);
    }
  };

  const handleStartQuiz = () => {
    const duration = Number(challenge?.quiz_timer_seconds) || 10;
    setIsQuizActive(true);
    setCurrentQuestionIdx(0);
    setTimeLeft(duration);
    setQuizAnswers({});
    setQuizSubmitted(false);
  };

  // Execute dry-run ("Run Code")
  const handleRunCode = async () => {
    if (!challenge) {
      console.warn("No active challenge loaded.");
      return;
    }
    if (!code || !code.trim()) {
      const emptyMsg = "Please enter a SQL query before running.";
      setResults({ studentOutput: { columns: [], values: [] }, error: emptyMsg });
      setEditorSubTab('console');
      setLogs((prev) => [...prev, { type: 'warn', text: `[Query Warning] ${emptyMsg}` }]);
      return;
    }

    setIsRunning(true);
    setShowSuccessBanner(false);
    
    try {
      const dryResult = await executeDryRun({
        initSql: challenge.init_sql,
        studentQuery: code,
      });

      if (dryResult.error) {
        console.log("SQL Execution Error:", dryResult.error);
        setResults({
          studentOutput: { columns: [], values: [] },
          expectedOutput: null,
          isCorrect: null,
          error: dryResult.error,
          executionTimeMs: dryResult.executionTimeMs,
        });
        setEditorSubTab('console');
        setLogs((prev) => [
          ...prev,
          { 
            type: 'error', 
            text: `[SQL Execution Error] ${dryResult.error} (${dryResult.executionTimeMs}ms)` 
          },
        ]);
      } else {
        setResults({
          studentOutput: dryResult.studentOutput,
          expectedOutput: null,
          isCorrect: null,
          error: null,
          executionTimeMs: dryResult.executionTimeMs,
        });
        setEditorSubTab('output');
        setLogs((prev) => [
          ...prev,
          { 
            type: 'success', 
            text: `[Dry Run] Query executed successfully in ${dryResult.executionTimeMs}ms. Returned ${dryResult.studentOutput?.values?.length || 0} row(s).` 
          },
        ]);
      }
    } catch (err) {
      console.log("SQL Execution Error:", err);
      setResults({
        studentOutput: { columns: [], values: [] },
        error: err.message || String(err),
      });
      setEditorSubTab('console');
      setLogs((prev) => [...prev, { type: 'error', text: `[Execution Exception] ${err.message || String(err)}` }]);
    } finally {
      setIsRunning(false);
    }
  };

  // Submit & Auto-grade solution ("Submit Solution")
  const handleSubmitSolution = async () => {
    if (!challenge) {
      console.warn("No active challenge loaded.");
      return;
    }
    if (!code || !code.trim()) {
      const emptyMsg = "Please enter a SQL query before submitting.";
      setResults({ studentOutput: { columns: [], values: [] }, error: emptyMsg });
      setEditorSubTab('console');
      setLogs((prev) => [...prev, { type: 'warn', text: `[Submission Warning] ${emptyMsg}` }]);
      return;
    }

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
        console.log("SQL Execution Error:", gradeResult.error);
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
            text: `🎉 [ACCEPTED] All test cases passed! +${challenge.points || 100} XP earned. (${gradeResult.executionTimeMs}ms)` 
          },
        ]);

        // Award points in profiles table if logged in
        if (profile?.id) {
          try {
            const newPoints = (profile.total_points || 0) + (challenge.points || 100);
            const newStreak = Math.max(profile.streak_count || 0, Number(challenge.day_number) || 1);
            const { error: updateErr } = await supabase
              .from('profiles')
              .update({
                total_points: newPoints,
                streak_count: newStreak,
              })
              .eq('id', profile.id);

            if (updateErr) throw updateErr;
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
            text: `❌ [INCORRECT OUTPUT] Output does not match expected results. Inspect the 'Expected Output' tab to see the target solution benchmark.` 
          },
        ]);
      }
    } catch (err) {
      console.log("SQL Execution Error:", err);
      setEditorSubTab('console');
      setLogs((prev) => [...prev, { type: 'error', text: `[Submission Exception] ${err.message || String(err)}` }]);
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

  // Anti-Cheat: Intercept and restrict external paste events
  const handlePaste = (e) => {
    const pastedText = e.clipboardData?.getData('Text') || '';
    // Allow if they are pasting what they just copied from the page
    if (pastedText && pastedText !== internalClipboard.current) {
      e.preventDefault();
      e.stopPropagation();
      alert("⚠️ Anti-Cheat: You cannot paste code from external sources. Please type your query or copy from the problem description.");
    }
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
    <div 
      onCopy={() => { internalClipboard.current = window.getSelection()?.toString() || ''; }}
      className="min-h-[calc(100vh-4rem)] bg-slate-950 text-slate-100 flex flex-col"
    >
      
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

      {/* TAB 2: 📝 KNOWLEDGE CHECK (Interactive 10s Rapid-Fire MCQ Evaluation) */}
      <div className={`flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto ${learningTab === 'quiz' ? 'block' : 'hidden'}`}>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            
            {/* Header / Score Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center space-x-1.5">
                  <FileQuestion className="w-4 h-4" />
                  <span>Day {challenge.day_number} Knowledge Check</span>
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                  Validate Your SQL Mastery
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Test your understanding under time pressure (10s per question) before writing SQL.
                </p>
              </div>

              {quizSubmitted && quizScore && (
                <div className="flex items-center space-x-3 px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold shrink-0">
                  <Award className="w-5 h-5 text-emerald-400" />
                  <span>Score: {quizScore.correct} / {quizScore.total} ({quizScore.percentage}%) • +{quizScore.pointsEarned} XP</span>
                </div>
              )}
            </div>

            {/* Quiz Save Error Alert Banner */}
            {quizSaveError && (
              <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg animate-in slide-in-from-top duration-300">
                <div className="flex items-center space-x-2.5">
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                  <span>{quizSaveError}</span>
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                  {!quizSubmitted && Object.keys(quizAnswers).length > 0 && (
                    <button
                      type="button"
                      disabled={isSavingQuiz}
                      onClick={() => finalizeQuiz(quizAnswers)}
                      className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center space-x-1"
                    >
                      {isSavingQuiz ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                      <span>Retry Saving Quiz</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setQuizSaveError(null)}
                    className="px-3 py-1 rounded-lg bg-rose-900/80 hover:bg-rose-800 text-white text-xs font-bold transition"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {quizLoading ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-3">
                <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                <p className="text-xs text-slate-400">Loading knowledge check questions & attempt records...</p>
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
            ) : quizSubmitted || quizAttempt ? (
              /* VIEW 1: LOCKED ATTEMPT REVIEW */
              <div className="space-y-6">
                <div className="p-4 rounded-2xl bg-slate-950/90 border border-emerald-500/30 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40 shrink-0">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">
                        ✅ You have completed this quiz attempt
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Score: <strong className="text-emerald-300">{quizScore?.correct ?? 0} / {quizQuestions.length}</strong> ({quizScore?.percentage ?? 0}%) • Points Earned: <strong className="text-cyan-400">+{quizScore?.pointsEarned ?? 0} XP</strong>
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setLearningTab('workspace')}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-bold shadow-md transition flex items-center space-x-1.5 shrink-0"
                  >
                    <span>Proceed to Commit2Query</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Review Questions List */}
                <div className="space-y-4">
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
                    const isTimedOut = selectedIdx === -1 || selectedIdx === undefined;

                    return (
                      <div
                        key={q.id}
                        className={`p-5 rounded-2xl border transition shadow-lg space-y-3 ${
                          isCorrect
                            ? 'bg-emerald-950/20 border-emerald-500/40'
                            : 'bg-rose-950/20 border-rose-500/40'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center space-x-2">
                            <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 text-xs font-bold flex items-center justify-center shrink-0">
                              {qIdx + 1}
                            </span>
                            <h3 className="text-sm font-bold text-white leading-snug">
                              {q.question}
                            </h3>
                          </div>

                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 ${
                            isCorrect
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}>
                            {isCorrect ? 'Correct (+20 XP)' : isTimedOut ? 'Timed Out (0 XP)' : 'Incorrect (0 XP)'}
                          </span>
                        </div>

                        {/* Options */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {Array.isArray(parsedOpts) && parsedOpts.map((opt, optIdx) => {
                            const isAnswerKey = correctIdx === optIdx;
                            const isSelected = selectedIdx === optIdx;

                            let optStyle = 'bg-slate-950/40 border-slate-900 text-slate-500 opacity-60';
                            if (isAnswerKey) {
                              optStyle = 'bg-emerald-950/60 border-emerald-500/60 text-emerald-200 font-bold ring-1 ring-emerald-500/40';
                            } else if (isSelected && !isAnswerKey) {
                              optStyle = 'bg-rose-950/60 border-rose-500/60 text-rose-200 font-bold';
                            }

                            return (
                              <div
                                key={optIdx}
                                className={`p-2.5 rounded-xl text-xs flex items-center space-x-2 border ${optStyle}`}
                              >
                                <span className="w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center bg-slate-800 text-slate-400 shrink-0">
                                  {String.fromCharCode(65 + optIdx)}
                                </span>
                                <span className="flex-1 truncate">{opt}</span>
                              </div>
                            );
                          })}
                        </div>

                        {q.explanation && (
                          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-1">
                            <span className="font-bold text-cyan-300 uppercase text-[10px] tracking-wider block">
                              💡 Explanation:
                            </span>
                            <p>{q.explanation}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : !isQuizActive ? (
              /* VIEW 2: QUIZ START / RULES LOBBY */
              <div className="p-8 text-center bg-slate-950/80 border border-slate-800 rounded-3xl space-y-6 shadow-2xl">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-indigo-600 flex items-center justify-center mx-auto text-white shadow-xl shadow-emerald-500/20">
                  <FileQuestion className="w-8 h-8" />
                </div>

                <div className="space-y-2 max-w-md mx-auto">
                  <h3 className="text-xl font-extrabold text-white">
                    Ready for the Rapid-Fire Challenge?
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Test your understanding of the concepts covered in Day {challenge.day_number}.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl mx-auto text-left">
                  <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                    <div className="flex items-center space-x-2 text-xs font-bold text-amber-400">
                      <span>⏱️ {challenge?.quiz_timer_seconds || 10}s Per Question</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Automatic advance when timer hits zero.</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                    <div className="flex items-center space-x-2 text-xs font-bold text-cyan-400">
                      <span>⚡ 1-Time Attempt</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Score permanently counts towards leaderboard.</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                    <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400">
                      <span>🏆 +20 XP / Answer</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Up to +{quizQuestions.length * 20} bonus chapter XP.</p>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleStartQuiz}
                    className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-emerald-600/30 transition transform hover:scale-105 active:scale-95 inline-flex items-center space-x-2.5"
                  >
                    <span>Start Knowledge Check ({quizQuestions.length} Questions)</span>
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              /* VIEW 3: ACTIVE QUESTION STEPPER WITH COUNTDOWN TIMER */
              <div className="space-y-6">
                
                {/* Stepper Top Bar with Timer */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950 border border-slate-800 shadow-inner">
                  <div className="flex items-center space-x-3">
                    <span className="px-3 py-1 rounded-xl bg-indigo-500/20 text-indigo-300 font-mono text-xs font-black">
                      Question {currentQuestionIdx + 1} of {quizQuestions.length}
                    </span>
                    <div className="w-32 sm:w-48 h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-300"
                        style={{ width: `${((currentQuestionIdx + 1) / quizQuestions.length) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Countdown Timer Display */}
                  <div className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl font-mono text-xs font-black border transition-all ${
                    timeLeft <= 3 
                      ? 'bg-rose-500/20 border-rose-500/60 text-rose-300 animate-pulse shadow-lg shadow-rose-500/20'
                      : timeLeft <= 6
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                      : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                  }`}>
                    <span>⏱️ {timeLeft}s remaining</span>
                  </div>
                </div>

                {/* Active Question Card */}
                {quizQuestions[currentQuestionIdx] && (() => {
                  const q = quizQuestions[currentQuestionIdx];
                  let parsedOpts = q.options;
                  if (typeof parsedOpts === 'string') {
                    try { parsedOpts = JSON.parse(parsedOpts); } catch (e) { parsedOpts = []; }
                  }

                  return (
                    <div className="p-6 sm:p-8 rounded-3xl bg-slate-950/80 border border-slate-800 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
                      <div className="flex items-start space-x-3">
                        <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-600 text-white text-xs font-black flex items-center justify-center shrink-0 shadow-md">
                          Q{currentQuestionIdx + 1}
                        </span>
                        <h3 className="text-base sm:text-lg font-bold text-white leading-relaxed">
                          {q.question}
                        </h3>
                      </div>

                      {/* 4 Option Buttons (Instant Click Selection) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        {Array.isArray(parsedOpts) && parsedOpts.map((opt, optIdx) => (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() => handleOptionSelect(optIdx)}
                            className="p-4 rounded-2xl text-xs sm:text-sm font-semibold text-left flex items-center space-x-3 bg-slate-900 border border-slate-800 hover:border-cyan-400 hover:bg-slate-800/80 text-slate-200 hover:text-white transition shadow-md group active:scale-95"
                          >
                            <span className="w-7 h-7 rounded-xl text-xs font-black flex items-center justify-center bg-slate-800 text-slate-400 group-hover:bg-cyan-500 group-hover:text-slate-950 transition shrink-0">
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span className="flex-1 leading-snug">{opt}</span>
                          </button>
                        ))}
                      </div>

                      <div className="pt-2 text-center text-[11px] text-slate-500 font-medium">
                        💡 Selecting an answer or reaching 0s immediately advances to the next question.
                      </div>
                    </div>
                  );
                })()}

              </div>
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

        {/* Engine Error Alert Banner */}
        {engineError && (
          <div className="bg-rose-950/90 border-b border-rose-500/60 px-6 py-3 flex items-center justify-between text-rose-200 text-xs shadow-lg animate-in slide-in-from-top duration-300">
            <div className="flex items-center space-x-3">
              <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/40 shrink-0">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-rose-300 block">
                  WebAssembly Engine Error Detected
                </span>
                <span className="text-[11px] text-rose-300/80 font-mono">
                  {engineError}
                </span>
              </div>
            </div>
            <button
              onClick={() => setEditorSubTab('console')}
              className="px-3 py-1.5 rounded-lg bg-rose-900/60 hover:bg-rose-900 text-rose-200 border border-rose-500/40 text-xs font-bold transition shrink-0 ml-4"
            >
              View Console Logs
            </button>
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
            <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="ml-2 text-xs font-mono text-slate-400 font-semibold">
                    query.sql
                  </span>
                </div>

                {/* Prominent SQL Workspace Countdown Timer */}
                <div 
                  title={isSqlLocked ? 'Time expired: SQL Editor is locked' : 'SQL Workspace Challenge Timer'}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center space-x-1.5 border transition-all ${
                    isSqlLocked
                      ? 'bg-rose-950/80 text-rose-300 border-rose-500/60 shadow-lg shadow-rose-950/40'
                      : sqlTimeLeft <= 60
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/50 animate-pulse'
                      : sqlTimeLeft <= 120
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-800/90 text-cyan-300 border-slate-700/80'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>{isSqlLocked ? '🔒 Time Up (Locked)' : `⏱️ ${formatSqlTime(sqlTimeLeft)}`}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleEditorReset}
                  disabled={isSqlLocked}
                  title="Reset to Starter Code"
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={handleRunCode}
                  disabled={isRunning || !engineReady || Boolean(engineError) || isSqlLocked}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold shadow flex items-center space-x-1.5 transition ${
                    isSqlLocked
                      ? 'bg-slate-800/60 text-slate-500 border border-slate-800 cursor-not-allowed opacity-50'
                      : engineError
                      ? 'bg-rose-950/60 text-rose-300 border border-rose-500/50 cursor-not-allowed opacity-90'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 disabled:opacity-50'
                  }`}
                >
                  {isRunning ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                  ) : engineError ? (
                    <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                  ) : !engineReady ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                  ) : (
                    <Play className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400" />
                  )}
                  <span>
                    {isSqlLocked
                      ? 'Locked (Time Expired)'
                      : engineError
                      ? 'Engine Error (Check Console)'
                      : !engineReady
                      ? 'Loading Engine...'
                      : isRunning
                      ? 'Running...'
                      : 'Run Code'}
                  </span>
                </button>

                <button
                  onClick={handleSubmitSolution}
                  disabled={isRunning || !engineReady || Boolean(engineError) || isSqlLocked}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold shadow-lg flex items-center space-x-1.5 transition ${
                    isSqlLocked
                      ? 'bg-slate-800/60 text-slate-500 border border-slate-800 cursor-not-allowed opacity-50'
                      : engineError
                      ? 'bg-rose-950/60 text-rose-300 border border-rose-500/50 cursor-not-allowed opacity-90'
                      : 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white shadow-emerald-600/30 disabled:opacity-50'
                  }`}
                >
                  {isRunning ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  ) : engineError ? (
                    <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                  ) : !engineReady ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  ) : (
                    <Send className="w-3.5 h-3.5 text-white" />
                  )}
                  <span>
                    {isSqlLocked
                      ? 'Locked'
                      : engineError
                      ? 'Engine Error (Check Console)'
                      : !engineReady
                      ? 'Loading Engine...'
                      : isRunning
                      ? 'Evaluating...'
                      : 'Submit Solution'}
                  </span>
                </button>
              </div>
            </div>

            {/* Interactive CodeMirror Editor with Anti-Cheat Paste Interceptor & Lock */}
            <div 
              onPasteCapture={handlePaste}
              className="flex-1 min-h-[260px] bg-[#282c34] overflow-y-auto relative"
            >
              {isSqlLocked && (
                <div className="absolute top-3 right-3 z-10 px-3 py-1 rounded-lg bg-rose-950/90 border border-rose-500/60 text-rose-300 text-xs font-bold flex items-center space-x-1.5 shadow-lg backdrop-blur-md">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Editor Locked (Time Expired)</span>
                </div>
              )}
              <CodeMirror
                value={code}
                height="100%"
                theme={oneDark}
                extensions={[sql()]}
                onChange={(value) => setCode(value)}
                readOnly={isSqlLocked}
                editable={!isSqlLocked}
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
                  <div className="space-y-2 font-mono">
                    {logs.length === 0 ? (
                      <p className="text-slate-500 italic p-3">Console initialized. No messages.</p>
                    ) : (
                      logs.map((log, idx) => (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-xl text-xs leading-relaxed flex items-start space-x-2.5 ${
                            log.type === 'error'
                              ? 'bg-rose-950/50 text-rose-200 border border-rose-500/40 shadow-sm'
                              : log.type === 'warn'
                              ? 'bg-amber-950/50 text-amber-200 border border-amber-500/40 shadow-sm'
                              : log.type === 'success'
                              ? 'bg-emerald-950/50 text-emerald-200 border border-emerald-500/40 shadow-sm'
                              : 'bg-slate-950/80 text-slate-300 border border-slate-800'
                          }`}
                        >
                          {log.type === 'error' ? (
                            <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                          ) : log.type === 'warn' ? (
                            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          ) : log.type === 'success' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          ) : (
                            <TerminalIcon className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                          )}
                          <span className="break-all flex-1 whitespace-pre-wrap">{log.text}</span>
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
