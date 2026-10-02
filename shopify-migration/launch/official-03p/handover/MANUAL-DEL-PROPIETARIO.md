# MANUAL DEL PROPIETARIO — Radaelli Swimwear (tienda Shopify)

Para: Daniela. Escrito para usarlo sola, sin saber de tecnología.
Estado al escribir: 2026-10-02 (antes del lanzamiento). Los datos marcados `PENDIENTE_DUEÑA` o `CONFIRMAR_EN_ADMIN` no están confirmados: no los des por ciertos.
Los nombres de menús son los que se vieron en tu Admin al configurar la tienda. Si un nombre cambió, usa la lupa de búsqueda arriba del Admin y escribe la palabra (por ejemplo "Notificaciones").

## 1. Datos clave (una mirada)

| Tema | Valor |
|---|---|
| Tienda | Radaelli Swimwear · `wgcvpd-ib.myshopify.com` · Admin: `https://admin.shopify.com/store/wgcvpd-ib` |
| Plan | Shopify Basic (pago mensual). Costos y fechas: documento 09 |
| País / moneda / hora | Colombia · COP · America/Bogota · kilos |
| Catálogo | 29 productos · 98 variantes (tallas) · 128 unidades de inventario inicial |
| Precios | Precio actual = 80 % del precio tachado (promoción "20 % de descuento en toda la tienda"). Documento 05 |
| Impuestos | Eres NO RESPONSABLE DE IVA: la tienda NO cobra IVA. No cambies esto sin tu contador |
| Envío | 5 zonas con tarifa fija: $9.900 · $12.900 · $17.900 · $21.900 · $44.900. Gratis desde $299.900 |
| Pagos | Wompi (tarjetas, PSE, Nequi, Daviplata, Bancolombia). Documento 02 |
| Transportadora | Envia.com (guías con saldo prepago). Documento 03 |
| Tema (diseño) | "Radaelli RC1.10". Respaldo y reglas: documentos 06 y 08 |
| Dominio | `radaelliswimwear.com` (DNS en Hostinger). Documento 01 |

## 2. Reglas de oro (QUÉ NO HACER)

1. NO compartas contraseñas, códigos de acceso, llaves de Wompi ni datos de tarjeta por chat, correo ni GitHub.
2. NO toques los registros MX ni TXT del dominio: ahí vive tu correo `info@`.
3. NO borres productos: usa "Archivar". Borrar no se puede deshacer.
4. NO edites el código del tema. Solo el editor visual (documento 06).
5. NO cambies país, moneda, impuestos ni zonas de envío sin ayuda.
6. NO instales apps nuevas sin preguntar: cada una pide permisos sobre tus datos y puede cobrar.
7. NO actives dos formas de pago de tarjeta a la vez.
8. NO compres guías de Envia para pedidos de prueba.
9. NO subas el plan de Shopify ni aceptes cobros que no entiendas.
10. Ante la duda: captura de pantalla (sin claves) y pregunta.

## 3. Rutinas

### Cada día (5 min) — documento 04 tiene el detalle
1. Admin > Pedidos: ¿hay pedidos nuevos "Pagado" sin cumplir? Atiéndelos el mismo día.
2. Compara con el panel de Wompi: cada pago APROBADO debe tener un pedido.
3. Admin > Productos > Inventario: ¿alguna talla en 0 o en negativo?
4. Admin > Pedidos > Checkouts abandonados: ¿alguno con un pago aprobado en Wompi? Si sí: documento 02.
5. Mira tu Gmail (incluye spam): avisos de Shopify, Wompi y Envia.
6. Abre la tienda en el celular: ¿carga, se ve el precio, agrega al carrito?

### Cada semana (20 min)
1. Exporta pedidos y productos (documento 08).
2. Revisa saldo de Envia y costo real de las guías contra lo cobrado de envío (documento 03).
3. Revisa Admin > Análisis: visitas, agregados al carrito, compras.
4. Revisa que la barra de anuncio y la promoción sigan siendo ciertas (documento 05).
5. Revisa que no haya pedidos "Pendiente de pago" viejos.

### Cada mes (45 min)
1. Admin > Configuración > Facturación: cobro de Shopify correcto.
2. Respaldo completo: productos, clientes, pedidos (documento 08) y copia a tu Drive.
3. Haz una compra de prueba SIN pagar: llega hasta Wompi y mira que aparezca y que el envío sea el correcto.
4. Revisa costos de Envia, Wompi y Meta (documento 09).
5. Pide ayuda si hay una alerta de Shopify en el Admin.

### Cada año
Renovar dominio y plan de Hostinger (fechas `PENDIENTE_DUEÑA`), revisar con tu contador si sigues siendo NO RESPONSABLE DE IVA, revisar textos legales.

## 4. Tu primer pedido real (paso a paso)

1. Te llega un correo "Nuevo pedido" de Shopify a tu Gmail.
2. Admin > Pedidos > abre el pedido. Debe decir "Pagado". Si dice "Pendiente" o "Cancelado": documento 02.
3. En el panel de Wompi, busca el pago: estado APROBADO, mismo valor y misma hora.
4. Revisa dirección, ciudad y teléfono del cliente. Si algo está raro, escríbele.
5. Mira Admin > Productos > Inventario: la talla vendida bajó 1.
6. Empaca la prenda.
7. Abre Envia (Admin > Aplicaciones > Envia.com) y compra la guía con TU saldo (documento 03). Solo tú compras guías reales.
8. Pega la guía y entrega el paquete a la transportadora (o pide recolección).
9. Verifica que el pedido pase a "Cumplido" con número de guía y que el cliente reciba el correo de envío. Si no pasa solo: Pedidos > pedido > "Marcar como cumplido" > agrega el número de guía.
10. Anota en una hoja: pedido, valor, costo de la guía, diferencia contra el envío cobrado.
11. El primer pedido real: tómale captura a cada pantalla importante (sin datos de tarjeta) por si hay que pedir ayuda.

## 5. Dónde está cada cosa

| Tema | Ruta en el Admin | Quién / qué |
|---|---|---|
| Pedidos | Pedidos | Tú. Detalle: doc 04 |
| Pagos fallidos / sin pedido | Pedidos > Checkouts abandonados + panel Wompi | Tú; doc 02 |
| Inventario | Productos > Inventario | Tú; doc 04 |
| Productos y precios | Productos | Tú; cuidado con precios (doc 05) |
| Descuentos | Descuentos | Tú; doc 05 |
| Barra de anuncio | Tienda online > Temas > Personalizar | Tú; doc 05 y 06 |
| Menús y páginas | Contenido > Menús / Tienda online > Páginas (`CONFIRMAR_EN_ADMIN`) | Tú; cuidado |
| Diseño del tema | Tienda online > Temas | Doc 06 |
| Contraseña de la tienda | Tienda online > Preferencias | Solo para cerrar la tienda en una emergencia |
| Dominio | Configuración > Dominios | Doc 01; DNS en Hostinger |
| Pagos (Wompi) | Configuración > Pagos | Doc 02; llaves solo las escribes tú |
| Checkout | Configuración > Checkout (`CONFIRMAR_EN_ADMIN`) | Contacto por correo y teléfono obligatorio: no cambiar |
| Envío (zonas y tarifas) | Configuración > Envío y entrega > Perfil general | Doc 10 si falla |
| Guías (Envia) | Aplicaciones > Envia.com | Doc 03 |
| Impuestos | Configuración > Impuestos y aranceles | NO tocar |
| Correos y destinatarios | Configuración > Notificaciones | Doc 07 |
| Políticas legales | Configuración > Políticas | Doc 07 y GAP legal en doc 12 |
| Plan y cobros | Configuración > Facturación / Plan | Doc 09 |
| Usuarios | Configuración > Usuarios | Solo personas de confianza |
| Filtros talla/color | Aplicaciones > Search & Discovery | No tocar |
| Redirecciones (51) | Contenido > Menús > Redireccionamientos (`CONFIRMAR_EN_ADMIN`) | No borrar |
| Respaldos | GitHub rama `shopify-migration-backup` + tu Drive | Doc 08 |
| Estadísticas | Análisis | Medición de anuncios (Meta): hoy Configuración > Eventos de clientes está vacío (sin píxel). Se conecta con la app "Facebook & Instagram" y tu inicio de sesión de Meta: `PENDIENTE_DUEÑA` (doc 12, GAP-14). No gastes en anuncios sin medición |

## 6. Cuándo pedir ayuda (y a quién)

| Situación | A quién | Qué llevar |
|---|---|---|
| No puedes entrar / cobro raro del plan | Soporte de Shopify (icono "?" del Admin > Contactar) | Captura, correo de la cuenta |
| Un pago no genera pedido | Doc 02 primero; luego Wompi (canal `PENDIENTE_DUEÑA`) | Referencia Wompi, hora, valor |
| Guía o transportadora | Soporte de Envia (canal `PENDIENTE_DUEÑA`) | Número de guía, pedido |
| Tienda caída, aviso de seguridad, "Un momento..." | Doc 10, luego IA o Shopify | Captura, hora, qué hiciste |
| Cambios de diseño, promos, cupones, precios en bloque | IA de bajo costo con este manual | Documento correspondiente |

Cuando preguntes a la IA, pega: qué querías hacer, qué viste (captura sin claves) y el número de documento que seguiste.
URGENTE (nadie puede comprar o hay dinero en riesgo): primero pon la tienda en pausa (doc 10, "Contención"), luego pide ayuda.

## 7. Glosario

- **Admin**: el panel donde administras la tienda.
- **Tema**: el diseño de la tienda (Radaelli RC1.10).
- **Variante**: una talla de un producto (hay 98).
- **Precio de comparación / tachado**: el precio anterior que se ve tachado.
- **Inventario "Disponible"**: unidades que se pueden vender ahora.
- **Checkout**: la pantalla de pago.
- **Checkout abandonado**: alguien empezó a pagar y no terminó (a veces pagó y el pedido no se creó).
- **Cumplir pedido**: marcarlo enviado y registrar guía.
- **Perfil de envío**: tarifas por zona.
- **DNS**: la "agenda" que dice a qué servidor va tu dominio.
- **Registro A / CNAME**: líneas del DNS que apuntan el dominio a Shopify.
- **MX / TXT**: líneas del DNS para el correo. No tocar.
- **SSL (candado)**: certificado que muestra "https".
- **Webhook / URL de eventos**: aviso automático de Wompi a Shopify cuando alguien paga.
- **Modo de prueba**: Wompi no cobra dinero real.
- **Rollback**: volver al estado anterior.
- **Respaldo**: copia para restaurar.
- **429 / "Un momento..."**: Shopify frena muchas visitas seguidas.

## 8. Los 10 documentos del paquete

01 DNS y rollback · 02 Wompi · 03 Envia · 04 Inventario y pedidos · 05 Promociones · 06 Editar el tema · 07 Correos · 08 Respaldo · 09 Credenciales, apps y costos · 10 Monitoreo y fallas. El documento `CLAUDE-DOWNGRADE-READINESS` prueba que puedes operar con ayuda de bajo costo después del 2026-10-20.
