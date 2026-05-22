import { useState, useEffect, useRef } from 'react';
import { useStream } from '../hooks/useStream';

export default function ChatWindow({ conversation, onUpdate }) {
  const [messages, setMessages] = useState(conversation?.messages?.filter(m => m.role !== 'system') || []);
  const [input, setInput] = useState('');
  const [streamingMsg, setStreamingMsg] = useState('');
  const [error, setError] = useState('');
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const { streaming, sendMessage, cancel } = useStream();

  useEffect(() => {
    setMessages(conversation?.messages?.filter(m => m.role !== 'system') || []);
  }, [conversation?.sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMsg]);

  const handleSend = async () => {
    if (!input.trim() || streaming || conversation?.status === 'cancelled') return;
    const userContent = input.trim();
    setInput('');
    setError('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setMessages(prev => [...prev, { role: 'user', content: userContent }]);
    setStreamingMsg('');

    await sendMessage(
      conversation.sessionId,
      userContent,
      (delta) => setStreamingMsg(prev => prev + delta),
      (full) => {
        setMessages(prev => [...prev, { role: 'assistant', content: full }]);
        setStreamingMsg('');
        onUpdate?.();
      },
      (err) => setError(err)
    );
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleInput = (e) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
  };

  const isCancelled = conversation?.status === 'cancelled';
  const modelLabel = `${conversation?.provider} / ${conversation?.model}`;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerInfo}>
          <div style={styles.modelBadge}>{conversation?.provider}</div>
          <span style={styles.modelName}>{conversation?.model}</span>
        </div>
        {isCancelled && <span style={styles.cancelledTag}>✕ Cancelled</span>}
      </div>

      {/* Messages */}
      <div style={styles.messages}>
        {messages.length === 0 && !streaming && (
          <div style={styles.emptyChat}>
            <div style={styles.emptyChatIcon}>✦</div>
            <p style={styles.emptyChatTitle}>How can I help you today?</p>
            <p style={styles.emptyChatSub}>Using {modelLabel}</p>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className="fade-in" style={{ ...styles.msgRow, ...(m.role === 'user' ? styles.userRow : styles.assistantRow) }}>
            <div style={{ ...styles.avatar, ...(m.role === 'user' ? styles.userAvatar : styles.aiAvatar) }}>
              {m.role === 'user' ? 'U' : '✦'}
            </div>
            <div style={{ ...styles.bubble, ...(m.role === 'user' ? styles.userBubble : styles.aiBubble) }}>
              <p style={styles.msgContent}>{m.content}</p>
            </div>
          </div>
        ))}

        {streamingMsg && (
          <div className="fade-in" style={{ ...styles.msgRow, ...styles.assistantRow }}>
            <div style={{ ...styles.avatar, ...styles.aiAvatar }}>✦</div>
            <div style={{ ...styles.bubble, ...styles.aiBubble }}>
              <p style={styles.msgContent}>
                {streamingMsg}
                <span style={styles.cursor}>▋</span>
              </p>
            </div>
          </div>
        )}

        {streaming && !streamingMsg && (
          <div style={{ ...styles.msgRow, ...styles.assistantRow }}>
            <div style={{ ...styles.avatar, ...styles.aiAvatar }}>✦</div>
            <div style={{ ...styles.bubble, ...styles.aiBubble, ...styles.thinkingBubble }}>
              <span style={styles.dot} />
              <span style={{ ...styles.dot, animationDelay: '0.2s' }} />
              <span style={{ ...styles.dot, animationDelay: '0.4s' }} />
            </div>
          </div>
        )}

        {error && (
          <div style={styles.errorBanner}>
            <span>⚠</span> {error}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {isCancelled ? (
        <div style={styles.cancelledBanner}>This conversation has been cancelled</div>
      ) : (
        <div style={styles.inputArea}>
          <div style={styles.inputBox}>
            <textarea
              ref={textareaRef}
              style={styles.textarea}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Message..."
              disabled={streaming}
              rows={1}
            />
            <div style={styles.inputActions}>
              <span style={styles.hint}>⏎ send · ⇧⏎ newline</span>
              {streaming ? (
                <button style={styles.stopBtn} onClick={cancel}>
                  ⏹ Stop
                </button>
              ) : (
                <button
                  style={{ ...styles.sendBtn, ...(input.trim() ? {} : styles.sendBtnDisabled) }}
                  onClick={handleSend}
                  disabled={!input.trim()}
                >
                  Send ↑
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', height: '100%', background: '#080d14' },

  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)',
    background: 'rgba(12,18,32,0.8)', backdropFilter: 'blur(8px)', flexShrink: 0,
  },
  headerInfo: { display: 'flex', alignItems: 'center', gap: '10px' },
  modelBadge: {
    padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600,
    background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.2)',
  },
  modelName: { color: '#64748b', fontSize: '12px' },
  cancelledTag: { fontSize: '12px', color: '#f87171', background: 'rgba(248,113,113,0.1)', padding: '3px 10px', borderRadius: '6px' },

  messages: {
    flex: 1, overflowY: 'auto', padding: '24px',
    display: 'flex', flexDirection: 'column', gap: '20px',
  },

  emptyChat: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '12px', marginTop: '80px' },
  emptyChatIcon: { fontSize: '36px', color: '#6366f1', marginBottom: '4px' },
  emptyChatTitle: { color: '#94a3b8', fontSize: '18px', fontWeight: 600 },
  emptyChatSub: { color: '#334155', fontSize: '13px' },

  msgRow: { display: 'flex', gap: '12px', alignItems: 'flex-start', maxWidth: '820px' },
  userRow: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  assistantRow: { alignSelf: 'flex-start' },

  avatar: {
    width: '32px', height: '32px', borderRadius: '10px', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '13px', fontWeight: 700,
  },
  userAvatar: { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff' },
  aiAvatar: { background: 'linear-gradient(135deg, #0f172a, #1e293b)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.3)' },

  bubble: { padding: '12px 16px', borderRadius: '14px', maxWidth: '680px' },
  userBubble: {
    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
    color: '#fff', borderBottomRightRadius: '4px',
    boxShadow: '0 4px 16px rgba(79,70,229,0.25)',
  },
  aiBubble: {
    background: '#0f1929', color: '#cbd5e1',
    border: '1px solid rgba(255,255,255,0.07)', borderBottomLeftRadius: '4px',
  },
  thinkingBubble: { display: 'flex', gap: '5px', alignItems: 'center', padding: '14px 18px' },
  msgContent: { margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.65, fontSize: '14px' },
  cursor: { display: 'inline-block', animation: 'blink 0.8s step-end infinite', color: '#6366f1' },

  dot: {
    display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%',
    background: '#475569', animation: 'pulse 1.2s ease infinite',
  },

  errorBanner: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '10px 16px', borderRadius: '10px',
    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
    color: '#fca5a5', fontSize: '13px',
  },

  inputArea: {
    padding: '16px 24px 20px', borderTop: '1px solid rgba(255,255,255,0.06)',
    background: 'rgba(8,13,20,0.9)', backdropFilter: 'blur(8px)',
  },
  inputBox: {
    background: '#0f1929', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '14px', overflow: 'hidden',
    boxShadow: '0 0 0 1px rgba(99,102,241,0.0)',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  textarea: {
    width: '100%', padding: '14px 16px 8px', background: 'transparent',
    border: 'none', outline: 'none', color: '#e2e8f0', fontSize: '14px',
    resize: 'none', lineHeight: 1.6, maxHeight: '160px', overflowY: 'auto',
  },
  inputActions: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '6px 12px 10px',
  },
  hint: { fontSize: '11px', color: '#334155' },
  sendBtn: {
    padding: '7px 18px', borderRadius: '8px', border: 'none',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
    boxShadow: '0 2px 8px rgba(99,102,241,0.3)', transition: 'filter 0.15s',
  },
  sendBtnDisabled: { opacity: 0.4, cursor: 'not-allowed', boxShadow: 'none' },
  stopBtn: {
    padding: '7px 18px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.3)',
    background: 'rgba(239,68,68,0.1)', color: '#fca5a5',
    cursor: 'pointer', fontSize: '13px', fontWeight: 600,
  },
  cancelledBanner: {
    textAlign: 'center', padding: '16px', color: '#475569', fontSize: '13px',
    borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(8,13,20,0.9)',
  },
};
