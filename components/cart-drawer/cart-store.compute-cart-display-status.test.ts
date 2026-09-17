import { test, before } from "node:test";
import assert from "node:assert/strict";

// Bug de desincronización del carrito (Sprint 33): header/badge, mini-cart y
// checkout leían todos el MISMO Context (useLocalCart), pero ninguno
// distinguía "todavía no sé" de "ya sé que no hay nada" -- ambos casos dan
// `lines.length === 0`. Dos ventanas distintas de "todavía no sé", las dos
// reproducidas en vivo (local y producción, ver reporte final):
//
// 1. Antes de que cartStorage.getAll() responda la primera vez en un mount
//    fresco (recarga completa, pestaña nueva, link externo a /checkout).
// 2. Después de esa respuesta, pero antes de que esas líneas terminen de
//    resolverse contra el catálogo (`lines` es el join de rawLines +
//    products -- mientras ese join está a medio resolver, rawLineCount > 0
//    pero lineCount todavía es 0). Esta segunda ventana se coló en el
//    primer intento de arreglo (solo consideraba isHydrated) y se reprodujo
//    en producción con navegación rápida repetida: el checkout mostró "Tu
//    carrito está vacío" un instante, con el pedido real intacto en
//    Postgres (confirmado recargando de nuevo un momento después).
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
  rawLineCount: number;
  lineCount: number;
}) => "loading" | "empty" | "ready";

before(async () => {
  ({ computeCartDisplayStatus } = await import("./cart-store"));
});

// A. Store persistido con items, pero la carga inicial todavía no respondió
// -> "loading", nunca "empty" (ventana 1).
test("A: no hidratado todavía -> loading, sin importar rawLineCount/lineCount", () => {
  assert.equal(
    computeCartDisplayStatus({
      isHydrated: false,
      rawLineCount: 0,
      lineCount: 0,
    }),
    "loading",
  );
  assert.equal(
    computeCartDisplayStatus({
      isHydrated: false,
      rawLineCount: 3,
      lineCount: 0,
    }),
    "loading",
  );
});

// B. Carrito realmente vacío (ya hidratado, sin líneas guardadas ni
// resueltas) -> "empty".
test("B: hidratado, 0 líneas guardadas y 0 resueltas -> empty", () => {
  assert.equal(
    computeCartDisplayStatus({
      isHydrated: true,
      rawLineCount: 0,
      lineCount: 0,
    }),
    "empty",
  );
});

// Ventana 2, la que reprodujo el bug en producción: ya hidratado (rawLines
// llegó de Postgres con datos reales), pero el join contra el catálogo
// todavía no resolvió esas líneas a productos -> "loading", NUNCA "empty".
test("hidratado, rawLineCount > 0 pero lineCount aún 0 (resolviendo contra el catálogo) -> loading, no empty", () => {
  assert.equal(
    computeCartDisplayStatus({
      isHydrated: true,
      rawLineCount: 3,
      lineCount: 0,
    }),
    "loading",
  );
});

// F/G. Una vez que el catálogo también resolvió, con líneas reales -> "ready".
test("hidratado y catálogo resuelto, con líneas -> ready", () => {
  assert.equal(
    computeCartDisplayStatus({
      isHydrated: true,
      rawLineCount: 1,
      lineCount: 1,
    }),
    "ready",
  );
  assert.equal(
    computeCartDisplayStatus({
      isHydrated: true,
      rawLineCount: 5,
      lineCount: 5,
    }),
    "ready",
  );
});

// Auto-limpieza ya corrió y de verdad no quedó nada válido (productos
// eliminados/desactivados desde el panel): rawLineCount converge a 0 junto
// con lineCount -- acá "empty" es la respuesta correcta, no un falso
// positivo (ver el efecto de auto-limpieza en cart-store.tsx: `rawLines` se
// actualiza a la lista filtrada ANTES de que esta función se vuelva a
// evaluar con esos valores).
test("catálogo resuelto y la auto-limpieza ya sacó las líneas inválidas -> empty, no loading", () => {
  assert.equal(
    computeCartDisplayStatus({
      isHydrated: true,
      rawLineCount: 0, // la auto-limpieza ya redujo rawLines a []
      lineCount: 0,
    }),
    "empty",
  );
});

// La transición completa que reproduce el bug y su arreglo: mismo
// rawLineCount final (2) en tres evaluaciones sucesivas -- antes del fix
// para la ventana 2, la del medio hubiera mostrado "vacío" falso.
test("secuencia completa: loading (fetch) -> loading (resolviendo catálogo) -> ready, nunca empty en el medio", () => {
  const step1 = computeCartDisplayStatus({
    isHydrated: false,
    rawLineCount: 0,
    lineCount: 0,
  });
  const step2 = computeCartDisplayStatus({
    isHydrated: true,
    rawLineCount: 2, // cartStorage.getAll() ya respondió: había 2 líneas
    lineCount: 0, // pero el catálogo todavía no las resolvió
  });
  const step3 = computeCartDisplayStatus({
    isHydrated: true,
    rawLineCount: 2,
    lineCount: 2, // catálogo resuelto
  });
  assert.equal(step1, "loading");
  assert.equal(step2, "loading");
  assert.equal(step3, "ready");
});
