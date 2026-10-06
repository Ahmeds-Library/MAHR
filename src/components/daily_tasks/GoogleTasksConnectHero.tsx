import React from "react";
import { CheckCircle2, CloudLightning, ShieldCheck, Smartphone, Sparkles, ArrowRight } from "lucide-react";
import { motion } from "motion/react";

interface GoogleTasksConnectHeroProps {
  onConnect: () => void;
  isLoading?: boolean;
}

export const GoogleTasksConnectHero: React.FC<GoogleTasksConnectHeroProps> = ({
  onConnect,
  isLoading = false,
}) => {
  return (
    <div className="py-10 px-6 sm:px-10 text-center max-w-xl mx-auto space-y-6">
      {/* Visual Orb / Badge */}
      <div className="relative inline-flex items-center justify-center">
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500 blur-xl opacity-40"
        />
        <div className="relative w-20 h-20 rounded-3xl bg-slate-900 border border-blue-500/30 flex items-center justify-center shadow-2xl">
          <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15-5-5 1.41-1.41L11 14.17l7.59-7.59L20 8l-9 9z"
              fill="#4285F4"
            />
          </svg>
        </div>
      </div>

      {/* Headline & Description */}
      <div className="space-y-2.5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 text-xs font-mono font-medium">
          <CloudLightning className="w-3.5 h-3.5 text-blue-400" />
          <span>Google Tasks Cloud Engine</span>
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Connect Your Google Tasks
        </h3>
        <p className="text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
          Every task you add, edit, or complete will sync in real-time with your Google Tasks app on Android/iOS, Google Calendar, and MAHR Voice.
        </p>
      </div>

      {/* Feature Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left pt-2">
        <div className="p-3 rounded-xl bg-slate-900/60 border border-white/10 space-y-1">
          <Smartphone className="w-4 h-4 text-cyan-400" />
          <div className="text-xs font-semibold text-slate-200">Mobile Sync</div>
          <div className="text-[11px] text-slate-400 leading-snug">Reflected instantly on your phone's Google Tasks app.</div>
        </div>
        <div className="p-3 rounded-xl bg-slate-900/60 border border-white/10 space-y-1">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <div className="text-xs font-semibold text-slate-200">Alexa & Voice</div>
          <div className="text-[11px] text-slate-400 leading-snug">Say "Add task" or "Complete task" to manage hands-free.</div>
        </div>
        <div className="p-3 rounded-xl bg-slate-900/60 border border-white/10 space-y-1">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <div className="text-xs font-semibold text-slate-200">Zero Desync</div>
          <div className="text-[11px] text-slate-400 leading-snug">All operations execute directly on official Google APIs.</div>
        </div>
      </div>

      {/* Connect Button */}
      <div className="pt-3">
        <button
          onClick={onConnect}
          disabled={isLoading}
          className="w-full sm:w-auto px-7 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-medium text-sm shadow-xl shadow-blue-500/25 flex items-center justify-center gap-2 mx-auto cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Connecting to Google...</span>
            </>
          ) : (
            <>
              <span>Connect Google Account</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
