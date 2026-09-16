import { mock } from "node:test";

// @types/node está pineado en 22.13.10 y todavía tipa mock.module con
// `namedExports`, que el runtime de Node 24 ya marca como deprecada en favor
// de `exports`. Se usa la forma nueva (para no llenar la salida de las
// pruebas de DeprecationWarning) y el cast queda acá, en un solo lugar, en
// vez de repetido en cada archivo de prueba. Cuando se actualice
// @types/node, este helper se puede borrar y llamar a mock.module directo.
export function mockModule(
  specifier: string,
  exports: Record<string, unknown>,
): void {
  mock.module(specifier, { exports } as unknown as Parameters<
    typeof mock.module
  >[1]);
}
