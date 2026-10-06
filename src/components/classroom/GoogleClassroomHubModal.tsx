import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  GraduationCap,
  BookOpen,
  Megaphone,
  RotateCw,
  ExternalLink,
  X,
  Sparkles,
  ArrowRight,
  Library,
  Zap,
} from "lucide-react";
import { useGoogleClassroom } from "../../hooks/google/useGoogleClassroom";
import { ClassroomAssignmentCard } from "./ClassroomAssignmentCard";
import { ClassroomStreamFeed } from "./ClassroomStreamFeed";
import { ClassroomMaterialsLibrary } from "./ClassroomMaterialsLibrary";
import { ClassroomCourseWork } from "../../services/google/googleClassroomClient";
import { ClassroomSavedResource } from "../../services/google/classroomSyncEngine";

export interface GoogleClassroomHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStudyAssignment: (assignment: any, chalkboardContent: string) => void;
}

export const GoogleClassroomHubModal: React.FC<GoogleClassroomHubModalProps> = ({
  isOpen,
  onClose,
  onStudyAssignment,
}) => {
  const {
    courses,
    activeCourseId,
    activeCourse,
    courseWork,
    announcements,
    submissions,
    savedResources,
    isGoogleConnected,
    isLoading,
    isSyncing,
    lastSyncedAt,
    autoSyncNotice,
    selectCourse,
    refresh,
    connectGoogle,
    formatAssignmentForChalkboard,
    formatResourceForChalkboard,
  } = useGoogleClassroom();

  const [activeTab, setActiveTab] = useState<"assignments" | "materials" | "stream">("assignments");
  const [filterScope, setFilterScope] = useState<"all" | "pending" | "done">("all");

  const filteredCourseWork = useMemo(() => {
    return courseWork.filter((cw) => {
      const sub = submissions[cw.id];
      const isDone = sub?.state === "TURNED_IN" || sub?.state === "RETURNED";
      if (filterScope === "pending" && isDone) return false;
      if (filterScope === "done" && !isDone) return false;
      return true;
    });
  }, [courseWork, submissions, filterScope]);

  const handleStudyWithMahr = (assignment: ClassroomCourseWork) => {
    const formatted = formatAssignmentForChalkboard(assignment);
    onStudyAssignment(assignment, formatted);
    onClose();
  };

  const handleStudyResourceWithMahr = (resource: ClassroomSavedResource) => {
    const formatted = formatResourceForChalkboard(resource);
    onStudyAssignment(resource, formatted);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[220] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-3xl max-h-[92vh] flex flex-col rounded-3xl bg-slate-950 border border-white/15 shadow-2xl overflow-hidden text-white"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg shadow-emerald-500/10">
                <GraduationCap className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    Google Classroom
                  </h2>
                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    MAHR Tutor Integrated
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  {activeCourse ? activeCourse.name : "Connect your Google Classroom"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isGoogleConnected && (
                <button
                  type="button"
                  onClick={refresh}
                  disabled={isSyncing}
                  title={lastSyncedAt ? `Last synced at ${lastSyncedAt}` : "Sync with Google Classroom"}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer disabled:opacity-50"
                >
                  <RotateCw className={`w-4 h-4 ${isSyncing ? "animate-spin text-emerald-400" : ""}`} />
                </button>
              )}

              <a
                href="https://classroom.google.com"
                target="_blank"
                rel="noopener noreferrer"
                title="Open Google Classroom Web"
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
              </a>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Autonomous Sync Notification Banner */}
          {autoSyncNotice && (
            <div className="px-4 py-2 bg-emerald-500/15 border-b border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-2 animate-in fade-in">
              <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{autoSyncNotice}</span>
            </div>
          )}

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {!isGoogleConnected ? (
              /* Disconnected View */
              <div className="py-12 px-6 text-center max-w-md mx-auto space-y-5">
                <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 shadow-xl shadow-emerald-500/20">
                  <GraduationCap className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-white">Connect Google Classroom</h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    Link your enrolled Google Classroom courses to view assignments, auto-sync tasks to Google To-Do list, save course books/files, and study with MAHR on the digital chalkboard.
                  </p>
                </div>
                <button
                  onClick={() => connectGoogle()}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-medium text-xs shadow-lg shadow-emerald-600/25 flex items-center gap-2 mx-auto cursor-pointer transition-all hover:scale-[1.02]"
                >
                  <span>Connect with Google</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : isLoading ? (
              /* Loading Courses */
              <div className="py-16 text-center space-y-3">
                <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-400 font-mono">Syncing your Google Classroom courses...</p>
              </div>
            ) : courses.length === 0 ? (
              /* No Courses */
              <div className="py-12 text-center border border-dashed border-white/10 rounded-2xl p-6 bg-slate-900/30 space-y-2">
                <BookOpen className="w-8 h-8 text-slate-500 mx-auto" />
                <h4 className="text-sm font-semibold text-slate-200 font-mono">No Active Courses Found</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Your Google account does not currently have any active enrolled classes in Google Classroom.
                </p>
              </div>
            ) : (
              /* Connected Dashboard */
              <>
                {/* Course Switcher Pills */}
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
                  {courses.map((course) => {
                    const isSelected = course.id === activeCourseId;
                    return (
                      <button
                        key={course.id}
                        onClick={() => selectCourse(course.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                          isSelected
                            ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30 font-semibold"
                            : "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-white/10"
                        }`}
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[140px]">{course.name}</span>
                        {course.section && (
                          <span className="text-[10px] opacity-75 font-mono">({course.section})</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Main Tabs (Assignments vs Books/Files vs Stream) */}
                <div className="flex flex-wrap items-center justify-between border-b border-white/10 pb-2 gap-2">
                  <div className="flex items-center gap-1.5 overflow-x-auto">
                    <button
                      onClick={() => setActiveTab("assignments")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                        activeTab === "assignments"
                          ? "bg-slate-800 text-emerald-400 border border-emerald-500/30"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Assignments ({courseWork.length})</span>
                    </button>
                    <button
                      onClick={() => setActiveTab("materials")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                        activeTab === "materials"
                          ? "bg-slate-800 text-emerald-400 border border-emerald-500/30"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <Library className="w-3.5 h-3.5 text-amber-400" />
                      <span>Books & Files ({savedResources.length})</span>
                    </button>
                    <button
                      onClick={() => setActiveTab("stream")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                        activeTab === "stream"
                          ? "bg-slate-800 text-emerald-400 border border-emerald-500/30"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <Megaphone className="w-3.5 h-3.5" />
                      <span>Stream ({announcements.length})</span>
                    </button>
                  </div>

                  {activeTab === "assignments" && courseWork.length > 0 && (
                    <div className="flex items-center gap-1 text-[11px] font-mono">
                      <button
                        onClick={() => setFilterScope("all")}
                        className={`px-2 py-0.5 rounded-md ${
                          filterScope === "all" ? "bg-slate-800 text-white font-bold" : "text-slate-400"
                        }`}
                      >
                        All
                      </button>
                      <button
                        onClick={() => setFilterScope("pending")}
                        className={`px-2 py-0.5 rounded-md ${
                          filterScope === "pending" ? "bg-slate-800 text-amber-300 font-bold" : "text-slate-400"
                        }`}
                      >
                        Due
                      </button>
                      <button
                        onClick={() => setFilterScope("done")}
                        className={`px-2 py-0.5 rounded-md ${
                          filterScope === "done" ? "bg-slate-800 text-emerald-400 font-bold" : "text-slate-400"
                        }`}
                      >
                        Done
                      </button>
                    </div>
                  )}
                </div>

                {/* Tab Content */}
                {activeTab === "assignments" ? (
                  filteredCourseWork.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl p-6 bg-slate-900/30 space-y-1">
                      <BookOpen className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      <h4 className="text-sm font-semibold text-slate-300 font-mono">No assignments found</h4>
                      <p className="text-xs text-slate-400">
                        {filterScope === "all"
                          ? "No published coursework or assignments for this class."
                          : `No ${filterScope} assignments for this course.`}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredCourseWork.map((assignment) => (
                        <ClassroomAssignmentCard
                          key={assignment.id}
                          assignment={assignment}
                          submission={submissions[assignment.id]}
                          onStudyWithMahr={handleStudyWithMahr}
                        />
                      ))}
                    </div>
                  )
                ) : activeTab === "materials" ? (
                  <ClassroomMaterialsLibrary
                    resources={savedResources}
                    onStudyResourceWithMahr={handleStudyResourceWithMahr}
                  />
                ) : (
                  <ClassroomStreamFeed announcements={announcements} />
                )}
              </>
            )}
          </div>

          {/* Footer */}
          {isGoogleConnected && (
            <div className="px-5 py-3 bg-slate-950 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 font-mono">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Auto-Syncs Assignments to Google Tasks & Saves Books/Files</span>
              </span>
              <span>
                {courses.length} Enrolled {courses.length === 1 ? "Class" : "Classes"}
              </span>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
