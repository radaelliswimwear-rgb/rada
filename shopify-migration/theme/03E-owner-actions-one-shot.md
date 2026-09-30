# 03E — Acciones de la dueña (una sola lista, ordenada por lo que más desbloquea)

Todo lo que no está acá lo hace Claude. El detalle de cada punto está en el documento que se cita. Claude no escribe códigos, contraseñas, datos de tarjeta ni datos personales, y no acepta permisos OAuth por la dueña.

| # | Qué hacer | Dónde | Tiempo | Desbloquea |
|---|---|---|---|---|
| **1** | **Colombia como mercado principal** y **dirección de la tienda en Colombia**. Desactivar EE. UU. si no se va a vender allí | Admin > Markets · Configuración > General | 5 min | Hoy **todo visitante cae en EE. UU.** (checkout `es-us`, "$199,920.00"). También define qué pasarelas de pago ofrece el Admin |
| **2** | **Zona de envío Colombia** + **sucursal en Colombia**: tarifa gratis desde $299.900 y **decidir la tarifa por debajo** (el sitio real la "coordina" a mano por pedido, no hay un valor fijo). Quitar o ajustar las tarifas de EE. UU. | Configuración > Envío y entrega · Sucursales | 10 min | Hoy **los 29 productos figuran AGOTADOS para Colombia**. Después, encender `free_shipping_rate_confirmed` (lo hace Claude) |
| **3** | **Proveedor de pago:** instalar **Wompi** (app oficial, redirección) en modo prueba, o activar la pasarela de prueba de Shopify. Decidir antes cómo separar los ambientes de Wompi (staging del pentest y sitio en vivo) | Configuración > Pagos (acepta OAuth) | 15 min | Hoy "Esta tienda no puede aceptar pagos". Es el primer checkout de prueba (lo tipea la dueña) |
| **4** | **Código de ingreso de clienta** (script de 2 min en `theme/03D-search-accounts-wishlist-report.md` § F) | Chrome del PC | 2 min | GO/NO-GO #1 de cuentas |
| **5** | **OK para instalar Search & Discovery** (oficial, gratis) | Chat (Claude lo instala y configura) o Admin | 1 min | Filtros de **talla y color**, como en el sitio real (`theme/03E-search-discovery-prep.md`) |
| **6** | **OK para descargar 12 archivos del Cloudinary propio** (~20,7 MB, más 1 copia local del repo) y subirlos a Contenido > Archivos | Chat | 1 min | Hero, tarjetas, banners y guía de tallas. Claude corre `scripts/prepare-media-package.mjs --download` y `apply-media-wiring.mjs` |
| **7** | **Legales:** aprobar Privacidad, Términos, Envíos y Cookies (texto verbatim listo; revisar "Pago", terceros y "Hoy no las usamos") y entregar **razón social, NIT y dirección** | `content/legal/` · `theme/03D-legal-policies-inventory.md` | 20 min | Páginas legales, menú "Ayuda" completo y los 4 redirects legales pendientes |
| **8** | **Analítica:** ID de medición de **GA4**, dataset/píxel de **Meta** e instalar las apps oficiales (OAuth) | Chat + Admin | 15 min | Embudo anuncio → compra (`analytics/03E-analytics-plan.md`). Recién tiene sentido después de 1–3 |
| **9** | **App de favoritos de cuenta:** cuenta de desarrolladora, custom distribution (irreversible), instalar, hosting y secretos | `app/OWNER-WORKFLOW.md` | 30–60 min con Claude | Favoritos sincronizados y "Mis favoritos" |
| **10** | **Decisiones de marca/copy** (sin apuro): contraste de los CTA blancos sobre arena (1,69:1, igual que el sitio real); voseo o tuteo; "Recomendado para vos"; meta description de la Home | Chat | — | Accesibilidad AA y cierre de copy |

**Al publicar (no antes):**

- idioma principal de la tienda en español (el cambio reescribe todos los temas);
- plantilla `page.wishlist` en Favoritos;
- importar `seo/shopify-redirects-import.csv`;
- apagar el sitio Next.js en la ventana de corte.
