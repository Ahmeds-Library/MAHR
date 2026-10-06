import React, { useState } from "react";
import { GoogleTaskList } from "../../services/google/googleWorkspaceTypes";
import { CheckCircle2, RotateCw, Plus, ChevronDown, User, ExternalLink, X } from "lucide-react";

interface GoogleTaskSyncHeaderProps {
  taskLists: GoogleTaskList[];
  activeListId: string;
  onSwitchList: (listId: string) => void;
  onCreateListClick: () => void;
  onRefresh: () => void;
  onClose: () => void;
  isSyncing?: boolean;
  userEmail?: string | null;
  lastSyncedAt?: string | null;
}

export const GoogleTaskSyncHeader: React.FC<GoogleTaskSyncHeaderProps> = ({
  taskLists,
  activeListId,
  onSwitchList,
  onCreateListClick,
  onRefresh,
  onClose,
  isSyncing = false,
  userEmail,
  lastSyncedAt,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const activeList = taskLists.find((l) => l.id === activeListId) || taskLists[0] || { id: "@default", title: "My Tasks" };

  return (
    <div className="p-4 sm:p-5 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl flex flex-wrap items-center justify-between gap-3 relative">
      {/* Brand & List Selector */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 shadow-lg shadow-blue-500/10">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15-5-5 1.41-1.41L11 14.17l7.59-7.59L20 8l-9 9z"
              fill="#3B82F6"
            />
          </svg>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Google Tasks
            </h2>
            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Cloud Sync
            </span>
          </div>

          {/* List Selector Pill */}
          <div className="relative mt-1">
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-850 px-2.5 py-1 rounded-lg border border-white/10 transition-colors cursor-pointer"
            >
              <span className="font-medium">{activeList.title}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isDropdownOpen && (
              <div className="absolute left-0 top-full mt-1.5 z-50 w-56 rounded-xl bg-slate-900 border border-white/15 shadow-2xl p-1.5 space-y-1 animate-in fade-in duration-150">
                <div className="px-2 py-1 text-[10px] font-mono uppercase text-slate-400 tracking-wider">
                  Select Google Task List
                </div>
                {taskLists.map((list) => (
                  <button
                    key={list.id}
                    onClick={() => {
                      onSwitchList(list.id);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                      list.id === activeListId
                        ? "bg-blue-600 text-white font-medium"
                        : "text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    <span className="truncate">{list.title}</span>
                    {list.id === activeListId && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                ))}
                <div className="pt-1 border-t border-white/10">
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onCreateListClick();
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-blue-400 hover:bg-blue-500/10 flex items-center gap-1.5 font-medium transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create New Task List</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* User Badge */}
        {userEmail && (
          <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/80 border border-white/10 text-xs text-slate-300 font-mono">
            <User className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="truncate max-w-[140px]">{userEmail}</span>
          </div>
        )}

        {/* Sync / Refresh Button */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isSyncing}
          title={lastSyncedAt ? `Last synced at ${lastSyncedAt}` : "Sync with Google Tasks"}
          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer disabled:opacity-50"
        >
          <RotateCw className={`w-4 h-4 ${isSyncing ? "animate-spin text-blue-400" : ""}`} />
        </button>

        {/* Direct Google Tasks Link */}
        <a
          href="https://tasks.google.com"
          target="_blank"
          rel="noopener noreferrer"
          title="Open Google Tasks Web App"
          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
        >
          <ExternalLink className="w-4 h-4" />
        </a>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
