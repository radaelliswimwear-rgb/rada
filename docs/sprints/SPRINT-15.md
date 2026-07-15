# Sprint 15 — Gestión profesional de imágenes con Cloudinary

## Objetivo

Reemplazar la carga manual de URLs en el formulario de productos del Panel Administrativo por una integración real con Cloudinary: subida múltiple por drag & drop o selector de archivos, vista previa inmediata, imagen principal, reordenamiento, reemplazo, y borrado automático en Cloudinary al quitar una imagen o eliminar un producto — manteniendo compatibilidad total con los productos ya sembrados (Unsplash) y sin tocar la arquitectura existente (Repository Pattern, Server Actions, Prisma/Postgres).

## Prerrequisito del Sprint 14 revisado

Se releyeron `PROJECT.md`, `ARCHITECTURE.md`, `DATABASE.md`, `API.md`, `ROADMAP.md`, `HANDOFF.md` y `SPRINT-14.md`. El único pendiente del Sprint 14 relevante para este era exactamente "Integrar Cloudinary" (el resto — entrada en Navbar, sesión server-side, CRUD completo de categorías — no afecta a este sprint y se deja como estaba). No hizo falta resolver ningún otro prerrequisito antes de empezar.

## Qué se implementó

- **`ProductImage.publicId`** (nuevo campo, `String?`, migración `20260716090000_add_product_image_public_id`, aplicada contra la base Neon real) — `null` para las imágenes sembradas desde Unsplash (`lib/placeholder-data.ts`, que nunca vivieron en Cloudinary), y con el `public_id` real solo en las imágenes subidas desde el panel. Esto es lo que permite borrar en Cloudinary exactamente las imágenes correctas sin tocar las de Unsplash.
- **`lib/cloudinary/`** (nuevo dominio):
  - `client.ts` — singleton de configuración (`cloudinary.config(...)`) leyendo `CLOUDINARY_CLOUD_NAME`/`CLOUDINARY_API_KEY`/`CLOUDINARY_API_SECRET` (sin prefijo `NEXT_PUBLIC_`, o sea nunca llegan al cliente); falla rápido con un mensaje claro si falta alguna, mismo criterio que `lib/prisma.ts`.
  - `types.ts` — `MAX_IMAGE_BYTES` (5 MB), `ALLOWED_IMAGE_TYPES` (`jpeg`/`png`/`webp`/`gif`), tipos de resultado.
  - `upload-actions.ts` (`"use server"`) — `uploadProductImageAction(formData)`: valida tipo/tamaño **también server-side** (nunca se confía solo en la validación del navegador), sube el archivo a la carpeta `lago/products` vía `cloudinary.uploader.upload_stream`, devuelve `{success, url, publicId, width, height}` o un error legible. `deleteCloudinaryAssetAction(publicId)`: borrado best-effort (`cloudinary.uploader.destroy`), logueado pero no bloqueante si falla.
  - `cloudinary-repository.ts` — adaptador, mismo patrón que el resto de `lib/*/`.
- **`lib/admin/types.ts`** — `AdminProductImage = { url: string; publicId: string | null }`; `AdminProduct.images` y `AdminProductInput.images` pasan de `string[]` a `AdminProductImage[]`.
- **`lib/admin/products-actions.ts`** (Sprint 14, ahora extendido):
  - `toAdminProduct` mapea `publicId` además de `url`.
  - `createProductAction` guarda `publicId` junto con `url`/`position` en cada `ProductImage`.
  - `updateProductAction` calcula, **antes** de tocar Postgres, qué `publicId` existentes ya no están en la lista nueva (reemplazados o quitados), aplica el `update` (mismo `deleteMany`+`create` de imágenes que ya existía, solo que ahora también persiste `publicId`), y **después** de que Postgres confirme el cambio, borra esos assets en Cloudinary (`cleanupRemovedCloudinaryAssets`, best-effort con `Promise.allSettled`). El orden importa: nunca se borra en Cloudinary antes de confirmar el guardado en la base.
  - `deleteProductAction` lee los `publicId` del producto antes de borrarlo, borra el producto (cascada ya elimina las filas `ProductImage`), y recién después limpia esos assets en Cloudinary.
- **`components/admin/product-image-manager.tsx`** (nuevo, reemplaza el textarea de URLs del Sprint 14):
  - Drop zone (drag & drop) + selector de archivos con `multiple`.
  - Cada archivo soltado o seleccionado se sube a Cloudinary **de inmediato** (no recién al guardar el producto) para poder mostrar la miniatura real como vista previa; mientras sube se ve un placeholder con el `blob:` local (`URL.createObjectURL`) y un overlay "Subiendo...".
  - Grid de miniaturas con: badge "Principal" en la primera, flechas `←`/`→` para reordenar, botón "Hacer principal" (mueve al frente), "Reemplazar" (sube un archivo nuevo en el mismo lugar y borra el anterior en Cloudinary si tenía `publicId`), "Eliminar" (saca la imagen y, si ya estaba subida, la borra en Cloudinary — evita huérfanos de imágenes subidas pero nunca guardadas en un producto).
  - Validación de tipo/tamaño también en el cliente, con `toast` por archivo rechazado (usando `sonner`, igual que el resto del panel).
  - Usa `<img>` nativo para las miniaturas, no `next/image`: mientras un archivo sube, el preview es un `blob:` URL local que `next/image` no puede servir (exige rutas locales o `remotePatterns` http/https). El resto de la tienda (galería, catálogo, home) sigue usando `next/image` sin cambios — esto es solo la miniatura de edición del panel, no la entrega optimizada al visitante final.
- **`components/admin/product-form.tsx`** — el textarea `imagesText` se reemplaza por el estado `images: AdminProductImage[]` y el componente `<ProductImageManager />`; el resto del formulario (nombre, slug, categoría, precio, color, descripción, tallas, destacado) no cambió.
- **`next.config.ts`** — se agregó `res.cloudinary.com` a `images.remotePatterns` (para que `next/image` sirva las imágenes ya guardadas en la ficha de producto/catálogo/home) y `experimental.serverActions.bodySizeLimit: "6mb"` (el límite por defecto de Next.js para Server Actions es 1 MB, insuficiente para subir imágenes de hasta 5 MB).
- **`.env.example`** — se documentaron `CLOUDINARY_CLOUD_NAME`/`CLOUDINARY_API_KEY`/`CLOUDINARY_API_SECRET` (nombres de variable únicamente, sin valores — las credenciales reales ya estaban configuradas en `.env` y en Hostinger antes de este sprint, no se tocaron ni se expusieron).

## Decisiones técnicas

- **Compatibilidad total con `ProductImage` existente**: se agregó una columna opcional (`publicId String?`), no se modificó `url` ni `position`, y las 20 imágenes sembradas desde Unsplash siguen funcionando exactamente igual (con `publicId: null`) — se pueden reordenar, quitar o reemplazar desde el panel sin romper nada; simplemente no disparan un borrado en Cloudinary porque nunca vivieron ahí.
- **Subida inmediata, no diferida al guardar el producto**: se decidió subir cada imagen a Cloudinary apenas se suelta/selecciona (en vez de guardar los `File` en el estado del formulario y subirlos recién al hacer submit) para poder cumplir "vista previa antes de guardar" con la imagen real (no un ícono genérico) y para que "reemplazar"/"eliminar" puedan limpiar Cloudinary de inmediato sin depender de que el usuario efectivamente guarde el producto después.
- **Optimización, lazy loading y responsive images**: no se construyó nada nuevo para esto — ya era una capacidad existente de `next/image` (usada sin cambios en `components/product/gallery.tsx`, `components/catalog/*`, `components/home/*`) combinada con `images.formats: ["image/avif", "image/webp"]` (ya configurado desde antes de este sprint). Al agregar `res.cloudinary.com` a `remotePatterns`, las imágenes subidas por el panel obtienen automáticamente el mismo `srcset` responsive, lazy loading (`loading="lazy"` por defecto) y negociación de formato AVIF/WebP que ya tenían las de Unsplash — no hizo falta código nuevo para esto, solo habilitar el dominio.
- **Borrado best-effort, nunca bloqueante**: si Cloudinary falla al borrar un asset (red, credenciales, etc.), se loguea el error pero la operación principal sobre Postgres (guardar o eliminar el producto) ya se completó y no se revierte. La alternativa — hacerlo transaccional con Postgres — no es posible porque Cloudinary no participa de una transacción SQL; el criterio "mejor una imagen húérfana en Cloudinary que un producto que no se pudo guardar" es el mismo espíritu que ya regía el manejo de errores del resto del panel.
- **Setstate entre componentes**: se encontró y corrigió durante la verificación un bug real (no una decisión, un error) donde `ProductImageManager` llamaba a la función `onChange` del padre (`ProductForm`) **dentro** del callback funcional de `setImages`, lo que React marca como inseguro ("Cannot update a component while rendering a different component"). Se corrigió computando el valor primero y notificando al padre después, fuera del updater — ver el código de `addFiles`/`onReplaceFileChange`.

## Verificación

`npx tsc --noEmit` limpio. `npm run build` limpio (55/55 páginas). Verificación manual en navegador contra la base Neon real:

- **Carga múltiple + drag & drop**: se simuló la selección de dos archivos PNG generados en el propio navegador (ya que el entorno de agente no tiene acceso a un selector de archivos real) contra el input oculto — ambos entraron al flujo de subida correctamente y sin errores de React.
- **Bug de React corregido y verificado**: antes de la corrección, el warning "Cannot update a component while rendering a different component" aparecía en cada carga; después de corregirlo, una carga completa (éxito o fallo) no genera ningún error en consola.
- **Reordenamiento e imagen principal, sobre un producto real ya sembrado** (`abrigo-oversize-lana`): se movió la segunda imagen a principal con "Hacer principal", se guardó, y se confirmó en `/producto/abrigo-oversize-lana` que la ficha pública ahora muestra esa imagen primero (con su `srcset` de `next/image` intacto); se revirtió el orden al terminar.
- **Responsive**: el formulario con el gestor de imágenes se probó en viewport 375×812 (mobile) — se apila correctamente, sin overflow.
- **Manejo de errores confirmado en un caso real**: el valor de `CLOUDINARY_CLOUD_NAME` configurado en este entorno resultó no ser un `cloud_name` válido de Cloudinary (la API respondió `401 Invalid cloud_name`). Esto permitió verificar en vivo que el camino de error funciona como debía: el servidor logueó el fallo, la Server Action devolvió `{success:false, error}`, el cliente mostró el `toast` correspondiente, no quedó ninguna miniatura rota en el formulario, y no se guardó ningún dato corrupto en Postgres. **No se pudo verificar una subida exitosa real contra Cloudinary en este entorno** por esta razón — es un problema de configuración de la credencial, no del código (ver "Pendiente que requiere acción externa" abajo).

## Pendiente que requiere acción externa (no se tocó, no se puede resolver desde el código)

`CLOUDINARY_CLOUD_NAME` en `.env` de este entorno no es un nombre de cloud válido — Cloudinary devuelve `401 Invalid cloud_name` en cada intento de subida. `CLOUDINARY_API_KEY` y `CLOUDINARY_API_SECRET` sí tienen el formato esperado (15 y 27 caracteres respectivamente). No se modificó ni se intentó adivinar el valor correcto: haría falta que quien administra la cuenta de Cloudinary confirme el `cloud_name` real (visible en el dashboard de Cloudinary, arriba a la izquierda) y lo actualice en `.env` y en las variables de entorno de Hostinger. El resto de la integración (código, migración, UI) está completo y listo para funcionar en cuanto ese valor sea correcto.

## Qué quedó para después

- Verificar una subida real una vez corregido `CLOUDINARY_CLOUD_NAME`.
- Reordenamiento por arrastre directo de las miniaturas (hoy: botones `←`/`→` y "Hacer principal") — se evaluó usar una librería de drag-and-drop, pero se priorizó no sumar una dependencia nueva para esto; los botones cubren el mismo resultado.
- Transformaciones Cloudinary explícitas en la URL (`f_auto,q_auto`, recortes por variante) — hoy la optimización de formato/tamaño corre enteramente por `next/image`, que ya cubre el requisito; añadir transformaciones del lado de Cloudinary sería una optimización adicional, no un pendiente bloqueante.
- El resto de los pendientes ya documentados en [ROADMAP.md](../ROADMAP.md) (entrada del panel en el Navbar, sesión server-side, CRUD completo de categorías, etc.) no cambiaron en este sprint.
