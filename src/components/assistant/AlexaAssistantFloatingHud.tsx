import React, { useState } from "react";
import {
  Sparkles,
  Calendar,
  Mail,
  CheckSquare,
  FileText,
  ChevronDown,
  ChevronUp,
  Settings,
  ShieldCheck,
  Radio,
  Plus,
} from "lucide-react";
import { AlexaVoiceOrb } from "./AlexaVoiceOrb";
import { useAlexaAssistantVoice } from "../../hooks/google/useAlexaAssistantVoice";
import { useGoogleWorkspace } from "../../hooks/google/useGoogleWorkspace";

interface AlexaAssistantFloatingHudProps {
  onOpenSettings?: (tab?: "google_workspace") => void;
  className?: string;
}

export const AlexaAssistantFloatingHud: React.FC<AlexaAssistantFloatingHudProps> = ({
  onOpenSettings,
  className = "",
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const {
    voiceState,
    spokenResponse,
    transcript,
    activityLogs,
    startListening,
    stopListening,
    handleVoiceCommand,
  } = useAlexaAssistantVoice();

  const { isAuthenticated, user } = useGoogleWorkspace();

  const toggleListening = () => {
    if (voiceState === "listening") {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div
      className={`fixed bottom-5 right-5 z-[250] flex flex-col items-end transition-all duration-300 ${className}`}
    >
      {/* Expanded Assistant Intelligence Drawer */}
      {isExpanded && (
        <div data-testid="mahr-ai-hud-panel" className="mb-3 w-80 md:w-96 rounded-2xl border border-white/15 bg-zinc-950/95 backdrop-blur-xl shadow-2xl p-4 text-white animate-in slide-in-from-bottom-4 duration-200">
          {/* Top Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <Radio className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white tracking-wide">MAHR Assistant Engine</h4>
                <p className="text-[10px] text-zinc-400">Alexa-Class Ambient Companion</p>
              </div>
            </div>

            <button
              data-testid="mahr-hud-open-settings"
              onClick={() => onOpenSettings?.("google_workspace")}
              title="Google Account Settings"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>

          {/* User Auth Status Pill */}
          <div className="my-3 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  isAuthenticated ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                }`}
              />
              <span className="text-zinc-300 font-medium truncate max-w-[150px]">
                {isAuthenticated ? user?.email : "Account Disconnected"}
              </span>
            </div>
            {!isAuthenticated && (
              <button
                data-testid="mahr-hud-connect-google"
                onClick={() => onOpenSettings?.("google_workspace")}
                className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 underline"
              >
                Connect
              </button>
            )}
          </div>

          {/* Orb Center */}
          <div className="py-2 flex justify-center">
            <AlexaVoiceOrb
              voiceState={voiceState}
              transcript={transcript}
              spokenResponse={spokenResponse}
              onToggleListening={toggleListening}
            />
          </div>

          {/* Quick Voice Chips */}
          <div className="mt-2 space-y-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
              Quick Workspace Directives
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                data-testid="mahr-command-calendar"
                onClick={() => handleVoiceCommand("Check my calendar schedule")}
                className="flex items-center gap-1.5 p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-[11px] text-zinc-300 hover:text-white transition-all text-left truncate"
              >
                <Calendar className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                <span className="truncate">Check Calendar</span>
              </button>
              <button
                type="button"
                data-testid="mahr-command-inbox"
                onClick={() => handleVoiceCommand("Check my recent unread emails")}
                className="flex items-center gap-1.5 p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-[11px] text-zinc-300 hover:text-white transition-all text-left truncate"
              >
                <Mail className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                <span className="truncate">Check Inbox</span>
              </button>
              <button
                type="button"
                data-testid="mahr-command-tasks"
                onClick={() => handleVoiceCommand("Check my pending tasks")}
                className="flex items-center gap-1.5 p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-[11px] text-zinc-300 hover:text-white transition-all text-left truncate"
              >
                <CheckSquare className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                <span className="truncate">Review Tasks</span>
              </button>
              <button
                type="button"
                data-testid="mahr-command-add-task"
                onClick={() => handleVoiceCommand("Add task review lecture notes")}
                className="flex items-center gap-1.5 p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-[11px] text-zinc-300 hover:text-white transition-all text-left truncate"
              >
                <Plus className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span className="truncate">Add Voice Task</span>
              </button>
              <button
                type="button"
                data-testid="mahr-command-sync"
                onClick={() => handleVoiceCommand("Sync all Google workspace products")}
                className="flex items-center gap-1.5 p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-[11px] text-zinc-300 hover:text-white transition-all text-left truncate col-span-2"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span className="truncate">Verify Sync All Products</span>
              </button>
            </div>
          </div>

          {/* Activity Logs (Live Feed) */}
          {activityLogs.length > 0 && (
            <div className="mt-3 pt-2 border-t border-white/10">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                Recent Assistant Intel
              </span>
              <div className="mt-1 space-y-1 max-h-24 overflow-y-auto pr-1">
                {activityLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-1.5 rounded-lg bg-white/[0.02] border border-white/5 flex items-center justify-between text-[11px]"
                  >
                    <span className="text-zinc-300 truncate max-w-[200px]">{log.title}</span>
                    <span className="text-[10px] text-zinc-500 font-mono">{log.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating Toggle Trigger Button */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          id="mahr-ai-hud-trigger"
          data-testid="mahr-ai-hud-trigger"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 px-3 py-2 rounded-full border border-cyan-500/30 bg-zinc-950/90 hover:bg-zinc-900 text-white backdrop-blur-md shadow-2xl transition-all hover:scale-105 active:scale-95"
        >
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-xs font-semibold tracking-wide text-zinc-200">
            Mahr AI
          </span>
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
          ) : (
            <ChevronUp className="w-3.5 h-3.5 text-zinc-400" />
          )}
        </button>
      </div>
    </div>
  );
};
