// MAHR Native Desktop Application Entry Point (Windows & Linux)
// Supports Electron runtime as well as Node fallback execution
const path = require('path');
const fs = require('fs');
const http = require('http');
const net = require('net');

let electron;
try {
  electron = require('electron');
} catch {
  electron = null;
}

// Check if running directly within Electron or Node fallback
const isElectronRuntime = Boolean(electron && typeof electron === 'object' && electron.app);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

// Locate application web assets across development and packaged ASAR/standalone environments
function resolveAppDir() {
  const candidateDirs = [
    path.join(__dirname, 'app'),
    path.join(__dirname, 'dist'),
    path.join(__dirname, '../dist'),
    path.join(__dirname, '../app'),
    path.join(process.resourcesPath || '', 'app'),
    path.join(process.resourcesPath || '', 'app.asar', 'app'),
    __dirname
  ];

  for (const dir of candidateDirs) {
    if (fs.existsSync(path.join(dir, 'index.html'))) {
      return dir;
    }
  }
  return path.join(__dirname, 'app');
}

// Find open port for embedded local loopback server
function getAvailablePort(startPort = 19842) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(startPort, '127.0.0.1', () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    server.on('error', () => {
      resolve(getAvailablePort(startPort + 1));
    });
  });
}

let childBackendProcess = null;

function cleanupChildServer() {
  if (childBackendProcess) {
    try {
      childBackendProcess.kill('SIGTERM');
    } catch {}
    childBackendProcess = null;
  }
}

process.on('exit', cleanupChildServer);
process.on('SIGINT', () => { cleanupChildServer(); process.exit(0); });
process.on('SIGTERM', () => { cleanupChildServer(); process.exit(0); });

function startFallbackStaticServer(port, appDir, resolve) {
  const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const urlPath = req.url.split('?')[0];

    if (urlPath === '/api/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'ok',
        platform: process.platform,
        version: '2.4.0',
        engine: 'MAHR Embedded Desktop Engine'
      }));
      return;
    }

    const sanitized = urlPath.replace(/\.\./g, '');
    const requestedFile = (sanitized === '/' || !sanitized) ? 'index.html' : sanitized.replace(/^\//, '');
    const fullPath = path.join(appDir, requestedFile);

    const targetPath = (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile())
      ? fullPath
      : path.join(appDir, 'index.html');

    fs.readFile(targetPath, (err, content) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('MAHR Desktop: Asset not found');
        return;
      }
      const ext = path.extname(targetPath).toLowerCase();
      res.writeHead(200, {
        'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
        'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable'
      });
      res.end(content);
    });
  });

  server.listen(port, '127.0.0.1', () => {
    resolve({ port, server, url: `http://127.0.0.1:${port}` });
  });
}

// Start embedded full backend server (Express + WS + AI Vault) or fallback static server
function startLocalServer(appDir) {
  return new Promise(async (resolve) => {
    const port = await getAvailablePort(19842);

    const possibleServers = [
      path.join(__dirname, 'desktop-server.cjs'),
      path.join(__dirname, 'server.cjs'),
      path.join(__dirname, '../dist/desktop-server.cjs'),
      path.join(__dirname, '../dist/server.cjs'),
      path.join(process.resourcesPath || '', 'desktop-server.cjs'),
      path.join(process.resourcesPath || '', 'app.asar', 'desktop-server.cjs'),
      '/opt/mahr-desktop/desktop-server.cjs'
    ];
    const fullServerPath = possibleServers.find(p => fs.existsSync(p));

    if (fullServerPath) {
      console.log(`[MAHR Desktop] Starting embedded backend engine: ${fullServerPath} on port ${port}`);
      const nodeBin = isElectronRuntime ? process.execPath : (process.argv[0] || 'node');
      const childEnv = {
        ...process.env,
        PORT: String(port),
        NODE_ENV: 'production',
        APP_DIST_PATH: appDir,
        ...(isElectronRuntime ? { ELECTRON_RUN_AS_NODE: '1' } : {})
      };

      const { spawn } = require('child_process');
      const srv = spawn(nodeBin, [fullServerPath], {
        env: childEnv,
        stdio: ['ignore', 'pipe', 'pipe']
      });

      childBackendProcess = srv;

      let started = false;
      const readyTimeout = setTimeout(() => {
        if (!started) {
          started = true;
          resolve({ port, server: null, url: `http://127.0.0.1:${port}` });
        }
      }, 1800);

      srv.stdout.on('data', (d) => {
        const text = d.toString();
        if ((text.includes('Running on') || text.includes('Server running')) && !started) {
          started = true;
          clearTimeout(readyTimeout);
          resolve({ port, server: null, url: `http://127.0.0.1:${port}` });
        }
      });

      srv.on('error', (err) => {
        console.warn('[MAHR Desktop] Full backend spawn failed, falling back to static server:', err);
        if (!started) {
          started = true;
          clearTimeout(readyTimeout);
          startFallbackStaticServer(port, appDir, resolve);
        }
      });
      return;
    }

    startFallbackStaticServer(port, appDir, resolve);
  });
}

if (isElectronRuntime) {
  // ==========================================================================
  // Electron Native Desktop Runtime
  // ==========================================================================
  const { app, BrowserWindow, ipcMain, globalShortcut, Tray, Menu, nativeImage, Notification } = electron;

  let mainWindow = null;
  let tray = null;
  let localServerInstance = null;

  const isDev = process.env.NODE_ENV === 'development' && !app.isPackaged;
  const DEV_PORT = process.env.PORT || 3000;
  const DEV_URL = `http://localhost:${DEV_PORT}`;

  async function createWindow() {
    const iconCandidates = [
      path.join(__dirname, 'icon-512.png'),
      path.join(__dirname, 'app', 'icon-512.png'),
      path.join(__dirname, '../public/icon-512.png'),
      path.join(__dirname, 'mahr.ico')
    ];
    let appIcon = null;
    for (const p of iconCandidates) {
      if (fs.existsSync(p)) {
        appIcon = p;
        break;
      }
    }

    const preloadCandidates = [
      path.join(__dirname, 'preload.cjs'),
      path.join(__dirname, 'electron', 'preload.cjs'),
      path.join(__dirname, '../electron/preload.cjs')
    ];
    let preloadScript = null;
    for (const p of preloadCandidates) {
      if (fs.existsSync(p)) {
        preloadScript = p;
        break;
      }
    }

    mainWindow = new BrowserWindow({
      width: 1440,
      height: 920,
      minWidth: 980,
      minHeight: 640,
      title: 'MAHR // Cognitive Ambient OS',
      backgroundColor: '#040711',
      show: false,
      frame: true,
      titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
      icon: appIcon || undefined,
      webPreferences: {
        preload: preloadScript || undefined,
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        webSecurity: true,
      },
    });

    if (isDev) {
      mainWindow.loadURL(DEV_URL).catch(() => {
        setTimeout(() => mainWindow && mainWindow.loadURL(DEV_URL), 2000);
      });
    } else {
      const appDir = resolveAppDir();
      localServerInstance = await startLocalServer(appDir);
      mainWindow.loadURL(localServerInstance.url).catch(() => {
        mainWindow && mainWindow.loadFile(path.join(appDir, 'index.html'));
      });
    }

    mainWindow.once('ready-to-show', () => {
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
      }
    });

    mainWindow.on('closed', () => {
      mainWindow = null;
    });

    mainWindow.on('maximize', () => {
      mainWindow?.webContents.send('window-maximize-changed', true);
    });
    mainWindow.on('unmaximize', () => {
      mainWindow?.webContents.send('window-maximize-changed', false);
    });
  }

  function setupTray() {
    try {
      const iconPath = path.join(__dirname, 'icon-512.png');
      if (fs.existsSync(iconPath)) {
        const trayIcon = nativeImage.createFromPath(iconPath).resize({ width: 18, height: 18 });
        tray = new Tray(trayIcon);

        const contextMenu = Menu.buildFromTemplate([
          {
            label: 'Open MAHR OS',
            click: () => {
              if (mainWindow) {
                mainWindow.show();
                mainWindow.focus();
              } else {
                createWindow();
              }
            },
          },
          {
            label: 'Summon Voice Assistant',
            accelerator: 'CmdOrCtrl+Shift+M',
            click: () => {
              if (mainWindow) {
                mainWindow.show();
                mainWindow.focus();
                mainWindow.webContents.send('trigger-voice-summon');
              }
            },
          },
          { type: 'separator' },
          {
            label: 'Always on Top',
            type: 'checkbox',
            checked: false,
            click: (menuItem) => {
              mainWindow?.setAlwaysOnTop(menuItem.checked);
            },
          },
          { type: 'separator' },
          {
            label: 'Quit MAHR',
            click: () => {
              app.isQuitting = true;
              app.quit();
            },
          },
        ]);

        tray.setToolTip('MAHR // Cognitive Ambient OS');
        tray.setContextMenu(contextMenu);

        tray.on('double-click', () => {
          if (mainWindow) {
            if (mainWindow.isVisible()) {
              mainWindow.focus();
            } else {
              mainWindow.show();
            }
          }
        });
      }
    } catch (err) {
      console.warn('Tray initialization note:', err);
    }
  }

  // IPC Handlers
  ipcMain.on('window-minimize', () => {
    mainWindow?.minimize();
  });

  ipcMain.on('window-maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });

  ipcMain.on('window-close', () => {
    mainWindow?.close();
  });

  ipcMain.handle('is-maximized', () => {
    return mainWindow ? mainWindow.isMaximized() : false;
  });

  ipcMain.handle('get-platform-info', () => {
    return {
      platform: process.platform,
      arch: process.arch,
      electronVersion: process.versions.electron,
      isDesktop: true,
    };
  });

  ipcMain.on('send-notification', (_, { title, body }) => {
    if (Notification && Notification.isSupported()) {
      new Notification({
        title: title || 'MAHR OS',
        body: body || '',
      }).show();
    }
  });

  app.whenReady().then(() => {
    createWindow();
    setupTray();

    try {
      globalShortcut.register('CommandOrControl+Shift+M', () => {
        if (mainWindow) {
          if (mainWindow.isMinimized()) mainWindow.restore();
          mainWindow.show();
          mainWindow.focus();
          mainWindow.webContents.send('global-shortcut-summon');
        }
      });
    } catch (e) {
      console.warn('Global shortcut registration note:', e);
    }

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });

  app.on('will-quit', () => {
    globalShortcut.unregisterAll();
    if (localServerInstance && localServerInstance.server) {
      try { localServerInstance.server.close(); } catch {}
    }
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
} else {
  // ==========================================================================
  // Standalone Node.js Fallback Engine
  // ==========================================================================
  const { spawn, execSync } = require('child_process');
  const appDir = resolveAppDir();

  startLocalServer(appDir).then(({ url, port }) => {
    console.log(`\n✨ MAHR Standalone Desktop Engine active at: ${url}`);
    console.log('🚀 Launching dedicated native-style desktop window...');

    // Persistent event loop keeper so backend server never terminates unexpectedly
    const keepAlive = setInterval(() => {}, 60000);

    const shutdown = () => {
      clearInterval(keepAlive);
      cleanupChildServer();
      process.exit(0);
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    if (process.platform === 'win32') {
      const localAppData = process.env.LOCALAPPDATA || path.join(process.env.USERPROFILE || 'C:\\', 'AppData', 'Local');
      const winUserData = path.join(localAppData, 'MAHR', 'profile');
      try { fs.mkdirSync(winUserData, { recursive: true }); } catch {}

      const winBrowsers = [
        path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'Microsoft\\Edge\\Application\\msedge.exe'),
        path.join(process.env.ProgramFiles || 'C:\\Program Files', 'Microsoft\\Edge\\Application\\msedge.exe'),
        path.join(process.env.ProgramFiles || 'C:\\Program Files', 'Google\\Chrome\\Application\\chrome.exe'),
        path.join(process.env.LOCALAPPDATA || '', 'Microsoft\\Edge\\Application\\msedge.exe')
      ];

      for (const b of winBrowsers) {
        if (fs.existsSync(b)) {
          const child = spawn(b, [
            `--app=${url}`,
            `--user-data-dir=${winUserData}`,
            '--window-size=1366,850',
            '--no-first-run',
            '--no-default-browser-check'
          ], { stdio: 'ignore' });
          child.on('exit', shutdown);
          return;
        }
      }
      const child = spawn('cmd.exe', ['/c', 'start', url], { stdio: 'ignore' });
      child.on('exit', shutdown);
      return;
    }

    // Unix / Linux Desktop Native App Mode
    const userHome = process.env.HOME || '/tmp';
    const linuxUserData = path.join(userHome, '.config', 'mahr-desktop', 'profile');
    try { fs.mkdirSync(linuxUserData, { recursive: true }); } catch {}

    const browsers = ['google-chrome-stable', 'google-chrome', 'chromium-browser', 'chromium', 'brave-browser', 'microsoft-edge', 'microsoft-edge-stable', 'xdg-open'];
    for (const b of browsers) {
      try {
        execSync(`which ${b}`, { stdio: 'ignore' });
        const args = b === 'xdg-open'
          ? [url]
          : [
              `--app=${url}`,
              `--user-data-dir=${linuxUserData}`,
              '--class=mahr-desktop',
              '--name=MAHR AI Desktop',
              '--window-size=1366,850',
              '--no-first-run',
              '--no-default-browser-check'
            ];

        const child = spawn(b, args, { stdio: 'ignore' });
        child.on('exit', shutdown);
        return;
      } catch {}
    }
  });
}

