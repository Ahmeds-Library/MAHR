// MAHR Electron Preload Bridge - Context Isolation
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform, // 'win32' | 'linux' | 'darwin'
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  isMaximized: () => ipcRenderer.invoke('is-maximized'),
  getPlatformInfo: () => ipcRenderer.invoke('get-platform-info'),
  sendNotification: (title, body) => ipcRenderer.send('send-notification', { title, body }),
  onMaximizeChanged: (callback) => {
    const handler = (_, isMaximized) => callback(isMaximized);
    ipcRenderer.on('window-maximize-changed', handler);
    return () => ipcRenderer.removeListener('window-maximize-changed', handler);
  },
  getLoginItemSettings: () => ipcRenderer.invoke('get-login-item-settings'),
  setLoginItemSettings: (settings) => ipcRenderer.invoke('set-login-item-settings', settings),
  onGlobalShortcut: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('global-shortcut-summon', handler);
    ipcRenderer.on('trigger-voice-summon', handler);
    return () => {
      ipcRenderer.removeListener('global-shortcut-summon', handler);
      ipcRenderer.removeListener('trigger-voice-summon', handler);
    };
  }
});
