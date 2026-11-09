import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initializePWA } from '@/services/pwaService';
import { AppErrorBoundary } from '@/components/AppErrorBoundary';

// Initialize Progressive Web App & Desktop Service Worker
initializePWA();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>,
);


