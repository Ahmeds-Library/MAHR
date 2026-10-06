/**
 * Google Classroom API Client (Layer 1: Data & API Client Layer)
 * Communicates directly with https://classroom.googleapis.com/v1
 */

const CLASSROOM_BASE_URL = "https://classroom.googleapis.com/v1";

export interface ClassroomMaterialItem {
  driveFile?: {
    driveFile: {
      id: string;
      title: string;
      alternateLink: string;
      thumbnailUrl?: string;
    };
    shareMode?: string;
  };
  youtubeVideo?: {
    id: string;
    title: string;
    alternateLink: string;
    thumbnailUrl?: string;
  };
  link?: {
    url: string;
    title: string;
    thumbnailUrl?: string;
  };
  form?: {
    formUrl: string;
    responseUrl?: string;
    title: string;
    thumbnailUrl?: string;
  };
}

export interface ClassroomCourse {
  id: string;
  name: string;
  section?: string;
  descriptionHeading?: string;
  description?: string;
  room?: string;
  ownerId?: string;
  creationTime?: string;
  updateTime?: string;
  enrollmentCode?: string;
  courseState?: "ACTIVE" | "ARCHIVED" | "PROVISIONED" | "DECLINED" | "SUSPENDED";
  alternateLink?: string;
  teacherGroupEmail?: string;
  courseGroupEmail?: string;
}

export interface ClassroomCourseWork {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  materials?: ClassroomMaterialItem[];
  state?: "PUBLISHED" | "DRAFT" | "DELETED";
  alternateLink?: string;
  creationTime?: string;
  updateTime?: string;
  dueDate?: {
    year: number;
    month: number;
    day: number;
  };
  dueTime?: {
    hours?: number;
    minutes?: number;
    seconds?: number;
  };
  maxPoints?: number;
  workType?: "ASSIGNMENT" | "SHORT_ANSWER_QUESTION" | "MULTIPLE_CHOICE_QUESTION";
  submissionModificationMode?: string;
  assignment?: {
    studentWorkFolder?: {
      id: string;
      title: string;
      alternateLink: string;
    };
  };
}

export interface ClassroomAnnouncement {
  id: string;
  courseId: string;
  text: string;
  materials?: ClassroomMaterialItem[];
  state?: "PUBLISHED" | "DRAFT" | "DELETED";
  alternateLink?: string;
  creationTime?: string;
  updateTime?: string;
  creatorUserId?: string;
}

export interface ClassroomStudentSubmission {
  id: string;
  courseId: string;
  courseWorkId: string;
  userId: string;
  creationTime?: string;
  updateTime?: string;
  state?: "NEW" | "CREATED" | "TURNED_IN" | "RETURNED" | "RECLAIMED_BY_STUDENT";
  late?: boolean;
  draftGrade?: number;
  assignedGrade?: number;
  alternateLink?: string;
  associatedWithDeveloper?: boolean;
}

/**
 * List all active courses for the authenticated user (as student or teacher)
 */
export async function listClassroomCourses(accessToken: string): Promise<ClassroomCourse[]> {
  if (!accessToken) {
    throw new Error("Google Classroom requires user authentication.");
  }

  const res = await fetch(`${CLASSROOM_BASE_URL}/courses?courseStates=ACTIVE`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to list Google Classroom courses (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  return (data.courses || []).map((c: any) => ({
    id: c.id,
    name: c.name || "Untitled Course",
    section: c.section,
    descriptionHeading: c.descriptionHeading,
    description: c.description,
    room: c.room,
    ownerId: c.ownerId,
    courseState: c.courseState,
    alternateLink: c.alternateLink,
    teacherGroupEmail: c.teacherGroupEmail,
  }));
}

/**
 * List all assignments & coursework for a specific course
 */
export async function listClassroomCourseWork(
  accessToken: string,
  courseId: string
): Promise<ClassroomCourseWork[]> {
  if (!accessToken) {
    throw new Error("Google Classroom requires user authentication.");
  }

  const encodedCourseId = encodeURIComponent(courseId);
  const res = await fetch(`${CLASSROOM_BASE_URL}/courses/${encodedCourseId}/courseWork?courseWorkStates=PUBLISHED`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to list coursework for course ${courseId} (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  return (data.courseWork || []).map((cw: any) => ({
    id: cw.id,
    courseId: cw.courseId,
    title: cw.title || "Untitled Assignment",
    description: cw.description,
    materials: cw.materials || [],
    state: cw.state,
    alternateLink: cw.alternateLink,
    creationTime: cw.creationTime,
    updateTime: cw.updateTime,
    dueDate: cw.dueDate,
    dueTime: cw.dueTime,
    maxPoints: cw.maxPoints,
    workType: cw.workType || "ASSIGNMENT",
  }));
}

/**
 * List announcements for a specific course
 */
export async function listClassroomAnnouncements(
  accessToken: string,
  courseId: string
): Promise<ClassroomAnnouncement[]> {
  if (!accessToken) {
    throw new Error("Google Classroom requires user authentication.");
  }

  const encodedCourseId = encodeURIComponent(courseId);
  const res = await fetch(`${CLASSROOM_BASE_URL}/courses/${encodedCourseId}/announcements?announcementStates=PUBLISHED`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to list announcements for course ${courseId} (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  return (data.announcements || []).map((a: any) => ({
    id: a.id,
    courseId: a.courseId,
    text: a.text || "",
    materials: a.materials || [],
    state: a.state,
    alternateLink: a.alternateLink,
    creationTime: a.creationTime,
    updateTime: a.updateTime,
  }));
}

/**
 * List user's submissions for a coursework item or course
 */
export async function listStudentSubmissions(
  accessToken: string,
  courseId: string,
  courseWorkId: string = "-"
): Promise<ClassroomStudentSubmission[]> {
  if (!accessToken) {
    throw new Error("Google Classroom requires user authentication.");
  }

  const encodedCourseId = encodeURIComponent(courseId);
  const encodedCourseWorkId = encodeURIComponent(courseWorkId);
  const res = await fetch(
    `${CLASSROOM_BASE_URL}/courses/${encodedCourseId}/courseWork/${encodedCourseWorkId}/studentSubmissions?userId=me`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to list submissions (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  return (data.studentSubmissions || []).map((s: any) => ({
    id: s.id,
    courseId: s.courseId,
    courseWorkId: s.courseWorkId,
    userId: s.userId,
    state: s.state,
    late: s.late,
    draftGrade: s.draftGrade,
    assignedGrade: s.assignedGrade,
    alternateLink: s.alternateLink,
  }));
}
