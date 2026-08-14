import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
