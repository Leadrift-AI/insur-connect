import * as Sentry from '@sentry/react';
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [
    Sentry.browserTracingIntegration(), // performance tracing
    Sentry.replayIntegration(),         // session replay
  ],
  tracesSampleRate: 0.2,          // adjust later
  replaysSessionSampleRate: 0.1,  // optional
  replaysOnErrorSampleRate: 1.0,  // optional
});

const container = document.getElementById('root');
if (!container) throw new Error('Root element not found');

const root = createRoot(container);
root.render(
  <Sentry.ErrorBoundary fallback={<div>Something went wrong</div>}>
    <App />
  </Sentry.ErrorBoundary>
);
