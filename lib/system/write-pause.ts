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
// lograr por sí solo — y no cualquier acción sirve. Confirmado leyendo
// ORIGIN: el rol con el que la app se conecta (neondb_owner) es DUEÑO de
// todas las tablas — en Postgres, el dueño de un objeto no está sujeto a
// GRANT/REVOKE sobre ese objeto, así que revocarle privilegios de
// escritura a ese mismo rol no tendría ningún efecto. `ALTER DATABASE ...
// SET default_transaction_read_only = true` tampoco alcanza por sí solo:
// solo cambia el valor por defecto para sesiones NUEVAS, una sesión puede
// pisarlo con `SET default_transaction_read_only = false` o `BEGIN READ
// WRITE`, y no afecta ninguna sesión ya abierta. La opción concreta y
// reversible es a nivel de Neon, no de SQL: suspender el compute de la
// rama en cuestión — corta toda conexión activa y rechaza conexiones
// nuevas, sin depender de qué rol las abra, y se revierte reanudando el
// compute. Su límite: también bloquea lecturas (no es un freeze selectivo
// de escrituras), y solo tiene el efecto buscado sobre la rama que
// realmente use el despliegue en producción — algo que, a la fecha de este
// comentario, seguía sin confirmarse.
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
