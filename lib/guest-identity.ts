import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";

// Resuelve (o crea) un identificador de invitado persistido en una cookie
// propia. Reutilizado por cualquier dominio que necesite funcionar sin
// sesión (carrito, wishlist): el id se guarda como PK del "contenedor"
// (Cart.id, Wishlist.id), así no hace falta una columna de identidad
// separada — mismo patrón en los dos dominios, una sola implementación.
export async function resolveGuestId(
  cookieName: string,
  maxAgeSeconds: number,
): Promise<string> {
  const store = await cookies();
  const existing = store.get(cookieName)?.value;
  if (existing) return existing;

  const id = randomUUID();
  // Auditoría de seguridad (sep. 2026, hardening P2/P3): antes sin
  // httpOnly/secure -- mismo endurecimiento que ya tiene la cookie de
  // sesión real (lib/auth/session.ts, createSession). Ningún componente
  // cliente lee este valor directo (document.cookie/js-cookie) -- carrito y
  // wishlist de invitado se leen/escriben siempre a través de Server
  // Actions (getCartLinesAction, saveCartLinesAction, y sus equivalentes de
  // wishlist), así que httpOnly no rompe nada: solo evita que un XSS en
  // cualquier otra parte del sitio pueda leer o robar este id. El valor en
  // sí ya era seguro (randomUUID, sin PII) -- esto es solo transporte.
  store.set(cookieName, id, {
    maxAge: maxAgeSeconds,
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  return id;
}
