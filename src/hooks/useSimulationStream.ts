import { useState, useEffect, useRef, useCallback } from "react";
import { SimulationData } from "../lib/simulationTypes";

export interface SimulationStreamStatus {
  isConnected: boolean;
  statusText: string;
  fps: number;
  lastPing: number;
  prompt: string;
}

export function useSimulationStream(options?: {
  endpoint?: string;
  onFrame?: (data: SimulationData) => void;
  autoConnect?: boolean;
}) {
  const endpoint = options?.endpoint || "/simulation-stream";
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [statusText, setStatusText] = useState<string>("Disconnected");
  const [lastFrame, setLastFrame] = useState<SimulationData | null>(null);
  const [activePrompt, setActivePrompt] = useState<string>("");
  const [fps, setFps] = useState<number>(60);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const frameCountRef = useRef<number>(0);
  const lastFpsCalcRef = useRef<number>(performance.now());

  const connect = useCallback(() => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const url = `${protocol}//${host}${endpoint.startsWith("/") ? endpoint : "/" + endpoint}`;

    try {
      setStatusText("Connecting...");
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setStatusText("Connected (60Hz)");
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);

          // Handle incoming simulation frame
          if (payload.type === "sim_frame" && payload.data) {
            setLastFrame(payload.data);
            options?.onFrame?.(payload.data);

            // FPS Counter
            frameCountRef.current++;
            const now = performance.now();
            if (now - lastFpsCalcRef.current >= 1000) {
              setFps(Math.round((frameCountRef.current * 1000) / (now - lastFpsCalcRef.current)));
              frameCountRef.current = 0;
              lastFpsCalcRef.current = now;
            }
          } else if (payload.type === "prompt_ack") {
            setActivePrompt(payload.prompt || "");
            setStatusText(`Simulating: ${payload.prompt}`);
          } else if (payload.type === "status") {
            setStatusText(payload.status);
          }
        } catch (e) {
          // Non-JSON frame
        }
      };

      ws.onerror = () => {
        setIsConnected(false);
        setStatusText("Connection warning - local engine fallback active");
      };

      ws.onclose = () => {
        setIsConnected(false);
        setStatusText("Stream closed. Reconnecting...");
        wsRef.current = null;
        // Exponential / backoff reconnection
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };
    } catch (err: any) {
      console.warn("[Simulation Hook] Stream connection exception:", err.message);
      setStatusText("Offline mode (Local Math Engine Active)");
    }
  }, [endpoint, options]);

  const sendPrompt = useCallback((promptText: string) => {
    setActivePrompt(promptText);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "set_prompt", prompt: promptText }));
    }
  }, []);

  const sendCommand = useCallback((cmd: string, args?: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "command", command: cmd, ...args }));
    }
  }, []);

  useEffect(() => {
    if (options?.autoConnect !== false) {
      connect();
    }
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect, options?.autoConnect]);

  return {
    isConnected,
    statusText,
    lastFrame,
    activePrompt,
    fps,
    sendPrompt,
    sendCommand,
    reconnect: connect
  };
}
