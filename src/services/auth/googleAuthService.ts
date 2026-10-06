import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User
} from "firebase/auth";
import firebaseConfig from "../../../firebase-applet-config.json";
import { purgeUserTenantSession } from "./userTenantIsolation";

// Initialize Firebase App instance safely (singleton pattern)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// All confirmed Google Workspace scopes across presentation, drive, docs, sheets, calendar, gmail, tasks, classroom
export const GOOGLE_WORKSPACE_SCOPES = [
  "https://www.googleapis.com/auth/presentations",
  "https://www.googleapis.com/auth/presentations.readonly",
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/spreadsheets.readonly",
  "https://www.googleapis.com/auth/documents",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/tasks",
  "https://www.googleapis.com/auth/classroom.courses.readonly",
  "https://www.googleapis.com/auth/classroom.coursework.me",
  "https://www.googleapis.com/auth/classroom.coursework.me.readonly",
  "https://www.googleapis.com/auth/classroom.announcements.readonly",
  "https://www.googleapis.com/auth/classroom.courseworkmaterials.readonly",
  "https://www.googleapis.com/auth/classroom.rosters.readonly",
  "https://www.googleapis.com/auth/classroom.student-submissions.me.readonly"
];

// Configure Google Auth Provider with requested Google Workspace scopes
const provider = new GoogleAuthProvider();
GOOGLE_WORKSPACE_SCOPES.forEach((scope) => provider.addScope(scope));
// Allow any user to select their account dynamically
provider.setCustomParameters({
  prompt: "select_account"
});

// In-memory access token cache per Google Workspace security guidelines
// (Never stored in localStorage or sessionStorage)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export interface GoogleAuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

/**
 * Initialize auth listener on application load.
 */
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // User logged in but session token expired/needs refresh
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Trigger official Google Sign-In with popup.
 */
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);

    if (!credential?.accessToken) {
      throw new Error("Could not retrieve Google OAuth access token from authentication result.");
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    const errorCode = error?.code || "";
    // User intentionally closed or cancelled the popup or another popup was already open
    if (
      errorCode === "auth/popup-closed-by-user" ||
      errorCode === "auth/cancelled-popup-request"
    ) {
      console.info("[GoogleAuth] Sign-in popup cancelled or closed by user.");
      return null;
    }
    console.error("[GoogleAuth] Sign-in error:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Returns currently cached Google access token in memory.
 */
export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

/**
 * Sign out user and clear in-memory tokens.
 */
export const googleSignOut = async (): Promise<void> => {
  const currentUid = auth.currentUser?.uid;
  try {
    await signOut(auth);
  } finally {
    cachedAccessToken = null;
    purgeUserTenantSession(currentUid);
  }
};

/**
 * Returns current authenticated Firebase user if any.
 */
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};
