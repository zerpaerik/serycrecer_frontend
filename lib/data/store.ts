"use client";

import { create } from "zustand";
import { api } from "@/lib/api/client";
import * as M from "./mappers";
import { toId } from "./mappers";
import type {
  Atencion,
  Cita,
  ConsultorioConfig,
  EstadoCita,
  EvaluacionNeuro,
  EvolucionSesion,
  ObjetivoTrabajo,
  Paciente,
  Pago,
  Paquete,
  Psicologo,
  RespuestaValor,
  Servicio,
  Usuario,
} from "./types";

/** Id efímero para objetivos (se guardan como JSON en el backend). */
function uid(prefix: string): string {
  const r =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${r}`;
}

const CONFIG_DEFAULT: ConsultorioConfig = { nombre: "Ser y Crecer", moneda: "PEN" };

type CollKey =
  | "pacientes" | "psicologos" | "servicios" | "paquetes" | "paquetesPaciente"
  | "citas" | "atenciones" | "evaluaciones" | "evoluciones" | "usuarios" | "config";

interface DbState {
  hydrated: boolean;
  pacientes: Paciente[];
  psicologos: Psicologo[];
  servicios: Servicio[];
  paquetes: Paquete[];
  paquetesPaciente: import("./types").PaquetePaciente[];
  citas: Cita[];
  atenciones: Atencion[];
  evaluaciones: EvaluacionNeuro[];
  evoluciones: EvolucionSesion[];
  usuarios: Usuario[];
  config: ConsultorioConfig;

  loadAll: () => Promise<void>;
  refresh: (keys: CollKey[]) => Promise<void>;

  addPaciente: (data: Omit<Paciente, "id" | "creadoEn">) => Promise<Paciente>;
  updatePaciente: (id: string, data: Partial<Paciente>) => Promise<void>;
  deletePaciente: (id: string) => Promise<void>;

  addCita: (data: Omit<Cita, "id" | "creadoEn">) => Promise<Cita>;
  updateCita: (id: string, data: Partial<Cita>) => Promise<void>;
  setEstadoCita: (id: string, estado: EstadoCita) => Promise<void>;
  deleteCita: (id: string) => Promise<void>;

  addAtencion: (data: Omit<Atencion, "id" | "creadoEn">) => Promise<Atencion>;
  updateAtencion: (id: string, data: Partial<Atencion>) => Promise<void>;
  agregarPago: (atencionId: string, pago: Omit<Pago, "id">) => Promise<void>;
  anularAtencion: (id: string, motivo: string) => Promise<void>;

  addPaquete: (data: Omit<Paquete, "id">) => Promise<Paquete>;
  updatePaquete: (id: string, data: Partial<Paquete>) => Promise<void>;
  deletePaquete: (id: string) => Promise<void>;

  addUsuario: (data: Omit<Usuario, "id" | "creadoEn"> & { password?: string }) => Promise<Usuario>;
  updateUsuario: (id: string, data: Partial<Usuario> & { password?: string }) => Promise<void>;
  deleteUsuario: (id: string) => Promise<void>;

  addPsicologo: (data: Omit<Psicologo, "id">) => Promise<Psicologo>;
  updatePsicologo: (id: string, data: Partial<Psicologo>) => Promise<void>;
  deletePsicologo: (id: string) => Promise<void>;

  addServicio: (data: Omit<Servicio, "id">) => Promise<Servicio>;
  updateServicio: (id: string, data: Partial<Servicio>) => Promise<void>;
  deleteServicio: (id: string) => Promise<void>;

  updateConfig: (data: Partial<ConsultorioConfig>) => Promise<void>;

  setRespuesta: (pacienteId: string, fieldId: string, valor: RespuestaValor) => void;
  setEvalCampo: (pacienteId: string, campo: "obsConducta" | "obsFamilia" | "obsEscolar" | "informe", valor: string) => void;
  addObjetivo: (pacienteId: string, texto: string) => void;
  updateObjetivo: (pacienteId: string, objetivoId: string, data: Partial<ObjetivoTrabajo>) => void;
  deleteObjetivo: (pacienteId: string, objetivoId: string) => void;

  addEvolucion: (data: Omit<EvolucionSesion, "id" | "creadoEn">) => Promise<EvolucionSesion>;
  updateEvolucion: (id: string, data: Partial<EvolucionSesion>) => Promise<void>;
  deleteEvolucion: (id: string) => Promise<void>;

  setHydrated: () => void;
}

// Timers de autoguardado de la historia clínica (debounce por paciente).
const evalTimers = new Map<string, ReturnType<typeof setTimeout>>();

async function fetchColl(key: CollKey): Promise<unknown> {
  switch (key) {
    case "pacientes": return (await api.get<unknown[]>("/pacientes")).map(M.mapPaciente);
    case "psicologos": return (await api.get<unknown[]>("/psicologos")).map(M.mapPsicologo);
    case "servicios": return (await api.get<unknown[]>("/servicios")).map(M.mapServicio);
    case "paquetes": return (await api.get<unknown[]>("/paquetes")).map(M.mapPaquete);
    case "paquetesPaciente": return (await api.get<unknown[]>("/paquetes-paciente")).map(M.mapPaquetePaciente);
    case "citas": return (await api.get<unknown[]>("/citas")).map(M.mapCita);
    case "atenciones": return (await api.get<unknown[]>("/atenciones")).map(M.mapAtencion);
    case "evaluaciones": return (await api.get<unknown[]>("/evaluaciones")).map(M.mapEvaluacion);
    case "evoluciones": return (await api.get<unknown[]>("/evoluciones")).map(M.mapEvolucion);
    case "usuarios": return (await api.get<unknown[]>("/usuarios")).map(M.mapUsuario);
    case "config": return M.mapConfig(await api.get("/config"));
  }
}

export const useDb = create<DbState>()((set, get) => {
  const upsertEval = (pacienteId: string, fn: (ev: EvaluacionNeuro) => EvaluacionNeuro) => {
    set((s) => {
      const existe = s.evaluaciones.find((e) => e.pacienteId === pacienteId);
      const base: EvaluacionNeuro = existe ?? {
        pacienteId, respuestas: {}, objetivos: [], actualizadoEn: new Date().toISOString(),
      };
      const next = fn(base);
      return existe
        ? { evaluaciones: s.evaluaciones.map((e) => (e.pacienteId === pacienteId ? next : e)) }
        : { evaluaciones: [...s.evaluaciones, next] };
    });
    // Autoguardado debounced al backend.
    const prev = evalTimers.get(pacienteId);
    if (prev) clearTimeout(prev);
    evalTimers.set(
      pacienteId,
      setTimeout(() => {
        const ev = get().evaluaciones.find((e) => e.pacienteId === pacienteId);
        if (!ev) return;
        api
          .put(`/evaluaciones/${pacienteId}`, {
            respuestas: ev.respuestas,
            objetivos: ev.objetivos,
            obsConducta: ev.obsConducta,
            obsFamilia: ev.obsFamilia,
            obsEscolar: ev.obsEscolar,
            informe: ev.informe,
          })
          .catch(() => {});
      }, 700),
    );
  };

  return {
    hydrated: false,
    pacientes: [],
    psicologos: [],
    servicios: [],
    paquetes: [],
    paquetesPaciente: [],
    citas: [],
    atenciones: [],
    evaluaciones: [],
    evoluciones: [],
    usuarios: [],
    config: CONFIG_DEFAULT,

    loadAll: async () => {
      const keys: CollKey[] = [
        "pacientes", "psicologos", "servicios", "paquetes", "paquetesPaciente",
        "citas", "atenciones", "evaluaciones", "evoluciones", "usuarios", "config",
      ];
      // allSettled: un fallo transitorio en una colección no tumba el resto.
      const results = await Promise.allSettled(keys.map((k) => fetchColl(k)));
      const patch: Record<string, unknown> = {};
      results.forEach((r, i) => {
        if (r.status === "fulfilled") patch[keys[i]] = r.value;
      });
      set(patch as Partial<DbState>);
      set({ hydrated: true });
    },

    refresh: async (keys) => {
      // allSettled: si una colección falla (p. ej. endpoint no disponible),
      // las demás se actualizan igual y no rompe el flujo de la mutación.
      const results = await Promise.allSettled(keys.map((k) => fetchColl(k)));
      const patch: Record<string, unknown> = {};
      results.forEach((r, i) => {
        if (r.status === "fulfilled") patch[keys[i]] = r.value;
      });
      set(patch as Partial<DbState>);
    },

    // ── Pacientes ──
    addPaciente: async (data) => {
      const p = M.mapPaciente(await api.post("/pacientes", data));
      set((s) => ({ pacientes: [p, ...s.pacientes] }));
      return p;
    },
    updatePaciente: async (id, data) => {
      const p = M.mapPaciente(await api.patch(`/pacientes/${id}`, data));
      set((s) => ({ pacientes: s.pacientes.map((x) => (x.id === id ? p : x)) }));
    },
    deletePaciente: async (id) => {
      await api.del(`/pacientes/${id}`);
      set((s) => ({ pacientes: s.pacientes.filter((x) => x.id !== id) }));
    },

    // ── Citas ──
    addCita: async (data) => {
      const c = M.mapCita(await api.post("/citas", {
        pacienteId: toId(data.pacienteId), psicologoId: toId(data.psicologoId),
        servicioId: toId(data.servicioId), fecha: data.fecha, hora: data.hora,
        estado: data.estado, tardanza: data.tardanza,
        paquetePacienteId: toId(data.paquetePacienteId), notas: data.notas,
      }));
      set((s) => ({ citas: [...s.citas, c] }));
      return c;
    },
    updateCita: async (id, data) => {
      const body: Record<string, unknown> = {};
      if (data.pacienteId !== undefined) body.pacienteId = toId(data.pacienteId);
      if (data.psicologoId !== undefined) body.psicologoId = toId(data.psicologoId);
      if (data.servicioId !== undefined) body.servicioId = toId(data.servicioId);
      if (data.fecha !== undefined) body.fecha = data.fecha;
      if (data.hora !== undefined) body.hora = data.hora;
      if (data.estado !== undefined) body.estado = data.estado;
      if (data.tardanza !== undefined) body.tardanza = data.tardanza;
      if ("paquetePacienteId" in data) body.paquetePacienteId = toId(data.paquetePacienteId);
      if (data.notas !== undefined) body.notas = data.notas;
      const c = M.mapCita(await api.patch(`/citas/${id}`, body));
      set((s) => ({ citas: s.citas.map((x) => (x.id === id ? c : x)) }));
    },
    setEstadoCita: async (id, estado) => {
      const c = M.mapCita(await api.patch(`/citas/${id}/estado`, { estado }));
      set((s) => ({ citas: s.citas.map((x) => (x.id === id ? c : x)) }));
    },
    deleteCita: async (id) => {
      await api.del(`/citas/${id}`);
      set((s) => ({ citas: s.citas.filter((x) => x.id !== id) }));
    },

    // ── Atenciones ──
    addAtencion: async (data) => {
      const a = M.mapAtencion(await api.post("/atenciones", {
        pacienteId: toId(data.pacienteId), psicologoId: toId(data.psicologoId),
        citaId: toId(data.citaId), fecha: data.fecha, hora: data.hora,
        observaciones: data.observaciones,
        items: data.items.map((it) => ({
          tipo: it.tipo, nombre: it.nombre, monto: it.monto,
          servicioId: toId(it.servicioId), paqueteId: toId(it.paqueteId),
        })),
        pagos: data.pagos.map((p) => ({ monto: p.monto, metodo: p.metodo })),
      }));
      // El backend crea el paquete-paciente y marca la cita atendida.
      await get().refresh(["atenciones", "paquetesPaciente", "citas"]);
      return a;
    },
    updateAtencion: async (id, data) => {
      await api.patch(`/atenciones/${id}`, { observaciones: data.observaciones, hora: data.hora });
      await get().refresh(["atenciones"]);
    },
    agregarPago: async (atencionId, pago) => {
      await api.post(`/atenciones/${atencionId}/pagos`, { monto: pago.monto, metodo: pago.metodo });
      await get().refresh(["atenciones"]);
    },
    anularAtencion: async (id, motivo) => {
      await api.post(`/atenciones/${id}/anular`, { motivo });
      await get().refresh(["atenciones"]);
    },

    // ── Paquetes (catálogo) ──
    addPaquete: async (data) => {
      const p = M.mapPaquete(await api.post("/paquetes", { ...data, servicioId: toId(data.servicioId) }));
      set((s) => ({ paquetes: [...s.paquetes, p] }));
      return p;
    },
    updatePaquete: async (id, data) => {
      const p = M.mapPaquete(await api.patch(`/paquetes/${id}`, { ...data, servicioId: data.servicioId !== undefined ? toId(data.servicioId) : undefined }));
      set((s) => ({ paquetes: s.paquetes.map((x) => (x.id === id ? p : x)) }));
    },
    deletePaquete: async (id) => {
      await api.del(`/paquetes/${id}`);
      set((s) => ({ paquetes: s.paquetes.filter((x) => x.id !== id) }));
    },

    // ── Usuarios ──
    addUsuario: async (data) => {
      const u = M.mapUsuario(await api.post("/usuarios", {
        nombre: data.nombre, email: data.email, roleId: data.roleId,
        estado: data.estado, password: data.password ?? "demo123",
      }));
      set((s) => ({ usuarios: [u, ...s.usuarios] }));
      return u;
    },
    updateUsuario: async (id, data) => {
      const u = M.mapUsuario(await api.patch(`/usuarios/${id}`, data));
      set((s) => ({ usuarios: s.usuarios.map((x) => (x.id === id ? u : x)) }));
    },
    deleteUsuario: async (id) => {
      await api.del(`/usuarios/${id}`);
      set((s) => ({ usuarios: s.usuarios.filter((x) => x.id !== id) }));
    },

    // ── Psicólogos ──
    addPsicologo: async (data) => {
      const p = M.mapPsicologo(await api.post("/psicologos", data));
      set((s) => ({ psicologos: [...s.psicologos, p] }));
      return p;
    },
    updatePsicologo: async (id, data) => {
      const p = M.mapPsicologo(await api.patch(`/psicologos/${id}`, data));
      set((s) => ({ psicologos: s.psicologos.map((x) => (x.id === id ? p : x)) }));
    },
    deletePsicologo: async (id) => {
      await api.del(`/psicologos/${id}`);
      set((s) => ({ psicologos: s.psicologos.filter((x) => x.id !== id) }));
    },

    // ── Servicios ──
    addServicio: async (data) => {
      const sv = M.mapServicio(await api.post("/servicios", data));
      set((s) => ({ servicios: [...s.servicios, sv] }));
      return sv;
    },
    updateServicio: async (id, data) => {
      const sv = M.mapServicio(await api.patch(`/servicios/${id}`, data));
      set((s) => ({ servicios: s.servicios.map((x) => (x.id === id ? sv : x)) }));
    },
    deleteServicio: async (id) => {
      await api.del(`/servicios/${id}`);
      set((s) => ({ servicios: s.servicios.filter((x) => x.id !== id) }));
    },

    // ── Config ──
    updateConfig: async (data) => {
      const c = M.mapConfig(await api.patch("/config", data));
      set({ config: c });
    },

    // ── Historia clínica (evaluación con autoguardado) ──
    setRespuesta: (pacienteId, fieldId, valor) =>
      upsertEval(pacienteId, (ev) => ({ ...ev, respuestas: { ...ev.respuestas, [fieldId]: valor } })),
    setEvalCampo: (pacienteId, campo, valor) =>
      upsertEval(pacienteId, (ev) => ({ ...ev, [campo]: valor })),
    addObjetivo: (pacienteId, texto) =>
      upsertEval(pacienteId, (ev) => ({ ...ev, objetivos: [...ev.objetivos, { id: uid("obj"), texto, estado: "En proceso inicial" }] })),
    updateObjetivo: (pacienteId, objetivoId, data) =>
      upsertEval(pacienteId, (ev) => ({ ...ev, objetivos: ev.objetivos.map((o) => (o.id === objetivoId ? { ...o, ...data } : o)) })),
    deleteObjetivo: (pacienteId, objetivoId) =>
      upsertEval(pacienteId, (ev) => ({ ...ev, objetivos: ev.objetivos.filter((o) => o.id !== objetivoId) })),

    // ── Evoluciones ──
    addEvolucion: async (data) => {
      const e = M.mapEvolucion(await api.post("/evoluciones", {
        pacienteId: toId(data.pacienteId), psicologoId: toId(data.psicologoId),
        atencionId: toId(data.atencionId), fecha: data.fecha, hora: data.hora,
        motivo: data.motivo, observaciones: data.observaciones, acuerdos: data.acuerdos,
      }));
      set((s) => ({ evoluciones: [e, ...s.evoluciones] }));
      return e;
    },
    updateEvolucion: async (id, data) => {
      const e = M.mapEvolucion(await api.patch(`/evoluciones/${id}`, {
        motivo: data.motivo, observaciones: data.observaciones, acuerdos: data.acuerdos,
        fecha: data.fecha, hora: data.hora, psicologoId: toId(data.psicologoId),
      }));
      set((s) => ({ evoluciones: s.evoluciones.map((x) => (x.id === id ? e : x)) }));
    },
    deleteEvolucion: async (id) => {
      await api.del(`/evoluciones/${id}`);
      set((s) => ({ evoluciones: s.evoluciones.filter((x) => x.id !== id) }));
    },

    setHydrated: () => set({ hydrated: true }),
  };
});

/** Nombre completo del paciente. */
export function pacienteNombre(p?: Paciente): string {
  return p ? `${p.nombres} ${p.apellidos}`.trim() : "—";
}
