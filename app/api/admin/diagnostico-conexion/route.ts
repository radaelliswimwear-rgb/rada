import { NextResponse } from "next/server";
import { requireAdmin } from "lib/auth/authorize";
import { prisma } from "lib/prisma";

// Diagnóstico de identidad de conexión — de solo lectura, para uso manual
// durante un corte de base de datos coordinado. Nunca imprime la
// connection string ni ninguna credencial; solo el endpoint de Neon
// (metadato no secreto, visible igual en el panel "Connect" de Neon) y el
// nombre de la base.
//
// Reutiliza requireAdmin() (la misma sesión de servidor que protege todo
// /admin) en vez de inventar un token nuevo: agregar un segundo secreto acá
// sería una superficie más para rotar y filtrar, sin sumar seguridad real
// sobre una sesión de administradora ya verificada contra la base.
//
// No cachea nunca (force-dynamic + revalidate 0 + Cache-Control: no-store)
// y nunca incluye el mensaje real de una excepción en la respuesta — los
// errores se loguean server-side (Vercel) y el cliente recibe siempre el
// mismo mensaje genérico.
export const dynamic = "force-dynamic";
export const revalidate = 0;

function endpointNormalizado(connectionString: string): string {
  const host = new URL(connectionString).hostname;
  // ep-nombre-id[-pooler].region.proveedor.tech -> ep-nombre-id (una
  // conexión pooled y su equivalente directa son el mismo endpoint).
  const primerSegmento = host.split(".")[0] ?? host;
  return primerSegmento.replace(/-pooler$/, "");
}

const NO_STORE = { "Cache-Control": "no-store" } as const;

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "No autorizado." }, { status: 401, headers: NO_STORE });
  }

  const declaredConnectionString = process.env.DATABASE_URL;
  if (!declaredConnectionString) {
    console.error("Diagnóstico de conexión: DATABASE_URL no está definida.");
    return NextResponse.json(
      { error: "No se pudo completar el diagnóstico." },
      { status: 500, headers: NO_STORE },
    );
  }

  try {
    const declared = { endpoint: endpointNormalizado(declaredConnectionString) };

    // "Efectivo": una consulta real a través del MISMO cliente Prisma que
    // usa el resto de la app (lib/prisma.ts), no una conexión nueva armada
    // acá con el string recién leído. Esto prueba que el cliente
    // compartido está vivo y respondiendo — no solo que la variable de
    // entorno contiene un valor con el formato esperado. Leer DATABASE_URL
    // por sí solo no demuestra que el cliente activo use esa conexión;
    // este chequeo sí pasa por ese cliente activo.
    const rows = await prisma.$queryRaw<{ db: string }[]>`SELECT current_database() AS db`;

    return NextResponse.json(
      {
        declared,
        effective: {
          respondedAtUtc: new Date().toISOString(),
          database: rows[0]?.db ?? null,
        },
        nota:
          "Este resultado describe unicamente este despliegue, en este momento. " +
          "No permite saber que conexion usaba ningun despliegue anterior que no " +
          "incluyera este mismo diagnostico.",
      },
      { headers: NO_STORE },
    );
  } catch (error) {
    console.error("Diagnóstico de conexión: error inesperado", error);
    return NextResponse.json(
      { error: "No se pudo completar el diagnóstico." },
      { status: 500, headers: NO_STORE },
    );
  }
}
