import {
  createHash,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);

// Reemplaza el SHA-256 sin sal del cliente (inseguro, ver git history) por
// scrypt server-side — recomendado por OWASP, nativo de Node (sin
// dependencia nueva como bcrypt, que a veces falla al compilar en Vercel).
// Este archivo usa `node:crypto`: NUNCA debe importarse desde un componente
// "use client" (auth-store.tsx llama a las Server Actions de
// users-actions.ts en su lugar, nunca a este módulo directamente).
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH).toString("hex");
  const derivedKey = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
}

// El hash viejo (SHA-256 sin sal, calculado en el navegador) era siempre un
// digest hex de 64 caracteres, sin ":" — el formato nuevo (salt:clave)
// siempre tiene uno, así que no hay ambigüedad posible entre los dos.
function isLegacyHash(hash: string): boolean {
  return /^[0-9a-f]{64}$/i.test(hash);
}

function legacySha256(password: string): string {
  return createHash("sha256").update(password, "utf8").digest("hex");
}

export type PasswordVerification = { valid: boolean; needsRehash: boolean };

// Migración transparente (Sprint 26): las cuentas creadas antes de este
// cambio (incluidas las 3 cuentas admin existentes) tienen su contraseña
// guardada con el hash viejo — si dejara de reconocerlo, nadie podría volver
// a entrar. Se sigue aceptando ese formato para verificar, pero
// `needsRehash: true` le avisa al llamador (loginAction) que debe volver a
// hashear la contraseña con scrypt y guardarla, así cada cuenta se actualiza
// sola la próxima vez que su dueña inicia sesión, sin pedirle nada.
export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<PasswordVerification> {
  if (isLegacyHash(storedHash)) {
    const computed = Buffer.from(legacySha256(password), "hex");
    const stored = Buffer.from(storedHash, "hex");
    const valid = timingSafeEqual(computed, stored);
    return { valid, needsRehash: valid };
  }

  const [salt, keyHex] = storedHash.split(":");
  if (!salt || !keyHex) return { valid: false, needsRehash: false };
  const derivedKey = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
  const storedKey = Buffer.from(keyHex, "hex");
  if (derivedKey.length !== storedKey.length) {
    return { valid: false, needsRehash: false };
  }
  return { valid: timingSafeEqual(derivedKey, storedKey), needsRehash: false };
}
