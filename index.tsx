
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Service worker: permite instalar o app na tela inicial e abri-lo offline.
// Só em produção, para não atrapalhar o hot reload do Vite.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Caminho relativo para funcionar também quando publicado em subpasta.
    navigator.serviceWorker.register('./sw.js').catch((erro) => {
      console.warn('Service worker não registrado:', erro);
    });
  });
}
