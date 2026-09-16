// Interruptor de escrituras — para congelar la aplicación durante un corte
// de base de datos coordinado (ver plan de corte a producción).
//
// LÍMITE IMPORTANTE, documentado a propósito: este interruptor es código.
// Solo tiene efecto en el despliegue que lo incluye. NO pausa el despliegue
// de producción actual (construido antes de que este archivo existiera) ni
// ninguno de los despliegues Preview ya existentes — esos siguen corriendo
// el código anterior, que nunca consulta esta variable, y por lo tanto no
// respetan ninguna pausa declarada acá. La única forma de detener
// escrituras en despliegues que no incluyen este código es a nivel de la
// propia base de datos (por ejemplo, `ALTER DATABASE ... SET
// default_transaction_read_only = true`, o revocar privilegios de escritura
// del rol de conexión) — eso es una acción externa contra la base real,
// nunca algo que este archivo pueda lograr por sí solo.
export function areWritesPaused(): boolean {
  return process.env.WRITES_PAUSED === "true";
}

export class WritesPausedError extends Error {
  constructor(context: string) {
    super(
      `Escrituras pausadas (WRITES_PAUSED=true) — se bloqueó una operación de escritura en ${context}.`,
    );
    this.name = "WritesPausedError";
  }
}

// Operaciones de Prisma que modifican datos. Deliberadamente no incluye
// $queryRaw/$queryRawUnsafe (reservadas por Prisma para sentencias que
// devuelven filas, típicamente lecturas) — hoy no hay ningún $queryRaw en
// esta app que escriba; si en el futuro se agrega uno que sí escriba, no
// quedaría cubierto por este interruptor y habría que sumarlo acá.
export const WRITE_OPERATIONS: ReadonlySet<string> = new Set([
  "create",
  "createMany",
  "createManyAndReturn",
  "update",
  "updateMany",
  "updateManyAndReturn",
  "upsert",
  "delete",
  "deleteMany",
  "$executeRaw",
  "$executeRawUnsafe",
]);
