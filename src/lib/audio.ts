/**
 * Audio handling utility for Myraa Live API Voice stream.
 * Handles:
 * - 16kHz layout sampling for microphone stream.
 * - Raw Little Endian Int16 PCM translation.
 * - 24kHz layout output sampling for model voice playback.
 * - Gapless double-buffer queue scheduler.
 * - Interrupt signal immediate stop.
 * - Input & Output AnalyserNodes for real-time waveform visuals.
 */

import { getSkillsFromDB } from "./db";

export type LiveState = "disconnected" | "connecting" | "listening" | "speaking";

// PCM Conversion Helper: converts Float32Array [-1.0, 1.0] to signed Int16 Raw PCM Little Endian
function floatTo16BitPCM(input: Float32Array): ArrayBuffer {
  const buffer = new ArrayBuffer(input.length * 2);
  const view = new DataView(buffer);
  let offset = 0;
  for (let i = 0; i < input.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, input[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
  return buffer;
}

// Float conversion helper: converts signed Int16 array buffer to Float32Array [-1.0, 1.0]
function pcm16ToFloats(uint8Array: Uint8Array): Float32Array {
  const int16 = new Int16Array(
    uint8Array.buffer,
    uint8Array.byteOffset,
    uint8Array.byteLength / 2
  );
  const floats = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i++) {
    floats[i] = int16[i] / 32768.0;
  }
  return floats;
}

// Convert ArrayBuffer to Base64 String
function base64ArrayBuffer(arrayBuffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(arrayBuffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Convert Base64 string to Uint8Array
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export class MyraaAudioSession {
  private ws: WebSocket | null = null;
  
  // Audios contexts (separate to match exact required sample rates)
  private inputAudioCtx: AudioContext | null = null;
  private outputAudioCtx: AudioContext | null = null;
  
  // Audio sources & processors
  private micStream: MediaStream | null = null;
  private micSourceNode: MediaStreamAudioSourceNode | null = null;
  private micProcessorNode: ScriptProcessorNode | null = null;
  
  // Visualisers
  public inputAnalyser: AnalyserNode | null = null;
  public outputAnalyser: AnalyserNode | null = null;
  private outputGainNode: GainNode | null = null;
  
  // Custom smart sound-filtration features
  public autoInterrupt: boolean = false; // By default disabled to prevent sudden stops
  public noiseGateThreshold: number = 0.005; // Base threshold to block low-level room static
  public isMicDenied: boolean = false;
  public isMuted: boolean = false;
  
  // Buffering / Playback details
  private nextStartTime = 0;
  private activeSources: AudioBufferSourceNode[] = [];
  private silenceTimeout: any = null;
  private lastActiveTime = 0;
  
  // State Callbacks
  private onStateChange: (state: LiveState) => void;
  private onTranscription: (role: "user" | "model", text: string) => void;
  private onToolCall: (name: string, args: any, callback: (result: any) => void) => void;
  private onError: (error: string) => void;
  private onMemorySync?: (memories: any[]) => void;
  
  private currentState: LiveState = "disconnected";
  private isActivated = false;

  // Real voice WebSocket speech queue and event listeners
  private pendingSpeechQueue: Array<{ text: string; emotion?: string }> = [];
  private speechListeners: Array<{ onStart?: () => void; onEnd?: () => void }> = [];

  constructor(handlers: {
    onStateChange: (state: LiveState) => void;
    onTranscription: (role: "user" | "model", text: string) => void;
    onToolCall: (name: string, args: any, callback: (result: any) => void) => void;
    onError: (error: string) => void;
    onMemorySync?: (memories: any[]) => void;
  }) {
    this.onStateChange = handlers.onStateChange;
    this.onTranscription = handlers.onTranscription;
    this.onToolCall = handlers.onToolCall;
    this.onError = handlers.onError;
    this.onMemorySync = handlers.onMemorySync;
    globalAudioSession = this;
  }

  private setState(state: LiveState) {
    this.currentState = state;
    this.onStateChange(state);
  }

  public getState(): LiveState {
    return this.currentState;
  }

  /**
   * Pushes a compressed JPEG base64 screenshot frame directly to the live WebSocket server.
   */
  public sendVideoFrame(base64Data: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN && this.currentState !== "disconnected") {
      this.ws.send(JSON.stringify({ type: "video", video: base64Data }));
    }
  }

  // Requests microphone and creates connections
  public async connect(agentMode: string = "human", currentContextText: string = "", subAgent?: { name?: string; role?: string; systemPrompt?: string }) {
    if (this.isActivated) return;
    this.isActivated = true;
    this.setState("connecting");

    let protocol = "wss:";
    let host = "";
    let isLocal = false;

    try {
      // 🎙️ 1. Obtain User Microphone layout IMMEDIATELY under direct click gesture context
      let stream: MediaStream;
      this.isMicDenied = false;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          }
        });
      } catch (err: any) {
        console.warn("Microphone access denied or failed, falling back to dummy silent stream:", err);
        this.isMicDenied = true;
        
        // Create a dummy silent MediaStream so the user can still connect, type messages, and hear voice outputs!
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const dummyCtx = new AudioContextClass();
        const oscillator = dummyCtx.createOscillator();
        const dst = dummyCtx.createMediaStreamDestination();
        const gain = dummyCtx.createGain();
        gain.gain.value = 0;
        oscillator.connect(gain);
        gain.connect(dst);
        oscillator.start();
        stream = dst.stream;
      }

      this.micStream = stream;

      // 🔊 2. Safe, cross-browser AudioContext initialization
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        throw new Error("Holographic audio link unsupported: Web Audio API missing in browser.");
      }

      this.inputAudioCtx = new AudioContextClass({ sampleRate: 16000 });
      this.outputAudioCtx = new AudioContextClass({ sampleRate: 24000 });

      // Ensure Audio Contexts are active and resumed to bypass browser security blocks
      if (this.inputAudioCtx.state === "suspended") {
        await this.inputAudioCtx.resume().catch(() => {});
      }
      if (this.outputAudioCtx.state === "suspended") {
        await this.outputAudioCtx.resume().catch(() => {});
      }
      
      // Setup custom output Analyser & Volume Gains
      this.outputGainNode = this.outputAudioCtx.createGain();
      this.outputAnalyser = this.outputAudioCtx.createAnalyser();
      this.outputAnalyser.fftSize = 256;
      this.outputAnalyser.smoothingTimeConstant = 0.8;
      
      this.outputGainNode.connect(this.outputAnalyser);
      this.outputAnalyser.connect(this.outputAudioCtx.destination);

      // Setup custom input Analyser
      this.inputAnalyser = this.inputAudioCtx.createAnalyser();
      this.inputAnalyser.fftSize = 256;
      
      this.micSourceNode = this.inputAudioCtx.createMediaStreamSource(this.micStream);
      this.micSourceNode.connect(this.inputAnalyser);

      // Stream input PCM 16-bit to WS
      this.micProcessorNode = this.inputAudioCtx.createScriptProcessor(2048, 1, 1);
      this.micSourceNode.connect(this.micProcessorNode);
      this.micProcessorNode.connect(this.inputAudioCtx.destination);

      this.micProcessorNode.onaudioprocess = (e) => {
        if (this.currentState === "disconnected" || this.currentState === "connecting") return;
        if (this.isMuted) return;
        
        // If Myraa is speaking, and auto-interrupt is disabled, we block mic transmission entirely.
        // This guarantees she will finish her speech without any sudden cuttings or feedback stopping.
        if (this.currentState === "speaking" && !this.autoInterrupt) {
          return;
        }

        const channelData = e.inputBuffer.getChannelData(0);
        
        // Calculate absolute peak of mic input to measure volume/energy
        let peak = 0;
        for (let i = 0; i < channelData.length; i++) {
          const absVal = Math.abs(channelData[i]);
          if (absVal > peak) {
            peak = absVal;
          }
        }

        // SMART CHALKBOARD DSP: Get current speaker/output audio volume in real-time.
        // If Myraa is actively vocalizing, we ignore/gate out the mic to completely block speaker echo feedback.
        // If she is in silent gaps or breath pauses, we lower the gate so user's natural voice can trigger interruption.
        let speakerVolume = 0;
        if (this.outputAnalyser) {
          try {
            const array = new Float32Array(this.outputAnalyser.fftSize);
            if (typeof this.outputAnalyser.getFloatTimeDomainData === "function") {
              this.outputAnalyser.getFloatTimeDomainData(array);
              let sum = 0;
              for (let i = 0; i < array.length; i++) {
                sum += array[i] * array[i];
              }
              speakerVolume = Math.sqrt(sum / array.length);
            }
          } catch (err) {
            speakerVolume = 0;
          }
        }

        // Apply customizable noise gate threshold.
        let activeThreshold = this.noiseGateThreshold;
        if (this.currentState === "speaking") {
          if (speakerVolume > 0.015) {
            // Myraa is actively speaking words right now. Set threshold to a balanced level to reject feedback echo but allow clear interruption
            activeThreshold = 0.20;
          } else {
            // Myraa is in speaking state but currently silent (between syllables/words).
            // Set threshold to a sensitive level so a natural spoken word triggers interjection effortlessly.
            activeThreshold = 0.02;
          }
        }

        const now = performance.now();
        const hasActiveSpeech = peak >= activeThreshold;
        
        if (hasActiveSpeech) {
          this.lastActiveTime = now;
        }

        const isWithinHangover = (now - this.lastActiveTime) < 1200; // 1.2s VAD hangover prevents clipping of syllable/word endings

        if (!hasActiveSpeech && !isWithinHangover) {
          return; // Gate keeps silent or low hums out of Gemini
        }
        
        // Convert to base64 Int16 Little Endian PCM
        const pcmBuffer = floatTo16BitPCM(channelData);
        const base64 = base64ArrayBuffer(pcmBuffer);
        
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ audio: base64 }));
        }
      };

      // 🔌 3. Establish custom WebSocket server bridge only after audio devices are active
      protocol = "wss:";
      host = "";

      // Check if host is valid and does not belong to the AI Studio outer platform framing domains
      isLocal = typeof window !== "undefined" && 
        window.location && 
        (window.location.hostname === "localhost" || 
         window.location.hostname === "127.0.0.1" || 
         window.location.hostname === "0.0.0.0");

      const isValidHost = (h: string | null | undefined): boolean => {
        if (!h) return false;
        const cleaned = h.trim().toLowerCase();
        if (cleaned === "" || cleaned === "null" || cleaned === "undefined") return false;
        
        // If we are on a remote page, any local/loopback host is invalid for WebSocket connections
        if (!isLocal) {
          if (
            cleaned.includes("localhost") ||
            cleaned.includes("127.0.0.1") ||
            cleaned.includes("0.0.0.0")
          ) {
            return false;
          }
        }

        if (
          cleaned.includes("aistudio.google.com") ||
          cleaned.includes("ai.studio")
        ) {
          return false;
        }
        return true;
      };

      // 1. Try standard window.location.host FIRST (highly reliable and direct in browser)
      try {
        if (window.location && window.location.host) {
          const lHost = window.location.host;
          if (isValidHost(lHost)) {
            host = lHost;
            protocol = window.location.protocol === "http:" ? "ws:" : "wss:";
            console.log("[Myraa WS] Resolved WebSocket endpoint from window.location:", protocol, host);
          }
        }
      } catch (e) {
        console.warn("[Myraa WS] Failed to read window.location.host directly:", e);
      }

      // 2. Fall back to fetching /api/ws-info ONLY if window.location was empty or invalid
      if (!host) {
        try {
          const wsInfoRes = await fetch("/api/ws-info").catch(() => null);
          if (wsInfoRes && wsInfoRes.ok) {
            const wsInfo = await wsInfoRes.json();
            if (wsInfo && wsInfo.host && wsInfo.protocol) {
              const serverHost = wsInfo.host;
              if (isValidHost(serverHost)) {
                host = serverHost;
                protocol = wsInfo.protocol;
                console.log("[Myraa WS] Resolved WebSocket endpoint from API server:", protocol, host);
              }
            }
          }
        } catch (err) {
          console.error("[Myraa WS] Failed to fetch WS endpoint info from server:", err);
        }
      }

      if (!isValidHost(host)) {
        host = "";
        console.warn("[Myraa WS] window.location.host is empty or invalid. Finding fallback origin sources...");
        
        // Fallback 1: Try window.location.href (contains full valid URL even in sandboxed iframes)
        try {
          if (window.location && window.location.href) {
            const hrefUrl = new URL(window.location.href);
            if (isValidHost(hrefUrl.host)) {
              host = hrefUrl.host;
              protocol = hrefUrl.protocol === "http:" ? "ws:" : "wss:";
              console.log("[Myraa WS] Resolved host from window.location.href:", host);
            }
          }
        } catch (e) {
          console.error("[Myraa WS] Failed to parse window.location.href URL:", e);
        }

        // Fallback 2: Try document.baseURI
        if (!host && document.baseURI) {
          try {
            const baseUriUrl = new URL(document.baseURI);
            if (isValidHost(baseUriUrl.host)) {
              host = baseUriUrl.host;
              protocol = baseUriUrl.protocol === "http:" ? "ws:" : "wss:";
              console.log("[Myraa WS] Resolved host from document.baseURI:", host);
            }
          } catch (e) {
            console.error("[Myraa WS] Failed to parse document.baseURI URL:", e);
          }
        }

        // Fallback 3: Try checking scripts on the page which have absolute URLs (Vite maps these to absolute URLs even in sandboxed contexts)
        if (!host) {
          const scripts = document.getElementsByTagName("script");
          for (let i = 0; i < scripts.length; i++) {
            const src = scripts[i].src;
            if (src && src.startsWith("http")) {
              try {
                const scriptUrl = new URL(src);
                if (isValidHost(scriptUrl.host)) {
                  host = scriptUrl.host;
                  protocol = scriptUrl.protocol === "http:" ? "ws:" : "wss:";
                  console.log("[Myraa WS] Resolved host from script tag src:", host);
                  break;
                }
              } catch (err) {}
            }
          }
        }

        // Fallback 4: Try window.location.ancestorOrigins if available
        if (!host && (window.location as any).ancestorOrigins && (window.location as any).ancestorOrigins.length > 0) {
          try {
            const ancestorOrigin = (window.location as any).ancestorOrigins[0];
            const ancestorUrl = new URL(ancestorOrigin);
            if (isValidHost(ancestorUrl.host)) {
              host = ancestorUrl.host;
              protocol = ancestorUrl.protocol === "http:" ? "ws:" : "wss:";
              console.log("[Myraa WS] Resolved host from ancestorOrigin:", host);
            }
          } catch (e) {}
        }

        // Fallback 5: Try document.referrer
        if (!host && document.referrer) {
          try {
            const refUrl = new URL(document.referrer);
            if (isValidHost(refUrl.host)) {
              host = refUrl.host;
              protocol = refUrl.protocol === "http:" ? "ws:" : "wss:";
              console.log("[Myraa WS] Resolved host from document.referrer:", host);
            }
          } catch (e) {
            console.error("[Myraa WS] Failed to parse document.referrer URL:", e);
          }
        }

        // Fallback 6: Try window.parent.location.host if same-origin is not blocked
        if (!host) {
          try {
            if (window.parent && window.parent.location && window.parent.location.host) {
              const pHost = window.parent.location.host;
              if (isValidHost(pHost)) {
                host = pHost;
                protocol = window.parent.location.protocol === "http:" ? "ws:" : "wss:";
                console.log("[Myraa WS] Resolved host from parent window:", host);
              }
            }
          } catch (e) {}
        }

        // Fallback 7: Last resort, use window.location.host (includes dynamic port) or localhost:3000
        if (!host) {
          let defaultHost = "";
          try {
            defaultHost = window.location.host || window.location.hostname;
          } catch (e) {}
          host = isValidHost(defaultHost) ? defaultHost : "localhost:3000";
          try {
            protocol = window.location.protocol === "http:" ? "ws:" : "wss:";
          } catch (e) {}
          console.log("[Myraa WS] Falling back to location.host or default:", host);
        }
      }
      
      // Load enabled skills from IndexedDB
      let skillsParam = "";
      try {
        const storedSkills = await getSkillsFromDB();
        if (storedSkills && storedSkills.length > 0) {
          let enabledSkills = storedSkills.filter((s: any) => s.enabled);
          
          // Auto-detection: If currentContextText is provided, score and sort skills by relevance,
          // then select the most relevant ones (e.g., top 1 to 3) to include in the session context.
          if (currentContextText && currentContextText.trim()) {
            const contextLower = currentContextText.toLowerCase();
            const scored = enabledSkills.map(skill => {
              let score = 0;
              const nameLower = (skill.name || "").toLowerCase();
              const descLower = (skill.description || "").toLowerCase();
              const instLower = (skill.instructions || "").toLowerCase();
              
              // Score based on name/description keywords or tags
              if (nameLower.includes("python") && (contextLower.includes("python") || contextLower.includes("code") || contextLower.includes("programming") || contextLower.includes("script"))) score += 15;
              if (nameLower.includes("math") && (contextLower.includes("math") || contextLower.includes("equation") || contextLower.includes("solve") || contextLower.includes("formula") || contextLower.includes("calculus") || contextLower.includes("integral"))) score += 15;
              if (nameLower.includes("physics") && (contextLower.includes("physics") || contextLower.includes("gravity") || contextLower.includes("quantum") || contextLower.includes("thermodynamics"))) score += 15;
              if ((nameLower.includes("wellness") || nameLower.includes("breath")) && (contextLower.includes("breath") || contextLower.includes("calm") || contextLower.includes("stress") || contextLower.includes("anxiety") || contextLower.includes("wellness"))) score += 15;
              if (nameLower.includes("socratic") && (contextLower.includes("why") || contextLower.includes("how") || contextLower.includes("think") || contextLower.includes("question") || contextLower.includes("feynman"))) score += 8;
              
              // Count matching keywords between skill content and currentContextText
              const words = `${nameLower} ${descLower} ${instLower}`.split(/[\s,.:;?()'"\-\[\]]+/);
              const uniqueKeywords = Array.from(new Set(words)).filter(w => w.length > 3 && !["with", "your", "this", "that", "from", "have", "will", "should", "about", "expert", "specialist"].includes(w));
              
              uniqueKeywords.forEach(kw => {
                if (contextLower.includes(kw)) {
                  score += 2;
                }
              });
              
              return { skill, score };
            });

            const matched = scored.filter(item => item.score >= 2).sort((a, b) => b.score - a.score).map(item => item.skill);
            
            if (matched.length > 0) {
              enabledSkills = matched;
            } else {
              // If none matched the specific context, default to the default template skills if enabled
              enabledSkills = enabledSkills.filter((s: any) => s.isTemplate);
            }
          }

          // Limit total skills count to 3 to be exceptionally conservative and completely avoid any HTTP header issues
          if (enabledSkills.length > 3) {
            console.log(`[Myraa WS] Limiting auto-detected active skills from ${enabledSkills.length} down to top 3 to keep query string ultra-light.`);
            enabledSkills = enabledSkills.slice(0, 3);
          }
          
          // Dynamically shrink the serialized active skills payload so it easily fits within browser limits (e.g., <1500 characters)
          let maxInstLength = 250;
          let maxDescLength = 100;
          let encoded = "";
          let finalSkillsCount = enabledSkills.length;
          
          while (finalSkillsCount > 0) {
            const currentSubset = enabledSkills.slice(0, finalSkillsCount);
            maxInstLength = 250;
            maxDescLength = 100;
            
            while (maxInstLength > 40) {
              const compactSkills = currentSubset.map((s: any) => {
                let inst = s.instructions || "";
                inst = inst.replace(/\s+/g, " ").trim();
                if (inst.length > maxInstLength) {
                  inst = inst.substring(0, maxInstLength) + "...";
                }
                
                let desc = s.description || "";
                desc = desc.replace(/\s+/g, " ").trim();
                if (desc.length > maxDescLength) {
                  desc = desc.substring(0, maxDescLength) + "...";
                }
                
                return {
                  name: s.name,
                  description: desc,
                  instructions: inst
                };
              });
              
              encoded = encodeURIComponent(JSON.stringify(compactSkills));
              if (encoded.length < 1500) {
                break;
              }
              maxInstLength -= 30;
              maxDescLength = Math.max(40, maxDescLength - 15);
            }
            
            // If it fits within 1500 characters, we are good to go!
            if (encoded.length < 1500) {
              break;
            }
            // Otherwise, reduce the count of active skills sent and try again
            finalSkillsCount--;
          }
          
          if (encoded) {
            skillsParam = `&skills=${encoded}`;
          }
        }
      } catch (err) {
        console.error("Error reading skills from database for ws handshake:", err);
      }

      // Force secure protocol if page is served over HTTPS, or if the target host is remote (non-localhost)
      if (
        (typeof window !== "undefined" && window.location && window.location.protocol === "https:") ||
        (host && !host.includes("localhost") && !host.includes("127.0.0.1") && !host.includes("0.0.0.0"))
      ) {
        protocol = "wss:";
      }

      let subAgentParams = "";
      if (subAgent) {
        if (subAgent.name) subAgentParams += `&subAgentName=${encodeURIComponent(subAgent.name)}`;
        if (subAgent.role) subAgentParams += `&subAgentRole=${encodeURIComponent(subAgent.role)}`;
        if (subAgent.systemPrompt) subAgentParams += `&subAgentPrompt=${encodeURIComponent(subAgent.systemPrompt)}`;
      }

      // Construct a clean URL string, removing any spaces
      let wsUrlStr = `${protocol}//${host}/live?agentMode=${encodeURIComponent(agentMode)}${subAgentParams}${skillsParam}`;
      wsUrlStr = wsUrlStr.replace(/\s+/g, "");

      const sendDiagnosticLog = (message: string, errorMsg?: string) => {
        fetch("/api/ws-log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message,
            url: wsUrlStr,
            error: errorMsg || "",
            host,
            protocol,
            isLocal
          })
        }).catch(() => {});
      };

      sendDiagnosticLog("Initializing WebSocket");

      console.log("[Myraa WS] Initializing WebSocket with URL:", wsUrlStr);
      this.ws = new WebSocket(wsUrlStr);
      this.ws.binaryType = "blob";

      this.ws.onopen = () => {
        console.log("[Myraa] Connected to server side WS bridge");
        if (!this.isActivated) return;
        this.setState("listening");
      };

      this.ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Root Error Handler message
          if (data.type === "error") {
            this.onError(data.error);
            this.disconnect();
            return;
          }

          // Handle server-side states
          if (data.type === "status") {
            console.log("[Myraa WS Status]:", data.status);
            if (data.status === "connecting_gemini") {
              // Wait for Gemini Live connection
            } else if (data.status === "connected") {
              this.setState("listening");
              this.flushPendingSpeechQueue();
            } else if (data.status === "session_closed") {
              this.disconnect();
            }
            return;
          }

          // Handle audio payload (24kHzPCM model response)
          if (data.type === "audio" && data.audio) {
            this.playAudioPCMChunk(data.audio);
          }

          // Handle interruption signal (e.g. user talked over Myraa)
          if (data.type === "interrupted") {
            this.handleInterruption();
          }

          // Turn complete
          if (data.type === "turnComplete") {
            // Once Myraa completes speaking, change visual state back to listening after a safe room decay interval
            if (this.activeSources.length === 0 && this.currentState === "speaking") {
              if (this.silenceTimeout) {
                clearTimeout(this.silenceTimeout);
              }
              this.silenceTimeout = setTimeout(() => {
                if (this.activeSources.length === 0 && this.currentState === "speaking") {
                  this.setState("listening");
                }
              }, 800);
            }
          }

          // Handle live captions transcription
          if (data.type === "transcription") {
            this.onTranscription(data.role, data.text);
          }

          // Handle memory synchronization
          if (data.type === "memory_sync" && data.memories) {
            if (this.onMemorySync) {
              this.onMemorySync(data.memories);
            }
          }

          // Handle Tool Calling
          if (data.type === "toolCall") {
            const { callId, name, args } = data;
            this.onToolCall(name, args, (result) => {
              // Send back execution result to server bridge
              if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({
                  type: "toolResponse",
                  id: callId,
                  name: name,
                  output: result
                }));
              }
            });
          }

        } catch (parseError) {
          console.error("Error reading server packet:", parseError);
        }
      };

      this.ws.onerror = (wsError) => {
        console.warn("WebSocket transport warning:", wsError);
        sendDiagnosticLog("WebSocket.onerror", String(wsError));
        if (this.isActivated) {
          this.onError("Holographic network link lost. Please check connection.");
        }
        this.disconnect();
      };

      this.ws.onclose = () => {
        console.log("WebSocket connection closed");
        sendDiagnosticLog("WebSocket.onclose");
        this.disconnect();
      };

    } catch (e: any) {
      console.error("Connection establish sequence failed:", e);
      try {
        fetch("/api/ws-log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: "Connection catch block",
            error: e.message || String(e),
            host: host || "",
            protocol: protocol || "",
            isLocal: isLocal || false
          })
        }).catch(() => {});
      } catch (logErr) {}
      this.onError(e.message || "Failed to initialize active channel.");
      this.disconnect();
    }
  }

  // Interruption triggers: stops all active audio players immediately
  private handleInterruption() {
    console.log("[Audio] Interruption signal received; flushing play logs.");
    if (this.silenceTimeout) {
      clearTimeout(this.silenceTimeout);
      this.silenceTimeout = null;
    }
    
    // Stop all playing nodes
    this.activeSources.forEach((source) => {
      try {
        source.stop();
      } catch (err) {
        // Already finished or stopped
      }
    });
    this.activeSources = [];
    this.nextStartTime = 0;
    
    // Notify speech ended
    this.notifySpeechEnd();

    // Set state back to user listening
    this.setState("listening");
  }

  private notifySpeechStart() {
    this.speechListeners.forEach((l) => {
      try {
        l.onStart?.();
      } catch (e) {}
    });
  }

  private notifySpeechEnd() {
    this.speechListeners.forEach((l) => {
      try {
        l.onEnd?.();
      } catch (e) {}
    });
  }

  // Direct raw PCM chunk scheduled playback at 24kHz
  private playAudioPCMChunk(base64Audio: string) {
    if (!this.outputAudioCtx || !this.outputGainNode) return;

    try {
      if (this.currentState !== "speaking") {
        this.setState("speaking");
        this.notifySpeechStart();
      }
      
      // Clear any pending transition back to listening mode
      if (this.silenceTimeout) {
        clearTimeout(this.silenceTimeout);
        this.silenceTimeout = null;
      }

      const uint8Array = base64ToUint8Array(base64Audio);
      const floats = pcm16ToFloats(uint8Array);

      // Create AudioBuffer of 24000Hz (the exact playback sample rate of Gemini outputs)
      const buffer = this.outputAudioCtx.createBuffer(1, floats.length, 24000);
      buffer.getChannelData(0).set(floats);

      // Create Buffer source
      const source = this.outputAudioCtx.createBufferSource();
      source.buffer = buffer;

      // Connect source to gain which is routed to analyser & speakers
      source.connect(this.outputGainNode);

      const currentTime = this.outputAudioCtx.currentTime;
      
      // Gapless scheduler sync
      if (this.nextStartTime < currentTime) {
        // Start fresh: 30ms ahead to bridge schedule timing
        this.nextStartTime = currentTime + 0.03;
      }

      source.start(this.nextStartTime);
      this.nextStartTime += buffer.duration;

      // Keep reference to handle real-time interruptions
      source.onended = () => {
        const index = this.activeSources.indexOf(source);
        if (index > -1) {
          this.activeSources.splice(index, 1);
        }
        
        // If there are no more active play nodes, we wait for a slight debounce delay
        // to handle brief network gaps and allow the room's residual feedback to decay.
        if (this.activeSources.length === 0 && this.currentState === "speaking") {
          if (this.silenceTimeout) {
            clearTimeout(this.silenceTimeout);
          }
          this.silenceTimeout = setTimeout(() => {
            if (this.activeSources.length === 0 && this.currentState === "speaking") {
              this.setState("listening");
              this.notifySpeechEnd();
              if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("myraa-speech-end"));
              }
            }
          }, 800); // 800ms gives space for network packets and allows echoing to completely decay
        }
      };

      this.activeSources.push(source);

    } catch (playbackError) {
      console.error("PCM Chunk buffering/playback failed:", playbackError);
    }
  }

  // Fully cleanup and release microphones & connection sockets
  public disconnect() {
    this.isActivated = false;
    this.setState("disconnected");

    if (this.silenceTimeout) {
      clearTimeout(this.silenceTimeout);
      this.silenceTimeout = null;
    }

    // Close WS socket
    if (this.ws) {
      try {
        this.ws.close();
      } catch (e) {}
      this.ws = null;
    }

    // Stop and release user microphone streams
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {}
      });
      this.micStream = null;
    }

    // Disconnect routing nodes
    if (this.micProcessorNode) {
      try {
        this.micProcessorNode.disconnect();
      } catch (e) {}
      this.micProcessorNode = null;
    }

    if (this.micSourceNode) {
      try {
        this.micSourceNode.disconnect();
      } catch (e) {}
      this.micSourceNode = null;
    }

    // Close Audio contexts
    if (this.inputAudioCtx) {
      try {
        this.inputAudioCtx.close();
      } catch (e) {}
      this.inputAudioCtx = null;
    }

    if (this.outputAudioCtx) {
      try {
        this.outputAudioCtx.close();
      } catch (e) {}
      this.outputAudioCtx = null;
    }

    this.activeSources = [];
    this.nextStartTime = 0;
    this.inputAnalyser = null;
    this.outputAnalyser = null;
    this.outputGainNode = null;
  }

  // Mute / Unmute Microphone Controls
  public mute() {
    this.isMuted = true;
    if (this.micStream) {
      this.micStream.getAudioTracks().forEach((track) => {
        track.enabled = false;
      });
    }
  }

  public unmute() {
    this.isMuted = false;
    if (this.micStream) {
      this.micStream.getAudioTracks().forEach((track) => {
        track.enabled = true;
      });
    }
  }

  public toggleMute(): boolean {
    if (this.isMuted) {
      this.unmute();
    } else {
      this.mute();
    }
    return this.isMuted;
  }

  // Direct realtime text transmission into Gemini Live Session
  public sendTextMessage(text: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN && text.trim()) {
      try {
        this.ws.send(JSON.stringify({ type: "text", text: text.trim() }));
      } catch (err) {
        console.error("[Myraa WS] Error sending realtime text message:", err);
      }
    }
  }

  // Flushes queued speech messages once WebSocket is fully connected
  public flushPendingSpeechQueue() {
    if (this.pendingSpeechQueue.length > 0 && this.ws && this.ws.readyState === WebSocket.OPEN) {
      const items = [...this.pendingSpeechQueue];
      this.pendingSpeechQueue = [];
      items.forEach((item) => {
        try {
          this.ws?.send(JSON.stringify({ type: "speak", text: item.text, emotion: item.emotion }));
        } catch (err) {
          console.error("[Myraa WS] Error flushing speech queue item:", err);
        }
      });
    }
  }

  // Real Voice WebSocket speech generator - transmits directly into Gemini Live Session
  public speakViaWebSocket(
    text: string, 
    options?: { emotion?: string; mood?: string; speechPitch?: number; speechRate?: number } | string
  ): boolean {
    const cleanText = (text || "").trim();
    if (!cleanText) return false;

    const emotion = typeof options === "string" ? options : options?.emotion;
    const mood = typeof options === "object" ? options?.mood : undefined;
    const speechPitch = typeof options === "object" ? options?.speechPitch : undefined;
    const speechRate = typeof options === "object" ? options?.speechRate : undefined;

    // Immediately stop any currently playing voice buffers to prevent overlapping speech
    this.stopPlayback();

    // If disconnected, trigger connect immediately
    if (this.currentState === "disconnected") {
      this.connect().catch((e) => console.warn("[Myraa WS] Auto-connect on speak error:", e));
    }

    const payload = { 
      type: "speak", 
      text: cleanText, 
      emotion, 
      mood, 
      speechPitch, 
      speechRate 
    };

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(payload));
        return true;
      } catch (err) {
        console.error("[Myraa WS] Failed to send speak message over WebSocket:", err);
        this.pendingSpeechQueue.push({ text: cleanText, emotion });
        return false;
      }
    } else {
      this.pendingSpeechQueue.push({ text: cleanText, emotion });
      return true;
    }
  }

  // Halts all active audio sources immediately
  public stopPlayback() {
    this.handleInterruption();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify({ type: "stop_speaking" }));
      } catch (e) {}
    }
  }

  // Subscribe to speech playback start and end events
  public addSpeechListener(listener: { onStart?: () => void; onEnd?: () => void }): () => void {
    this.speechListeners.push(listener);
    return () => {
      this.speechListeners = this.speechListeners.filter((l) => l !== listener);
    };
  }
}

// Global active audio session instance for application-wide real voice routing
let globalAudioSession: MyraaAudioSession | null = null;
const pendingGlobalSpeechQueue: Array<{
  text: string;
  options?: { emotion?: string; mood?: string; speechPitch?: number; speechRate?: number; onStart?: () => void; onEnd?: () => void };
}> = [];

export function setGlobalAudioSession(session: MyraaAudioSession | null) {
  globalAudioSession = session;
  if (session && pendingGlobalSpeechQueue.length > 0) {
    const queue = [...pendingGlobalSpeechQueue];
    pendingGlobalSpeechQueue.length = 0;
    queue.forEach((item) => {
      speakViaWebSocket(item.text, item.options);
    });
  }
}

export function getActiveAudioSession(): MyraaAudioSession | null {
  return globalAudioSession;
}

/**
 * Global Real-Voice Speech Dispatcher.
 * Routes all speech synthesis directly through the real-time WebSocket connection to Gemini Live.
 */
export function speakViaWebSocket(
  text: string,
  options?: { emotion?: string; mood?: string; speechPitch?: number; speechRate?: number; onStart?: () => void; onEnd?: () => void }
): boolean {
  if (globalAudioSession) {
    if (options?.onStart || options?.onEnd) {
      const unsub = globalAudioSession.addSpeechListener({
        onStart: options.onStart,
        onEnd: () => {
          options.onEnd?.();
          unsub();
        },
      });
    }
    return globalAudioSession.speakViaWebSocket(text, {
      emotion: options?.emotion,
      mood: options?.mood,
      speechPitch: options?.speechPitch,
      speechRate: options?.speechRate,
    });
  } else {
    // Queue until the session mounts
    pendingGlobalSpeechQueue.push({ text, options });
    return true;
  }
}

export function stopAllWebSocketSpeech(): void {
  if (globalAudioSession) {
    globalAudioSession.stopPlayback();
  }
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {}
  }
}
