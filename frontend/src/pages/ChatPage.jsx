import { useState, useEffect } from 'react';
import ConversationList from '../components/ConversationList';
import ChatWindow from '../components/ChatWindow';
import NewConversationModal from '../components/NewConversationModal';
import { getConversations, getConversation } from '../utils/api';

export default function ChatPage() {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const loadConversations = async () => {
    const res = await getConversations();
    setConversations(res.data);
  };

  useEffect(() => { loadConversations(); }, []);

  const handleSelect = async (c) => {
    const res = await getConversation(c.sessionId);
    setActiveConversation(res.data);
  };

  const handleCreate = (conv) => {
    setConversations(prev => [conv, ...prev]);
    setActiveConversation(conv);
  };

  const handleCancel = (sessionId) => {
    setConversations(prev => prev.map(c => c.sessionId === sessionId ? { ...c, status: 'cancelled' } : c));
    if (activeConversation?.sessionId === sessionId) {
      setActiveConversation(prev => ({ ...prev, status: 'cancelled' }));
      setShowModal(true);
    }
  };

  const handleUpdate = () => loadConversations();

  return (
    <div style={styles.container}>
      <ConversationList
        conversations={conversations}
        activeId={activeConversation?.sessionId}
        onSelect={handleSelect}
        onCancel={handleCancel}
        onNew={() => setShowModal(true)}
      />
      <div style={styles.main}>
        {activeConversation ? (
          <ChatWindow
            key={activeConversation.sessionId}
            conversation={activeConversation}
            onUpdate={handleUpdate}
          />
        ) : (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>✦</div>
            <p style={styles.emptyTitle}>No conversation selected</p>
            <p style={styles.emptySub}>Pick one from the list or start fresh</p>
            <button style={styles.newBtn} onClick={() => setShowModal(true)}>+ New Conversation</button>
          </div>
        )}
      </div>
      {showModal && (
        <NewConversationModal onClose={() => setShowModal(false)} onCreate={handleCreate} />
      )}
    </div>
  );
}

const styles = {
  container: { display: 'flex', height: '100vh', background: '#080d14' },
  main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px' },
  emptyIcon: { fontSize: '40px', color: '#6366f1', marginBottom: '8px' },
  emptyTitle: { color: '#475569', fontSize: '16px', fontWeight: 600 },
  emptySub: { color: '#334155', fontSize: '13px' },
  newBtn: {
    marginTop: '8px', padding: '10px 24px', borderRadius: '10px', border: 'none',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: 600,
    boxShadow: '0 4px 12px rgba(99,102,241,0.35)',
  },
};
