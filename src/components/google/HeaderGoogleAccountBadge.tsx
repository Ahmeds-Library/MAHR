import React from "react";
import { CheckCircle2, ShieldCheck, Cloud, Loader2 } from "lucide-react";
import { useGoogleWorkspace } from "../../hooks/google/useGoogleWorkspace";

interface HeaderGoogleAccountBadgeProps {
  onOpenSettings: () => void;
  className?: string;
}

export const HeaderGoogleAccountBadge: React.FC<HeaderGoogleAccountBadgeProps> = ({
  onOpenSettings,
  className = "",
}) => {
  const { user, isAuthenticated, isLoading, isSyncing } = useGoogleWorkspace();

  if (isLoading) {
    return (
      <div className={`h-9 px-3 rounded-xl border border-white/10 bg-white/5 flex items-center gap-2 text-xs text-zinc-400 ${className}`}>
        <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
        <span className="hidden sm:inline">Checking Account...</span>
      </div>
    );
  }

  if (isAuthenticated && user) {
    const firstName = user.displayName?.split(" ")[0] || "User";
    return (
      <button
        type="button"
        id="header-google-connected-btn"
        data-testid="header-google-connected-btn"
        onClick={onOpenSettings}
        title={`Connected as ${user.email} (All 7 Google Products Synced)`}
        className={`group relative h-9 pl-2 pr-3 rounded-xl border border-emerald-500/30 hover:border-emerald-400/60 bg-gradient-to-r from-emerald-500/10 via-zinc-900 to-zinc-950 text-white flex items-center gap-2 transition-all duration-200 shadow-md hover:shadow-emerald-500/10 cursor-pointer ${className}`}
      >
        {/* User Avatar */}
        <div className="relative">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName}
              className="w-5 h-5 rounded-full border border-emerald-400/60 object-cover"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-400/60 flex items-center justify-center text-[10px] text-emerald-300 font-bold">
              {firstName.charAt(0)}
            </div>
          )}
          <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-zinc-950 animate-pulse" />
        </div>

        {/* User Name & Synced Badge */}
        <span className="text-xs font-semibold text-zinc-200 group-hover:text-white truncate max-w-[90px] sm:max-w-[120px]">
          {firstName}
        </span>
        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-mono font-medium border border-emerald-500/30 hidden md:inline">
          {isSyncing ? "Syncing..." : "7 Apps Synced"}
        </span>
      </button>
    );
  }

  // Not Connected: High-Visibility Google Connection CTA
  return (
    <button
      type="button"
      id="header-google-connect-btn"
      data-testid="header-google-connect-btn"
      onClick={onOpenSettings}
      title="Connect your Google Account to sync Google Slides, Drive, Docs, Sheets, Calendar, Gmail & Tasks"
      className={`group relative h-9 px-3 rounded-xl border-2 border-cyan-400/50 hover:border-cyan-300 bg-gradient-to-r from-cyan-500/20 via-sky-500/10 to-zinc-900 text-white flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-cyan-500/25 hover:scale-[1.02] active:scale-[0.98] cursor-pointer animate-pulse-slow ${className}`}
    >
      {/* Official Google G Logo SVG */}
      <div className="w-4 h-4 rounded-full bg-white p-0.5 flex items-center justify-center flex-shrink-0 shadow-sm">
        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-full h-full block">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
          <path fill="none" d="M0 0h48v48H0z" />
        </svg>
      </div>

      <span className="text-xs font-bold text-cyan-200 group-hover:text-white tracking-wide">
        Connect Google
      </span>

      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping hidden sm:inline" />
    </button>
  );
};
