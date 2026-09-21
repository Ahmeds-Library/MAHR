import React, { useState } from "react";
import { Search, Mic, Terminal, CheckCircle2, Play, Keyboard, Sparkles, Command } from "lucide-react";
import { VOICE_COMMANDS_LIST, VoiceCommand } from "../../services/voiceCommandService";

interface CommandMapTabProps {
  onExecuteCommand: (command: VoiceCommand) => void;
  speakNotification?: (text: { ur?: string; en?: string } | string) => void;
}

const KEYBOARD_SHORTCUTS_LIST = [
  {
    keys: ["Ctrl", "Space"],
    title: "Start / Stop Voice Connection",
    category: "voice",
    description: "Toggle live multimodal voice conversation with MAHR.",
    badge: "Voice Hotkey"
  },
  {
    keys: ["Ctrl", "K"],
    title: "Ask MAHR Text Command Modal",
    category: "tools",
    description: "Open instant text query dialog for prompt engineering.",
    badge: "AI Quick Access"
  },
  {
    keys: ["Ctrl", "M"],
    title: "Switch AI Foundation Model",
    category: "tools",
    description: "Cycle or choose Gemini 2.5 Flash, Pro, or Thinking models.",
    badge: "Model Engine"
  },
  {
    keys: ["Ctrl", "Shift", "W"],
    title: "Toggle Whiteboard / Chalkboard",
    category: "navigation",
    description: "Open or close the interactive classroom chalkboard.",
    badge: "Canvas"
  },
  {
    keys: ["Ctrl", "Shift", "N"],
    title: "Toggle Exam Study Pad",
    category: "study",
    description: "Open persistent markdown study notes and key points.",
    badge: "Notepad"
  },
  {
    keys: ["Ctrl", "Shift", "J"],
    title: "Toggle Transcript Journal",
    category: "navigation",
    description: "View full saved transcript logs and conversation history.",
    badge: "Journal"
  },
  {
    keys: ["Ctrl", "Shift", "R"],
    title: "Toggle Memory Recalls",
    category: "study",
    description: "Access long-term student memory records and facts.",
    badge: "Recollections"
  },
  {
    keys: ["Ctrl", "Shift", "D"],
    title: "Toggle Daily Tasks & Schedule",
    category: "study",
    description: "Open habit tracker, task manager, and schedule.",
    badge: "Planner"
  },
  {
    keys: ["Ctrl", "Shift", "A"],
    title: "Toggle Sub-Agents Studio",
    category: "tools",
    description: "Switch specialized AI teaching sub-agents and tutors.",
    badge: "Sub-Agents"
  },
  {
    keys: ["Ctrl", ","],
    title: "Voice & System Setup Modal",
    category: "navigation",
    description: "Open the system configuration, audio, and theme modal.",
    badge: "Settings"
  },
  {
    keys: ["Ctrl", "/"],
    title: "Hotkeys Cheat Sheet",
    category: "navigation",
    description: "Show full keyboard shortcut overlay modal.",
    badge: "Help"
  },
  {
    keys: ["Esc"],
    title: "Dismiss Modal / Overlay",
    category: "navigation",
    description: "Instantly close active modal, slide-over, or dialog.",
    badge: "Close"
  }
];

export const CommandMapTab: React.FC<CommandMapTabProps> = ({
  onExecuteCommand,
  speakNotification
}) => {
  const [activeType, setActiveType] = useState<"voice" | "keyboard">("voice");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [executedCommandId, setExecutedCommandId] = useState<string | null>(null);

  const categories = [
    { id: "all", label: "All" },
    { id: "voice", label: "🎙️ Voice" },
    { id: "navigation", label: "🧭 Navigation" },
    { id: "tools", label: "🛠️ Tools" },
    { id: "study", label: "📚 Study" },
  ];

  const filteredVoiceCommands = VOICE_COMMANDS_LIST.filter((cmd) => {
    const matchesCategory = selectedCategory === "all" || cmd.category === selectedCategory;
    const matchesSearch =
      cmd.phrase.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cmd.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cmd.keywords.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const filteredKeyboardShortcuts = KEYBOARD_SHORTCUTS_LIST.filter((item) => {
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.keys.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleTestCommand = (cmd: VoiceCommand) => {
    setExecutedCommandId(cmd.id);
    if (speakNotification) {
      speakNotification({
        ur: `Simulating command: ${cmd.phrase}`,
        en: `Executing voice shortcut: ${cmd.phrase}`
      });
    }
    onExecuteCommand(cmd);

    setTimeout(() => {
      setExecutedCommandId(null);
    }, 2500);
  };

  return (
    <div className="flex flex-col gap-3 font-sans text-left">
      {/* Header Banner */}
      <div className="p-3 rounded-xl bg-gradient-to-r from-purple-950/60 via-indigo-950/40 to-slate-900 border border-purple-500/30 flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0 mt-0.5">
          <Terminal size={16} className="animate-pulse" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-purple-200">
              Interactive Commands & Hotkeys Map
            </h4>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300">
              {activeType === "voice" ? `${VOICE_COMMANDS_LIST.length} Vocal Triggers` : `${KEYBOARD_SHORTCUTS_LIST.length} Hotkeys`}
            </span>
          </div>
          <p className="text-[11px] text-slate-300 mt-1 leading-snug">
            {activeType === "voice"
              ? "Speak any phrase during live sessions or test them below."
              : "Use physical keyboard hotkeys to instantly control MAHR."}
          </p>
        </div>
      </div>

      {/* Main Mode Toggle Tabs (Voice vs Keyboard) */}
      <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950/80 border border-white/10">
          <button
            onClick={() => setActiveType("voice")}
            className={`px-3 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer ${
              activeType === "voice"
                ? "bg-purple-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Mic size={13} />
            <span>Voice Triggers</span>
          </button>

          <button
            onClick={() => setActiveType("keyboard")}
            className={`px-3 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer ${
              activeType === "keyboard"
                ? "bg-purple-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Keyboard size={13} />
            <span>Keyboard Hotkeys</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative flex-1 max-w-xs">
          <Search size={13} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={activeType === "voice" ? "Search vocal triggers..." : "Search hotkeys..."}
            className="w-full bg-slate-950/80 border border-white/10 rounded-xl pl-8 pr-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono transition"
          />
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="flex gap-1 overflow-x-auto w-full no-scrollbar py-0.5">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-medium whitespace-nowrap transition cursor-pointer border ${
              selectedCategory === cat.id
                ? "bg-purple-600/30 border-purple-400 text-purple-200 font-bold"
                : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 gap-2 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10">
        {activeType === "voice" ? (
          filteredVoiceCommands.length === 0 ? (
            <div className="p-6 text-center rounded-xl bg-white/5 border border-white/5">
              <Mic size={20} className="mx-auto text-slate-500 mb-2" />
              <p className="text-xs font-mono text-slate-400">No vocal shortcuts match &ldquo;{searchQuery}&rdquo;</p>
            </div>
          ) : (
            filteredVoiceCommands.map((cmd) => {
              const isExecuted = executedCommandId === cmd.id;
              return (
                <div
                  key={cmd.id}
                  className={`p-2.5 rounded-xl border transition-all duration-200 flex flex-col gap-1.5 ${
                    isExecuted
                      ? "bg-emerald-950/40 border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                      : "bg-slate-900/60 border-white/10 hover:border-white/20 hover:bg-slate-900/80"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-5 h-5 rounded-md bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0">
                        <Mic size={11} />
                      </div>
                      <span className="text-xs font-bold font-mono text-slate-100 truncate">
                        &ldquo;{cmd.phrase}&rdquo;
                      </span>
                    </div>

                    {cmd.badgeText && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-cyan-300 shrink-0">
                        {cmd.badgeText}
                      </span>
                    )}
                  </div>

                  <p className="text-[10px] text-slate-400 leading-normal pl-7">
                    {cmd.description}
                  </p>

                  <div className="flex items-center justify-between pl-7 pt-1 border-t border-white/5 gap-2">
                    <span className="text-[9px] font-mono text-slate-500 truncate italic">
                      Ex: {cmd.example}
                    </span>

                    <button
                      onClick={() => handleTestCommand(cmd)}
                      disabled={isExecuted}
                      className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 border ${
                        isExecuted
                          ? "bg-emerald-500/20 border-emerald-400 text-emerald-300"
                          : "bg-purple-600/30 hover:bg-purple-600/50 border-purple-500/40 text-purple-200"
                      }`}
                    >
                      {isExecuted ? (
                        <>
                          <CheckCircle2 size={11} className="text-emerald-400 animate-bounce" />
                          <span>Triggered!</span>
                        </>
                      ) : (
                        <>
                          <Play size={10} className="fill-current" />
                          <span>Test Shortcut</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )
        ) : filteredKeyboardShortcuts.length === 0 ? (
          <div className="p-6 text-center rounded-xl bg-white/5 border border-white/5">
            <Keyboard size={20} className="mx-auto text-slate-500 mb-2" />
            <p className="text-xs font-mono text-slate-400">No keyboard hotkeys match &ldquo;{searchQuery}&rdquo;</p>
          </div>
        ) : (
          filteredKeyboardShortcuts.map((item, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded-xl border border-white/10 bg-slate-900/60 hover:border-purple-500/40 hover:bg-purple-950/20 transition-all flex items-center justify-between gap-3"
            >
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold font-mono text-slate-100">
                    {item.title}
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {item.badge}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">{item.description}</span>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {item.keys.map((k, kIdx) => (
                  <React.Fragment key={kIdx}>
                    <kbd className="px-2 py-0.5 rounded-md bg-slate-950 border border-white/20 text-[10px] font-mono font-bold text-purple-200">
                      {k}
                    </kbd>
                    {kIdx < item.keys.length - 1 && <span className="text-[9px] text-slate-500 font-mono">+</span>}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
