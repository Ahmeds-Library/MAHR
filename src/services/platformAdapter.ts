// Platform Adapter Layer: Universal Bridge for Native Windows, Linux, PWA & Web Cloud

export type PlatformType = 'win32' | 'linux' | 'darwin' | 'android' | 'ios' | 'web';

export interface PlatformInfo {
  type: PlatformType;
  displayName: string;
  isNativeDesktop: boolean;
  isElectron: boolean;
  isPWA: boolean;
  isWeb: boolean;
  arch?: string;
  supportsWindowControls: boolean;
}

// Global reference for PWA install prompt event
let deferredInstallPrompt: any = null;
const installListeners: Array<(canInstall: boolean) => void> = [];

export function registerBeforeInstallPromptListener() {
  if (typeof window === 'undefined') return;

  window.addEventListener('beforeinstallprompt', (e: Event) => {
    // Prevent standard mini-infobar on mobile/desktop to give custom UI
    e.preventDefault();
    deferredInstallPrompt = e;
    installListeners.forEach((fn) => fn(true));
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    installListeners.forEach((fn) => fn(false));
    console.log('[MAHR PWA] Installed successfully onto Desktop/Home screen');
  });
}

export function onInstallPromptChange(callback: (canInstall: boolean) => void): () => void {
  installListeners.push(callback);
  callback(deferredInstallPrompt !== null);
  return () => {
    const idx = installListeners.indexOf(callback);
    if (idx !== -1) installListeners.splice(idx, 1);
  };
}

export async function promptPWAInstall(): Promise<boolean> {
  if (!deferredInstallPrompt) {
    return false;
  }
  try {
    deferredInstallPrompt.prompt();
    const choiceResult = await deferredInstallPrompt.userChoice;
    if (choiceResult.outcome === 'accepted') {
      deferredInstallPrompt = null;
      installListeners.forEach((fn) => fn(false));
      return true;
    }
    return false;
  } catch (err) {
    console.error('[MAHR PWA] Error prompting installation:', err);
    return false;
  }
}

export function detectPlatform(): PlatformInfo {
  if (typeof window === 'undefined') {
    return {
      type: 'web',
      displayName: 'Web Server',
      isNativeDesktop: false,
      isElectron: false,
      isPWA: false,
      isWeb: true,
      supportsWindowControls: false,
    };
  }

  const electronAPI = (window as any).electronAPI;
  const isElectron = Boolean(electronAPI?.isElectron || navigator.userAgent.includes('Electron'));

  const isPWA = Boolean(
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );

  const ua = navigator.userAgent.toLowerCase();
  let type: PlatformType = 'web';
  let displayName = 'Web Cloud';

  if (isElectron && electronAPI?.platform) {
    type = electronAPI.platform;
    if (type === 'win32') displayName = 'Windows Native Desktop';
    else if (type === 'linux') displayName = 'Linux Native Desktop';
    else if (type === 'darwin') displayName = 'macOS Native Desktop';
  } else if (ua.includes('windows') || ua.includes('win32') || ua.includes('win64')) {
    type = 'win32';
    displayName = isPWA ? 'Windows Desktop App' : 'Windows (Web)';
  } else if (ua.includes('linux') || ua.includes('x11')) {
    type = 'linux';
    displayName = isPWA ? 'Linux Desktop App' : 'Linux (Web)';
  } else if (ua.includes('macintosh') || ua.includes('mac os x')) {
    type = 'darwin';
    displayName = isPWA ? 'macOS App' : 'macOS (Web)';
  } else if (ua.includes('android')) {
    type = 'android';
    displayName = isPWA ? 'Android App' : 'Android Mobile';
  } else if (ua.includes('iphone') || ua.includes('ipad')) {
    type = 'ios';
    displayName = isPWA ? 'iOS App' : 'iOS Mobile';
  }

  const isNativeDesktop = isElectron || (isPWA && (type === 'win32' || type === 'linux' || type === 'darwin'));

  return {
    type,
    displayName,
    isNativeDesktop,
    isElectron,
    isPWA,
    isWeb: !isElectron && !isPWA,
    supportsWindowControls: isElectron || isPWA,
  };
}

export async function minimizeWindow(): Promise<void> {
  const electronAPI = (window as any).electronAPI;
  if (electronAPI?.minimize) {
    electronAPI.minimize();
    return;
  }
  // In PWA or Web, minimization can toggle a compact docked state
  console.log('[Platform] Minimize requested');
}

export async function maximizeOrRestoreWindow(): Promise<void> {
  const electronAPI = (window as any).electronAPI;
  if (electronAPI?.maximize) {
    electronAPI.maximize();
    return;
  }

  // In Web/PWA, toggle fullscreen API
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    } else if (document.exitFullscreen) {
      await document.exitFullscreen();
    }
  } catch (err) {
    console.warn('Fullscreen toggle not permitted:', err);
  }
}

export async function closeWindow(): Promise<void> {
  const electronAPI = (window as any).electronAPI;
  if (electronAPI?.close) {
    electronAPI.close();
    return;
  }

  // For PWA or Web, notify or close window if permitted
  if (window.opener || window.history.length === 1) {
    window.close();
  }
}

export function registerGlobalSummonListener(callback: () => void): () => void {
  const cleanups: Array<() => void> = [];

  // Electron global hotkey listener
  const electronAPI = (window as any).electronAPI;
  if (electronAPI?.onGlobalShortcut) {
    const unsub = electronAPI.onGlobalShortcut(callback);
    cleanups.push(unsub);
  }

  // Web keyboard shortcut fallback: Ctrl+Shift+M or Alt+M
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'm') {
      e.preventDefault();
      callback();
    } else if (e.altKey && e.key.toLowerCase() === 'm') {
      e.preventDefault();
      callback();
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  cleanups.push(() => window.removeEventListener('keydown', handleKeyDown));

  return () => {
    cleanups.forEach((fn) => fn());
  };
}

export function getRemoteWebUrl(): string {
  if (typeof window === 'undefined') return '';
  return window.location.origin;
}
