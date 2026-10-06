import React from "react";
import {
  ClassroomCourseWork,
  ClassroomStudentSubmission,
} from "../../services/google/googleClassroomClient";
import {
  FileText,
  Calendar,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Youtube,
  Link as LinkIcon,
  HardDrive,
  Presentation,
} from "lucide-react";

interface ClassroomAssignmentCardProps {
  assignment: ClassroomCourseWork;
  submission?: ClassroomStudentSubmission;
  onStudyWithMahr: (assignment: ClassroomCourseWork) => void;
}

export const ClassroomAssignmentCard: React.FC<ClassroomAssignmentCardProps> = ({
  assignment,
  submission,
  onStudyWithMahr,
}) => {
  const dueStr = assignment.dueDate
    ? `${assignment.dueDate.year}-${String(assignment.dueDate.month).padStart(2, "0")}-${String(assignment.dueDate.day).padStart(2, "0")}`
    : "No deadline";

  const getSubmissionBadge = () => {
    if (!submission) {
      return (
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-white/10 font-mono">
          Assigned
        </span>
      );
    }

    if (submission.state === "TURNED_IN" || submission.state === "RETURNED") {
      return (
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono flex items-center gap-1 font-semibold">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          {submission.assignedGrade !== undefined
            ? `Graded: ${submission.assignedGrade}/${assignment.maxPoints || 100}`
            : "Turned In"}
        </span>
      );
    }

    if (submission.late) {
      return (
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono flex items-center gap-1 font-semibold">
          <AlertCircle className="w-3 h-3 text-rose-400" /> Missing / Late
        </span>
      );
    }

    return (
      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono">
        In Progress
      </span>
    );
  };

  return (
    <div className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-white/10 hover:border-emerald-500/30 shadow-md transition-all space-y-3">
      {/* Top Row: Title & Badges */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-semibold text-white leading-snug">
              {assignment.title}
            </h4>
            {getSubmissionBadge()}
          </div>
          {assignment.description && (
            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
              {assignment.description}
            </p>
          )}
        </div>

        {assignment.maxPoints !== undefined && (
          <div className="text-right shrink-0">
            <span className="text-[11px] font-mono text-slate-400 block">
              {assignment.maxPoints} pts
            </span>
          </div>
        )}
      </div>

      {/* Attached Materials (if any) */}
      {assignment.materials && assignment.materials.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {assignment.materials.map((mat, i) => {
            if (mat.driveFile?.driveFile) {
              return (
                <a
                  key={i}
                  href={mat.driveFile.driveFile.alternateLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-950 border border-white/10 text-[10px] text-slate-300 hover:text-white hover:border-emerald-500/40 transition-colors"
                >
                  <HardDrive className="w-2.5 h-2.5 text-blue-400" />
                  <span className="truncate max-w-[120px]">{mat.driveFile.driveFile.title}</span>
                </a>
              );
            }
            if (mat.youtubeVideo) {
              return (
                <a
                  key={i}
                  href={mat.youtubeVideo.alternateLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-950 border border-white/10 text-[10px] text-slate-300 hover:text-white hover:border-rose-500/40 transition-colors"
                >
                  <Youtube className="w-2.5 h-2.5 text-rose-500" />
                  <span className="truncate max-w-[120px]">{mat.youtubeVideo.title}</span>
                </a>
              );
            }
            if (mat.link) {
              return (
                <a
                  key={i}
                  href={mat.link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-950 border border-white/10 text-[10px] text-slate-300 hover:text-white transition-colors"
                >
                  <LinkIcon className="w-2.5 h-2.5 text-cyan-400" />
                  <span className="truncate max-w-[120px]">{mat.link.title || mat.link.url}</span>
                </a>
              );
            }
            return null;
          })}
        </div>
      )}

      {/* Footer Info & Actions */}
      <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
          <Calendar className="w-3.5 h-3.5 text-emerald-400" />
          <span>Due: {dueStr}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Direct Link to Google Classroom */}
          {assignment.alternateLink && (
            <a
              href={assignment.alternateLink}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Open in Google Classroom"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          {/* Core Feature: Study with MAHR on Chalkboard */}
          <button
            onClick={() => onStudyWithMahr(assignment)}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-medium text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all hover:scale-[1.02] cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Study with MAHR</span>
          </button>
        </div>
      </div>
    </div>
  );
};
