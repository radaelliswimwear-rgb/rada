import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";

// Lee el id de invitado SIN crear uno nuevo si no existe todavía -- para
// rutas de solo lectura (getCartLinesAction/getWishlistItemsAction).
//
// Investigación de bug (sep. 2026): la wishlist de invitado no sobrevivía
// un reload. Causa raíz confirmada con un test contra la DB real
// (lib/wishlist/wishlist-persistence.test.ts): la carga inicial al montar
// el Provider (una LECTURA) y un guardado disparado por un click casi
// inmediato (ej. el corazón de favoritos, sin ningún paso previo como
// elegir talla) podían llegar al servidor como dos requests
// verdaderamente concurrentes, NINGUNO con la cookie todavía. Antes,
// resolveGuestId() creaba una cookie nueva en CUALQUIERA de los dos casos
// -- las dos minteaban un guestId DISTINTO, y cualquiera de las dos
// respuestas podía ser la que el navegador terminara aplicando. Si la
// respuesta de la LECTURA (que nunca escribe nada) ganaba esa carrera, el
// producto agregado quedaba huérfano bajo el guestId de la escritura, que
// ya nadie volvía a referenciar.
//
// Con esto, una lectura de un invitado que nunca guardó nada simplemente
// devuelve "vacío" (ver getCartLinesAction/getWishlistItemsAction) sin
// tocar la cookie -- la ÚNICA operación que puede crear un guestId nuevo
// es un guardado real (resolveGuestId, abajo), así que ya no hay dos
// operaciones compitiendo por mintear la identidad del mismo invitado a la
// vez.
export async function peekGuestId(cookieName: string): Promise<string | null> {
  const store = await cookies();
  return store.get(cookieName)?.value ?? null;
}

// Resuelve (o crea) un identificador de invitado persistido en una cookie
// propia. Reutilizado por cualquier dominio que necesite funcionar sin
// sesión (carrito, wishlist): el id se guarda como PK del "contenedor"
// (Cart.id, Wishlist.id), así no hace falta una columna de identidad
// separada — mismo patrón en los dos dominios, una sola implementación.
//
// Llamar SOLO desde una ruta de escritura (saveCartLinesAction/
// saveWishlistItemsAction) -- ver el comentario de peekGuestId arriba
// sobre por qué las lecturas ya no pueden crear un guestId nuevo.
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
