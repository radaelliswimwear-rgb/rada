# 06 — Editar el tema sin romper nada

Para: Daniela. "Tema" = el diseño de tu tienda. El tema de Radaelli se llama **Radaelli RC1.10** (hecho a medida, con código propio).

## 1. Estado al escribir (leído en la tienda el 2026-10-02)
| Tema | Estado |
|---|---|
| Horizon (de fábrica de Shopify) | Publicado (la tienda está con contraseña) |
| Radaelli RC1.10 | Sin publicar. Se publica el día del lanzamiento |
Después del lanzamiento, Horizon queda sin publicar: **no lo borres**. Es tu último recurso (sin la marca).

## 2. Regla de oro: siempre trabaja en una COPIA
1. Admin > Tienda online > Temas.
2. En el tema publicado pulsa los tres puntos "..." (Acciones) > **Duplicar**.
3. Ponle nombre: `Radaelli RC1.10 copia 2026-10-15` (fecha de hoy).
4. En la copia pulsa **Personalizar** y haz tus cambios.
5. Pulsa **Vista previa** y revisa en celular (sección 6).
6. Si todo está bien: en la copia > **Publicar**. El tema anterior queda sin publicar: déjalo 7 días como respaldo.
7. Borra copias viejas cuando haya más de 5.

Excepción: un cambio de texto de 1 línea (barra de anuncio) puedes hacerlo directo, pero solo después de tener la copia de respaldo.

## 3. Qué SÍ puedes tocar en el editor
Tienda online > Temas > Personalizar:
- Textos de las secciones: barra de anuncio, banner promocional, títulos y botones de la página de inicio.
- Imágenes y videos que el editor te deja cambiar (formato JPG/PNG/WebP, peso razonable).
- Colores y tipografía: "Configuración del tema" (Brand/Typography/Colors). Mantén contraste alto: letra oscura sobre fondo claro y viceversa.
- Enlaces de redes sociales (Instagram, Facebook, TikTok, WhatsApp).
- Menús (Contenido > Menús) y contenido de Páginas.
- Mostrar/ocultar: ícono de favoritos y de cuenta, filtros de colección.
- Orden de secciones de la página de inicio (arrastrar): no elimines secciones; "ocultar" es más seguro que borrar.

## 4. Qué NO debes tocar
- **"Editar código"** (el editor de archivos): nunca.
- Borrar o duplicar secciones dentro de "Header group" y "Footer group" (el encabezado y la barra se rompen).
- Los interruptores de envío gratis y de favoritos de cuenta (grupo "Cart" y "Wishlist") sin leer el documento 05, sección 8. "Sincronizar favoritos con la cuenta" debe quedar APAGADO (la app de favoritos no está instalada).
- Cambiar plantillas (Template) de producto, colección, carrito.
- Instalar aplicaciones que se inserten en el tema ("app embeds") sin preguntar.
- Cambiar el idioma o archivos de traducción.
- Cambiar la plantilla de la página **Favoritos**: debe tener la plantilla "wishlist" (`CONFIRMAR_EN_ADMIN`: se asigna después de publicar el tema, en Tienda online > Páginas > Favoritos > Plantilla).
- Publicar un tema que no sea RC1.10 o una copia de RC1.10.

## 5. Si algo se rompió: restaurar RC1.10
Sin mover tu tienda de dominio ni pedidos. Elige la más sencilla disponible:

**A. Publicar una copia sana (1 minuto).** En Temas busca "Radaelli RC1.10 copia/respaldo" (la anterior que dejaste) > Publicar.
Recomendado: el día del lanzamiento deja una copia llamada **"Radaelli RC1.10 RESPALDO CONGELADO"** y no la edites nunca (GAP-02).

**B. Subir el ZIP del respaldo (10 minutos, sin código).**
1. Descarga el ZIP: GitHub > repositorio `radaelliswimwear-rgb/rada` > rama `shopify-migration-backup` > carpeta `shopify-migration/dist/` > `radaelli-shopify-theme-rc1.10.zip` > "Download raw file" (necesitas iniciar sesión en GitHub: `PENDIENTE_DUEÑA`).
2. Verifica el archivo. Debe pesar 178.702 bytes y tener este SHA-256:
   `e0f67590e29029f1d90bc79a1675f72b2e129aa4d40323e9d090e927be52410c`
   En Windows: Símbolo del sistema > `certutil -hashfile "ruta\del\archivo.zip" SHA256`.
3. Admin > Tienda online > Temas > Agregar tema > **Subir archivo ZIP**. (`CONFIRMAR_EN_ADMIN`: no se ha ensayado; GAP-02).
4. Se crea sin publicar. Pulsa **Personalizar** y revisa.
5. Publicar.
6. Vuelve a aplicar tus cambios de editor posteriores a RC1.10 (tabla del registro, sección 7), porque el ZIP trae los textos originales (barra "20% de descuento en toda la tienda").
7. Revisa la página Favoritos y la barra de anuncio.

**C. Con ayuda del asistente (código).** `shopify theme push` es **solo para el asistente** (desde el ZIP, siempre `--unpublished`, nunca `--live`). El ZIP, su manifiesto (`release-manifest-rc1.10.json`) y la versión anterior RC1.9 (SHA-256 `fa68a9a9e505b5dce9f8e128f28c6541903729b2a13c7bad6488c1070a06533c`) están en el mismo respaldo.

**D. Plan de último recurso:** publica **Horizon**. La tienda funciona, sin diseño de marca.

## 6. Revisión después de cualquier cambio (2 minutos)
1. Abre la vista previa en el celular y el computador.
2. Inicio: barra, banner, imágenes.
3. Colección: filtros Talla / Color / Precio.
4. Un producto: elegir talla, precio, botón "Agregar al carrito".
5. Carrito y pago (sin pagar): aparece Wompi, envío correcto.
6. Menú y pie de página: enlaces funcionan.
7. Si algo se ve mal: **no publiques**.

## 7. Registro de cambios hechos por ti (llénalo siempre)
| Fecha | Qué cambié | Dónde | Copia donde lo probé | Resultado |
|---|---|---|---|---|
| (lanzamiento) | Tema RC1.10 publicado | Temas | — | `PENDIENTE` |

## 8. Cuidado con los empujes de código
Si el asistente sube el tema desde su computador, puede **pisar** tus cambios hechos en el editor (el archivo de ajustes se sobrescribe). Antes de cualquier subida de código, pídele "primero descarga el tema actual (pull) y compara".

## 9. QUÉ HACER / QUÉ NO HACER
- Haz: duplicar, previsualizar, publicar, anotar.
- Haz: cambios pequeños y uno a la vez.
- No hagas: editar el tema publicado en horas de ventas.
- No hagas: cambiar muchas cosas sin probar.
- No hagas: borrar Horizon ni la copia de respaldo.

## 10. Dependencia de código propio (para saber)
El tema RC1.10 no es un tema de la tienda de Shopify: lo hizo el equipo. Un error de código (no de texto o imagen) solo se corrige con un desarrollador/IA con acceso al código. Plan: congelar RC1.10, cambiar solo con el editor, y definir quién arregla errores de código después del 2026-10-20 (GAP-13).

## 11. Cuándo pedir ayuda
- Algo se ve roto en el celular o en el computador.
- El botón de comprar no funciona.
- Aparece un error en rojo en el editor al guardar.
- Quieres cambiar algo que no está en la lista de "SÍ puedes tocar".
