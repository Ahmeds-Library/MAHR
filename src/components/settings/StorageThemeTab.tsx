import React, { useState } from "react";
import { Palette, Database, Trash2, Download, Check, Sparkles, RefreshCw, Activity, CheckCircle2, AlertCircle } from "lucide-react";
import { SystemSettingsState, clearAllAppDataFromDB, runSettingsDiagnosticCycle, DiagnosticResult } from "../../services/settingsService";
import { THEME_COLOR_CONFIGS } from "../../services/themeService";

interface StorageThemeTabProps {
  settings: SystemSettingsState;
  onUpdateSetting: <K extends keyof SystemSettingsState>(key: K, value: SystemSettingsState[K]) => void;
  onResetAllSettings: () => void;
  speakNotification?: (text: { ur?: string; en?: string } | string) => void;
  onStatusAlert?: (msg: string) => void;
}

export const StorageThemeTab: React.FC<StorageThemeTabProps> = ({
  settings,
  onUpdateSetting,
  onResetAllSettings,
  speakNotification,
  onStatusAlert
}) => {
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [diagRunning, setDiagRunning] = useState(false);
  const [diagResult, setDiagResult] = useState<DiagnosticResult | null>(null);

  const themeList = Object.values(THEME_COLOR_CONFIGS);

  const handleRunDiagnostic = async () => {
    setDiagRunning(true);
    setDiagResult(null);
    try {
      const res = await runSettingsDiagnosticCycle();
      setDiagResult(res);
      if (res.success) {
        onStatusAlert?.("Settings Sync Diagnostic: 100% PASSED ✅");
        if (speakNotification) speakNotification("Settings sync diagnostic passed successfully.");
      } else {
        onStatusAlert?.("Settings Sync Diagnostic: Issues detected ❌");
      }
    } catch (err: any) {
      onStatusAlert?.("Diagnostic error: " + (err?.message || "Unknown error"));
    } finally {
      setDiagRunning(false);
    }
  };

  const handleExportData = () => {
    try {
      const exportObj = {
        settings,
        exportedAt: new Date().toISOString(),
        version: "2.5.0"
      };
      const jsonStr = JSON.stringify(exportObj, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `myraa_app_data_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);

      if (onStatusAlert) {
        onStatusAlert("📥 App settings and data exported successfully!");
      }
    } catch (e) {
      console.error("Export error:", e);
    }
  };

  const handleClearAllData = async () => {
    await clearAllAppDataFromDB();
    onResetAllSettings();
    setIsConfirmingClear(false);
    if (onStatusAlert) {
      onStatusAlert("🧹 All local stored data and settings reset to defaults.");
    }
    if (speakNotification) {
      speakNotification("All application data has been reset to defaults.");
    }
  };

  return (
    <div className="flex flex-col gap-3.5 font-sans">
      {/* Holographic Theme Presets */}
      <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-2">
        <div className="flex justify-between items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Palette size={13} className="text-purple-400" />
            <span className="text-xs font-bold font-mono tracking-wide text-slate-200 uppercase">
              Holographic Core Theme Presets
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold text-purple-300 uppercase">
            {themeList.find(
              (t) =>
                t.id.toLowerCase() === settings.themeColor.toLowerCase() ||
                t.hex.toLowerCase() === settings.themeColor.toLowerCase()
            )?.name || "Custom"}
          </span>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mt-1.5">
          {themeList.map((t) => {
            const isSelected =
              settings.themeColor.toLowerCase() === t.id.toLowerCase() ||
              settings.themeColor.toLowerCase() === t.hex.toLowerCase();
            return (
              <button
                key={t.id}
                onClick={() => {
                  onUpdateSetting("themeColor", t.id);
                  onUpdateSetting("autoShiftBackground", false);
                  if (speakNotification) {
                    speakNotification(`Atmosphere shifted to ${t.name}.`);
                  }
                }}
                className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? "bg-white/20 border-white/50 ring-2 ring-purple-400/50 shadow-lg scale-[1.03]"
                    : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                }`}
                title={t.name}
              >
                <div
                  className="w-5 h-5 rounded-full shadow-md transition-transform group-hover:scale-110"
                  style={{ backgroundColor: t.hex, boxShadow: `0 0 12px ${t.hex}` }}
                />
                <span className="text-[10px] font-mono text-slate-200 truncate w-full text-center font-medium">
                  {t.name.split(" ")[0]}
                </span>
                {isSelected && (
                  <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-purple-500/40 text-purple-200 uppercase font-bold">
                    Active
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <p className="text-[10px] text-slate-400 font-mono mt-1 px-1">
          Selecting a preset sets and locks your chosen atmosphere.
        </p>
      </div>

      {/* Ambient Background Shift Toggle */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 gap-3">
        <div className="flex flex-col">
          <span className="text-xs font-bold font-mono tracking-wide text-slate-200 uppercase">
            Ambient Background Color Shift
          </span>
          <span className="text-[10px] text-slate-400 font-mono mt-0.5">
            Automatically morph holographic backdrop colors based on active study topic.
          </span>
        </div>
        <button
          onClick={() => onUpdateSetting("autoShiftBackground", !settings.autoShiftBackground)}
          className={`w-10 h-5 shrink-0 rounded-full p-0.5 transition-colors duration-200 focus:outline-none cursor-pointer ${
            settings.autoShiftBackground ? "bg-purple-500" : "bg-white/10"
          }`}
        >
          <div
            className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-200 ease-in-out ${
              settings.autoShiftBackground ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {/* Chat Journal Size & Retention */}
      <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-2">
        <div className="flex justify-between items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Database size={13} className="text-indigo-400" />
            <span className="text-xs font-bold font-mono tracking-wide text-slate-200 uppercase">
              Chat Journal Max Messages
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold text-indigo-300">
            {settings.chatMaxMessages === 999999 ? "Unlimited" : `${settings.chatMaxMessages} Msgs`}
          </span>
        </div>

        <div className="grid grid-cols-5 gap-1.5 mt-1">
          {[10, 30, 50, 100, 999999].map((val) => (
            <button
              key={val}
              onClick={() => onUpdateSetting("chatMaxMessages", val)}
              className={`py-1 rounded-lg border text-[10px] font-mono transition cursor-pointer ${
                settings.chatMaxMessages === val
                  ? "bg-indigo-600/30 border-indigo-400 text-indigo-200 font-bold"
                  : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10"
              }`}
            >
              {val === 999999 ? "Unlimited" : val}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Journal Retention Duration */}
      <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-2">
        <div className="flex justify-between items-center gap-2">
          <div className="flex items-center gap-1.5">
            <RefreshCw size={13} className="text-cyan-400" />
            <span className="text-xs font-bold font-mono tracking-wide text-slate-200 uppercase">
              Chat Journal Lifespan
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold text-cyan-300">
            {settings.chatRetentionTime === 0
              ? "Forever"
              : settings.chatRetentionTime >= 1440
              ? `${settings.chatRetentionTime / 1440} Day(s)`
              : settings.chatRetentionTime >= 60
              ? `${settings.chatRetentionTime / 60} Hour(s)`
              : `${settings.chatRetentionTime} Min(s)`}
          </span>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 mt-1">
          {[
            { label: "5m", val: 5 },
            { label: "30m", val: 30 },
            { label: "1h", val: 60 },
            { label: "1d", val: 1440 },
            { label: "7d", val: 10080 },
            { label: "30d", val: 43200 },
            { label: "Forever", val: 0 },
          ].map((opt) => (
            <button
              key={opt.label}
              onClick={() => onUpdateSetting("chatRetentionTime", opt.val)}
              className={`py-1 rounded-lg border text-[10px] font-mono transition cursor-pointer ${
                settings.chatRetentionTime === opt.val
                  ? "bg-cyan-600/30 border-cyan-400 text-cyan-200 font-bold"
                  : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* System Settings Sync Diagnostic Section */}
      <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/20 flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <Activity size={13} className="text-purple-400" />
            <span className="text-xs font-bold font-mono tracking-wide text-purple-200 uppercase">
              System Settings Sync Diagnostic
            </span>
          </div>
          <button
            onClick={handleRunDiagnostic}
            disabled={diagRunning}
            className="py-1 px-3 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
          >
            {diagRunning ? (
              <RefreshCw size={12} className="animate-spin text-purple-300" />
            ) : (
              <Activity size={12} className="text-purple-300" />
            )}
            <span>{diagRunning ? "Testing Sync..." : "Run Full Cycle Test"}</span>
          </button>
        </div>

        {diagResult && (
          <div className="mt-1 p-2.5 rounded-lg bg-black/40 border border-white/10 text-xs font-mono flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-300">Diagnostic Status:</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${
                diagResult.success ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
              }`}>
                {diagResult.success ? <CheckCircle2 size={11} /> : <AlertCircle size={11} />}
                {diagResult.success ? "100% PASSED" : "ISSUES FOUND"}
              </span>
            </div>

            <div className="max-h-32 overflow-y-auto pr-1 flex flex-col gap-1 mt-1 text-[11px] text-slate-300 divide-y divide-white/5">
              {(Object.entries(diagResult.testedSettings) as [string, { saved: any; reloaded: any; match: boolean }][]).map(([key, info]) => (
                <div key={key} className="pt-1 flex justify-between items-center">
                  <span className="text-slate-400">{key}:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500">Saved: {String(info.saved)} → Read: {String(info.reloaded)}</span>
                    <span className={info.match ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                      {info.match ? "PASS ✅" : "FAIL ❌"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Export & Reset Options */}
      <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-2">
        <span className="text-xs font-bold font-mono tracking-wide text-slate-200 uppercase">
          Data Management & Reset
        </span>

        <div className="flex flex-col sm:flex-row gap-2 mt-1">
          {/* Export JSON Button */}
          <button
            onClick={handleExportData}
            className="flex-1 py-1.5 px-3 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-200 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            {exportSuccess ? <Check size={13} className="text-emerald-400" /> : <Download size={13} />}
            <span>{exportSuccess ? "Exported!" : "Export Backup JSON"}</span>
          </button>

          {/* Reset / Clear Button */}
          {isConfirmingClear ? (
            <div className="flex items-center gap-1.5 flex-1">
              <button
                onClick={handleClearAllData}
                className="flex-1 py-1.5 px-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-mono font-bold transition cursor-pointer"
              >
                Confirm Reset
              </button>
              <button
                onClick={() => setIsConfirmingClear(false)}
                className="py-1.5 px-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 text-[10px] font-mono transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsConfirmingClear(true)}
              className="flex-1 py-1.5 px-3 rounded-lg bg-rose-950/40 hover:bg-rose-900/50 border border-rose-500/30 text-rose-300 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Trash2 size={13} />
              <span>Reset All Data</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
