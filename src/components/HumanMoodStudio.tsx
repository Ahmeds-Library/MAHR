import React, { useState } from "react";
import { 
  HeartHandshake, 
  Flame, 
  Smile, 
  Sparkles, 
  Heart, 
  Trophy, 
  Brain, 
  Scale, 
  Volume2, 
  Sparkle, 
  X, 
  Activity, 
  Check, 
  ShieldAlert, 
  Wand2, 
  Compass
} from "lucide-react";
import { 
  HumanMoodType, 
  HUMAN_MOOD_CONFIGS, 
  HumanMoodConfig 
} from "../services/humanEmotionEngine";
import { getThemeConfig } from "../services/themeService";

interface HumanMoodStudioProps {
  isOpen: boolean;
  onClose: () => void;
  currentMood: HumanMoodType;
  onSelectMood: (mood: HumanMoodType, triggerVoiceSample?: boolean) => void;
  onSpeakSamplePhrase: (text: string, mood: HumanMoodType) => void;
  moodShiftReason?: string | null;
  autoShiftBackground: boolean;
  onToggleAutoShift?: () => void;
}

export const HumanMoodStudio: React.FC<HumanMoodStudioProps> = ({
  isOpen,
  onClose,
  currentMood,
  onSelectMood,
  onSpeakSamplePhrase,
  moodShiftReason,
  autoShiftBackground,
  onToggleAutoShift
}) => {
  const [selectedPreviewMood, setSelectedPreviewMood] = useState<HumanMoodType>(currentMood);
  const activeConfig = HUMAN_MOOD_CONFIGS[currentMood] || HUMAN_MOOD_CONFIGS.neutral;
  const previewConfig = HUMAN_MOOD_CONFIGS[selectedPreviewMood] || activeConfig;
  const themeConfig = getThemeConfig(previewConfig.themeId);

  if (!isOpen) return null;

  const moodList: HumanMoodType[] = [
    "therapist",
    "naraz",
    "gussa",
    "playful",
    "loving",
    "proud",
    "analytical",
    "neutral"
  ];

  const getMoodIcon = (mood: HumanMoodType) => {
    switch (mood) {
      case "therapist":
        return <HeartHandshake className="w-5 h-5 text-emerald-400" />;
      case "naraz":
        return <ShieldAlert className="w-5 h-5 text-slate-400" />;
      case "gussa":
        return <Flame className="w-5 h-5 text-rose-500 animate-pulse" />;
      case "playful":
        return <Sparkles className="w-5 h-5 text-purple-400" />;
      case "loving":
        return <Heart className="w-5 h-5 text-pink-400" />;
      case "proud":
        return <Trophy className="w-5 h-5 text-amber-400" />;
      case "analytical":
        return <Brain className="w-5 h-5 text-sky-400" />;
      case "neutral":
      default:
        return <Scale className="w-5 h-5 text-violet-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-[#090a12]/95 border border-white/10 shadow-[0_20px_70px_rgba(0,0,0,0.85)] overflow-hidden"
        style={{
          boxShadow: `0 0 50px ${previewConfig.glowColor}25, 0 20px 80px rgba(0,0,0,0.85)`
        }}
      >
        {/* Ambient Top Glow */}
        <div 
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-3/4 h-48 rounded-full blur-3xl pointer-events-none opacity-40 transition-all duration-700"
          style={{ background: previewConfig.ambientGradient }}
        />

        {/* Header Bar */}
        <div className="relative z-10 flex items-center justify-between px-6 py-5 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div 
              className="p-2.5 rounded-2xl border transition-all duration-500 shadow-lg"
              style={{
                backgroundColor: `${previewConfig.glowColor}15`,
                borderColor: `${previewConfig.glowColor}40`,
                boxShadow: `0 0 15px ${previewConfig.glowColor}30`
              }}
            >
              {getMoodIcon(currentMood)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  Human Emotional Persona
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-white/10 text-white/80 border border-white/10">
                    Insaan Jaisa Mood
                  </span>
                </h2>
              </div>
              <p className="text-xs text-white/60 mt-0.5">
                Dynamic moods, speech tone, therapeutic empathy & authentic human reactions
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors border border-transparent hover:border-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Two-Column Layout */}
        <div className="relative z-10 flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Mood Selector Grid (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-white/50 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-white/60" />
                Select & Experience Moods
              </span>
              <span className="text-[11px] text-white/40">
                Active: <strong className="text-white capitalize">{activeConfig.label}</strong>
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {moodList.map((moodKey) => {
                const conf = HUMAN_MOOD_CONFIGS[moodKey];
                const isCurrent = currentMood === moodKey;
                const isSelected = selectedPreviewMood === moodKey;

                return (
                  <button
                    key={moodKey}
                    onClick={() => {
                      setSelectedPreviewMood(moodKey);
                    }}
                    className={`group relative flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all duration-300 ${
                      isSelected
                        ? "bg-white/[0.08] border-white/30 shadow-lg"
                        : "bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/15"
                    }`}
                    style={{
                      borderColor: isSelected ? `${conf.glowColor}70` : undefined,
                      boxShadow: isSelected ? `0 0 20px ${conf.glowColor}25` : undefined
                    }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 border transition-transform duration-300 group-hover:scale-105"
                        style={{
                          backgroundColor: `${conf.glowColor}15`,
                          borderColor: `${conf.glowColor}30`
                        }}
                      >
                        {conf.emoji}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white truncate">
                            {conf.label}
                          </span>
                          {isCurrent && (
                            <span 
                              className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full text-black font-mono shadow-sm"
                              style={{ backgroundColor: conf.glowColor }}
                            >
                              Live
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-white/50 truncate mt-0.5">
                          {conf.tagline} • <span className="font-urdu text-white/60">{conf.urduLabel}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <div 
                        className="w-3 h-3 rounded-full border border-white/20"
                        style={{ backgroundColor: conf.glowColor }}
                        title={`Theme: ${conf.themeId}`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Mood Detail & Interactive Voice Sandbox (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {/* Active Card Preview */}
            <div 
              className="relative p-5 rounded-3xl border transition-all duration-500 overflow-hidden flex flex-col gap-4"
              style={{
                backgroundColor: `${previewConfig.glowColor}08`,
                borderColor: `${previewConfig.glowColor}30`,
                boxShadow: `0 0 35px ${previewConfig.glowColor}15`
              }}
            >
              {/* Mood Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div 
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl border shadow-inner"
                    style={{
                      backgroundColor: `${previewConfig.glowColor}20`,
                      borderColor: `${previewConfig.glowColor}50`
                    }}
                  >
                    {previewConfig.emoji}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-white">
                        {previewConfig.label}
                      </h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/80 border border-white/10">
                        {previewConfig.themeId.toUpperCase()} THEME
                      </span>
                    </div>
                    <p className="text-xs font-urdu text-white/70 mt-0.5">
                      {previewConfig.urduLabel} — {previewConfig.tagline}
                    </p>
                  </div>
                </div>

                {/* Switch to this mood button */}
                <button
                  onClick={() => {
                    onSelectMood(selectedPreviewMood, true);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold tracking-wide uppercase flex items-center gap-2 shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-95"
                  style={{
                    backgroundColor: previewConfig.glowColor,
                    color: selectedPreviewMood === "naraz" ? "#ffffff" : "#050505",
                    boxShadow: `0 0 20px ${previewConfig.glowColor}60`
                  }}
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  {currentMood === selectedPreviewMood ? "Active Mood" : "Set As Active"}
                </button>
              </div>

              {/* Description & Tone breakdown */}
              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 flex flex-col gap-2">
                <p className="text-xs text-white/80 leading-relaxed">
                  {previewConfig.description}
                </p>
                <div className="flex items-center gap-2 text-[11px] text-white/50 pt-1 border-t border-white/5">
                  <Volume2 className="w-3.5 h-3.5 text-white/60 shrink-0" />
                  <span><strong>Tone:</strong> {previewConfig.toneDescription}</span>
                </div>
              </div>

              {/* Sample Dialogues with Voice Player */}
              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-white/50 flex items-center gap-1.5">
                  <Sparkle className="w-3 h-3 text-amber-400" />
                  Test Voice & Conversation In This Mood
                </span>

                <div className="flex flex-col gap-2">
                  {previewConfig.samplePhrases.map((phrase, idx) => (
                    <div 
                      key={idx}
                      className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/15 transition-all flex items-center justify-between gap-3 group"
                    >
                      <div className="flex flex-col gap-1 min-w-0">
                        <p className="text-xs font-medium text-white/95 leading-relaxed font-sans">
                          "{phrase.romanUrdu}"
                        </p>
                        <p className="text-[11px] font-urdu text-white/60 leading-relaxed">
                          {phrase.urdu}
                        </p>
                        <p className="text-[10px] text-white/40 italic">
                          "{phrase.english}"
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          onSpeakSamplePhrase(phrase.romanUrdu, selectedPreviewMood);
                        }}
                        className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white shrink-0 transition-transform active:scale-90 border border-white/10"
                        title="Listen to this phrase in MAHR's voice"
                      >
                        <Volume2 className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trigger Triggers Info */}
              <div className="flex flex-col gap-1.5 pt-2 border-t border-white/5">
                <span className="text-[11px] font-semibold text-white/50">
                  Natural Conversation Triggers:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {previewConfig.triggerContexts.map((trigger, i) => (
                    <span 
                      key={i}
                      className="text-[10px] px-2 py-1 rounded-lg bg-white/[0.04] border border-white/10 text-white/70"
                    >
                      • {trigger}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Shift reason info if active */}
            {moodShiftReason && (
              <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-200 text-xs flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-400 shrink-0" />
                <span><strong>Last Emotion Shift Reason:</strong> {moodShiftReason}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer info & toggle */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-t border-white/10 bg-white/[0.02] text-xs">
          <div className="flex items-center gap-3">
            <span className="text-white/60">
              Atmosphere theme automatically shifts with active human mood.
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                onSelectMood(selectedPreviewMood, true);
                onClose();
              }}
              className="px-5 py-2 rounded-xl bg-white text-black font-bold tracking-wide transition hover:bg-white/90 active:scale-95"
            >
              Apply & Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
