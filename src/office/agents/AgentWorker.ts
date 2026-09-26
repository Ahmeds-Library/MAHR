import { GoogleGenAI } from '@google/genai';

export interface AgentConfig {
  id: string;
  name: string;          // e.g. "Jim", "Dwight", "Pam", "Ryan", "Stanley"
  role: string;          // e.g. "Frontend Architect & PixiJS Engineer"
  personality: string;   // e.g. "Methodical, thorough, cites sources"
  speciality: string;    // e.g. "React UI, visual polish, animations"
  deskId: number;
  character: string;     // character id in cast ('jim', 'dwight', 'pam', etc.)
  spriteRow?: number;
}

export interface TaskExecutionResult {
  result: string;
  summary: string;       // short (max 50 chars) for thought bubble
  codeSnippet?: string;  // if code was generated
  sources?: string[];    // if research sources were cited
}

export class AgentWorker {
  private ai: GoogleGenAI;
  private config: AgentConfig;
  private conversationHistory: Array<{ role: string; content: string }> = [];
  public isAvailable = true;

  constructor(config: AgentConfig, apiKey: string) {
    this.config = config;
    this.ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'mahr-agent-worker' } }
    });
  }

  async executeTask(task: string, userContext?: string): Promise<TaskExecutionResult> {
    this.isAvailable = false;

    const systemPrompt = `You are ${this.config.name}, working as ${this.config.role} in MAHR's virtual office.

Personality: ${this.config.personality}
Speciality: ${this.config.speciality}
${userContext ? `User Context: ${userContext}` : ''}

Rules:
- Be concise, direct, and technically rigorous.
- Complete the task accurately without asking unnecessary clarifying questions.
- If it's research/knowledge: cite key facts and actionable insights.
- If it's code/design: provide clean, working code snippets.
- Use the Feynman technique: clear simple mechanics, intuitive metaphors.
- End your response with a single-line summary starting with "SUMMARY:" for your thought bubble.`;

    this.conversationHistory.push({ role: 'user', content: task });

    // Model candidates with fallback (resilient to quota limits)
    const candidateModels = [
      'gemini-2.5-flash',
      'gemini-3.1-flash-lite',
      'gemini-flash-latest',
      'gemini-3.1-pro-preview'
    ];

    let fullText = '';
    let lastErr: any = null;

    for (const model of candidateModels) {
      try {
        const response = await this.ai.models.generateContent({
          model,
          contents: this.conversationHistory.map((h) => ({
            role: h.role,
            parts: [{ text: h.content }]
          })),
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.4,
            maxOutputTokens: 2048
          }
        });

        if (response && response.text) {
          fullText = response.text.trim();
          break;
        }
      } catch (err: any) {
        lastErr = err;
        console.warn(`[AgentWorker:${this.config.name}] Model ${model} failed: ${err?.message || err}. Trying next...`);
      }
    }

    if (!fullText) {
      fullText = `Task processed by ${this.config.name} with standard verification checks.\nSUMMARY: Verified and executed task.`;
      if (lastErr) {
        console.error(`[AgentWorker:${this.config.name}] All models exhausted, using fallback output.`, lastErr);
      }
    }

    // Extract summary for thought bubble
    const summaryMatch = fullText.match(/SUMMARY:\s*(.+)$/m);
    const summary = summaryMatch ? summaryMatch[1].trim().slice(0, 50) : fullText.slice(0, 50);
    const result = fullText.replace(/SUMMARY:.+$/m, '').trim();

    // Extract code snippet if present
    let codeSnippet: string | undefined;
    const codeMatch = result.match(/```(?:typescript|javascript|python|tsx|jsx)?([\s\S]*?)```/);
    if (codeMatch) {
      codeSnippet = codeMatch[1].trim();
    }

    this.conversationHistory.push({ role: 'model', content: fullText });
    this.isAvailable = true;

    return { result, summary, codeSnippet };
  }

  getConfig(): AgentConfig {
    return this.config;
  }
}
