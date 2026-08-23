import { StrictMode, Component, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: string }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: '' };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'sans-serif', color: '#334155', gap: '16px', padding: '24px' }}>
          <p style={{ fontSize: '18px', fontWeight: 600, textAlign: 'center' }}>Algo deu errado ao carregar o aplicativo.</p>
          <p style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', maxWidth: '400px' }}>{this.state.error}</p>
          <button
            onClick={() => window.location.reload()}
            style={{ padding: '8px 24px', background: '#0284c7', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}
          >
            Recarregar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Registro do Service Worker para PWA Offline & Carregamento Rápido
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('[Ppueri PWA] Service Worker registrado com sucesso:', registration.scope);
      })
      .catch((err) => {
        console.warn('[Ppueri PWA] Falha ao registrar Service Worker:', err);
      });
  });
}

const rootEl = document.getElementById('root')!;

// React 19 attempts to reconcile pre-existing child nodes in the container
// instead of replacing them, which triggers hydration error #418 when any
// external script (Vercel Toolbar, browser extension, etc.) has injected nodes.
// Clearing the container before mount ensures a clean CSR render every time.
rootEl.textContent = '';

createRoot(rootEl).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
