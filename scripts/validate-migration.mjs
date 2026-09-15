// scripts/validate-migration.mjs
//
// Valida que una migración de base de datos (Neon origen -> Neon destino)
// haya llevado los datos correctamente, comparando ambas bases en vivo.
//
// PREPARACIÓN — este script está pensado para revisión antes de usarse.
// No se conecta a nada por su cuenta ni corre solo: hace falta invocarlo a
// mano, y solo hace lecturas (nunca escribe ni borra nada en ninguna de las
// dos bases).
//
// Cómo correrlo (cuando la dueña del proyecto lo apruebe):
//
//   ORIGIN_DATABASE_URL="postgres://...neon-origen.../db" \
//   DESTINATION_DATABASE_URL="postgres://...neon-destino.../db" \
//   node scripts/validate-migration.mjs
//
// Nunca hardcodear esas URLs acá ni en ningún archivo commiteado — vienen
// SIEMPRE de variables de entorno, y el script nunca las imprime (ni
// completas ni parciales) en ningún mensaje.
//
// La lista de tablas a comparar NO está escrita a mano: se lee
// dinámicamente de los `model X { ... }` de prisma/schema.prisma, así que
// si en el futuro se agregan/renombran modelos, este script los toma solos
// la próxima vez que corra, sin que haga falta tocar este archivo.

import "dotenv/config";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = path.join(__dirname, "..", "prisma", "schema.prisma");

// Cuántos IDs de diferencia mostrar en detalle por tabla antes de resumir
// solo el total (para no inundar la consola en una tabla grande).
const MAX_IDS_A_MOSTRAR = 20;

// ---------------------------------------------------------------------
// 0. Validar que las dos variables de entorno existan ANTES de tocar
//    Prisma/pg para nada — así, si hoy no existe ninguna base de destino
//    todavía (como es el caso), el script falla con un mensaje claro en
//    vez de un stack trace críptico de conexión.
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
// 1. Parsear prisma/schema.prisma para obtener, de cada `model X { ... }`:
//    - el nombre del modelo (= nombre real de la tabla en Postgres, ya que
//      este proyecto no usa @@map/@map en ningún modelo — confirmado antes
//      de escribir este script).
//    - el nombre del campo marcado @id (la clave primaria), si tiene una.
//    - sus relaciones con clave foránea OPCIONAL (campo escalar `String?`
//      referenciado desde un `@relation(fields: [...], references: [...])`),
//      para el chequeo de filas huérfanas.
//
//    Nunca se hardcodea una lista de tablas ni de relaciones: todo sale de
//    leer el schema real del proyecto en el momento en que el script corre.
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

    // Campo de clave primaria: la primera línea de campo que tenga @id.
    let campoId = null;
    for (const linea of lineas) {
      if (/@id\b/.test(linea)) {
        const m = linea.match(/^(\w+)\s+/);
        if (m) campoId = m[1];
        break;
      }
    }

    // Relaciones con clave foránea opcional: buscamos líneas con
    // @relation(fields: [x], references: [y]) y chequeamos si el campo
    // escalar x está declarado como opcional (con "?") en su propia línea.
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
        relacionesOpcionales.push({
          campoFk,
          modeloPadre,
          campoPadre,
        });
      }
    }

    modelos.push({
      nombreModelo,
      campoId,
      relacionesOpcionales,
    });
  }

  return modelos;
}

// Convierte "Product" -> "product", "OrderItem" -> "orderItem", etc. — es
// exactamente la convención que usa el cliente generado de Prisma para
// exponer cada modelo (prisma.product, prisma.orderItem, ...).
function nombrePropiedadCliente(nombreModelo) {
  return nombreModelo.charAt(0).toLowerCase() + nombreModelo.slice(1);
}

function toBigIntSeguro(valor) {
  if (valor === null || valor === undefined) return 0n;
  return typeof valor === "bigint" ? valor : BigInt(String(valor));
}

// ---------------------------------------------------------------------
// 2. Chequeos individuales
// ---------------------------------------------------------------------

async function compararConteoYIds(origenClient, destinoClient, modelo) {
  const propiedad = nombrePropiedadCliente(modelo.nombreModelo);
  const resultado = {
    tabla: modelo.nombreModelo,
    ok: true,
    lineas: [],
  };

  const delegadoOrigen = origenClient[propiedad];
  const delegadoDestino = destinoClient[propiedad];

  if (
    typeof delegadoOrigen?.count !== "function" ||
    typeof delegadoDestino?.count !== "function"
  ) {
    resultado.ok = false;
    resultado.lineas.push(
      `❌ No se encontró prisma.${propiedad} en el cliente generado — revisar manualmente.`,
    );
    return resultado;
  }

  const [conteoOrigen, conteoDestino] = await Promise.all([
    delegadoOrigen.count(),
    delegadoDestino.count(),
  ]);

  if (conteoOrigen === conteoDestino) {
    resultado.lineas.push(
      `✅ Conteo de filas: ${conteoOrigen} en ambas bases.`,
    );
  } else {
    resultado.ok = false;
    resultado.lineas.push(
      `❌ Conteo de filas distinto: origen=${conteoOrigen} destino=${conteoDestino}`,
    );
  }

  if (!modelo.campoId) {
    resultado.lineas.push(
      "   (sin clave primaria detectada — no se compara el conjunto de IDs)",
    );
    return resultado;
  }

  if (typeof delegadoOrigen.findMany !== "function") {
    resultado.lineas.push(
      "   (no se pudo leer el listado de IDs — revisar manualmente)",
    );
    return resultado;
  }

  const selectId = { [modelo.campoId]: true };
  const [filasOrigen, filasDestino] = await Promise.all([
    delegadoOrigen.findMany({ select: selectId }),
    delegadoDestino.findMany({ select: selectId }),
  ]);

  const idsOrigen = new Set(filasOrigen.map((f) => f[modelo.campoId]));
  const idsDestino = new Set(filasDestino.map((f) => f[modelo.campoId]));

  const faltanEnDestino = [...idsOrigen].filter((id) => !idsDestino.has(id));
  const sobranEnDestino = [...idsDestino].filter((id) => !idsOrigen.has(id));

  if (faltanEnDestino.length === 0 && sobranEnDestino.length === 0) {
    resultado.lineas.push(
      `✅ IDs (${modelo.campoId}): coinciden exactamente entre origen y destino.`,
    );
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

  return resultado;
}

function formatearMuestra(ids) {
  if (ids.length === 0) return "";
  const muestra = ids.slice(0, MAX_IDS_A_MOSTRAR);
  const resto = ids.length - muestra.length;
  return `: ${muestra.join(", ")}${resto > 0 ? ` (+${resto} más)` : ""}`;
}

async function compararMigraciones(origenClient, destinoClient) {
  async function leer(client) {
    try {
      return await client.$queryRawUnsafe(
        'SELECT migration_name FROM "_prisma_migrations" ORDER BY migration_name;',
      );
    } catch (error) {
      return null; // la tabla no existe todavía en esa base
    }
  }

  const [filasOrigen, filasDestino] = await Promise.all([
    leer(origenClient),
    leer(destinoClient),
  ]);

  if (filasOrigen === null) {
    return [
      "❌ No se pudo leer _prisma_migrations en el origen (¿nombre de tabla distinto o base sin migrar?).",
    ];
  }
  if (filasDestino === null) {
    return [
      "❌ No se pudo leer _prisma_migrations en el destino todavía — probablemente falta correr `prisma migrate deploy` contra el destino antes de migrar los datos.",
    ];
  }

  const migracionesOrigen = new Set(filasOrigen.map((f) => f.migration_name));
  const migracionesDestino = new Set(
    filasDestino.map((f) => f.migration_name),
  );

  const faltanEnDestino = [...migracionesOrigen].filter(
    (m) => !migracionesDestino.has(m),
  );
  const sobranEnDestino = [...migracionesDestino].filter(
    (m) => !migracionesOrigen.has(m),
  );

  const lineas = [];
  lineas.push(
    `Migraciones aplicadas: origen=${migracionesOrigen.size} destino=${migracionesDestino.size}`,
  );

  if (faltanEnDestino.length === 0 && sobranEnDestino.length === 0) {
    lineas.push(
      "✅ Destino tiene exactamente las mismas migraciones aplicadas que origen.",
    );
  } else {
    if (faltanEnDestino.length > 0) {
      lineas.push(
        `❌ Migraciones que están en origen pero NO en destino: ${faltanEnDestino.join(", ")}`,
      );
    }
    if (sobranEnDestino.length > 0) {
      lineas.push(
        `❌ Migraciones que están en destino pero NO en origen: ${sobranEnDestino.join(", ")}`,
      );
    }
  }

  return lineas;
}

async function verificarSecuenciaOrderNumber(destinoClient) {
  const lineas = [];

  try {
    const filasSecuencia = await destinoClient.$queryRawUnsafe(
      `SELECT pg_get_serial_sequence('"Order"', 'orderNumber') AS seq;`,
    );
    const nombreSecuencia = filasSecuencia?.[0]?.seq;

    if (!nombreSecuencia) {
      lineas.push(
        "❌ No se encontró la secuencia de Order.orderNumber en destino (¿falta aplicar las migraciones con `prisma migrate deploy`?).",
      );
      return lineas;
    }

    // SELECT directo sobre el objeto secuencia (last_value/is_called) — a
    // propósito NO usamos nextval(), que avanzaría la secuencia de verdad;
    // esto es una validación de solo lectura.
    const filasEstado = await destinoClient.$queryRawUnsafe(
      `SELECT last_value, is_called FROM ${nombreSecuencia};`,
    );
    const { last_value, is_called } = filasEstado[0];
    const ultimoValor = toBigIntSeguro(last_value);
    const proximoValor = is_called ? ultimoValor + 1n : ultimoValor;

    const filasMax = await destinoClient.$queryRawUnsafe(
      `SELECT COALESCE(MAX("orderNumber"), 0) AS max FROM "Order";`,
    );
    const maximoOrderNumber = toBigIntSeguro(filasMax[0]?.max);

    lineas.push(
      `Próximo valor de la secuencia en destino: ${proximoValor} | máximo orderNumber existente en destino: ${maximoOrderNumber}`,
    );

    if (proximoValor > maximoOrderNumber) {
      lineas.push(
        "✅ El próximo valor a generar es mayor al máximo existente (no habrá colisión de orderNumber).",
      );
    } else {
      lineas.push(
        "❌ El próximo valor de la secuencia NO es mayor al máximo orderNumber existente — el próximo pedido creado en destino podría chocar con un orderNumber ya restaurado. Puede hacer falta un `setval()` manual sobre la secuencia (fuera del alcance de este script, que es solo de lectura).",
      );
    }
  } catch (error) {
    lineas.push(
      `❌ No se pudo verificar la secuencia de Order.orderNumber: ${error.message}`,
    );
  }

  return lineas;
}

async function buscarFilasHuerfanas(destinoClient, modelos) {
  const lineas = [];
  let huboHuerfanas = false;

  for (const modelo of modelos) {
    for (const relacion of modelo.relacionesOpcionales) {
      const etiqueta = `${modelo.nombreModelo}.${relacion.campoFk} -> ${relacion.modeloPadre}.${relacion.campoPadre}`;
      try {
        const filas = await destinoClient.$queryRawUnsafe(`
          SELECT COUNT(*)::int AS count
          FROM "${modelo.nombreModelo}" hijo
          WHERE hijo."${relacion.campoFk}" IS NOT NULL
            AND NOT EXISTS (
              SELECT 1 FROM "${relacion.modeloPadre}" padre
              WHERE padre."${relacion.campoPadre}" = hijo."${relacion.campoFk}"
            );
        `);
        const cantidad = filas[0]?.count ?? 0;
        if (cantidad === 0) {
          lineas.push(`✅ ${etiqueta}: 0 filas huérfanas.`);
        } else {
          huboHuerfanas = true;
          lineas.push(`❌ ${etiqueta}: ${cantidad} fila(s) huérfana(s).`);
        }
      } catch (error) {
        huboHuerfanas = true;
        lineas.push(`❌ ${etiqueta}: error al verificar (${error.message})`);
      }
    }
  }

  if (lineas.length === 0) {
    lineas.push(
      "(no se detectaron relaciones con clave foránea opcional en el schema para revisar)",
    );
  }

  return { lineas, huboHuerfanas };
}

// ---------------------------------------------------------------------
// main
// ---------------------------------------------------------------------
async function main() {
  requireEnvOrExit();

  const schemaText = readFileSync(SCHEMA_PATH, "utf-8");
  const modelos = parseSchema(schemaText);

  if (modelos.length === 0) {
    console.error(
      `❌ No se encontró ningún "model X { ... }" en ${SCHEMA_PATH}. ¿Cambió el formato del schema?`,
    );
    process.exit(1);
  }

  const origenAdapter = new PrismaPg({
    connectionString: process.env.ORIGIN_DATABASE_URL,
  });
  const destinoAdapter = new PrismaPg({
    connectionString: process.env.DESTINATION_DATABASE_URL,
  });
  const origenPrisma = new PrismaClient({ adapter: origenAdapter });
  const destinoPrisma = new PrismaClient({ adapter: destinoAdapter });

  let huboProblemas = false;

  try {
    console.log("=".repeat(72));
    console.log("Validación de migración: base ORIGEN vs. base DESTINO");
    console.log(
      `Tablas detectadas dinámicamente en prisma/schema.prisma: ${modelos.length}`,
    );
    console.log(
      "(las connection strings nunca se imprimen en este reporte)",
    );
    console.log("=".repeat(72));

    for (const modelo of modelos) {
      const resultado = await compararConteoYIds(
        origenPrisma,
        destinoPrisma,
        modelo,
      );
      console.log(`\n--- ${resultado.tabla} ---`);
      for (const linea of resultado.lineas) console.log(`  ${linea}`);
      if (!resultado.ok) huboProblemas = true;
    }

    console.log(`\n--- _prisma_migrations ---`);
    const lineasMigraciones = await compararMigraciones(
      origenPrisma,
      destinoPrisma,
    );
    for (const linea of lineasMigraciones) console.log(`  ${linea}`);
    if (lineasMigraciones.some((l) => l.startsWith("❌"))) {
      huboProblemas = true;
    }

    console.log(`\n--- Secuencia Order.orderNumber (destino) ---`);
    const lineasSecuencia = await verificarSecuenciaOrderNumber(destinoPrisma);
    for (const linea of lineasSecuencia) console.log(`  ${linea}`);
    if (lineasSecuencia.some((l) => l.startsWith("❌"))) {
      huboProblemas = true;
    }

    console.log(`\n--- Filas huérfanas (solo destino) ---`);
    const { lineas: lineasHuerfanas, huboHuerfanas } =
      await buscarFilasHuerfanas(destinoPrisma, modelos);
    for (const linea of lineasHuerfanas) console.log(`  ${linea}`);
    if (huboHuerfanas) huboProblemas = true;

    console.log("\n" + "=".repeat(72));
    if (huboProblemas) {
      console.log("❌ RESULTADO: hay diferencias que revisar (ver arriba).");
    } else {
      console.log(
        "✅ RESULTADO: origen y destino coinciden en todos los chequeos.",
      );
    }
    console.log("=".repeat(72));
  } finally {
    await origenPrisma.$disconnect();
    await destinoPrisma.$disconnect();
  }

  process.exitCode = huboProblemas ? 1 : 0;
}

main().catch((error) => {
  console.error("\n❌ Error inesperado corriendo validate-migration.mjs:");
  console.error(error);
  process.exitCode = 1;
});
