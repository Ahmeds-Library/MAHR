import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, Cpu, Loader2, Radio, Sparkles, Volume2 } from "lucide-react";
import { LiveVoiceActionSyncEvent, VoiceActionDomain } from "../layer1_data/voiceSyncTypes";
import { VOICE_ACTION_SYNC_EVENT } from "../layer2_logic/synchronizedActionNarrator";

const DOMAIN_LABELS: Record<VoiceActionDomain, string> = {
  chalkboard: "Chalkboard Studio",
  mindmap: "Mind Map Engine",
  code: "Code Sandbox",
  slides: "Presenton Studio",
  slides_nav: "Live Deck Sync",
  memory: "Hybrid Memory Bank",
  obsidian: "Obsidian Vault & 128D Graph",
  tasks: "Daily Task Planner",
  simulation: "3D Simulation Lab",
  studypad: "Study Pad Studio",
  office: "Virtual Office Floor",
  routines: "Smart Routines",
  system: "System Control",
};

export const LiveVoiceActionSyncHud: React.FC = () => {
  const [activeEvent, setActiveEvent] = useState<LiveVoiceActionSyncEvent | null>(null);

  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout> | null = null;

    const handleSyncEvent = (e: Event) => {
      const custom = e as CustomEvent<LiveVoiceActionSyncEvent>;
      if (!custom.detail) return;

      if (hideTimer) {
        clearTimeout(hideTimer);
        hideTimer = null;
      }

      setActiveEvent(custom.detail);

      if (custom.detail.phase === "post_action") {
        hideTimer = setTimeout(() => {
          setActiveEvent((prev) => (prev?.id === custom.detail.id ? null : prev));
        }, 3800);
      } else {
        hideTimer = setTimeout(() => {
          setActiveEvent((prev) => (prev?.id === custom.detail.id ? null : prev));
        }, 8500);
      }
    };

    window.addEventListener(VOICE_ACTION_SYNC_EVENT, handleSyncEvent);
    return () => {
      window.removeEventListener(VOICE_ACTION_SYNC_EVENT, handleSyncEvent);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, []);

  const phaseIndex =
    activeEvent?.phase === "pre_action"
      ? 1
      : activeEvent?.phase === "mid_action"
        ? 2
        : activeEvent?.phase === "post_action"
          ? 3
          : 0;

  return (
    <AnimatePresence>
      {activeEvent && (
        <motion.div
          key={activeEvent.id}
          initial={{ opacity: 0, y: 18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.96 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[85] w-[92vw] max-w-xl pointer-events-none"
        >
          <div className="rounded-xl bg-slate-950/92 backdrop-blur-xl border border-indigo-500/35 shadow-[0_18px_50px_rgba(0,0,0,0.65)] px-4 py-3 text-slate-100">
            {/* Top Bar: Domain + 3-Phase Pill Stepper + Latency */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 shrink-0">
                  {activeEvent.phase === "post_action" ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : activeEvent.phase === "mid_action" ? (
                    <Loader2 className="w-3.5 h-3.5 text-indigo-300 animate-spin" />
                  ) : (
                    <Radio className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
                  )}
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300 truncate">
                  {DOMAIN_LABELS[activeEvent.domain] || "Live Voice Sync"}
                </span>
                <span className="text-[11px] text-slate-400 truncate hidden sm:inline">
                  • {activeEvent.title}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-[11px] font-mono tabular-nums text-emerald-300">
                  <Sparkles className="w-2.5 h-2.5" />
                  {activeEvent.latencyMs}ms sync
                </span>
              </div>
            </div>

            {/* 3-Phase Synchronized Narration Indicator (Before -> During -> After) */}
            <div className="grid grid-cols-3 gap-1.5 mb-2.5">
              {[
                { step: 1, label: "1. Instant Cue" },
                { step: 2, label: "2. Live Action" },
                { step: 3, label: "3. Synced" },
              ].map((item) => {
                const isDone = phaseIndex > item.step || (item.step === 3 && phaseIndex === 3);
                const isCurrent = phaseIndex === item.step;
                return (
                  <div
                    key={item.step}
                    className={`flex items-center justify-center gap-1.5 py-1 px-2 rounded-md text-[11px] font-medium border transition-colors ${
                      isCurrent
                        ? "bg-indigo-500/25 border-indigo-400/50 text-white"
                        : isDone
                          ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                          : "bg-slate-900/70 border-slate-800 text-slate-500"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isCurrent
                          ? "bg-cyan-400 animate-ping"
                          : isDone
                            ? "bg-emerald-400"
                            : "bg-slate-600"
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>
                );
              })}
            </div>

            {/* Live Synchronized Vocal Cue Readout */}
            <div className="flex items-center gap-2.5 bg-slate-900/80 border border-slate-800/90 rounded-lg px-3 py-2">
              <Volume2 className="w-4 h-4 text-cyan-400 shrink-0 animate-pulse" />
              <p className="text-xs sm:text-sm text-slate-100 font-medium leading-snug line-clamp-2">
                {activeEvent.spokenCueText}
              </p>
            </div>

            {/* Smooth Progress Bar */}
            <div className="mt-2 h-1 w-full bg-slate-900 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-cyan-400 via-indigo-400 to-emerald-400"
                initial={{ width: "12%" }}
                animate={{ width: `${activeEvent.progressPercent}%` }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
