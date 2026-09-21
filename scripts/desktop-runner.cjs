#!/usr/bin/env node
/**
 * MAHR Autonomous Desktop AI Assistant - Cross-Platform Native Runtime v2.4.0
 * Copyright (C) 2026 MAHR Cognitive Systems. All Rights Reserved.
 *
 * Runs a standalone local HTTP engine for the compiled MAHR application
 * and launches a dedicated native desktop window (via Chrome/Chromium/Brave/Edge --app mode or Electron).
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const net = require('net');
const os = require('os');
const { spawn, execSync } = require('child_process');

const APP_DIR = path.join(__dirname, 'app');
const CONFIG_DIR = path.join(os.homedir(), '.config', 'mahr-desktop');

if (!fs.existsSync(CONFIG_DIR)) {
  try {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  } catch {}
}

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
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject'
};

// Function to find an open port
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

// Function to serve static files with SPA fallback
function serveFile(req, res, filePath) {
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // SPA Fallback: serve index.html for non-asset routes
      const indexPath = path.join(APP_DIR, 'index.html');
      fs.readFile(indexPath, (readErr, content) => {
        if (readErr) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('MAHR Desktop: Application assets not found.');
          return;
        }
        res.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache'
        });
        res.end(content);
      });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
}

async function main() {
  const PORT = await getAvailablePort(19842);
  const localUrl = `http://localhost:${PORT}`;

  // Check for full self-contained Express + WebSocket + AI Vault backend
  const possibleServers = [
    path.join(__dirname, 'desktop-server.cjs'),
    path.join(__dirname, 'server.cjs'),
    path.join(__dirname, '../dist/desktop-server.cjs'),
    path.join(__dirname, '../dist/server.cjs'),
    '/opt/mahr-desktop/desktop-server.cjs'
  ];
  const fullServer = possibleServers.find(p => fs.existsSync(p));

  let activeServerProc = null;

  if (fullServer) {
    console.log(`[MAHR Engine] Initializing full autonomous cognitive backend: ${fullServer}`);
    activeServerProc = spawn(process.argv[0] || 'node', [fullServer], {
      env: {
        ...process.env,
        PORT: String(PORT),
        NODE_ENV: 'production',
        APP_DIST_PATH: APP_DIR
      },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    const cleanup = () => {
      if (activeServerProc) {
        try { activeServerProc.kill('SIGTERM'); } catch {}
        activeServerProc = null;
      }
    };
    process.on('exit', cleanup);
    process.on('SIGINT', () => { cleanup(); process.exit(0); });
    process.on('SIGTERM', () => { cleanup(); process.exit(0); });

    activeServerProc.stdout.on('data', d => {
      const msg = d.toString().trim();
      if (msg) console.log(`[Engine] ${msg}`);
    });
    activeServerProc.stderr.on('data', d => {
      const err = d.toString().trim();
      if (err) console.error(`[Engine Log] ${err}`);
    });

    // Allow backend to bind
    await new Promise(r => setTimeout(r, 1200));
  } else {
    const server = http.createServer((req, res) => {
      // CORS headers for local execution
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      const urlPath = req.url.split('?')[0];

      // Local API health endpoint
      if (urlPath === '/api/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'ok',
          platform: process.platform,
          version: '2.4.0',
          appName: 'MAHR Autonomous Desktop AI Assistant'
        }));
        return;
      }

      // Local API models endpoint
      if (urlPath === '/api/models') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          models: [
            { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash (High-Speed)' },
            { id: 'gemini-3.5-pro', name: 'Gemini 3.5 Pro (Deep Reasoning)' }
          ]
        }));
        return;
      }

      // Sanitize file path
      const sanitized = urlPath.replace(/\.\./g, '');
      const requestedFile = (sanitized === '/' || !sanitized) ? 'index.html' : sanitized.replace(/^\//, '');
      const fullPath = path.join(APP_DIR, requestedFile);

      // If requesting a direct asset that exists, serve it; otherwise SPA fallback
      if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
        serveFile(req, res, fullPath);
      } else {
        serveFile(req, res, path.join(APP_DIR, 'index.html'));
      }
    });

    server.listen(PORT, '127.0.0.1');
  }

  console.log('\n' +
      '┌──────────────────────────────────────────────────────────────┐\n' +
      '│                                                              │\n' +
      '│   ✨ MAHR Autonomous Desktop AI Assistant v2.4.0            │\n' +
      '│   🧠 Cognitive Workspace & Multi-Agent Floor Active          │\n' +
      '│                                                              │\n' +
      `│   🌐 Local Engine: ${localUrl.padEnd(41)} │\n` +
      '│   🖥️  Display: Standalone Desktop Window Starting...        │\n' +
      '│                                                              │\n' +
      '│   Press Ctrl+C to terminate desktop instance                 │\n' +
      '└──────────────────────────────────────────────────────────────┘\n'
    );

    launchDesktopWindow(localUrl, PORT);
  }

  function launchDesktopWindow(url, port) {
    // Windows Launch Handler
    if (process.platform === 'win32') {
      const winBrowsers = [
        path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'Microsoft\\Edge\\Application\\msedge.exe'),
        path.join(process.env.ProgramFiles || 'C:\\Program Files', 'Microsoft\\Edge\\Application\\msedge.exe'),
        path.join(process.env.LOCALAPPDATA || '', 'Microsoft\\Edge\\Application\\msedge.exe'),
        path.join(process.env.ProgramFiles || 'C:\\Program Files', 'Google\\Chrome\\Application\\chrome.exe'),
        path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'Google\\Chrome\\Application\\chrome.exe'),
        path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
        path.join(process.env.ProgramFiles || 'C:\\Program Files', 'BraveSoftware\\Brave-Browser\\Application\\brave.exe')
      ];

      for (const b of winBrowsers) {
        if (fs.existsSync(b)) {
          console.log(`🚀 Launching native Windows interface via ${b}...`);
          const child = spawn(b, [`--app=${url}`, `--user-data-dir=${CONFIG_DIR}`, '--name=MAHR AI Desktop', '--no-first-run'], {
            detached: true,
            stdio: 'ignore'
          });
          child.unref();
          return;
        }
      }

      spawn('cmd.exe', ['/c', 'start', url], { detached: true, stdio: 'ignore' }).unref();
      return;
    }

    // Linux & Other Unix Launch Handler
    // 1. Check for Electron
    const electronScript = path.join(__dirname, 'electron-main.cjs');
    try {
      execSync('which electron', { stdio: 'ignore' });
      const child = spawn('electron', [electronScript, url], {
        detached: false,
        stdio: 'inherit'
      });
      child.on('exit', () => process.exit(0));
      return;
    } catch {}

    // 2. Check for Chromium-based browsers that support standalone --app mode
    const browsers = [
      { bin: 'google-chrome-stable', args: [`--app=${url}`, `--user-data-dir=${CONFIG_DIR}`, '--class=mahr-desktop', '--name=MAHR AI Desktop', '--no-first-run', '--no-default-browser-check'] },
      { bin: 'google-chrome', args: [`--app=${url}`, `--user-data-dir=${CONFIG_DIR}`, '--class=mahr-desktop', '--name=MAHR AI Desktop', '--no-first-run', '--no-default-browser-check'] },
      { bin: 'chromium-browser', args: [`--app=${url}`, `--user-data-dir=${CONFIG_DIR}`, '--class=mahr-desktop', '--name=MAHR AI Desktop', '--no-first-run', '--no-default-browser-check'] },
      { bin: 'chromium', args: [`--app=${url}`, `--user-data-dir=${CONFIG_DIR}`, '--class=mahr-desktop', '--name=MAHR AI Desktop', '--no-first-run', '--no-default-browser-check'] },
      { bin: 'brave-browser', args: [`--app=${url}`, `--user-data-dir=${CONFIG_DIR}`, '--class=mahr-desktop', '--name=MAHR AI Desktop', '--no-first-run', '--no-default-browser-check'] },
      { bin: 'microsoft-edge', args: [`--app=${url}`, `--user-data-dir=${CONFIG_DIR}`, '--class=mahr-desktop', '--name=MAHR AI Desktop', '--no-first-run', '--no-default-browser-check'] },
      { bin: 'microsoft-edge-stable', args: [`--app=${url}`, `--user-data-dir=${CONFIG_DIR}`, '--class=mahr-desktop', '--name=MAHR AI Desktop', '--no-first-run', '--no-default-browser-check'] },
      { bin: 'firefox', args: ['--new-window', url] },
      { bin: 'xdg-open', args: [url] }
    ];

    for (const b of browsers) {
      try {
        execSync(`which ${b.bin}`, { stdio: 'ignore' });
        console.log(`🚀 Launching native interface via ${b.bin}...`);
        const child = spawn(b.bin, b.args, {
          stdio: 'ignore'
        });

        const keepAlive = setInterval(() => {}, 60000);
        const shutdown = () => {
          clearInterval(keepAlive);
          try { if (activeServerProc) activeServerProc.kill('SIGTERM'); } catch {}
          process.exit(0);
        };
        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);
        child.on('exit', shutdown);
        return;
      } catch {}
    }

    console.log(`⚠️ Could not find a desktop browser automatically. Please open ${url} in your browser.`);
  }

main().catch((err) => {
  console.error('Fatal Desktop Engine Error:', err);
  process.exit(1);
});
