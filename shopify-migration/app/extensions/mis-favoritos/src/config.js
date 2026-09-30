/**
 * Configuración de la extensión "Mis favoritos".
 *
 * BACKEND_URL = application_url de la app (host de la función, sin barra
 * final). Es un PLACEHOLDER: se reemplaza al desplegar, cuando exista el
 * hosting (paso de la dueña). Con el placeholder, "Quitar" muestra un error
 * y no llama a nada.
 */
export const BACKEND_URL = "https://REEMPLAZAR-host-de-la-funcion.example";

/** Versión fijada de la Customer Account API y de la Storefront API (diseño § 4). */
export const CUSTOMER_ACCOUNT_API_VERSION = "2026-07";
export const STOREFRONT_API_VERSION = "2026-07";

/** Timeout de las llamadas a la función (igual que el transporte de la tienda, R5). */
export const BACKEND_TIMEOUT_MS = 10000;

/** true solo si la URL es https, sin ruta, y no es el placeholder. */
export function isConfiguredBackend(url) {
  if (typeof url !== "string" || !/^https:\/\/[a-z0-9.-]+(:[0-9]{1,5})?$/i.test(url)) return false;
  return !/REEMPLAZAR|PLACEHOLDER|\.example$/i.test(url);
}
