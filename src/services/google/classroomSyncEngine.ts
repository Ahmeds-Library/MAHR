import {
  ClassroomCourse,
  ClassroomCourseWork,
  ClassroomAnnouncement,
  ClassroomMaterialItem,
} from "./googleClassroomClient";
import {
  createUserTask,
  listUserTasks,
} from "./googleTasksClient";
import { getTenantScopedKey, loadTenantItem, saveTenantItem } from "../auth/userTenantIsolation";

export interface ClassroomSavedResource {
  id: string;
  courseId: string;
  courseName: string;
  title: string;
  type: "drive_file" | "book_pdf" | "youtube_lecture" | "web_link" | "quiz_form";
  url: string;
  thumbnailUrl?: string;
  parentAssignmentTitle?: string;
  addedAt: string;
}

/**
 * Autonomous Classroom -> Google Tasks Sync Engine
 * Checks Classroom assignments and creates corresponding To-Dos in Google Tasks
 * if they haven't been synced yet.
 */
export async function syncClassroomAssignmentsToGoogleTasks(
  accessToken: string,
  uid: string,
  courses: ClassroomCourse[],
  courseWorkList: ClassroomCourseWork[],
  targetListId: string = "@default"
): Promise<{ newTasksCreated: number; taskTitles: string[] }> {
  if (!accessToken || !uid || courseWorkList.length === 0) {
    return { newTasksCreated: 0, taskTitles: [] };
  }

  // Load set of already synced assignment IDs for this user
  const syncedKey = getTenantScopedKey(uid, "synced_classroom_assignment_ids");
  const alreadySyncedIds: string[] = loadTenantItem<string[]>(uid, "synced_classroom_assignment_ids", []);
  const syncedSet = new Set<string>(alreadySyncedIds);

  // Fetch current Google Tasks to avoid duplicate titles
  let existingTaskTitles = new Set<string>();
  try {
    const existingTasks = await listUserTasks(accessToken, targetListId, 100, true);
    existingTaskTitles = new Set(existingTasks.map((t) => t.title.toLowerCase().trim()));
  } catch (err) {
    console.warn("[ClassroomSyncEngine] Could not pre-fetch Google Tasks, relying on synced IDs:", err);
  }

  let newTasksCreated = 0;
  const createdTitles: string[] = [];

  for (const cw of courseWorkList) {
    // If already recorded as synced, skip
    if (syncedSet.has(cw.id)) continue;

    const course = courses.find((c) => c.id === cw.courseId);
    const coursePrefix = course?.name ? `[${course.name}] ` : "[Classroom] ";
    const taskTitle = `${coursePrefix}${cw.title}`;

    // Skip if an existing task in Google Tasks already has this exact title
    if (existingTaskTitles.has(taskTitle.toLowerCase().trim())) {
      syncedSet.add(cw.id);
      continue;
    }

    // Format RFC 3339 due date
    let dueIso: string | undefined = undefined;
    if (cw.dueDate) {
      const year = cw.dueDate.year;
      const month = String(cw.dueDate.month).padStart(2, "0");
      const day = String(cw.dueDate.day).padStart(2, "0");
      const hour = cw.dueTime?.hours !== undefined ? String(cw.dueTime.hours).padStart(2, "0") : "23";
      const minute = cw.dueTime?.minutes !== undefined ? String(cw.dueTime.minutes).padStart(2, "0") : "59";
      dueIso = `${year}-${month}-${day}T${hour}:${minute}:00.000Z`;
    }

    const notes = [
      `Course: ${course?.name || "Google Classroom"}`,
      cw.description ? `Instructions: ${cw.description.slice(0, 300)}` : "",
      cw.maxPoints ? `Points: ${cw.maxPoints}` : "",
      cw.alternateLink ? `Classroom Link: ${cw.alternateLink}` : "",
      `Created autonomously by MAHR Classroom Sync`,
    ]
      .filter(Boolean)
      .join("\n");

    try {
      await createUserTask(accessToken, taskTitle, notes, dueIso, targetListId);
      syncedSet.add(cw.id);
      newTasksCreated++;
      createdTitles.push(taskTitle);
    } catch (createErr) {
      console.error(`[ClassroomSyncEngine] Failed to create Google Task for ${cw.title}:`, createErr);
    }
  }

  // Persist synced IDs
  if (newTasksCreated > 0 || syncedSet.size !== alreadySyncedIds.length) {
    saveTenantItem(uid, "synced_classroom_assignment_ids", Array.from(syncedSet));
  }

  return { newTasksCreated, taskTitles: createdTitles };
}

/**
 * Extracts and categorizes all books, PDFs, Drive files, and video lectures
 * from Classroom CourseWork and Announcements into a unified resource library.
 */
export function extractClassroomResources(
  courses: ClassroomCourse[],
  courseWorkList: ClassroomCourseWork[],
  announcements: ClassroomAnnouncement[]
): ClassroomSavedResource[] {
  const resources: ClassroomSavedResource[] = [];
  const seenUrls = new Set<string>();

  const courseMap = new Map<string, string>();
  courses.forEach((c) => courseMap.set(c.id, c.name));

  const addResource = (
    courseId: string,
    parentTitle: string,
    material: ClassroomMaterialItem,
    dateAdded?: string
  ) => {
    const courseName = courseMap.get(courseId) || "Google Classroom";

    // 1. Google Drive File or Book PDF
    if (material.driveFile?.driveFile) {
      const df = material.driveFile.driveFile;
      if (!seenUrls.has(df.alternateLink)) {
        seenUrls.add(df.alternateLink);
        const isPdfOrBook = df.title.toLowerCase().endsWith(".pdf") || df.title.toLowerCase().includes("book") || df.title.toLowerCase().includes("textbook");
        resources.push({
          id: df.id,
          courseId,
          courseName,
          title: df.title,
          type: isPdfOrBook ? "book_pdf" : "drive_file",
          url: df.alternateLink,
          thumbnailUrl: df.thumbnailUrl,
          parentAssignmentTitle: parentTitle,
          addedAt: dateAdded || new Date().toISOString(),
        });
      }
    }

    // 2. YouTube Lecture / Video
    if (material.youtubeVideo) {
      const yv = material.youtubeVideo;
      if (!seenUrls.has(yv.alternateLink)) {
        seenUrls.add(yv.alternateLink);
        resources.push({
          id: yv.id,
          courseId,
          courseName,
          title: yv.title,
          type: "youtube_lecture",
          url: yv.alternateLink,
          thumbnailUrl: yv.thumbnailUrl,
          parentAssignmentTitle: parentTitle,
          addedAt: dateAdded || new Date().toISOString(),
        });
      }
    }

    // 3. Web Link / Reading
    if (material.link) {
      const l = material.link;
      if (!seenUrls.has(l.url)) {
        seenUrls.add(l.url);
        resources.push({
          id: l.url,
          courseId,
          courseName,
          title: l.title || l.url,
          type: "web_link",
          url: l.url,
          thumbnailUrl: l.thumbnailUrl,
          parentAssignmentTitle: parentTitle,
          addedAt: dateAdded || new Date().toISOString(),
        });
      }
    }

    // 4. Form / Quiz
    if (material.form) {
      const f = material.form;
      if (!seenUrls.has(f.formUrl)) {
        seenUrls.add(f.formUrl);
        resources.push({
          id: f.formUrl,
          courseId,
          courseName,
          title: f.title || "Classroom Quiz/Form",
          type: "quiz_form",
          url: f.formUrl,
          thumbnailUrl: f.thumbnailUrl,
          parentAssignmentTitle: parentTitle,
          addedAt: dateAdded || new Date().toISOString(),
        });
      }
    }
  };

  // Extract from CourseWork assignments
  courseWorkList.forEach((cw) => {
    if (cw.materials) {
      cw.materials.forEach((mat) => addResource(cw.courseId, cw.title, mat, cw.creationTime));
    }
  });

  // Extract from Stream Announcements
  announcements.forEach((ann) => {
    if (ann.materials) {
      ann.materials.forEach((mat) => addResource(ann.courseId, "Class Announcement", mat, ann.creationTime));
    }
  });

  return resources;
}

export interface ResourceSyncResult {
  totalResources: number;
  newResourcesSaved: number;
  newResourceTitles: string[];
  resources: ClassroomSavedResource[];
}

/**
 * Autonomously categorizes and persists newly discovered books, PDFs, and files
 * into the user's tenant-isolated MAHR Study Library.
 */
export function syncClassroomResourcesToStudyLibrary(
  uid: string,
  courses: ClassroomCourse[],
  courseWorkList: ClassroomCourseWork[],
  announcements: ClassroomAnnouncement[]
): ResourceSyncResult {
  const currentExtracted = extractClassroomResources(courses, courseWorkList, announcements);
  if (!uid) {
    return {
      totalResources: currentExtracted.length,
      newResourcesSaved: 0,
      newResourceTitles: [],
      resources: currentExtracted,
    };
  }

  const savedResourceIds: string[] = loadTenantItem<string[]>(uid, "synced_classroom_resource_ids", []);
  const seenIdSet = new Set<string>(savedResourceIds);

  const newlySavedTitles: string[] = [];
  currentExtracted.forEach((res) => {
    if (!seenIdSet.has(res.id)) {
      seenIdSet.add(res.id);
      newlySavedTitles.push(res.title);
    }
  });

  if (newlySavedTitles.length > 0 || savedResourceIds.length === 0) {
    saveTenantItem(uid, "synced_classroom_resource_ids", Array.from(seenIdSet));
    saveTenantItem(uid, "synced_classroom_library_resources", currentExtracted);
  }

  return {
    totalResources: currentExtracted.length,
    newResourcesSaved: newlySavedTitles.length,
    newResourceTitles: newlySavedTitles,
    resources: currentExtracted,
  };
}

/**
 * Loads cached classroom library resources for offline or quick display
 */
export function getSavedClassroomLibraryResources(uid: string): ClassroomSavedResource[] {
  if (!uid) return [];
  return loadTenantItem<ClassroomSavedResource[]>(uid, "synced_classroom_library_resources", []);
}
