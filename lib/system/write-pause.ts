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
// lograr por sí solo. Dos ideas se evaluaron y no quedaron como
// mecanismo garantizado — esto sigue siendo una decisión externa
// pendiente, no algo resuelto acá:
//
// 1. Suspender el compute de Neon. Descartado con la documentación oficial
//    de Neon (Scale to Zero): un compute suspendido se reactiva solo, en
//    la próxima conexión o consulta, en cuestión de milisegundos — no es
//    un bloqueo sostenido, cualquier reconexión (de un despliegue viejo,
//    de un preview) lo despierta y anula el "bloqueo" al instante.
//
// 2. Revocarle privilegios de escritura al rol con el que la app se
//    conecta (neondb_owner, que además es dueño de todas las tablas). En
//    una prueba puntual contra una base scratch, `REVOKE UPDATE ON
//    "ScratchWidget" FROM neondb_owner` NO impidió que ese mismo rol,
//    en la misma conexión ya abierta, hiciera igual el UPDATE. Esto es
//    una OBSERVACIÓN de ese entorno puntual (un rol de Neon, con las
//    membresías/atributos que tenga configurados ahí) — no se investigó
//    la causa exacta, y no se generaliza como "todo dueño de tabla en
//    cualquier PostgreSQL bypasea siempre GRANT/REVOKE": esa no es una
//    regla general confirmada acá, solo lo que se observó en este caso
//    puntual. De cualquier forma, para el propósito de este freeze el
//    resultado práctico es el mismo: revocarle privilegios a ese rol no
//    demostró ser un bloqueo confiable. `ALTER DATABASE ... SET
//    default_transaction_read_only = true` tampoco serviría por otro
//    motivo, éste sí general: solo cambia el valor por defecto para
//    sesiones nuevas, una sesión puede pisarlo con `SET ... = false` o
//    `BEGIN READ WRITE`, y no afecta ninguna sesión ya abierta.
//
// Conectar con un rol DISTINTO (que no sea dueño de las tablas, con solo
// SELECT otorgado) es la única idea que queda sin descartar — pero
// tampoco está confirmada: un intento de crearlo y probarlo contra Neon
// falló por un problema de conexión ajeno a la pregunta de fondo (no se
// investigó más). Y aunque funcionara, un rol nuevo en un despliegue
// nuevo NO frena ningún despliegue viejo que siga usando las credenciales
// de siempre — cada despliegue usa el DATABASE_URL con el que se
// construyó, cambiar la variable no alcanza a los que ya están corriendo.
// No hay, hasta ahora, un único mecanismo confirmado que resuelva esto —
// queda como decisión externa pendiente, no como algo prometido.
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
