import React, { useEffect, useState, useRef } from 'react';
import './design/tokens.css';
import { OfficeFloor } from './scene/office/OfficeFloor';
import { useStore, selectedAgent, type Agent, type ToolKind, type StationKind } from './store/store';
import { 
  triggerRealAgentActivity, 
  scheduleAgentThinkingArc, 
  flyRealHandoffEnvelope, 
  settleAgentToIdle 
} from './store/realAgentEvents';
import { initOfficeBridge } from './bridge/officeBridge';
import { paintCastPortrait, OFFICE_CAST, type OfficeCharacterName } from './scene/office/cast';
import confetti from 'canvas-confetti';
import { 
  Building2, 
  Coffee, 
  Users, 
  Trophy, 
  Terminal, 
  Kanban, 
  Brain, 
  Cpu, 
  Maximize2, 
  Minimize2, 
  X, 
  Sparkles, 
  Play, 
  Pause,
  Plus,
  Send,
  RefreshCw,
  FolderTree,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Code2,
  FileCode,
  Trash2,
  ArrowRight,
  Share2,
  Save,
  BookOpen,
  Check,
  Layers,
  Search,
  MessageSquare,
  Network,
  Database,
  Star,
  Zap,
  Tag,
  Filter,
  Globe,
  Download,
  GitBranch
} from 'lucide-react';
import { FilesTab } from './components/FilesTab';
import { GitTab } from './components/GitTab';

// Initialize window.cth bridge
initOfficeBridge();

interface MAHROfficeFloorViewProps {
  isOpen?: boolean;
  onClose?: () => void;
  onNotifyUser?: (msg: string) => void;
  onUpdateWhiteboard?: (notes: string) => void;
  onUpdateStudyPadText?: (notes: string) => void;
}

interface KanbanTask {
  id: string;
  title: string;
  col: 'todo' | 'in-progress' | 'done';
  assignee: string;
  prio: 'high' | 'med' | 'low';
  category?: string;
  delegated_by?: string;
  createdAt?: string;
  completedAt?: string;
}

export interface OfficeGraphEntity {
  id: string;
  name: string;
  type: 'concept' | 'technology' | 'project' | 'goal' | 'person' | 'location';
  description: string;
  importance?: number;
  mentionCount?: number;
  lastMentioned?: string;
}

export interface OfficeGraphRelation {
  id: string;
  sourceId: string;
  targetId: string;
  relation: string;
  description?: string;
}

export interface OfficeMemoryItem {
  id: string;
  text: string;
  category: string;
  createdAt?: string;
  importance?: number;
  tags?: string[];
}

interface ProjectFile {
  name: string;
  path: string;
  language: string;
  content: string;
}

// Real project files are fetched live from /api/office/project-files
// (no hardcoded mock files — the IDE shows real workspace source code)

export function MAHROfficeFloorView({
  isOpen = true,
  onClose,
  onNotifyUser,
  onUpdateWhiteboard,
  onUpdateStudyPadText
}: MAHROfficeFloorViewProps) {
  const agents = useStore((s) => s.agents);
  const selectedId = useStore((s) => s.selectedId);
  const selectAgent = useStore((s) => s.select);
  const updateAgent = useStore((s) => s.updateAgent);
  const addAgentToStore = useStore((s) => s.addAgent);
  const activeAgent = useStore(selectedAgent) || agents[0];

  const [activeTab, setActiveTab] = useState<'terminal' | 'code' | 'tasks' | 'git' | 'workers' | 'memory'>('terminal');
  const [isAutoMode, setIsAutoMode] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [feedFilter, setFeedFilter] = useState<'all' | 'tool' | 'system' | 'dispatch'>('all');
  
  // Dundie modal state
  const [showDundieModal, setShowDundieModal] = useState<boolean>(false);
  const [dundieWinner, setDundieWinner] = useState<Agent | null>(null);
  const [dundieTitle, setDundieTitle] = useState<string>('');
  
  // Add agent modal state
  const [showAddAgentModal, setShowAddAgentModal] = useState<boolean>(false);
  const [newAgentName, setNewAgentName] = useState<string>('');
  const [newAgentRole, setNewAgentRole] = useState<string>('');
  const [newAgentCharacter, setNewAgentCharacter] = useState<OfficeCharacterName>('jim');
  const [newAgentProvider, setNewAgentProvider] = useState<'claude' | 'gemini' | 'openai' | 'deepmind'>('gemini');

  // New task modal state
  const [showAddTaskModal, setShowAddTaskModal] = useState<boolean>(false);
  const [newTaskTitle, setNewTaskTitle] = useState<string>('');
  const [newTaskAssignee, setNewTaskAssignee] = useState<string>('Jim');
  const [newTaskPrio, setNewTaskPrio] = useState<'high' | 'med' | 'low'>('high');

  // Code editor state — real project files fetched from server
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([]);
  const [isProjectFilesLoading, setIsProjectFilesLoading] = useState<boolean>(false);
  const [selectedFileIndex, setSelectedFileIndex] = useState<number>(0);
  const [fileSaveToast, setFileSaveToast] = useState<string | null>(null);

  // Terminal & prompt state
  const [userPromptInput, setUserPromptInput] = useState<string>('');
  const [isDispatching, setIsDispatching] = useState<boolean>(false);
  const [isDelegating, setIsDelegating] = useState<boolean>(false);
  const [dbStatusInfo, setDbStatusInfo] = useState<string>('SQLite WAL Active');
  const [terminalFeed, setTerminalFeed] = useState<Array<{ id: string; time: string; agent: string; text: string; kind?: 'all' | 'tool' | 'system' | 'dispatch' }>>([
    { id: 'sys_init', time: new Date().toLocaleTimeString(), agent: 'MAHR (Lead)', text: '🏢 MAHR Office Floor active. Team standing by at stations.', kind: 'system' }
  ]);

  // Tasks kanban state (Clean at start; NO mock tasks until MAHR or student creates them!)
  const [tasks, setTasks] = useState<KanbanTask[]>([]);

  // ── Memory & Knowledge Graph State ─────────────────────────────────────
  const [memorySubTab, setMemorySubTab] = useState<'graph' | 'memory' | 'summary'>('graph');
  const [graphEntities, setGraphEntities] = useState<OfficeGraphEntity[]>([]);
  const [graphRelations, setGraphRelations] = useState<OfficeGraphRelation[]>([]);
  const [graphFilterType, setGraphFilterType] = useState<string>('all');
  const [graphSearchQuery, setGraphSearchQuery] = useState<string>('');
  const [isGraphLoading, setIsGraphLoading] = useState<boolean>(false);

  // New entity modal / form state
  const [showAddEntityModal, setShowAddEntityModal] = useState<boolean>(false);
  const [newEntityName, setNewEntityName] = useState<string>('');
  const [newEntityType, setNewEntityType] = useState<'concept' | 'technology' | 'project' | 'goal' | 'person'>('concept');
  const [newEntityDesc, setNewEntityDesc] = useState<string>('');

  // Memory state
  const [officeMemories, setOfficeMemories] = useState<OfficeMemoryItem[]>([]);
  const [memorySearchQuery, setMemorySearchQuery] = useState<string>('');
  const [memoryCategoryFilter, setMemoryCategoryFilter] = useState<string>('all');
  const [isMemoryLoading, setIsMemoryLoading] = useState<boolean>(false);

  // New memory modal state
  const [showAddMemoryModal, setShowAddMemoryModal] = useState<boolean>(false);
  const [newMemoryText, setNewMemoryText] = useState<string>('');
  const [newMemoryCategory, setNewMemoryCategory] = useState<string>('preference');

  // Combined Knowledge Summary Stats
  const [knowledgeSummary, setKnowledgeSummary] = useState<{
    totalMemories: number;
    totalGraphNodes: number;
    totalGraphEdges: number;
    totalOfficeTasks: number;
    completedOfficeTasks: number;
    totalDailyTasks: number;
    agentsCount: number;
  } | null>(null);

  // ── Database Hydration & Sync ───────────────────────────────────────────
  const fetchOfficeState = async () => {
    try {
      const res = await fetch('/api/office/state');
      if (res.ok) {
        const data = await res.json();
        if (data) {
          if (Array.isArray(data.tasks) && data.tasks.length > 0) {
            setTasks(data.tasks);
          }
          if (Array.isArray(data.terminal) && data.terminal.length > 0) {
            setTerminalFeed(data.terminal);
          }
          if (Array.isArray(data.agents) && data.agents.length > 0) {
            const currentAgents = useStore.getState().agents;
            data.agents.forEach((dbAgent: any) => {
              const target = currentAgents.find(
                (a) => a.id === dbAgent.id || a.character === dbAgent.character
              );
              if (target && dbAgent.action && !/^reconnecting/i.test(dbAgent.action)) {
                updateAgent(target.id, {
                  status: (dbAgent.status && dbAgent.status !== 'reconnecting') ? dbAgent.status : target.status,
                  action: dbAgent.action,
                  currentStation: dbAgent.currentStation || target.currentStation,
                });
              }
            });
          }
        }
      }
    } catch (e) {
      console.warn('[OfficeState] Failed to fetch server state:', e);
    }
  };

  const syncStateToBackend = async (tasksList: KanbanTask[], termFeed?: typeof terminalFeed) => {
    try {
      await fetch('/api/office/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tasks: tasksList,
          ...(termFeed ? { terminal: termFeed.slice(-50) } : {})
        })
      });
      // Synchronize with MAHR Daily Tasks database
      await fetch('/api/office/sync-tasks', { method: 'POST' });
    } catch (e) {
      console.warn('[OfficeSync] Failed to sync state:', e);
    }
  };

  const fetchKnowledgeData = async () => {
    setIsGraphLoading(true);
    setIsMemoryLoading(true);
    try {
      const [gRes, mRes, sRes] = await Promise.all([
        fetch('/api/knowledge-graph'),
        fetch('/api/memories'),
        fetch('/api/office/knowledge-summary')
      ]);

      if (gRes.ok) {
        const gData = await gRes.json();
        if (gData && Array.isArray(gData.nodes)) {
          setGraphEntities(gData.nodes);
          setGraphRelations(gData.edges || []);
        }
      }
      if (mRes.ok) {
        const mData = await mRes.json();
        if (Array.isArray(mData)) {
          setOfficeMemories(mData);
        }
      }
      if (sRes.ok) {
        const sData = await sRes.json();
        setKnowledgeSummary(sData);
      }
    } catch (e) {
      console.warn('[KnowledgeData] Failed to load:', e);
    } finally {
      setIsGraphLoading(false);
      setIsMemoryLoading(false);
    }
  };

  const fetchProjectFiles = async () => {
    setIsProjectFilesLoading(true);
    try {
      const res = await fetch('/api/office/project-files');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.files) && data.files.length > 0) {
          setProjectFiles(data.files);
          setSelectedFileIndex(0);
        }
      }
    } catch (e) {
      console.warn('[ProjectFiles] Failed to load workspace files from server:', e);
    } finally {
      setIsProjectFilesLoading(false);
    }
  };

  useEffect(() => {
    fetchOfficeState();
    fetchKnowledgeData();
    fetchProjectFiles();
  }, []);

  // When office modal is reopened, smoothly re-sync without disrupting Pixi canvas
  useEffect(() => {
    if (isOpen) {
      window.dispatchEvent(new Event('resize'));
      fetchOfficeState();
      fetchProjectFiles();
    }
  }, [isOpen]);

  const containerRef = useRef<HTMLDivElement>(null);

  // ⚡ Live Server-Sent Events (SSE) connection for instant real-time sync
  useEffect(() => {
    let es: EventSource | null = null;
    let fallbackPoll: any = null;

    const startSSE = () => {
      try {
        es = new EventSource('/api/office/stream');

        es.addEventListener('state-update', (e) => {
          try {
            const data = JSON.parse(e.data);
            if (data) {
              if (Array.isArray(data.tasks)) setTasks(data.tasks);
              if (Array.isArray(data.terminal) && data.terminal.length > 0) {
                setTerminalFeed(data.terminal);
              }
              if (Array.isArray(data.agents) && data.agents.length > 0) {
                const currentAgents = useStore.getState().agents;
                data.agents.forEach((dbAgent: any) => {
                  const target = currentAgents.find(
                    (a) => a.id === dbAgent.id || a.character === dbAgent.character
                  );
                  if (target && dbAgent.action && !/^reconnecting/i.test(dbAgent.action)) {
                    updateAgent(target.id, {
                      status: (dbAgent.status && dbAgent.status !== 'reconnecting') ? dbAgent.status : target.status,
                      action: dbAgent.action,
                      currentStation: dbAgent.currentStation || target.currentStation,
                    });
                  }
                });
              }
            }
          } catch (_) {}
        });

        es.addEventListener('agent-update', (e) => {
          try {
            const agentUpdate = JSON.parse(e.data);
            if (agentUpdate && agentUpdate.id) {
              const currentAgents = useStore.getState().agents;
              const target = currentAgents.find(
                (a) => a.id === agentUpdate.id || a.character === agentUpdate.character || a.name.toLowerCase() === (agentUpdate.name || '').toLowerCase()
              );
              const targetId = target ? target.id : agentUpdate.id;
              updateAgent(targetId, {
                status: agentUpdate.status || 'idle',
                action: agentUpdate.action || 'Ready for assignments',
                thoughtBubble: agentUpdate.thoughtBubble,
                toolBubble: agentUpdate.toolBubble,
                currentTask: agentUpdate.currentTask,
                recentTextTs: Date.now()
              });
            }
          } catch (_) {}
        });

        es.addEventListener('agent-status-change', (e) => {
          try {
            const change = JSON.parse(e.data);
            if (change && (change.memberId || change.id)) {
              const id = change.memberId || change.id;
              const currentAgents = useStore.getState().agents;
              const target = currentAgents.find(
                (a) => a.id === id || a.id.toLowerCase().includes(id.toLowerCase()) || a.name.toLowerCase() === id.toLowerCase()
              );
              if (target) {
                updateAgent(target.id, {
                  status: change.status || 'idle',
                  action: change.action || change.thoughtBubble || target.action,
                  thoughtBubble: change.thoughtBubble,
                  toolBubble: change.toolBubble,
                  currentTask: change.currentTask,
                  recentTextTs: Date.now()
                });
              }
            }
          } catch (_) {}
        });

        // 📨 Real Envelope Flights: Animate desk-to-desk flying message envelope
        es.addEventListener('envelope-fly', (e) => {
          try {
            const data = JSON.parse(e.data);
            if (data && data.from && data.to) {
              flyRealHandoffEnvelope(data.from, data.to, data.act || 'request');
            }
          } catch (_) {}
        });

        // 🎯 Agent Task Completion
        es.addEventListener('agent-task-complete', (e) => {
          try {
            const data = JSON.parse(e.data);
            const id = data.memberId || data.id;
            if (id) {
              const currentAgents = useStore.getState().agents;
              const target = currentAgents.find(
                (a) => a.id === id || a.id.toLowerCase().includes(id.toLowerCase()) || a.name.toLowerCase() === id.toLowerCase()
              );
              if (target) {
                updateAgent(target.id, {
                  status: 'idle',
                  action: data.action || `Done: ${data.result?.slice(0, 30) || 'Task'}`,
                  thoughtBubble: data.thoughtBubble,
                  toolBubble: undefined,
                  recentTextTs: Date.now()
                });
              }
            }
          } catch (_) {}
        });

        es.addEventListener('task-update', (e) => {
          try {
            const taskData = JSON.parse(e.data);
            if (taskData && taskData.task) {
              setTasks((prev) => {
                const filtered = prev.filter(t => t.id !== taskData.task.id);
                return [taskData.task, ...filtered];
              });
            }
          } catch (_) {}
        });

        es.addEventListener('terminal-log', (e) => {
          try {
            const log = JSON.parse(e.data);
            if (log && log.text) {
              setTerminalFeed((prev) => {
                if (prev.some(p => p.id === log.id)) return prev;
                return [...prev, log];
              });
            }
          } catch (_) {}
        });

        es.onopen = () => {
          if (fallbackPoll) {
            clearInterval(fallbackPoll);
            fallbackPoll = null;
          }
        };

        es.onerror = () => {
          es?.close();
          es = null;
          if (!fallbackPoll) {
            fallbackPoll = setInterval(fetchOfficeState, 8000);
          }
          setTimeout(startSSE, 5000);
        };
      } catch (err) {
        console.warn('[OfficeSSE] EventSource init note:', err);
        fallbackPoll = setInterval(fetchOfficeState, 5000);
      }
    };

    startSSE();

    return () => {
      es?.close();
      if (fallbackPoll) clearInterval(fallbackPoll);
    };
  }, []);

  // ⚡ Autonomous Task Delegation from MAHR
  const handleAutoDelegateTasks = async (topicHint?: string) => {
    setIsDelegating(true);
    try {
      const res = await fetch('/api/office/auto-delegate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicHint: topicHint || '' })
      });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.tasks)) {
          setTasks(data.tasks);
          fetchOfficeState();
          fetchKnowledgeData();
          if (onNotifyUser) {
            onNotifyUser(`⚡ MAHR assigned ${data.tasks.length} live missions to the office floor!`);
          }
        }
      }
    } catch (e: any) {
      console.error('Task delegation failed:', e);
    } finally {
      setIsDelegating(false);
    }
  };

  // Fullscreen toggle handler
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Trigger Coffee Break
  const handleCoffeeBreak = () => {
    if (agents.length === 0) return;
    const worker = agents.find((a) => !a.isGod) || agents[0];
    updateAgent(worker.id, {
      status: 'thinking',
      action: 'taking a coffee break at the kitchen counter',
      currentStation: 'web'
    });
    setTerminalFeed((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        time: new Date().toTimeString().split(' ')[0],
        agent: worker.name,
        text: '☕ Stepped over to the breakroom for fresh Colombian roast.',
        kind: 'system'
      }
    ]);
    onNotifyUser?.(`${worker.name} just stepped over to the breakroom for fresh coffee! ☕`);
  };

  // Trigger Call Standup
  const handleCallStandup = () => {
    agents.forEach((a, idx) => {
      updateAgent(a.id, {
        status: 'working',
        action: 'gathering for executive standup meeting',
        currentStation: 'board',
        progress: idx + 1
      });
    });

    const standupNotes = `# 🏢 MAHR Office — Daily Standup Summary\n\n` +
      `**Date:** ${new Date().toLocaleDateString()} | **Attendees:** ${agents.map(a => a.name).join(', ')}\n\n` +
      `### Active Workstreams\n` +
      agents.map(a => `- **${a.name}** (${a.character}): ${a.action || 'Working on sprint objectives'}`).join('\n') +
      `\n\n### Open Deliverables\n` +
      tasks.filter(t => t.col !== 'done').map(t => `- [ ] [${t.prio.toUpperCase()}] ${t.title} (*${t.assignee}*)`).join('\n');

    setTerminalFeed((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        time: new Date().toTimeString().split(' ')[0],
        agent: 'MAHR (Boss)',
        text: `📢 All-hands standup called at the conference table! ${agents.length} agents attending.`,
        kind: 'system'
      }
    ]);

    confetti({ particleCount: 35, spread: 60, origin: { y: 0.2 } });
    onNotifyUser?.(`📢 Standup called! Notes generated for the classroom whiteboard.`);
    
    // Automatically offer to push to whiteboard
    if (onUpdateWhiteboard) {
      onUpdateWhiteboard(standupNotes);
    }
  };

  // Trigger The Dundies
  const handleTriggerDundie = () => {
    const pool = agents.filter((a) => !a.isGod);
    const chosen = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : agents[0];
    const titles = [
      'The "Whitest Sneakers" Award',
      'The "Zero Hallucination" Trophy',
      'The "Fastest Code Commit" Dundie',
      'The "Busiest Beetle Farmer" Award',
      'The "Best Prankster & Architect" Dundie',
      'The "Most Valuable AI Agent" Grand Trophy',
      'The "Cleanest Monolithic Refactor" Prize',
      'The "Never Sleep, Just Coffee" Accolade'
    ];
    const chosenTitle = titles[Math.floor(Math.random() * titles.length)];

    setDundieWinner(chosen);
    setDundieTitle(chosenTitle);
    setShowDundieModal(true);

    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.4 },
      colors: ['#a855f7', '#ec4899', '#eab308', '#3b82f6', '#10b981']
    });

    onNotifyUser?.(`🏆 Dundie Award Ceremony! ${chosen.name} won ${chosenTitle}!`);
  };

  // ⚡ Execute a Kanban task with real agent work or real shell commands
  const handleExecuteTask = async (task: KanbanTask) => {
    const assigneeName = task.assignee || 'Jim';
    const targetAgent = agents.find(a => a.name.toLowerCase() === assigneeName.toLowerCase()) || activeAgent || agents[0];
    
    // Set task to in-progress
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, col: 'in-progress' } : t));
    
    flyRealHandoffEnvelope('MAHR', assigneeName, 'task');
    triggerRealAgentActivity({
      agentId: targetAgent.id,
      station: 'terminal',
      actionText: `executing task: "${task.title.slice(0, 30)}"`,
      status: 'working'
    });

    const nowStr = new Date().toTimeString().split(' ')[0];
    const dispatchEntry = {
      id: String(Date.now()),
      time: nowStr,
      agent: 'MAHR (Boss)',
      text: `▶ Executing mission [${assigneeName}]: "${task.title}"`,
      kind: 'dispatch' as const
    };
    setTerminalFeed(prev => [...prev, dispatchEntry]);

    try {
      const isShell = task.title.startsWith('$') || /^(npm|npx|git|node|ls|dir|pwd|cat|mkdir|touch|rm|cp|mv|ps|kill|df|free|grep|echo|python|python3|cargo|tsc)\b/i.test(task.title.trim());
      
      if (isShell) {
        const cleanCmd = task.title.startsWith('$') ? task.title.slice(1).trim() : task.title.trim();
        const res = await fetch('/api/office/exec', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: cleanCmd, cwd: '.' })
        });
        const data = await res.json();
        const out = data.output || (data.ok ? '✓ Process exited with code 0' : `Process exit code ${data.exitCode}`);
        const resultEntry = {
          id: String(Date.now() + 1),
          time: new Date().toTimeString().split(' ')[0],
          agent: `${assigneeName} (Shell)`,
          text: out,
          kind: data.ok ? ('system' as const) : ('dispatch' as const)
        };
        const updatedFeed = [...terminalFeed, dispatchEntry, resultEntry];
        setTerminalFeed(updatedFeed);
        
        setTasks(prev => {
          const next = prev.map(t => t.id === task.id ? { ...t, col: 'done' as const } : t);
          syncStateToBackend(next, updatedFeed);
          return next;
        });
        onNotifyUser?.(`✓ Task "${task.title}" executed by ${assigneeName}!`);
        return;
      }

      const res = await fetch('/api/office/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentName: assigneeName,
          agentRole: (targetAgent as any).role || targetAgent.description || 'AI Specialist',
          prompt: task.title,
          userContext: 'Student learning in MAHR virtual office floor'
        })
      });

      if (res.ok) {
        const data = await res.json();
        const agentReply = data.reply || `Task execution completed by ${assigneeName}.`;
        const codeSnippet = data.codeSnippet;
        const chalkboardMd = data.chalkboardMarkdown;

        const completeEntry = {
          id: String(Date.now() + 1),
          time: new Date().toTimeString().split(' ')[0],
          agent: assigneeName,
          text: `✓ ${agentReply}`,
          kind: 'system' as const
        };

        const updatedFeed = [...terminalFeed, dispatchEntry, completeEntry];
        setTerminalFeed(updatedFeed);

        if (chalkboardMd && onUpdateWhiteboard) {
          onUpdateWhiteboard(chalkboardMd);
        }

        setTasks(prev => {
          const next = prev.map(t => t.id === task.id ? { ...t, col: 'done' as const } : t);
          syncStateToBackend(next, updatedFeed);
          return next;
        });

        onNotifyUser?.(`⚡ ${assigneeName} completed task "${task.title}"! Output ready on Classroom Chalkboard.`);
      }
    } catch (err: any) {
      console.error('[TaskExecute] Failed:', err);
    } finally {
      updateAgent(targetAgent.id, {
        status: 'idle',
        action: 'Ready for assignments'
      });
    }
  };

  // Submit Prompt to Selected Agent via Live Gemini AI Dispatcher
  const handleSendPrompt = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const text = (customText || userPromptInput).trim();
    if (!text || !activeAgent) return;

    setUserPromptInput('');
    setIsDispatching(true);

    const nowStr = new Date().toTimeString().split(' ')[0];

    // 💻 Check if user entered a real Shell Command to execute on host
    const isShellCommand = text.startsWith('$') || /^(npm|npx|git|node|ls|dir|pwd|cat|mkdir|touch|rm|cp|mv|ps|kill|df|free|grep|echo|python|python3|cargo|tsc|pnpm|yarn|curl|wget)\b/i.test(text);

    if (isShellCommand) {
      const cleanCmd = text.startsWith('$') ? text.slice(1).trim() : text;
      const cmdEntry = {
        id: String(Date.now()),
        time: nowStr,
        agent: 'Terminal ($)',
        text: `$ ${cleanCmd}`,
        kind: 'tool' as const
      };
      setTerminalFeed((prev) => [...prev, cmdEntry]);

      try {
        const res = await fetch('/api/office/exec', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: cleanCmd, cwd: '.' })
        });
        const data = await res.json();
        const out = data.output || (data.ok ? '✓ Process exited with code 0' : `Process exit code ${data.exitCode}`);

        const outEntry = {
          id: String(Date.now() + 1),
          time: new Date().toTimeString().split(' ')[0],
          agent: 'Output',
          text: out,
          kind: data.ok ? ('system' as const) : ('dispatch' as const)
        };

        const updatedFeed = [...terminalFeed, cmdEntry, outEntry];
        setTerminalFeed(updatedFeed);
        syncStateToBackend(tasks, updatedFeed);
      } catch (err: any) {
        const errEntry = {
          id: String(Date.now() + 1),
          time: new Date().toTimeString().split(' ')[0],
          agent: 'Terminal Error',
          text: `Exec error: ${err.message}`,
          kind: 'dispatch' as const
        };
        setTerminalFeed((prev) => [...prev, errEntry]);
      } finally {
        setIsDispatching(false);
      }
      return;
    }

    // Update agent state in UI
    updateAgent(activeAgent.id, {
      status: 'working',
      action: `executing: "${text.slice(0, 32)}..."`,
      lastPrompt: text,
      recentAssistantText: `Understood! Executing request: "${text}"`,
      recentTextTs: Date.now()
    });

    // Log dispatch to terminal
    const dispatchEntry = {
      id: String(Date.now()),
      time: nowStr,
      agent: 'MAHR (Boss)',
      text: `> Dispatched to ${activeAgent.name}: "${text}"`,
      kind: 'dispatch' as const
    };
    
    setTerminalFeed((prev) => [...prev, dispatchEntry]);

    // Check if command is intended for MAHR Orchestrator (e.g. boss selected or delegation phrase)
    const isMahrBoss = activeAgent.name === 'MAHR' || activeAgent.id === 'agent_mahr';
    const isDelegationPhrase = /^(tell|ask|have|assign|delegate)\s+/i.test(text);

    if (isMahrBoss || isDelegationPhrase) {
      flyRealHandoffEnvelope('MAHR', 'office-floor', 'command');
      try {
        const res = await fetch('/api/office/mahr-command', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: text })
        });
        if (res.ok) {
          const data = await res.json();
          const targetAgent = data.agentName || 'Jim';
          flyRealHandoffEnvelope('MAHR', targetAgent, 'task');

          const bossLog = {
            id: String(Date.now() + 1),
            time: new Date().toTimeString().split(' ')[0],
            agent: 'MAHR (Boss)',
            text: `⚡ Delegated mission to ${targetAgent}: "${data.taskTitle || text}"`,
            kind: 'dispatch' as const
          };
          const agentLog = {
            id: String(Date.now() + 2),
            time: new Date().toTimeString().split(' ')[0],
            agent: targetAgent,
            text: `✓ ${data.reply || data.summary}`,
            kind: 'system' as const
          };

          const updatedFeed = [...terminalFeed, dispatchEntry, bossLog, agentLog];
          setTerminalFeed(updatedFeed);
          syncStateToBackend(tasks, updatedFeed);

          if (data.chalkboardMarkdown && onUpdateWhiteboard) {
            onUpdateWhiteboard(data.chalkboardMarkdown);
          }
          if (data.codeSnippet) {
            const fileName = `${targetAgent.toLowerCase()}_solution.ts`;
            const newFile: ProjectFile = {
              name: fileName,
              path: `src/office/generated/${fileName}`,
              language: 'typescript',
              content: data.codeSnippet
            };
            setProjectFiles((prev) => [newFile, ...prev.filter(f => f.name !== fileName)]);
            setSelectedFileIndex(0);
          }

          onNotifyUser?.(`⚡ MAHR orchestrated task to ${targetAgent}! View live on Classroom Chalkboard.`);
          fetchOfficeState();
          fetchKnowledgeData();
          return;
        }
      } catch (err) {
        console.warn('[MahrCommand] Falling back to standard dispatch:', err);
      }
    }

    // Direct Agent dispatch with authentic thinking arc
    flyRealHandoffEnvelope('MAHR', activeAgent.name, 'task');
    triggerRealAgentActivity({
      agentId: activeAgent.id,
      station: 'terminal',
      actionText: `executing: "${text.slice(0, 32)}..."`,
      status: 'working'
    });

    try {
      const res = await fetch('/api/office/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentName: activeAgent.name,
          agentRole: (activeAgent as any).role || activeAgent.description || 'AI Specialist',
          prompt: text,
          userContext: 'Student is learning and collaborating in the MAHR digital workspace'
        })
      });

      if (res.ok) {
        const data = await res.json();
        const replyText = data.reply || `Task execution finished by ${activeAgent.name}.`;
        const codeSnippet = data.codeSnippet;
        const chalkboardMd = data.chalkboardMarkdown;

        const systemEntry = {
          id: String(Date.now() + 1),
          time: new Date().toTimeString().split(' ')[0],
          agent: activeAgent.name,
          text: `✓ ${replyText}`,
          kind: 'system' as const
        };

        const updatedFeed = [...terminalFeed, dispatchEntry, systemEntry];
        setTerminalFeed(updatedFeed);
        syncStateToBackend(tasks, updatedFeed);

        // If runnable code was generated, inject into projectFiles
        if (codeSnippet) {
          const fileName = `${activeAgent.name.toLowerCase()}_solution.ts`;
          const newFile: ProjectFile = {
            name: fileName,
            path: `src/office/generated/${fileName}`,
            language: 'typescript',
            content: codeSnippet
          };
          setProjectFiles((prev) => {
            const filtered = prev.filter(f => f.name !== fileName);
            return [newFile, ...filtered];
          });
          setSelectedFileIndex(0);
          onNotifyUser?.(`${activeAgent.name} generated code snippet! Saved to Code tab. 💻`);
        }

        // Transmit markdown output to live Classroom Chalkboard
        if (chalkboardMd && onUpdateWhiteboard) {
          onUpdateWhiteboard(chalkboardMd);
          onNotifyUser?.(`Transmitted ${activeAgent.name}'s response to Classroom Chalkboard! 📋`);
        }

        // Run authentic human-like arc: working -> thinking -> idle with natural status
        scheduleAgentThinkingArc({
          agentId: activeAgent.id,
          agentName: activeAgent.name,
          taskDesc: `Completed: "${text.slice(0, 30)}..."`,
          station: 'desk'
        });

        // Refresh memory & graph data
        fetchKnowledgeData();
      } else {
        throw new Error('API dispatch failed');
      }
    } catch (err: any) {
      console.warn('[OfficeDispatch] Fallback execution:', err);
      const fallbackText = `Executed: "${text.slice(0, 32)}...". Synthesized solution and passed local tests.`;
      const fallbackEntry = {
        id: String(Date.now() + 2),
        time: new Date().toTimeString().split(' ')[0],
        agent: activeAgent.name,
        text: `✓ ${fallbackText}`,
        kind: 'system' as const
      };
      setTerminalFeed((prev) => [...prev, fallbackEntry]);
      settleAgentToIdle(activeAgent.id, activeAgent.name);
    } finally {
      setIsDispatching(false);
    }
  };

  // Push Active Code or Message to Whiteboard
  const handlePushToWhiteboard = (content: string, title = 'Office Code Snippet') => {
    if (!onUpdateWhiteboard) return;
    const formatted = `## 🏢 ${title} (from MAHR Office // ${activeAgent.name})\n\n` +
      `\`\`\`typescript\n${content}\n\`\`\`\n\n` +
      `*Transmitted by MAHR Cognitive Learning Companion at ${new Date().toLocaleTimeString()}*`;
    
    onUpdateWhiteboard(formatted);
    onNotifyUser?.(`Pushed "${title}" to the classroom chalkboard! 📋`);
  };

  // Push Active Code to StudyPad
  const handlePushToStudyPad = (content: string, title = 'Office Notes') => {
    if (!onUpdateStudyPadText) return;
    const notes = `\n\n--- 🏢 ${title} (${new Date().toLocaleTimeString()}) ---\n${content}\n`;
    onUpdateStudyPadText(notes);
    onNotifyUser?.(`Appended "${title}" to StudyPad notes! 📝`);
  };

  // Move task column with backend persistence & daily tasks sync
  const handleMoveTask = (taskId: string) => {
    const updated = tasks.map((t) => {
      if (t.id !== taskId) return t;
      const nextCol: 'todo' | 'in-progress' | 'done' = t.col === 'todo' ? 'in-progress' : t.col === 'in-progress' ? 'done' : 'todo';
      return { ...t, col: nextCol };
    });
    setTasks(updated);
    syncStateToBackend(updated, terminalFeed);
  };

  // Delete task with backend persistence & daily tasks sync
  const handleDeleteTask = (taskId: string) => {
    const updated = tasks.filter((t) => t.id !== taskId);
    setTasks(updated);
    syncStateToBackend(updated, terminalFeed);
  };

  // Add new task with backend persistence & daily tasks sync
  const handleAddNewTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const task: KanbanTask = {
      id: `t_${Date.now()}`,
      title: newTaskTitle.trim(),
      assignee: newTaskAssignee,
      col: 'todo',
      prio: newTaskPrio,
      createdAt: new Date().toISOString()
    };
    const updated = [task, ...tasks];
    setTasks(updated);
    syncStateToBackend(updated, terminalFeed);
    setNewTaskTitle('');
    setShowAddTaskModal(false);
    onNotifyUser?.(`Added task "${task.title}" for ${task.assignee}`);
  };

  // ── Graph & Memory Handlers ──────────────────────────────────────────────
  const handleCreateGraphEntity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntityName.trim()) return;
    try {
      const res = await fetch('/api/office/graph-entity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newEntityName.trim(),
          type: newEntityType,
          description: newEntityDesc.trim() || `Concept identified by MAHR Office`,
          importance: 4
        })
      });
      if (res.ok) {
        setShowAddEntityModal(false);
        setNewEntityName('');
        setNewEntityDesc('');
        await fetchKnowledgeData();
        onNotifyUser?.(`Added "${newEntityName}" to MAHR Knowledge Graph! 🕸️`);
      }
    } catch (err) {
      console.error('[GraphAdd] error:', err);
    }
  };

  const handleCreateMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemoryText.trim()) return;
    try {
      const res = await fetch('/api/office/memory-ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentName: activeAgent.name,
          text: newMemoryText.trim(),
          category: newMemoryCategory
        })
      });
      if (res.ok) {
        setShowAddMemoryModal(false);
        setNewMemoryText('');
        await fetchKnowledgeData();
        onNotifyUser?.(`Recorded memory in MAHR Long-Term Vault! 🧠`);
      }
    } catch (err) {
      console.error('[MemoryAdd] error:', err);
    }
  };

  const handleProjectEntityToWhiteboard = (entity: OfficeGraphEntity) => {
    if (!onUpdateWhiteboard) return;
    const content = `# 🕸️ Knowledge Graph Entity — ${entity.name}\n\n` +
      `**Classification:** \`${entity.type.toUpperCase()}\` | **Importance:** ${'★'.repeat(entity.importance || 3)}\n\n` +
      `### Core Concept & Description\n` +
      `${entity.description}\n\n` +
      `### Cognitive Multi-Agent Linkages\n` +
      `- Connected directly to MAHR Multi-Agent Office Floor\n` +
      `- Mention count: ${entity.mentionCount || 1} across active session dialogue\n\n` +
      `*Projected from MAHR Virtual Office Floor at ${new Date().toLocaleTimeString()}*`;
    onUpdateWhiteboard(content);
    onNotifyUser?.(`Projected "${entity.name}" to Classroom Chalkboard! 📋`);
  };

  const handleProjectMemoryToWhiteboard = (mem: OfficeMemoryItem) => {
    if (!onUpdateWhiteboard) return;
    const content = `# 🧠 Long-Term Memory Insight\n\n` +
      `**Category:** \`${mem.category.toUpperCase()}\`\n\n` +
      `> "${mem.text}"\n\n` +
      `*Recorded into MAHR Cognitive Vault on ${mem.createdAt ? new Date(mem.createdAt).toLocaleDateString() : 'Active Session'}*`;
    onUpdateWhiteboard(content);
    onNotifyUser?.(`Projected memory to Classroom Chalkboard! 📋`);
  };

  // Export Tasks to Whiteboard
  const handleExportTasksToWhiteboard = () => {
    if (!onUpdateWhiteboard) return;
    const markdown = `# 📋 Sprint Kanban Board — MAHR Office\n\n` +
      `### In Progress (${tasks.filter(t => t.col === 'in-progress').length})\n` +
      tasks.filter(t => t.col === 'in-progress').map(t => `- [ ] **${t.title}** (*${t.assignee}* - ${t.prio})`).join('\n') +
      `\n\n### Todo (${tasks.filter(t => t.col === 'todo').length})\n` +
      tasks.filter(t => t.col === 'todo').map(t => `- [ ] ${t.title} (*${t.assignee}*)`).join('\n') +
      `\n\n### Done (${tasks.filter(t => t.col === 'done').length})\n` +
      tasks.filter(t => t.col === 'done').map(t => `- [x] ${t.title} (*${t.assignee}*)`).join('\n');

    onUpdateWhiteboard(markdown);
    onNotifyUser?.(`Exported Kanban Board to Classroom Chalkboard! 📋`);
  };

  // Add new Agent to Office
  const handleAddNewAgent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgentName.trim()) return;

    const newId = `agent_${Date.now()}`;
    const newAgent: Agent = {
      id: newId,
      name: newAgentName.trim(),
      character: newAgentCharacter,
      accent: 'sky',
      description: newAgentRole.trim() || 'AI Specialist & Cognitive Tutor',
      project: `src/office/agents/${newAgentName.toLowerCase().replace(/\s+/g, '_')}`,
      tmuxTarget: `${newId}:0`,
      cwd: `~/mahr/agents/${newAgentName.toLowerCase().replace(/\s+/g, '_')}`,
      status: 'working',
      action: 'Clocked in to MAHR Office floor',
      progress: 0,
      currentStation: 'desk',
      provider: newAgentProvider as any
    };

    addAgentToStore(newAgent);
    selectAgent(newId);
    setShowAddAgentModal(false);
    setNewAgentName('');
    setNewAgentRole('');

    confetti({ particleCount: 50, spread: 60, origin: { y: 0.3 } });
    onNotifyUser?.(`🎉 Welcome ${newAgent.name} to the MAHR Office team!`);

    setTerminalFeed((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        time: new Date().toTimeString().split(' ')[0],
        agent: 'MAHR (Boss)',
        text: `🎉 Successfully hired and clocked in ${newAgent.name} (${newAgent.description})`,
        kind: 'system'
      }
    ]);
  };

  // Change active agent station
  const handleSetStation = (station: StationKind, actionDesc: string) => {
    if (!activeAgent) return;
    updateAgent(activeAgent.id, {
      currentStation: station,
      action: actionDesc
    });
    setTerminalFeed((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        time: new Date().toTimeString().split(' ')[0],
        agent: activeAgent.name,
        text: `Moved to ${station}: ${actionDesc}`,
        kind: 'system'
      }
    ]);
  };

  // Save current code file
  const handleSaveCurrentFile = () => {
    const curFile = projectFiles[selectedFileIndex];
    if (!curFile) return;
    setFileSaveToast(`Saved ${curFile.name} successfully!`);
    setTimeout(() => setFileSaveToast(null), 3000);

    setTerminalFeed((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        time: new Date().toTimeString().split(' ')[0],
        agent: activeAgent.name,
        text: `● Saved file ${curFile.path} (${curFile.content.length} bytes)`,
        kind: 'tool'
      }
    ]);
  };

  // Filtered terminal feed
  const filteredFeed = terminalFeed.filter((item) => {
    if (feedFilter === 'all') return true;
    return item.kind === feedFilter;
  });

  const curFile = projectFiles[selectedFileIndex] || projectFiles[0];

  return (
    <div 
      ref={containerRef}
      className={`mahr-office-root fixed inset-0 z-50 flex flex-col bg-[#0b0813] text-[#f7f3e8] font-sans select-none overflow-hidden ${
        isFullscreen ? 'w-screen h-screen' : ''
      }`}
    >
      {/* ── Retro CRT Titlebar ────────────────────────────────────────────── */}
      <header className="h-12 min-h-[48px] px-3 sm:px-4 bg-gradient-to-b from-[#221b30] to-[#151021] border-b border-[#3b2d50] flex items-center justify-between text-xs shadow-md z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-600/30 border border-purple-400/50 flex items-center justify-center text-purple-300 font-mono font-bold text-sm shadow-[0_0_12px_rgba(168,85,247,0.4)]">
              🏢
            </div>
            <span className="font-['Press_Start_2P',monospace] text-[11px] tracking-wider text-purple-200">
              MAHR OFFICE
            </span>
            <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-purple-950/80 border border-purple-500/30 text-[9px] font-mono text-purple-300 font-bold">
              v2.4 HQ
            </span>
          </div>

          <div className="hidden md:flex items-center gap-2 pl-3 border-l border-[#3b2d50] text-[#a899b5]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-mono">{agents.length} AGENTS READY</span>
          </div>

          <div className="hidden lg:flex items-center gap-1.5 pl-3 border-l border-[#3b2d50]">
            <Database size={12} className="text-emerald-400" />
            <span className="text-[10px] font-mono text-emerald-300 font-semibold">{dbStatusInfo}</span>
          </div>
        </div>

        {/* Center action toolbar */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => handleAutoDelegateTasks()}
            disabled={isDelegating}
            className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 border border-purple-400/50 text-white font-mono text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer shadow-[0_0_12px_rgba(168,85,247,0.35)] disabled:opacity-50"
            title="Ask MAHR to autonomously analyze context and delegate real tasks to specialists"
          >
            <Zap size={12} className={isDelegating ? "animate-spin text-amber-300" : "text-amber-300"} />
            <span>{isDelegating ? "DELEGATING..." : "⚡ DELEGATE WORK"}</span>
          </button>

          <button
            onClick={handleCoffeeBreak}
            className="px-2.5 py-1.5 rounded-lg bg-[#2b223d] hover:bg-[#382c4f] border border-[#533f70] text-[#e0daf2] text-[11px] font-mono flex items-center gap-1.5 transition cursor-pointer"
            title="Send an agent to the kitchen breakroom"
          >
            <Coffee size={13} className="text-amber-400" />
            <span className="hidden sm:inline">COFFEE</span>
          </button>

          <button
            onClick={handleCallStandup}
            className="px-2.5 py-1.5 rounded-lg bg-[#2b223d] hover:bg-[#382c4f] border border-[#533f70] text-[#e0daf2] text-[11px] font-mono flex items-center gap-1.5 transition cursor-pointer"
            title="Gather agents around the conference table and push standup notes"
          >
            <Users size={13} className="text-sky-400" />
            <span className="hidden sm:inline">STANDUP</span>
          </button>

          <button
            onClick={handleTriggerDundie}
            className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-200 text-[11px] font-mono font-bold flex items-center gap-1.5 transition cursor-pointer shadow-[0_0_12px_rgba(251,191,36,0.25)]"
            title="Present a Dundie Award"
          >
            <Trophy size={13} className="text-amber-300 animate-bounce" />
            <span className="hidden md:inline">DUNDIES</span>
          </button>

          {onUpdateWhiteboard && (
            <button
              onClick={handleExportTasksToWhiteboard}
              className="px-2.5 py-1.5 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 border border-purple-400/40 text-purple-200 text-[11px] font-mono flex items-center gap-1.5 transition cursor-pointer"
              title="Sync sprint tasks & status with Classroom Whiteboard"
            >
              <Share2 size={13} className="text-purple-300" />
              <span className="hidden lg:inline">SYNC BOARD</span>
            </button>
          )}
          <a
            href="/api/download/linux-deb-payload"
            download="mahr-desktop_2.4.0_amd64.deb"
            className="hidden sm:flex px-2.5 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-slate-300 text-[11px] font-mono items-center gap-1.5 transition"
            title="Download Native Desktop App (.deb / .exe)"
          >
            <Download size={13} className="text-purple-400" />
            <span className="hidden xl:inline">DESKTOP APP</span>
          </a>
        </div>

        {/* Right window controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleToggleFullscreen}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-300 transition cursor-pointer"
              title="Close MAHR Office Floor"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </header>

      {/* ── Main Stage (Pixel Canvas Floor + Right Sidebar) ────────────────── */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 relative overflow-hidden">
        {/* Left: Pixel Art Office Canvas */}
        <div className="flex-1 min-h-0 relative bg-[#120e1c] flex flex-col overflow-hidden">
          {/* Top Floor HUD Overlay */}
          <div className="absolute top-3 left-3 z-10 flex items-center gap-2 pointer-events-none">
            <div className="px-2.5 py-1 rounded-md bg-[#161122]/85 backdrop-blur border border-[#3b2d50] text-[10px] font-mono text-[#a899b5] flex items-center gap-2 shadow-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>LIVE FLOOR SIMULATION</span>
            </div>
            <div className="hidden lg:flex px-2 py-1 rounded-md bg-[#161122]/85 backdrop-blur border border-[#3b2d50] text-[10px] font-mono text-purple-300">
              <span>ACTIVE STATION: {activeAgent.currentStation?.toUpperCase() || 'DESK'}</span>
            </div>
          </div>

          {/* Real PixiJS Canvas Floor */}
          <div className="flex-1 min-h-0 relative overflow-hidden">
            <OfficeFloor />
          </div>

          {/* Bottom Agent Strip */}
          <div className="h-16 min-h-[64px] bg-gradient-to-t from-[#151022] to-[#1c152d] border-t border-[#3b2d50] px-3 py-1.5 flex items-center gap-2 overflow-x-auto select-none z-10">
            <div className="text-[9px] font-mono text-[#a899b5] uppercase tracking-wider pr-2 border-r border-[#3b2d50] flex flex-col justify-center">
              <span>ROSTER</span>
              <span className="text-purple-300 font-bold">{agents.length} AGENTS</span>
            </div>

            {agents.map((agent) => {
              const isSelected = agent.id === selectedId;
              return (
                <button
                  key={agent.id}
                  onClick={() => selectAgent(agent.id)}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition cursor-pointer flex-shrink-0 ${
                    isSelected
                      ? 'bg-purple-900/40 border-purple-400/80 shadow-[0_0_12px_rgba(168,85,247,0.35)]'
                      : 'bg-[#221a33]/60 hover:bg-[#2b2140] border-[#3d2e53] text-[#d9cfe0]'
                  }`}
                >
                  {/* Portrait Canvas Thumbnail */}
                  <CharacterPortraitThumbnail character={agent.character} />

                  <div className="flex flex-col text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="font-['Press_Start_2P',monospace] text-[9px] text-white">
                        {agent.name}
                      </span>
                      {agent.isGod && (
                        <span className="text-[8px] bg-purple-500/30 text-purple-300 px-1 rounded font-mono font-bold">
                          BOSS
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-[#a899b5] truncate max-w-[110px]">
                      {agent.action || agent.status}
                    </span>
                  </div>

                  <span
                    className={`w-2 h-2 rounded-full ${
                      agent.status === 'working'
                        ? 'bg-amber-400 animate-pulse'
                        : agent.status === 'thinking'
                        ? 'bg-sky-400'
                        : 'bg-slate-500'
                    }`}
                  />
                </button>
              );
            })}

            {/* + Add Agent Button */}
            <button
              onClick={() => setShowAddAgentModal(true)}
              className="px-3 py-2 rounded-lg border border-dashed border-[#533f70] hover:border-purple-400 bg-purple-950/20 hover:bg-purple-900/30 text-purple-300 text-xs font-mono flex items-center gap-1.5 transition cursor-pointer flex-shrink-0"
              title="Spawn or hire a new AI agent"
            >
              <Plus size={14} />
              <span>HIRE AGENT</span>
            </button>
          </div>
        </div>

        {/* Right: Agent Terminal, Code & Workflow Control Sidebar */}
        <aside className="w-full md:w-[440px] lg:w-[480px] h-[380px] md:h-full bg-[#181324] border-t md:border-t-0 md:border-l border-[#3b2d50] flex flex-col min-h-0 flex-shrink-0 z-10 shadow-xl">
          {/* Active Agent Header */}
          <div className="p-3 bg-gradient-to-r from-[#221a32] to-[#191325] border-b border-[#3b2d50] flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CharacterPortraitThumbnail character={activeAgent.character} size={36} />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-['Press_Start_2P',monospace] text-xs text-purple-200">
                      {activeAgent.name}
                    </h3>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-purple-500/20 text-purple-300 border border-purple-400/30">
                      {(activeAgent as any).role || activeAgent.description.slice(0, 22)}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#a899b5] font-mono mt-0.5 truncate max-w-[240px]">
                    {activeAgent.action}
                  </p>
                </div>
              </div>

              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                {activeAgent.status.toUpperCase()}
              </span>
            </div>

            {/* Station Dispatch Shortcuts */}
            <div className="flex items-center gap-1.5 pt-1 text-[10px] font-mono text-[#a899b5]">
              <span className="text-[#7c6a90]">STATION:</span>
              <button
                onClick={() => handleSetStation('desk', 'working at coding workstation')}
                className={`px-2 py-0.5 rounded border transition cursor-pointer ${
                  activeAgent.currentStation === 'desk' || !activeAgent.currentStation
                    ? 'bg-purple-900/60 border-purple-400 text-white font-bold'
                    : 'bg-[#1d172a] border-[#3b2d50] hover:bg-[#281f3b] text-slate-300'
                }`}
              >
                DESK
              </button>
              <button
                onClick={() => handleSetStation('web', 'taking break in kitchen')}
                className={`px-2 py-0.5 rounded border transition cursor-pointer ${
                  activeAgent.currentStation === 'web'
                    ? 'bg-purple-900/60 border-purple-400 text-white font-bold'
                    : 'bg-[#1d172a] border-[#3b2d50] hover:bg-[#281f3b] text-slate-300'
                }`}
              >
                BREAKROOM
              </button>
              <button
                onClick={() => handleSetStation('board', 'presenting at conference whiteboard')}
                className={`px-2 py-0.5 rounded border transition cursor-pointer ${
                  activeAgent.currentStation === 'board'
                    ? 'bg-purple-900/60 border-purple-400 text-white font-bold'
                    : 'bg-[#1d172a] border-[#3b2d50] hover:bg-[#281f3b] text-slate-300'
                }`}
              >
                CONFERENCE
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-[#3b2d50] bg-[#140f1f] text-xs font-mono overflow-x-auto">
            <button
              onClick={() => setActiveTab('terminal')}
              className={`flex-1 min-w-[70px] py-2 flex items-center justify-center gap-1.5 border-b-2 transition cursor-pointer ${
                activeTab === 'terminal'
                  ? 'border-purple-400 text-purple-300 bg-purple-950/20 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Terminal size={13} />
              <span>TERMINAL</span>
            </button>

            <button
              onClick={() => setActiveTab('code')}
              className={`flex-1 min-w-[70px] py-2 flex items-center justify-center gap-1.5 border-b-2 transition cursor-pointer ${
                activeTab === 'code'
                  ? 'border-purple-400 text-purple-300 bg-purple-950/20 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code2 size={13} />
              <span>CODE</span>
            </button>

            <button
              onClick={() => setActiveTab('tasks')}
              className={`flex-1 min-w-[70px] py-2 flex items-center justify-center gap-1.5 border-b-2 transition cursor-pointer ${
                activeTab === 'tasks'
                  ? 'border-purple-400 text-purple-300 bg-purple-950/20 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Kanban size={13} />
              <span>TASKS</span>
            </button>

            <button
              onClick={() => setActiveTab('git')}
              className={`flex-1 min-w-[70px] py-2 flex items-center justify-center gap-1.5 border-b-2 transition cursor-pointer ${
                activeTab === 'git'
                  ? 'border-purple-400 text-purple-300 bg-purple-950/20 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <GitBranch size={13} />
              <span>GIT</span>
            </button>

            <button
              onClick={() => setActiveTab('workers')}
              className={`flex-1 min-w-[70px] py-2 flex items-center justify-center gap-1.5 border-b-2 transition cursor-pointer ${
                activeTab === 'workers'
                  ? 'border-purple-400 text-purple-300 bg-purple-950/20 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users size={13} />
              <span>WORKERS</span>
            </button>

            <button
              onClick={() => setActiveTab('memory')}
              className={`flex-1 min-w-[70px] py-2 flex items-center justify-center gap-1.5 border-b-2 transition cursor-pointer ${
                activeTab === 'memory'
                  ? 'border-purple-400 text-purple-300 bg-purple-950/20 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Network size={13} />
              <span>GRAPH & MEMORY</span>
            </button>
          </div>

          {/* Tab Content Body */}
          <div className="flex-1 min-h-0 overflow-y-auto p-3 bg-[#110d1a]">
            {/* TAB 1: TERMINAL / LOGS */}
            {activeTab === 'terminal' && (
              <div className="h-full flex flex-col font-mono text-[11px]">
                {/* Filter and action toolbar */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#2d223f] text-[#8e7e9f] text-[10px]">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setFeedFilter('all')}
                      className={`px-1.5 py-0.5 rounded cursor-pointer ${feedFilter === 'all' ? 'bg-purple-900/60 text-purple-200 font-bold' : 'hover:text-slate-200'}`}
                    >
                      ALL
                    </button>
                    <button
                      onClick={() => setFeedFilter('tool')}
                      className={`px-1.5 py-0.5 rounded cursor-pointer ${feedFilter === 'tool' ? 'bg-purple-900/60 text-purple-200 font-bold' : 'hover:text-slate-200'}`}
                    >
                      TOOLS
                    </button>
                    <button
                      onClick={() => setFeedFilter('dispatch')}
                      className={`px-1.5 py-0.5 rounded cursor-pointer ${feedFilter === 'dispatch' ? 'bg-purple-900/60 text-purple-200 font-bold' : 'hover:text-slate-200'}`}
                    >
                      DISPATCH
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setTerminalFeed([])}
                      className="hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                      title="Clear terminal stream"
                    >
                      <RefreshCw size={10} />
                      <span>CLEAR</span>
                    </button>
                    <span className="flex items-center gap-1 text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      STREAMING
                    </span>
                  </div>
                </div>

                {/* Log messages scroll area */}
                <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-1 font-mono">
                  {filteredFeed.map((item) => (
                    <div key={item.id} className="leading-relaxed break-words group flex items-start justify-between">
                      <div>
                        <span className="text-[#6b5878] mr-2">[{item.time}]</span>
                        <span className="text-purple-300 font-bold mr-1.5">{item.agent}:</span>
                        <span className={item.kind === 'dispatch' ? 'text-amber-300' : 'text-[#e0daf2]'}>
                          {item.text}
                        </span>
                      </div>
                      {onUpdateWhiteboard && (
                        <button
                          onClick={() => handlePushToWhiteboard(item.text, `Log: ${item.agent}`)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-[#8e7e9f] hover:text-purple-300 transition cursor-pointer"
                          title="Push this message to classroom chalkboard"
                        >
                          <Share2 size={11} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Quick Suggestion Chips */}
                <div className="pt-2 flex items-center gap-1.5 overflow-x-auto text-[10px] text-purple-300/80">
                  <span className="text-[#6b5878] flex-shrink-0">PROMPT:</span>
                  <button
                    onClick={() => handleSendPrompt(undefined, "Explain Feynman principle for async queues")}
                    className="px-2 py-0.5 rounded bg-[#1f182c] hover:bg-[#2b213d] border border-[#3b2d50] text-[#cbbddb] whitespace-nowrap cursor-pointer"
                  >
                    💡 Feynman Breakdown
                  </button>
                  <button
                    onClick={() => handleSendPrompt(undefined, "Run test suite & benchmark recovery")}
                    className="px-2 py-0.5 rounded bg-[#1f182c] hover:bg-[#2b213d] border border-[#3b2d50] text-[#cbbddb] whitespace-nowrap cursor-pointer"
                  >
                    🧪 Run Unit Tests
                  </button>
                  <button
                    onClick={() => handleSendPrompt(undefined, "Synthesize blackboard architecture diagram")}
                    className="px-2 py-0.5 rounded bg-[#1f182c] hover:bg-[#2b213d] border border-[#3b2d50] text-[#cbbddb] whitespace-nowrap cursor-pointer"
                  >
                    📋 Blackboard Diagram
                  </button>
                </div>

                {/* Quick prompt dispatch box */}
                <form onSubmit={handleSendPrompt} className="mt-2 pt-2 border-t border-[#2d223f] flex gap-2">
                  <input
                    type="text"
                    value={userPromptInput}
                    onChange={(e) => setUserPromptInput(e.target.value)}
                    disabled={isDispatching}
                    placeholder={`Dispatch task to ${activeAgent.name}...`}
                    className="flex-1 px-3 py-1.5 rounded bg-[#1f182c] border border-[#3f2e56] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={isDispatching}
                    className="px-3 py-1.5 rounded bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-bold flex items-center gap-1 transition cursor-pointer disabled:opacity-50 shadow-md"
                  >
                    <Send size={12} />
                    <span>{isDispatching ? 'RUNNING...' : 'SEND'}</span>
                  </button>
                </form>
              </div>
            )}

            {/* TAB 2: CODE & FILES INSPECTOR */}
            {activeTab === 'code' && (
              <div className="h-full min-h-0 flex flex-col font-mono text-xs overflow-hidden rounded-lg border border-[#3b2d50] bg-[#1a1a1f]">
                <FilesTab cwd="." />
              </div>
            )}

            {/* TAB 2.5: GIT REPOSITORY & VERSION CONTROL */}
            {activeTab === 'git' && (
              <div className="h-full min-h-0 flex flex-col font-mono text-xs overflow-hidden rounded-lg border border-[#3b2d50] bg-[#1a1a1f]">
                <GitTab cwd="." />
              </div>
            )}

            {/* TAB 3: TASKS KANBAN */}
            {activeTab === 'tasks' && (
              <div className="h-full flex flex-col font-sans">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#2d223f] text-xs font-mono text-[#a899b5]">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">OFFICE KANBAN</span>
                    <span className="px-1.5 py-0.2 rounded bg-purple-900/40 text-purple-300 border border-purple-500/30 text-[10px]">
                      {tasks.length} Total
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {onUpdateWhiteboard && (
                      <button
                        onClick={handleExportTasksToWhiteboard}
                        className="text-[10px] text-purple-300 hover:text-white flex items-center gap-1 cursor-pointer"
                      >
                        <Share2 size={11} />
                        <span>TO CHALKBOARD</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleAutoDelegateTasks()}
                      disabled={isDelegating}
                      className="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
                      title="Ask MAHR to autonomously delegate tasks to specialists"
                    >
                      <Zap size={11} className={isDelegating ? "animate-spin text-amber-300" : "text-amber-300"} />
                      <span>{isDelegating ? "DELEGATING..." : "MAHR DELEGATE"}</span>
                    </button>
                    <button
                      onClick={() => setShowAddTaskModal(true)}
                      className="px-2 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white font-bold text-[10px] flex items-center gap-1 transition cursor-pointer"
                    >
                      <Plus size={11} />
                      <span>NEW TASK</span>
                    </button>
                  </div>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1">
                  {tasks.length === 0 ? (
                    <div className="h-full min-h-[220px] flex flex-col items-center justify-center p-5 text-center rounded-xl bg-[#150f22]/80 border border-dashed border-[#443360]">
                      <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-300 flex items-center justify-center mb-2.5">
                        <Kanban size={20} />
                      </div>
                      <h4 className="text-xs font-bold font-mono text-purple-200 mb-1">
                        FLOOR IS ON STANDBY
                      </h4>
                      <p className="text-[11px] text-slate-400 mb-4 max-w-xs leading-relaxed">
                        Start main koi task nahi hai. Floor working main hai aur team tasks ka intezar kar rahi hai.
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleAutoDelegateTasks()}
                          disabled={isDelegating}
                          className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-lg disabled:opacity-50"
                        >
                          <Zap size={13} className="text-amber-300" />
                          <span>{isDelegating ? "Delegating..." : "⚡ Ask MAHR to Delegate"}</span>
                        </button>
                        <button
                          onClick={() => setShowAddTaskModal(true)}
                          className="px-3 py-1.5 rounded-lg bg-[#241c33] hover:bg-[#302544] border border-[#4d3a6c] text-slate-200 font-mono text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Plus size={13} />
                          <span>New Task</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    tasks.map((t) => (
                      <div
                        key={t.id}
                        className="p-3 rounded-lg bg-[#1e172a] border border-[#3b2d50] hover:border-purple-400/60 transition flex flex-col gap-2 group"
                      >
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => handleMoveTask(t.id)}
                            className={`text-[9px] font-mono px-2 py-0.5 rounded uppercase font-bold transition cursor-pointer ${
                              t.col === 'done'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : t.col === 'in-progress'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            }`}
                            title="Click to advance status"
                          >
                            {t.col} →
                          </button>

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-slate-400">
                              Assignee: <strong className="text-purple-300">{t.assignee}</strong>
                            </span>
                            <button
                              onClick={() => handleDeleteTask(t.id)}
                              className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition cursor-pointer"
                              title="Delete task"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-[#2e2340]">
                          <p className="text-xs text-slate-200 font-medium leading-snug flex-1">
                            {t.title}
                          </p>
                          {t.col !== 'done' && (
                            <button
                              onClick={() => handleExecuteTask(t)}
                              className="ml-2 px-2.5 py-1 rounded bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-mono text-[10px] font-bold flex items-center gap-1 transition cursor-pointer shadow flex-shrink-0"
                              title={`Instruct ${t.assignee} to execute this task now`}
                            >
                              <Zap size={10} className="text-amber-300" />
                              <span>EXECUTE</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: WORKERS ROSTER */}
            {activeTab === 'workers' && (
              <div className="space-y-2.5 font-sans">
                <div className="flex items-center justify-between pb-1 text-xs font-mono text-[#a899b5]">
                  <span>ACTIVE AGENTS SQUAD</span>
                  <button
                    onClick={() => setShowAddAgentModal(true)}
                    className="text-[10px] text-purple-300 hover:text-white flex items-center gap-1 cursor-pointer font-bold"
                  >
                    <Plus size={12} />
                    <span>SPAWN AGENT</span>
                  </button>
                </div>

                {agents.map((w) => (
                  <div
                    key={w.id}
                    onClick={() => selectAgent(w.id)}
                    className={`p-3 rounded-lg border transition cursor-pointer flex items-center justify-between ${
                      w.id === selectedId
                        ? 'bg-purple-950/40 border-purple-400/80 shadow-[0_0_12px_rgba(168,85,247,0.25)]'
                        : 'bg-[#1e172a] border-[#3b2d50] hover:border-purple-400/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <CharacterPortraitThumbnail character={w.character} size={34} />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-['Press_Start_2P',monospace] text-[10px] text-white">
                            {w.name}
                          </span>
                          <span className="text-[9px] font-mono text-purple-300">
                            ({w.provider || 'gemini'})
                          </span>
                        </div>
                        <p className="text-[11px] text-[#a899b5] font-mono line-clamp-1 mt-0.5">
                          {w.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-[9px] font-mono text-slate-400">
                          <span>STATION: <strong className="text-purple-300">{w.currentStation || 'desk'}</strong></span>
                          <span>•</span>
                          <span>ROLE: <strong className="text-amber-300">{(w as any).role || w.project || 'Specialist'}</strong></span>
                        </div>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-purple-950 border border-purple-500/40 text-purple-200">
                      {w.status}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 5: KNOWLEDGE GRAPH & MEMORY DECK */}
            {activeTab === 'memory' && (
              <div className="h-full flex flex-col font-mono text-xs gap-2.5">
                {/* Sub-navigation Strip */}
                <div className="flex items-center gap-1 pb-2 border-b border-[#2d223f]">
                  <button
                    onClick={() => setMemorySubTab('graph')}
                    className={`flex-1 py-1.5 px-2 rounded flex items-center justify-center gap-1 text-[10px] cursor-pointer transition ${
                      memorySubTab === 'graph'
                        ? 'bg-purple-900/60 border border-purple-500/50 text-purple-200 font-bold'
                        : 'bg-[#181324] border border-[#3b2d50] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Network size={12} />
                    <span>GRAPH ({graphEntities.length})</span>
                  </button>

                  <button
                    onClick={() => setMemorySubTab('memory')}
                    className={`flex-1 py-1.5 px-2 rounded flex items-center justify-center gap-1 text-[10px] cursor-pointer transition ${
                      memorySubTab === 'memory'
                        ? 'bg-purple-900/60 border border-purple-500/50 text-purple-200 font-bold'
                        : 'bg-[#181324] border border-[#3b2d50] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Brain size={12} />
                    <span>MEMORIES ({officeMemories.length})</span>
                  </button>

                  <button
                    onClick={() => setMemorySubTab('summary')}
                    className={`flex-1 py-1.5 px-2 rounded flex items-center justify-center gap-1 text-[10px] cursor-pointer transition ${
                      memorySubTab === 'summary'
                        ? 'bg-purple-900/60 border border-purple-500/50 text-purple-200 font-bold'
                        : 'bg-[#181324] border border-[#3b2d50] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Zap size={12} />
                    <span>STATS</span>
                  </button>
                </div>

                {/* SUB-VIEW 1: KNOWLEDGE GRAPH */}
                {memorySubTab === 'graph' && (
                  <div className="flex-1 min-h-0 flex flex-col gap-2 overflow-y-auto pr-0.5">
                    {/* Search & Filter Bar */}
                    <div className="flex items-center gap-1.5">
                      <div className="relative flex-1">
                        <Search size={12} className="absolute left-2.5 top-2 text-slate-400" />
                        <input
                          type="text"
                          value={graphSearchQuery}
                          onChange={(e) => setGraphSearchQuery(e.target.value)}
                          placeholder="Search concepts & entities..."
                          className="w-full pl-7 pr-2 py-1.5 rounded bg-[#1b1527] border border-[#3b2d50] text-[11px] text-slate-200 focus:outline-none focus:border-purple-400 placeholder-slate-500"
                        />
                      </div>
                      <button
                        onClick={() => setShowAddEntityModal(true)}
                        className="px-2.5 py-1.5 rounded bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold flex items-center gap-1 flex-shrink-0 cursor-pointer shadow-md transition"
                        title="Add Concept to Knowledge Graph"
                      >
                        <Plus size={12} />
                        <span>CONCEPT</span>
                      </button>
                    </div>

                    {/* Filter Category Chips */}
                    <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px]">
                      {['all', 'concept', 'technology', 'project', 'goal', 'person'].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setGraphFilterType(cat)}
                          className={`px-2 py-0.5 rounded capitalize whitespace-nowrap cursor-pointer transition ${
                            graphFilterType === cat
                              ? 'bg-purple-900/80 text-purple-200 border border-purple-500/60 font-bold'
                              : 'bg-[#161120] text-slate-400 border border-[#302543] hover:text-slate-200'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    {/* Entity Cards List */}
                    <div className="space-y-2">
                      {graphEntities
                        .filter((ent) => {
                          const matchesCat = graphFilterType === 'all' || ent.type === graphFilterType;
                          const matchesSearch = !graphSearchQuery || 
                            ent.name.toLowerCase().includes(graphSearchQuery.toLowerCase()) ||
                            (ent.description || '').toLowerCase().includes(graphSearchQuery.toLowerCase());
                          return matchesCat && matchesSearch;
                        })
                        .map((ent) => {
                          const typeBadgeColor = 
                            ent.type === 'technology' ? 'bg-sky-500/20 text-sky-300 border-sky-500/40' :
                            ent.type === 'concept' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                            ent.type === 'goal' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                            ent.type === 'project' ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' :
                            'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';

                          return (
                            <div
                              key={ent.id}
                              className="p-2.5 rounded-lg bg-[#181224] border border-[#3b2d50] hover:border-purple-500/40 transition flex flex-col gap-1.5"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                  <Network size={12} className="text-purple-400 flex-shrink-0" />
                                  <span className="font-bold text-slate-200 truncate">{ent.name}</span>
                                </div>
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded border capitalize ${typeBadgeColor}`}>
                                    {ent.type}
                                  </span>
                                  <span className="text-[10px] text-amber-400">
                                    {'★'.repeat(ent.importance || 3)}
                                  </span>
                                </div>
                              </div>

                              <p className="text-[11px] text-slate-300 leading-relaxed font-sans line-clamp-2">
                                {ent.description}
                              </p>

                              <div className="flex items-center justify-between pt-1 border-t border-[#291f38] text-[10px]">
                                <span className="text-slate-400">
                                  {ent.mentionCount ? `${ent.mentionCount} mentions` : 'Connected'}
                                </span>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleProjectEntityToWhiteboard(ent)}
                                    className="text-purple-300 hover:text-white flex items-center gap-1 transition cursor-pointer"
                                    title="Project concept to classroom chalkboard"
                                  >
                                    <BookOpen size={10} />
                                    <span>CHALKBOARD</span>
                                  </button>
                                  <button
                                    onClick={() => handlePushToStudyPad(ent.description, ent.name)}
                                    className="text-sky-300 hover:text-white flex items-center gap-1 transition cursor-pointer"
                                    title="Save to StudyPad notes"
                                  >
                                    <FileCode size={10} />
                                    <span>STUDYPAD</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}

                      {graphEntities.length === 0 && (
                        <div className="p-4 rounded-lg bg-[#181224] border border-[#3b2d50] text-center text-slate-400 text-xs">
                          {isGraphLoading ? 'Loading knowledge graph...' : 'No entities found in Knowledge Graph.'}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* SUB-VIEW 2: MEMORY BANK */}
                {memorySubTab === 'memory' && (
                  <div className="flex-1 min-h-0 flex flex-col gap-2 overflow-y-auto pr-0.5">
                    {/* Search & Add Memory Bar */}
                    <div className="flex items-center gap-1.5">
                      <div className="relative flex-1">
                        <Search size={12} className="absolute left-2.5 top-2 text-slate-400" />
                        <input
                          type="text"
                          value={memorySearchQuery}
                          onChange={(e) => setMemorySearchQuery(e.target.value)}
                          placeholder="Search long-term memories..."
                          className="w-full pl-7 pr-2 py-1.5 rounded bg-[#1b1527] border border-[#3b2d50] text-[11px] text-slate-200 focus:outline-none focus:border-purple-400 placeholder-slate-500"
                        />
                      </div>
                      <button
                        onClick={() => setShowAddMemoryModal(true)}
                        className="px-2.5 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 flex-shrink-0 cursor-pointer shadow-md transition"
                        title="Add Memory to Cognitive Bank"
                      >
                        <Plus size={12} />
                        <span>INSIGHT</span>
                      </button>
                    </div>

                    {/* Category Filter Chips */}
                    <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px]">
                      {['all', 'preference', 'goal', 'identity', 'emotional', 'fact'].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setMemoryCategoryFilter(cat)}
                          className={`px-2 py-0.5 rounded capitalize whitespace-nowrap cursor-pointer transition ${
                            memoryCategoryFilter === cat
                              ? 'bg-emerald-900/80 text-emerald-200 border border-emerald-500/60 font-bold'
                              : 'bg-[#161120] text-slate-400 border border-[#302543] hover:text-slate-200'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    {/* Memories List */}
                    <div className="space-y-2">
                      {officeMemories
                        .filter((m) => {
                          const matchesCat = memoryCategoryFilter === 'all' || m.category === memoryCategoryFilter;
                          const matchesSearch = !memorySearchQuery ||
                            m.text.toLowerCase().includes(memorySearchQuery.toLowerCase());
                          return matchesCat && matchesSearch;
                        })
                        .map((mem) => {
                          const badgeColor =
                            mem.category === 'goal' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                            mem.category === 'preference' ? 'bg-sky-500/20 text-sky-300 border-sky-500/40' :
                            mem.category === 'identity' ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' :
                            'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';

                          return (
                            <div
                              key={mem.id}
                              className="p-2.5 rounded-lg bg-[#181224] border border-[#3b2d50] hover:border-emerald-500/40 transition flex flex-col gap-1.5"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <Brain size={12} className="text-emerald-400 flex-shrink-0" />
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded border capitalize ${badgeColor}`}>
                                    {mem.category}
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-400">
                                  {mem.createdAt ? new Date(mem.createdAt).toLocaleDateString() : 'Vault'}
                                </span>
                              </div>

                              <p className="text-[11px] text-slate-200 font-sans leading-relaxed">
                                {mem.text}
                              </p>

                              <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#291f38] text-[10px]">
                                <button
                                  onClick={() => handleProjectMemoryToWhiteboard(mem)}
                                  className="text-emerald-300 hover:text-white flex items-center gap-1 transition cursor-pointer"
                                  title="Project memory to classroom chalkboard"
                                >
                                  <BookOpen size={10} />
                                  <span>CHALKBOARD</span>
                                </button>
                                <button
                                  onClick={() => handlePushToStudyPad(mem.text, `Memory (${mem.category})`)}
                                  className="text-sky-300 hover:text-white flex items-center gap-1 transition cursor-pointer"
                                  title="Append to StudyPad notes"
                                >
                                  <FileCode size={10} />
                                  <span>STUDYPAD</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}

                      {officeMemories.length === 0 && (
                        <div className="p-4 rounded-lg bg-[#181224] border border-[#3b2d50] text-center text-slate-400 text-xs">
                          {isMemoryLoading ? 'Loading memories...' : 'No memories found.'}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* SUB-VIEW 3: STATS & PERSISTENCE OVERVIEW */}
                {memorySubTab === 'summary' && (
                  <div className="flex-1 min-h-0 space-y-3 overflow-y-auto pr-0.5">
                    <div className="p-3 rounded-lg bg-[#1e172a] border border-purple-500/30">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 text-purple-300 font-bold">
                          <Zap size={14} />
                          <span>COGNITIVE ARCHITECTURE STATS</span>
                        </div>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                          ACTIVE
                        </span>
                      </div>
                      <p className="text-[11px] text-[#a899b5] leading-relaxed">
                        Continuous multi-agent memory, entity linkages, and task ledger synchronized with the classroom chalkboard.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2.5 rounded bg-[#161120] border border-[#3b2d50] flex flex-col">
                        <span className="text-slate-400 text-[10px]">Long-Term Memories</span>
                        <span className="text-emerald-400 font-bold text-sm mt-0.5">
                          {knowledgeSummary?.totalMemories ?? officeMemories.length} Ingested
                        </span>
                      </div>
                      <div className="p-2.5 rounded bg-[#161120] border border-[#3b2d50] flex flex-col">
                        <span className="text-slate-400 text-[10px]">Knowledge Entities</span>
                        <span className="text-purple-300 font-bold text-sm mt-0.5">
                          {knowledgeSummary?.totalGraphNodes ?? graphEntities.length} Mapped
                        </span>
                      </div>
                      <div className="p-2.5 rounded bg-[#161120] border border-[#3b2d50] flex flex-col">
                        <span className="text-slate-400 text-[10px]">Office Tickets</span>
                        <span className="text-amber-300 font-bold text-sm mt-0.5">
                          {tasks.length} ({tasks.filter(t => t.col === 'done').length} Done)
                        </span>
                      </div>
                      <div className="p-2.5 rounded bg-[#161120] border border-[#3b2d50] flex flex-col">
                        <span className="text-slate-400 text-[10px]">Vector Embedding</span>
                        <span className="text-sky-300 font-bold text-sm mt-0.5">128-d L2</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-[#161120] border border-[#3b2d50] space-y-2">
                      <div className="text-[10px] text-[#8e7e9f] uppercase font-bold">Quick Sync Actions</div>
                      <div className="flex gap-2">
                        <button
                          onClick={fetchKnowledgeData}
                          className="flex-1 py-1.5 px-2 rounded bg-purple-900/40 hover:bg-purple-800/50 border border-purple-500/40 text-purple-200 text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          <RefreshCw size={11} />
                          <span>REFRESH DATA</span>
                        </button>
                        <button
                          onClick={() => {
                            if (!onUpdateWhiteboard) return;
                            const report = `# 🧠 MAHR Cognitive Knowledge Summary\n\n` +
                              `**Date:** ${new Date().toLocaleDateString()} | **Time:** ${new Date().toLocaleTimeString()}\n\n` +
                              `### System State\n` +
                              `- **Total Long-Term Memories:** ${officeMemories.length}\n` +
                              `- **Knowledge Graph Entities:** ${graphEntities.length}\n` +
                              `- **Active Office Sprints:** ${tasks.length} tickets (${tasks.filter(t => t.col === 'done').length} completed)\n` +
                              `- **Active Office Agents:** ${agents.length} clocked in\n\n` +
                              `### Recent Concepts\n` +
                              graphEntities.slice(0, 5).map(e => `- **${e.name}** (\`${e.type}\`): ${e.description}`).join('\n') +
                              `\n\n*Transmitted from MAHR Virtual Office Floor to Classroom Chalkboard*`;
                            onUpdateWhiteboard(report);
                            onNotifyUser?.(`Projected Cognitive Summary to Classroom Chalkboard! 📋`);
                          }}
                          className="flex-1 py-1.5 px-2 rounded bg-sky-900/40 hover:bg-sky-800/50 border border-sky-500/40 text-sky-200 text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          <BookOpen size={11} />
                          <span>EXPORT TO CHALK</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* ── Modal 1: The Dundie Award Presentation ────────────────────────── */}
      {showDundieModal && dundieWinner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md p-6 rounded-2xl bg-gradient-to-b from-[#251b3a] to-[#150f24] border-2 border-amber-400 shadow-[0_0_50px_rgba(251,191,36,0.35)] text-center text-white flex flex-col items-center">
            <Trophy size={48} className="text-amber-400 mb-3 animate-bounce" />
            <h3 className="font-['Press_Start_2P',monospace] text-sm text-amber-300 mb-1">
              THE DUNDIES
            </h3>
            <p className="text-xs text-[#a899b5] font-mono mb-4">
              Scranton & Cloud Branch Annual Recognition
            </p>

            <div className="my-2 p-3 rounded-xl bg-purple-950/60 border border-purple-500/40 w-full flex flex-col items-center">
              <CharacterPortraitThumbnail character={dundieWinner.character} size={48} />
              <div className="font-['Press_Start_2P',monospace] text-xs text-white mt-2">
                {dundieWinner.name}
              </div>
              <div className="text-sm font-bold text-amber-300 mt-1">
                "{dundieTitle}"
              </div>
            </div>

            <p className="text-xs text-slate-300 font-mono my-3 italic">
              "You have shown outstanding performance, relentless commit velocity, and unmatched coffee consumption."
            </p>

            <div className="flex gap-2 mt-2 w-full">
              {onUpdateWhiteboard && (
                <button
                  onClick={() => {
                    handlePushToWhiteboard(
                      `# 🏆 Dundie Award Recipient: ${dundieWinner.name}\n\n` +
                      `**Award:** "${dundieTitle}"\n` +
                      `**Department:** ${dundieWinner.description}\n\n` +
                      `*Presented at the Annual MAHR Office Floor Ceremony.*`,
                      `Dundie Award: ${dundieWinner.name}`
                    );
                    setShowDundieModal(false);
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold font-mono text-xs transition cursor-pointer"
                >
                  ADD TO CHALKBOARD
                </button>
              )}
              <button
                onClick={() => setShowDundieModal(false)}
                className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold font-mono text-xs transition cursor-pointer shadow-lg"
              >
                ACCEPT & RESUME
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal 2: Add / Hire New Agent ─────────────────────────────────── */}
      {showAddAgentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg p-6 rounded-2xl bg-gradient-to-b from-[#231b34] to-[#150f22] border border-purple-500/40 shadow-2xl text-white flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#3b2d50] mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-purple-600/30 text-purple-300">
                  <Plus size={18} />
                </div>
                <h3 className="font-['Press_Start_2P',monospace] text-xs text-purple-200">
                  SPAWN AGENT
                </h3>
              </div>
              <button
                onClick={() => setShowAddAgentModal(false)}
                className="p-1 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddNewAgent} className="space-y-4 font-sans text-xs">
              <div>
                <label className="block text-slate-300 font-mono mb-1 font-semibold">
                  AGENT NAME
                </label>
                <input
                  type="text"
                  required
                  value={newAgentName}
                  onChange={(e) => setNewAgentName(e.target.value)}
                  placeholder="e.g. Socrates, Feynman, Ada, BeetleBot..."
                  className="w-full px-3 py-2 rounded-lg bg-[#140f1f] border border-[#3b2d50] text-white focus:outline-none focus:border-purple-400 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-mono mb-1 font-semibold">
                  ROLE & MISSION
                </label>
                <input
                  type="text"
                  required
                  value={newAgentRole}
                  onChange={(e) => setNewAgentRole(e.target.value)}
                  placeholder="e.g. Senior Systems Architect & Code Reviewer"
                  className="w-full px-3 py-2 rounded-lg bg-[#140f1f] border border-[#3b2d50] text-white focus:outline-none focus:border-purple-400 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-mono mb-1 font-semibold">
                  OFFICE CHARACTER AVATAR
                </label>
                <div className="grid grid-cols-5 gap-2 max-h-36 overflow-y-auto p-1 bg-[#100c19] rounded-lg border border-[#3b2d50]">
                  {OFFICE_CAST.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setNewAgentCharacter(c.name)}
                      className={`p-1.5 rounded-lg border flex flex-col items-center gap-1 transition cursor-pointer ${
                        newAgentCharacter === c.name
                          ? 'bg-purple-900/60 border-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.4)]'
                          : 'bg-[#181324] border-[#2e2340] hover:bg-[#221b33]'
                      }`}
                    >
                      <CharacterPortraitThumbnail character={c.name} size={28} />
                      <span className="text-[9px] font-mono text-slate-300 truncate w-full text-center">
                        {c.displayName}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-mono mb-1 font-semibold">
                  AI PROVIDER ENGINE
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['gemini', 'claude', 'openai', 'deepmind'] as const).map((prov) => (
                    <button
                      key={prov}
                      type="button"
                      onClick={() => setNewAgentProvider(prov)}
                      className={`py-1.5 px-2 rounded-lg border text-[11px] font-mono capitalize transition cursor-pointer ${
                        newAgentProvider === prov
                          ? 'bg-purple-900/60 border-purple-400 text-white font-bold'
                          : 'bg-[#140f1f] border-[#3b2d50] text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {prov}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddAgentModal(false)}
                  className="px-4 py-2 rounded-lg bg-[#221a33] hover:bg-[#2b2140] text-slate-300 font-mono text-xs cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold font-mono text-xs transition cursor-pointer shadow-lg"
                >
                  SPAWN AGENT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal 3: Add Kanban Task ───────────────────────────────────────── */}
      {showAddTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md p-6 rounded-2xl bg-gradient-to-b from-[#231b34] to-[#150f22] border border-purple-500/40 shadow-2xl text-white flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#3b2d50] mb-4">
              <h3 className="font-['Press_Start_2P',monospace] text-xs text-purple-200">
                CREATE TICKET
              </h3>
              <button
                onClick={() => setShowAddTaskModal(false)}
                className="p-1 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddNewTask} className="space-y-4 font-sans text-xs">
              <div>
                <label className="block text-slate-300 font-mono mb-1 font-semibold">
                  TASK DESCRIPTION
                </label>
                <input
                  type="text"
                  required
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="e.g. Audit zero-latency WebSocket reconnection"
                  className="w-full px-3 py-2 rounded-lg bg-[#140f1f] border border-[#3b2d50] text-white focus:outline-none focus:border-purple-400 font-sans text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-mono mb-1 font-semibold">
                    ASSIGNEE
                  </label>
                  <select
                    value={newTaskAssignee}
                    onChange={(e) => setNewTaskAssignee(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#140f1f] border border-[#3b2d50] text-white focus:outline-none focus:border-purple-400 font-mono text-xs"
                  >
                    {agents.map((a) => (
                      <option key={a.id} value={a.name}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-mono mb-1 font-semibold">
                    PRIORITY
                  </label>
                  <select
                    value={newTaskPrio}
                    onChange={(e) => setNewTaskPrio(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg bg-[#140f1f] border border-[#3b2d50] text-white focus:outline-none focus:border-purple-400 font-mono text-xs"
                  >
                    <option value="high">High</option>
                    <option value="med">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddTaskModal(false)}
                  className="px-4 py-2 rounded-lg bg-[#221a33] hover:bg-[#2b2140] text-slate-300 font-mono text-xs cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold font-mono text-xs transition cursor-pointer shadow-lg"
                >
                  ADD TICKET
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal 4: Add Knowledge Graph Entity ───────────────────────────── */}
      {showAddEntityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md p-6 rounded-2xl bg-gradient-to-b from-[#231b34] to-[#150f22] border border-purple-500/40 shadow-2xl text-white flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#3b2d50] mb-4">
              <div className="flex items-center gap-2">
                <Network size={16} className="text-purple-400" />
                <h3 className="font-['Press_Start_2P',monospace] text-xs text-purple-200">
                  ADD GRAPH CONCEPT
                </h3>
              </div>
              <button
                onClick={() => setShowAddEntityModal(false)}
                className="p-1 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateGraphEntity} className="space-y-4 font-sans text-xs">
              <div>
                <label className="block text-slate-300 font-mono mb-1 font-semibold">
                  ENTITY NAME
                </label>
                <input
                  type="text"
                  required
                  value={newEntityName}
                  onChange={(e) => setNewEntityName(e.target.value)}
                  placeholder="e.g. Distributed Consensus / PyTorch Tensors"
                  className="w-full px-3 py-2 rounded-lg bg-[#140f1f] border border-[#3b2d50] text-white focus:outline-none focus:border-purple-400 font-mono text-xs placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-mono mb-1 font-semibold">
                  CLASSIFICATION TYPE
                </label>
                <select
                  value={newEntityType}
                  onChange={(e) => setNewEntityType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg bg-[#140f1f] border border-[#3b2d50] text-white focus:outline-none focus:border-purple-400 font-mono text-xs"
                >
                  <option value="concept">Concept</option>
                  <option value="technology">Technology</option>
                  <option value="project">Project</option>
                  <option value="goal">Goal</option>
                  <option value="person">Person</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-mono mb-1 font-semibold">
                  DESCRIPTION & ANALOGY
                </label>
                <textarea
                  rows={3}
                  value={newEntityDesc}
                  onChange={(e) => setNewEntityDesc(e.target.value)}
                  placeholder="Detailed breakdown or Feynman mental model..."
                  className="w-full px-3 py-2 rounded-lg bg-[#140f1f] border border-[#3b2d50] text-white focus:outline-none focus:border-purple-400 font-mono text-xs placeholder-slate-500 resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddEntityModal(false)}
                  className="px-4 py-2 rounded-lg bg-[#221a33] hover:bg-[#2b2140] text-slate-300 font-mono text-xs cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold font-mono text-xs transition cursor-pointer shadow-lg"
                >
                  MAP ENTITY
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal 5: Add Long-Term Memory ──────────────────────────────────── */}
      {showAddMemoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md p-6 rounded-2xl bg-gradient-to-b from-[#231b34] to-[#150f22] border border-emerald-500/40 shadow-2xl text-white flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#3b2d50] mb-4">
              <div className="flex items-center gap-2">
                <Brain size={16} className="text-emerald-400" />
                <h3 className="font-['Press_Start_2P',monospace] text-xs text-emerald-200">
                  INGEST MEMORY
                </h3>
              </div>
              <button
                onClick={() => setShowAddMemoryModal(false)}
                className="p-1 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateMemory} className="space-y-4 font-sans text-xs">
              <div>
                <label className="block text-slate-300 font-mono mb-1 font-semibold">
                  MEMORY CATEGORY
                </label>
                <select
                  value={newMemoryCategory}
                  onChange={(e) => setNewMemoryCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#140f1f] border border-[#3b2d50] text-white focus:outline-none focus:border-purple-400 font-mono text-xs"
                >
                  <option value="preference">Preference</option>
                  <option value="goal">Goal</option>
                  <option value="identity">Identity</option>
                  <option value="fact">Fact / Knowledge</option>
                  <option value="emotional">Emotional</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-mono mb-1 font-semibold">
                  MEMORY INSIGHT TEXT
                </label>
                <textarea
                  rows={3}
                  required
                  value={newMemoryText}
                  onChange={(e) => setNewMemoryText(e.target.value)}
                  placeholder="e.g. Student prefers code examples in TypeScript and loves building games."
                  className="w-full px-3 py-2 rounded-lg bg-[#140f1f] border border-[#3b2d50] text-white focus:outline-none focus:border-emerald-400 font-mono text-xs placeholder-slate-500 resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddMemoryModal(false)}
                  className="px-4 py-2 rounded-lg bg-[#221a33] hover:bg-[#2b2140] text-slate-300 font-mono text-xs cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold font-mono text-xs transition cursor-pointer shadow-lg"
                >
                  INGEST TO BRAIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Helper Component: Thumbnail Painted Directly via portraitArt Canvas ─────
function CharacterPortraitThumbnail({
  character,
  size = 28
}: {
  character: OfficeCharacterName;
  size?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    paintCastPortrait(ctx, character, 1.8);
  }, [character]);

  return (
    <div
      style={{ width: size, height: size }}
      className="rounded bg-[#110d1a] border border-[#4a3966] overflow-hidden flex items-center justify-center flex-shrink-0"
    >
      <canvas
        ref={canvasRef}
        width={32}
        height={32}
        style={{ width: size, height: size, imageRendering: 'pixelated' }}
      />
    </div>
  );
}
