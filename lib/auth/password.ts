import { sha256Hex } from "./sha256-fallback";

// Hash vía Web Crypto (SHA-256, sin salt). Suficiente para simular el flujo
// completo sin backend, pero NO es apto para producción: al conectar
// Prisma/Auth.js, el hashing de contraseñas debe hacerse server-side con
// bcrypt/argon2 (con salt), nunca en el cliente.
//
// crypto.subtle solo existe en "contextos seguros" (HTTPS o localhost) — al
// entrar por la IP de la red local en HTTP (ej. desde el celular a
// http://192.168.x.x:3000) queda undefined y esto tiraba
// "Cannot read properties of undefined (reading 'digest')", dejando
// "Creando cuenta..." colgado para siempre. lib/auth/sha256-fallback.ts
// reimplementa el mismo algoritmo en JS puro como reserva — mismo hash
// para el mismo input, así que da igual en qué entorno se creó la cuenta.
export async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const digest = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }
  return sha256Hex(data);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return (await hashPassword(password)) === hash;
}
