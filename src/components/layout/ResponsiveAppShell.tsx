import React, { useState } from "react";
import { 
  Menu, 
  X, 
  Bot, 
  BookOpen, 
  CheckSquare, 
  Brain, 
  Sliders, 
  Sparkles, 
  Layers, 
  Zap, 
  Activity, 
  HelpCircle,
  Volume2,
  Calendar,
  Compass
} from "lucide-react";
import { LiveState } from "@lib/audio";

interface ResponsiveAppShellProps {
  children: React.ReactNode;
  liveState: LiveState;
  activeView: string;
  onSelectView: (view: string) => void;
  onOpenOffice: () => void;
  onOpenSettings: () => void;
  onOpenTasks: () => void;
  onOpenMemories: () => void;
  onOpenChalkboard: () => void;
  onOpenRoutines: () => void;
  onOpenShortcuts: () => void;
  isWakeWordEnabled: boolean;
}

export const ResponsiveAppShell: React.FC<ResponsiveAppShellProps> = ({
  children,
  liveState,
  activeView,
  onSelectView,
  onOpenOffice,
  onOpenSettings,
  onOpenTasks,
  onOpenMemories,
  onOpenChalkboard,
  onOpenRoutines,
  onOpenShortcuts,
  isWakeWordEnabled,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isConnected = liveState !== "disconnected";

  const navLinks = [
    { id: "companion", label: "Assistant Core", icon: <Sparkles className="w-4 h-4" /> },
    { id: "office", label: "Autonomous Office", icon: <Bot className="w-4 h-4" />, action: onOpenOffice },
    { id: "chalkboard", label: "Chalkboard Lab", icon: <Compass className="w-4 h-4" />, action: onOpenChalkboard },
    { id: "tasks", label: "Daily Tasks", icon: <CheckSquare className="w-4 h-4" />, action: onOpenTasks },
    { id: "memory", label: "Memory Graph", icon: <Brain className="w-4 h-4" />, action: onOpenMemories },
  ];

  return (
    <div className="relative min-h-screen w-full flex flex-col bg-slate-950 text-slate-100 font-sans antialiased overflow-x-hidden">
      {/* Top Universal App Navigation Bar */}
      <header className="sticky top-0 z-40 w-full h-14 bg-slate-950/80 border-b border-slate-800/80 backdrop-blur-md px-4 lg:px-6 flex items-center justify-between">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-indigo-600 shadow-md shadow-cyan-900/30">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-bold tracking-wider text-slate-100 uppercase">
              MAHR
            </span>
            <span className="hidden sm:inline-block text-[10px] font-mono tracking-widest text-cyan-400/90 uppercase">
              Ambient OS
            </span>
          </div>

          {/* Assistant Ambient Indicator (Unboxed, clean text per design rules) */}
          <div className="hidden md:flex items-center gap-2 ml-4 pl-4 border-l border-slate-800 text-xs text-slate-400">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-emerald-400 animate-pulse" : "bg-slate-600"
              }`}
            />
            <span className="font-mono text-[11px]">
              {isConnected ? "LIVE VOICE STREAM" : isWakeWordEnabled ? "WAKE WORD ACTIVE" : "VOICE READY"}
            </span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (item.action) {
                  item.action();
                } else {
                  onSelectView(item.id);
                }
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeView === item.id
                  ? "bg-slate-800/90 text-cyan-300"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Quick Utility Actions */}
        <div className="flex items-center gap-2">
          {/* Alexa Routines Quick Action */}
          <button
            onClick={onOpenRoutines}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-800/40 text-cyan-300 text-xs font-medium transition-all"
            title="Alexa-style Routines"
          >
            <Zap className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Routines</span>
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
            title="System Settings"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Keyboard Shortcuts */}
          <button
            onClick={onOpenShortcuts}
            className="hidden sm:flex p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
            title="Keyboard Shortcuts"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-14 z-40 bg-slate-950/95 border-b border-slate-800 backdrop-blur-xl p-4 animate-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-2 gap-2">
            {navLinks.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (item.action) {
                    item.action();
                  } else {
                    onSelectView(item.id);
                  }
                }}
                className={`flex items-center gap-2.5 p-3 rounded-xl text-xs font-medium border border-slate-800/80 text-left transition-colors ${
                  activeView === item.id
                    ? "bg-cyan-950/40 text-cyan-300 border-cyan-800/50"
                    : "bg-slate-900/50 text-slate-300 hover:bg-slate-800/60"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main App Content Viewport */}
      <main className="flex-1 w-full relative flex flex-col">{children}</main>
    </div>
  );
};
