"use server";

import { cookies } from "next/headers";
import { prisma } from "lib/prisma";

// Una vista real por visitante/producto cada 12 horas (Sprint 19): la
// cookie `pv_<productId>` marca que ya se contó; si existe, no se vuelve a
// incrementar. El incremento es atómico (`increment`) para que dos
// pestañas abriendo el mismo producto a la vez no pisen el conteo (evita
// la típica condición de carrera de leer-sumar-guardar).
const VIEW_COOKIE_TTL_SECONDS = 60 * 60 * 12;

export async function registerProductViewAction(
  productId: string,
): Promise<void> {
  const cookieName = `pv_${productId}`;
  const store = await cookies();
  if (store.get(cookieName)) return;

  try {
    await prisma.product.update({
      where: { id: productId },
      data: { realViews: { increment: 1 } },
    });
    store.set(cookieName, "1", {
      maxAge: VIEW_COOKIE_TTL_SECONDS,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
  } catch (error) {
    console.error(
      "registerProductViewAction: no se pudo registrar la vista",
      error,
    );
  }
}
