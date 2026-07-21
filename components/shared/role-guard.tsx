"use client";

import * as React from "react";
import Link from "next/link";
import { Lock } from "lucide-react";
import { useAuth } from "@/lib/auth/store";
import { getRole, type RoleId } from "@/lib/auth/roles";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/**
 * Restringe el contenido a ciertos roles. Si el rol actual no está permitido,
 * muestra un aviso de acceso restringido (útil para módulos confidenciales
 * como la historia clínica).
 */
export function RoleGuard({
  roles,
  children,
}: {
  roles: RoleId[];
  children: React.ReactNode;
}) {
  const session = useAuth((s) => s.session);
  const hydrated = useAuth((s) => s.hydrated);

  if (!hydrated) return null;

  const roleId = session?.roleId;
  if (roleId && roles.includes(roleId)) return <>{children}</>;

  const permitido = roles.map((r) => getRole(r).name).join(" y ");

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center py-16 text-center">
      <Card className="w-full p-8">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
          <Lock className="h-6 w-6 text-destructive" />
        </span>
        <h2 className="mt-5 font-heading text-xl font-bold">Acceso restringido</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Esta sección es confidencial y solo está disponible para el rol{" "}
          <span className="font-medium text-foreground">{permitido}</span>.
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link href="/dashboard">Volver al inicio</Link>
        </Button>
      </Card>
    </div>
  );
}
