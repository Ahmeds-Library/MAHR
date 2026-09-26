#!/usr/bin/env node
/**
 * ============================================================
 * MAHR — God-Mode Project Blueprint Generator
 * scripts/generate-blueprint.mjs
 *
 * Generates project-blueprint.md — the ultimate source of truth
 * for AI agents and human developers. Run on every push via CI.
 *
 * Usage:  node scripts/generate-blueprint.mjs
 * ============================================================
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const OUTPUT = path.join(ROOT, 'project-blueprint.md');

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

/** Read a file safely, returning '' on error. */
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return '';
  }
}

/** Run a shell command, return stdout string or '' on error. */
function shell(cmd, cwd = ROOT) {
  try {
    return execSync(cmd, { cwd, stdio: ['pipe', 'pipe', 'pipe'] }).toString().trim();
  } catch {
    return '';
  }
}

/** Format bytes to human readable. */
function fmtBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/** Count lines in a string. */
function countLines(str) {
  return str.split('\n').length;
}

/** Recursively walk a directory, yielding file paths. */
function* walkDir(dir, ignorePatterns = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(ROOT, fullPath);
    if (ignorePatterns.some(p => relPath.startsWith(p) || entry.name === p)) continue;
    if (entry.isDirectory()) {
      yield* walkDir(fullPath, ignorePatterns);
    } else {
      yield fullPath;
    }
  }
}

/** Build a visual directory tree string. */
function buildTree(dir, prefix = '', ignorePatterns = [], maxDepth = 6, depth = 0) {
  if (depth > maxDepth) return '';
  let result = '';
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true }).filter(e => {
      return !ignorePatterns.includes(e.name) &&
        !ignorePatterns.some(p => path.relative(ROOT, path.join(dir, e.name)).startsWith(p));
    });
  } catch {
    return '';
  }
  entries.forEach((entry, idx) => {
    const isLast = idx === entries.length - 1;
    const connector = isLast ? '└── ' : '├── ';
    const ext = entry.isDirectory() ? '/' : '';
    result += `${prefix}${connector}${entry.name}${ext}\n`;
    if (entry.isDirectory()) {
      const newPrefix = prefix + (isLast ? '    ' : '│   ');
      result += buildTree(path.join(dir, entry.name), newPrefix, ignorePatterns, maxDepth, depth + 1);
    }
  });
  return result;
}

// ─────────────────────────────────────────────────────────────
// IGNORE PATTERNS
// ─────────────────────────────────────────────────────────────
const IGNORE = [
  'node_modules', '.git', 'dist', 'dist_electron',
  'mahr_brain.db', 'mahr_brain.db-shm', 'mahr_brain.db-wal',
  'bun.lock', 'package-lock.json', '.gemini',
  'websocket-debug.log', 'token_telemetry.json'
];
const CODE_EXTS = new Set(['.ts', '.tsx', '.js', '.mjs', '.cjs', '.go', '.py', '.sql', '.json', '.md']);

// ─────────────────────────────────────────────────────────────
// SECTION 1 — HEADER & META
// ─────────────────────────────────────────────────────────────
function genHeader() {
  const now = new Date().toISOString();
  const gitHash = shell('git rev-parse --short HEAD');
  const gitBranch = shell('git rev-parse --abbrev-ref HEAD');
  const gitLastMsg = shell('git log -1 --pretty=%s');
  const gitAuthor = shell('git log -1 --pretty=%an');
  return `# MAHR — God-Mode Project Blueprint
> **Auto-generated on every push — DO NOT EDIT MANUALLY**
> This file is the single source of truth for AI agents and developers.

| Field | Value |
|---|---|
| **Generated At** | \`${now}\` |
| **Git Branch** | \`${gitBranch || 'unknown'}\` |
| **Commit Hash** | \`${gitHash || 'unknown'}\` |
| **Last Commit** | ${gitLastMsg || 'N/A'} |
| **Author** | ${gitAuthor || 'N/A'} |
| **Root** | \`/MAHR\` |

---
`;
}

// ─────────────────────────────────────────────────────────────
// SECTION 2 — ARCHITECTURE & DIRECTORY TREE
// ─────────────────────────────────────────────────────────────
function genArchitecture() {
  const tree = buildTree(ROOT, '', IGNORE, 5);

  // Parse vite config for aliases
  const viteConf = readFile(path.join(ROOT, 'vite.config.ts'));
  const aliasMatches = [...viteConf.matchAll(/find:\s*\/?\^?([@\w\/\\.]+)\/?\//g)];
  const replaceMatches = [...viteConf.matchAll(/replacement:\s*path\.resolve\([^,]+,\s*'([^']+)'\)/g)];
  let aliasTable = '| Alias | Resolves To |\n|---|---|\n';
  aliasMatches.forEach((m, i) => {
    const alias = m[1];
    const target = replaceMatches[i] ? replaceMatches[i][1] : '?';
    aliasTable += `| \`${alias}\` | \`${target}\` |\n`;
  });

  // Parse electron-builder.json
  const ebConf = readFile(path.join(ROOT, 'electron-builder.json'));
  let ebSection = '';
  try {
    const eb = JSON.parse(ebConf);
    ebSection = `
### Electron Build Config
| Field | Value |
|---|---|
| **App ID** | \`${eb.appId || 'N/A'}\` |
| **Product Name** | \`${eb.productName || 'N/A'}\` |
| **Linux Targets** | \`${(eb.linux?.target || []).join(', ')}\` |
| **Windows NSIS** | \`${eb.nsis ? 'Yes' : 'No'}\` |
`;
  } catch (_) { /* skip */ }

  return `## 1. Architecture & Infrastructure

### System Overview
MAHR is an **Electron + Vite/React desktop application** with a dual backend:
- **TypeScript Server** (\`server.ts\` and companions) — Express-based, handles AI sessions, WebSocket, DB, vault, office state.
- **Go Backend** (\`server-golang/\`) — High-performance memory/vector store, knowledge graph, and live relay via gorilla/websocket.
- **Frontend** (\`src/\`) — React 19 + Zustand + Tailwind v4, built with Vite.
- **Electron Shell** (\`electron/\`) — Desktop wrapper, packaged with electron-builder.

### Directory Tree
\`\`\`
MAHR/
${tree}\`\`\`

### Path Aliases (vite.config.ts)
${aliasTable}
${ebSection}
### Launch Scripts
| Script | Platform | Purpose |
|---|---|---|
| \`launch-mahr-linux.sh\` | Linux | Start app in dev/prod |
| \`launch-mahr-windows.bat\` | Windows | Start app on Windows |
| \`scripts/mahr.bat\` | Windows | Alt launcher |
| \`scripts/win-server.ps1\` | Windows | PowerShell server runner |
| \`scripts/desktop-runner.cjs\` | Cross | Desktop orchestration |

---
`;
}

// ─────────────────────────────────────────────────────────────
// SECTION 3 — CODEBASE METRICS
// ─────────────────────────────────────────────────────────────
function genMetrics() {
  const extMap = {};
  let totalFiles = 0;
  let totalLOC = 0;
  let totalBytes = 0;
  const dirStats = {};

  for (const filePath of walkDir(ROOT, IGNORE)) {
    const ext = path.extname(filePath).toLowerCase();
    if (!CODE_EXTS.has(ext)) continue;
    let content = '';
    let size = 0;
    try {
      const stat = fs.statSync(filePath);
      size = stat.size;
      content = fs.readFileSync(filePath, 'utf-8');
    } catch { continue; }
    const loc = countLines(content);
    totalFiles++;
    totalLOC += loc;
    totalBytes += size;
    if (!extMap[ext]) extMap[ext] = { files: 0, loc: 0, bytes: 0 };
    extMap[ext].files++;
    extMap[ext].loc += loc;
    extMap[ext].bytes += size;

    const rel = path.relative(ROOT, filePath);
    const topDir = rel.split(path.sep)[0] || '.';
    if (!dirStats[topDir]) dirStats[topDir] = { files: 0, loc: 0, bytes: 0 };
    dirStats[topDir].files++;
    dirStats[topDir].loc += loc;
    dirStats[topDir].bytes += size;
  }

  let extTable = '| Extension | Files | LOC | Size |\n|---|---|---|---|\n';
  const sorted = Object.entries(extMap).sort((a, b) => b[1].loc - a[1].loc);
  for (const [ext, s] of sorted) {
    extTable += `| \`${ext}\` | ${s.files} | ${s.loc.toLocaleString()} | ${fmtBytes(s.bytes)} |\n`;
  }

  let dirTable = '| Directory | Files | LOC | Size |\n|---|---|---|---|\n';
  const sortedDirs = Object.entries(dirStats).sort((a, b) => b[1].loc - a[1].loc);
  for (const [dir, s] of sortedDirs) {
    dirTable += `| \`${dir}/\` | ${s.files} | ${s.loc.toLocaleString()} | ${fmtBytes(s.bytes)} |\n`;
  }

  let assetSize = 0;
  for (const filePath of walkDir(path.join(ROOT, 'public'), [])) {
    try { assetSize += fs.statSync(filePath).size; } catch {}
  }
  let assetsSize = 0;
  for (const filePath of walkDir(path.join(ROOT, 'assets'), [])) {
    try { assetsSize += fs.statSync(filePath).size; } catch {}
  }

  return `## 2. Codebase Health & Metrics

### Totals
| Metric | Value |
|---|---|
| **Total Code Files** | ${totalFiles} |
| **Total Lines of Code** | ${totalLOC.toLocaleString()} |
| **Total Code Size** | ${fmtBytes(totalBytes)} |
| **public/ Asset Size** | ${fmtBytes(assetSize)} |
| **assets/ Size** | ${fmtBytes(assetsSize)} |

### By Extension
${extTable}
### By Directory
${dirTable}

---
`;
}

// ─────────────────────────────────────────────────────────────
// SECTION 4 — DEPENDENCIES & TECH STACK
// ─────────────────────────────────────────────────────────────
function genDependencies() {
  const pkg = JSON.parse(readFile(path.join(ROOT, 'package.json')) || '{}');
  const deps = pkg.dependencies || {};
  const devDeps = pkg.devDependencies || {};

  const categories = {
    'react': 'UI Framework', 'react-dom': 'UI Framework',
    'react-i18next': 'i18n', 'i18next': 'i18n',
    'zustand': 'State Management',
    'express': 'HTTP Server', 'ws': 'WebSocket',
    'firebase': '3rd-Party / Firebase',
    'mongodb': 'Database', 'pg': 'Database (PostgreSQL)',
    'three': '3D / Rendering', 'pixi.js': '2D / Rendering',
    'gsap': 'Animation', 'motion': 'Animation',
    'cannon-es': 'Physics',
    '@google/genai': 'AI / Gemini',
    'dotenv': 'Config', 'perfect-freehand': 'Drawing',
    'canvas-confetti': 'UI Effects', 'lucide-react': 'Icons',
    'jszip': 'Utilities', 'bytenode': 'Build',
    '@tailwindcss/vite': 'Styling', '@vitejs/plugin-react': 'Build Plugin',
    'vite': 'Bundler',
  };

  let depsTable = '| Package | Version | Category |\n|---|---|---|\n';
  for (const [name, ver] of Object.entries(deps)) {
    depsTable += `| \`${name}\` | \`${ver}\` | ${categories[name] || 'Dependency'} |\n`;
  }

  let devTable = '| Package | Version | Category |\n|---|---|---|\n';
  const devCats = {
    'electron': 'Desktop Shell', 'electron-builder': 'Packaging',
    'vite': 'Bundler', 'typescript': 'Language',
    'tailwindcss': 'Styling', '@tailwindcss/vite': 'Styling',
    'esbuild': 'Bundler', 'tsx': 'TS Execution',
    '@vitejs/plugin-react': 'Build Plugin',
  };
  for (const [name, ver] of Object.entries(devDeps)) {
    devTable += `| \`${name}\` | \`${ver}\` | ${devCats[name] || 'Dev Tooling'} |\n`;
  }

  const goMod = readFile(path.join(ROOT, 'server-golang', 'go.mod'));
  const goModuleName = (goMod.match(/^module\s+(\S+)/m) || [])[1] || 'unknown';
  const goVersion = (goMod.match(/^go\s+([\d.]+)/m) || [])[1] || 'unknown';
  const goRequires = [...goMod.matchAll(/^\s+(\S+)\s+(v\S+)/gm)].map(m => `| \`${m[1]}\` | \`${m[2]}\` |`).join('\n');

  return `## 3. Dependencies & Tech Stack

### Runtime Dependencies (package.json)
${depsTable}

<details>
<summary>Dev Dependencies</summary>

${devTable}
</details>

### Go Backend (server-golang/go.mod)
| Field | Value |
|---|---|
| **Module** | \`${goModuleName}\` |
| **Go Version** | \`${goVersion}\` |

| Package | Version |
|---|---|
${goRequires || '| (none) | — |'}

---
`;
}

// ─────────────────────────────────────────────────────────────
// SECTION 5 — GIT HOTSPOTS & TODOs
// ─────────────────────────────────────────────────────────────
function genGitAndTodos() {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const logRaw = shell(`git log --since="${since}" --pretty=format: --name-only`);
  const fileFreq = {};
  for (const line of logRaw.split('\n')) {
    const f = line.trim();
    if (f) fileFreq[f] = (fileFreq[f] || 0) + 1;
  }
  const hotspots = Object.entries(fileFreq).sort((a, b) => b[1] - a[1]).slice(0, 15);

  let hotTable = '| File | Changes |\n|---|---|\n';
  if (hotspots.length === 0) {
    hotTable += '| (No git history yet or fresh clone) | — |\n';
  } else {
    for (const [file, count] of hotspots) {
      hotTable += `| \`${file}\` | ${count} |\n`;
    }
  }

  const todos = [];
  for (const filePath of walkDir(ROOT, IGNORE)) {
    const ext = path.extname(filePath).toLowerCase();
    if (!['.ts', '.tsx', '.js', '.mjs', '.cjs', '.go', '.py'].includes(ext)) continue;
    let content;
    try { content = fs.readFileSync(filePath, 'utf-8'); } catch { continue; }
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      if (/\/\/\s*(TODO|FIXME|HACK|XXX)/i.test(line) || /#\s*(TODO|FIXME)/i.test(line)) {
        const match = line.match(/(TODO|FIXME|HACK|XXX)[:\s]+(.*)/i);
        const rel = path.relative(ROOT, filePath);
        todos.push({
          type: match ? match[1].toUpperCase() : 'TODO',
          file: rel,
          line: idx + 1,
          text: match ? match[2].trim() : line.trim(),
        });
      }
    });
  }

  let todoTable = '| Type | File | Line | Description |\n|---|---|---|---|\n';
  if (todos.length === 0) {
    todoTable += '| — | No TODOs/FIXMEs found | — | — |\n';
  } else {
    for (const t of todos.slice(0, 50)) {
      todoTable += `| \`${t.type}\` | \`${t.file}\` | L${t.line} | ${t.text.replace(/\|/g, '\\|')} |\n`;
    }
    if (todos.length > 50) todoTable += `| ... | +${todos.length - 50} more entries | ... | ... |\n`;
  }

  return `## 4. Git Hotspots & Code Debt

### Git Hotspots — Last 30 Days (Top 15 Most-Changed Files)
${hotTable}

### TODO / FIXME Tracker
${todoTable}

---
`;
}

// ─────────────────────────────────────────────────────────────
// SECTION 6 — BACKEND API (Go + TypeScript servers)
// ─────────────────────────────────────────────────────────────
function genBackendAPI() {
  const routerGo = readFile(path.join(ROOT, 'server-golang', 'api', 'router.go'));

  const goRoutes = [...routerGo.matchAll(/mux\.HandleFunc\("([^"]+)",/g)];
  let goRouteTable = '| Method | Path | Handler |\n|---|---|---|\n';
  for (const m of goRoutes) {
    const routePath = m[1];
    const startIdx = routerGo.indexOf(m[0]);
    const snippet = routerGo.slice(startIdx, startIdx + 400);
    const methods = [];
    if (/MethodGet/g.test(snippet)) methods.push('GET');
    if (/MethodPost/g.test(snippet)) methods.push('POST');
    if (/MethodDelete/g.test(snippet)) methods.push('DELETE');
    if (/MethodPut/g.test(snippet)) methods.push('PUT');
    if (routePath.includes('live-relay')) methods.push('WS');
    goRouteTable += `| \`${methods.join(', ') || 'ANY'}\` | \`${routePath}\` | See handlers.go |\n`;
  }

  const serverTs = readFile(path.join(ROOT, 'server.ts'));
  const tsRoutes = [...serverTs.matchAll(/app\.(get|post|put|delete|patch|use)\(['"`]([^'"`]+)['"`]/gi)];
  let tsRouteTable = '| Method | Path |\n|---|---|\n';
  const seenTs = new Set();
  for (const m of tsRoutes) {
    const key = `${m[1].toUpperCase()} ${m[2]}`;
    if (seenTs.has(key)) continue;
    seenTs.add(key);
    tsRouteTable += `| \`${m[1].toUpperCase()}\` | \`${m[2]}\` |\n`;
  }
  if (seenTs.size === 0) tsRouteTable += '| (routes defined as handler callbacks) | — |\n';

  const corsOrigin = (routerGo.match(/Access-Control-Allow-Origin['"]\s*,\s*["']([^"']+)["']/)?.[1]) || '*';
  const corsMethods = (routerGo.match(/Access-Control-Allow-Methods['"]\s*,\s*["']([^"']+)["']/)?.[1]) || 'N/A';

  const integrations = [];
  const fbConfig = readFile(path.join(ROOT, 'firebase-applet-config.json'));
  if (fbConfig) integrations.push({ name: 'Firebase', file: 'firebase-applet-config.json' });
  if (serverTs.includes('mongodb')) integrations.push({ name: 'MongoDB', file: 'server.ts' });
  if (serverTs.includes('@google/genai') || serverTs.includes('GoogleGenerativeAI')) {
    integrations.push({ name: 'Google Gemini AI', file: 'server.ts' });
  }
  if (serverTs.includes('stripe')) integrations.push({ name: 'Stripe', file: 'server.ts' });

  let intTable = '| Integration | Detected In |\n|---|---|\n';
  if (integrations.length === 0) intTable += '| (none detected) | — |\n';
  for (const i of integrations) intTable += `| **${i.name}** | \`${i.file}\` |\n`;

  return `## 5. Backend & API Deep Dive

### Go Backend Routes (server-golang/)
Module: \`myraa-backend\` | Go \`1.22\` | WebSocket: \`gorilla/websocket\`
${goRouteTable}

### TypeScript Server Routes (server.ts)
<details>
<summary>Express API routes extracted from server.ts</summary>

${tsRouteTable}
</details>

### Security & CORS (Go Backend)
| Setting | Value |
|---|---|
| **Allow-Origin** | \`${corsOrigin}\` |
| **Allow-Methods** | \`${corsMethods}\` |
| **Auth Strategy** | JWT / Session-based (see server.ts) |
| **Rate Limiting** | See server.ts middleware |

### Server Architecture
| Server File | Purpose |
|---|---|
| \`server.ts\` | Main Express entry, AI sessions, WebSocket bridge |
| \`server_db.ts\` | Database layer (SQLite + PG) |
| \`server_memory.ts\` | Memory persistence and semantic search |
| \`server_office.ts\` | MAHR Office state and collaboration |
| \`server_tokens.ts\` | Token telemetry and rate limiting |
| \`server_vault.ts\` | Encrypted vault (API key storage) |
| \`server-golang/\` | High-perf Go backend for vector ops and live relay |

### Third-Party Integrations
${intTable}

---
`;
}

// ─────────────────────────────────────────────────────────────
// SECTION 7 — DATABASE & STATE
// ─────────────────────────────────────────────────────────────
function genDatabase() {
  const sqlFiles = [];
  for (const filePath of walkDir(ROOT, IGNORE)) {
    if (path.extname(filePath) === '.sql') sqlFiles.push(filePath);
  }

  let sqlSection = '';
  if (sqlFiles.length === 0) {
    sqlSection = `> No .sql migration files found. Database schema is defined programmatically in \`server_db.ts\`.`;
  } else {
    for (const f of sqlFiles) {
      const content = readFile(f);
      sqlSection += `#### \`${path.relative(ROOT, f)}\`\n\`\`\`sql\n${content.slice(0, 2000)}\n\`\`\`\n`;
    }
  }

  const serverDb = readFile(path.join(ROOT, 'server_db.ts'));
  const createTableMatches = [...serverDb.matchAll(/CREATE TABLE IF NOT EXISTS (\w+)/gi)];
  const tableNames = createTableMatches.map(m => m[1]);
  let dbSchemaTable = '| Table | Detected In |\n|---|---|\n';
  for (const t of [...new Set(tableNames)]) {
    dbSchemaTable += `| \`${t}\` | \`server_db.ts\` |\n`;
  }
  if (tableNames.length === 0) dbSchemaTable += '| (no CREATE TABLE statements found) | — |\n';

  const stateFiles = [
    { file: 'memories.json', purpose: 'Persistent memory entries' },
    { file: 'daily_tasks.json', purpose: 'Daily task list' },
    { file: 'knowledge_graph.json', purpose: 'Knowledge graph nodes/edges' },
    { file: 'office_state.json', purpose: 'MAHR Office session state' },
    { file: 'token_telemetry.json', purpose: 'Token usage telemetry' },
    { file: 'server_chat_history.json', purpose: 'Chat session history' },
  ];
  let stateTable = '| File | Purpose | Size |\n|---|---|---|\n';
  for (const s of stateFiles) {
    let size = 'N/A';
    try { size = fmtBytes(fs.statSync(path.join(ROOT, s.file)).size); } catch {}
    stateTable += `| \`${s.file}\` | ${s.purpose} | ${size} |\n`;
  }

  return `## 6. Database & State

### Embedded SQLite (mahr_brain.db)
Tables detected in \`server_db.ts\`:
${dbSchemaTable}

### SQL Migrations
${sqlSection}

### JSON State Files (Runtime Persistence)
${stateTable}

### Go Vector Store
The Go backend (\`server-golang/repository/\`, \`server-golang/services/\`) maintains an
in-memory vector store for semantic memory retrieval. Embeddings are generated via Gemini
and persisted via \`/api/vector-memory/ingest-artifacts\`.

---
`;
}

// ─────────────────────────────────────────────────────────────
// SECTION 8 — FRONTEND ECOSYSTEM
// ─────────────────────────────────────────────────────────────
function genFrontend() {
  const hooksDir = path.join(ROOT, 'src', 'hooks');
  const hooks = [];
  for (const filePath of walkDir(hooksDir, [])) {
    const name = path.basename(filePath, path.extname(filePath));
    const content = readFile(filePath);
    const exports = [...content.matchAll(/^export\s+(function|const|class|default function)\s+(\w+)/gm)].map(m => m[2]);
    hooks.push({ name, file: path.relative(ROOT, filePath), exports });
  }
  let hooksTable = '| Hook | File | Exports |\n|---|---|---|\n';
  for (const h of hooks) {
    hooksTable += `| \`${h.name}\` | \`${h.file}\` | ${h.exports.map(e => `\`${e}\``).join(', ') || '—'} |\n`;
  }

  const servicesDir = path.join(ROOT, 'src', 'services');
  const services = [];
  for (const filePath of walkDir(servicesDir, [])) {
    const ext = path.extname(filePath);
    if (!['.ts', '.tsx'].includes(ext)) continue;
    const name = path.basename(filePath, ext);
    const content = readFile(filePath);
    const exports = [...content.matchAll(/^export\s+(function|const|class|default function|async function)\s+(\w+)/gm)].map(m => m[2]);
    services.push({ name, file: path.relative(ROOT, filePath), exports: exports.slice(0, 5) });
  }
  let servicesTable = '| Service | File | Key Exports |\n|---|---|---|\n';
  for (const s of services) {
    servicesTable += `| \`${s.name}\` | \`${s.file}\` | ${s.exports.map(e => `\`${e}\``).join(', ') || '—'} |\n`;
  }

  const compDir = path.join(ROOT, 'src', 'components');
  const comps = [];
  for (const filePath of walkDir(compDir, [])) {
    if (path.extname(filePath) !== '.tsx') continue;
    let size = 0;
    try { size = fs.statSync(filePath).size; } catch {}
    comps.push({ name: path.basename(filePath, '.tsx'), file: path.relative(ROOT, filePath), size });
  }
  comps.sort((a, b) => b.size - a.size);
  let compTable = '| Component | File | Size |\n|---|---|---|\n';
  for (const c of comps.slice(0, 20)) {
    compTable += `| \`${c.name}\` | \`${c.file}\` | ${fmtBytes(c.size)} |\n`;
  }
  if (comps.length > 20) compTable += `| ... | +${comps.length - 20} more | ... |\n`;

  const officeDir = path.join(ROOT, 'src', 'office');
  const officeFiles = [];
  for (const filePath of walkDir(officeDir, [])) {
    if (['.ts', '.tsx'].includes(path.extname(filePath))) {
      officeFiles.push(path.relative(ROOT, filePath));
    }
  }

  const i18nDir = path.join(ROOT, 'src', 'office', 'i18n');
  let i18nSection = '';
  if (fs.existsSync(i18nDir)) {
    const langs = fs.readdirSync(i18nDir, { withFileTypes: true }).map(e => e.name);
    i18nSection = `### Internationalization (i18n)\nDetected locale files: ${langs.map(l => `\`${l}\``).join(', ')}\n`;
  } else {
    i18nSection = `### Internationalization (i18n)\nPackages: \`i18next\`, \`react-i18next\` (see package.json).\nLocale files: scan \`src/\` for \`*.json\` translation files.\n`;
  }

  const envExample = readFile(path.join(ROOT, '.env.example'));
  const envKeys = [...envExample.matchAll(/^([A-Z_][A-Z0-9_]+)\s*=/gm)].map(m => m[1]);
  let envTable = '| Key | Description |\n|---|---|\n';
  for (const key of envKeys) {
    const commentLines = envExample.split('\n');
    const keyIdx = commentLines.findIndex(l => l.startsWith(key));
    let desc = '—';
    if (keyIdx > 0 && commentLines[keyIdx - 1].startsWith('#')) {
      desc = commentLines[keyIdx - 1].replace(/^#\s*/, '').trim();
    }
    envTable += `| \`${key}\` | ${desc} |\n`;
  }

  return `## 7. Frontend Ecosystem

### Build & Bundle
| Tool | Config |
|---|---|
| **Bundler** | Vite 6 (\`vite.config.ts\`) |
| **UI Framework** | React 19 |
| **Styling** | Tailwind CSS v4 (\`@tailwindcss/vite\`) |
| **State** | Zustand v4 |
| **Animation** | GSAP 3 + Motion (Framer) |
| **3D** | Three.js + Pixi.js |
| **Physics** | cannon-es |
| **i18n** | i18next + react-i18next |
| **Icons** | lucide-react |
| **Output** | \`dist/\` (web), \`dist_electron/\` (Electron) |

### React Hooks Map
${hooksTable}

### Services Map
<details>
<summary>All frontend services (${services.length} files)</summary>

${servicesTable}
</details>

### Top 20 Components by Size
${compTable}

### Office Module Files (${officeFiles.length} files)
<details>
<summary>src/office/ file list</summary>

${officeFiles.map(f => `- \`${f}\``).join('\n')}
</details>

${i18nSection}

### Environment Variables (.env.example)
${envTable}

---
`;
}

// ─────────────────────────────────────────────────────────────
// SECTION 9 — CI/CD & WORKFLOWS
// ─────────────────────────────────────────────────────────────
function genCICD() {
  const workflowDir = path.join(ROOT, '.github', 'workflows');
  let workflowSection = '';
  if (fs.existsSync(workflowDir)) {
    const wfs = fs.readdirSync(workflowDir).filter(f => f.endsWith('.yml') || f.endsWith('.yaml'));
    for (const wf of wfs) {
      const content = readFile(path.join(workflowDir, wf));
      workflowSection += `#### \`.github/workflows/${wf}\`\n\`\`\`yaml\n${content.slice(0, 1500)}\n\`\`\`\n\n`;
    }
  } else {
    workflowSection = `> **Note:** No \`.github/workflows/\` directory found yet.
> The \`generate-blueprint.yml\` workflow will be created alongside this script.
> Once committed, CI will run on every push to \`main\`.`;
  }

  const buildScripts = JSON.parse(readFile(path.join(ROOT, 'package.json')) || '{}')?.scripts || {};
  let scriptsTable = '| Script | Command |\n|---|---|\n';
  for (const [name, cmd] of Object.entries(buildScripts)) {
    scriptsTable += `| \`npm run ${name}\` | \`${cmd.replace(/\|/g, '\\|')}\` |\n`;
  }

  return `## 8. CI/CD & Build Scripts

### GitHub Actions Workflows
${workflowSection}

### NPM Scripts
${scriptsTable}

### Electron Packaging Targets
| Command | Output |
|---|---|
| \`npm run electron:build:win\` | Windows NSIS installer |
| \`npm run electron:build:linux\` | Linux AppImage + .deb |
| \`npm run electron:build:all\` | All platforms |
| \`npm run build:desktop\` | Full desktop bundle pipeline |

---
`;
}

// ─────────────────────────────────────────────────────────────
// SECTION 10 — AI AGENT QUICK REFERENCE
// ─────────────────────────────────────────────────────────────
function genAgentReference() {
  return `## 9. AI Agent Quick Reference

> This section exists specifically for AI coding agents. Read this first.

### Key Entry Points
| What | Where |
|---|---|
| **Frontend entry** | \`src/main.tsx\` => \`src/App.tsx\` |
| **Express server entry** | \`server.ts\` |
| **Go server entry** | \`server-golang/main.go\` |
| **Electron main** | \`electron/main.cjs\` |
| **Vite config** | \`vite.config.ts\` |
| **TS config** | \`tsconfig.json\` |

### Do NOT Edit
- \`project-blueprint.md\` — auto-generated
- \`mahr_brain.db*\` — live runtime DB
- \`bun.lock\` / \`package-lock.json\` — managed by package manager
- \`dist/\`, \`dist_electron/\` — build outputs

### Critical Conventions
1. **Path alias \`@/\`** resolves to \`src/office/\` (NOT \`src/\` root)
2. **\`@shared/\`** resolves to \`src/office/shared/\`
3. **\`@brand/\`** resolves to \`public/brand/\`
4. TypeScript server files use \`.ts\` extension but run via \`tsx\` (ESM)
5. Electron files use \`.cjs\` (CommonJS)
6. State files (\`*.json\`) in root are runtime data — ignore for code tasks

### Architecture Decision Records
| Decision | Rationale |
|---|---|
| Dual backend (TS + Go) | Go handles CPU-heavy vector ops; TS handles AI sessions |
| SQLite + JSON files | Zero-infra local persistence for desktop app |
| Electron wrapper | Cross-platform desktop distribution |
| Vite + React 19 | Fast dev cycle, concurrent rendering |
| Zustand | Minimal boilerplate state management |
| gorilla/websocket | High-perf live relay for real-time multimodal sessions |

---
`;
}

// ─────────────────────────────────────────────────────────────
// SECTION 11 — TESTING
// ─────────────────────────────────────────────────────────────
function genTesting() {
  const testFiles = [];
  for (const filePath of walkDir(ROOT, IGNORE)) {
    const base = path.basename(filePath);
    if (
      base.includes('.test.') || base.includes('.spec.') ||
      base.endsWith('_test.go') || filePath.includes('__tests__')
    ) {
      testFiles.push(path.relative(ROOT, filePath));
    }
  }

  let testSection = '';
  if (testFiles.length === 0) {
    testSection = `> No test files detected. Consider adding:
> - \`src/__tests__/\` — React component tests (Jest + React Testing Library)
> - \`server-golang/**/*_test.go\` — Go unit tests`;
  } else {
    testSection = '| Test File | Framework |\n|---|---|\n';
    for (const f of testFiles) {
      const fw = f.endsWith('_test.go') ? 'Go test' : f.includes('.spec.') ? 'Jest/Vitest' : 'Jest';
      testSection += `| \`${f}\` | ${fw} |\n`;
    }
  }

  const lcov = readFile(path.join(ROOT, 'coverage', 'lcov.info'));
  let coverageSection = '';
  if (lcov) {
    const lines = lcov.split('\n').filter(l => l.startsWith('LH:') || l.startsWith('LF:'));
    let found = 0, hit = 0;
    for (const l of lines) {
      if (l.startsWith('LF:')) found += parseInt(l.slice(3));
      if (l.startsWith('LH:')) hit += parseInt(l.slice(3));
    }
    const pct = found > 0 ? ((hit / found) * 100).toFixed(1) : '0';
    coverageSection = `\n### Coverage Report (lcov.info)\n| Metric | Value |\n|---|---|\n| **Lines Found** | ${found} |\n| **Lines Hit** | ${hit} |\n| **Coverage** | ${pct}% |`;
  }

  return `## 10. Testing & Quality

### Test Files
${testSection}
${coverageSection}

---
`;
}

// ─────────────────────────────────────────────────────────────
// MAIN — ASSEMBLE & WRITE
// ─────────────────────────────────────────────────────────────
async function main() {
  console.log('MAHR Blueprint Generator — starting...');

  const sections = [
    genHeader,
    genArchitecture,
    genMetrics,
    genDependencies,
    genGitAndTodos,
    genBackendAPI,
    genDatabase,
    genFrontend,
    genCICD,
    genAgentReference,
    genTesting,
  ];

  let output = '';
  for (const section of sections) {
    try {
      console.log(`  -> ${section.name}...`);
      output += section();
    } catch (err) {
      console.warn(`  WARNING: ${section.name} failed: ${err.message}`);
      output += `\n> Section \`${section.name}\` failed to generate: ${err.message}\n\n`;
    }
  }

  output += `---\n*Blueprint generated by \`scripts/generate-blueprint.mjs\` — ${new Date().toISOString()}*\n`;

  fs.writeFileSync(OUTPUT, output, 'utf-8');
  const size = fmtBytes(Buffer.byteLength(output, 'utf-8'));
  console.log(`\nBlueprint written to: project-blueprint.md (${size})`);
}

main().catch(err => {
  console.error('Blueprint generation failed:', err);
  process.exit(1);
});
