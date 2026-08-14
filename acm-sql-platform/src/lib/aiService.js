/**
 * AI Service for ACM SQL Chapter Platform using Groq API (Llama 3)
 */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const SYSTEM_PROMPT = `You are an expert, encouraging SQL mentor for college students in an ACM Student Chapter. 
You are helping a student solve a relational database challenge in SQLite / PostgreSQL.

CRITICAL PEDAGOGICAL RULES:
1. NEVER give the student the full or exact SQL solution query.
2. If the query has a syntax or semantic error, explain WHY the error occurred and which clause to fix.
3. Suggest appropriate clauses (e.g., GROUP BY, HAVING, ORDER BY, specific JOIN types, COALESCE) conceptually.
4. Use small pseudocode snippets or generic patterns (e.g., \`SELECT col, AGG(x) FROM tab GROUP BY col\`) instead of writing their exact query.
5. Keep explanations concise, clear, and encouraging. Use Markdown formatting (bolding, code blocks, lists).`;

/**
 * Sends a hint request to Groq API with user query, active schema, error context, and student code.
 */
export async function getHint({
  userMessage,
  schema,
  errorContext,
  studentQuery,
  challengeTitle,
  problemDescription,
  conversationHistory = [],
}) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;

  if (!apiKey || apiKey.trim() === '' || apiKey === 'YOUR_GROQ_API_KEY') {
    return generateLocalFallbackHint({
      userMessage,
      schema,
      errorContext,
      studentQuery,
    });
  }

  // Construct structured context payload for AI
  const contextMessage = `[CURRENT CONTEXT]
Challenge: ${challengeTitle || 'SQL Challenge'}
Problem: ${problemDescription || 'Solve the query according to specifications'}
Schema: ${schema ? `${schema.tableName} (${schema.columns?.join(', ')})` : 'Not provided'}
Student's Current SQL Query:
\`\`\`sql
${studentQuery || '-- (Empty query)'}
\`\`\`
${errorContext ? `Recent SQL Error Output: "${errorContext}"` : 'Recent SQL Error: None (Query executed or not run yet)'}
`;

  // Build messages array
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'system', content: contextMessage },
    ...conversationHistory.map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content,
    })),
    { role: 'user', content: userMessage },
  ];

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages,
        temperature: 0.5,
        max_tokens: 600,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData?.error?.message || `Groq API returned status ${response.status}`
      );
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'No response received from AI mentor.';
  } catch (err) {
    console.error('Groq AI Service Error:', err);
    // Graceful fallback with helpful diagnostic message
    return `⚠️ **Mentor Connection Notice:** Unable to reach Groq API (\`${err.message}\`).\n\n${generateLocalFallbackHint({
      userMessage,
      schema,
      errorContext,
      studentQuery,
    })}`;
  }
}

/**
 * Local heuristic mentor fallback when API key is missing or offline
 */
function generateLocalFallbackHint({ userMessage, schema, errorContext, studentQuery }) {
  const query = (studentQuery || '').toUpperCase();
  const lowerMsg = (userMessage || '').toLowerCase();

  if (errorContext) {
    return `### 🔍 Analyzing Your SQL Error:
**Error Message:** \`${errorContext}\`

**Mentor Guidance:**
- Check for typos in your column or table names against the schema (\`${schema?.tableName || 'table'}\`).
- Ensure every opened parenthesis \`(\` has a matching closing parenthesis \`)\`.
- If using aggregate functions like \`COUNT()\` or \`SUM()\` alongside plain columns, remember that all non-aggregated columns must appear in your \`GROUP BY\` clause.`;
  }

  if (lowerMsg.includes('failing') || lowerMsg.includes('why')) {
    if (!query.includes('WHERE')) {
      return `### 💡 Quick Check:
Your query might be missing a **\`WHERE\`** filtering condition to isolate the exact target records described in the challenge.`;
    }
    if (!query.includes('ORDER BY')) {
      return `### 💡 Quick Check:
Make sure your query sorts results with **\`ORDER BY\`** if the challenge prompt specifies a ranking order (e.g., highest score or alphabetical).`;
    }
    return `### 💡 Query Inspection:
Take a close look at:
1. **Column Projections**: Are you selecting the exact columns requested in the exact order?
2. **Filter Predicates**: Are your numeric or string comparison operators matching the condition strictly (\`>\` vs \`>=\`)?`;
  }

  if (lowerMsg.includes('schema') || lowerMsg.includes('hint')) {
    return `### 📋 Schema Hint for \`${schema?.tableName || 'Active Table'}\`:
Available Columns:
${schema?.columns?.map((c) => `- \`${c}\``).join('\n') || '- Check the schema table on the left pane'}

**Tip:** Look for the key column that holds the property you need to filter or aggregate.`;
  }

  return `### 🎓 SQL Mentor Tip:
To solve this step:
1. Identify the source table in \`FROM\`.
2. Apply row filters in \`WHERE\`.
3. If combining groups, apply \`GROUP BY\`.
4. Apply the final sorting with \`ORDER BY\`.

*What specific clause would you like help with?*`;
}
