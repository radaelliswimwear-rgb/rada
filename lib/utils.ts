import { ReadonlyURLSearchParams } from "next/navigation";
import { getAppEnvironment } from "lib/env/app-environment";

const LOCALHOST_FALLBACK = "http://localhost:3000";

function normalizeAppBaseUrl(raw: string): string {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error(`APP_BASE_URL="${raw}" no es una URL absoluta válida.`);
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(
      `APP_BASE_URL="${raw}" debe usar http o https (recibido: "${parsed.protocol}").`,
    );
  }
  if (getAppEnvironment() === "production" && parsed.protocol !== "https:") {
    throw new Error(`APP_BASE_URL debe usar https en production (recibido: "${raw}").`);
  }
  // Sin barra final -- evita que los consumidores terminen construyendo
  // "https://radaelli.com//ruta" al concatenar.
  return raw.replace(/\/+$/, "");
}

/**
 * URL pública canónica de la app -- fuente única, portable a cualquier
 * hosting (nunca depende de VERCEL_PROJECT_PRODUCTION_URL ni de ningún
 * equivalente propietario). Precedencia:
 *
 *   1. APP_BASE_URL, si está definida -- siempre gana, sin importar el
 *      entorno (así se puede sobreescribir temporalmente con un túnel de
 *      E2E vía process.env, sin tocar .env.local).
 *   2. Sin APP_BASE_URL, en development o test -- fallback a localhost.
 *   3. Sin APP_BASE_URL, en cualquier otro caso (staging, production, o
 *      APP_ENVIRONMENT sin definir) -- falla ruidosamente. Nunca cae a
 *      localhost en silencio fuera de development/test.
 */
export function getAppBaseUrl(): string {
  const explicit = process.env.APP_BASE_URL;
  if (explicit) {
    return normalizeAppBaseUrl(explicit);
  }

  const env = getAppEnvironment();
  if (env === "development" || env === "test") {
    return LOCALHOST_FALLBACK;
  }

  throw new Error(
    "APP_BASE_URL no está definida" +
      (env
        ? ` y APP_ENVIRONMENT="${env}" no permite asumir localhost.`
        : " y APP_ENVIRONMENT tampoco está definida -- no se puede asumir un valor seguro.") +
      " Definí APP_BASE_URL explícitamente (ej. https://radaelliswimwear.com).",
  );
}

export const createUrl = (
  pathname: string,
  params: URLSearchParams | ReadonlyURLSearchParams,
) => {
  const paramsString = params.toString();
  const queryString = `${paramsString.length ? "?" : ""}${paramsString}`;

  return `${pathname}${queryString}`;
};

export const ensureStartsWith = (stringToCheck: string, startsWith: string) =>
  stringToCheck.startsWith(startsWith)
    ? stringToCheck
    : `${startsWith}${stringToCheck}`;

export const validateEnvironmentVariables = () => {
  const requiredEnvironmentVariables = [
    "SHOPIFY_STORE_DOMAIN",
    "SHOPIFY_STOREFRONT_ACCESS_TOKEN",
  ];
  const missingEnvironmentVariables = [] as string[];

  requiredEnvironmentVariables.forEach((envVar) => {
    if (!process.env[envVar]) {
      missingEnvironmentVariables.push(envVar);
    }
  });

  if (missingEnvironmentVariables.length) {
    throw new Error(
      `The following environment variables are missing. Your site will not work without them. Read more: https://vercel.com/docs/integrations/shopify#configure-environment-variables\n\n${missingEnvironmentVariables.join(
        "\n",
      )}\n`,
    );
  }

  if (
    process.env.SHOPIFY_STORE_DOMAIN?.includes("[") ||
    process.env.SHOPIFY_STORE_DOMAIN?.includes("]")
  ) {
    throw new Error(
      "Your `SHOPIFY_STORE_DOMAIN` environment variable includes brackets (ie. `[` and / or `]`). Your site will not work with them there. Please remove them.",
    );
  }
};
