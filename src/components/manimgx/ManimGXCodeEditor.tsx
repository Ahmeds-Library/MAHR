/**
 * ManimGX Python Code Editor & Diagnostics
 * Presentation Layer: High-contrast code editor with syntax linting and instant compilation.
 */

import React, { useState } from "react";
import { 
  Play, 
  RotateCcw, 
  Copy, 
  Check, 
  AlertTriangle, 
  CheckCircle2, 
  Code2, 
  Sparkles,
  BookOpen
} from "lucide-react";
import { ValidationResult } from "../../services/manimgx/manimgxSyntaxValidator";
import { MANIMGX_PRESETS } from "../../hooks/manimgx/useManimGXPresetLibrary";

interface ManimGXCodeEditorProps {
  code: string;
  updateCode: (newCode: string) => void;
  compileCode: () => void;
  validation: ValidationResult;
  activePresetId: string;
  selectPreset: (id: string) => void;
}

export const ManimGXCodeEditor: React.FC<ManimGXCodeEditorProps> = ({
  code,
  updateCode,
  compileCode,
  validation,
  activePresetId,
  selectPreset
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    const preset = MANIMGX_PRESETS[activePresetId];
    if (preset) {
      updateCode(preset.code);
      compileCode();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      compileCode();
    }
  };

  const lineCount = code.split("\n").length;

  return (
    <div className="flex flex-col h-full bg-slate-900/90 rounded-xl border border-slate-800 overflow-hidden shadow-lg">
      {/* Header Bar */}
      <div className="px-3 py-2.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between gap-2 flex-wrap">
        {/* Preset Selector */}
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-cyan-400" />
          <select
            value={activePresetId}
            onChange={(e) => selectPreset(e.target.value)}
            className="text-xs bg-slate-800 border border-slate-700 text-slate-200 rounded-md px-2.5 py-1 focus:outline-none focus:border-cyan-500 font-medium"
          >
            {Object.values(MANIMGX_PRESETS).map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopy}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors text-xs flex items-center gap-1"
            title="Copy Python Code"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={handleReset}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors text-xs flex items-center gap-1"
            title="Reset to Preset Default"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={compileCode}
            className="flex items-center gap-1.5 px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs rounded-md shadow transition-colors active:scale-95"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Run (Ctrl+Enter)</span>
          </button>
        </div>
      </div>

      {/* Editor Surface */}
      <div className="relative flex-1 flex overflow-hidden font-mono text-xs">
        {/* Line Numbers */}
        <div className="select-none py-3 px-2 text-right text-slate-600 bg-slate-950/40 border-r border-slate-800/80 min-w-[2.5rem] leading-relaxed">
          {Array.from({ length: lineCount }).map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        {/* Code Textarea */}
        <textarea
          value={code}
          onChange={(e) => updateCode(e.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          className="flex-1 p-3 bg-transparent text-slate-200 focus:outline-none resize-none leading-relaxed selection:bg-cyan-900/60 font-mono overflow-auto"
          placeholder="from manimgx import * ..."
        />
      </div>

      {/* Validation & Diagnostic Footer */}
      <div className="px-3 py-2 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-[11px]">
        {validation.isValid ? (
          <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Syntax valid: {validation.sceneName} ({validation.estimatedDuration}s estimated)</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-rose-400 font-medium">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{validation.issues.find((i) => i.severity === "error")?.message || "Invalid syntax"}</span>
          </div>
        )}

        <div className="text-slate-500 hidden sm:flex items-center gap-2">
          <span>{validation.detectedMobjects.length} Mobjects</span>
          <span aria-hidden="true">·</span>
          <span>{validation.animationCount} Animations</span>
        </div>
      </div>
    </div>
  );
};
