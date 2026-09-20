import { getAppEnvironment } from "lib/env/app-environment";

// Fase 2A del proyecto de staging/pentest (sep. 2026): Cloudinary hoy
// comparte la MISMA cuenta entre Production y cualquier otro entorno --
// no se crea una cuenta nueva para staging (ver docs/pentest-architecture.md,
// sección Cloudinary). Lo único que separa dónde caen los assets subidos
// es esta carpeta: prefijo "staging/" SOLO cuando APP_ENVIRONMENT es
// exactamente "staging" -- en production/development/test/ausente, el
// comportamiento queda idéntico al que ya existía (ninguna carpeta actual
// se mueve ni se renombra).
export function resolveCloudinaryFolder(baseFolder: string): string {
  if (getAppEnvironment() === "staging") {
    return `staging/${baseFolder}`;
  }
  return baseFolder;
}
