import React from "react";
import { GraduationCap, CheckCircle2, BookOpen, ExternalLink, X } from "lucide-react";
import { ClassroomSyncNotice } from "../../hooks/google/useClassroomBackgroundSync";

interface ClassroomAutoSyncToastProps {
  notice: ClassroomSyncNotice | null;
  onDismiss: () => void;
  onOpenClassroom?: () => void;
  onOpenTasks?: () => void;
}

export const ClassroomAutoSyncToast: React.FC<ClassroomAutoSyncToastProps> = ({
  notice,
  onDismiss,
  onOpenClassroom,
  onOpenTasks,
}) => {
  if (!notice) return null;

  const isTask = notice.type === "tasks";
  const isResource = notice.type === "resources";

  return (
    <div className="fixed top-18 right-4 z-50 max-w-md w-full animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto">
      <div className="p-3.5 rounded-2xl bg-slate-950/95 border border-emerald-500/40 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.8),0_0_20px_rgba(16,185,129,0.2)] text-slate-100 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl shrink-0 ${isTask ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"}`}>
              {isTask ? <CheckCircle2 size={18} /> : <BookOpen size={18} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                  <GraduationCap size={12} /> MAHR Classroom Sync
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <p className="text-xs font-medium text-slate-200 mt-0.5 leading-snug">
                {notice.message}
              </p>
            </div>
          </div>

          <button
            onClick={onDismiss}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer shrink-0"
            title="Dismiss"
          >
            <X size={15} />
          </button>
        </div>

        {notice.details && notice.details.length > 0 && (
          <div className="px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/5 text-[11px] font-mono text-slate-300 max-h-24 overflow-y-auto scrollbar-thin">
            {notice.details.map((detail, idx) => (
              <div key={idx} className="truncate flex items-center gap-1.5">
                <span className="text-emerald-400">•</span>
                <span className="truncate">{detail}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-1 border-t border-white/10">
          {isTask && onOpenTasks && (
            <button
              onClick={() => {
                onOpenTasks();
                onDismiss();
              }}
              className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-medium flex items-center gap-1 transition cursor-pointer"
            >
              <span>View in Tasks</span>
              <ExternalLink size={11} />
            </button>
          )}

          {onOpenClassroom && (
            <button
              onClick={() => {
                onOpenClassroom();
                onDismiss();
              }}
              className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-medium flex items-center gap-1 transition cursor-pointer"
            >
              <span>Open Classroom Hub</span>
              <ExternalLink size={11} />
            </button>
          )}

          <button
            onClick={onDismiss}
            className="px-2 py-1 rounded-lg text-slate-400 hover:text-slate-200 text-[11px] font-medium transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
