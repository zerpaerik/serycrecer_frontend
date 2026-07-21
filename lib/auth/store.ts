"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  DEMO_USERS,
  demoUserByEmail,
  demoUserForRole,
  type RoleId,
} from "./roles";

/** Contraseña única para todos los usuarios demo (sistema simulado). */
export const DEMO_PASSWORD = "demo123";

export interface SessionUser {
  id: number;
  name: string;
  email: string;
  title?: string;
  roleId: RoleId;
}

interface Session {
  user: SessionUser;
  token: string;
  roleId: RoleId;
}

/** Simula la latencia de red de un login real. */
function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface AuthState {
  session: Session | null;
  hydrated: boolean;
  loginWithCredentials: (email: string, password: string) => Promise<void>;
  loginAsRole: (roleId: RoleId) => Promise<void>;
  switchRole: (roleId: RoleId) => Promise<void>;
  logout: () => void;
  setHydrated: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      session: null,
      hydrated: false,

      loginWithCredentials: async (email, password) => {
        await delay(650);
        const user = demoUserByEmail(email);
        if (!user || password !== DEMO_PASSWORD) {
          throw new Error("Correo o contraseña incorrectos.");
        }
        set({
          session: {
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              title: user.title,
              roleId: user.roleId,
            },
            token: `demo-token-${user.id}`,
            roleId: user.roleId,
          },
        });
      },

      loginAsRole: async (roleId) => {
        const demo = demoUserForRole(roleId);
        await get().loginWithCredentials(demo.email, DEMO_PASSWORD);
      },

      switchRole: async (roleId) => {
        await get().loginAsRole(roleId);
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
