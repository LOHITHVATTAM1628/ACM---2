import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import CodeMirror from '@uiw/react-codemirror';
import { sql } from '@codemirror/lang-sql';
import { oneDark } from '@codemirror/theme-one-dark';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { executeChallenge, executeDryRun, getSqlInstance, inspectSchema } from '../lib/sqlEngine';
const AiMentor = React.lazy(() => import('../components/AiMentor'));
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
      <div className="min-h-[calc(100vh-4rem)] cp-page-bg flex flex-col items-center justify-center space-y-4 text-slate-300">
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
      <div className="min-h-[calc(100vh-4rem)] cp-page-bg flex items-center justify-center p-6">
        <div className="cp-glass-panel rounded-3xl p-8 max-w-md w-full text-center space-y-5 shadow-2xl cp-fade-in">
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
            className="cp-btn-primary inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition"
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
      className="min-h-[calc(100vh-4rem)] cp-page-bg text-slate-100 flex flex-col"
    >
      
      {/* ═══════════════ TOP NAVIGATION BAR ═══════════════ */}
      <div className="cp-top-nav border-b border-slate-800/60 px-4 sm:px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4 z-20">
        
        {/* Left: Day info & Title */}
        <div className="flex items-center space-x-3">
          <Link
            to="/student/contest"
            className="cp-back-btn p-1.5 rounded-lg transition shrink-0"
            title="Back to Contest Hub"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center space-x-2 min-w-0">
            <span className="cp-day-badge text-xs font-black px-2.5 py-1 rounded-lg shrink-0">
              DAY {String(challenge.day_number).padStart(2, '0')}
            </span>
            <h1 className="text-sm sm:text-base font-bold text-white truncate max-w-[200px] sm:max-w-md">
              {challenge.title}
            </h1>
          </div>
        </div>

        {/* Center: Learning Loop 3-Step Tabs */}
        <div className="cp-tab-container flex items-center p-1 rounded-2xl self-center md:self-auto">
          <button
            onClick={() => setLearningTab('lesson')}
            className={`cp-tab flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              learningTab === 'lesson'
                ? 'cp-tab-active cp-tab-lesson'
                : 'cp-tab-inactive'
            }`}
          >
            <Tv className="w-4 h-4" />
            <span>📺 Lesson</span>
          </button>

          <button
            onClick={() => setLearningTab('quiz')}
            className={`cp-tab flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all relative ${
              learningTab === 'quiz'
                ? 'cp-tab-active cp-tab-quiz'
                : 'cp-tab-inactive'
            }`}
          >
            <FileQuestion className="w-4 h-4" />
            <span>📝 Knowledge Check</span>
            {quizQuestions.length > 0 && (
              <span className="cp-tab-badge ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-black">
                {quizQuestions.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setLearningTab('workspace')}
            className={`cp-tab flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              learningTab === 'workspace'
                ? 'cp-tab-active cp-tab-workspace'
                : 'cp-tab-inactive'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>💻 Commit2Query</span>
          </button>
        </div>

        {/* Right: Points & Difficulty */}
        <div className="hidden lg:flex items-center space-x-3">
          <div className="cp-xp-badge flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>+{challenge.points} XP</span>
          </div>

          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
              challenge.difficulty === 'Easy'
                ? 'cp-diff-easy'
                : challenge.difficulty === 'Medium'
                ? 'cp-diff-medium'
                : 'cp-diff-hard'
            }`}
          >
            {challenge.difficulty || 'Easy'}
          </span>
        </div>
      </div>

      {/* ═══════════════ TAB 1: LESSON ═══════════════ */}
      <div className={`flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto cp-fade-in ${learningTab === 'lesson' ? 'block' : 'hidden'}`}>
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="cp-glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700/40 pb-5">
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
                className="cp-btn-secondary px-5 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition self-start sm:self-auto"
              >
                <span>Take Knowledge Check</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Video Player Frame */}
            {embedVideoUrl ? (
              <div className="cp-video-frame relative aspect-video w-full rounded-2xl overflow-hidden">
                <iframe
                  src={embedVideoUrl}
                  title={`Day ${challenge.day_number} Video Lesson`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  loading="lazy"
                  className="w-full h-full border-0"
                />
              </div>
            ) : (
              <div className="cp-empty-state p-12 text-center rounded-2xl space-y-3">
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
                    className="cp-btn-secondary px-4 py-2 rounded-xl text-xs font-bold transition"
                  >
                    Go to Knowledge Check
                  </button>
                  <button
                    onClick={() => setLearningTab('workspace')}
                    className="cp-btn-primary px-4 py-2 rounded-xl text-xs font-bold transition"
                  >
                    Open SQL Workspace
                  </button>
                </div>
              </div>
            )}

            {/* Problem Overview Description */}
            <div className="cp-desc-panel rounded-2xl p-5 space-y-3">
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

      {/* ═══════════════ TAB 2: KNOWLEDGE CHECK ═══════════════ */}
      <div className={`flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto cp-fade-in ${learningTab === 'quiz' ? 'block' : 'hidden'}`}>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="cp-glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
            
            {/* Header / Score Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700/40 pb-5">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center space-x-1.5">
                  <FileQuestion className="w-4 h-4" />
                  <span>Day {challenge.day_number} Knowledge Check</span>
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                  Validate Your SQL Mastery
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Test your understanding under time pressure ({timerDuration}s per question) before writing SQL.
                </p>
              </div>

              {quizSubmitted && quizScore && (
                <div className="cp-quiz-score-badge flex items-center space-x-3 px-4 py-2 rounded-2xl text-xs font-bold shrink-0">
                  <Award className="w-5 h-5 text-emerald-400" />
                  <span>Score: {quizScore.correct} / {quizScore.total} ({quizScore.percentage}%) • +{quizScore.pointsEarned} XP</span>
                </div>
              )}
            </div>

            {/* Quiz Save Error Alert Banner */}
            {quizSaveError && (
              <div className="cp-error-banner p-4 rounded-2xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
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
                      className="cp-btn-secondary px-3 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1"
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
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                <p className="text-xs text-slate-400">Loading knowledge check questions & attempt records...</p>
              </div>
            ) : quizQuestions.length === 0 ? (
              <div className="cp-empty-state p-12 text-center rounded-2xl space-y-3">
                <FileQuestion className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="text-base font-bold text-white">No Quiz Questions Configured Yet</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  There are currently no quiz questions assigned to Day {challenge.day_number}. You can proceed directly to the SQL query workspace!
                </p>
                <button
                  onClick={() => setLearningTab('workspace')}
                  className="cp-btn-primary px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition inline-flex items-center space-x-2"
                >
                  <span>Launch Commit2Query Workspace</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ) : quizSubmitted || quizAttempt ? (
              /* ──── VIEW 1: COMPLETED QUIZ REVIEW ──── */
              <div className="space-y-6">
                {/* Completion Banner */}
                <div className="cp-quiz-complete-banner p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full cp-success-icon flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        ✅ Quiz Completed
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Score: <strong className="text-emerald-300">{quizScore?.correct ?? 0} / {quizQuestions.length}</strong> ({quizScore?.percentage ?? 0}%) • Points Earned: <strong className="text-cyan-400">+{quizScore?.pointsEarned ?? 0} XP</strong>
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setLearningTab('workspace')}
                    className="cp-btn-primary px-4 py-2 rounded-xl text-xs font-bold shadow-md transition flex items-center space-x-1.5 shrink-0"
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
                        className={`cp-review-card p-5 rounded-2xl space-y-3 ${
                          isCorrect ? 'cp-review-correct' : 'cp-review-incorrect'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center space-x-2">
                            <span className="cp-q-number w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center shrink-0">
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

                            let optClass = 'cp-opt-default';
                            if (isAnswerKey) {
                              optClass = 'cp-opt-correct';
                            } else if (isSelected && !isAnswerKey) {
                              optClass = 'cp-opt-incorrect';
                            }

                            return (
                              <div
                                key={optIdx}
                                className={`cp-review-option p-2.5 rounded-xl text-xs flex items-center space-x-2 ${optClass}`}
                              >
                                <span className="cp-opt-letter w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center shrink-0">
                                  {String.fromCharCode(65 + optIdx)}
                                </span>
                                <span className="flex-1">{opt}</span>
                              </div>
                            );
                          })}
                        </div>

                        {q.explanation && (
                          <div className="cp-explanation p-3 rounded-xl text-xs space-y-1">
                            <span className="font-bold text-cyan-300 uppercase text-[10px] tracking-wider block">
                              💡 Explanation:
                            </span>
                            <p className="text-slate-300">{q.explanation}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : !isQuizActive ? (
              /* ──── VIEW 2: QUIZ START LOBBY ──── */
              <div className="cp-quiz-lobby p-8 text-center rounded-3xl space-y-6">
                <div className="w-16 h-16 rounded-2xl cp-quiz-lobby-icon flex items-center justify-center mx-auto text-white">
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
                  <div className="cp-rule-card p-3.5 rounded-2xl space-y-1">
                    <div className="flex items-center space-x-2 text-xs font-bold text-amber-400">
                      <span>⏱️ {challenge?.quiz_timer_seconds || 10}s Per Question</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Automatic advance when timer hits zero.</p>
                  </div>

                  <div className="cp-rule-card p-3.5 rounded-2xl space-y-1">
                    <div className="flex items-center space-x-2 text-xs font-bold text-cyan-400">
                      <span>⚡ 1-Time Attempt</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Score permanently counts towards leaderboard.</p>
                  </div>

                  <div className="cp-rule-card p-3.5 rounded-2xl space-y-1">
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
                    className="cp-btn-start-quiz px-8 py-3.5 rounded-2xl text-sm font-extrabold inline-flex items-center space-x-2.5 transition"
                  >
                    <span>Start Knowledge Check ({quizQuestions.length} Questions)</span>
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              /* ──── VIEW 3: ACTIVE QUIZ WITH TIMER ──── */
              <div className="space-y-6">
                
                {/* Stepper Top Bar with Timer */}
                <div className="cp-quiz-stepper flex items-center justify-between p-4 rounded-2xl">
                  <div className="flex items-center space-x-3">
                    <span className="cp-q-counter px-3 py-1 rounded-xl font-mono text-xs font-black">
                      Question {currentQuestionIdx + 1} of {quizQuestions.length}
                    </span>
                    {/* Progress dots */}
                    <div className="hidden sm:flex items-center space-x-1.5">
                      {quizQuestions.map((_, dotIdx) => (
                        <span
                          key={dotIdx}
                          className={`w-2.5 h-2.5 rounded-full transition-all ${
                            dotIdx < currentQuestionIdx
                              ? 'bg-emerald-500 shadow-sm shadow-emerald-500/30'
                              : dotIdx === currentQuestionIdx
                              ? 'bg-cyan-400 shadow-sm shadow-cyan-400/40 scale-125'
                              : 'bg-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Countdown Timer Display */}
                  <div className={`cp-timer flex items-center space-x-2 px-3.5 py-1.5 rounded-xl font-mono text-xs font-black transition-all ${
                    timeLeft <= 3 
                      ? 'cp-timer-critical'
                      : timeLeft <= 6
                      ? 'cp-timer-warning'
                      : 'cp-timer-safe'
                  }`}>
                    <Clock className="w-3.5 h-3.5" />
                    <span>{timeLeft}s</span>
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
                    <div className="cp-question-card p-6 sm:p-8 rounded-3xl space-y-6 cp-fade-in">
                      <div className="flex items-start space-x-3">
                        <span className="cp-q-badge w-9 h-9 rounded-xl text-xs font-black flex items-center justify-center shrink-0">
                          Q{currentQuestionIdx + 1}
                        </span>
                        <h3 className="text-base sm:text-lg font-bold text-white leading-relaxed">
                          {q.question}
                        </h3>
                      </div>

                      {/* 4 Option Buttons */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        {Array.isArray(parsedOpts) && parsedOpts.map((opt, optIdx) => (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() => handleOptionSelect(optIdx)}
                            className="cp-option-btn p-4 rounded-2xl text-xs sm:text-sm font-semibold text-left flex items-center space-x-3 group active:scale-[0.97] transition"
                          >
                            <span className="cp-option-letter w-8 h-8 rounded-xl text-xs font-black flex items-center justify-center shrink-0 transition">
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span className="flex-1 leading-snug text-slate-200 group-hover:text-white transition">{opt}</span>
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

      {/* ═══════════════ TAB 3: COMMIT2QUERY WORKSPACE ═══════════════ */}
      <div className={`flex-1 flex flex-col ${learningTab === 'workspace' ? 'flex' : 'hidden'}`}>
        
        {/* Accepted Reward Banner */}
        {showSuccessBanner && (
          <div className="cp-success-banner px-6 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full cp-success-icon flex items-center justify-center">
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
          <div className="cp-error-banner px-6 py-3 flex items-center justify-between text-xs">
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
          <div className="cp-left-pane w-full lg:w-[40%] border-b lg:border-b-0 lg:border-r border-slate-800/60 p-5 sm:p-6 overflow-y-auto space-y-6">
            
            {/* Problem Statement */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <Database className="w-4 h-4 text-cyan-400" />
                <span>Problem Description</span>
              </div>
              <div className="cp-problem-desc rounded-2xl p-4 sm:p-5 text-sm text-slate-200 leading-relaxed whitespace-pre-line">
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
                  className="cp-leetcode-link w-full py-3 px-4 rounded-2xl text-xs font-extrabold flex items-center justify-between group transition duration-200"
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

            {/* Database Schema & Seed Data Table */}
            {schemaData && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                    <TableIcon className="w-4 h-4 text-indigo-400" />
                    <span>Table: `{schemaData.tableName}`</span>
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">WASM SQLite</span>
                </div>

                <div className="cp-schema-table rounded-xl overflow-hidden">
                  <div className="overflow-x-auto max-h-56">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="cp-schema-thead sticky top-0">
                        <tr>
                          {schemaData.columns.map((col, idx) => (
                            <th key={idx} className="py-2.5 px-3 font-semibold whitespace-nowrap">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40 text-slate-300">
                        {schemaData.sampleRows.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-slate-800/30 transition">
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
                <div className="cp-schema-hint p-3 rounded-xl text-xs font-mono">
                  {challenge.schema_hint}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT PANE: Code Editor & Terminal (60%) */}
          <div className="w-full lg:w-[60%] flex flex-col bg-slate-950 justify-between">
            
            {/* Top Editor Toolbar & Action Buttons */}
            <div className="cp-editor-toolbar px-4 py-2.5 flex items-center justify-between flex-wrap gap-2">
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
                  className={`cp-sql-timer px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center space-x-1.5 transition-all ${
                    isSqlLocked
                      ? 'cp-sql-timer-locked'
                      : sqlTimeLeft <= 60
                      ? 'cp-sql-timer-critical'
                      : sqlTimeLeft <= 120
                      ? 'cp-sql-timer-warning'
                      : 'cp-sql-timer-safe'
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
                  className="cp-toolbar-btn p-2 rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={handleRunCode}
                  disabled={isRunning || !engineReady || Boolean(engineError) || isSqlLocked}
                  className={`cp-btn-run px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition ${
                    isSqlLocked || engineError
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
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
                  className={`cp-btn-submit px-4 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition ${
                    isSqlLocked || engineError
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
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
              className="cp-editor-area flex-1 min-h-[260px] overflow-y-auto relative"
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
            <div className="cp-terminal h-64 flex flex-col">
              
              {/* Sub-tab Navigation Headers */}
              <div className="cp-terminal-tabs flex items-center justify-between px-4">
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setEditorSubTab('output')}
                    className={`cp-terminal-tab px-3 py-2 text-xs font-bold border-b-2 transition flex items-center space-x-1.5 ${
                      editorSubTab === 'output'
                        ? 'cp-terminal-tab-active-cyan'
                        : 'cp-terminal-tab-inactive'
                    }`}
                  >
                    <TableIcon className="w-3.5 h-3.5" />
                    <span>Query Output</span>
                  </button>

                  <button
                    onClick={() => setEditorSubTab('expected')}
                    className={`cp-terminal-tab px-3 py-2 text-xs font-bold border-b-2 transition flex items-center space-x-1.5 ${
                      editorSubTab === 'expected'
                        ? 'cp-terminal-tab-active-amber'
                        : 'cp-terminal-tab-inactive'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Expected Output</span>
                  </button>

                  <button
                    onClick={() => setEditorSubTab('console')}
                    className={`cp-terminal-tab px-3 py-2 text-xs font-bold border-b-2 transition flex items-center space-x-1.5 ${
                      editorSubTab === 'console'
                        ? 'cp-terminal-tab-active-violet'
                        : 'cp-terminal-tab-inactive'
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
                      <table className="w-full text-left border border-slate-800 rounded-lg overflow-hidden">
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
                      <table className="w-full text-left border border-slate-800 rounded-lg overflow-hidden">
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
                          className={`cp-log-entry p-2.5 rounded-xl text-xs leading-relaxed flex items-start space-x-2.5 ${
                            log.type === 'error'
                              ? 'cp-log-error'
                              : log.type === 'warn'
                              ? 'cp-log-warn'
                              : log.type === 'success'
                              ? 'cp-log-success'
                              : 'cp-log-info'
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
      <React.Suspense fallback={null}>
        <AiMentor 
          problemContext={challenge.description}
          studentCode={code}
        />
      </React.Suspense>

    </div>
  );
};

export default ChallengePlayground;
