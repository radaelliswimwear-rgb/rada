# 03P — Certificación del laboratorio (Dev Store gratuita) — 2026-10-01

**Laboratorio:** `radaelli-swimwear-dev.myshopify.com` (Dev Store gratuita de la cuenta Partner `daniradaelli01@gmail.com`; nunca será la tienda oficial).
**Contexto:** Soporte de Shopify (asesor humano) respondió que una transferencia ya aceptada NO se revierte. La tienda «launch» quedó inactiva en la cuenta del comerciante (no se pagó, no se tocó). La dueña eligió reutilizar esta Dev Store (opción F1).

## Veredicto
- **LAB_CERTIFIED = YES**
- **READY_FOR_NEW_STANDARD_STORE = YES**
- Dinero real: ninguno. Sin pagos, sin tienda oficial, sin publicación, sin DNS, Wompi solo en modo prueba, contraseña de visitante activa. Tareas en segundo plano: ninguna.

## Qué se aplicó (solo diferencias reales frente al paquete validado)
| Cambio | Resultado |
|---|---|
| Tema RC1.10 (`theme push --unpublished`, tema 189149511999) | paridad 98/98 (82 idénticos + 16 JSON equivalentes), SHA-256 del ZIP `e0f67590…2410c` |
| Inventario (hoja 03O) | 98/98 con seguimiento, 128 unidades, 0 discrepancias |
| Peso | 500 g en 98 variantes |
| Colecciones | orden MANUAL y orden exacto (Oasis 10 / Aurora 12 / Espuma 7 / Salidas 0 / Destacados 7) |
| Redirecciones | 47 → 51 |
| Páginas legales (privacidad, términos, envíos, cookies) + políticas de Shopify (Términos, Envío, Privacidad; la gestión automática de Privacidad se apagó en el Admin) | 200 |
| Menús | main-menu 5, comprar 4, ayuda 6 |
| Mercado de EE. UU. | pasado a DRAFT; queda solo Colombia |
| Zonas de envío | ver abajo |
| Envia | instalada y vinculada (cuenta de la dueña) |
| Wompi | estaba ACTIVO con modo prueba APAGADO → modo prueba ACTIVADO y guardado |
| Search & Discovery | instalada; filtros Talla, Color (custom.color) y Precio, sin Disponibilidad; orden Talla, Color, Precio |

Paridad `03l-migrate parity`: **8/8 PASS** (Q1 29/98/95, Q2 SKU/precio/inventario, Q3 colecciones, Q4 metafields+size_guide, Q5 51 redirecciones, Q6 páginas, Q7 menús, Q8 COP/Bogotá/kg/CO).

## Matriz de certificación
| Sección | Estado | Evidencia |
|---|---|---|
| A. Baseline/paridad | PASS | 8/8; tema 98/98; inventario 98/98 |
| B. Enlaces y redirecciones | PASS | 51/51 no dan 404 (las 9 `/cuenta/*` redirigen a cuentas de cliente, igual que `/account`); 19/19 enlaces de menú y pie (4 redes externas no probadas) |
| C. Imágenes | PASS | 95/95 cargan |
| D. Responsive | PASS | 390/500, 768, 1440 px: Home, colección, PDP, carrito, búsqueda, legal sin desbordes ni imágenes rotas |
| E. Catálogo | PASS | 29 productos / 98 variantes / 95 imágenes; 0 SKU o handles duplicados; todas con precio; 29 PDP responden 200 |
| F. PDP/carrito/stock | PASS | 98/98 variantes se agregan; cantidades y quitar; el stock limita la cantidad; aviso «Últimas unidades» |
| G. Búsqueda/colecciones/filtros | PASS | marea 2, verde 2, terracota 3, vacío 0; orden precio/A–Z; filtros S&D: Talla XL=11, Color NEGRO=6, Precio funciona |
| H. Legal/políticas | PASS | 4 páginas + 4 políticas 200; textos aprobados |
| I–K. Envío regional | PASS | ver tabla |
| L. Wompi sandbox E2E | PASS | pedido #1003 test=true PAGADO COP 169.820 (envío 9.900), Wompi VENTA exitosa, un solo pedido, sin duplicados |
| M. Pedido/inventario | PASS | inventario bajó 1 y se restauró (+1, clave idempotente nueva; la clave fija de la herramienta de hoja no reaplica); pedido #1003 y antiguos #1001/#1002 cerrados |
| N. Campos del checkout | PASS | avisos en español para correo, nombre, apellidos, dirección, ciudad, departamento; teléfono y postal opcionales |
| O. Técnico | PASS | Theme Check 0 observaciones (61 archivos); 0 errores de JavaScript en consola; secret scan 0 |
| P. Apps | PASS | S&D instalada y configurada; Envia vinculada (rol cotización/guías, sin CCS); Wompi instalado en modo prueba |

## Envíos regionales (valores aprobados por la dueña por escrito)
Subtotal menor a COP 299.900: tarifa fija por zona; desde COP 299.900: «Envío estándar gratis». Envío pagado hasta 299.899 y gratis desde 299.900 (condiciones leídas de la configuración guardada). 33 departamentos cubiertos.
| Zona | Departamentos | Tarifa | Costo Envia (cotizado, origen Barranquilla, 15×10×5 cm, 0,5 kg) |
|---|---|---|---|
| 1 Barranquilla/Atlántico | ATL | 9.900 | 7.900–9.100 |
| 2 Resto del Caribe | BOL, MAG, COR, SUC, LAG, CES | 12.900 | 7.900–11.350 |
| 3 Ciudades principales | DC, ANT, VAC, SAN, RIS, CAL, QUI, CUN, NSA | 17.900 | 14.570–17.300 |
| 4 Resto del país | BOY, TOL, HUI, MET, NAR, CAU, CAQ, ARA, CAS, CHO, PUT | 21.900 | 16.940–22.350 (muestra Sogamoso) |
| 5 San Andrés y Amazonía | SAP, AMA, VAU, GUA, GUV, VID | 44.900 | 41.780–58.750 |
Pruebas en checkout real: con carrito de 199.920 cada zona dio su tarifa; con 319.840 solo «Envío estándar gratis». El catálogo solo tiene 4 precios (159.920 a 199.920), sin combinación cercana a 299.900; el borde exacto se verificó leyendo las condiciones guardadas.

## Hallazgos
1. US market activo en la dev store (no existe en la validada): corregido (DRAFT).
2. Wompi ACTIVO con modo prueba APAGADO: corregido y verificado.
3. La herramienta de inventario (`03m-post-decision`) usa clave `@idempotent` fija: no reaplica una hoja idéntica; para restaurar se usó ajuste con clave nueva.
4. El storefront aplica límite 429 por IP: las pruebas se espaciaron.
5. La barra de anuncio del tema dice «20 % DE DESCUENTO EN TODA LA TIENDA»: es texto del tema RC1.10, igual que en la tienda validada; a revisar por la dueña antes de publicar.

## Diferido a la tienda oficial (no probable en el laboratorio)
Que la promoción de tienda nueva aparezca; dominio/DNS y quitar la contraseña; Wompi en vivo; compra real de guías de Envia (saldo $0); migración de datos históricos (necesita exportación autorizada y permisos de pedidos/clientes). La tienda «launch» no se usa.

## Pendientes menores (no bloquean)
- 4 redes sociales del pie no se verificaron (externas).
- Si se quiere el borde exacto de COP 299.900 con carrito real, hace falta un producto o cupón de ese rango.
