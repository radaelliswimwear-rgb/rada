// Fase 2C del proyecto de staging/pentest (sep. 2026) -- ver
// docs/pentest-architecture.md. Reemplaza la llamada directa a `next
// build` del script "build" de package.json -- Vercel invoca `npm run
// build` tanto para el proyecto `rada-staging` como para cualquier build
// local (`rada` Production NUNCA pasa por acá: su Build Command en
// Vercel llama explícitamente a `production:build`, que sigue invocando
// `next build` DIRECTO, sin tocar este archivo ni depender de él -- ver
// package.json).
//
// Por qué este es el punto de enganche correcto para que Vercel corra
// `prisma migrate deploy`/el seed de staging SIN que nadie tenga que
// extraer DATABASE_URL: un proceso hijo lanzado durante el build de
// Vercel hereda automáticamente el process.env real ya inyectado por la
// plataforma (incluidas las variables de tipo Secret, que SÍ se inyectan
// en tiempo de build/runtime aunque `vercel env pull`/CLI las oculte como
// "[SENSITIVE]" -- confirmado en la Fase 2B de este mismo proyecto). Este
// archivo nunca lee ni imprime DATABASE_URL: solo deja que
// `spawnSync(..., { stdio: "inherit" })` pase el entorno tal cual al
// siguiente proceso.
//
// Ruteo, en dos pasos deliberadamente distintos:
//
// 1. ¿APP_ENVIRONMENT es EXACTAMENTE "staging"? Si no (ausente,
//    "development", "test", o cualquier otro valor -- incluye los
//    Preview branches del proyecto `rada` real, que nunca definen
//    APP_ENVIRONMENT en ese scope, ver auditoría de Fase 1), esto se
//    comporta exactamente igual que el `next build` de siempre: no se
//    agrega NADA. Ningún build fuera de staging cambia de comportamiento
//    por este archivo.
// 2. Si APP_ENVIRONMENT="staging" -- alguien claramente QUISO que este
//    build sea de staging -- se exige TODO lo demás correcto
//    (assertStagingEnvironment: DATABASE_ENV_LABEL, APP_BASE_URL, Wompi,
//    analytics) antes de tocar la base de datos. Fail LOUD, nunca
//    silencioso: un staging mal configurado debe romper el build, no
//    desplegarse a medias sin que nadie lo note.
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { assertStagingEnvironment } from "../lib/env/assert-staging-environment";

export type StagingBuildStep = { label: string; command: string };

// Función PURA -- decide qué pasos correr sin correr nada (ningún
// spawnSync acá), para poder testearla sin lanzar procesos reales. Lee
// process.env directo (mismo criterio que el resto de los guards de este
// proyecto -- lib/analytics/feature-flags.ts, lib/env/assert-staging-environment.ts
// -- nunca cacheado, así que los tests pueden fijarlo/restaurarlo
// libremente). Lanza (mismo comportamiento y mismos mensajes que
// assertStagingEnvironment) si APP_ENVIRONMENT="staging" pero el resto
// del entorno es inconsistente.
export function planStagingAwareBuildSteps(): StagingBuildStep[] {
  if (process.env.APP_ENVIRONMENT !== "staging") {
    return [
      {
        label: "next build (camino normal, sin cambios)",
        command: "next build",
      },
    ];
  }

  // Fail closed ANTES de tocar la base de datos -- ver el comentario
  // largo en lib/env/assert-staging-environment.ts.
  assertStagingEnvironment();

  const steps: StagingBuildStep[] = [
    { label: "prisma migrate deploy", command: "npx prisma migrate deploy" },
  ];

  // STAGING_SEED_ON_BUILD=true es una bandera TEMPORAL a propósito
  // (sección 4 del encargo que originó esto): sin ella, cada build de
  // staging aplica migraciones pero NUNCA siembra datos -- así un
  // redeploy normal (ej. este mismo commit) nunca reintroduce ni duplica
  // el dataset sintético por accidente. seed-staging-pentest.ts ya es
  // idempotente por su cuenta (verificado en la Fase 2A, dos corridas
  // reales contra la base de desarrollo con los mismos ids) -- esta
  // bandera es una capa adicional, no un reemplazo de esa idempotencia:
  // ni siquiera se INTENTA correr el seed salvo que se pida a propósito.
  if (process.env.STAGING_SEED_ON_BUILD === "true") {
    steps.push({
      label: "seed sintético de pentest (STAGING_SEED_ON_BUILD=true)",
      command: "npx tsx scripts/seed-staging-pentest.ts",
    });
  }

  steps.push({
    label: "checker de consistencia de inventario",
    command: "npx tsx scripts/check-inventory-consistency.ts",
  });
  steps.push({ label: "next build", command: "next build" });

  return steps;
}

function runStep(step: StagingBuildStep): void {
  console.log(`\nstaging-aware-build -> ${step.label}...`);
  const result = spawnSync(step.command, { stdio: "inherit", shell: true });
  if (result.error || (result.status ?? 1) !== 0) {
    console.error(
      `staging-aware-build: "${step.label}" falló. Abortando el resto del build.`,
    );
    process.exit(result.status ?? 1);
  }
}

function main(): void {
  let steps: StagingBuildStep[];
  try {
    steps = planStagingAwareBuildSteps();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    console.error(
      "staging-aware-build: entorno de staging inconsistente -- ABORTANDO EL BUILD (fail closed). Nada se tocó todavía.",
    );
    process.exit(1);
    return;
  }

  if (process.env.APP_ENVIRONMENT === "staging") {
    console.log(
      "staging-aware-build: APP_ENVIRONMENT=staging confirmado y validado -- corriendo el flujo de staging.",
    );
  }

  for (const step of steps) runStep(step);
}

// Guarda de punto de entrada: `main()` solo corre cuando este archivo se
// EJECUTA directamente (`tsx scripts/staging-aware-build.ts`, que es como
// lo invoca `npm run build`) -- nunca cuando se IMPORTA (como hace
// staging-aware-build.test.ts para probar planStagingAwareBuildSteps en
// aislado). Sin esto, el solo hecho de importar este módulo en un test
// dispararía un build real de Next.js. fileURLToPath (en vez de comparar
// strings a mano) resuelve separadores de ruta correctamente en Windows.
const isDirectExecution =
  process.argv[1] !== undefined &&
  fileURLToPath(import.meta.url) === process.argv[1];

if (isDirectExecution) {
  main();
}
