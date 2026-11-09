import React from "react";
import { CheckSquare, RefreshCw, LogIn, ChevronDown, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import { GoogleTaskList } from "../../services/google/googleWorkspaceTypes";

interface GoogleTaskSyncBannerProps {
  isGoogleConnected: boolean;
  userEmail: string | null;
  userName: string | null;
  taskLists: GoogleTaskList[];
  activeListId: string;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  onSwitchList: (listId: string) => void;
  onRefresh: () => void;
  onConnectGoogle: () => void;
}

export const GoogleTaskSyncBanner: React.FC<GoogleTaskSyncBannerProps> = ({
  isGoogleConnected,
  userEmail,
  userName,
  taskLists,
  activeListId,
  isSyncing,
  lastSyncedAt,
  onSwitchList,
  onRefresh,
  onConnectGoogle,
}) => {
  if (isGoogleConnected) {
    return (
      <div className="mx-4 sm:mx-6 mt-3 mb-1 p-3 rounded-2xl bg-gradient-to-r from-blue-950/40 via-slate-900/60 to-indigo-950/40 border border-blue-500/25 flex flex-wrap items-center justify-between gap-3 shadow-inner">
        {/* User Account & Live Sync Indicator */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
            <CheckSquare className="w-4 h-4 text-blue-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-white tracking-tight flex items-center gap-1.5">
                Google Tasks Live
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-mono font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1 animate-pulse" />
                  Synced
                </span>
              </span>
              <span className="text-[11px] text-blue-300/80 truncate max-w-[200px]" title={userEmail || ""}>
                • {userEmail || userName}
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Synced with Google Cloud • Last refresh: {lastSyncedAt || "Just now"}
            </p>
          </div>
        </div>

        {/* Task List Selector & Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {taskLists.length > 1 ? (
            <div className="relative">
              <select
                value={activeListId}
                onChange={(e) => onSwitchList(e.target.value)}
                className="appearance-none bg-slate-800/90 border border-white/15 rounded-xl pl-2.5 pr-7 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-400 cursor-pointer font-medium"
              >
                {taskLists.map((list) => (
                  <option key={list.id} value={list.id} className="bg-slate-900 text-white">
                    {list.title}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          ) : (
            <span className="text-[11px] px-2 py-1 rounded-lg bg-slate-800/80 border border-white/10 text-slate-300 font-mono">
              My Tasks
            </span>
          )}

          <button
            type="button"
            onClick={onRefresh}
            disabled={isSyncing}
            className="p-1.5 rounded-xl bg-slate-800/90 border border-white/15 text-slate-300 hover:text-white hover:bg-slate-700/80 transition-all cursor-pointer disabled:opacity-50"
            title="Refresh from Google Tasks"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin text-blue-400" : ""}`} />
          </button>
        </div>
      </div>
    );
  }

  // Not Connected: Unobtrusive Connect CTA with explanation
  return (
    <div className="mx-4 sm:mx-6 mt-3 mb-1 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex flex-wrap items-center justify-between gap-3 shadow-inner">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/35 flex items-center justify-center shrink-0">
          <CheckSquare className="w-4 h-4 text-amber-400" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-amber-300">Offline / Local Tasks Mode</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">Local Cache</span>
          </div>
          <p className="text-[10px] text-slate-400">
            Sign in with Google to sync your tasks with Google Tasks, Google Calendar & MAHR voice.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onConnectGoogle}
        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02] cursor-pointer shrink-0"
      >
        <LogIn className="w-3.5 h-3.5" />
        <span>Connect Google</span>
      </button>
    </div>
  );
};
