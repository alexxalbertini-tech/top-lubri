import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Fail-safe for problematic libraries trying to overwrite window.fetch
try {
  const originalFetch = window.fetch;
  Object.defineProperty(window, 'fetch', {
    configurable: false,
    enumerable: true,
    get: () => originalFetch,
    set: () => {
      console.warn('Attempt to overwrite window.fetch blocked to prevent TypeError.');
    }
  });
} catch (e) {
  // If defineProperty fails (e.g. already locked), ignore it
}

const init = () => {
  const container = document.getElementById('root');
  if (container) {
    createRoot(container).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
