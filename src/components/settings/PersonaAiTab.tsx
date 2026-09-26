import React from "react";
import { Bot, Sparkles, User, Brain, Heart, Smile } from "lucide-react";
import { SystemSettingsState } from "../../services/settingsService";
import { SkillsManager } from "../SkillsManager";

interface PersonaAiTabProps {
  settings: SystemSettingsState;
  onUpdateSetting: <K extends keyof SystemSettingsState>(key: K, value: SystemSettingsState[K]) => void;
  speakNotification?: (text: { ur?: string; en?: string } | string) => void;
  onStatusAlert?: (msg: string) => void;
}

export const PersonaAiTab: React.FC<PersonaAiTabProps> = ({
  settings,
  onUpdateSetting,
  speakNotification,
  onStatusAlert
}) => {
  return (
    <div className="flex flex-col gap-3.5 font-sans">
      {/* AI Companion Persona Selection */}
      <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-2">
        <div className="flex justify-between items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Bot size={13} className="text-purple-400" />
            <span className="text-xs font-bold font-mono tracking-wide text-slate-200 uppercase">
              AI Companion Persona
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold text-indigo-300 uppercase">
            {settings.agentMode === "human" ? "Real Human Mentor" : "Anime Heroine"}
          </span>
        </div>
        <span className="text-[10px] text-slate-400 font-mono leading-normal">
          Human mode provides an empathetic academic mentor tone, while Anime mode uses a sweet, playful anime heroine persona.
        </span>

        <div className="grid grid-cols-2 gap-2 mt-1">
          {[
            {
              id: "human",
              label: "Real Human Mentor",
              desc: "Warm, empathetic real-life tutor & peer tone",
              icon: User
            },
            {
              id: "anime",
              label: "Anime Heroine",
              desc: "Sweet, high-pitched playful anime companion",
              icon: Heart
            }
          ].map((opt) => {
            const Icon = opt?.icon || User;
            const isSelected = settings.agentMode === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => {
                  onUpdateSetting("agentMode", opt.id as any);
                  if (onStatusAlert) {
                    onStatusAlert(`✨ Active companion persona updated to ${opt.label}!`);
                  }
                  if (speakNotification) {
                    speakNotification(
                      opt.id === "human"
                        ? "Companion personality changed to standard human mentor."
                        : "Anime companion mode activated! Let's study together!"
                    );
                  }
                }}
                className={`p-2 rounded-xl border transition-all text-left flex items-start gap-2 cursor-pointer ${
                  isSelected
                    ? "bg-indigo-600/20 border-indigo-400 text-indigo-200"
                    : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    isSelected ? "bg-indigo-500 text-white" : "bg-white/10 text-slate-400"
                  }`}
                >
                  <Icon size={12} />
                </div>
                <div>
                  <span className="text-xs font-bold font-mono block text-slate-200">
                    {opt.label}
                  </span>
                  <span className="text-[9px] font-mono text-slate-400 leading-tight block mt-0.5">
                    {opt.desc}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Voice Core Tone Model */}
      <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-2">
        <div className="flex justify-between items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Brain size={13} className="text-cyan-400" />
            <span className="text-xs font-bold font-mono tracking-wide text-slate-200 uppercase">
              Speech Profile Model
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold text-cyan-300 uppercase">
            {settings.voiceModel}
          </span>
        </div>
        <span className="text-[10px] text-slate-400 font-mono leading-normal">
          Select a core voice profile model to customize MAHR&apos;s synthesized speech style.
        </span>

        <div className="grid grid-cols-3 gap-1.5 mt-1">
          {[
            { label: "Warm", desc: "Soothing, friendly & conversational" },
            { label: "Analytical", desc: "Clear, precise & logical" },
            { label: "Playful", desc: "Witty, creative & energetic" }
          ].map((opt) => (
            <button
              key={opt.label}
              onClick={() => {
                onUpdateSetting("voiceModel", opt.label as any);
                if (speakNotification) {
                  speakNotification(`Applied ${opt.label} voice model profile.`);
                }
              }}
              className={`py-1.5 px-1 rounded-lg border text-[10px] font-mono transition-all font-medium text-center cursor-pointer ${
                settings.voiceModel === opt.label
                  ? "bg-purple-500/20 border-purple-400 text-purple-200 font-bold"
                  : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10"
              }`}
              title={opt.desc}
            >
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Cognitive Skills Manager */}
      <div className="p-3 rounded-xl bg-white/5 border border-white/10">
        <SkillsManager
          onSkillsUpdated={(msg) => {
            if (onStatusAlert) {
              onStatusAlert("✨ Cognitive skills updated successfully!");
            }
            if (msg && speakNotification) {
              speakNotification(msg);
            }
          }}
        />
      </div>
    </div>
  );
};
