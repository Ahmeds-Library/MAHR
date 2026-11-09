// 💻 Layer 1: TerminalInstallGuide Component
// Clean, responsive terminal installation instructions with 1-click copy feedback.

import React, { useState } from "react";
import { Terminal, Copy, Check, AlertCircle } from "lucide-react";
import { LINUX_INSTALL_CMD } from "../../config/appVersion";

interface TerminalInstallGuideProps {
  platformType: "win32" | "linux" | "web" | string;
}

export const TerminalInstallGuide: React.FC<TerminalInstallGuideProps> = ({ platformType }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"linux" | "windows">(
    platformType === "linux" ? "linux" : "windows"
  );

  const linuxCmd = `cd ~/Downloads && ${LINUX_INSTALL_CMD}`;
  const windowsCmd = `cd ~\\Downloads; .\\MAHR-Setup-v2.4.1-build-2.exe`;

  const currentCmd = activeTab === "linux" ? linuxCmd : windowsCmd;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/90 text-xs space-y-3">
      {/* Tab Switcher & Notice */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-cyan-400" />
          <span className="font-semibold text-slate-200 text-xs font-mono">
            Fast Terminal Setup:
          </span>
        </div>

        <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-white/5">
          <button
            onClick={() => setActiveTab("windows")}
            className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-medium transition cursor-pointer ${
              activeTab === "windows"
                ? "bg-cyan-600/30 text-cyan-200 border border-cyan-500/40"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Windows
          </button>
          <button
            onClick={() => setActiveTab("linux")}
            className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-medium transition cursor-pointer ${
              activeTab === "linux"
                ? "bg-purple-600/30 text-purple-200 border border-purple-500/40"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Linux
          </button>
        </div>
      </div>

      {/* Terminal Code Box */}
      <div className="flex items-center justify-between gap-3 bg-black/60 border border-slate-800 rounded-xl px-3 py-2 font-mono text-[11px] text-slate-300 overflow-x-auto">
        <code className="truncate select-all text-cyan-300">
          $ {currentCmd}
        </code>
        <button
          onClick={handleCopy}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer shrink-0"
          title="Copy command"
        >
          {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
        </button>
      </div>

      {/* Important Hint */}
      <div className="flex items-start gap-2 text-slate-400 text-[11px] leading-relaxed">
        <AlertCircle size={13} className="shrink-0 mt-0.5 text-amber-400" />
        <span>
          Click the download buttons above to save the signed executable. Direct stream links are optimized with native resume capabilities.
        </span>
      </div>
    </div>
  );
};
