"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth, useSettings } from "@/components/providers";
import { BottomNav } from "@/components/bottom-nav";
import { WelcomeGate } from "@/components/welcome-gate";
import { BrandMark } from "@/components/brand-mark";

function Splash() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <BrandMark size={64} className="animate-pulse" />
        <p className="text-sm font-medium text-ink-muted">Harga Jual Petani</p>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { ready: settingsReady, onboarded } = useSettings();
  const { ready: authReady, user } = useAuth();
  const isLogin = pathname === "/login";

  useEffect(() => {
    if (!settingsReady || !authReady || !onboarded) return;
    if (!user && !isLogin) router.replace("/login");
    if (user && isLogin) router.replace("/home");
  }, [settingsReady, authReady, onboarded, user, isLogin, router]);

  if (!settingsReady || !authReady) return <Splash />;
  if (!onboarded) return <WelcomeGate />;

  const redirecting = (!user && !isLogin) || (user && isLogin);
  if (redirecting) return <Splash />;

  return (
    <>
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
        <main
          className={
            isLogin
              ? "flex-1 px-4 py-6"
              : "flex-1 px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-4"
          }
        >
          {children}
        </main>
      </div>
      {!isLogin && <BottomNav />}
    </>
  );
}
