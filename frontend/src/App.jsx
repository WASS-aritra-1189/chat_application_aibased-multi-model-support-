import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import ChatPage from './pages/ChatPage';
import DashboardPage from './pages/DashboardPage';

export default function App() {
  return (
    <BrowserRouter>
      <div style={styles.app}>
        <nav style={styles.nav}>
          <div style={styles.brand}>
            <div style={styles.brandIcon}>✦</div>
            <span style={styles.brandText}>LLM Studio</span>
          </div>
          <div style={styles.links}>
            <NavLink to="/" style={({ isActive }) => ({ ...styles.link, ...(isActive ? styles.activeLink : {}) })}>
              Chat
            </NavLink>
            <NavLink to="/dashboard" style={({ isActive }) => ({ ...styles.link, ...(isActive ? styles.activeLink : {}) })}>
              Dashboard
            </NavLink>
          </div>
          <div style={styles.navRight}>
            <div style={styles.statusDot} title="Connected" />
            <span style={styles.statusText}>Live</span>
          </div>
        </nav>
        <div style={styles.content}>
          <Routes>
            <Route path="/" element={<ChatPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

const styles = {
  app: { display: 'flex', flexDirection: 'column', height: '100vh', background: '#080d14' },
  nav: {
    display: 'flex', alignItems: 'center', padding: '0 16px', height: '56px',
    background: 'rgba(8,13,20,0.95)', borderBottom: '1px solid rgba(255,255,255,0.06)',
    backdropFilter: 'blur(12px)', flexShrink: 0, gap: '16px',
    boxShadow: '0 1px 0 rgba(255,255,255,0.04)',
  },
  brand: { display: 'flex', alignItems: 'center', gap: '10px', marginRight: 'auto' },
  brandIcon: {
    width: '30px', height: '30px', borderRadius: '8px',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '14px', color: '#fff', fontWeight: 700,
    boxShadow: '0 0 12px rgba(99,102,241,0.4)',
  },
  brandText: { color: '#f1f5f9', fontWeight: 700, fontSize: '15px', letterSpacing: '-0.3px' },
  links: { display: 'flex', gap: '4px' },
  link: {
    color: '#64748b', textDecoration: 'none', padding: '6px 14px', borderRadius: '8px',
    fontSize: '13px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px',
    transition: 'all 0.15s',
  },
  activeLink: { background: 'rgba(99,102,241,0.12)', color: '#a5b4fc' },
  navRight: { display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' },
  statusDot: {
    width: '7px', height: '7px', borderRadius: '50%', background: '#22c55e',
    boxShadow: '0 0 6px #22c55e', animation: 'pulse 2s ease infinite',
  },
  statusText: { fontSize: '12px', color: '#4ade80', fontWeight: 500 },
  content: { flex: 1, overflow: 'hidden' },
};
