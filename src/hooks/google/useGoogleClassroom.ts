import { useState, useEffect, useCallback, useRef } from "react";
import {
  ClassroomCourse,
  ClassroomCourseWork,
  ClassroomAnnouncement,
  ClassroomStudentSubmission,
  listClassroomCourses,
  listClassroomCourseWork,
  listClassroomAnnouncements,
  listStudentSubmissions,
} from "../../services/google/googleClassroomClient";
import {
  ClassroomSavedResource,
  syncClassroomAssignmentsToGoogleTasks,
  extractClassroomResources,
} from "../../services/google/classroomSyncEngine";
import { useGoogleWorkspace } from "./useGoogleWorkspace";

export interface GoogleClassroomState {
  courses: ClassroomCourse[];
  activeCourseId: string | null;
  activeCourse: ClassroomCourse | null;
  courseWork: ClassroomCourseWork[];
  announcements: ClassroomAnnouncement[];
  submissions: Record<string, ClassroomStudentSubmission>;
  savedResources: ClassroomSavedResource[];
  isGoogleConnected: boolean;
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;
  lastSyncedAt: string | null;
  autoSyncNotice: string | null;
  selectCourse: (courseId: string) => Promise<void>;
  refresh: () => Promise<void>;
  connectGoogle: () => Promise<string | null>;
  formatAssignmentForChalkboard: (assignment: ClassroomCourseWork) => string;
  formatResourceForChalkboard: (resource: ClassroomSavedResource) => string;
}

export function useGoogleClassroom(): GoogleClassroomState {
  const { user, token, isAuthenticated, signIn } = useGoogleWorkspace();

  const [courses, setCourses] = useState<ClassroomCourse[]>([]);
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [courseWork, setCourseWork] = useState<ClassroomCourseWork[]>([]);
  const [announcements, setAnnouncements] = useState<ClassroomAnnouncement[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, ClassroomStudentSubmission>>({});
  const [savedResources, setSavedResources] = useState<ClassroomSavedResource[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [autoSyncNotice, setAutoSyncNotice] = useState<string | null>(null);

  const lastLoadedSessionRef = useRef<string | null>(null);

  /**
   * Load CourseWork, Announcements, and Submissions for a selected course
   */
  const loadCourseDetails = useCallback(
    async (accessToken: string, courseId: string, currentCourses: ClassroomCourse[] = courses) => {
      setIsSyncing(true);
      setError(null);
      try {
        const [cwData, annData, subsData] = await Promise.allSettled([
          listClassroomCourseWork(accessToken, courseId),
          listClassroomAnnouncements(accessToken, courseId),
          listStudentSubmissions(accessToken, courseId),
        ]);

        let loadedCw: ClassroomCourseWork[] = [];
        let loadedAnn: ClassroomAnnouncement[] = [];

        if (cwData.status === "fulfilled") {
          loadedCw = cwData.value;
          setCourseWork(loadedCw);
        } else {
          console.warn("[useGoogleClassroom] Coursework load error:", cwData.reason);
        }

        if (annData.status === "fulfilled") {
          loadedAnn = annData.value;
          setAnnouncements(loadedAnn);
        } else {
          console.warn("[useGoogleClassroom] Announcements load error:", annData.reason);
        }

        if (subsData.status === "fulfilled") {
          const subMap: Record<string, ClassroomStudentSubmission> = {};
          subsData.value.forEach((s) => {
            if (s.courseWorkId) subMap[s.courseWorkId] = s;
          });
          setSubmissions(subMap);
        }

        // 1. Extract and update all books, PDFs, and files
        const extracted = extractClassroomResources(currentCourses, loadedCw, loadedAnn);
        setSavedResources(extracted);

        // 2. Automatically sync new assignments into Google Tasks (To-Do List)!
        if (user?.uid && loadedCw.length > 0) {
          try {
            const syncResult = await syncClassroomAssignmentsToGoogleTasks(
              accessToken,
              user.uid,
              currentCourses,
              loadedCw
            );
            if (syncResult.newTasksCreated > 0) {
              setAutoSyncNotice(`⚡ Auto-synced ${syncResult.newTasksCreated} new Classroom assignment(s) to your Google Tasks!`);
              setTimeout(() => setAutoSyncNotice(null), 6000);
            }
          } catch (syncErr) {
            console.warn("[useGoogleClassroom] Auto-sync to Google Tasks notice:", syncErr);
          }
        }

        setLastSyncedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      } catch (err: any) {
        console.error("[useGoogleClassroom] Error loading course details:", err);
        setError("Failed to sync course assignments.");
      } finally {
        setIsSyncing(false);
      }
    },
    [courses, user?.uid]
  );

  /**
   * Load courses when user connects or switches accounts
   */
  const loadCourses = useCallback(async (accessToken: string | null) => {
    if (!accessToken) {
      setCourses([]);
      setActiveCourseId(null);
      setCourseWork([]);
      setAnnouncements([]);
      setSubmissions({});
      setSavedResources([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const activeCourses = await listClassroomCourses(accessToken);
      setCourses(activeCourses);

      if (activeCourses.length > 0) {
        const initialCourseId = activeCourses[0].id;
        setActiveCourseId(initialCourseId);
        await loadCourseDetails(accessToken, initialCourseId, activeCourses);
      } else {
        setActiveCourseId(null);
        setCourseWork([]);
        setAnnouncements([]);
        setSubmissions({});
        setSavedResources([]);
      }
      setLastSyncedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } catch (err: any) {
      console.error("[useGoogleClassroom] Error loading courses:", err);
      setError(err?.message || "Failed to load Google Classroom courses.");
    } finally {
      setIsLoading(false);
    }
  }, [loadCourseDetails]);

  // Auth watcher
  useEffect(() => {
    const currentUid = user?.uid || null;
    const currentToken = token || null;
    const sessionKey = `${currentUid || "unauth"}_${currentToken ? "active" : "none"}`;

    if (sessionKey !== lastLoadedSessionRef.current) {
      lastLoadedSessionRef.current = sessionKey;
      if (currentUid && currentToken) {
        loadCourses(currentToken);
      } else {
        setCourses([]);
        setActiveCourseId(null);
        setCourseWork([]);
        setAnnouncements([]);
        setSubmissions({});
        setSavedResources([]);
      }
    }
  }, [user, token, loadCourses]);

  /**
   * Switch active course
   */
  const selectCourse = useCallback(
    async (courseId: string) => {
      setActiveCourseId(courseId);
      if (token) {
        await loadCourseDetails(token, courseId, courses);
      }
    },
    [token, courses, loadCourseDetails]
  );

  /**
   * Manual refresh
   */
  const refresh = useCallback(async () => {
    if (token) {
      if (activeCourseId) {
        await loadCourseDetails(token, activeCourseId, courses);
      } else {
        await loadCourses(token);
      }
    }
  }, [token, activeCourseId, courses, loadCourseDetails, loadCourses]);

  /**
   * Converts a Google Classroom assignment into structured Markdown
   * designed for MAHR's digital chalkboard and Feynman learning sessions.
   */
  const formatAssignmentForChalkboard = useCallback((assignment: ClassroomCourseWork): string => {
    const dueStr = assignment.dueDate
      ? `${assignment.dueDate.year}-${String(assignment.dueDate.month).padStart(2, "0")}-${String(assignment.dueDate.day).padStart(2, "0")}`
      : "No fixed deadline";

    let md = `# 🎓 Google Classroom Assignment: ${assignment.title}\n\n`;
    md += `**Course**: ${courses.find((c) => c.id === assignment.courseId)?.name || "Current Course"}\n`;
    md += `**Deadline**: ${dueStr} | **Max Points**: ${assignment.maxPoints || "Ungraded"}\n\n`;
    md += `## 📋 Assignment Instructions\n${assignment.description || "No written description provided."}\n\n`;

    if (assignment.materials && assignment.materials.length > 0) {
      md += `## 📎 Attached Books & Resources\n`;
      assignment.materials.forEach((m) => {
        if (m.driveFile?.driveFile) {
          md += `- 📄 Drive Book/Document: [${m.driveFile.driveFile.title}](${m.driveFile.driveFile.alternateLink})\n`;
        } else if (m.youtubeVideo) {
          md += `- 🎥 Lecture Video: [${m.youtubeVideo.title}](${m.youtubeVideo.alternateLink})\n`;
        } else if (m.link) {
          md += `- 🔗 Reference Link: [${m.link.title || m.link.url}](${m.link.url})\n`;
        } else if (m.form) {
          md += `- 📝 Form/Quiz: [${m.form.title}](${m.form.formUrl})\n`;
        }
      });
      md += `\n`;
    }

    md += `## 💡 MAHR Interactive Tutoring Guide\n`;
    md += `- Let's break down this assignment using the Feynman technique step-by-step.\n`;
    md += `- Ask MAHR: "Explain step 1 of this assignment" or "Draw a diagram of the core concept on the chalkboard."\n`;

    return md;
  }, [courses]);

  /**
   * Converts a book or learning resource into a structured chalkboard study prompt
   */
  const formatResourceForChalkboard = useCallback((resource: ClassroomSavedResource): string => {
    let md = `# 📖 Course Study Material: ${resource.title}\n\n`;
    md += `**Course**: ${resource.courseName}\n`;
    md += `**Type**: ${resource.type.replace("_", " ").toUpperCase()}\n`;
    md += `**Resource Link**: [Open Resource in New Tab](${resource.url})\n\n`;
    md += `## 🧠 Interactive MAHR Study Session\n`;
    md += `- Let's study and analyze this course book/material together!\n`;
    md += `- You can ask MAHR:\n`;
    md += `  1. "Summarize the key takeaways of this material."\n`;
    md += `  2. "Create 5 practice quiz questions based on this topic."\n`;
    md += `  3. "Explain the core formulas or algorithms mentioned in this file."\n`;
    return md;
  }, []);

  const activeCourse = courses.find((c) => c.id === activeCourseId) || null;

  return {
    courses,
    activeCourseId,
    activeCourse,
    courseWork,
    announcements,
    submissions,
    savedResources,
    isGoogleConnected: Boolean(isAuthenticated && token),
    isLoading,
    isSyncing,
    error,
    lastSyncedAt,
    autoSyncNotice,
    selectCourse,
    refresh,
    connectGoogle: signIn,
    formatAssignmentForChalkboard,
    formatResourceForChalkboard,
  };
}
