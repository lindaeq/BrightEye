import { useState, useEffect, useRef } from 'react';
import { Send, User, RefreshCw, AlertCircle, Sparkles, Bot } from 'lucide-react';
import type { summarizeRun } from '../../utils/runTelemetry';

interface ResultsChatbotProps {
  m1Hits: number;
  starsCaught: number;
  stats: ReturnType<typeof summarizeRun> | null;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

const QUICK_PROMPTS = [
  'Summarize this report',
  'What does eye-to-hand latency mean?',
  'What do the steering results show?',
];

export function ResultsChatbot({ m1Hits, starsCaught, stats }: ResultsChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<AbortController | null>(null);

  useEffect(() => () => requestRef.current?.abort(), []);

  useEffect(() => {
    const thread = threadRef.current;
    if (thread) thread.scrollTop = thread.scrollHeight;
  }, [messages, isLoading, error]);

  async function handleSendMessage(textToSend = inputText) {
    const question = textToSend.trim();
    if (!question || requestRef.current) return;

    const controller = new AbortController();
    requestRef.current = controller;
    const timestamp = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMessage: ChatMessage = { id: String(messages.length), role: 'user', text: question, timestamp: timestamp() };
    setMessages([...messages, userMessage]);
    setInputText('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/report-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          report: {
            targetsHit: m1Hits,
            flashToClickMs: stats?.median != null ? Math.round(stats.median) : null,
            visualFocusPercent: stats?.visualFocusPct ?? null,
            starsCaught,
            wrongCornerClicks: stats?.decoys ?? null,
            flashToGazeMs: stats?.gazeLatencyMedian != null ? Math.round(stats.gazeLatencyMedian) : null,
            eyeToHandMs: stats?.eyeToHandMedian != null ? Math.round(stats.eyeToHandMedian) : null,
            offTrailPercent: stats?.trailDeviation != null ? Number(stats.trailDeviation.toFixed(1)) : null,
            joystickJitterPercent: stats?.joystickJitter != null ? Number(stats.joystickJitter.toFixed(1)) : null,
            gazeLeadPercent: stats?.eyeHandLead != null ? Number(stats.eyeHandLead.toFixed(1)) : null,
          },
          history: messages.slice(-6).map(({ role, text }) => ({ role, text })),
          question,
        }),
      });
      if (!response.ok) {
        throw new Error(response.status === 429
          ? 'Gemini is busy. Try again in a moment.'
          : 'The report assistant is unavailable. Try again in a moment.');
      }
      const { answer } = await response.json();
      if (typeof answer !== 'string' || !answer.trim()) throw new Error('Gemini returned an empty answer. Try again.');
      setMessages([...messages, userMessage, {
        id: String(messages.length + 1), role: 'model', text: answer, timestamp: timestamp(),
      }]);
    } catch (error) {
      if (controller.signal.aborted) return;
      setMessages(messages);
      setInputText(question);
      setError(error instanceof Error && !/fetch|JSON/i.test(error.message)
        ? error.message
        : 'Could not reach the report assistant. Try again.');
    } finally {
      requestRef.current = null;
      if (!controller.signal.aborted) setIsLoading(false);
    }
  }

  return (
    <div className="operator-chat-widget">
      {/* Header */}
      <div className="chat-widget-header">
        <div>
          <span className="gemini-badge"><Sparkles size={12} aria-hidden="true" /> Gemini</span>
          <h3 className="chat-widget-title">Run chat</h3>
        </div>

        {messages.length > 0 && (
          <button
            type="button"
            className="chat-clear-btn"
            onClick={() => {
              setMessages([]);
              setInputText('');
              setError(null);
            }}
            disabled={isLoading}
            title="Reset conversation"
          >
            <RefreshCw size={11} />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Message Thread */}
      <div
        ref={threadRef}
        role="log"
        aria-label="Report conversation"
        className="chat-thread"
      >
        {messages.length === 0 && (
          <div className="chat-empty-intro">
            <p>Ask anything about this run’s visual latency, motor jitter, or impulse accuracy.</p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              gap: 8,
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '92%',
            }}
          >
            {msg.role === 'model' && (
              <div className="chat-avatar model">
                <Bot size={13} />
              </div>
            )}

            <div className={msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-model'}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, gap: 10 }}>
                <span className="chat-author-tag">
                  {msg.role === 'user' ? 'You' : 'Gemini Assistant'}
                </span>
                <span className="chat-time-tag">{msg.timestamp}</span>
              </div>
              <div className="chat-msg-body">{msg.text}</div>
            </div>

            {msg.role === 'user' && (
              <div className="chat-avatar user">
                <User size={13} />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div style={{ display: 'flex', gap: 8, alignSelf: 'flex-start', alignItems: 'center' }}>
            <div className="chat-avatar model">
              <Bot size={13} />
            </div>
            <div className="chat-loading-bubble">
              <Sparkles size={13} className="spin-slow" />
              <span>Analyzing with Gemini…</span>
            </div>
          </div>
        )}

        {error && (
          <div className="chat-error-banner" role="alert">
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Suggested Quick Prompts */}
      <div className="chat-prompts-area">
        <p className="chat-prompts-label">Suggested Questions</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {QUICK_PROMPTS.map((prompt, i) => (
            <button
              key={i}
              type="button"
              className="chat-prompt-pill"
              disabled={isLoading}
              onClick={() => handleSendMessage(prompt)}
            >
              ✦ {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="chat-input-row"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask about this run…"
          aria-label="Question about the report"
          maxLength={1000}
          disabled={isLoading}
          className="chat-text-input"
        />
        <button
          type="submit"
          disabled={isLoading || !inputText.trim()}
          className="chat-ask-button"
        >
          <Send size={13} />
          <span>Ask</span>
        </button>
      </form>

      {/* Footnote */}
      <p className="chat-footnote">
        Scores are shared with Google Gemini. Does not provide clinical diagnosis.
      </p>
    </div>
  );
}
