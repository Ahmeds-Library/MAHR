// 🏢 MAHR Office — Electron / Web Universal Bridge Adapter
// Ensures window.cth is available across both native Electron and web preview environments

export interface DefaultConfigType {
  onboardingComplete: boolean;
  audience?: 'technical' | 'non-technical';
  autoMode: boolean;
  tvShowOffices: boolean;
  officeTheme: string;
  freeflowEnabled: boolean;
  groqApiKey?: string;
  terminalTheme: 'dark' | 'light';
  godName?: string;
}

const STORAGE_KEY_CONFIG = 'mahr_office_config_v1';
const STORAGE_KEY_ROSTER = 'mahr_office_roster_v1';
const STORAGE_KEY_TASKS = 'mahr_office_tasks_v1';

export function getStoredConfig(): DefaultConfigType {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  return {
    onboardingComplete: true,
    audience: 'technical',
    autoMode: true,
    tvShowOffices: true,
    officeTheme: 'office',
    freeflowEnabled: false,
    terminalTheme: 'dark',
    godName: 'MAHR'
  };
}

export function saveStoredConfig(cfg: Partial<DefaultConfigType>): DefaultConfigType {
  const current = getStoredConfig();
  const updated = { ...current, ...cfg };
  try {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(updated));
  } catch {}
  return updated;
}

export function getStoredTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TASKS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  return [];
}

export function initOfficeBridge() {
  if (typeof window === 'undefined') return;

  const existingCth = (window as unknown as { cth?: Record<string, unknown> }).cth;

  const baseCth: Record<string, any> = {
    getConfig: async () => getStoredConfig(),
    updateConfig: async (patch: Partial<DefaultConfigType>) => saveStoredConfig(patch),
    setAgentTokenCap: async () => getStoredConfig(),
    ensureHarnessHome: async () => ({ ok: true }),
    changeHome: async () => ({ ok: true }),

    listDir: async (root?: string, rel?: string) => {
      try {
        const query = new URLSearchParams({ root: root || '', rel: rel || '' });
        const res = await fetch(`/api/office/list-dir?${query.toString()}`);
        if (res.ok) return await res.json();
      } catch {}
      return { ok: true, entries: [], path: rel || '' };
    },
    readFile: async (root?: string, rel?: string) => {
      try {
        const query = new URLSearchParams({ root: root || '', rel: rel || '' });
        const res = await fetch(`/api/office/read-file?${query.toString()}`);
        if (res.ok) return await res.json();
      } catch {}
      return { ok: false, error: 'Could not read file', content: '', path: rel || '', size: 0 };
    },
    readBinary: async () => ({ ok: false, error: 'Not available in browser' }),
    writeFile: async (root?: string, rel?: string, content?: string) => {
      try {
        const res = await fetch('/api/office/write-file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ root, rel, content })
        });
        if (res.ok) return await res.json();
      } catch {}
      return { ok: false, error: 'Could not write file', path: rel || '' };
    },
    statAbs: async (p: string) => ({ exists: false, isFile: false, path: p }),

    rosterReadSync: () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY_ROSTER);
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    },
    harnessHomeSync: () => 'mahr-office-workspace',
    rosterWrite: async (snap: unknown) => {
      try {
        localStorage.setItem(STORAGE_KEY_ROSTER, JSON.stringify(snap));
        return { ok: true };
      } catch (e: unknown) {
        return { ok: false, error: String(e) };
      }
    },

    // 📋 Hive Tasks & Ledger connected to MAHR database
    hiveTasks: async () => {
      try {
        const res = await fetch('/api/office/state');
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.tasks)) {
            return { ok: true, tasks: data.tasks };
          }
        }
      } catch {}
      return { ok: true, tasks: getStoredTasks() };
    },
    hiveBoard: async () => {
      try {
        const res = await fetch('/api/office/state');
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.tasks)) {
            return { ok: true, tasks: data.tasks };
          }
        }
      } catch {}
      return { ok: true, tasks: getStoredTasks() };
    },
    hiveLog: async () => {
      try {
        const res = await fetch('/api/office/state');
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.terminal)) {
            return data.terminal;
          }
        }
      } catch {}
      return [];
    },
    hiveMemory: async () => {
      try {
        const res = await fetch('/api/memories');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            return data.slice(-10).map((m: any) => `[${m.category}] ${m.text}`).join('\n');
          }
        }
      } catch {}
      return 'Cognitive hive memory synchronized with classroom chalkboard.';
    },
    hiveRegistry: async () => [],
    hiveSend: async () => ({ ok: true }),
    onHiveMessage: (_cb: any) => () => {},
    onHiveTaskChange: (_cb: any) => () => {},

    // 🖥️ PTY Terminal & Execution
    openTerminal: async () => ({ ok: true }),
    sendPtyData: () => {},
    resizePty: () => {},
    closePty: () => {},
    listPty: async () => [],
    spawnPty: async () => ({ ok: true, id: `pty-${Date.now()}` }),
    killPty: async () => ({ ok: true }),
    onPtyData: () => () => {},
    onPtyExit: () => () => {},

    // 🐙 Git & VCS (Real repository inspection)
    gitIsRepo: async (cwd?: string) => {
      try {
        const q = new URLSearchParams({ cwd: cwd || '' });
        const res = await fetch(`/api/office/git/status?${q.toString()}`);
        if (res.ok) {
          const data = await res.json();
          return !!data.isRepo;
        }
      } catch {}
      return true;
    },
    gitBranch: async (cwd?: string) => {
      try {
        const q = new URLSearchParams({ cwd: cwd || '' });
        const res = await fetch(`/api/office/git/status?${q.toString()}`);
        if (res.ok) {
          const data = await res.json();
          const cur = data.branch || 'main';
          return { current: cur, detached: cur === 'HEAD' };
        }
      } catch {}
      return { current: 'main', detached: false };
    },
    gitStatus: async (cwd?: string) => {
      try {
        const q = new URLSearchParams({ cwd: cwd || '' });
        const res = await fetch(`/api/office/git/status?${q.toString()}`);
        if (res.ok) {
          const data = await res.json();
          return { staged: data.staged || [], unstaged: data.unstaged || [], untracked: data.untracked || [] };
        }
      } catch {}
      return { staged: [], unstaged: [], untracked: [] };
    },
    gitLog: async (cwd?: string, limit = 50) => {
      try {
        const q = new URLSearchParams({ cwd: cwd || '', limit: String(limit) });
        const res = await fetch(`/api/office/git/log?${q.toString()}`);
        if (res.ok) {
          const data = await res.json();
          return data.commits || [];
        }
      } catch {}
      return [];
    },
    gitBranches: async (cwd?: string) => {
      try {
        const q = new URLSearchParams({ cwd: cwd || '' });
        const res = await fetch(`/api/office/git/branches?${q.toString()}`);
        if (res.ok) {
          const data = await res.json();
          return data.branches || { local: ['main'], remote: [] };
        }
      } catch {}
      return { local: ['main'], remote: [] };
    },
    gitAheadBehind: async (cwd?: string) => {
      try {
        const q = new URLSearchParams({ cwd: cwd || '' });
        const res = await fetch(`/api/office/git/ahead-behind?${q.toString()}`);
        if (res.ok) {
          const data = await res.json();
          return { ahead: data.ahead || 0, behind: data.behind || 0, upstream: data.upstream || null };
        }
      } catch {}
      return { ahead: 0, behind: 0, upstream: null };
    },

    // 🔄 App & Updates
    appInfo: async () => ({ version: '2.4.0', changelog: 'MAHR Office Multi-Agent Floor' }),
    updateCurrent: async () => ({ state: 'idle' }),
    updateRestartAndInstall: async () => ({ ok: true }),
    updateCheckNow: async () => ({ ok: true }),
    updateDownload: async () => ({ ok: true }),
    updateOpenRelease: async () => ({ ok: true }),
    platform: 'linux',
    arch: 'x64',

    cancelClose: () => {},
    confirmClose: async () => {},

    onUpdateStatus: () => () => {},
    onRealtimeFloorDelta: () => () => {},
    onRealtimeEnqueue: () => () => {},
    onRealtimeStatus: () => () => {},

    realtimeHasOpenAiKey: async () => false,
    realtimeStart: async () => {},
    realtimeStop: async () => {},
    realtimeToggle: async () => {},

    getGodStatus: async () => 'active',
    controlSnapshot: async () => ({ ok: true }),
    controlAutoDelivery: async () => ({ ok: true }),
    historyAdd: async () => ({ ok: true }),
    memoryStatus: async () => ({
      ok: true,
      available: true,
      enabled: true,
      active: true,
      initialized: true,
      palacePath: '/mahr/knowledge/vectors',
      model: 'minilm' as const,
      bin: 'sqlite-vector-v2'
    }),
    searchMemory: async (query: string) => {
      try {
        const res = await fetch('/api/vector-memory/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: query || '' })
        });
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.topMatches) && data.topMatches.length > 0) {
            const output = data.topMatches
              .map((m: any) => `[${(m.similarity * 100).toFixed(0)}% match] ${m.node?.label || m.node?.name}: ${m.node?.description || ''}`)
              .join('\n\n');
            return { ok: true, output, results: data.topMatches };
          }
        }
        // Fallback to text match on /api/memories
        const memRes = await fetch('/api/memories');
        if (memRes.ok) {
          const memories = await memRes.json();
          const q = (query || '').toLowerCase();
          const matches = memories.filter((m: any) => 
            (m.text || '').toLowerCase().includes(q) || (m.category || '').toLowerCase().includes(q)
          );
          if (matches.length > 0) {
            return {
              ok: true,
              output: matches.map((m: any) => `• [${m.category}] ${m.text}`).join('\n\n'),
              results: matches
            };
          }
        }
        return { ok: true, output: `No direct memory matches found for "${query}".` };
      } catch (err: any) {
        return { ok: false, error: err.message };
      }
    },
    textSearch: async () => [],
    githubIssues: async () => [],
    resolveSessionCwd: async () => null,
    chooseFolder: async () => null,
    importHireFiles: async () => [],
    openExternal: async () => ({ ok: true }),
    openTerminalAt: async () => ({ ok: true }),

    ...(existingCth || {})
  };

  // Safe Proxy wrapper: Prevents any "window.cth.<method> is not a function" crash
  const proxyCth = new Proxy(baseCth, {
    get(target, prop: string) {
      if (prop in target) {
        return target[prop];
      }
      if (prop.startsWith('on')) {
        return () => () => {};
      }
      if (prop.endsWith('Sync')) {
        return () => null;
      }
      return async () => ({ ok: true, tasks: [], entries: [] });
    }
  });

  (window as unknown as { cth: typeof proxyCth }).cth = proxyCth;
}

// Ensure bridge is initialized immediately on import
if (typeof window !== 'undefined') {
  initOfficeBridge();
}
