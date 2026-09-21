import { SimulationData } from "../lib/simulationTypes";
import { SIMULATION_PRESETS } from "../lib/simulationPresets";

export interface GenerateSimulationResponse {
  status: "success" | "error";
  prompt: string;
  data?: SimulationData;
  code?: string;
  error?: string;
}

export interface GenerateDldCircuitResponse {
  status: "success" | "error";
  prompt: string;
  data?: {
    title: string;
    description: string;
    booleanExpression: string;
    educationalExplanation?: string;
    suggestedExperiments?: string[];
    truthTableHeaders?: string[];
    truthTableRows?: Array<{ inputs: boolean[]; outputs: boolean[] }>;
    nodes: any[];
  };
  error?: string;
}

/**
 * Service to request dynamic 3D simulation code and structures from Gemini API
 */
export async function generateSimulationWithGemini(
  promptText: string,
  modelId?: string
): Promise<GenerateSimulationResponse> {
  try {
    const res = await fetch("/api/simulations/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: promptText, modelId })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || errData.detail || `Server returned status ${res.status}`);
    }

    const json = await res.json();
    return json;
  } catch (err: any) {
    console.warn("[Simulation Service] Remote generation failed, checking presets:", err.message);
    
    // Fallback: Check if the prompt matches one of our rich mathematical presets
    const lower = promptText.toLowerCase();
    const matchedPreset = SIMULATION_PRESETS.find(p => 
      lower.includes(p.name.toLowerCase()) || 
      lower.includes(p.category.toLowerCase()) || 
      lower.includes(p.id.replace("_", " ")) ||
      (lower.includes("lung") && p.id === "lungs_asthma") ||
      (lower.includes("pendulum") && p.id === "double_pendulum") ||
      (lower.includes("solar") && p.id === "solar_system") ||
      (lower.includes("wave") && p.id === "quantum_wave") ||
      (lower.includes("magnet") && p.id === "magnetic_dipole")
    );

    if (matchedPreset) {
      const state = matchedPreset.init();
      const initialData = matchedPreset.update(state, 0, 0.016);
      return {
        status: "success",
        prompt: promptText,
        data: initialData
      };
    }

    return {
      status: "error",
      prompt: promptText,
      error: err.message || "Failed to generate dynamic simulation."
    };
  }
}

/**
 * Service to request dynamic Digital Logic Design (DLD) circuits from Gemini API
 */
export async function generateDldCircuitWithGemini(
  promptText: string,
  modelId?: string
): Promise<GenerateDldCircuitResponse> {
  try {
    const res = await fetch("/api/dld/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: promptText, modelId })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || errData.detail || `Server returned status ${res.status}`);
    }

    const json = await res.json();
    return json;
  } catch (err: any) {
    console.log("[DLD Service] Remote generation fallback:", err.message);
    return {
      status: "error",
      prompt: promptText,
      error: err.message || "Failed to generate dynamic DLD circuit."
    };
  }
}

/**
 * Creates and manages WebSocket connection to /simulation-stream with reconnection
 */
export function createSimulationWebSocket(
  onFrame: (frame: SimulationData) => void,
  onStatusChange?: (status: "connected" | "disconnected" | "error") => void
): { close: () => void; send: (msg: any) => void } {
  let ws: WebSocket | null = null;
  let isClosedManually = false;
  let reconnectTimer: any = null;

  const connect = () => {
    if (isClosedManually) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const url = `${protocol}//${host}/simulation-stream`;

    try {
      ws = new WebSocket(url);

      ws.onopen = () => {
        onStatusChange?.("connected");
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === "sim_frame" && payload.data) {
            onFrame(payload.data);
          }
        } catch (e) {
          // Ignored parse error
        }
      };

      ws.onerror = () => {
        onStatusChange?.("error");
      };

      ws.onclose = () => {
        onStatusChange?.("disconnected");
        if (!isClosedManually) {
          reconnectTimer = setTimeout(connect, 3000);
        }
      };
    } catch (e) {
      onStatusChange?.("disconnected");
    }
  };

  connect();

  return {
    close: () => {
      isClosedManually = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) ws.close();
    },
    send: (msg: any) => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(typeof msg === "string" ? msg : JSON.stringify(msg));
      }
    }
  };
}
