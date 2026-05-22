import { cancelConversation } from '../utils/api';

export default function ConversationList({ conversations, activeId, onSelect, onCancel, onNew, onClose }) {
  const handleCancel = async (e, sessionId) => {
    e.stopPropagation();
    await cancelConversation(sessionId);
    onCancel(sessionId);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <p style={styles.headerLabel}>Conversations</p>
          <p style={styles.headerCount}>{conversations.length} total</p>
        </div>
        {onClose && (
          <button style={styles.closeBtn} onClick={onClose} title="Close sidebar">✕</button>
        )}
      </div>

      <div style={styles.newBtnWrap}>
        <button style={styles.newBtnFull} onClick={onNew}>
          <span style={{ fontSize: '18px', lineHeight: 1 }}>+</span> New Conversation
        </button>
      </div>

      <div style={styles.list}>
        {conversations.length === 0 && (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>💬</div>
            <p style={styles.emptyTitle}>No conversations</p>
            <p style={styles.emptyHint}>Click "+ New" to start</p>
          </div>
        )}
        {conversations.map(c => {
          const isActive = c.sessionId === activeId;
          const isCancelled = c.status === 'cancelled';
          return (
            <div
              key={c.sessionId}
              className={!isActive ? 'hover-bg' : ''}
              style={{ ...styles.item, ...(isActive ? styles.activeItem : {}) }}
              onClick={() => onSelect(c)}
            >
              <div style={styles.itemLeft}>
                <div style={{ ...styles.providerDot, background: PROVIDER_COLORS[c.provider] || '#6366f1' }} />
              </div>
              <div style={styles.itemBody}>
                <div style={styles.itemTop}>
                  <span style={{ ...styles.itemTitle, ...(isCancelled ? { color: '#475569' } : {}) }}>
                    {c.title || 'New Conversation'}
                  </span>
                  {!isCancelled && (
                    <button
                      style={styles.cancelBtn}
                      onClick={e => handleCancel(e, c.sessionId)}
                      title="Cancel conversation"
                    >✕</button>
                  )}
                </div>
                <div style={styles.itemMeta}>
                  <span style={styles.badge}>{c.provider}</span>
                  <span style={{ ...styles.statusPill, ...(isCancelled ? styles.cancelledPill : styles.activePill) }}>
                    {isCancelled ? '✕ cancelled' : '● active'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const PROVIDER_COLORS = {
  groq: '#f59e0b',
  openrouter: '#8b5cf6',
  openai: '#10b981',
  google: '#3b82f6',
};

const styles = {
  container: {
    width: '272px', minWidth: '272px', background: '#0c1220',
    borderRight: '1px solid rgba(255,255,255,0.06)',
    display: 'flex', flexDirection: 'column', height: '100%',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '20px 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  closeBtn: {
    background: 'none', border: 'none', color: '#64748b', cursor: 'pointer',
    fontSize: '16px', padding: '4px 8px', borderRadius: '6px',
    lineHeight: 1, transition: 'color 0.15s',
  },
  headerLabel: { color: '#f1f5f9', fontWeight: 600, fontSize: '14px' },
  headerCount: { color: '#475569', fontSize: '11px', marginTop: '2px' },
  newBtnWrap: { padding: '10px 12px 4px' },
  newBtnFull: {
    width: '100%', padding: '10px', borderRadius: '10px', border: 'none',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    boxShadow: '0 2px 10px rgba(99,102,241,0.3)', transition: 'filter 0.15s',
  },
  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 16px', gap: '8px' },
  emptyIcon: { fontSize: '32px', marginBottom: '4px' },
  emptyTitle: { color: '#475569', fontSize: '13px', fontWeight: 500 },
  emptyHint: { color: '#334155', fontSize: '12px' },
  list: { flex: 1, overflowY: 'auto', padding: '8px' },
  item: {
    display: 'flex', gap: '10px', padding: '10px 10px', borderRadius: '10px',
    cursor: 'pointer', marginBottom: '2px', transition: 'background 0.15s', alignItems: 'flex-start',
  },
  activeItem: { background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' },
  itemLeft: { paddingTop: '4px' },
  providerDot: { width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0 },
  itemBody: { flex: 1, minWidth: 0 },
  itemTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '4px' },
  itemTitle: {
    color: '#cbd5e1', fontSize: '13px', fontWeight: 500,
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
  },
  cancelBtn: {
    background: 'none', border: 'none', color: '#334155', cursor: 'pointer',
    fontSize: '11px', padding: '1px 3px', borderRadius: '4px', flexShrink: 0,
    transition: 'color 0.15s',
  },
  itemMeta: { display: 'flex', gap: '6px', marginTop: '5px', alignItems: 'center' },
  badge: {
    fontSize: '10px', background: 'rgba(255,255,255,0.06)', color: '#64748b',
    padding: '2px 7px', borderRadius: '4px', fontWeight: 500,
  },
  statusPill: { fontSize: '10px', fontWeight: 500 },
  activePill: { color: '#4ade80' },
  cancelledPill: { color: '#475569' },
};
