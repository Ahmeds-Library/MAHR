import React, { useEffect, useRef } from "react";
import { SimulationGraphPoint } from "../../lib/simulationTypes";
import { Activity, Zap, TrendingUp } from "lucide-react";

interface SimulationLiveGraphProps {
  currentSample?: SimulationGraphPoint;
  category?: string;
  title?: string;
}

export const SimulationLiveGraph: React.FC<SimulationLiveGraphProps> = ({
  currentSample,
  category,
  title
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const historyRef = useRef<SimulationGraphPoint[]>([]);

  useEffect(() => {
    if (!currentSample) return;

    if (!historyRef.current) {
      historyRef.current = [];
    }
    // Maintain history buffer of last 80 samples
    historyRef.current.push({ ...currentSample });
    if (historyRef.current.length > 80) {
      historyRef.current.shift();
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear background
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, width, height);

    // Draw grid lines
    ctx.strokeStyle = "rgba(51, 65, 85, 0.4)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.moveTo(0, height / 4);
    ctx.lineTo(width, height / 4);
    ctx.moveTo(0, (height * 3) / 4);
    ctx.lineTo(width, (height * 3) / 4);
    ctx.stroke();

    const history = historyRef.current;
    if (history.length < 2) return;

    const hasEnergy = currentSample.kineticEnergy !== undefined || currentSample.potentialEnergy !== undefined;
    const hasVoltage = currentSample.voltage !== undefined;
    const hasPhase = currentSample.x !== undefined && currentSample.v !== undefined;

    if (hasEnergy) {
      // Find max energy for dynamic scaling
      let maxE = 1;
      history.forEach((h) => {
        if (h.totalEnergy) maxE = Math.max(maxE, h.totalEnergy);
        if (h.kineticEnergy) maxE = Math.max(maxE, h.kineticEnergy);
        if (h.potentialEnergy) maxE = Math.max(maxE, h.potentialEnergy);
      });
      maxE = maxE * 1.15 || 10;

      const stepX = width / (history.length - 1);

      // Plot Total Energy E (Cyan Line)
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 2;
      ctx.beginPath();
      history.forEach((pt, idx) => {
        const val = pt.totalEnergy ?? ((pt.kineticEnergy || 0) + (pt.potentialEnergy || 0));
        const py = height - (val / maxE) * (height - 12) - 6;
        if (idx === 0) ctx.moveTo(0, py);
        else ctx.lineTo(idx * stepX, py);
      });
      ctx.stroke();

      // Plot Kinetic Energy K (Emerald Green Line)
      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      history.forEach((pt, idx) => {
        const val = pt.kineticEnergy || 0;
        const py = height - (val / maxE) * (height - 12) - 6;
        if (idx === 0) ctx.moveTo(0, py);
        else ctx.lineTo(idx * stepX, py);
      });
      ctx.stroke();

      // Plot Potential Energy U (Crimson Red Line)
      ctx.strokeStyle = "#f43f5e";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      history.forEach((pt, idx) => {
        const val = pt.potentialEnergy || 0;
        const py = height - (val / maxE) * (height - 12) - 6;
        if (idx === 0) ctx.moveTo(0, py);
        else ctx.lineTo(idx * stepX, py);
      });
      ctx.stroke();
    } else if (hasVoltage) {
      // AC Voltage Sine Wave
      let maxV = 10;
      history.forEach((h) => {
        if (h.voltage !== undefined) maxV = Math.max(maxV, Math.abs(h.voltage));
      });
      maxV = maxV * 1.2 || 20;

      const stepX = width / (history.length - 1);
      ctx.strokeStyle = "#facc15";
      ctx.lineWidth = 2;
      ctx.beginPath();
      history.forEach((pt, idx) => {
        const val = pt.voltage || 0;
        const py = height / 2 - (val / maxV) * (height / 2 - 8);
        if (idx === 0) ctx.moveTo(0, py);
        else ctx.lineTo(idx * stepX, py);
      });
      ctx.stroke();
    }
  }, [currentSample]);

  if (!currentSample) return null;

  return (
    <div id="simulation-live-graph-panel" className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
          <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>Real-Time Telemetry Curve</span>
        </div>
        {currentSample.kineticEnergy !== undefined && (
          <div className="flex items-center gap-2 text-[10px] font-mono">
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Kinetic (K)
            </span>
            <span className="flex items-center gap-1 text-rose-400">
              <span className="w-2 h-2 rounded-full bg-rose-400 inline-block" /> Potential (U)
            </span>
            <span className="flex items-center gap-1 text-cyan-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" /> Total (E)
            </span>
          </div>
        )}
        {currentSample.voltage !== undefined && (
          <div className="flex items-center gap-1 text-[10px] font-mono text-yellow-400">
            <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" /> Induced Voltage ε(t)
          </div>
        )}
      </div>

      <div className="relative w-full h-[90px] rounded-xl overflow-hidden border border-slate-800/80 bg-slate-950">
        <canvas
          ref={canvasRef}
          width={320}
          height={90}
          className="w-full h-full block"
        />
      </div>
    </div>
  );
};
