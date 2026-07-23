import { API_URL } from "@/lib/config";
import { useAuth } from "@/lib/auth/store";

const SESSION_KEY = "serycrecer-session";

/**
 * Lee el JWT: primero del store en memoria (disponible al instante tras login,
 * evita la carrera con la persistencia), y como respaldo desde localStorage.
 */
function getToken(): string | null {
  const inMemory = useAuth.getState().session?.token;
  if (inMemory) return inMemory;
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw)?.state?.session?.token ?? null : null;
  } catch {
    return null;
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // Sesión expirada → volver al login. Solo en acciones del usuario
  // (mutaciones); un 401 transitorio en una carga GET no cierra la sesión.
  if (
    res.status === 401 &&
    method !== "GET" &&
    !path.includes("/auth/login") &&
    typeof window !== "undefined"
  ) {
    localStorage.removeItem(SESSION_KEY);
    window.location.href = "/login";
  }

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const msg = data?.message;
    const message = Array.isArray(msg) ? msg.join(", ") : msg || res.statusText;
    throw new ApiError(res.status, message);
  }
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
  del: <T>(path: string) => request<T>("DELETE", path),
};
