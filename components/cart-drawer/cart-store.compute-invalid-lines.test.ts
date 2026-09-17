import { test, before } from "node:test";
import assert from "node:assert/strict";
import type { CartLine } from "lib/cart/types";
import type { PlaceholderProduct } from "lib/placeholder-data";

// Regresión del bug de carrito (Sprint 31): un CartItem persistido se
// borraba solo porque la consulta de catálogo todavía no había terminado,
// no porque el producto realmente no existiera. El proyecto no tiene un
// harness de React Testing Library todavía, así que estos tests cubren la
// lógica pura de decisión, extraída del efecto de limpieza en
// cart-store.tsx, sin necesitar renderizar React.
//
// cart-store.tsx importa (transitivamente, vía cartStorage) lib/prisma.ts,
// que exige DATABASE_URL al cargar el módulo — import dinámico dentro de
// `before`, después de fijar una variable de entorno de relleno (nunca se
// toca una base real acá), en vez de un import estático de nivel de
// archivo (no soportado en este target de compilación) o top-level await
// (mismo motivo).
process.env.DATABASE_URL ??=
  "postgresql://user:pass@localhost:5432/db_placeholder_para_tests_puros";

let computeInvalidCartLineIds: (params: {
  rawLines: CartLine[];
  products: Record<string, PlaceholderProduct>;
  resolvedRequestId: number | null;
  currentRequestId: number;
}) => string[];

before(async () => {
  ({ computeInvalidCartLineIds } = await import("./cart-store"));
});

const LINE: CartLine = {
  id: "prod-1-M",
  productId: "prod-1",
  size: "M",
  quantity: 1,
  createdAt: "2026-09-16T00:00:00.000Z",
};

const PRODUCT: PlaceholderProduct = {
  id: "prod-1",
  slug: "producto-1",
  name: "Producto 1",
  category: "Mujer",
  price: "50000,00",
  priceValue: 50000,
  originalPriceValue: 50000,
  activeDiscountPercent: 0,
  tone: "clay",
  sizes: ["M"],
  color: "Negro",
  description: "",
  images: [],
  featured: false,
  sku: null,
  totalStock: 5,
  sizeStock: { M: 5 },
  realViews: 0,
  promotionalViews: 0,
  showViews: false,
};

// A. Producto existente + consulta todavía en vuelo (resolvedRequestId no
// coincide con la consulta vigente) -> no se elimina, aunque `products`
// todavía esté vacío.
test("consulta en vuelo (resolvedRequestId != currentRequestId): no elimina nada", () => {
  const invalid = computeInvalidCartLineIds({
    rawLines: [LINE],
    products: {}, // todavía no resolvió
    resolvedRequestId: null, // ninguna consulta terminó todavía
    currentRequestId: 1, // la consulta vigente es la 1
  });
  assert.deepEqual(invalid, []);
});

// B. La consulta terminó en error (el llamador nunca avanza
// resolvedRequestId en ese caso) -> sigue sin coincidir con la vigente, no
// se elimina.
test("consulta con error (resolvedRequestId nunca avanzó): no elimina nada", () => {
  const invalid = computeInvalidCartLineIds({
    rawLines: [LINE],
    products: {},
    resolvedRequestId: 0, // quedó en el valor de una consulta anterior/inicial
    currentRequestId: 1, // la consulta 1 (la que falló) es la vigente
  });
  assert.deepEqual(invalid, []);
});

// C. Consulta exitosa, vigente, y el producto realmente no vino en el
// resultado -> sí se puede limpiar.
test("consulta exitosa y vigente + producto realmente ausente: sí elimina", () => {
  const invalid = computeInvalidCartLineIds({
    rawLines: [LINE],
    products: {}, // resolvió, pero no encontró prod-1
    resolvedRequestId: 1,
    currentRequestId: 1,
  });
  assert.deepEqual(invalid, [LINE.id]);
});

// C bis. Consulta exitosa, vigente, y el producto SÍ vino -> nada que limpiar.
test("consulta exitosa y vigente + producto presente: no elimina nada", () => {
  const invalid = computeInvalidCartLineIds({
    rawLines: [LINE],
    products: { [PRODUCT.id]: PRODUCT },
    resolvedRequestId: 1,
    currentRequestId: 1,
  });
  assert.deepEqual(invalid, []);
});

// D. Respuesta vieja fuera de orden: resolvedRequestId quedó en una
// consulta anterior (0) mientras ya hay una consulta más nueva en vuelo (1)
// -> no debe pisar el estado ni disparar limpieza basada en datos viejos.
test("respuesta vieja (resolvedRequestId de una consulta anterior): no elimina nada", () => {
  const invalid = computeInvalidCartLineIds({
    rawLines: [LINE],
    products: {}, // lo que dejó la respuesta vieja
    resolvedRequestId: 0,
    currentRequestId: 1,
  });
  assert.deepEqual(invalid, []);
});

// Carrito vacío: nunca hay nada que limpiar, sin importar el resto.
test("rawLines vacío: no elimina nada", () => {
  const invalid = computeInvalidCartLineIds({
    rawLines: [],
    products: {},
    resolvedRequestId: 5,
    currentRequestId: 5,
  });
  assert.deepEqual(invalid, []);
});
