# 03F — Importación y prueba de redirecciones (Development Store)

- **Fecha:** 2026-09-29, ≈ 14:40–14:50 (Bogotá). Tienda `radaelli-swimwear-dev`.
- **Acción:** Admin > Contenido > Menús > "Redireccionamientos de URL" > "Importar redireccionamientos de URL" con `seo/shopify-redirects-import.csv`.
- **Alcance:** solo la Development Store. No toca Producción, DNS ni el theme. Es **reversible** (§ 5).

## 1. Resultado de la importación

| Chequeo | Resultado |
|---|---|
| Redirecciones antes de importar | **0** (lista vacía → sin conflictos ni duplicados posibles) |
| Filas leídas por Shopify | **47** ("Tu importación contiene 47 redireccionamientos") |
| Vista previa | Correcta: `/oasis-natural → /collections/oasis-natural`, etc. |
| Errores de formato | **Ninguno** (encabezado exacto `Redirect from,Redirect to`) |
| Resultado | **"Importación completada: se han agregado 47 redireccionamientos"** |

## 2. Prueba de las 47 (en vivo, con `fetch` desde el storefront)

| Grupo | Filas | Resultado |
|---|---|---|
| 4 colecciones (`/oasis-natural`…) | 4 | ✅ redirigen a `/collections/…`, 200 |
| 29 productos (`/producto/<handle>`) | 29 | ✅ redirigen a `/products/<handle>`, 200 |
| `/devoluciones`, `/garantia` | 2 | ✅ → `/policies/refund-policy`, `/pages/garantia`, 200 |
| `/buscar`, `/favoritos`, `/cuenta/favoritos` | 3 | ✅ → `/search`, `/pages/favoritos`, 200 |
| **Subtotal con destino final verificado** | **38** | **38/38 en el destino exacto del CSV, status 200** |
| `/cuenta`, `/cuenta/pedidos|perfil|direcciones` y 5 rutas de acceso (`iniciar-sesion`, `registro`, `recuperar-contrasena`, `restablecer-contrasena`, `verificar-email`) | 9 | ✅ **la redirección existe** (`opaqueredirect`, igual que el control `/account`) |

**Por qué los 9 de cuenta no se siguen hasta el final con `fetch`:**
- `/account` de Shopify redirige a `shopify.com/authentication/…` (otro dominio), y `fetch` no puede leerlo por CORS. Es el mismo comportamiento de `/account` directamente.
- **Control negativo:** `/cuenta-inexistente-xyz` devuelve **404** con `fetch` normal. Solo las 9 rutas importadas responden como redirección.
- Es una cadena de 2 saltos por diseño de Shopify (`/cuenta → /account → login`), no un bucle. Sigue el mismo camino que ya tenía `/cuenta` en el sitio actual (que también terminaba en un login).

## 3. Dudas de 03E resueltas

| Duda (03E) | Resultado medido |
|---|---|
| ¿"Redirect from" distingue mayúsculas? | **No.** `/producto/costa-esmeralda-azul` (minúsculas) redirige aunque el CSV tenga `COSTA-ESMERALDA-AZUL`. Ambas variantes van a `/products/costa-esmeralda-azul`. Eso también cubre el handle histórico en mayúsculas del sitio actual |
| ¿Conserva el query? | **Sí.** `/buscar?q=bikini` → `/search?q=bikini`. `/producto/bikini-foam?utm_source=x` → `/products/bikini-foam?utm_source=x` |
| ¿Barra final? | **Sí.** `/oasis-natural/` → `/collections/oasis-natural` |
| Bucles / cadenas | **0 bucles.** Todos los destinos finales coinciden con el destino del CSV (si un destino redirigiera de nuevo, el final sería distinto) |
| Código HTTP exacto | **NOT_VERIFIED** con `fetch` (no expone el código de una redirección). Shopify documenta las redirecciones de URL como permanentes (301); confirmar con `curl -I` desde el terminal cuando se publique |

## 4. Pendiente (no es de esta importación)

- **4 redirecciones legales** (`/envios`, `/terminos`, `/privacidad`, `/cookies`): quedan "legal redirect pending" hasta que existan sus páginas (owner-only). Al crearlas se agregan 4 filas.
- **Al publicar:** el dominio real cambia (no es un cambio de rutas). Las redirecciones se conservan; se vuelve a probar con `curl -I https://<dominio>/producto/bikini-foam`.
- **Redirecciones de la tienda comercial:** esta importación es de la Dev Store. Si la tienda de venta es otra, se repite la importación con el mismo CSV (1 minuto).

## 5. Rollback

Admin > Contenido > Menús > Redireccionamientos de URL > seleccionar todas > "Eliminar". Vuelve a 0 sin afectar productos, colecciones ni el theme.
