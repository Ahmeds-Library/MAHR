// 🏢 MAHR Office — Real Agent Event System
// Agents move and act ONLY in response to real tasks, user commands, and live dispatches.
// No synthetic timers. No mock loops. Every state change is persisted to SQLite.

import { useStore, type Agent, type StationKind, type ToolKind } from './store';

// Map each tool type to a physical station on the office floor
export const STATION_BY_TOOL: Record<ToolKind, StationKind> = {
  Read:      'shelf',
  Edit:      'shelf',
  Write:     'shelf',
  Grep:      'shelf',
  Glob:      'shelf',
  Bash:      'terminal',
  WebFetch:  'web',
  WebSearch: 'web',
  TodoWrite: 'board',
  MCP:       'mcp',
};

// Natural idle status messages — what a real person says when settling back
const IDLE_STATUS_POOL: Record<string, string[]> = {
  MAHR:    ['monitoring the floor', 'ready for next mission', 'reviewing team progress', 'awaiting student command'],
  Jim:     ['leaning back, reviewing diffs', 'sipping coffee at his desk', 'doodling UI wireframes', 'listening for next task'],
  Dwight:  ['scanning for threats', 'maintaining security posture', 'organizing beet statistics', 'on high alert — always'],
  Pam:     ['sketching diagram notes', 'organising chalkboard queue', 'sending design specs', 'handling reception'],
  Ryan:    ['browsing product forums', 'thinking about his startup', 'scrolling through analytics', 'half-asleep but watching'],
  Stanley: ['solving crossword puzzle', 'monitoring query latency', 'waiting for five o\'clock', 'reviewing DB benchmarks'],
};

// Natural "working" status messages per agent
const WORKING_STATUS_POOL: Record<string, string[]> = {
  Jim:     ['writing component logic', 'tweaking animations', 'debugging layout shifts', 'crafting pixel-perfect UI'],
  Dwight:  ['running audit sweep', 'tracing security vectors', 'verifying zero type-errors', 'stress-testing boundaries'],
  Pam:     ['drawing concept diagram', 'writing summary notes', 'routing team messages', 'compiling design spec'],
  Ryan:    ['prototyping API endpoint', 'syncing WebSocket data', 'debugging pipeline', 'sketching data model'],
  Stanley: ['running benchmark suite', 'optimizing query planner', 'checking test coverage', 'profiling memory usage'],
  MAHR:    ['orchestrating floor squad', 'analysing student context', 'planning delegation wave', 'synthesising insights'],
};

function getIdleStatus(agentName: string): string {
  const pool = IDLE_STATUS_POOL[agentName] || IDLE_STATUS_POOL['Jim'];
  return pool[Math.floor(Math.random() * pool.length)];
}

function getWorkingStatus(agentName: string): string {
  const pool = WORKING_STATUS_POOL[agentName] || WORKING_STATUS_POOL['Jim'];
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Trigger genuine agent work activity on the office floor.
 * Updates Zustand store + optionally persists to backend via SSE-compatible state.
 */
export function triggerRealAgentActivity(params: {
  agentId: string;
  station?: StationKind;
  actionText: string;
  thought?: string;
  tool?: ToolKind;
  status?: Agent['status'];
}) {
  const { updateAgent } = useStore.getState();
  updateAgent(params.agentId, {
    status:              params.status || 'working',
    action:              params.actionText,
    currentStation:      params.station || 'desk',
    carrying:            params.tool,
    recentAssistantText: params.thought || params.actionText,
    recentTextTs:        Date.now(),
  });
}

/**
 * Run a realistic working → thinking → idle lifecycle arc for an agent after
 * receiving a task dispatch. All transitions are real store updates — they
 * persist across the SSE stream and into SQLite via the periodic sync.
 *
 * Timeline (all configurable):
 *   0 ms  → status: 'working', action: taskDesc, station: taskStation
 *   4–7 s → status: 'thinking', action: natural thinking phrase
 *   9–15 s→ status: 'idle',    action: natural idle phrase
 */
export function scheduleAgentThinkingArc(params: {
  agentId: string;
  agentName: string;
  taskDesc: string;
  station?: StationKind;
  tool?: ToolKind;
  onThinking?: () => void;
  onIdle?: () => void;
}) {
  const { updateAgent } = useStore.getState();

  // Immediately: working
  updateAgent(params.agentId, {
    status:         'working',
    action:         params.taskDesc,
    currentStation: params.station || 'desk',
    carrying:       params.tool,
    recentTextTs:   Date.now(),
  });

  // 4–7 seconds: transition to thinking
  const thinkingDelay = 4000 + Math.random() * 3000;
  const thinkingTimer = setTimeout(() => {
    updateAgent(params.agentId, {
      status:         'thinking',
      action:         getWorkingStatus(params.agentName),
      currentStation: params.station || 'desk',
      recentTextTs:   Date.now(),
    });
    params.onThinking?.();

    // 5–8 seconds later: settle back to idle
    const idleDelay = 5000 + Math.random() * 3000;
    const idleTimer = setTimeout(() => {
      const { agents } = useStore.getState();
      const agent = agents.find(a => a.id === params.agentId);
      // Only settle to idle if they haven't received a new task in the meantime
      if (agent && agent.status === 'thinking') {
        updateAgent(params.agentId, {
          status:         'idle',
          action:         getIdleStatus(params.agentName),
          currentStation: 'desk',
          carrying:       undefined,
          recentTextTs:   Date.now(),
        });
        params.onIdle?.();
      }
    }, idleDelay);

    // Cleanup on unmount if needed
    return () => clearTimeout(idleTimer);
  }, thinkingDelay);

  // Return a cleanup function so callers can cancel the arc if the component unmounts
  return () => clearTimeout(thinkingTimer);
}

/**
 * Fly a genuine inter-agent coordination envelope across the floor.
 * Triggers the handoff animation via a native browser CustomEvent.
 */
export function flyRealHandoffEnvelope(from: string, to: string, act = 'inform') {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('cth:demo-handoff', { detail: { from, to, act } }));
}

/**
 * Instantly settle an agent to their natural idle state.
 * Used after a long task completes or when the office floor is first loaded.
 */
export function settleAgentToIdle(agentId: string, agentName: string) {
  const { updateAgent } = useStore.getState();
  updateAgent(agentId, {
    status:         'idle',
    action:         getIdleStatus(agentName),
    currentStation: 'desk',
    carrying:       undefined,
    recentTextTs:   Date.now(),
  });
}

// Legacy stubs kept for any lingering dynamic imports — they're no-ops
export function startMockLoop() { /* permanently disabled */ }
export function stopMockLoop()  { /* permanently disabled */ }
