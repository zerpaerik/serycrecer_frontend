"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { ChevronRight, ShieldCheck } from "lucide-react";

import { RoleGuard } from "@/components/shared/role-guard";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useDb } from "@/lib/data/store";
import { useDbReady } from "@/lib/data/hooks";
import { calcAge, formatDate, initials } from "@/lib/format";

type Row = {
  id: string;
  _nombre: string;
  numDoc: string;
  edad: number;
  sexo: string;
  tieneHistoria: boolean;
  nEvoluciones: number;
  ultima?: string;
};

function HistoriaClinicaInner() {
  const router = useRouter();
  const ready = useDbReady();
  const pacientes = useDb((s) => s.pacientes);
  const evaluaciones = useDb((s) => s.evaluaciones);
  const evoluciones = useDb((s) => s.evoluciones);

  const data: Row[] = React.useMemo(
    () =>
      pacientes.map((p) => {
        const evos = evoluciones.filter((e) => e.pacienteId === p.id);
        const ultima = evos
          .map((e) => e.fecha)
          .sort()
          .at(-1);
        const evalPac = evaluaciones.find((e) => e.pacienteId === p.id);
        const abierta =
          !!evalPac &&
          (Object.keys(evalPac.respuestas).length > 0 || evalPac.objetivos.length > 0);
        return {
          id: p.id,
          _nombre: `${p.nombres} ${p.apellidos}`,
          numDoc: p.numDoc,
          edad: calcAge(p.fechaNacimiento),
          sexo: p.sexo,
          tieneHistoria: abierta || evos.length > 0,
          nEvoluciones: evos.length,
          ultima,
        };
      }),
    [pacientes, evaluaciones, evoluciones],
  );

  const columns: ColumnDef<Row, unknown>[] = React.useMemo(
    () => [
      {
        accessorKey: "_nombre",
        header: "Paciente",
        cell: ({ row }) => {
          const p = row.original;
          return (
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-brand/10 text-xs font-semibold text-brand">
                  {initials(p._nombre)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate font-medium">{p._nombre}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {p.edad} años · {p.sexo}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "tieneHistoria",
        header: "Historia",
        cell: ({ row }) =>
          row.original.tieneHistoria ? (
            <span className="inline-flex items-center rounded-full bg-success/12 px-2.5 py-0.5 text-xs font-medium text-success">
              Abierta
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              Sin abrir
            </span>
          ),
      },
      {
        accessorKey: "nEvoluciones",
        header: "Evoluciones",
        cell: ({ row }) => (
          <span className="text-sm tabular-nums">{row.original.nEvoluciones}</span>
        ),
      },
      {
        accessorKey: "ultima",
        header: "Última sesión",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.ultima ? formatDate(row.original.ultima) : "—"}
          </span>
        ),
      },
      {
        id: "ir",
        header: "",
        cell: () => (
          <div className="text-right">
            <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Historia Clínica"
        description="Selecciona un paciente para ver o registrar su evolución"
      />

      <div className="flex items-start gap-3 rounded-xl border border-brand/20 bg-brand-gradient-soft p-4">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Información confidencial.</span>{" "}
          La historia clínica solo es accesible para el personal autorizado
          (Administrador y Psicólogo), conforme a la normativa de protección de
          datos y salud mental.
        </p>
      </div>

      {!ready ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={data}
          searchKeys={["_nombre", "numDoc"]}
          searchPlaceholder="Buscar paciente por nombre o documento…"
          onRowClick={(r) => router.push(`/historia-clinica/${r.id}`)}
        />
      )}
    </div>
  );
}

export default function HistoriaClinicaPage() {
  return (
    <RoleGuard roles={[1, 2]}>
      <HistoriaClinicaInner />
    </RoleGuard>
  );
}
