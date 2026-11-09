/**
 * Layer 2: useClassroomBackgroundSync Hook
 * Autonomous Root-Level Background Engine for Google Classroom.
 *
 * Runs continuously in App.tsx (whether Classroom modal is open or closed):
 * 1. Scans courses every 3.5 minutes for newly posted assignments.
 * 2. Autonomously converts assignments into Google Tasks To-Dos.
 * 3. Autonomously extracts and saves textbooks, PDFs, and lecture materials.
 * 4. Delivers MAHR proactive voice notifications and UI alerts.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useGoogleWorkspace } from "./useGoogleWorkspace";
import {
  ClassroomCourse,
  ClassroomCourseWork,
  ClassroomAnnouncement,
  listClassroomCourses,
  listClassroomCourseWork,
  listClassroomAnnouncements,
} from "../../services/google/googleClassroomClient";
import {
  ClassroomSavedResource,
  syncClassroomAssignmentsToGoogleTasks,
  syncClassroomResourcesToStudyLibrary,
  getSavedClassroomLibraryResources,
} from "../../services/google/classroomSyncEngine";
import { speakUtterance } from "../../services/speechSynthesisService";

export interface ClassroomSyncNotice {
  id: string;
  type: "tasks" | "resources" | "info";
  message: string;
  details?: string[];
  timestamp: number;
}

export interface UseClassroomBackgroundSyncReturn {
  isBackgroundSyncing: boolean;
  lastSyncedAt: string | null;
  lastSyncNotice: ClassroomSyncNotice | null;
  allSavedResources: ClassroomSavedResource[];
  triggerBackgroundSync: () => Promise<void>;
  dismissNotice: () => void;
}

export function useClassroomBackgroundSync(options?: {
  pollIntervalMs?: number;
  enableVoiceAnnouncements?: boolean;
}): UseClassroomBackgroundSyncReturn {
  const {
    pollIntervalMs = 3.5 * 60 * 1000, // 3.5 minutes default polling
    enableVoiceAnnouncements = true,
  } = options || {};

  const { user, token, isAuthenticated } = useGoogleWorkspace();

  const [isBackgroundSyncing, setIsBackgroundSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [lastSyncNotice, setLastSyncNotice] = useState<ClassroomSyncNotice | null>(null);
  const [allSavedResources, setAllSavedResources] = useState<ClassroomSavedResource[]>([]);

  const isSyncRunningRef = useRef<boolean>(false);
  const hasInitialRanRef = useRef<boolean>(false);

  // Load existing cached library resources on user change
  useEffect(() => {
    if (user?.uid) {
      const cached = getSavedClassroomLibraryResources(user.uid);
      setAllSavedResources(cached);
    } else {
      setAllSavedResources([]);
    }
  }, [user?.uid]);

  /**
   * Main autonomous execution cycle
   */
  const executeSync = useCallback(
    async (isManual: boolean = false) => {
      if (!token || !user?.uid || isSyncRunningRef.current) return;

      isSyncRunningRef.current = true;
      setIsBackgroundSyncing(true);

      try {
        // 1. Fetch active enrolled courses
        const courses = await listClassroomCourses(token);
        if (!courses || courses.length === 0) {
          setIsBackgroundSyncing(false);
          isSyncRunningRef.current = false;
          return;
        }

        let totalNewTasksCreated = 0;
        const allCreatedTaskTitles: string[] = [];
        let allAccumulatedCw: ClassroomCourseWork[] = [];
        let allAccumulatedAnn: ClassroomAnnouncement[] = [];

        // 2. Fetch coursework and announcements across courses
        for (const course of courses) {
          try {
            const [cwList, annList] = await Promise.all([
              listClassroomCourseWork(token, course.id).catch(() => [] as ClassroomCourseWork[]),
              listClassroomAnnouncements(token, course.id).catch(() => [] as ClassroomAnnouncement[]),
            ]);

            allAccumulatedCw = allAccumulatedCw.concat(cwList);
            allAccumulatedAnn = allAccumulatedAnn.concat(annList);

            // Sync assignments into Google Tasks
            if (cwList.length > 0) {
              const taskResult = await syncClassroomAssignmentsToGoogleTasks(
                token,
                user.uid,
                [course],
                cwList
              );

              if (taskResult.newTasksCreated > 0) {
                totalNewTasksCreated += taskResult.newTasksCreated;
                allCreatedTaskTitles.push(...taskResult.taskTitles);
              }
            }
          } catch (courseErr) {
            console.warn(`[ClassroomBackgroundSync] Course ${course.name} sync note:`, courseErr);
          }
        }

        // 3. Extract and save all books, PDFs, and learning materials
        const resourceResult = syncClassroomResourcesToStudyLibrary(
          user.uid,
          courses,
          allAccumulatedCw,
          allAccumulatedAnn
        );

        setAllSavedResources(resourceResult.resources);

        // 4. Handle notifications & voice feedback
        const nowTimeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        setLastSyncedAt(nowTimeStr);

        // If new tasks were created
        if (totalNewTasksCreated > 0) {
          window.dispatchEvent(new CustomEvent("refresh-google-tasks"));

          const notice: ClassroomSyncNotice = {
            id: `notice_${Date.now()}`,
            type: "tasks",
            message: `⚡ Google Classroom: ${totalNewTasksCreated} naye assignment(s) Google Tasks mein To-Do ban chuke hain!`,
            details: allCreatedTaskTitles,
            timestamp: Date.now(),
          };
          setLastSyncNotice(notice);

          if (enableVoiceAnnouncements) {
            const voiceText =
              totalNewTasksCreated === 1
                ? `Classroom mein naya assignment aaya hai. Maine aap ke Google Tasks mein is ka To-Do create kar diya hai.`
                : `Classroom mein ${totalNewTasksCreated} naye assignments aaye hain. Maine aap ke Google Tasks mein in ke To-Dos create kar diye hain.`;
            speakUtterance({ text: voiceText });
          }
        }

        // If new books or materials were saved
        if (resourceResult.newResourcesSaved > 0) {
          const notice: ClassroomSyncNotice = {
            id: `notice_res_${Date.now()}`,
            type: "resources",
            message: `📚 ${resourceResult.newResourcesSaved} nayi books aur study materials Classroom se aap ki Library mein save ho gaye hain!`,
            details: resourceResult.newResourceTitles,
            timestamp: Date.now(),
          };
          setLastSyncNotice(notice);

          if (enableVoiceAnnouncements && totalNewTasksCreated === 0) {
            const voiceText = `${resourceResult.newResourcesSaved} nayi books aur course materials Classroom se aap ki study library mein save ho chuki hain.`;
            speakUtterance({ text: voiceText });
          }
        }

        if (isManual && totalNewTasksCreated === 0 && resourceResult.newResourcesSaved === 0) {
          const notice: ClassroomSyncNotice = {
            id: `notice_info_${Date.now()}`,
            type: "info",
            message: `Classroom aur Google Tasks 100% up-to-date hain. Koi naya assignment pending nahi hai.`,
            timestamp: Date.now(),
          };
          setLastSyncNotice(notice);
          if (enableVoiceAnnouncements) {
            speakUtterance({ text: "Aap ka Google Classroom aur To-Do schedule pehle se hi up-to-date hai." });
          }
        }
      } catch (err) {
        console.warn("[ClassroomBackgroundSync] Background cycle error:", err);
      } finally {
        setIsBackgroundSyncing(false);
        isSyncRunningRef.current = false;
      }
    },
    [token, user?.uid, enableVoiceAnnouncements]
  );

  // Background polling timer
  useEffect(() => {
    if (!isAuthenticated || !token || !user?.uid) return;

    // Initial check after brief delay
    const initialTimer = setTimeout(() => {
      if (!hasInitialRanRef.current) {
        hasInitialRanRef.current = true;
        executeSync(false);
      }
    }, 4000);

    // Periodic background intervals
    const intervalTimer = setInterval(() => {
      executeSync(false);
    }, pollIntervalMs);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalTimer);
    };
  }, [isAuthenticated, token, user?.uid, pollIntervalMs, executeSync]);

  const dismissNotice = useCallback(() => {
    setLastSyncNotice(null);
  }, []);

  return {
    isBackgroundSyncing,
    lastSyncedAt,
    lastSyncNotice,
    allSavedResources,
    triggerBackgroundSync: () => executeSync(true),
    dismissNotice,
  };
}
