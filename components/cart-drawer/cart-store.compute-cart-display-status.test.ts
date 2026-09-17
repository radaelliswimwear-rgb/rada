import { test, before } from "node:test";
import assert from "node:assert/strict";

// Bug de desincronización del carrito (Sprint 33): header/badge, mini-cart y
// checkout leían todos el MISMO Context (useLocalCart), pero ninguno
// distinguía "cartStorage.getAll() todavía no respondió" de "ya sé que no
// hay nada" -- ambos casos dan `lines.length === 0`. En cada mount fresco
// (recarga completa, pestaña nueva, link externo a /checkout) eso mostraba
// "Tu carrito está vacío" con productos realmente guardados en Postgres,
// hasta que la respuesta llegaba un instante después. Reproducido en vivo
// (local y producción): ver reporte final.
//
// computeCartDisplayStatus es la lógica pura que decide qué mostrar,
// extraída de LocalCartProvider para poder probarla sin un harness de React
// Testing Library (mismo patrón que computeInvalidCartLineIds, Sprint 31).
//
// cart-store.tsx importa (transitivamente, vía cartStorage) lib/prisma.ts,
// que exige DATABASE_URL al cargar el módulo — import dinámico dentro de
// `before`, después de fijar una variable de entorno de relleno (nunca se
// toca una base real acá).
process.env.DATABASE_URL ??=
  "postgresql://user:pass@localhost:5432/db_placeholder_para_tests_puros";

let computeCartDisplayStatus: (params: {
  isHydrated: boolean;
  lineCount: number;
}) => "loading" | "empty" | "ready";

before(async () => {
  ({ computeCartDisplayStatus } = await import("./cart-store"));
});

// A. Store persistido con items, pero la carga inicial todavía no respondió
// -> "loading", nunca "empty" (la causa raíz del bug: antes esto se leía
// como carrito vacío porque no existía ningún flag para este caso).
test("A: no hidratado, 0 líneas conocidas todavía (puede haber items guardados) -> loading", () => {
  assert.equal(
    computeCartDisplayStatus({ isHydrated: false, lineCount: 0 }),
    "loading",
  );
});

test("A bis: no hidratado, aunque ya se conozcan líneas -> sigue siendo loading (no muestra contenido a medio resolver)", () => {
  assert.equal(
    computeCartDisplayStatus({ isHydrated: false, lineCount: 3 }),
    "loading",
  );
});

// B. Carrito realmente vacío (ya hidratado, sin líneas) -> "empty".
test("B: hidratado, 0 líneas -> empty", () => {
  assert.equal(
    computeCartDisplayStatus({ isHydrated: true, lineCount: 0 }),
    "empty",
  );
});

// F/G. Una vez hidratado, con líneas reales -> "ready", sea que la
// hidratación haya llegado en el mount inicial o después de un
// refresh/remount (esta función no distingue el origen, por diseño: mismo
// resultado sin importar cuántas veces se montó el Provider antes).
test("hidratado, con líneas -> ready", () => {
  assert.equal(
    computeCartDisplayStatus({ isHydrated: true, lineCount: 1 }),
    "ready",
  );
  assert.equal(
    computeCartDisplayStatus({ isHydrated: true, lineCount: 5 }),
    "ready",
  );
});

// La transición completa que reproduce el bug y su arreglo: mismo `lineCount`
// final (2) en dos evaluaciones sucesivas, la única diferencia es si ya
// hidrató -- antes del fix, ambas hubieran mostrado "vacío" en el momento
// equivocado porque no existía este parámetro.
test("misma cantidad de líneas, antes y después de hidratar -> loading primero, ready después (nunca empty)", () => {
  const beforeHydration = computeCartDisplayStatus({
    isHydrated: false,
    lineCount: 0, // rawLines todavía no llegó de cartStorage.getAll()
  });
  const afterHydration = computeCartDisplayStatus({
    isHydrated: true,
    lineCount: 2, // ya resolvió: había 2 líneas guardadas
  });
  assert.equal(beforeHydration, "loading");
  assert.equal(afterHydration, "ready");
});
