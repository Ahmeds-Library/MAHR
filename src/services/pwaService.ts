// Service Worker & PWA Initialization Service
import { registerBeforeInstallPromptListener } from './platformAdapter';

export function initializePWA() {
  if (typeof window === 'undefined') return;

  // Register beforeinstallprompt hook
  registerBeforeInstallPromptListener();

  // Register Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[MAHR PWA] Service Worker registered successfully with scope:', reg.scope);

          reg.onupdatefound = () => {
            const installingWorker = reg.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    console.log('[MAHR PWA] New content available; please refresh.');
                  } else {
                    console.log('[MAHR PWA] Content cached for offline use.');
                  }
                }
              };
            }
          };
        })
        .catch((err) => {
          console.warn('[MAHR PWA] Service Worker registration failed:', err);
        });
    });
  }
}
