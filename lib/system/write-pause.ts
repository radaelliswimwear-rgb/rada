// Interruptor de escrituras — para congelar la aplicación durante un corte
// de base de datos coordinado (ver plan de corte a producción).
//
// LÍMITE IMPORTANTE, documentado a propósito: este interruptor es código.
// Solo tiene efecto en el despliegue que lo incluye. NO pausa el despliegue
// de producción actual (construido antes de que este archivo existiera) ni
// ninguno de los despliegues Preview ya existentes — esos siguen corriendo
// el código anterior, que nunca consulta esta variable, y por lo tanto no
// respetan ninguna pausa declarada acá.
//
// Frenar TAMBIÉN esos despliegues que no incluyen este código exige una
// acción externa contra la base real, nunca algo que este archivo pueda
// lograr por sí solo. Dos intentos de encontrar esa acción ya se probaron
// y se descartaron con evidencia — no quedan como opciones válidas:
//
// 1. Suspender el compute de Neon. Descartado con la documentación oficial
//    de Neon (Scale to Zero): un compute suspendido se reactiva solo, en
//    la próxima conexión o consulta, en cuestión de milisegundos — no es
//    un bloqueo sostenido, cualquier reconexión (de un despliegue viejo,
//    de un preview) lo despierta y anula el "bloqueo" al instante.
//
// 2. Revocarle privilegios de escritura al rol con el que la app se
//    conecta (neondb_owner, que además es dueño de todas las tablas).
//    Descartado con una PRUEBA real, no solo con la documentación de
//    Postgres: se ejecutó `REVOKE UPDATE ON "ScratchWidget" FROM
//    neondb_owner` contra una base de prueba y, en la misma conexión ya
//    abierta con ese rol, un UPDATE posterior a la revocación se aplicó
//    igual — Postgres no exige una entrada de ACL para que el dueño de un
//    objeto haga operaciones básicas sobre él, revocárselas a ese mismo
//    rol no tuvo ningún efecto. `ALTER DATABASE ... SET
//    default_transaction_read_only = true` tampoco serviría por otro
//    motivo: solo cambia el valor por defecto para sesiones nuevas, una
//    sesión puede pisarlo con `SET ... = false` o `BEGIN READ WRITE`, y no
//    afecta ninguna sesión ya abierta.
//
// La única opción que sí debería funcionar (no probada todavía — pendiente
// de la decisión de tocar Vercel) es conectar con un rol DISTINTO, que no
// sea dueño de las tablas y que solo tenga SELECT otorgado explícitamente
// — la revocación de privilegios sí es efectiva contra un rol así, porque
// no tiene el bypass implícito de dueño. Pero esto no es una acción
// puramente de base de datos: como el código de la app siempre usa
// DATABASE_URL para decidir con qué rol conectarse, requiere también
// cambiar esa variable en Vercel y volver a desplegar — no hay ningún
// atajo que evite tocar Vercel para lograr esto.
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

// Operaciones de Prisma que modifican datos. Deliberadamente NO incluye
// $queryRaw/$queryRawUnsafe (reservadas por Prisma para sentencias que
// devuelven filas, típicamente lecturas).
//
// LÍMITE CONFIRMADO POR PRUEBA, no solo supuesto: un `$queryRaw` con
// `UPDATE ... RETURNING ...` SÍ escribe y NO queda bloqueado por este
// interruptor — se probó exactamente ese caso contra una base scratch con
// WRITES_PAUSED=true y la escritura se aplicó igual. Hoy esto no es un
// riesgo real porque el único $queryRaw de toda la app es el propio
// diagnóstico de conexión (app/api/admin/diagnostico-conexion/route.ts),
// que solo hace un SELECT — pero si en el futuro alguien agrega un
// $queryRaw con una escritura disfrazada de "consulta", no quedaría
// cubierto. No se resolvió con un chequeo de texto de la sentencia
// (buscar palabras como "UPDATE" es evadible con un CTE, y da una falsa
// sensación de cobertura) — queda documentado como límite conocido en vez
// de una protección parcial que aparente ser total.
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
