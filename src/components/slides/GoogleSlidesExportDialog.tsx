import React, { useState } from "react";
import {
  X,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Presentation,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { SlideDeck } from "../../services/slides/slideTypes";
import { GooglePresentationResult } from "../../services/slides/googleSlidesApi";
import { useGoogleSlidesAuth } from "../../hooks/slides/useGoogleSlidesAuth";

interface GoogleSlidesExportDialogProps {
  deck: SlideDeck;
  isOpen: boolean;
  onClose: () => void;
  onExport: (accessToken: string) => Promise<GooglePresentationResult | null>;
  isExporting: boolean;
  progressText: string;
  progressPercent: number;
  exportResult: GooglePresentationResult | null;
  exportError: string | null;
}

export const GoogleSlidesExportDialog: React.FC<GoogleSlidesExportDialogProps> = ({
  deck,
  isOpen,
  onClose,
  onExport,
  isExporting,
  progressText,
  progressPercent,
  exportResult,
  exportError
}) => {
  const { user, token, isAuthenticated, isLoggingIn, signIn } = useGoogleSlidesAuth();
  const [hasConfirmed, setHasConfirmed] = useState(false);

  if (!isOpen) return null;

  const handleStartExport = async () => {
    let currentToken = token;
    if (!currentToken) {
      currentToken = await signIn();
      if (!currentToken) return;
    }
    setHasConfirmed(true);
    await onExport(currentToken);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-lg bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-zinc-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Presentation size={18} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Export to Google Slides</h3>
              <p className="text-[11px] text-zinc-400">Official Google Workspace integration</p>
            </div>
          </div>

          {!isExporting && (
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Success State */}
          {exportResult ? (
            <div className="text-center space-y-4 py-2">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CheckCircle2 size={32} />
              </div>

              <div>
                <h4 className="text-base font-bold text-white">Presentation Created!</h4>
                <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                  Your {exportResult.slidesCount} slides have been formatted and saved into your Google Drive.
                </p>
              </div>

              <div className="p-3.5 bg-zinc-900/80 border border-white/10 rounded-xl text-left text-xs font-mono text-zinc-300">
                <div className="text-zinc-500 text-[10px] uppercase">Title</div>
                <div className="font-semibold text-white truncate">{exportResult.title}</div>
                <div className="text-zinc-500 text-[10px] uppercase mt-2">Target Account</div>
                <div className="text-purple-300 truncate">{user?.email || "Google Workspace Account"}</div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                <a
                  href={exportResult.presentationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-semibold text-xs shadow-lg transition-all"
                >
                  <ExternalLink size={14} />
                  <span>Open in Google Slides</span>
                </a>
                <button
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium border border-white/10 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          ) : isExporting ? (
            /* Exporting in progress */
            <div className="text-center space-y-4 py-4">
              <Loader2 size={36} className="animate-spin text-purple-400 mx-auto" />
              <div>
                <h4 className="text-sm font-semibold text-white">Communicating with Google Slides...</h4>
                <p className="text-xs text-zinc-400 mt-1">{progressText || "Preparing batch requests..."}</p>
              </div>

              <div className="w-full bg-zinc-900 rounded-full h-2 overflow-hidden border border-white/5">
                <div
                  className="bg-gradient-to-r from-purple-500 to-amber-400 h-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-[11px] font-mono text-zinc-500">{progressPercent}% complete</span>
            </div>
          ) : (
            /* Confirmation & Permission Prompt */
            <div className="space-y-4">
              <div className="p-4 bg-zinc-900/60 border border-white/10 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Presentation Deck</span>
                  <span className="font-semibold text-white">{deck.title}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Number of Slides</span>
                  <span className="font-mono text-purple-300 font-semibold">{deck.slides.length} Slides</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Destination</span>
                  <span className="text-zinc-300">Google Drive & Google Slides</span>
                </div>
              </div>

              {exportError && (
                <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl flex items-start gap-2.5 text-xs text-red-300">
                  <AlertCircle size={15} className="text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Export Failed:</span> {exportError}
                  </div>
                </div>
              )}

              {/* Explicit User Confirmation Description */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2.5 text-xs text-amber-200/90">
                <ShieldCheck size={16} className="text-amber-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  With your permission, MAHR will create a new presentation titled <strong>"{deck.title}"</strong> containing <strong>{deck.slides.length} formatted slides</strong> and speaker notes directly in your Google Drive.
                </p>
              </div>

              {/* Sign in with Google if not authenticated */}
              {!isAuthenticated && (
                <div className="pt-2">
                  <button
                    onClick={handleStartExport}
                    disabled={isLoggingIn}
                    className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl bg-white hover:bg-zinc-100 text-zinc-900 font-medium text-xs shadow-lg transition-all"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                    </svg>
                    <span>{isLoggingIn ? "Signing into Google..." : "Sign in with Google & Export"}</span>
                  </button>
                </div>
              )}

              {isAuthenticated && (
                <div className="pt-2 flex items-center gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-medium border border-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleStartExport}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-purple-600/30 transition-all"
                  >
                    <Sparkles size={14} />
                    <span>Confirm & Create</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
