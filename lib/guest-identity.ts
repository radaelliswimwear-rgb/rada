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
  store.set(cookieName, id, {
    maxAge: maxAgeSeconds,
    path: "/",
    sameSite: "lax",
  });
  return id;
}
