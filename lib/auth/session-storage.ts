// Sesión actual (qué usuario está logueado en este navegador). Al conectar
// Auth.js/Clerk esto se reemplaza por su cookie/JWT de sesión verificada
// server-side; hoy es client-only, por eso la protección de rutas también
// lo es (ver components/auth/require-auth.tsx).
const STORAGE_KEY = "lago-session:v1";

type Session = { userId: string };

export const sessionStorage = {
  async get(): Promise<string | null> {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Session;
      return typeof parsed.userId === "string" ? parsed.userId : null;
    } catch {
      return null;
    }
  },

  async set(userId: string): Promise<void> {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ userId }));
  },

  async clear(): Promise<void> {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(STORAGE_KEY);
  },
};
