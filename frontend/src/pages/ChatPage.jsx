import { useState, useEffect } from 'react';
import ConversationList from '../components/ConversationList';
import ChatWindow from '../components/ChatWindow';
import NewConversationModal from '../components/NewConversationModal';
import { getConversations, getConversation } from '../utils/api';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

export default function ChatPage() {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const isMobile = useIsMobile();

  const loadConversations = async () => {
    const res = await getConversations();
    setConversations(res.data);
  };

  useEffect(() => { loadConversations(); }, []);

  const handleSelect = async (c) => {
    const res = await getConversation(c.sessionId);
    setActiveConversation(res.data);
    if (isMobile) setShowSidebar(false);
  };

  const handleCreate = (conv) => {
    setConversations(prev => [conv, ...prev]);
    setActiveConversation(conv);
    if (isMobile) setShowSidebar(false);
  };

  const handleCancel = (sessionId) => {
    setConversations(prev => prev.map(c => c.sessionId === sessionId ? { ...c, status: 'cancelled' } : c));
    if (activeConversation?.sessionId === sessionId) {
      setActiveConversation(prev => ({ ...prev, status: 'cancelled' }));
    }
  };

  const handleUpdate = () => loadConversations();

  return (
    <div style={styles.container}>
      {/* Sidebar overlay (mobile) */}
      {isMobile && showSidebar && (
        <div style={styles.sidebarOverlay} onClick={() => setShowSidebar(false)} />
      )}

      {/* Sidebar */}
      <div style={{
        ...styles.sidebar,
        ...(isMobile ? {
          ...styles.sidebarMobile,
          transform: showSidebar ? 'translateX(0)' : 'translateX(-100%)',
        } : {}),
      }}>
        <ConversationList
          conversations={conversations}
          activeId={activeConversation?.sessionId}
          onSelect={handleSelect}
          onCancel={handleCancel}
          onNew={() => { setShowSidebar(false); setShowModal(true); }}
          onClose={isMobile ? () => setShowSidebar(false) : null}
        />
      </div>

      {/* Main content */}
      <div style={styles.main}>
        {/* Mobile top bar */}
        {isMobile && (
          <div style={styles.mobileBar}>
            <button style={styles.menuBtn} onClick={() => setShowSidebar(true)}>☰</button>
            <span style={styles.mobileTitle}>
              {activeConversation ? (activeConversation.title || 'Chat') : 'LLM Studio'}
            </span>
            <button style={styles.mobileNewBtn} onClick={() => setShowModal(true)}>+</button>
          </div>
        )}

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
  container: { display: 'flex', height: '100%', background: '#080d14', position: 'relative', overflow: 'hidden' },
  sidebar: { flexShrink: 0 },
  sidebarMobile: {
    position: 'fixed', top: 0, left: 0, height: '100%', zIndex: 50,
    boxShadow: '4px 0 24px rgba(0,0,0,0.5)',
    transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
  },
  sidebarOverlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
    zIndex: 49, backdropFilter: 'blur(2px)',
  },
  main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 },
  mobileBar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 16px', height: '52px', flexShrink: 0,
    background: 'rgba(12,18,32,0.95)', borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  menuBtn: {
    background: 'none', border: 'none', color: '#94a3b8',
    fontSize: '20px', cursor: 'pointer', padding: '4px 8px',
  },
  mobileTitle: { color: '#f1f5f9', fontSize: '14px', fontWeight: 600, flex: 1, textAlign: 'center' },
  mobileNewBtn: {
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none',
    color: '#fff', width: '32px', height: '32px', borderRadius: '8px',
    fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px', padding: '24px' },
  emptyIcon: { fontSize: '40px', color: '#6366f1', marginBottom: '8px' },
  emptyTitle: { color: '#475569', fontSize: '16px', fontWeight: 600, textAlign: 'center' },
  emptySub: { color: '#334155', fontSize: '13px', textAlign: 'center' },
  newBtn: {
    marginTop: '8px', padding: '10px 24px', borderRadius: '10px', border: 'none',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: 600,
    boxShadow: '0 4px 12px rgba(99,102,241,0.35)',
  },
};
