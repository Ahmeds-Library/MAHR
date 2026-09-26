import React from "react";
import { X, Keyboard, Mic, MessageSquare, PenTool, BookOpen, Brain, Calendar, Settings, Bot, Cpu, Sparkles, Command } from "lucide-react";

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToggleSession: () => void;
  isSessionActive: boolean;
  onToggleAskMahr?: () => void;
  onToggleAskMyraa?: () => void;
  onToggleWhiteboard: () => void;
  onToggleStudyPad: () => void;
  onToggleJournal: () => void;
  onToggleMemory: () => void;
  onToggleDailyTasks: () => void;
  onToggleSubAgents: () => void;
  onToggleSettings: () => void;
  onToggleModelSwitcher: () => void;
  themeColor?: string;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
  onToggleSession,
  isSessionActive,
  onToggleAskMahr,
  onToggleAskMyraa,
  onToggleWhiteboard,
  onToggleStudyPad,
  onToggleJournal,
  onToggleMemory,
  onToggleDailyTasks,
  onToggleSubAgents,
  onToggleSettings,
  onToggleModelSwitcher,
}) => {
  if (!isOpen) return null;

  const toggleAsk = onToggleAskMahr || onToggleAskMyraa || (() => {});

  const shortcutGroups = [
    {
      title: "🎙️ MAHR Voice & AI Controls",
      items: [
        {
          keys: ["Ctrl", "Space"],
          description: "Start / Stop Live MAHR Voice Connection",
          action: onToggleSession,
          badge: isSessionActive ? "Active" : "Ready",
          badgeColor: isSessionActive ? "bg-rose-500/20 text-rose-300 border-rose-500/40" : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
        },
        {
          keys: ["Ctrl", "K"],
          description: "Open Ask MAHR Text Command Modal",
          action: () => { onClose(); toggleAsk(); },
          icon: <MessageSquare size={14} className="text-purple-400" />
        },
        {
          keys: ["Ctrl", "M"],
          description: "Switch AI Foundation Model",
          action: () => { onClose(); onToggleModelSwitcher(); },
          icon: <Cpu size={14} className="text-indigo-400" />
        }
      ]
    },
    {
      title: "🖥️ Panels & Learning Workspaces",
      items: [
        {
          keys: ["Ctrl", "Shift", "W"],
          description: "Toggle Interactive Whiteboard / Chalkboard",
          action: () => { onClose(); onToggleWhiteboard(); },
          icon: <PenTool size={14} className="text-cyan-400" />
        },
        {
          keys: ["Ctrl", "Shift", "N"],
          description: "Toggle Exam Study Pad & Notes",
          action: () => { onClose(); onToggleStudyPad(); },
          icon: <BookOpen size={14} className="text-emerald-400" />
        },
        {
          keys: ["Ctrl", "Shift", "J"],
          description: "Toggle Transcript History & Journal",
          action: () => { onClose(); onToggleJournal(); },
          icon: <MessageSquare size={14} className="text-fuchsia-400" />
        },
        {
          keys: ["Ctrl", "Shift", "R"],
          description: "Toggle Recollections & Memory Database",
          action: () => { onClose(); onToggleMemory(); },
          icon: <Brain size={14} className="text-purple-400" />
        },
        {
          keys: ["Ctrl", "Shift", "D"],
          description: "Toggle Daily Tasks & Schedule Manager",
          action: () => { onClose(); onToggleDailyTasks(); },
          icon: <Calendar size={14} className="text-amber-400" />
        },
        {
          keys: ["Ctrl", "Shift", "A"],
          description: "Toggle Sub-Agents Studio & Orchestrator",
          action: () => { onClose(); onToggleSubAgents(); },
          icon: <Bot size={14} className="text-indigo-400" />
        },
        {
          keys: ["Ctrl", ","],
          description: "Toggle System & Voice Setup Modal",
          action: () => { onClose(); onToggleSettings(); },
          icon: <Settings size={14} className="text-slate-400" />
        }
      ]
    },
    {
      title: "⌨️ General Navigation & Dialogs",
      items: [
        {
          keys: ["Escape"],
          description: "Close current open modal or dialog",
          action: onClose
        },
        {
          keys: ["Ctrl", "/"],
          description: "Toggle Keyboard Hotkeys Cheat Sheet",
          action: onClose
        }
      ]
    }
  ];

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-2xl bg-slate-950/90 border border-purple-500/30 rounded-3xl shadow-[0_0_60px_rgba(168,85,247,0.25)] overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-purple-950/50 via-slate-900/60 to-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-500/20 border border-purple-500/40 text-purple-300 shadow-inner">
              <Keyboard size={20} className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold font-mono text-white flex items-center gap-2">
                <span>MAHR Keyboard Shortcuts</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 font-sans">
                  Pro Hotkeys
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Control MAHR, trigger voice actions, and toggle workspaces instantly.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Close (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-6 scrollbar-thin scrollbar-thumb-purple-950 scrollbar-track-transparent">
          {shortcutGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-2.5">
              <h3 className="text-xs font-mono font-bold tracking-wider text-purple-300 uppercase flex items-center gap-2">
                {group.title}
              </h3>

              <div className="grid grid-cols-1 gap-2">
                {group.items.map((item, iIdx) => (
                  <div
                    key={iIdx}
                    onClick={item.action}
                    className="group p-2.5 rounded-2xl bg-white/5 hover:bg-purple-950/40 border border-white/10 hover:border-purple-500/40 transition-all flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      {item?.icon || <Sparkles size={14} className="text-slate-500 group-hover:text-purple-400 transition" />}
                      <span className="text-xs text-slate-200 group-hover:text-white font-medium">
                        {item?.description}
                      </span>
                      {item?.badge && (
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {item.keys.map((k, kIdx) => (
                        <React.Fragment key={kIdx}>
                          <kbd className="px-2 py-1 rounded-lg bg-slate-900 border border-white/20 text-[11px] font-mono font-bold text-slate-200 shadow-sm group-hover:border-purple-400/50 group-hover:text-purple-200">
                            {k}
                          </kbd>
                          {kIdx < item.keys.length - 1 && (
                            <span className="text-[10px] text-slate-500 font-mono">+</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Command size={14} className="text-purple-400" />
            <span>Press <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-white/20 text-[10px] font-mono text-slate-200">Esc</kbd> anytime to dismiss panels.</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-mono font-bold text-xs transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
