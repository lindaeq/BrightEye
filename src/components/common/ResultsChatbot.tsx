import { useState, useEffect, useRef } from 'react';
import { Send, User, RefreshCw, AlertCircle } from 'lucide-react';
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
    <div
      style={{
        padding: '16px',
        textAlign: 'left',
      }}
    >
      {/* Chatbot Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(124, 92, 191, 0.4)',
          paddingBottom: 10,
          marginBottom: 12,
          gap: 10,
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#E9FAE3' }}>Gemini chat</h3>
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--pink)' }}>
            Get a plain-language summary or ask a follow-up question.
          </p>
        </div>

        {messages.length > 0 && <button
          type="button"
          onClick={() => {
            setMessages([]);
            setInputText('');
            setError(null);
          }}
          disabled={isLoading}
          style={{
            background: 'transparent',
            border: '1px solid var(--bezel)',
            color: 'var(--ink)',
            cursor: 'pointer',
            padding: '5px 10px',
            borderRadius: 3,
            fontSize: '0.75rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <RefreshCw size={13} />
          <span>Clear chat</span>
        </button>}
      </div>

      {/* Message Thread */}
      <div
        ref={threadRef}
        role="log"
        aria-label="Report conversation"
        style={{
          maxHeight: '340px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          paddingRight: 6,
          marginBottom: 14,
        }}
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              gap: 10,
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '88%',
            }}
          >
            <div
              style={{
                background:
                  msg.role === 'user'
                    ? 'rgba(124, 92, 191, 0.35)'
                    : 'rgba(3, 1, 44, 0.85)',
                border: msg.role === 'user' ? '1px solid var(--pink)' : '1px solid rgba(0, 229, 255, 0.5)',
                borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '2px 12px 12px 12px',
                padding: '10px 14px',
                color: '#FFFFFF',
                fontSize: '0.88rem',
                lineHeight: 1.55,
                whiteSpace: 'pre-line',
                overflowWrap: 'anywhere',
                minWidth: 0,
                boxShadow: msg.role === 'model' ? '0 0 12px rgba(0, 229, 255, 0.08)' : 'none',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, gap: 12 }}>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: msg.role === 'user' ? 'var(--pink)' : '#00E5FF',
                    textTransform: 'uppercase',
                  }}
                >
                  {msg.role === 'user' ? 'You' : 'Report assistant'}
                </span>
                <span style={{ fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.45)' }}>{msg.timestamp}</span>
              </div>
              {msg.text}
            </div>

            {msg.role === 'user' && (
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'rgba(217, 189, 197, 0.2)',
                  border: '1px solid var(--pink)',
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                  marginTop: 2,
                }}
              >
                <User size={15} color="var(--pink)" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div style={{ display: 'flex', gap: 10, alignSelf: 'flex-start', alignItems: 'center' }}>
            <div
              style={{
                background: 'rgba(3, 1, 44, 0.85)',
                border: '1px solid rgba(0, 229, 255, 0.3)',
                padding: '8px 12px',
                borderRadius: '2px 10px 10px 10px',
                fontSize: '0.82rem',
                color: '#00E5FF',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span>Waiting for Gemini…</span>
            </div>
          </div>
        )}

        {error && (
          <div
            style={{
              padding: '6px 10px',
              borderRadius: 3,
              background: 'rgba(255, 51, 102, 0.2)',
              border: '1px solid #FF3366',
              color: '#FF3366',
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}

      </div>

      {/* Suggested Quick Prompts */}
      <div style={{ marginBottom: 12 }}>
        <p style={{ margin: '0 0 6px 0', fontSize: '0.72rem', color: 'var(--pink)', textTransform: 'uppercase' }}>
          💡 Suggested Questions:
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {QUICK_PROMPTS.map((prompt, i) => (
            <button
              key={i}
              type="button"
              disabled={isLoading}
              onClick={() => handleSendMessage(prompt)}
              style={{
                background: 'rgba(3, 1, 44, 0.7)',
                border: '1px solid rgba(0, 229, 255, 0.4)',
                color: '#E9FAE3',
                fontSize: '0.74rem',
                padding: '4px 8px',
                borderRadius: 3,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 229, 255, 0.2)';
                e.currentTarget.style.borderColor = '#00E5FF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(3, 1, 44, 0.7)';
                e.currentTarget.style.borderColor = 'rgba(0, 229, 255, 0.4)';
              }}
            >
              {prompt}
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
        style={{ display: 'flex', gap: 8, alignItems: 'center' }}
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask about the results…"
          aria-label="Question about the report"
          maxLength={1000}
          disabled={isLoading}
          style={{
            flex: 1,
            minWidth: 0,
            background: 'rgba(3, 1, 44, 0.9)',
            border: '1px solid var(--violet)',
            color: '#FFFFFF',
            padding: '10px 14px',
            fontSize: '0.88rem',
            borderRadius: 3,
            outline: 'none',
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = '#00E5FF')}
          onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--violet)')}
        />
        <button
          type="submit"
          disabled={isLoading || !inputText.trim()}
          className="arcade-btn"
          style={{
            minHeight: '40px',
            padding: '8px 16px',
            fontSize: '1rem',
            background: inputText.trim() ? '#00E5FF' : 'var(--btn)',
            color: inputText.trim() ? '#03012C' : 'var(--btnink)',
            borderColor: '#00E5FF',
            cursor: inputText.trim() && !isLoading ? 'pointer' : 'not-allowed',
            opacity: inputText.trim() && !isLoading ? 1 : 0.6,
          }}
        >
          <Send size={15} />
          <span>Ask</span>
        </button>
      </form>

      {/* Footnote */}
      <p style={{ margin: '8px 0 0 0', fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.4)', textAlign: 'center' }}>
        Sending a question shares the report scores and chat text with Google Gemini. Avoid including personal details. Answers are for understanding the game results.
      </p>
    </div>
  );
}
