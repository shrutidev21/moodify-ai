"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getSession } from "@/features/auth/authService";
import { setUser } from "@/features/auth/authSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

async function syncSessionToStore(dispatch: ReturnType<typeof useAppDispatch>) {
  const session = await getSession();
  const user = session?.user ?? null;

  if (user) {
    dispatch(
      setUser({
        id: user.id,
        email: user.email ?? null,
        full_name: user.user_metadata?.full_name ?? null,
        avatar_url: user.user_metadata?.avatar_url ?? null,
      }),
    );
    return true;
  }

  return false;
}

/** Waits for the initial auth check without redirecting. */
export function useAuthReady() {
  const dispatch = useAppDispatch();
  const userId = useAppSelector((state) => state.auth.id);
  const [ready, setReady] = useState(Boolean(userId));
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(userId));

  useEffect(() => {
    if (userId) {
      setReady(true);
      setIsAuthenticated(true);
      return;
    }

    let active = true;
    setReady(false);

    syncSessionToStore(dispatch)
      .then((authed) => {
        if (!active) return;
        setIsAuthenticated(authed);
        setReady(true);
      })
      .catch(() => {
        if (!active) return;
        setIsAuthenticated(false);
        setReady(true);
      });

    return () => {
      active = false;
    };
  }, [dispatch, userId]);

  return { ready, isAuthenticated };
}

/** Redirects unauthenticated users to the auth modal on the current route. */
export function useSessionGuard() {
  const pathname = usePathname();
  const router = useRouter();
  const { ready, isAuthenticated } = useAuthReady();

  useEffect(() => {
    if (!ready || isAuthenticated) return;

    const params = new URLSearchParams();
    params.set("auth", "signin");
    params.set("from", pathname);
    router.replace(`${pathname}?${params.toString()}`);
  }, [ready, isAuthenticated, pathname, router]);

  return ready && isAuthenticated;
}
