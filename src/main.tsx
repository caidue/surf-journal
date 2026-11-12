import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initDb } from './db';
import { pruneCache } from './lib/openMeteo';
import { initPwa } from './lib/pwa';
import './styles.css';

initDb()
  .then(() => pruneCache())
  .catch((e) => console.error('DB init failed', e))
  .finally(() => {
    initPwa(); // service worker, install prompt, online/offline, fills in sessions logged offline
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
  });
