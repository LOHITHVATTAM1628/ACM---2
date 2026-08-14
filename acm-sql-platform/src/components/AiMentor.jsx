import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { getHint } from '../lib/aiService';
import { 
  Bot, 
  Sparkles, 
  Send, 
  RotateCcw, 
  ChevronDown, 
  Loader2
} from 'lucide-react';

const quickChips = [
  { label: 'Why is my query failing?', query: 'Why is my current SQL query failing or returning unexpected results?' },
  { label: 'Give me a hint for this schema.', query: 'Can you give me a structural hint based on the table schema and challenge goal?' },
  { label: 'Explain the concepts needed here.', query: 'What SQL concepts and clauses (e.g., JOIN, GROUP BY, WHERE) are needed for this problem?' },
];

const AiMentor = ({ schema, studentQuery, errorContext, challengeTitle, problemDescription }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMsg, setInputMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `👋 **Hi there! I'm your ACM AI SQL Mentor.**\n\nI can help debug errors, suggest syntax patterns, and explain relational concepts **without giving away the direct answer**. Click a quick prompt below or ask me anything!`,
    },
  ]);

  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  const handleSendMessage = async (textToSend) => {
    const query = textToSend || inputMsg;
    if (!query.trim() || isLoading) return;

    const userMessageObj = { role: 'user', content: query.trim() };
    const updatedHistory = [...messages, userMessageObj];
    
    setMessages(updatedHistory);
    setInputMsg('');
    setIsLoading(true);

    try {
      const aiReply = await getHint({
        userMessage: query.trim(),
        schema,
        errorContext,
        studentQuery,
        challengeTitle,
        problemDescription,
        conversationHistory: updatedHistory,
      });

      setMessages((prev) => [...prev, { role: 'assistant', content: aiReply }]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `⚠️ *Error generating mentor advice:* ${err.message}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: `👋 Chat cleared! How can I help you with your SQL query today?`,
      },
    ]);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Toggle Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center space-x-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white shadow-2xl shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all duration-300 transform hover:scale-105 active:scale-95"
        >
          <div className="relative">
            <Bot className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900 animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900" />
          </div>
          <span className="text-xs font-black tracking-wider uppercase">AI SQL Mentor</span>
          <Sparkles className="w-4 h-4 text-cyan-200 animate-pulse" />
        </button>
      )}

      {/* Floating Expanded Chat Window */}
      {isOpen && (
        <div className="w-[360px] sm:w-[420px] h-[540px] max-h-[85vh] bg-slate-900/95 border border-slate-700/90 rounded-3xl shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-950 via-indigo-950/80 to-slate-950 px-4 py-3.5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 p-0.5 shadow-md">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Bot className="w-4 h-4 text-cyan-400" />
                </div>
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <h3 className="text-xs font-extrabold text-white">ACM AI Mentor</h3>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                    Llama 3
                  </span>
                </div>
                <div className="flex items-center space-x-1 text-[10px] text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Pedagogical Guide Active</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={handleClearChat}
                title="Clear Chat History"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Minimize Mentor"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Chat Messages List */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs text-slate-200">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex items-start space-x-2.5 ${
                  msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : 'flex-row'
                }`}
              >
                {/* Avatar Icon */}
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-bold shadow ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white'
                      : 'bg-slate-800 border border-slate-700 text-cyan-400'
                  }`}
                >
                  {msg.role === 'user' ? 'U' : <Bot className="w-3.5 h-3.5" />}
                </div>

                {/* Message Bubble */}
                <div
                  className={`p-3.5 rounded-2xl max-w-[85%] leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white rounded-tr-none shadow-md'
                      : 'bg-slate-950/90 border border-slate-800/90 text-slate-200 rounded-tl-none prose prose-invert prose-xs max-w-none'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <ReactMarkdown
                      components={{
                        p: (props) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />,
                        code: ({ inline, ...props }) =>
                          inline ? (
                            <code className="bg-slate-800/90 text-cyan-300 px-1 py-0.5 rounded font-mono text-[11px]" {...props} />
                          ) : (
                            <code className="block bg-slate-950 p-2 rounded-lg font-mono text-[11px] text-cyan-300 overflow-x-auto border border-slate-800/80 my-2" {...props} />
                          ),
                        ul: (props) => <ul className="list-disc pl-4 space-y-1 my-1.5" {...props} />,
                        ol: (props) => <ol className="list-decimal pl-4 space-y-1 my-1.5" {...props} />,
                        strong: (props) => <strong className="text-white font-bold" {...props} />,
                        h3: (props) => <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider mb-1" {...props} />,
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-start space-x-2.5">
                <div className="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400 shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 rounded-tl-none flex items-center space-x-2 text-slate-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                  <span className="text-xs italic">Mentor is analyzing query context...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Action Suggestion Chips */}
          <div className="px-3 py-2 bg-slate-950/60 border-t border-slate-800/80 flex items-center space-x-1.5 overflow-x-auto no-scrollbar">
            {quickChips.map((chip, idx) => (
              <button
                key={idx}
                disabled={isLoading}
                onClick={() => handleSendMessage(chip.query)}
                className="shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 transition whitespace-nowrap disabled:opacity-50"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Input Footer Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-slate-950 border-t border-slate-800/90 flex items-center space-x-2"
          >
            <input
              type="text"
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              placeholder="Ask mentor for a hint or syntax tip..."
              disabled={isLoading}
              className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
            />
            <button
              type="submit"
              disabled={isLoading || !inputMsg.trim()}
              className="p-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AiMentor;
