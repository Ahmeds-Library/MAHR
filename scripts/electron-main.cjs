const { app, BrowserWindow, globalShortcut } = require('electron');
const path = require('path');

const targetUrl = process.argv[2] || 'http://localhost:19842';

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1024,
    minHeight: 700,
    title: "MAHR Autonomous AI Personal Assistant",
    icon: path.join(__dirname, 'app', 'icon-512.png'),
    backgroundColor: '#020617',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true
    }
  });

  win.loadURL(targetUrl);

  globalShortcut.register('CommandOrControl+Shift+M', () => {
    if (win.isVisible()) {
      win.focus();
    } else {
      win.show();
    }
  });
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
