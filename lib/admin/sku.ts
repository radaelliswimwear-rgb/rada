import { prisma } from "lib/prisma";

// Formato LG-{3 letras de categoría}-{6 dígitos secuenciales}, ej.
// LG-HOM-000123 (Sprint 19). El secuencial se calcula contando productos
// existentes con ese prefijo — no es perfectamente denso si se borran
// productos, pero nunca colisiona porque se valida contra la DB antes de
// aceptarlo (ver ensureUniqueSku).
function categoryCode(categoryName: string): string {
  const letters = categoryName.replace(/[^a-zA-Z]/g, "").toUpperCase();
  return (letters.slice(0, 3) || "GEN").padEnd(3, "X");
}

export async function generateSku(categoryName: string): Promise<string> {
  const code = categoryCode(categoryName);
  const prefix = `LG-${code}-`;
  const count = await prisma.product.count({
    where: { sku: { startsWith: prefix } },
  });
  let seq = count + 1;
  for (;;) {
    const candidate = `${prefix}${String(seq).padStart(6, "0")}`;
    const clash = await prisma.product.findUnique({
      where: { sku: candidate },
      select: { id: true },
    });
    if (!clash) return candidate;
    seq++;
  }
}

// Devuelve un mensaje de error si el SKU ya está en uso por otro producto,
// o null si está libre. `excludeId` se usa al editar para no chocar
// contra el propio producto.
export async function findSkuConflict(
  sku: string,
  excludeId?: string,
): Promise<boolean> {
  const existing = await prisma.product.findUnique({
    where: { sku },
    select: { id: true },
  });
  if (!existing) return false;
  return existing.id !== excludeId;
}
