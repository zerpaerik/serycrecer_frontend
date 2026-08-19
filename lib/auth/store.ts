"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "@/lib/api/client";
import { DEMO_USERS, demoUserForRole, type RoleId } from "./roles";

/** Contraseña de las cuentas demo del backend. */
export const DEMO_PASSWORD = "demo123";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  title?: string;
  roleId: RoleId;
  licencia?: string;
  psicologoId?: string;
}

interface Session {
  user: SessionUser;
  token: string;
  roleId: RoleId;
}

interface LoginResponse {
  access_token: string;
  user: {
    id: number;
    nombre: string;
    email: string;
    title?: string;
    roleId: number;
  };
}

interface AuthState {
  session: Session | null;
  hydrated: boolean;
  loginWithCredentials: (email: string, password: string) => Promise<void>;
  loginAsRole: (roleId: RoleId) => Promise<void>;
  switchRole: (roleId: RoleId) => Promise<void>;
  refreshPerfil: () => Promise<SessionUser | null>;
  updatePerfil: (data: { nombre?: string; licencia?: string }) => Promise<void>;
  changePassword: (actual: string, nueva: string) => Promise<void>;
  logout: () => void;
  setHydrated: () => void;
}

interface PerfilResponse {
  id: number;
  nombre: string;
  email: string;
  title?: string;
  roleId: number;
  licencia?: string | null;
  psicologoId?: number | null;
}

function perfilToUser(p: PerfilResponse): SessionUser {
  return {
    id: String(p.id),
    name: p.nombre,
    email: p.email,
    title: p.title,
    roleId: p.roleId as RoleId,
    licencia: p.licencia ?? undefined,
    psicologoId: p.psicologoId != null ? String(p.psicologoId) : undefined,
  };
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      session: null,
      hydrated: false,

      loginWithCredentials: async (email, password) => {
        const res = await api.post<LoginResponse>("/auth/login", { email, password });
        const user: SessionUser = {
          id: String(res.user.id),
          name: res.user.nombre,
          email: res.user.email,
          title: res.user.title,
          roleId: res.user.roleId as RoleId,
        };
        set({ session: { user, token: res.access_token, roleId: user.roleId } });
      },

      loginAsRole: async (roleId) => {
        const demo = demoUserForRole(roleId);
        await get().loginWithCredentials(demo.email, DEMO_PASSWORD);
      },

      switchRole: async (roleId) => {
        await get().loginAsRole(roleId);
      },

      refreshPerfil: async () => {
        const sess = get().session;
        if (!sess) return null;
        const p = await api.get<PerfilResponse>("/auth/perfil");
        const user = perfilToUser(p);
        set({ session: { ...sess, user, roleId: user.roleId } });
        return user;
      },

      updatePerfil: async (data) => {
        const sess = get().session;
        if (!sess) return;
        const p = await api.patch<PerfilResponse>("/auth/perfil", data);
        const user = perfilToUser(p);
        set({ session: { ...sess, user, roleId: user.roleId } });
      },

      changePassword: async (actual, nueva) => {
        await api.post("/auth/change-password", { actual, nueva });
      },

      logout: () => set({ session: null }),

      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: "serycrecer-session",
      partialize: (s) => ({ session: s.session }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);

/** Lista de usuarios demo para los accesos rápidos del login. */
export const DEMO_ACCOUNTS = DEMO_USERS;
