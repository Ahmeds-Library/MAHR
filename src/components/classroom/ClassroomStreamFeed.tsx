import React from "react";
import { ClassroomAnnouncement } from "../../services/google/googleClassroomClient";
import { Megaphone, ExternalLink, HardDrive, Youtube, Link as LinkIcon, Calendar } from "lucide-react";

interface ClassroomStreamFeedProps {
  announcements: ClassroomAnnouncement[];
}

export const ClassroomStreamFeed: React.FC<ClassroomStreamFeedProps> = ({ announcements }) => {
  if (announcements.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl p-6 bg-slate-900/40">
        <Megaphone className="w-8 h-8 text-slate-600 mx-auto mb-2" />
        <h4 className="text-sm font-semibold text-slate-300 font-mono">No Announcements</h4>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          Your instructor hasn't posted any announcements to the class stream yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {announcements.map((ann) => {
        const timeStr = ann.creationTime
          ? new Date(ann.creationTime).toLocaleDateString([], {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "";

        return (
          <div
            key={ann.id}
            className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 shadow-sm space-y-2.5"
          >
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <Megaphone className="w-3.5 h-3.5" /> Class Announcement
              </span>
              <span>{timeStr}</span>
            </div>

            <p className="text-xs sm:text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
              {ann.text}
            </p>

            {/* Attached Materials */}
            {ann.materials && ann.materials.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1 border-t border-white/5">
                {ann.materials.map((mat, idx) => {
                  if (mat.driveFile?.driveFile) {
                    return (
                      <a
                        key={idx}
                        href={mat.driveFile.driveFile.alternateLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950 border border-white/10 text-xs text-slate-300 hover:text-white transition-colors"
                      >
                        <HardDrive className="w-3 h-3 text-blue-400" />
                        <span className="truncate max-w-[160px]">{mat.driveFile.driveFile.title}</span>
                      </a>
                    );
                  }
                  if (mat.youtubeVideo) {
                    return (
                      <a
                        key={idx}
                        href={mat.youtubeVideo.alternateLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950 border border-white/10 text-xs text-slate-300 hover:text-white transition-colors"
                      >
                        <Youtube className="w-3 h-3 text-rose-500" />
                        <span className="truncate max-w-[160px]">{mat.youtubeVideo.title}</span>
                      </a>
                    );
                  }
                  if (mat.link) {
                    return (
                      <a
                        key={idx}
                        href={mat.link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950 border border-white/10 text-xs text-slate-300 hover:text-white transition-colors"
                      >
                        <LinkIcon className="w-3 h-3 text-cyan-400" />
                        <span className="truncate max-w-[160px]">{mat.link.title || mat.link.url}</span>
                      </a>
                    );
                  }
                  return null;
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
