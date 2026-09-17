import { test, mock } from "node:test";
import assert from "node:assert/strict";

// Auditoría del bug de carrito (Sprint 31): getProductsByIdsAction pasó de
// devolver un array plano a {ok, products} para que un error interno nunca
// sea indistinguible de "0 productos encontrados" — ver el comentario en
// lib/catalog/catalog-actions.ts. Sin base real: Prisma mockeado, un id
// especial (THROW_ID) dispara la excepción a propósito.

const THROW_ID = "prod_provoca_excepcion";
const FOUND_ID = "prod_real";

const FAKE_ROW = {
  id: FOUND_ID,
  slug: "producto-real",
  name: "Producto Real",
  color: "Negro",
  description: "Descripción ficticia",
  featured: false,
  sku: null,
  priceValue: 50000,
  discountPercent: 0,
  realViews: 3,
  promotionalViews: 0,
  showViews: true,
  category: { name: "Mujer", discountPercent: 0 },
  images: [{ url: "https://res.cloudinary.com/demo/image/upload/sample.jpg" }],
  variants: [{ size: "M", stock: 5 }],
};

mock.module("lib/prisma", {
  namedExports: {
    prisma: {
      product: {
        findMany: async ({ where }: { where: { id: { in: string[] } } }) => {
          if (where.id.in.includes(THROW_ID)) {
            throw new Error("fallo simulado de Postgres");
          }
          return where.id.in.includes(FOUND_ID) ? [FAKE_ROW] : [];
        },
      },
    },
  },
});
mock.module("lib/pricing/discount-actions", {
  namedExports: {
    getSitewideDiscountPercentAction: async () => 0,
  },
});

test("ids=[] no consulta nada, devuelve ok:true con lista vacía", async () => {
  const { getProductsByIdsAction } = await import("./catalog-actions");
  const result = await getProductsByIdsAction([]);
  assert.deepEqual(result, { ok: true, products: [] });
});

test("consulta exitosa con producto encontrado: ok:true, producto mapeado", async () => {
  const { getProductsByIdsAction } = await import("./catalog-actions");
  const result = await getProductsByIdsAction([FOUND_ID]);
  assert.equal(result.ok, true);
  assert.equal(result.products.length, 1);
  assert.equal(result.products[0]!.id, FOUND_ID);
});

test("consulta exitosa con producto realmente ausente: ok:true, lista vacía (distinto de un error)", async () => {
  const { getProductsByIdsAction } = await import("./catalog-actions");
  const result = await getProductsByIdsAction(["prod_que_no_existe"]);
  assert.deepEqual(result, { ok: true, products: [] });
});

test("excepción interna (Prisma falla): ok:false, nunca se confunde con 'no encontrado'", async () => {
  const { getProductsByIdsAction } = await import("./catalog-actions");
  const result = await getProductsByIdsAction([THROW_ID]);
  assert.equal(result.ok, false);
  assert.deepEqual(result.products, []);
  assert.equal((result as { errorType: string }).errorType, "internal");
});
