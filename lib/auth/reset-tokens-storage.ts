import { randomId } from "lib/uuid";
import type { ResetToken } from "./types";

// Tokens de recuperación de contraseña. En producción esto vive server-side
// y el token se envía por email; acá se simula sin backend (ver
// components/account/forgot-password-form.tsx para el flujo demo).
const STORAGE_KEY = "lago-reset-tokens:v1";
const TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutos

function isResetToken(value: unknown): value is ResetToken {
  const v = value as ResetToken;
  return (
    typeof value === "object" &&
    value !== null &&
    typeof v.token === "string" &&
    typeof v.email === "string" &&
    typeof v.expiresAt === "string"
  );
}

async function getAll(): Promise<ResetToken[]> {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isResetToken);
  } catch {
    return [];
  }
}

async function save(tokens: ResetToken[]): Promise<void> {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
}

export const resetTokensStorage = {
  async create(email: string): Promise<string> {
    const token = randomId();
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MS).toISOString();
    const tokens = (await getAll()).filter((t) => t.email !== email);
    tokens.push({ token, email, expiresAt });
    await save(tokens);
    return token;
  },

  async consume(token: string): Promise<string | null> {
    const tokens = await getAll();
    const found = tokens.find((t) => t.token === token);
    if (!found) return null;
    if (new Date(found.expiresAt).getTime() < Date.now()) return null;
    await save(tokens.filter((t) => t.token !== token));
    return found.email;
  },
};
