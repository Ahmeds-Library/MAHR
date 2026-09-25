import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Sliders, Terminal, Mic, Bot, Palette, Sparkles, ChevronRight, ShieldCheck, Monitor, Database } from "lucide-react";
import { SystemSettingsState } from "../../services/settingsService";
import { VoiceCommand } from "../../services/voiceCommandService";
import { CommandMapTab } from "./CommandMapTab";
import { AudioVoiceTab } from "./AudioVoiceTab";
import { PersonaAiTab } from "./PersonaAiTab";
import { StorageThemeTab } from "./StorageThemeTab";
import { DesktopAppsTab } from "./DesktopAppsTab";
import { DatabaseSettingsTab } from "./DatabaseSettingsTab";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SystemSettingsState;
  onUpdateSetting: <K extends keyof SystemSettingsState>(key: K, value: SystemSettingsState[K]) => void;
  onExecuteCommand: (command: VoiceCommand) => void;
  onResetAllSettings: () => void;
  speakNotification?: (text: { ur?: string; en?: string } | string) => void;
  onStatusAlert?: (msg: string) => void;
  initialTab?: "command_map" | "audio_voice" | "persona_ai" | "storage_theme" | "desktop_apps" | "database_sync";
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSetting,
  onExecuteCommand,
  onResetAllSettings,
  speakNotification,
  onStatusAlert,
  initialTab = "command_map"
}) => {
  const [activeTab, setActiveTab] = useState<"command_map" | "audio_voice" | "persona_ai" | "storage_theme" | "desktop_apps" | "database_sync">(
    initialTab
  );

  const sidebarTabs = [
    {
      id: "command_map",
      label: "Shortcuts & Commands",
      sublabel: "Voice & Keyboard hotkeys",
      icon: Terminal,
      badge: "Hotkeys"
    },
    {
      id: "audio_voice",
      label: "Voice & Audio",
      sublabel: "Noise gate, pitch, SFX",
      icon: Mic,
      badge: "Audio"
    },
    {
      id: "persona_ai",
      label: "Persona & Skills",
      sublabel: "Companion tone & cognitive skills",
      icon: Bot,
      badge: "AI Core"
    },
    {
      id: "storage_theme",
      label: "Visuals & Data Retention",
      sublabel: "Hologram theme & journal lifespan",
      icon: Palette,
      badge: "Theme"
    },
    {
      id: "desktop_apps",
      label: "Desktop & Apps",
      sublabel: "Windows, Linux & Web Sync",
      icon: Monitor,
      badge: "Install"
    },
    {
      id: "database_sync",
      label: "Database & Cloud",
      sublabel: "SQLite, PostgreSQL, MongoDB",
      icon: Database,
      badge: "DB"
    }
  ] as const;

  const currentTabInfo = sidebarTabs.find((t) => t.id === activeTab) || sidebarTabs[0];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay - Click outside to close */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[299] bg-black/60 backdrop-blur-sm"
          />

          {/* Slide-in Right Side Panel */}
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="fixed inset-y-0 right-0 z-[300] w-full sm:w-[580px] md:w-[680px] lg:w-[740px] max-w-full bg-[#080914]/98 border-l border-white/15 backdrop-blur-3xl shadow-[-25px_0_70px_rgba(0,0,0,0.85)] flex flex-col md:flex-row h-full overflow-hidden font-sans text-left"
          >
            {/* LEFT SIDEBAR NAVIGATION */}
          <div className="w-full md:w-64 bg-slate-950/80 border-b md:border-b-0 md:border-r border-white/10 flex flex-col shrink-0 p-3.5 sm:p-4 justify-between select-none">
            {/* Sidebar Brand Header */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2.5 pb-3 border-b border-white/10">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-purple-500/30 to-indigo-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow-md shrink-0">
                  <Sliders size={18} className="animate-pulse" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-extrabold font-mono tracking-wider uppercase text-white flex items-center gap-1.5">
                    <span>MAHR SETUP</span>
                  </h3>
                  <p className="text-[10px] font-mono text-slate-400 truncate">
                    System & Intelligence Suite
                  </p>
                </div>
              </div>

              {/* Sidebar Category Navigation Buttons */}
              <div className="flex flex-row md:flex-col gap-1.5 overflow-x-auto md:overflow-y-auto no-scrollbar py-1">
                {sidebarTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`p-2.5 rounded-2xl text-left flex items-center justify-between transition-all duration-200 cursor-pointer shrink-0 md:shrink border ${
                        isActive
                          ? "bg-gradient-to-r from-purple-600/30 to-indigo-600/20 border-purple-400/60 text-white shadow-lg shadow-purple-950/50"
                          : "bg-white/5 md:bg-transparent border-white/5 md:border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${
                            isActive
                              ? "bg-purple-500 text-white border-purple-400 shadow-sm"
                              : "bg-white/5 text-slate-400 border-white/10"
                          }`}
                        >
                          <Icon size={14} />
                        </div>
                        <div className="hidden md:flex flex-col min-w-0">
                          <span
                            className={`text-xs font-bold font-mono tracking-wide truncate ${
                              isActive ? "text-white" : "text-slate-300"
                            }`}
                          >
                            {tab.label}
                          </span>
                          <span className="text-[9px] font-mono text-slate-400 truncate">
                            {tab.sublabel}
                          </span>
                        </div>
                        {/* Mobile label */}
                        <span className="md:hidden text-xs font-bold font-mono whitespace-nowrap">
                          {tab.label.split(" ")[0]}
                        </span>
                      </div>

                      <ChevronRight
                        size={14}
                        className={`hidden md:block transition-transform duration-200 ${
                          isActive ? "text-purple-300 translate-x-0.5" : "text-slate-600"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sidebar Footer System Status Widget */}
            <div className="hidden md:flex flex-col gap-2 p-3 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-mono">
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1 text-slate-400">
                  <ShieldCheck size={12} className="text-emerald-400" />
                  Active Model
                </span>
                <span className="font-bold text-cyan-300 truncate max-w-[90px]">
                  {settings.voiceModel || "2.5 Pro"}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">Persona</span>
                <span className="font-bold text-purple-300">
                  {settings.agentMode === "human" ? "Human Tutor" : "Anime Mode"}
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT MAIN CONTENT PANEL */}
          <div className="flex-1 flex flex-col min-w-0 bg-[#090a14]/90 overflow-hidden">
            {/* Content Top Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-white/10 bg-slate-950/40">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0">
                  <currentTabInfo.icon size={15} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-extrabold font-mono tracking-wider uppercase text-white truncate">
                    {currentTabInfo.label}
                  </h3>
                  <p className="text-[10px] font-mono text-slate-400 truncate">
                    {currentTabInfo.sublabel}
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer border border-white/10 shrink-0"
                title="Close settings"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content Body View */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
              {activeTab === "command_map" && (
                <CommandMapTab
                  onExecuteCommand={(cmd) => {
                    onExecuteCommand(cmd);
                    if (cmd.id.startsWith("open_") || cmd.id === "generate_schedule" || cmd.id === "voice_sleep") {
                      onClose();
                    }
                  }}
                  speakNotification={speakNotification}
                />
              )}

              {activeTab === "audio_voice" && (
                <AudioVoiceTab
                  settings={settings}
                  onUpdateSetting={onUpdateSetting}
                  speakNotification={speakNotification}
                />
              )}

              {activeTab === "persona_ai" && (
                <PersonaAiTab
                  settings={settings}
                  onUpdateSetting={onUpdateSetting}
                  speakNotification={speakNotification}
                  onStatusAlert={onStatusAlert}
                />
              )}

              {activeTab === "storage_theme" && (
                <StorageThemeTab
                  settings={settings}
                  onUpdateSetting={onUpdateSetting}
                  onResetAllSettings={onResetAllSettings}
                  speakNotification={speakNotification}
                  onStatusAlert={onStatusAlert}
                />
              )}

              {activeTab === "desktop_apps" && (
                <DesktopAppsTab
                  onStatusAlert={onStatusAlert}
                />
              )}

              {activeTab === "database_sync" && (
                <DatabaseSettingsTab
                  onStatusAlert={onStatusAlert}
                />
              )}
            </div>
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);
};
