import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const style = document.createElement('style');
style.textContent = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: #080d14;
    color: #e2e8f0;
    -webkit-font-smoothing: antialiased;
  }

  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
  @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: #334155; }

  button { font-family: inherit; }
  input, textarea, select { font-family: inherit; }

  .fade-in { animation: fadeIn 0.2s ease forwards; }

  .hover-bg:hover { background: rgba(255,255,255,0.04) !important; }
  .hover-bright:hover { filter: brightness(1.1); }

  @media (max-width: 768px) {
    .mobile-hide { display: none !important; }
    .mobile-full { width: 100% !important; min-width: unset !important; }
    .mobile-row { flex-direction: row !important; }
    .mobile-col { flex-direction: column !important; }
  }
`;
document.head.appendChild(style);

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
