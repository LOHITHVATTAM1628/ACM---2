import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  BookOpen, 
  HelpCircle, 
  Terminal, 
  CheckCircle2, 
  Circle, 
  ArrowLeft, 
  ArrowRight, 
  Layers, 
  Code2, 
  Sparkles, 
  Check, 
  Clock, 
  Copy, 
  Flame
} from 'lucide-react';

const mockTopicsData = {
  'beginner-sql': {
    trackTitle: 'Beginner SQL',
    topics: [
      {
        id: 'select-basics',
        title: '1. SELECT & FROM Essentials',
        duration: '10 min',
        completed: true,
        summary: 'Retrieving columns, expressions, and aliasing in PostgreSQL.',
        content: {
          overview: 'The `SELECT` statement is the cornerstone of Structured Query Language (SQL). It allows you to query one or more columns from a relational table and return a structured tabular result set.',
          sqlExample: `SELECT 
    student_id,
    full_name,
    email,
    gpa * 25 AS gpa_percentage
FROM acm_students
ORDER BY gpa DESC
LIMIT 5;`,
          explanation: [
            '**SELECT Clause**: Specifies the list of columns or calculated expressions to retrieve.',
            '**FROM Clause**: Identifies the source relation or table (`acm_students`).',
            '**Column Aliasing**: Use the `AS` keyword to assign clean, human-readable column names.',
            '**LIMIT / ORDER BY**: Dictate sorting order (`ASC` or `DESC`) and cap the maximum rows returned.',
          ],
          sampleTable: {
            headers: ['student_id', 'full_name', 'email', 'gpa_percentage'],
            rows: [
              ['ACM-101', 'Ada Lovelace', 'ada@acm.org', '98.50'],
              ['ACM-102', 'Alan Turing', 'alan@acm.org', '97.25'],
              ['ACM-103', 'Grace Hopper', 'grace@acm.org', '96.80'],
            ],
          },
          proTip: 'In production systems, avoid `SELECT *` whenever possible. Specifying exact column names reduces network bandwidth and leverages index-only scans.',
        },
      },
      {
        id: 'where-filters',
        title: '2. Filtering with WHERE & Predicates',
        duration: '15 min',
        completed: true,
        summary: 'Comparison operators, logical AND/OR, and pattern matching.',
        content: {
          overview: 'The `WHERE` clause filters rows before any grouping or projection takes place. You can combine multiple logical conditions using `AND`, `OR`, `NOT`, and `IN`.',
          sqlExample: `SELECT full_name, role, total_points
FROM profiles
WHERE (role = 'student' OR role = 'mentor')
  AND total_points >= 500
  AND email LIKE '%@university.edu';`,
          explanation: [
            '**Comparison Operators**: `=`, `<>`, `<`, `<=`, `>`, `>=`.',
            '**Logical Precedence**: `AND` has higher precedence than `OR`; always use parentheses for clarity.',
            '**Pattern Matching**: `LIKE` and `ILIKE` (case-insensitive in PostgreSQL) with `%` (wildcard) and `_` (single char).',
          ],
          sampleTable: {
            headers: ['full_name', 'role', 'total_points'],
            rows: [
              ['Sarah Connor', 'student', '850'],
              ['Marcus Vance', 'mentor', '1240'],
            ],
          },
          proTip: 'Filtering on indexed columns prevents sequential table scans and drastically reduces query execution time.',
        },
      },
      {
        id: 'aggregate-functions',
        title: '3. Aggregate Functions & GROUP BY',
        duration: '20 min',
        completed: true,
        summary: 'COUNT, SUM, AVG, MIN, MAX and grouping categories.',
        content: {
          overview: 'Aggregate functions summarize data over multiple records into a single consolidated metric. The `GROUP BY` clause divides rows into subsets for independent aggregation.',
          sqlExample: `SELECT 
    department,
    COUNT(id) AS total_members,
    ROUND(AVG(total_points), 2) AS avg_xp,
    MAX(total_points) AS highest_xp
FROM profiles
GROUP BY department
HAVING COUNT(id) >= 5;`,
          explanation: [
            '**COUNT(expression)**: Counts non-null entries; `COUNT(*)` counts all rows including NULLs.',
            '**GROUP BY**: Groups rows with identical values in the specified columns.',
            '**HAVING Clause**: Filters aggregated groups *after* grouping, unlike `WHERE` which filters before grouping.',
          ],
          sampleTable: {
            headers: ['department', 'total_members', 'avg_xp', 'highest_xp'],
            rows: [
              ['Computer Science', '42', '1120.45', '2480'],
              ['Information Tech', '28', '940.10', '1980'],
            ],
          },
          proTip: 'Every non-aggregated column in your `SELECT` statement must appear in your `GROUP BY` list.',
        },
      },
      {
        id: 'null-handling',
        title: '4. Handling NULLs & COALESCE',
        duration: '12 min',
        completed: false,
        summary: 'Three-valued logic, IS NULL checks, and COALESCE fallback defaults.',
        content: {
          overview: 'NULL represents an unknown or missing value. In SQL, comparisons with NULL evaluate to `UNKNOWN` rather than `TRUE` or `FALSE`.',
          sqlExample: `SELECT 
    full_name,
    COALESCE(phone_number, 'Not Provided') AS contact_phone,
    COALESCE(alternate_email, email) AS primary_contact
FROM members
WHERE deleted_at IS NULL;`,
          explanation: [
            '**Three-valued Logic**: `TRUE`, `FALSE`, and `UNKNOWN`.',
            '**IS NULL / IS NOT NULL**: Use these explicit predicates rather than `= NULL`.',
            '**COALESCE(val1, val2, ...)**: Evaluates arguments in order and returns the first non-null value.',
          ],
          sampleTable: {
            headers: ['full_name', 'contact_phone', 'primary_contact'],
            rows: [
              ['Elena Rostova', '+1 (555) 019-2831', 'elena@acm.org'],
              ['David Chen', 'Not Provided', 'david@chen.dev'],
            ],
          },
          proTip: 'Be cautious when using `NOT IN` with subqueries containing NULLs; it can cause the entire query to return zero rows!',
        },
      },
    ],
  },
  'placement-prep': {
    trackTitle: 'Placement Prep',
    topics: [
      {
        id: 'inner-vs-outer-joins',
        title: '1. Relational Joins (INNER, LEFT, RIGHT, FULL)',
        duration: '25 min',
        completed: true,
        summary: 'Mapping parent-child entities, avoiding duplicate cartesian joins.',
        content: {
          overview: 'Joins allow you to combine records from two or more tables based on a related column between them (such as Primary Key and Foreign Key constraints).',
          sqlExample: `SELECT 
    s.full_name AS student_name,
    c.title AS contest_name,
    sub.score
FROM students s
INNER JOIN submissions sub ON s.id = sub.student_id
LEFT JOIN contests c ON sub.contest_id = c.id
WHERE sub.score > 80;`,
          explanation: [
            '**INNER JOIN**: Returns rows when there is a match in both tables.',
            '**LEFT JOIN**: Returns all rows from the left table, and matching rows from the right table (NULL if no match).',
            '**FULL OUTER JOIN**: Returns all records when there is a match in either left or right table.',
          ],
          sampleTable: {
            headers: ['student_name', 'contest_name', 'score'],
            rows: [
              ['Aisha Patel', '21-Day Sprint Day 1', '100'],
              ['Marcus Vance', '21-Day Sprint Day 2', '95'],
            ],
          },
          proTip: 'Always qualify column names with table aliases (e.g. `s.id` instead of `id`) to avoid ambiguous column errors.',
        },
      },
      {
        id: 'subqueries-ctes',
        title: '2. Subqueries & Common Table Expressions',
        duration: '20 min',
        completed: false,
        summary: 'Scalar subqueries, correlated subqueries, and WITH CTE blocks.',
        content: {
          overview: 'CTEs (Common Table Expressions) provide modular, readable named result sets that exist temporarily within the scope of a single SQL query.',
          sqlExample: `WITH TopScorers AS (
    SELECT student_id, SUM(points) AS total_xp
    FROM contest_submissions
    GROUP BY student_id
)
SELECT s.full_name, ts.total_xp
FROM TopScorers ts
JOIN students s ON ts.student_id = s.id
WHERE ts.total_xp > 1000;`,
          explanation: [
            '**WITH Clause**: Defines one or more CTEs before the main query executes.',
            '**Readability**: Breaks down huge nested subqueries into easy-to-read sequential logic blocks.',
          ],
          sampleTable: {
            headers: ['full_name', 'total_xp'],
            rows: [
              ['Elena Rostova', '2480'],
              ['David Chen', '2150'],
            ],
          },
          proTip: 'PostgreSQL 12+ automatically inlines non-recursive CTEs unless explicitly declared as `WITH ... AS MATERIALIZED`.',
        },
      },
    ],
  },
  'complex-joins-window-functions': {
    trackTitle: 'Complex Joins & Window Functions',
    topics: [
      {
        id: 'window-functions-overview',
        title: '1. Introduction to OVER & PARTITION BY',
        duration: '25 min',
        completed: true,
        summary: 'ROW_NUMBER, RANK, and DENSE_RANK without collapsing rows.',
        content: {
          overview: 'Unlike regular aggregate functions which collapse rows, window functions perform calculations across a set of table rows that are related to the current row, while preserving individual row identity.',
          sqlExample: `SELECT 
    full_name,
    department,
    total_points,
    ROW_NUMBER() OVER(PARTITION BY department ORDER BY total_points DESC) AS dept_rank,
    DENSE_RANK() OVER(ORDER BY total_points DESC) AS global_rank
FROM profiles;`,
          explanation: [
            '**OVER Clause**: Signifies that the function is evaluated as a window function.',
            '**PARTITION BY**: Divides the rows into partitions/groups to apply the calculation separately.',
            '**ORDER BY**: Dictates the evaluation order inside the window partition.',
          ],
          sampleTable: {
            headers: ['full_name', 'department', 'total_points', 'dept_rank', 'global_rank'],
            rows: [
              ['Elena Rostova', 'Computer Science', '2480', '1', '1'],
              ['David Chen', 'Computer Science', '2150', '2', '2'],
              ['Aisha Patel', 'Information Tech', '1980', '1', '3'],
            ],
          },
          proTip: 'Window functions are executed after `WHERE`, `GROUP BY`, and `HAVING` clauses, but before the final `ORDER BY`.',
        },
      },
      {
        id: 'lag-lead-offsets',
        title: '2. Temporal Shifts: LAG & LEAD',
        duration: '20 min',
        completed: false,
        summary: 'Comparing metrics with previous/subsequent rows without self-joins.',
        content: {
          overview: '`LAG` and `LEAD` allow you to access data from preceding or succeeding rows at a specified physical offset without performing expensive self-joins.',
          sqlExample: `SELECT 
    log_date,
    submissions_count,
    LAG(submissions_count, 1, 0) OVER(ORDER BY log_date) AS prev_day_count,
    submissions_count - LAG(submissions_count, 1, 0) OVER(ORDER BY log_date) AS daily_growth
FROM chapter_daily_metrics;`,
          explanation: [
            '**LAG(column, offset, default)**: Returns value from `offset` rows before the current row.',
            '**LEAD(column, offset, default)**: Returns value from `offset` rows after the current row.',
          ],
          sampleTable: {
            headers: ['log_date', 'submissions_count', 'prev_day_count', 'daily_growth'],
            rows: [
              ['2026-08-10', '120', '0', '+120'],
              ['2026-08-11', '185', '120', '+65'],
              ['2026-08-12', '210', '185', '+25'],
            ],
          },
          proTip: 'Provide the 3rd argument in `LAG(col, 1, 0)` as a fallback default to prevent NULL values on the boundary row.',
        },
      },
    ],
  },
};

const TopicDetail = () => {
  const { trackSlug, topicId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('learn'); // 'learn' | 'quiz' | 'practice'
  const [copied, setCopied] = useState(false);

  // Retrieve track data or fallback
  const currentTrackData = mockTopicsData[trackSlug] || mockTopicsData['beginner-sql'];
  const topicList = currentTrackData.topics || [];
  
  // Current active topic
  const currentTopic = topicList.find((t) => t.id === topicId) || topicList[0];
  const currentIndex = topicList.findIndex((t) => t.id === currentTopic?.id);
  const nextTopic = topicList[currentIndex + 1] || null;
  const prevTopic = topicList[currentIndex - 1] || null;

  // Copy code helper
  const handleCopyCode = () => {
    if (currentTopic?.content?.sqlExample) {
      navigator.clipboard.writeText(currentTopic.content.sqlExample);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Breadcrumb Header Bar */}
      <div className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-4 sm:px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs sm:text-sm">
          <Link
            to="/tracks"
            className="flex items-center space-x-1.5 text-slate-400 hover:text-cyan-300 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Tracks</span>
          </Link>
          <span className="text-slate-600">/</span>
          <span className="text-slate-300 font-medium">{currentTrackData.trackTitle}</span>
          <span className="text-slate-600">/</span>
          <span className="text-cyan-300 font-semibold truncate max-w-[200px] sm:max-w-none">
            {currentTopic?.title}
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-xs text-slate-400 hidden sm:inline-flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{currentTopic?.duration} read</span>
          </span>
          <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
            ACM Syllabus
          </span>
        </div>
      </div>

      {/* Main Split-Screen Dashboard Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col lg:flex-row">
        
        {/* Left Sidebar: Topics Accordion / List (30% width) */}
        <aside className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-slate-800/90 bg-slate-900/40 p-4 sm:p-5 flex flex-col justify-between shrink-0">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Track Curriculum
                </h2>
              </div>
              <span className="text-[11px] font-semibold text-slate-400">
                {topicList.filter((t) => t.completed).length} / {topicList.length} Done
              </span>
            </div>

            {/* Topic Navigation Items */}
            <div className="space-y-2">
              {topicList.map((topic) => {
                const isActive = topic.id === currentTopic?.id;
                return (
                  <button
                    key={topic.id}
                    onClick={() => navigate(`/tracks/${trackSlug}/${topic.id}`)}
                    className={`w-full text-left p-3 rounded-xl transition-all flex items-start space-x-3 ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-950/80 to-slate-900 border border-cyan-500/40 shadow-lg shadow-cyan-500/5'
                        : 'bg-slate-950/50 hover:bg-slate-800/60 border border-slate-800/60'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {topic.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : isActive ? (
                        <div className="w-4 h-4 rounded-full border-2 border-cyan-400 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
                        </div>
                      ) : (
                        <Circle className="w-4 h-4 text-slate-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p
                          className={`text-xs font-bold truncate ${
                            isActive ? 'text-cyan-300' : 'text-slate-200'
                          }`}
                        >
                          {topic.title}
                        </p>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                        {topic.summary}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick chapter motivation badge in sidebar */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 hidden lg:block">
            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs flex items-center space-x-2.5">
              <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Complete all topics to earn verified track certificate.</span>
            </div>
          </div>
        </aside>

        {/* Right Main Panel: Tabs & Topic Content (70% width) */}
        <main className="flex-1 p-4 sm:p-8 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-6 max-w-4xl">
            
            {/* Top Navigation Tabs */}
            <div className="flex items-center space-x-2 border-b border-slate-800/90 pb-3">
              <button
                onClick={() => setActiveTab('learn')}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  activeTab === 'learn'
                    ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md shadow-indigo-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Learn Notes</span>
              </button>

              <button
                onClick={() => setActiveTab('quiz')}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  activeTab === 'quiz'
                    ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md shadow-indigo-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <HelpCircle className="w-4 h-4" />
                <span>Interactive Quiz</span>
              </button>

              <button
                onClick={() => setActiveTab('practice')}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  activeTab === 'practice'
                    ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md shadow-indigo-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Terminal className="w-4 h-4" />
                <span>Practice Query</span>
              </button>
            </div>

            {/* TAB CONTENT: 1. Learn Notes */}
            {activeTab === 'learn' && currentTopic?.content && (
              <div className="space-y-8 animate-in fade-in duration-200">
                {/* Title & Overview */}
                <div className="space-y-3">
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {currentTopic.title}
                  </h1>
                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                    {currentTopic.content.overview}
                  </p>
                </div>

                {/* SQL Code Block */}
                <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl">
                  <div className="bg-slate-900/90 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Code2 className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-mono font-semibold text-slate-300">
                        PostgreSQL Query Snippet
                      </span>
                    </div>
                    <button
                      onClick={handleCopyCode}
                      className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-300 transition"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-teal-400" />
                          <span className="text-teal-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-5 text-xs sm:text-sm font-mono text-cyan-300 overflow-x-auto leading-relaxed bg-slate-950">
                    <code>{currentTopic.content.sqlExample}</code>
                  </pre>
                </div>

                {/* Concept Breakdown Points */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                    Core Mechanics & Syntax Rules
                  </h3>
                  <div className="space-y-2.5">
                    {currentTopic.content.explanation?.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-start space-x-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80"
                      >
                        <div className="w-5 h-5 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                          {idx + 1}
                        </div>
                        <p
                          className="text-xs sm:text-sm text-slate-300 leading-relaxed"
                          dangerouslySetInnerHTML={{
                            __html: item.replace(
                              /\*\*(.*?)\*\*/g,
                              '<strong class="text-white font-semibold">$1</strong>'
                            ),
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sample Output Table */}
                {currentTopic.content.sampleTable && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                      Expected Query Result Set
                    </h3>
                    <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs font-mono">
                          <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                            <tr>
                              {currentTopic.content.sampleTable.headers.map((h, i) => (
                                <th key={i} className="py-2.5 px-4 font-semibold text-cyan-400">
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60 text-slate-300">
                            {currentTopic.content.sampleTable.rows.map((row, rIdx) => (
                              <tr key={rIdx} className="hover:bg-slate-900/40 transition">
                                {row.map((cell, cIdx) => (
                                  <td key={cIdx} className="py-2 px-4">
                                    {cell}
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

                {/* Pro-Tip Box */}
                {currentTopic.content.proTip && (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start space-x-3 text-amber-300">
                    <Flame className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider block mb-0.5 text-amber-400">
                        ACM Alumni Pro-Tip
                      </span>
                      <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                        {currentTopic.content.proTip}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: 2. Interactive Quiz Placeholder */}
            {activeTab === 'quiz' && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 sm:p-12 text-center space-y-4 animate-in fade-in duration-200">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400">
                  <HelpCircle className="w-8 h-8" />
                </div>
                <div className="space-y-2 max-w-md mx-auto">
                  <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-wider">
                    Phase 3 Roadmap
                  </span>
                  <h3 className="text-2xl font-black text-white">Interactive Quiz Engine</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Test your understanding with multiple-choice questions, schema relationship puzzles, and timed assessment challenges.
                  </p>
                </div>
                <div className="pt-2 text-xs font-mono text-slate-500">
                  Coming in Phase 3 • Real-time scoring & leaderboard badges
                </div>
              </div>
            )}

            {/* TAB CONTENT: 3. Practice Query Placeholder */}
            {activeTab === 'practice' && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 sm:p-12 text-center space-y-4 animate-in fade-in duration-200">
                <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400">
                  <Terminal className="w-8 h-8" />
                </div>
                <div className="space-y-2 max-w-md mx-auto">
                  <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-bold uppercase tracking-wider">
                    Phase 3 Roadmap
                  </span>
                  <h3 className="text-2xl font-black text-white">Browser SQL Execution Sandbox</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Write, format, and execute SQL queries against an in-browser PostgreSQL web engine with automated test case validation.
                  </p>
                </div>
                <div className="pt-2 text-xs font-mono text-slate-500">
                  Coming in Phase 3 • Live query runner & test case harness
                </div>
              </div>
            )}
          </div>

          {/* Bottom Topic Navigation Footer Bar */}
          <div className="mt-10 pt-6 border-t border-slate-800/80 flex items-center justify-between">
            {prevTopic ? (
              <button
                onClick={() => navigate(`/tracks/${trackSlug}/${prevTopic.id}`)}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Previous: {prevTopic.title}</span>
              </button>
            ) : (
              <div />
            )}

            {nextTopic ? (
              <button
                onClick={() => navigate(`/tracks/${trackSlug}/${nextTopic.id}`)}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 transition"
              >
                <span>Next: {nextTopic.title}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => navigate('/tracks')}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 transition"
              >
                <Check className="w-4 h-4" />
                <span>Complete Track</span>
              </button>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default TopicDetail;
