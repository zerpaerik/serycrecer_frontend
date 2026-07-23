"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth/store";
import { useDb } from "@/lib/data/store";
import { AppShell } from "@/components/layout/app-shell";
import { LogoMark } from "@/components/brand/logo";

function Splash() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <LogoMark className="h-12 w-12 animate-pulse" />
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Cargando…
      </div>
    </div>
  );
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const session = useAuth((s) => s.session);
  const hydrated = useAuth((s) => s.hydrated);
  const loadAll = useDb((s) => s.loadAll);
  const dbReady = useDb((s) => s.hydrated);

  React.useEffect(() => {
    if (hydrated && !session) router.replace("/login");
  }, [hydrated, session, router]);

  // Carga los datos desde la API una vez hay sesión.
  React.useEffect(() => {
    if (session) void loadAll();
  }, [session, loadAll]);

  if (!hydrated || !session || !dbReady) return <Splash />;

  return <AppShell>{children}</AppShell>;
}
