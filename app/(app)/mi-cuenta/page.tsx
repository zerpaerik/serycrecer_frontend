"use client";

import * as React from "react";
import { toast } from "sonner";
import { IdCard, KeyRound } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth/store";
import { getRole } from "@/lib/auth/roles";

export default function MiCuentaPage() {
  const session = useAuth((s) => s.session);
  const refreshPerfil = useAuth((s) => s.refreshPerfil);
  const updatePerfil = useAuth((s) => s.updatePerfil);
  const changePassword = useAuth((s) => s.changePassword);

  const esPsicologo = !!session?.user.psicologoId || session?.roleId === 2;

  const [nombre, setNombre] = React.useState(session?.user.name ?? "");
  const [licencia, setLicencia] = React.useState(session?.user.licencia ?? "");
  const [guardandoPerfil, setGuardandoPerfil] = React.useState(false);

  const [actual, setActual] = React.useState("");
  const [nueva, setNueva] = React.useState("");
  const [confirma, setConfirma] = React.useState("");
  const [guardandoPass, setGuardandoPass] = React.useState(false);

  // Trae la licencia real del backend al entrar.
  React.useEffect(() => {
    let activo = true;
    refreshPerfil()
      .then((u) => {
        if (!activo || !u) return;
        setNombre(u.name);
        setLicencia(u.licencia ?? "");
      })
      .catch(() => {});
    return () => { activo = false; };
  }, [refreshPerfil]);

  async function guardarPerfil() {
    setGuardandoPerfil(true);
    try {
      await updatePerfil({ nombre, ...(esPsicologo ? { licencia } : {}) });
      toast.success("Perfil actualizado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo actualizar");
    } finally {
      setGuardandoPerfil(false);
    }
  }

  async function guardarPassword() {
    if (nueva.length < 6) return toast.error("La nueva contraseña debe tener al menos 6 caracteres");
    if (nueva !== confirma) return toast.error("La confirmación no coincide");
    setGuardandoPass(true);
    try {
      await changePassword(actual, nueva);
      toast.success("Contraseña actualizada");
      setActual(""); setNueva(""); setConfirma("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo cambiar la contraseña");
    } finally {
      setGuardandoPass(false);
    }
  }

  if (!session) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Mi cuenta"
        description={`${session.user.email} · ${getRole(session.roleId).name}`}
      />

      {/* Datos del perfil */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <IdCard className="h-4 w-4 text-brand" /> Datos del perfil
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="mb-1.5 block">Nombre</Label>
            <Input value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>
          {esPsicologo && (
            <div>
              <Label className="mb-1.5 block">Número de licencia / colegiatura</Label>
              <Input
                value={licencia}
                onChange={(e) => setLicencia(e.target.value)}
                placeholder="Ej. C.Ps.P. 12345"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Aparecerá en las historias clínicas impresas que registres.
              </p>
            </div>
          )}
          <div className="flex justify-end">
            <Button className="bg-brand-gradient text-white" onClick={guardarPerfil} disabled={guardandoPerfil}>
              {guardandoPerfil ? "Guardando…" : "Guardar cambios"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cambiar contraseña */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="h-4 w-4 text-brand" /> Cambiar contraseña
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="mb-1.5 block">Contraseña actual</Label>
            <Input type="password" value={actual} onChange={(e) => setActual(e.target.value)} autoComplete="current-password" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="mb-1.5 block">Nueva contraseña</Label>
              <Input type="password" value={nueva} onChange={(e) => setNueva(e.target.value)} autoComplete="new-password" />
            </div>
            <div>
              <Label className="mb-1.5 block">Confirmar nueva</Label>
              <Input type="password" value={confirma} onChange={(e) => setConfirma(e.target.value)} autoComplete="new-password" />
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={guardarPassword}
              disabled={guardandoPass || !actual || !nueva || !confirma}
            >
              {guardandoPass ? "Actualizando…" : "Actualizar contraseña"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
