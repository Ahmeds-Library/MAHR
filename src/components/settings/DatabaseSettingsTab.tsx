// 🗄️ MAHR Database & Cloud Settings Tab
// Allows users to configure which database engine MAHR uses:
//   1. Embedded SQLite 3 (WAL Mode) — default, offline, zero-setup
//   2. PostgreSQL — remote SQL database (Supabase, Neon, AWS RDS, Render)
//   3. MongoDB — remote document database (MongoDB Atlas, self-hosted)
// Includes live connection test, automatic data migration, and high-availability fallback.

import React, { useState, useEffect, useCallback } from "react";
import {
  Database,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Zap,
  Server,
  HardDrive,
  Cloud,
  ChevronDown,
  Activity,
  ArrowRightLeft,
  ShieldCheck,
  Loader2
} from "lucide-react";

type DbEngine = "sqlite" | "postgres" | "mongodb";

interface DbStatus {
  engine: string;
  engineKey: DbEngine;
  status: string;
  masked_url?: string;
  stats: {
    memories: number;
    knowledgeNodes: number;
    knowledgeEdges: number;
    officeTasks: number;
    chatHistory: number;
    terminalLogs: number;
  };
  lastCheck: string;
}

interface ConnectionTestResult {
  success: boolean;
  latencyMs?: number;
  version?: string;
  error?: string;
}

interface DatabaseSettingsTabProps {
  onStatusAlert?: (msg: string) => void;
}

const ENGINE_CONFIGS = {
  sqlite: {
    label: "Embedded SQLite 3",
    badge: "Offline / Local",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    icon: HardDrive,
    iconColor: "text-emerald-400",
    borderColor: "border-emerald-500/40",
    bgColor: "bg-emerald-950/20",
    description: "Built-in high-performance WAL-mode database. Works completely offline with zero configuration. All data is stored locally on your device.",
    features: [
      "Zero-config, works out of the box",
      "WAL mode: crash-safe concurrent reads",
      "Fully offline and privacy-first",
      "Automatic session persistence"
    ],
    placeholder: "",
    example: ""
  },
  postgres: {
    label: "PostgreSQL Database",
    badge: "Remote SQL",
    badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    icon: Server,
    iconColor: "text-cyan-400",
    borderColor: "border-cyan-500/40",
    bgColor: "bg-cyan-950/20",
    description: "Connect to any PostgreSQL server for cloud-synced, multi-device memory. Supports Supabase, Neon, Render, AWS RDS, and self-hosted instances.",
    features: [
      "Cloud sync across devices",
      "Supports Supabase, Neon, Render, AWS RDS",
      "Automatic schema initialization",
      "SSL/TLS encrypted connections"
    ],
    placeholder: "postgres://user:password@host:5432/database",
    example: "postgres://mahr:pass@db.supabase.co:5432/postgres"
  },
  mongodb: {
    label: "MongoDB Database",
    badge: "Remote NoSQL",
    badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    icon: Cloud,
    iconColor: "text-purple-400",
    borderColor: "border-purple-500/40",
    bgColor: "bg-purple-950/20",
    description: "Connect to MongoDB for flexible document storage. Supports MongoDB Atlas cloud or any self-hosted MongoDB server.",
    features: [
      "Flexible document storage",
      "Supports MongoDB Atlas cloud",
      "Rich indexing on memory fields",
      "Horizontal scaling ready"
    ],
    placeholder: "mongodb+srv://user:password@cluster.mongodb.net/mahr_brain",
    example: "mongodb+srv://mahr:pass@cluster0.abc.mongodb.net/mahr_brain"
  }
};

export const DatabaseSettingsTab: React.FC<DatabaseSettingsTabProps> = ({ onStatusAlert }) => {
  const [currentConfig, setCurrentConfig] = useState<DbStatus | null>(null);
  const [selectedEngine, setSelectedEngine] = useState<DbEngine>("sqlite");
  const [connectionUrl, setConnectionUrl] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);
  const [switchResult, setSwitchResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showExample, setShowExample] = useState(false);

  const loadConfig = useCallback(async () => {
    setIsLoadingConfig(true);
    try {
      const res = await fetch("/api/db/config");
      if (res.ok) {
        const data = await res.json();
        setCurrentConfig(data);
        setSelectedEngine(data.engineKey || "sqlite");
      }
    } catch (e) {
      console.error("Failed to load DB config:", e);
    } finally {
      setIsLoadingConfig(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleTest = async () => {
    if (selectedEngine === "sqlite") return;
    if (!connectionUrl.trim()) {
      onStatusAlert?.("⚠️ Please enter a connection URL first.");
      return;
    }
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/db/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ engine: selectedEngine, url: connectionUrl })
      });
      const data = await res.json();
      setTestResult(data);
      if (data.success) {
        onStatusAlert?.(`✅ Connection successful! ${data.version} — ${data.latencyMs}ms latency`);
      } else {
        onStatusAlert?.(`❌ Connection failed: ${data.error}`);
      }
    } catch (e: any) {
      setTestResult({ success: false, error: e.message });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSwitch = async () => {
    setIsSwitching(true);
    setSwitchResult(null);
    try {
      const body: Record<string, string> = { engine: selectedEngine };
      if (selectedEngine !== "sqlite") body.url = connectionUrl;
      const res = await fetch("/api/db/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        setSwitchResult({ success: true, message: `Switched to ${ENGINE_CONFIGS[selectedEngine].label}! Data migrated successfully.` });
        onStatusAlert?.(`🚀 Database switched to ${ENGINE_CONFIGS[selectedEngine].label}`);
        await loadConfig();
      } else {
        setSwitchResult({ success: false, message: data.error || "Switch failed" });
        onStatusAlert?.(`❌ Database switch failed: ${data.error}`);
      }
    } catch (e: any) {
      setSwitchResult({ success: false, message: e.message });
    } finally {
      setIsSwitching(false);
    }
  };

  const handleRevertToSqlite = async () => {
    setSelectedEngine("sqlite");
    setConnectionUrl("");
    setTestResult(null);
    setSwitchResult(null);
    setIsSwitching(true);
    try {
      const res = await fetch("/api/db/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ engine: "sqlite" })
      });
      const data = await res.json();
      if (data.success) {
        onStatusAlert?.("✅ Reverted to local embedded SQLite database.");
        await loadConfig();
      }
    } catch (_) {}
    setIsSwitching(false);
  };

  const engineCfg = ENGINE_CONFIGS[selectedEngine];
  const EngineIcon = engineCfg.icon;
  const isCurrentEngine = currentConfig?.engineKey === selectedEngine;
  const canSwitch = selectedEngine === "sqlite" || (connectionUrl.trim().length > 10);

  return (
    <div className="flex flex-col gap-4 font-sans">

      {/* ── Active Engine Status Banner ── */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-900/80 to-slate-800/60 border border-white/10 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database size={13} className="text-purple-400" />
            <span className="text-xs font-bold font-mono tracking-wider uppercase text-slate-200">
              Active Database Engine
            </span>
          </div>
          <button
            onClick={loadConfig}
            disabled={isLoadingConfig}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition cursor-pointer"
            title="Refresh status"
          >
            <RefreshCw size={12} className={isLoadingConfig ? "animate-spin text-purple-400" : ""} />
          </button>
        </div>

        {isLoadingConfig ? (
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 animate-pulse">
            <Loader2 size={12} className="animate-spin" /> Loading database status...
          </div>
        ) : currentConfig ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {/* Engine */}
            <div className="p-2 rounded-xl bg-black/30 border border-white/8 flex flex-col gap-0.5">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Engine</span>
              <span className="text-[11px] font-bold font-mono text-white truncate">{currentConfig.engine}</span>
            </div>
            {/* Status */}
            <div className="p-2 rounded-xl bg-black/30 border border-white/8 flex flex-col gap-0.5">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Status</span>
              <span className="flex items-center gap-1 text-[11px] font-bold font-mono text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                {currentConfig.status.toUpperCase()}
              </span>
            </div>
            {/* Memories */}
            <div className="p-2 rounded-xl bg-black/30 border border-white/8 flex flex-col gap-0.5">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Memories</span>
              <span className="text-[11px] font-bold font-mono text-cyan-300">{currentConfig.stats.memories.toLocaleString()}</span>
            </div>
            {/* Knowledge nodes */}
            <div className="p-2 rounded-xl bg-black/30 border border-white/8 flex flex-col gap-0.5">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Graph Nodes</span>
              <span className="text-[11px] font-bold font-mono text-purple-300">{currentConfig.stats.knowledgeNodes.toLocaleString()}</span>
            </div>
            {/* Chat history */}
            <div className="p-2 rounded-xl bg-black/30 border border-white/8 flex flex-col gap-0.5">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Chat History</span>
              <span className="text-[11px] font-bold font-mono text-indigo-300">{currentConfig.stats.chatHistory.toLocaleString()}</span>
            </div>
            {/* Office Tasks */}
            <div className="p-2 rounded-xl bg-black/30 border border-white/8 flex flex-col gap-0.5">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Office Tasks</span>
              <span className="text-[11px] font-bold font-mono text-amber-300">{currentConfig.stats.officeTasks.toLocaleString()}</span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500 font-mono">Unable to load database status.</p>
        )}
      </div>

      {/* ── Engine Selector ── */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5">
          <ArrowRightLeft size={12} className="text-purple-400" />
          <span className="text-xs font-bold font-mono tracking-wider uppercase text-slate-200">
            Select Database Engine
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {(Object.keys(ENGINE_CONFIGS) as DbEngine[]).map((engine) => {
            const cfg = ENGINE_CONFIGS[engine];
            const Ico = cfg.icon;
            const isActive = selectedEngine === engine;
            const isCurrent = currentConfig?.engineKey === engine;
            return (
              <button
                key={engine}
                onClick={() => { setSelectedEngine(engine); setTestResult(null); setSwitchResult(null); }}
                className={`p-3 rounded-2xl border text-left flex flex-col gap-2 transition-all duration-200 cursor-pointer relative ${
                  isActive
                    ? `${cfg.bgColor} ${cfg.borderColor} ring-1 ring-current`
                    : "bg-white/3 border-white/8 hover:bg-white/6 hover:border-white/15"
                }`}
              >
                {isCurrent && (
                  <span className="absolute top-2 right-2 text-[8px] px-1.5 py-0.5 rounded-full bg-emerald-500/25 text-emerald-300 border border-emerald-400/30 font-mono font-bold uppercase">
                    ACTIVE
                  </span>
                )}
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${isActive ? cfg.bgColor : "bg-white/5"} border ${isActive ? cfg.borderColor : "border-white/10"}`}>
                  <Ico size={15} className={isActive ? cfg.iconColor : "text-slate-500"} />
                </div>
                <div>
                  <p className={`text-xs font-bold font-mono ${isActive ? "text-white" : "text-slate-400"}`}>{cfg.label}</p>
                  <span className={`inline-block text-[8px] px-1.5 py-0.5 rounded-full border font-mono font-bold mt-0.5 ${isActive ? cfg.badgeColor : "bg-white/5 text-slate-500 border-white/10"}`}>
                    {cfg.badge}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Engine Details & Config ── */}
      <div className={`p-3.5 rounded-2xl border ${engineCfg.borderColor} ${engineCfg.bgColor} flex flex-col gap-3`}>
        <div className="flex items-start gap-2.5">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${engineCfg.bgColor} border ${engineCfg.borderColor} shrink-0`}>
            <EngineIcon size={16} className={engineCfg.iconColor} />
          </div>
          <div>
            <p className="text-xs font-bold font-mono text-white">{engineCfg.label}</p>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{engineCfg.description}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {engineCfg.features.map((f, i) => (
            <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300 font-mono flex items-center gap-1">
              <CheckCircle2 size={9} className={engineCfg.iconColor} />
              {f}
            </span>
          ))}
        </div>

        {/* URL Input for Remote Engines */}
        {selectedEngine !== "sqlite" && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider">
                Connection URI
              </label>
              <button
                onClick={() => setShowExample(p => !p)}
                className="text-[10px] font-mono text-purple-400 hover:text-purple-300 transition flex items-center gap-1 cursor-pointer"
              >
                <ChevronDown size={10} className={`transition-transform ${showExample ? "rotate-180" : ""}`} />
                {showExample ? "Hide example" : "Show example"}
              </button>
            </div>

            {showExample && (
              <div className="p-2 rounded-lg bg-black/40 border border-white/10 text-[10px] font-mono text-slate-300 break-all">
                <span className="text-slate-500">Example: </span>
                <span className="text-cyan-300">{engineCfg.example}</span>
              </div>
            )}

            <div className="relative flex items-center">
              <input
                type={showPassword ? "text" : "password"}
                value={connectionUrl}
                onChange={(e) => { setConnectionUrl(e.target.value); setTestResult(null); setSwitchResult(null); }}
                placeholder={engineCfg.placeholder}
                className="w-full pr-9 pl-3 py-2 rounded-xl bg-black/40 border border-white/10 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 outline-none text-xs font-mono text-slate-200 placeholder-slate-600 transition"
              />
              <button
                onClick={() => setShowPassword(p => !p)}
                className="absolute right-2.5 text-slate-500 hover:text-slate-300 transition cursor-pointer"
                title={showPassword ? "Hide URL" : "Reveal URL"}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>

            {/* Test Connection Result */}
            {testResult && (
              <div className={`flex items-center gap-2 p-2 rounded-lg text-xs font-mono border ${
                testResult.success
                  ? "bg-emerald-950/50 border-emerald-500/30 text-emerald-300"
                  : "bg-rose-950/50 border-rose-500/30 text-rose-300"
              }`}>
                {testResult.success
                  ? <CheckCircle2 size={13} className="shrink-0" />
                  : <AlertCircle size={13} className="shrink-0" />}
                <span>
                  {testResult.success
                    ? `✅ Connected — ${testResult.version} (${testResult.latencyMs}ms)`
                    : `❌ ${testResult.error}`}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Switch / Migrate Result */}
        {switchResult && (
          <div className={`flex items-center gap-2 p-2 rounded-lg text-xs font-mono border ${
            switchResult.success
              ? "bg-emerald-950/50 border-emerald-500/30 text-emerald-300"
              : "bg-rose-950/50 border-rose-500/30 text-rose-300"
          }`}>
            {switchResult.success
              ? <CheckCircle2 size={13} className="shrink-0" />
              : <AlertCircle size={13} className="shrink-0" />}
            <span>{switchResult.message}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 mt-1">
          {/* Test button — only for remote engines */}
          {selectedEngine !== "sqlite" && (
            <button
              onClick={handleTest}
              disabled={isTesting || !connectionUrl.trim()}
              className="flex-1 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-slate-300 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-40"
            >
              {isTesting
                ? <Loader2 size={13} className="animate-spin" />
                : <Activity size={13} />}
              {isTesting ? "Testing..." : "Test Connection"}
            </button>
          )}

          {/* Save & Migrate / Switch button */}
          {!isCurrentEngine ? (
            <button
              onClick={handleSwitch}
              disabled={isSwitching || !canSwitch}
              className={`flex-1 py-2 px-3 rounded-xl font-mono font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-40 ${
                selectedEngine === "sqlite"
                  ? "bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-200"
                  : "bg-gradient-to-r from-purple-600/40 to-indigo-600/40 hover:from-purple-600/60 hover:to-indigo-600/60 border border-purple-500/40 text-white shadow-md hover:shadow-purple-900/40"
              }`}
            >
              {isSwitching
                ? <Loader2 size={13} className="animate-spin" />
                : <Zap size={13} />}
              {isSwitching
                ? "Migrating Data..."
                : selectedEngine === "sqlite"
                  ? "Revert to Local SQLite"
                  : "Save & Migrate to Database"}
            </button>
          ) : (
            <div className="flex-1 py-2 px-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold flex items-center justify-center gap-1.5">
              <ShieldCheck size={13} />
              Currently Active Engine
            </div>
          )}
        </div>
      </div>

      {/* ── High Availability Fallback Notice ── */}
      <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/20 flex items-start gap-2.5">
        <ShieldCheck size={14} className="text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-[11px] font-bold font-mono text-amber-300">High-Availability Fallback Active</p>
          <p className="text-[10px] text-amber-400/80 font-mono mt-0.5 leading-relaxed">
            If a remote database loses connectivity, MAHR automatically falls back to local SQLite to guarantee zero data loss and uninterrupted operation. Data is always written to SQLite first.
          </p>
        </div>
      </div>

      {/* Revert link when not on SQLite */}
      {currentConfig?.engineKey !== "sqlite" && (
        <button
          onClick={handleRevertToSqlite}
          disabled={isSwitching}
          className="py-2 px-3 rounded-xl bg-rose-950/20 hover:bg-rose-950/40 border border-rose-500/20 hover:border-rose-500/40 text-rose-400 hover:text-rose-300 text-xs font-mono font-bold flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-40"
        >
          <HardDrive size={13} />
          Emergency Revert to Local SQLite
        </button>
      )}
    </div>
  );
};
