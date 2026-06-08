"use client";

import { ThemeProvider } from "next-themes";
import { Provider, useDispatch } from "react-redux";
import { store } from "@/store";
import { useEffect } from "react";
import { setUser, clearUser } from "@/features/auth/authSlice";
import { getSession, onAuthStateChange } from "@/features/auth/authService";

function AuthListener({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();

  useEffect(() => {
    let mounted = true;
    getSession().then((session) => {
      if (!mounted) return;
      const user = session?.user ?? null;
      if (user) {
        dispatch(
          setUser({ id: user.id, email: user.email ?? null, full_name: user.user_metadata?.full_name ?? null, avatar_url: user.user_metadata?.avatar_url ?? null })
        );
      }
    });

    const { data: sub } = onAuthStateChange((event, session) => {
      const user = session?.user ?? null;
      if (user) {
        dispatch(
          setUser({ id: user.id, email: user.email ?? null, full_name: user.user_metadata?.full_name ?? null, avatar_url: user.user_metadata?.avatar_url ?? null })
        );
      } else {
        dispatch(clearUser());
      }
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, [dispatch]);

  return <>{children}</>;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <AuthListener>{children}</AuthListener>
      </ThemeProvider>
    </Provider>
  );
}
