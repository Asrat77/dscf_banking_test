"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAccessToken } from "@/lib/auth";

type AuthGuardOptions = {
  requireAuth: boolean;
  redirectTo?: string;
  redirectIfAuthed?: string;
};

type AuthState = {
  isAuthReady: boolean;
  isAuthenticated: boolean;
};

export function useAuthGuard(options: AuthGuardOptions) {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>({
    isAuthReady: false,
    isAuthenticated: false,
  });

  const evaluateAuth = useCallback(() => {
    const token = getAccessToken();

    if (token) {
      setAuthState({ isAuthReady: true, isAuthenticated: true });
      if (!options.requireAuth && options.redirectIfAuthed) {
        router.replace(options.redirectIfAuthed);
      }
      return;
    }

    setAuthState({ isAuthReady: true, isAuthenticated: false });
    if (options.requireAuth) {
      router.replace(options.redirectTo || "/login");
    }
  }, [options.redirectIfAuthed, options.redirectTo, options.requireAuth, router]);

  useEffect(() => {
    evaluateAuth();
  }, [evaluateAuth]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key === "accessToken") {
        evaluateAuth();
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        evaluateAuth();
      }
    };

    window.addEventListener("storage", handleStorage);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("storage", handleStorage);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [evaluateAuth]);

  return {
    ...authState,
    refreshAuth: evaluateAuth,
  };
}
