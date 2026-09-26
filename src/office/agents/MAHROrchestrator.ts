import { AgentWorker, type AgentConfig } from './AgentWorker';

export const OFFICE_CAST: AgentConfig[] = [
  {
    id: 'agent-jim',
    name: 'Jim',
    role: 'Frontend Architect & PixiJS Engineer',
    personality: 'Prankster, problem-solver, pixel-art specialist, visual design wizard',
    speciality: 'React UI, Tailwind, Canvas/PixiJS, visual designs, smooth animations, CSS layout',
    deskId: 1,
    character: 'jim',
    spriteRow: 1
  },
  {
    id: 'agent-dwight',
    name: 'Dwight',
    role: 'Assistant to RM & Code Auditor',
    personality: 'Precise, detail-oriented, security-conscious, unyielding on correctness',
    speciality: 'Type-safety, security audits, linting, tests, logic validation, hardware checks',
    deskId: 2,
    character: 'dwight',
    spriteRow: 2
  },
  {
    id: 'agent-pam',
    name: 'Pam',
    role: 'Visual Synthesis & Chalkboard Artist',
    personality: 'Encouraging, creative, empathetic, breaks big goals into visual steps',
    speciality: 'Classroom whiteboard, diagrams, Feynman summaries, study guides, mind maps',
    deskId: 3,
    character: 'pam',
    spriteRow: 3
  },
  {
    id: 'agent-ryan',
    name: 'Ryan',
    role: 'Fullstack Temp & WebSocket Engineer',
    personality: 'Tech-forward, ambitious, fast-prototyping, modern stack enthusiast',
    speciality: 'Real-time APIs, WebSockets, streaming pipelines, fullstack sync, Express/Node',
    deskId: 4,
    character: 'ryan',
    spriteRow: 4
  },
  {
    id: 'agent-stanley',
    name: 'Stanley',
    role: 'Database Architect & QA Lead',
    personality: 'No-nonsense, grounded, metric-driven, prioritizes uptime and speed',
    speciality: 'SQLite/Postgres queries, indexing, latency tuning, test benchmarks, data integrity',
    deskId: 5,
    character: 'stanley',
    spriteRow: 5
  }
];

export class MAHROrchestrator {
  private workers: Map<string, AgentWorker> = new Map();
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    for (const config of OFFICE_CAST) {
      this.workers.set(config.id, new AgentWorker(config, apiKey));
      // Also register friendly aliases
      this.workers.set(config.name.toLowerCase(), this.workers.get(config.id)!);
    }
  }

  /**
   * MAHR (as the GOD orchestrator) analyzes the task and routes it to the most qualified agent.
   */
  async routeTask(userMessage: string): Promise<{
    assignedAgent: string;
    agentName: string;
    reason: string;
  }> {
    const rawLower = userMessage.toLowerCase();

    // Fast heuristic match before remote call
    if (rawLower.includes('dwight') || rawLower.includes('security') || rawLower.includes('audit') || rawLower.includes('type')) {
      return { assignedAgent: 'agent-dwight', agentName: 'Dwight', reason: 'Audit & verification specialist needed' };
    }
    if (rawLower.includes('pam') || rawLower.includes('whiteboard') || rawLower.includes('chalkboard') || rawLower.includes('diagram') || rawLower.includes('draw')) {
      return { assignedAgent: 'agent-pam', agentName: 'Pam', reason: 'Visual synthesis and chalkboard illustration' };
    }
    if (rawLower.includes('ryan') || rawLower.includes('socket') || rawLower.includes('stream') || rawLower.includes('api') || rawLower.includes('realtime')) {
      return { assignedAgent: 'agent-ryan', agentName: 'Ryan', reason: 'Streaming pipelines and WebSocket communication' };
    }
    if (rawLower.includes('stanley') || rawLower.includes('db') || rawLower.includes('database') || rawLower.includes('sql') || rawLower.includes('perf')) {
      return { assignedAgent: 'agent-stanley', agentName: 'Stanley', reason: 'Database indexing & benchmark verification' };
    }
    if (rawLower.includes('jim') || rawLower.includes('ui') || rawLower.includes('frontend') || rawLower.includes('component') || rawLower.includes('css')) {
      return { assignedAgent: 'agent-jim', agentName: 'Jim', reason: 'UI architecture & frontend polish' };
    }

    const candidateModels = [
      'gemini-2.5-flash',
      'gemini-3.1-flash-lite',
      'gemini-flash-latest',
      'gemini-3.1-pro-preview'
    ];

    try {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({
        apiKey: this.apiKey,
        httpOptions: { headers: { 'User-Agent': 'mahr-god-orchestrator' } }
      });

      const agentDescriptions = OFFICE_CAST.map(
        (a) => `- ${a.id} (${a.name}): ${a.role} — ${a.speciality}`
      ).join('\n');

      const routePrompt = `You are MAHR, the Lead AI Tutor & GOD Orchestrator of the virtual office.
Route the following task to the single best agent on your floor:

Available Agents:
${agentDescriptions}

Task to delegate: "${userMessage}"

Respond in valid JSON only with NO markdown fences:
{"assignedAgent": "agent-jim" | "agent-dwight" | "agent-pam" | "agent-ryan" | "agent-stanley", "agentName": "Jim" | "Dwight" | "Pam" | "Ryan" | "Stanley", "reason": "one line justification"}`;

      for (const model of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: routePrompt,
            config: { responseMimeType: 'application/json' }
          });

          if (response && response.text) {
            const parsed = JSON.parse(response.text.trim());
            if (parsed.assignedAgent && this.workers.has(parsed.assignedAgent)) {
              return {
                assignedAgent: parsed.assignedAgent,
                agentName: parsed.agentName || 'Jim',
                reason: parsed.reason || 'Optimal agent for task execution'
              };
            }
          }
        } catch (mErr: any) {
          console.warn(`[MAHROrchestrator] Model ${model} routing error (${mErr?.message || mErr}). Trying next candidate...`);
        }
      }
    } catch (e: any) {
      console.warn('[MAHROrchestrator] Routing fallback to heuristic/Jim:', e.message);
    }

    return { assignedAgent: 'agent-jim', agentName: 'Jim', reason: 'Defaulting to lead frontend architect' };
  }

  getWorker(agentKey: string): AgentWorker | undefined {
    const key = agentKey.toLowerCase().replace(/^(agent[-_]?)/, '');
    return this.workers.get(`agent-${key}`) || this.workers.get(key) || this.workers.get(agentKey);
  }

  getCast(): AgentConfig[] {
    return OFFICE_CAST;
  }

  getAvailableAgent(): AgentWorker | undefined {
    for (const config of OFFICE_CAST) {
      const worker = this.workers.get(config.id);
      if (worker && worker.isAvailable) return worker;
    }
    return undefined;
  }
}
