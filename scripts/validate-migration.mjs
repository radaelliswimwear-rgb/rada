// scripts/validate-migration.mjs
//
// Valida que una migración de base de datos (Neon origen -> Neon destino)
// haya llevado los datos correctamente, comparando ambas bases en vivo.
//
// PREPARACIÓN — este script está pensado para revisión antes de usarse.
// No se conecta a nada por su cuenta ni corre solo: hace falta invocarlo a
// mano, y solo hace lecturas (nunca escribe ni borra nada en ninguna de las
// dos bases). Cada conexión abre explícitamente una transacción
// `REPEATABLE READ, READ ONLY` — Postgres rechaza cualquier intento de
// escritura dentro de esa transacción a nivel de motor, no solo porque este
// script "no intente escribir".
//
// Usa una única conexión persistente por base (pg.Client, no un pool ni el
// cliente de Prisma) para todo el chequeo — nunca abre una conexión nueva
// por consulta. Esto es intencional: en el intento #3 de migración, un
// workflow que sí abría una conexión Docker nueva por cada consulta produjo
// un error transitorio ("relation does not exist") en la primera tabla que
// no se pudo reproducir corriendo la misma consulta después. Sospechamos
// que la rotación de conexiones fue la causa, pero no está confirmado con
// certeza — este script evita ese patrón por diseño.
//
// Cómo correrlo (cuando la dueña del proyecto lo apruebe):
//
//   ORIGIN_DATABASE_URL="postgres://...neon-origen.../db" \
//   DESTINATION_DATABASE_URL="postgres://...neon-destino.../db" \
//   node scripts/validate-migration.mjs
//
// Nunca hardcodear esas URLs acá ni en ningún archivo commiteado — vienen
// SIEMPRE de variables de entorno, y el script nunca las imprime (ni
// completas ni parciales) en ningún mensaje. Tampoco imprime filas ni datos
// reales de ninguna tabla — solo conteos, hashes agregados y nombres de
// columnas/constraints/migraciones (metadata, no contenido).
//
// La lista de tablas a comparar NO está escrita a mano: se lee
// dinámicamente de los `model X { ... }` de prisma/schema.prisma, así que
// si en el futuro se agregan/renombran modelos, este script los toma solos
// la próxima vez que corra, sin que haga falta tocar este archivo.
//
// "Conteos iguales no demuestran contenido idéntico": además de comparar
// conteos y el conjunto exacto de IDs, este script calcula un hash
// agregado y determinístico del contenido completo de cada tabla (todas
// las columnas, no solo la PK) y compara ese hash entre origen y destino.
// Dos tablas con el mismo conteo y los mismos IDs pero con una sola
// columna distinta en una sola fila producen hashes distintos.

import "dotenv/config";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = path.join(__dirname, "..", "prisma", "schema.prisma");

const MAX_IDS_A_MOSTRAR = 20;

// ---------------------------------------------------------------------
// 0. Validar env vars.
// ---------------------------------------------------------------------
function requireEnvOrExit() {
  const faltantes = [];
  if (!process.env.ORIGIN_DATABASE_URL) faltantes.push("ORIGIN_DATABASE_URL");
  if (!process.env.DESTINATION_DATABASE_URL)
    faltantes.push("DESTINATION_DATABASE_URL");

  if (faltantes.length > 0) {
    console.error(
      "\n❌ Faltan variables de entorno para correr scripts/validate-migration.mjs:\n",
    );
    for (const nombre of faltantes) {
      console.error(`   - ${nombre}`);
    }
    console.error(
      "\nEste script necesita las connection strings de las dos bases (origen y\n" +
        "destino) como variables de entorno — nunca hardcodeadas en el código.\n" +
        "Si todavía no existe una base de datos de destino (por ejemplo, porque\n" +
        "esto es preparación previa a la migración real), es normal que este\n" +
        "script no pueda correr todavía: configurá ambas variables recién cuando\n" +
        "haya un destino real para validar.\n",
    );
    process.exit(1);
  }
}

// ---------------------------------------------------------------------
// 1. Parsear prisma/schema.prisma dinámicamente (nunca una lista a mano).
// ---------------------------------------------------------------------
function parseSchema(schemaText) {
  const modelos = [];
  const modelRegex = /model\s+(\w+)\s*\{([^}]*)\}/g;
  let match;

  while ((match = modelRegex.exec(schemaText)) !== null) {
    const nombreModelo = match[1];
    const cuerpo = match[2];
    const lineas = cuerpo
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith("//"));

    let campoId = null;
    for (const linea of lineas) {
      if (/@id\b/.test(linea)) {
        const m = linea.match(/^(\w+)\s+/);
        if (m) campoId = m[1];
        break;
      }
    }

    const relacionesOpcionales = [];
    const relationLineRegex =
      /^\w+\s+(\w+)\??\s+@relation\(\s*fields:\s*\[(\w+)\]\s*,\s*references:\s*\[(\w+)\]/;

    for (const linea of lineas) {
      const relMatch = linea.match(relationLineRegex);
      if (!relMatch) continue;

      const [, modeloPadre, campoFk, campoPadre] = relMatch;

      const lineaCampoFk = lineas.find((l) =>
        new RegExp(`^${campoFk}\\s+\\S+`).test(l),
      );
      const esOpcional = lineaCampoFk
        ? /^\S+\s+\S+\?/.test(lineaCampoFk)
        : false;

      if (esOpcional) {
        relacionesOpcionales.push({ campoFk, modeloPadre, campoPadre });
      }
    }

    modelos.push({ nombreModelo, campoId, relacionesOpcionales });
  }

  return modelos;
}

// ---------------------------------------------------------------------
// 2. Conexión: pg.Client dedicado (NO pool), con transacción explícita
//    REPEATABLE READ, READ ONLY. Una sola conexión física por base para
//    todo el script — nunca una conexión nueva por consulta.
// ---------------------------------------------------------------------
async function abrirConexionSoloLectura(connectionString, etiqueta) {
  const client = new pg.Client({ connectionString });
  await client.connect();
  await client.query(
    "BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ, READ ONLY;",
  );
  const snapshot = await client.query(
    "SELECT now() AS snapshot_at, current_database() AS database, version() AS version;",
  );
  console.log(
    `${etiqueta}: snapshot tomado a las ${snapshot.rows[0].snapshot_at.toISOString()} ` +
      `(database=${snapshot.rows[0].database})`,
  );
  return client;
}

async function cerrarConexion(client) {
  try {
    await client.query("COMMIT;");
  } catch {
    // solo lectura — si algo falló antes, un ROLLBACK es igual de válido.
    try {
      await client.query("ROLLBACK;");
    } catch {
      // conexión ya rota; no hay nada más que hacer acá.
    }
  } finally {
    await client.end();
  }
}

function toBigIntSeguro(valor) {
  if (valor === null || valor === undefined) return 0n;
  return typeof valor === "bigint" ? valor : BigInt(String(valor));
}

function formatearMuestra(ids) {
  if (ids.length === 0) return "";
  const muestra = ids.slice(0, MAX_IDS_A_MOSTRAR);
  const resto = ids.length - muestra.length;
  return `: ${muestra.join(", ")}${resto > 0 ? ` (+${resto} más)` : ""}`;
}

// ---------------------------------------------------------------------
// 3. Chequeos por tabla: conteo, set de IDs, y hash de contenido completo.
//    Nunca se imprime una fila real — solo conteos, IDs (identificadores
//    opacos generados por cuid(), no datos personales) y hashes agregados.
// ---------------------------------------------------------------------
async function compararTabla(origenClient, destinoClient, modelo) {
  const tabla = modelo.nombreModelo;
  const resultado = { tabla, ok: true, lineas: [] };

  const [conteoOrigenRes, conteoDestinoRes] = await Promise.all([
    origenClient.query(`SELECT count(*)::int AS n FROM "${tabla}";`),
    destinoClient.query(`SELECT count(*)::int AS n FROM "${tabla}";`),
  ]);
  const conteoOrigen = conteoOrigenRes.rows[0].n;
  const conteoDestino = conteoDestinoRes.rows[0].n;

  if (conteoOrigen === conteoDestino) {
    resultado.lineas.push(`✅ Conteo de filas: ${conteoOrigen} en ambas bases.`);
  } else {
    resultado.ok = false;
    resultado.lineas.push(
      `❌ Conteo de filas distinto: origen=${conteoOrigen} destino=${conteoDestino}`,
    );
  }

  if (!modelo.campoId) {
    resultado.lineas.push(
      "   (sin clave primaria detectada — no se compara IDs ni contenido)",
    );
    return resultado;
  }

  const pk = modelo.campoId;

  const [idsOrigenRes, idsDestinoRes] = await Promise.all([
    origenClient.query(`SELECT "${pk}" AS id FROM "${tabla}";`),
    destinoClient.query(`SELECT "${pk}" AS id FROM "${tabla}";`),
  ]);
  const idsOrigen = new Set(idsOrigenRes.rows.map((f) => f.id));
  const idsDestino = new Set(idsDestinoRes.rows.map((f) => f.id));

  const faltanEnDestino = [...idsOrigen].filter((id) => !idsDestino.has(id));
  const sobranEnDestino = [...idsDestino].filter((id) => !idsOrigen.has(id));

  if (faltanEnDestino.length === 0 && sobranEnDestino.length === 0) {
    resultado.lineas.push(`✅ IDs (${pk}): coinciden exactamente.`);
  } else {
    resultado.ok = false;
    if (faltanEnDestino.length > 0) {
      resultado.lineas.push(
        `❌ ${faltanEnDestino.length} ID(s) de origen no están en destino` +
          formatearMuestra(faltanEnDestino),
      );
    }
    if (sobranEnDestino.length > 0) {
      resultado.lineas.push(
        `❌ ${sobranEnDestino.length} ID(s) están en destino pero no en origen` +
          formatearMuestra(sobranEnDestino),
      );
    }
  }

  // Hash determinístico de CONTENIDO completo (todas las columnas, no solo
  // la PK). Conteos e IDs iguales no demuestran contenido idéntico — esto sí.
  const sqlHash = `
    SELECT md5(coalesce(string_agg(md5(t.*::text), '|' ORDER BY t."${pk}"::text), '')) AS hash
    FROM "${tabla}" t;
  `;
  const [hashOrigenRes, hashDestinoRes] = await Promise.all([
    origenClient.query(sqlHash),
    destinoClient.query(sqlHash),
  ]);
  const hashOrigen = hashOrigenRes.rows[0].hash;
  const hashDestino = hashDestinoRes.rows[0].hash;

  if (hashOrigen === hashDestino) {
    resultado.lineas.push(`✅ Contenido completo: hash idéntico.`);
  } else {
    resultado.ok = false;
    resultado.lineas.push(
      `❌ Contenido DISTINTO: el hash de fila no coincide (mismo conteo/IDs no garantiza mismo contenido).`,
    );
  }

  return resultado;
}

// ---------------------------------------------------------------------
// 4. Estructura: columnas/tipos/defaults, índices, constraints.
//    También reducido a hashes — nunca se imprime el detalle completo,
//    solo si coincide o no (y un resumen corto si no coincide).
// ---------------------------------------------------------------------
async function compararEstructuraTabla(origenClient, destinoClient, tabla) {
  const sqlColumnas = `
    SELECT md5(coalesce(string_agg(
      column_name || ':' || data_type || ':' || is_nullable || ':' || coalesce(column_default, '<none>'),
      '|' ORDER BY ordinal_position
    ), '')) AS hash,
    count(*)::int AS total
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = $1;
  `;
  const sqlIndices = `
    SELECT md5(coalesce(string_agg(indexdef, '|' ORDER BY indexname), '')) AS hash,
    count(*)::int AS total
    FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = $1;
  `;
  const sqlConstraints = `
    SELECT md5(coalesce(string_agg(
      constraint_type || ':' || constraint_name, '|' ORDER BY constraint_name
    ), '')) AS hash,
    count(*)::int AS total
    FROM information_schema.table_constraints
    WHERE table_schema = 'public' AND table_name = $1;
  `;

  // pg.Client es una única conexión física — no soporta más de una consulta
  // concurrente sobre el mismo cliente (a diferencia de un Pool). Cada lado
  // corre sus 3 consultas en secuencia; los dos lados sí corren en paralelo
  // entre sí.
  async function leerLadoEstructura(client) {
    const col = await client.query(sqlColumnas, [tabla]);
    const idx = await client.query(sqlIndices, [tabla]);
    const con = await client.query(sqlConstraints, [tabla]);
    return { col, idx, con };
  }

  const [origen, destino] = await Promise.all([
    leerLadoEstructura(origenClient),
    leerLadoEstructura(destinoClient),
  ]);
  const colO = origen.col, idxO = origen.idx, conO = origen.con;
  const colD = destino.col, idxD = destino.idx, conD = destino.con;

  const lineas = [];
  let ok = true;

  if (colO.rows[0].hash === colD.rows[0].hash) {
    lineas.push(`✅ Columnas (${colO.rows[0].total}): idénticas.`);
  } else {
    ok = false;
    lineas.push(
      `❌ Columnas distintas: origen tiene ${colO.rows[0].total}, destino ${colD.rows[0].total} (o mismo conteo con distinto tipo/nombre/default).`,
    );
  }

  if (idxO.rows[0].hash === idxD.rows[0].hash) {
    lineas.push(`✅ Índices (${idxO.rows[0].total}): idénticos.`);
  } else {
    ok = false;
    lineas.push(
      `❌ Índices distintos: origen tiene ${idxO.rows[0].total}, destino ${idxD.rows[0].total}.`,
    );
  }

  if (conO.rows[0].hash === conD.rows[0].hash) {
    lineas.push(`✅ Constraints (${conO.rows[0].total}): idénticos.`);
  } else {
    ok = false;
    lineas.push(
      `❌ Constraints distintos: origen tiene ${conO.rows[0].total}, destino ${conD.rows[0].total}.`,
    );
  }

  return { ok, lineas };
}

// ---------------------------------------------------------------------
// 5. _prisma_migrations: nombre + checksum + estado (finished/rolled_back),
//    no solo el nombre de la migración.
// ---------------------------------------------------------------------
async function compararMigraciones(origenClient, destinoClient) {
  async function leer(client) {
    try {
      return await client.query(
        'SELECT migration_name, checksum, (finished_at IS NOT NULL) AS finished, (rolled_back_at IS NOT NULL) AS rolled_back FROM "_prisma_migrations" ORDER BY migration_name;',
      );
    } catch (error) {
      return null;
    }
  }

  const [origenRes, destinoRes] = await Promise.all([
    leer(origenClient),
    leer(destinoClient),
  ]);

  if (origenRes === null) {
    return {
      ok: false,
      lineas: [
        "❌ No se pudo leer _prisma_migrations en el origen (¿nombre de tabla distinto o base sin migrar?).",
      ],
    };
  }
  if (destinoRes === null) {
    return {
      ok: false,
      lineas: [
        "❌ No se pudo leer _prisma_migrations en el destino todavía.",
      ],
    };
  }

  const filasOrigen = origenRes.rows;
  const filasDestino = destinoRes.rows;

  const claveDe = (f) => `${f.migration_name}:${f.checksum}:${f.finished}:${f.rolled_back}`;
  const setOrigen = new Set(filasOrigen.map(claveDe));
  const setDestino = new Set(filasDestino.map(claveDe));

  const nombresOrigen = new Set(filasOrigen.map((f) => f.migration_name));
  const nombresDestino = new Set(filasDestino.map((f) => f.migration_name));
  const faltanEnDestino = [...nombresOrigen].filter((n) => !nombresDestino.has(n));
  const sobranEnDestino = [...nombresDestino].filter((n) => !nombresOrigen.has(n));

  const lineas = [];
  lineas.push(`Migraciones: origen=${filasOrigen.length} destino=${filasDestino.length}`);

  let ok = true;

  if (faltanEnDestino.length > 0) {
    ok = false;
    lineas.push(`❌ Migraciones en origen pero NO en destino: ${faltanEnDestino.join(", ")}`);
  }
  if (sobranEnDestino.length > 0) {
    ok = false;
    lineas.push(`❌ Migraciones en destino pero NO en origen: ${sobranEnDestino.join(", ")}`);
  }

  const mismaClaveParaTodas =
    setOrigen.size === setDestino.size &&
    [...setOrigen].every((clave) => setDestino.has(clave));

  if (faltanEnDestino.length === 0 && sobranEnDestino.length === 0) {
    if (mismaClaveParaTodas) {
      lineas.push("✅ checksum + estado (finished_at/rolled_back_at) idénticos en todas las migraciones.");
    } else {
      ok = false;
      lineas.push(
        "❌ Los nombres de migración coinciden, pero al menos un checksum o estado (finished/rolled_back) difiere entre origen y destino.",
      );
    }
  }

  return { ok, lineas };
}

// ---------------------------------------------------------------------
// 6. Secuencia de Order.orderNumber — solo lectura, nunca nextval/setval.
// ---------------------------------------------------------------------
async function verificarSecuenciaOrderNumber(destinoClient) {
  const lineas = [];
  let ok = true;

  try {
    const filasSecuencia = await destinoClient.query(
      `SELECT pg_get_serial_sequence('"Order"', 'orderNumber') AS seq;`,
    );
    const nombreSecuencia = filasSecuencia.rows[0]?.seq;

    if (!nombreSecuencia) {
      ok = false;
      lineas.push(
        "❌ No se encontró la secuencia de Order.orderNumber en destino.",
      );
      return { ok, lineas };
    }

    const filasEstado = await destinoClient.query(
      `SELECT last_value, is_called FROM ${nombreSecuencia};`,
    );
    const { last_value, is_called } = filasEstado.rows[0];
    const ultimoValor = toBigIntSeguro(last_value);
    const proximoValor = is_called ? ultimoValor + 1n : ultimoValor;

    const filasMax = await destinoClient.query(
      `SELECT COALESCE(MAX("orderNumber"), 0) AS max FROM "Order";`,
    );
    const maximoOrderNumber = toBigIntSeguro(filasMax.rows[0]?.max);

    lineas.push(
      `Próximo valor de la secuencia en destino: ${proximoValor} | máximo orderNumber existente: ${maximoOrderNumber} | is_called=${is_called}`,
    );

    if (proximoValor > maximoOrderNumber) {
      lineas.push("✅ El próximo valor a generar es mayor al máximo existente.");
    } else {
      ok = false;
      lineas.push(
        "❌ El próximo valor de la secuencia NO es mayor al máximo orderNumber existente — riesgo de colisión futura. Puede hacer falta un setval() manual (fuera del alcance de este script, que es solo de lectura).",
      );
    }
  } catch (error) {
    ok = false;
    lineas.push(`❌ No se pudo verificar la secuencia de Order.orderNumber: ${error.message}`);
  }

  return { ok, lineas };
}

// ---------------------------------------------------------------------
// 7. Filas huérfanas — se compara el conteo en AMBOS lados (no solo
//    destino): si origen ya tenía huérfanos, destino debería tener
//    exactamente los mismos, ni más ni menos.
// ---------------------------------------------------------------------
async function contarHuerfanas(client, modelo, relacion) {
  const filas = await client.query(`
    SELECT COUNT(*)::int AS count
    FROM "${modelo.nombreModelo}" hijo
    WHERE hijo."${relacion.campoFk}" IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM "${relacion.modeloPadre}" padre
        WHERE padre."${relacion.campoPadre}" = hijo."${relacion.campoFk}"
      );
  `);
  return filas.rows[0].count;
}

async function compararHuerfanas(origenClient, destinoClient, modelos) {
  const lineas = [];
  let ok = true;
  let huboRelaciones = false;

  for (const modelo of modelos) {
    for (const relacion of modelo.relacionesOpcionales) {
      huboRelaciones = true;
      const etiqueta = `${modelo.nombreModelo}.${relacion.campoFk} -> ${relacion.modeloPadre}.${relacion.campoPadre}`;
      try {
        const [origenCount, destinoCount] = await Promise.all([
          contarHuerfanas(origenClient, modelo, relacion),
          contarHuerfanas(destinoClient, modelo, relacion),
        ]);
        if (origenCount === destinoCount) {
          lineas.push(`✅ ${etiqueta}: ${destinoCount} huérfana(s) en ambos lados (consistente).`);
        } else {
          ok = false;
          lineas.push(
            `❌ ${etiqueta}: origen=${origenCount} destino=${destinoCount} huérfanas — no coincide.`,
          );
        }
      } catch (error) {
        ok = false;
        lineas.push(`❌ ${etiqueta}: error al verificar (${error.message})`);
      }
    }
  }

  if (!huboRelaciones) {
    lineas.push("(no se detectaron relaciones con clave foránea opcional en el schema)");
  }

  return { ok, lineas };
}

// ---------------------------------------------------------------------
// 8. Inventario de tablas: detecta tablas faltantes o adicionales entre
//    origen y destino, dinámicamente vía information_schema.tables (no
//    depende de la lista de modelos de schema.prisma).
// ---------------------------------------------------------------------
async function compararInventarioTablas(origenClient, destinoClient) {
  const sql = `
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `;
  const [origenRes, destinoRes] = await Promise.all([
    origenClient.query(sql),
    destinoClient.query(sql),
  ]);
  const tablasOrigen = new Set(origenRes.rows.map((r) => r.table_name));
  const tablasDestino = new Set(destinoRes.rows.map((r) => r.table_name));

  const faltanEnDestino = [...tablasOrigen].filter((t) => !tablasDestino.has(t));
  const extraEnDestino = [...tablasDestino].filter((t) => !tablasOrigen.has(t));

  const lineas = [];
  let ok = true;
  lineas.push(`Tablas base en schema public: origen=${tablasOrigen.size} destino=${tablasDestino.size}`);

  if (faltanEnDestino.length > 0) {
    ok = false;
    lineas.push(`❌ Tabla(s) en ORIGEN que NO existen en DESTINO: ${faltanEnDestino.join(", ")}`);
  }
  if (extraEnDestino.length > 0) {
    ok = false;
    lineas.push(`❌ Tabla(s) en DESTINO que NO existen en ORIGEN: ${extraEnDestino.join(", ")}`);
  }
  if (ok) {
    lineas.push("✅ El inventario de tablas coincide exactamente entre origen y destino.");
  }

  return { ok, lineas, tablasOrigen, tablasDestino };
}

// ---------------------------------------------------------------------
// main
// ---------------------------------------------------------------------
async function main() {
  requireEnvOrExit();

  const schemaText = readFileSync(SCHEMA_PATH, "utf-8");
  const modelos = parseSchema(schemaText);

  if (modelos.length === 0) {
    console.error(`❌ No se encontró ningún "model X { ... }" en ${SCHEMA_PATH}.`);
    process.exit(1);
  }

  console.log("=".repeat(72));
  console.log("Validación de migración: base ORIGEN vs. base DESTINO");
  console.log(`Modelos detectados dinámicamente en prisma/schema.prisma: ${modelos.length}`);
  console.log("(las connection strings y el contenido de las filas nunca se imprimen)");
  console.log("=".repeat(72));

  const origenClient = await abrirConexionSoloLectura(
    process.env.ORIGIN_DATABASE_URL,
    "ORIGIN",
  );
  const destinoClient = await abrirConexionSoloLectura(
    process.env.DESTINATION_DATABASE_URL,
    "DESTINATION",
  );

  let huboProblemas = false;

  try {
    console.log(`\n--- Inventario de tablas (origen vs destino) ---`);
    const inventario = await compararInventarioTablas(origenClient, destinoClient);
    for (const linea of inventario.lineas) console.log(`  ${linea}`);
    if (!inventario.ok) huboProblemas = true;

    for (const modelo of modelos) {
      const tabla = modelo.nombreModelo;
      const existeEnOrigen = inventario.tablasOrigen.has(tabla);
      const existeEnDestino = inventario.tablasDestino.has(tabla);

      if (!existeEnOrigen || !existeEnDestino) {
        // Ya se reportó en el inventario de arriba — no repetimos el error
        // ni intentamos consultar una tabla que sabemos que no existe de
        // un lado (eso solo produciría una excepción cruda de Postgres).
        console.log(`\n--- ${tabla}: OMITIDA (falta de un lado, ver inventario arriba) ---`);
        huboProblemas = true;
        continue;
      }

      // Cada modelo se evalúa en su propio try/catch: que UNA tabla falle
      // (por ejemplo con un error real de SQL) no debe cortar la
      // validación completa y dejar sin revisar el resto de las tablas.
      try {
        const resultado = await compararTabla(origenClient, destinoClient, modelo);
        console.log(`\n--- ${resultado.tabla}: datos ---`);
        for (const linea of resultado.lineas) console.log(`  ${linea}`);
        if (!resultado.ok) huboProblemas = true;

        const estructura = await compararEstructuraTabla(
          origenClient,
          destinoClient,
          modelo.nombreModelo,
        );
        console.log(`--- ${modelo.nombreModelo}: estructura ---`);
        for (const linea of estructura.lineas) console.log(`  ${linea}`);
        if (!estructura.ok) huboProblemas = true;
      } catch (error) {
        huboProblemas = true;
        console.log(`\n--- ${tabla}: ERROR ---`);
        console.log(`  ❌ ${error.message}`);
      }
    }

    console.log(`\n--- _prisma_migrations ---`);
    const migraciones = await compararMigraciones(origenClient, destinoClient);
    for (const linea of migraciones.lineas) console.log(`  ${linea}`);
    if (!migraciones.ok) huboProblemas = true;

    console.log(`\n--- Secuencia Order.orderNumber (destino) ---`);
    const secuencia = await verificarSecuenciaOrderNumber(destinoClient);
    for (const linea of secuencia.lineas) console.log(`  ${linea}`);
    if (!secuencia.ok) huboProblemas = true;

    console.log(`\n--- Filas huérfanas (origen vs destino) ---`);
    const huerfanas = await compararHuerfanas(origenClient, destinoClient, modelos);
    for (const linea of huerfanas.lineas) console.log(`  ${linea}`);
    if (!huerfanas.ok) huboProblemas = true;

    console.log("\n" + "=".repeat(72));
    if (huboProblemas) {
      console.log("❌ RESULTADO: hay diferencias o chequeos incompletos — NO declarar la migración válida.");
    } else {
      console.log("✅ RESULTADO: origen y destino coinciden en todos los chequeos (datos, estructura, migraciones, secuencia, huérfanos).");
    }
    console.log("=".repeat(72));
  } catch (error) {
    huboProblemas = true;
    console.error("\n❌ Error inesperado durante la validación (chequeo incompleto, no declarar éxito):");
    console.error(error.message);
  } finally {
    await cerrarConexion(origenClient);
    await cerrarConexion(destinoClient);
  }

  process.exitCode = huboProblemas ? 1 : 0;
}

main().catch((error) => {
  console.error("\n❌ Error inesperado corriendo validate-migration.mjs:");
  console.error(error.message);
  process.exitCode = 1;
});
