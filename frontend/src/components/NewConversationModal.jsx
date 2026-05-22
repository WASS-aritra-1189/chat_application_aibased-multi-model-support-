import { useState, useEffect } from 'react';
import { createConversation, getProviders } from '../utils/api';

const DEFAULT_MODELS = {
  groq: 'llama-3.3-70b-versatile',
  openrouter: 'deepseek/deepseek-v4-flash:free',
};

const PROVIDER_COLORS = {
  groq: '#f59e0b',
  openrouter: '#8b5cf6',
};

export default function NewConversationModal({ onClose, onCreate }) {
  const [providers, setProviders] = useState({});
  const [provider, setProvider] = useState('groq');
  const [model, setModel] = useState(DEFAULT_MODELS.groq);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getProviders().then(r => {
      setProviders(r.data);
    }).catch(() => {});
  }, []);

  const handleProviderChange = (p) => {
    setProvider(p);
    setModel(providers[p]?.[0] || DEFAULT_MODELS[p]);
  };

  const handleCreate = async () => {
    setLoading(true);
    try {
      const res = await createConversation({ provider, model });
      onCreate(res.data);
      onClose();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const providerList = Object.keys(providers).length > 0 ? Object.keys(providers) : ['groq', 'openrouter'];

  return (
    <div style={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={styles.modal} className="fade-in">
        <div style={styles.modalHeader}>
          <div style={styles.modalIcon}>✦</div>
          <div>
            <h3 style={styles.title}>New Conversation</h3>
            <p style={styles.subtitle}>Choose a provider and model</p>
          </div>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Provider</label>
          <div style={styles.providerGrid}>
            {providerList.map(p => (
              <button
                key={p}
                style={{ ...styles.providerBtn, ...(provider === p ? styles.providerBtnActive : {}) }}
                onClick={() => handleProviderChange(p)}
              >
                <div style={{ ...styles.providerDot, background: PROVIDER_COLORS[p] || '#6366f1' }} />
                {p}
              </button>
            ))}
          </div>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Model</label>
          <select style={styles.select} value={model} onChange={e => setModel(e.target.value)}>
            {(providers[provider] || [DEFAULT_MODELS[provider]]).map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <div style={styles.actions}>
          <button style={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button style={styles.createBtn} onClick={handleCreate} disabled={loading}>
            {loading ? (
              <span style={{ opacity: 0.7 }}>Creating...</span>
            ) : (
              <><span>Start Chat</span> <span>→</span></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
    backdropFilter: 'blur(4px)',
  },
  modal: {
    background: '#0c1220', borderRadius: '16px', padding: '28px',
    width: '400px', display: 'flex', flexDirection: 'column', gap: '20px',
    border: '1px solid rgba(255,255,255,0.08)',
    boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
  },
  modalHeader: { display: 'flex', alignItems: 'center', gap: '14px' },
  modalIcon: {
    width: '40px', height: '40px', borderRadius: '12px',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '18px', color: '#fff', flexShrink: 0,
    boxShadow: '0 0 16px rgba(99,102,241,0.4)',
  },
  title: { color: '#f1f5f9', fontSize: '17px', fontWeight: 700 },
  subtitle: { color: '#475569', fontSize: '12px', marginTop: '2px' },
  field: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { color: '#64748b', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' },
  providerGrid: { display: 'flex', gap: '8px' },
  providerBtn: {
    flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.03)', color: '#64748b', cursor: 'pointer',
    fontSize: '13px', fontWeight: 500, display: 'flex', alignItems: 'center',
    justifyContent: 'center', gap: '7px', transition: 'all 0.15s',
  },
  providerBtnActive: {
    background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)',
    color: '#a5b4fc',
  },
  providerDot: { width: '8px', height: '8px', borderRadius: '50%' },
  select: {
    padding: '11px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)',
    background: '#080d14', color: '#e2e8f0', fontSize: '13px', outline: 'none',
    cursor: 'pointer',
  },
  actions: { display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' },
  cancelBtn: {
    padding: '9px 18px', borderRadius: '9px', border: '1px solid rgba(255,255,255,0.08)',
    background: 'none', color: '#64748b', cursor: 'pointer', fontSize: '13px', fontWeight: 500,
  },
  createBtn: {
    padding: '9px 22px', borderRadius: '9px', border: 'none',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
    display: 'flex', alignItems: 'center', gap: '6px',
    boxShadow: '0 4px 12px rgba(99,102,241,0.35)',
  },
};
