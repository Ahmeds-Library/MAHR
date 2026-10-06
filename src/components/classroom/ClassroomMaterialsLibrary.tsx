import React, { useState } from "react";
import { ClassroomSavedResource } from "../../services/google/classroomSyncEngine";
import {
  BookOpen,
  FileText,
  Youtube,
  Link as LinkIcon,
  ExternalLink,
  Sparkles,
  Search,
  Filter,
  CheckCircle,
  HardDrive,
} from "lucide-react";

interface ClassroomMaterialsLibraryProps {
  resources: ClassroomSavedResource[];
  onStudyResourceWithMahr: (resource: ClassroomSavedResource) => void;
}

export const ClassroomMaterialsLibrary: React.FC<ClassroomMaterialsLibraryProps> = ({
  resources,
  onStudyResourceWithMahr,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");

  const filteredResources = resources.filter((res) => {
    if (selectedType !== "all" && res.type !== selectedType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        res.title.toLowerCase().includes(q) ||
        res.courseName.toLowerCase().includes(q) ||
        (res.parentAssignmentTitle && res.parentAssignmentTitle.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const getTypeIcon = (type: ClassroomSavedResource["type"]) => {
    switch (type) {
      case "book_pdf":
        return <BookOpen className="w-4 h-4 text-amber-400" />;
      case "youtube_lecture":
        return <Youtube className="w-4 h-4 text-rose-500" />;
      case "web_link":
        return <LinkIcon className="w-4 h-4 text-cyan-400" />;
      case "quiz_form":
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      default:
        return <HardDrive className="w-4 h-4 text-blue-400" />;
    }
  };

  const getTypeBadge = (type: ClassroomSavedResource["type"]) => {
    switch (type) {
      case "book_pdf":
        return (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono">
            Book / PDF
          </span>
        );
      case "youtube_lecture":
        return (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 font-mono">
            Lecture Video
          </span>
        );
      case "web_link":
        return (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-mono">
            Reference Link
          </span>
        );
      default:
        return (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30 font-mono">
            Drive Document
          </span>
        );
    }
  };

  if (resources.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl p-6 bg-slate-900/40 space-y-2">
        <BookOpen className="w-8 h-8 text-slate-500 mx-auto" />
        <h4 className="text-sm font-semibold text-slate-300 font-mono">No Course Books or Files Yet</h4>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          As teachers post textbooks, PDFs, and learning materials in Google Classroom, MAHR will automatically index and save them here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
      {/* Search & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search books, PDFs, documents, or topics..."
            className="w-full bg-slate-900/90 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 outline-none focus:border-emerald-500/50"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto text-[11px] font-mono">
          <button
            onClick={() => setSelectedType("all")}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              selectedType === "all" ? "bg-emerald-600 text-white font-bold" : "bg-slate-900 text-slate-400 hover:text-white"
            }`}
          >
            All ({resources.length})
          </button>
          <button
            onClick={() => setSelectedType("book_pdf")}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              selectedType === "book_pdf" ? "bg-emerald-600 text-white font-bold" : "bg-slate-900 text-slate-400 hover:text-white"
            }`}
          >
            Books & PDFs
          </button>
          <button
            onClick={() => setSelectedType("drive_file")}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              selectedType === "drive_file" ? "bg-emerald-600 text-white font-bold" : "bg-slate-900 text-slate-400 hover:text-white"
            }`}
          >
            Drive Docs
          </button>
          <button
            onClick={() => setSelectedType("youtube_lecture")}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              selectedType === "youtube_lecture" ? "bg-emerald-600 text-white font-bold" : "bg-slate-900 text-slate-400 hover:text-white"
            }`}
          >
            Videos
          </button>
        </div>
      </div>

      {/* Grid of Resources */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filteredResources.map((res) => (
          <div
            key={res.id + res.url}
            className="p-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-white/10 hover:border-emerald-500/30 transition-all flex flex-col justify-between space-y-3"
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  {getTypeIcon(res.type)}
                  <span className="text-[10px] font-mono text-slate-400 truncate max-w-[120px]">
                    {res.courseName}
                  </span>
                </div>
                {getTypeBadge(res.type)}
              </div>

              <h4 className="text-xs sm:text-sm font-semibold text-white leading-snug line-clamp-2">
                {res.title}
              </h4>

              {res.parentAssignmentTitle && (
                <p className="text-[11px] text-slate-400 line-clamp-1 font-sans">
                  From: {res.parentAssignmentTitle}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
              <a
                href={res.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors"
              >
                <span>Open File</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              <button
                onClick={() => onStudyResourceWithMahr(res)}
                className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-[11px] font-medium flex items-center gap-1 transition-all hover:scale-[1.02] cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>Study with MAHR</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
