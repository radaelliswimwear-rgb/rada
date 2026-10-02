# 08 — Respaldo y restauración

Para: Daniela. Idea simple: **Shopify guarda tu tienda, pero no te da botones de "volver a ayer"**. Tú debes tener copias propias.

## 1. Qué respaldos existen hoy
| Respaldo | Qué contiene | Dónde | Quién lo controla |
|---|---|---|---|
| Rama de GitHub **`shopify-migration-backup`** | Código del tema (`theme-src`), ZIP del tema RC1.10 con hash, catálogo (CSV/XLSX), CSV de importación de productos, hoja de inventario (98 filas), 51 redirecciones (CSV), textos legales, menús, definiciones de campos, tarifas de envío (JSON), informes y evidencia. 583 archivos con su `BACKUP-MANIFEST.json` (hash de cada uno) | Repositorio `radaelliswimwear-rgb/rada` en GitHub | Cuenta de GitHub (`PENDIENTE_DUEÑA`: quién la controla, si es privada, 2FA) |
| ZIP del tema RC1.10 | El diseño completo | Misma rama, carpeta `shopify-migration/dist/` (SHA-256 `e0f67590…2410c`, 178.702 bytes) | Igual |
| Hojas de producto e inventario | Cantidades iniciales y datos de producto | Misma rama, carpetas `shopify-migration/import/` y `catalog/` | Igual |
| Tienda de laboratorio `radaelli-swimwear-dev` | Copia certificada del catálogo y de la configuración (tienda de pruebas) | Cuenta Partner de desarrollo | Referencia, no respaldo de pedidos ni clientes. Puede dejar de existir: no depender de ella |
| Tienda inactiva "launch" (transferencia) | Nada que usar | — | NO TOCAR |
| Sitio viejo en Vercel | Pedidos y datos históricos antiguos | Vercel/Neon (`PENDIENTE_DUEÑA`) | Hasta su retiro (GAP-17) |
| Tus exportaciones (sección 3) | Productos, clientes, pedidos reales | Tu Drive (`PENDIENTE_DUEÑA`: carpeta y gestor) | Tú |

Honestidad: **hoy solo hay respaldos "de la migración" en GitHub. No existe aún una copia que tú controles de los datos vivos de la tienda.** Se crea con la sección 3 (GAP-09).

## 2. Qué NO respalda Shopify por ti
- Productos borrados (no hay "papelera").
- Cambios de precios, inventario y descripciones.
- Ediciones del tema en el editor (aparte de los temas guardados).
- Ajustes: envío, impuestos, pagos, dominios, notificaciones.
- Descuentos, páginas y menús modificados.
- Historial de pedidos y clientes en una forma que puedas restaurar tú: sirven como registro, no como "restaurar".
- DNS y correo (están en Hostinger).
- Llaves de Wompi y credenciales (por seguridad; las reescribes tú).

Consecuencia: **archiva en vez de borrar**, y exporta con regularidad.

## 3. Rutina de exportación (con rutas del Admin)
| Qué | Ruta | Cuándo | Guardar como |
|---|---|---|---|
| Productos (todos) | Productos > Exportar > "Todos los productos" > "CSV para Excel, Numbers..." | Semanal y antes de cambiar precios | `productos-AAAA-MM-DD.csv` |
| Inventario | Productos > Inventario > Exportar | Semanal | `inventario-AAAA-MM-DD.csv` |
| Pedidos | Pedidos > Exportar > "Todos los pedidos" | Semanal | `pedidos-AAAA-MM-DD.csv` (privado) |
| Clientes | Clientes > Exportar > "Todos los clientes" | Mensual | `clientes-AAAA-MM-DD.csv` (privado) |
| Tema | Temas > "..." > Descargar archivo del tema (llega por correo) (`CONFIRMAR_EN_ADMIN`) | Mensual y después de cambios importantes | `tema-AAAA-MM-DD.zip` |
| Tarifas de envío | Captura de pantalla de Configuración > Envío y entrega > Perfil general (5 zonas) | Cada vez que cambien | `envio-AAAA-MM-DD.png` |
| Descuentos activos | Captura de Descuentos | Cada vez que cambien | `descuentos-AAAA-MM-DD.png` |
| Redirecciones, páginas, menús | No exportes: están en GitHub (51 redirecciones, textos legales) | Tras cambios | — |
| DNS | Captura de la zona DNS en Hostinger | Antes de cada cambio | `dns-AAAA-MM-DD.png` |

Reglas:
1. Carpeta privada en tu Drive: `Radaelli-Respaldos/AAAA-MM-DD` (`PENDIENTE_DUEÑA`).
2. Conserva los últimos 6 respaldos semanales y 12 mensuales.
3. Pedidos y clientes tienen datos personales (Ley 1581): no los subas a GitHub ni los pegues en chats.
4. Primer respaldo completo: el día del lanzamiento, antes de abrir ventas, y otro 24 horas después.
5. Marca en el calendario: cada lunes 8:00 "Exportar".

## 4. Descargar el respaldo de GitHub (sin saber de código)
1. Entra a `github.com/radaelliswimwear-rgb/rada` con tu cuenta (`PENDIENTE_DUEÑA`).
2. En el botón de ramas escribe `shopify-migration-backup` y elígela.
3. Botón verde **Code** > **Download ZIP**.
4. Guarda el ZIP en tu Drive. No lo abras en chats.
Si no tienes acceso a GitHub, pide al equipo una copia en tu Drive (GAP-09).

## 5. Orden de recuperación si la tienda se daña
Calcula 1–3 horas con ayuda (`PENDIENTE`: no medido). Siempre en este orden:
1. **Contener:** pon contraseña a la tienda o desactiva Wompi (documento 10, "Contención"). Avisa a clientes con pedidos en curso.
2. **Saber qué se dañó:** compara con el documento 04 (inventario) y con las capturas de respaldo.
3. **Tema:** restaurar RC1.10 (documento 06, sección 5).
4. **Ajustes críticos:**
   - Impuestos: NO "incluir impuesto en precios"; sin tasas (eres NO RESPONSABLE DE IVA). Configuración > Impuestos y aranceles.
   - Envío: 5 zonas, 33 departamentos, tarifas 9.900 / 12.900 / 17.900 / 21.900 / 44.900; gratis desde 299.900 (archivo `launch/official-03p/laneC__lab-shipping-structure.json` del respaldo).
   - Pagos: Wompi activo; URL de eventos (documento 02); modo correcto.
   - Checkout: contacto por correo, teléfono obligatorio.
   - Idioma: español por defecto del mercado Colombia.
5. **Catálogo:** productos con tus últimos CSV (importar con "Sobrescribir existentes"). Si no hay CSV reciente: usa los CSV del respaldo y luego corrige precios e inventario con la hoja de inventario. **Ayuda del asistente** recomendada.
6. **Inventario:** compara con el libro (documento 04).
7. **Colecciones, menús, páginas, políticas:** de los archivos del respaldo (`content/`, `seo/`).
8. **Redirecciones:** 51 desde `seo/shopify-redirects-import-final-store.csv`. Ruta: Admin > Redireccionamientos de URL (`https://admin.shopify.com/store/wgcvpd-ib/redirects`, confirmado 2026-10-02).
9. **Dominio y DNS:** documento 01.
10. **Prueba de compra sin pagar** (documento 10) y recién entonces abre la tienda.
11. Anota qué pasó y cómo se resolvió.

## 6. Cosas que NO se recuperan solas
- Pedidos y clientes borrados por error (por eso no los borres: archívalos).
- Llaves y credenciales (reescribirlas tú).
- Correos ya enviados a clientes.

## 7. Hoja de control de respaldos
| Fecha | Productos | Inventario | Pedidos | Clientes | Tema | Dónde quedó | Hecho por |
|---|---|---|---|---|---|---|---|
| (lanzamiento) | | | | | | | |

## 8. QUÉ HACER / QUÉ NO HACER
- Haz: exportar antes de tocar precios o inventario en bloque.
- Haz: probar una restauración del tema una vez (GAP-02).
- No hagas: usar la tienda de laboratorio o la "launch" para recuperar datos reales.
- No hagas: subir archivos con datos de clientes a GitHub o a un chat.
- No hagas: importar un CSV sin leer el aviso de Shopify sobre qué se va a sobrescribir.

## 9. Cuándo pedir ayuda
- Falta un producto o una colección.
- Un cambio en bloque salió mal.
- Quieres recuperar algo y no encuentras el archivo correcto.
- Perdiste acceso a GitHub o a tu Drive.
