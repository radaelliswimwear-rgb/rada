"use server";

import { prisma } from "lib/prisma";

// "Personas viendo esto ahora" — presencia real (no un número inventado):
// cada pestaña abierta en la ficha de producto manda un latido cada ~20s
// (ver components/product-detail/live-viewers.tsx) que upsertea su fila de
// ProductViewer. Se considera "activo" a quien mandó un latido dentro de
// la ventana ACTIVE_WINDOW_MS — pasado ese tiempo (pestaña cerrada, sin
// conexión) deja de contar solo, sin job de limpieza aparte.
const ACTIVE_WINDOW_MS = 60_000;

export async function pingProductPresenceAction(
  productId: string,
  sessionId: string,
): Promise<void> {
  try {
    await prisma.productViewer.upsert({
      where: { productId_sessionId: { productId, sessionId } },
      update: {},
      create: { productId, sessionId },
    });
  } catch (error) {
    console.error(
      "pingProductPresenceAction: no se pudo registrar la presencia",
      error,
    );
  }
}

// El "x5 si es una sola persona" es una regla de presentación explícita
// (pedido del negocio) — se aplica acá, al leer, nunca se guarda un
// número inflado en la base: el conteo real siempre queda intacto en
// ProductViewer.
export async function getActiveViewersAction(
  productId: string,
): Promise<number> {
  try {
    const since = new Date(Date.now() - ACTIVE_WINDOW_MS);
    const count = await prisma.productViewer.count({
      where: { productId, lastSeenAt: { gte: since } },
    });
    return count === 1 ? 5 : count;
  } catch (error) {
    console.error(
      "getActiveViewersAction: no se pudo contar la presencia",
      error,
    );
    return 0;
  }
}
