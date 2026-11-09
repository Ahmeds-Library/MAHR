// Service Worker & PWA Initialization Service
import { registerBeforeInstallPromptListener } from './platformAdapter';

export function initializePWA() {
  if (typeof window === 'undefined') return;

  // In development environments, unregister service workers and purge stale caches to ensure updates load live
  const isDev = import.meta.env.DEV || 
    window.location.hostname === 'localhost' || 
    window.location.hostname.includes('ais-dev-') ||
    window.location.hostname.includes('127.0.0.1');

  if (isDev) {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const reg of registrations) {
          reg.unregister();
        }
      });
    }
    if ('caches' in window) {
      caches.keys().then((names) => {
        for (const name of names) {
          caches.delete(name);
        }
      });
    }
    return;
  }

  // Register beforeinstallprompt hook
  registerBeforeInstallPromptListener();

  // Register Service Worker in production
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
