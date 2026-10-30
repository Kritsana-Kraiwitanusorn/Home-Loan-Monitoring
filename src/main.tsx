import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Handle background Firebase Auth rejections gracefully (e.g. token refresh, popup cancellation)
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  if (
    reason?.name === 'FirebaseError' &&
    (reason?.code?.startsWith?.('auth/') || String(reason?.message).includes('auth/'))
  ) {
    event.preventDefault();
    console.warn('Handled background Firebase Auth rejection:', reason?.code || reason?.message);
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

