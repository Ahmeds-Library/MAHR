import React from "react";
import { Mic, Volume2, ShieldAlert, Sparkles, Sliders, Zap } from "lucide-react";
import { SystemSettingsState } from "../../services/settingsService";

interface AudioVoiceTabProps {
  settings: SystemSettingsState;
  onUpdateSetting: <K extends keyof SystemSettingsState>(key: K, value: SystemSettingsState[K]) => void;
  speakNotification?: (text: { ur?: string; en?: string } | string) => void;
}

export const AudioVoiceTab: React.FC<AudioVoiceTabProps> = ({
  settings,
  onUpdateSetting,
  speakNotification
}) => {
  return (
    <div className="flex flex-col gap-3.5 font-sans">
      {/* Auto Interrupt Toggle */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 gap-3">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <ShieldAlert size={13} className="text-purple-400" />
            <span className="text-xs font-bold font-mono tracking-wide text-slate-200 uppercase">
              Allow Voice Interruptions
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-1 leading-normal">
            Turn OFF to prevent background room noise from cutting off MAHR mid-sentence. When ON, speak loudly to barge in.
          </span>
        </div>
        <button
          onClick={() => {
            const nextVal = !settings.autoInterrupt;
            onUpdateSetting("autoInterrupt", nextVal);
            if (speakNotification) {
              speakNotification(
                nextVal
                  ? "Allow interruptions is now enabled."
                  : "Allow interruptions is now disabled."
              );
            }
          }}
          className={`w-10 h-5 shrink-0 rounded-full p-0.5 transition-colors duration-200 focus:outline-none cursor-pointer ${
            settings.autoInterrupt ? "bg-purple-500" : "bg-white/10"
          }`}
        >
          <div
            className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-200 ease-in-out ${
              settings.autoInterrupt ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {/* Background Voice Wake-Word Toggle */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 gap-3">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <Zap size={13} className="text-cyan-400" />
            <span className="text-xs font-bold font-mono tracking-wide text-slate-200 uppercase">
              Background Wake-Word Listener
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-1 leading-normal">
            Call out <strong className="text-cyan-300 font-mono">&ldquo;MAHR&rdquo;</strong>, <strong className="text-cyan-300 font-mono">&ldquo;Mahr&rdquo;</strong>, or <strong className="text-cyan-300 font-mono">&ldquo;Wake up&rdquo;</strong> to auto-connect when idle.
          </span>
        </div>
        <button
          onClick={() => {
            const nextVal = !settings.isWakeWordEnabled;
            onUpdateSetting("isWakeWordEnabled", nextVal);
            if (speakNotification) {
              speakNotification(
                nextVal
                  ? "Voice wake word detection is now active."
                  : "Voice wake word detection disabled."
              );
            }
          }}
          className={`w-10 h-5 shrink-0 rounded-full p-0.5 transition-colors duration-200 focus:outline-none cursor-pointer ${
            settings.isWakeWordEnabled ? "bg-cyan-500" : "bg-white/10"
          }`}
        >
          <div
            className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-200 ease-in-out ${
              settings.isWakeWordEnabled ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {/* Input Noise Gate Sensitivity */}
      <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-2">
        <div className="flex justify-between items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Mic size={13} className="text-emerald-400" />
            <span className="text-xs font-bold font-mono tracking-wide text-slate-200 uppercase">
              Microphone Noise Gate Filter
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase">
            {settings.noiseGate === 0.001
              ? "Quiet Room"
              : settings.noiseGate === 0.005
              ? "Normal"
              : settings.noiseGate === 0.012
              ? "Medium"
              : "Noisy/Echo"}
          </span>
        </div>
        <span className="text-[10px] text-slate-400 font-mono leading-normal">
          Filters out room static, keyboard clicks, or fan hums from your microphone stream.
        </span>

        <div className="grid grid-cols-4 gap-1.5 mt-1">
          {[
            { label: "Quiet Room", val: 0.001 },
            { label: "Normal", val: 0.005 },
            { label: "Medium", val: 0.012 },
            { label: "Noisy/Echo", val: 0.025 },
          ].map((opt) => (
            <button
              key={opt.label}
              onClick={() => onUpdateSetting("noiseGate", opt.val)}
              className={`py-1.5 px-1 rounded-lg border text-[10px] font-mono transition-all font-medium text-center cursor-pointer ${
                settings.noiseGate === opt.val
                  ? "bg-cyan-500/20 border-cyan-400 text-cyan-200 font-bold"
                  : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Speech Pitch & Rate Controls */}
      <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-2.5">
        <div className="flex justify-between items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Volume2 size={13} className="text-purple-400" />
            <span className="text-xs font-bold font-mono tracking-wide text-slate-200 uppercase">
              Speech Synthesis Speed & Pitch
            </span>
          </div>
          <button
            onClick={() => {
              onUpdateSetting("speechRate", 1.0);
              onUpdateSetting("speechPitch", 1.0);
            }}
            className="text-[9px] font-mono text-purple-400 hover:underline cursor-pointer"
          >
            Reset Speed
          </button>
        </div>

        {/* Speed Slider */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-slate-300 w-16">
            Rate: {(Number(settings?.speechRate) || 1.0).toFixed(1)}x
          </span>
          <input
            type="range"
            min="0.8"
            max="1.5"
            step="0.1"
            value={settings?.speechRate ?? 1.0}
            onChange={(e) => onUpdateSetting("speechRate", parseFloat(e.target.value))}
            className="flex-1 accent-purple-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
        </div>

        {/* Pitch Slider */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-slate-300 w-16">
            Pitch: {(Number(settings?.speechPitch) || 1.0).toFixed(1)}x
          </span>
          <input
            type="range"
            min="0.8"
            max="1.5"
            step="0.1"
            value={settings?.speechPitch ?? 1.0}
            onChange={(e) => onUpdateSetting("speechPitch", parseFloat(e.target.value))}
            className="flex-1 accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
        </div>

        {/* Test Speech Button */}
        <div className="pt-1 flex justify-end">
          <button
            onClick={() => {
              if (speakNotification) {
                const r = (Number(settings?.speechRate) || 1.0).toFixed(1);
                const p = (Number(settings?.speechPitch) || 1.0).toFixed(1);
                speakNotification(
                  `Testing speech synthesis at ${r} speed and ${p} pitch.`
                );
              }
            }}
            className="px-2.5 py-1 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 text-[10px] font-mono font-bold flex items-center gap-1 transition cursor-pointer"
          >
            <Volume2 size={11} />
            <span>Test Voice Synthesis</span>
          </button>
        </div>
      </div>

      {/* Sound Effects Toggle */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 gap-3">
        <div className="flex flex-col">
          <span className="text-xs font-bold font-mono tracking-wide text-slate-200 uppercase">
            Holographic Audio Effects (SFX)
          </span>
          <span className="text-[10px] text-slate-400 font-mono mt-0.5">
            Play subtle futuristic sound chimes when connecting, disconnecting, or executing actions.
          </span>
        </div>
        <button
          onClick={() => onUpdateSetting("soundEffectsEnabled", !settings.soundEffectsEnabled)}
          className={`w-10 h-5 shrink-0 rounded-full p-0.5 transition-colors duration-200 focus:outline-none cursor-pointer ${
            settings.soundEffectsEnabled ? "bg-purple-500" : "bg-white/10"
          }`}
        >
          <div
            className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-200 ease-in-out ${
              settings.soundEffectsEnabled ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {/* Proactive Task Voice Reminders Section */}
      <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <Sparkles size={13} className="text-amber-400" />
              <span className="text-xs font-bold font-mono tracking-wide text-slate-200 uppercase">
                Proactive Task Voice Reminders
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono mt-1 leading-normal">
              When idle, MAHR proactively speaks gentle voice reminders for pending tasks from your Daily Task Manager.
            </span>
          </div>
          <button
            onClick={() => {
              const nextVal = !settings.proactiveRemindersEnabled;
              onUpdateSetting("proactiveRemindersEnabled", nextVal);
              if (speakNotification) {
                speakNotification(
                  nextVal
                    ? "Proactive task reminders are now enabled."
                    : "Proactive task reminders disabled."
                );
              }
            }}
            className={`w-10 h-5 shrink-0 rounded-full p-0.5 transition-colors duration-200 focus:outline-none cursor-pointer ${
              settings.proactiveRemindersEnabled ? "bg-amber-500" : "bg-white/10"
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-200 ease-in-out ${
                settings.proactiveRemindersEnabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {settings.proactiveRemindersEnabled && (
          <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
            <span className="text-[11px] font-mono text-slate-300">Idle Inactivity Trigger:</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 5, 10].map((mins) => (
                <button
                  key={mins}
                  onClick={() => onUpdateSetting("proactiveIdleTimeoutMins", mins)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold transition cursor-pointer ${
                    settings.proactiveIdleTimeoutMins === mins
                      ? "bg-amber-500/30 text-amber-200 border border-amber-500/50"
                      : "bg-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/10 border border-white/10"
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
