import { useState, useEffect, useCallback } from "react";
import { User } from "firebase/auth";
import {
  initAuth,
  googleSignIn,
  googleSignOut,
  getAccessToken,
  getCurrentUser
} from "../../services/auth/googleAuthService";

export interface GoogleSlidesAuthHook {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isLoggingIn: boolean;
  error: string | null;
  signIn: () => Promise<string | null>;
  signOut: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

export function useGoogleSlidesAuth(): GoogleSlidesAuthHook {
  const [user, setUser] = useState<User | null>(getCurrentUser());
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = initAuth(
      (authUser, authToken) => {
        setUser(authUser);
        setToken(authToken);
        setIsLoading(false);
      },
      () => {
        setUser(null);
        setToken(null);
        setIsLoading(false);
      }
    );

    // Initial check
    getAccessToken().then((t) => {
      if (t) setToken(t);
      setIsLoading(false);
    });

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (): Promise<string | null> => {
    setIsLoggingIn(true);
    setError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        return result.accessToken;
      }
      return null;
    } catch (err: any) {
      const code = err?.code || "";
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        setError(null);
        return null;
      }
      const msg = err?.message || "Google Authentication failed.";
      setError(msg);
      console.error("[useGoogleSlidesAuth] Error:", err);
      return null;
    } finally {
      setIsLoggingIn(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await googleSignOut();
      setUser(null);
      setToken(null);
    } catch (err: any) {
      console.error("[useGoogleSlidesAuth] Sign out error:", err);
    }
  }, []);

  const getToken = useCallback(async (): Promise<string | null> => {
    if (token) return token;
    const freshToken = await getAccessToken();
    if (freshToken) setToken(freshToken);
    return freshToken;
  }, [token]);

  return {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    isLoggingIn,
    error,
    signIn,
    signOut,
    getToken
  };
}
