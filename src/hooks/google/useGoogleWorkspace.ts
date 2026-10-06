import { useState, useEffect, useCallback } from "react";
import { User } from "firebase/auth";
import {
  initAuth,
  googleSignIn,
  googleSignOut,
  getAccessToken,
  getCurrentUser,
} from "../../services/auth/googleAuthService";
import {
  GoogleProductId,
  GoogleProductInfo,
  GoogleUserProfile,
} from "../../services/google/googleWorkspaceTypes";
import {
  INITIAL_PRODUCTS_STATE,
  verifyAllGoogleProducts,
} from "../../services/google/googleWorkspaceSyncService";

export interface GoogleWorkspaceState {
  user: GoogleUserProfile | null;
  rawUser: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isLoggingIn: boolean;
  isSyncing: boolean;
  error: string | null;
  products: Record<GoogleProductId, GoogleProductInfo>;
  zeroDefaultEnforced: boolean;
  signIn: () => Promise<string | null>;
  signOut: () => Promise<void>;
  getToken: () => Promise<string | null>;
  refreshSync: () => Promise<void>;
}

export function useGoogleWorkspace(): GoogleWorkspaceState {
  const [rawUser, setRawUser] = useState<User | null>(getCurrentUser());
  const [userProfile, setUserProfile] = useState<GoogleUserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Record<GoogleProductId, GoogleProductInfo>>(INITIAL_PRODUCTS_STATE);

  const syncProducts = useCallback(async (accessToken: string | null) => {
    setIsSyncing(true);
    try {
      const verified = await verifyAllGoogleProducts(accessToken);
      setProducts(verified);
    } catch (err: any) {
      console.warn("[useGoogleWorkspace] Product sync notice:", err);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const handleUserChange = useCallback(
    async (authUser: User | null, authToken: string | null) => {
      setRawUser(authUser);
      setToken(authToken);

      if (authUser && authToken) {
        setUserProfile({
          uid: authUser.uid,
          email: authUser.email || "user@google.com",
          displayName: authUser.displayName || authUser.email?.split("@")[0] || "Authenticated User",
          photoURL: authUser.photoURL || undefined,
          connectedAt: new Date().toISOString(),
        });
        await syncProducts(authToken);
      } else {
        setUserProfile(null);
        await syncProducts(null);
      }
      setIsLoading(false);
    },
    [syncProducts]
  );

  useEffect(() => {
    const unsubscribe = initAuth(
      (authUser, authToken) => {
        handleUserChange(authUser, authToken);
      },
      () => {
        handleUserChange(null, null);
      }
    );

    getAccessToken().then((t) => {
      if (t) {
        const currentUser = getCurrentUser();
        if (currentUser) {
          handleUserChange(currentUser, t);
        }
      } else {
        setIsLoading(false);
      }
    });

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [handleUserChange]);

  const signIn = useCallback(async (): Promise<string | null> => {
    setIsLoggingIn(true);
    setError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        await handleUserChange(result.user, result.accessToken);
        return result.accessToken;
      }
      return null;
    } catch (err: any) {
      const code = err?.code || "";
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        setError(null);
        return null;
      }
      const msg = err?.message || "Google Workspace authentication failed.";
      setError(msg);
      return null;
    } finally {
      setIsLoggingIn(false);
    }
  }, [handleUserChange]);

  const signOut = useCallback(async () => {
    try {
      await googleSignOut();
      await handleUserChange(null, null);
    } catch (err: any) {
      console.error("[useGoogleWorkspace] Sign out error:", err);
    }
  }, [handleUserChange]);

  const getToken = useCallback(async (): Promise<string | null> => {
    if (token) return token;
    const fresh = await getAccessToken();
    if (fresh) {
      setToken(fresh);
      return fresh;
    }
    return null;
  }, [token]);

  const refreshSync = useCallback(async () => {
    const activeToken = await getToken();
    await syncProducts(activeToken);
  }, [getToken, syncProducts]);

  return {
    user: userProfile,
    rawUser,
    token,
    isAuthenticated: !!token && !!userProfile,
    isLoading,
    isLoggingIn,
    isSyncing,
    error,
    products,
    zeroDefaultEnforced: true, // Strict industrial zero-default flag
    signIn,
    signOut,
    getToken,
    refreshSync,
  };
}
