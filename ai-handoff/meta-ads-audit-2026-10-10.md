# AUDITORÍA META ADS — RADAELLI SWIMWEAR — 10 oct 2026

**Preparado por:** Claude (solo lectura, sin cambios en producción).
**Para:** ChatGPT, segundo auditor estratégico.
**Alcance:** únicamente Radaelli Swimwear, cuenta publicitaria `1085190508806751` (Radaelli Swimwear - Publicidad). CeRa Tech Plus excluida.

**Corte de datos:** Meta Ads Manager el 10 oct ~10:50 a. m.; Shopify Analytics actualizado a las 10:51 a. m. (hora de Bogotá).

**Etiquetas usadas en el informe:**
- **[V]** verificado hoy en Meta, Shopify o el Administrador de eventos.
- **[R]** tomado de registros previos del proyecto (ai-handoff), con su fecha.
- **[E]** estimación.
- **[ND]** no disponible o no verificable.

> Las cifras de Meta del día de hoy siguen cambiando mientras corre el anuncio. Moneda: COP. Los "$" de Meta son COP.

---

## RESUMEN EJECUTIVO

### Inversión y ventas
- **Inversión total en Meta, histórica:** COP 118.114 [V].
  - Campaña de WhatsApp de septiembre: COP 108.546.
  - TEST 01 (Ventas, del 8 al 9 oct): COP 4.541.
  - TEST 02 (Tráfico, del 9 oct a hoy): COP 5.027.
- **Ventas reales confirmadas en Shopify desde el lanzamiento (2 oct):** 0. Los únicos pedidos son pruebas internas: #1001 sandbox, #1002 cancelado con reembolso pendiente y #1003 de COP 5.000 [V].
- **Compras atribuidas por Meta:** 0. ROAS: 0. No hay ventas que atribuir [V].

### Campaña activa: TEST 02 (Tráfico)
- **Desempeño:** COP 5.027 · 2.380 impresiones · 302 clics en el enlace · CTR 12,7 % · **84 visitas a la página de destino según Meta** · 0 carritos · 0 pagos iniciados · 0 compras [V].
- **Hallazgo crítico de medición:** desde que corre la pauta, Shopify **no ha registrado ni una sola sesión humana con `utm_source=meta`**. Solo registró 8 sesiones marcadas como bot (4 el 8 oct y 4 el 9 oct) [V].
- **Pruebas controladas de hoy con el celular de la dueña:**
  - Prueba C, sin aceptar cookies: **no aparece** en Shopify.
  - Prueba D, aceptando cookies: **sí aparece**, como sesión humana con 4 vistas de página [V].
  - Conclusión: quien no acepta el banner es invisible para Shopify y para el píxel.

### Diagnóstico corto
1. Hasta hoy la campaña **compró clics, no clientas**.
   - El 99 % del gasto fue al Feed de Facebook, con un CTR anormal de 13 %.
   - Solo 28 % de los clics llega a cargar la página.
   - No hay ninguna señal de intención (carrito o pago).
2. La medición estuvo prácticamente ciega por el banner de cookies (decisión legal vigente).
3. Instagram, el canal natural de la marca, recibió **COP 18 de COP 5.027** (0,4 %).

### Recomendación priorizada
1. **No tocar la campaña hasta el lunes 13 oct ~9:00.** Son las 72 h desde el cambio a "Visitas a la página de destino".
2. Evaluar ese día con reglas de corte explícitas (sección 9).
3. Usar el tiempo para cerrar los datos faltantes: costos del producto, tarifa Wompi y tasa de aceptación del banner.
4. No escalar presupuesto.

---

## 1. ESTADO ACTUAL DE LA CAMPAÑA (10 oct 2026, ~10:50 a. m.)

| Campo | Valor | Fuente |
|---|---|---|
| Campaña activa | **RADAELLI \| WEB TRAFFIC \| OASIS NATURAL \| TEST 02** — ID 120249490990960423 | [V] |
| Conjunto | RADAELLI \| MUJER TRAVEL \| CLICS \| WEB — ID 120249490990950423 | [V] |
| Anuncio | RADAELLI \| OASIS NATURAL \| WEB \| CLICS 01 — ID 120249490990970423 | [V] |
| Objetivo | Tráfico (configuración manual, sin Advantage+ de campaña) | [V] |
| Ubicación de conversión | Sitio web | [V] |
| Evento de optimización | **Maximizar el número de visitas a la página de destino**. Desde el 10 oct a las 8:30 a. m.; antes era "Clics en el enlace" | [V] historial |
| Estrategia de puja | Volumen más alto, sin tope de costo | [V] |
| Modelo de atribución | Estándar: 7 días tras clic, todas las conversiones (no editable tras publicar) | [V] |
| Creada / entrega iniciada | Creada el 9 oct a las 8:55 a. m.; entrega iniciada el 9 oct a las 11:39 a. m. | [V] historial |
| Fin previsto | 31 oct 2026, 11:59 p. m. (Bogotá) | [V] |
| Estado | **Activa**. Tras el cambio de objetivo pasó por revisión y volvió a Activo a las 8:33 a. m. de hoy. Con el cambio de optimización Meta reinicia el aprendizaje, y la etiqueta exacta ("En aprendizaje") **no se leyó** hoy | [V] / [ND] |
| Presupuesto | **TOTAL (lifetime) COP 91.000**, sin cambios desde la creación | [V] |
| Gastado | COP 5.027 | [V] |
| Saldo del presupuesto | ≈ COP 85.973 para ~21,5 días (≈ COP 4.000/día) | [E] |
| Fondos prepago de la cuenta | COP 24.953 el 8 oct [R]. **Saldo de hoy: no leído [ND].** La tarjeta registrada está vencida y la verificación del anunciante sigue pendiente (advertencia) | [V] avisos |
| Estructura | 1 campaña · 1 conjunto · 1 anuncio activos. TEST 01 está pausada. La campaña de WhatsApp de septiembre está encendida a nivel campaña, pero sin conjuntos activos (COP 0 en octubre) | [V] |

**Segmentación:**
- **Ciudades:** Medellín, Barranquilla, Bogotá y Cartagena de Indias, cada una con radio de +25 km y expansión desactivada.
- **Edad y sexo:** 25–39 años, mujeres. La edad desconocida en WhatsApp está excluida.
- **Intereses:** Viajeros frecuentes y Viajeros internacionales frecuentes. Meta los aplica como segmentación detallada Advantage+, es decir, como sugerencia y no como restricción.
- **Público Advantage+:** desactivado.
- **Tamaño estimado:** 3,9–4,6 millones de personas.
- Fuente: [V] y [R].

**Ubicaciones:**
- **Incluidas:** Facebook (feeds, feed del perfil, instream de reels, columna derecha, Marketplace, Stories, Reels, búsqueda, notificaciones), Instagram Stories y Reels, WhatsApp Estado.
- **Excluidas:**
  - Audience Network.
  - Feed, Perfil, Explorar y Búsqueda de Instagram, y Threads.
  - Motivo: el video 9:16 recortaba el "20 % OFF" en el formato 4:5, y Meta obliga a excluir esas ubicaciones en bloque.
- Fuente: [V] y [R].

---

## 2. HISTORIAL DE MODIFICACIONES (cronología completa)

Las fechas y horas de Meta salen del **Historial de actividad** de Ads Manager [V]. En Meta todas las acciones figuran como "Dani Radaelli", porque Claude operó con la sesión de la dueña y con su autorización en el chat. Los cambios fuera de Meta salen de los registros ai-handoff [R].

### Contexto previo
| Fecha | Cambio | Detalle |
|---|---|---|
| sep 2026 (terminó el 18 sep) | Campaña **RADAELLI \| TRAVEL \| WHATSAPP \| SEP 15D** | Objetivo: mensajes por WhatsApp. 4 anuncios de video. Gasto COP 108.546; 6.492 impresiones; 90 clics; **49 conversaciones**; costo medio ≈ COP 2.215 por conversación. Fecha de inicio exacta [ND] (el nombre sugiere 15 días). **Ventas cerradas por WhatsApp: [ND]**; un registro previo indica silencio de las clientas tras conocer el precio [R] |
| 2 oct, ~11:23 | Tienda oficial pública en Shopify | Banner de cookies activo para Colombia, por decisión legal aprobada [R] |
| 2 oct, 13:40 | Meta conectado vía la app Facebook & Instagram de Shopify | Dataset 1415307240666037; prueba de PageView, ViewContent, AddToCart e InitiateCheckout OK [R] |
| 3 oct | "Edición rosa" | 20 % de descuento en toda la tienda hasta el 31 oct, más barra y etiquetas en rosa [R] |
| 7 oct | Compra de prueba #1003 (COP 5.000) | El Purchase llegó a Meta con retraso [R] |

### TEST 01: Ventas, optimizada a Iniciar pago
| # | Fecha y hora | Antes | Cambio | Por qué | Esperado | Resultado | ¿Afectó el aprendizaje? |
|---|---|---|---|---|---|---|---|
| 1 | 7 oct, 11:46 p. m. | — | Se crea la campaña WEB SALES TEST 01 con el conjunto MUJER TRAVEL \| IC \| WEB: Ventas, Conversiones a "Iniciar pago", volumen más alto, presupuesto total COP 96.000 hasta el 31 oct, 4 ciudades, 25–39, mujeres, ubicaciones manuales sin Feed de IG. Anuncio WEB \| 01 con video 9:16, CTA Comprar y URL /collections/oasis-natural | Primera prueba web tras el lanzamiento | Pagos iniciados medibles | Aprobado a las 11:51 p. m. del 7 oct [V] | Arranque |
| 2 | 8 oct, 7:42 a. m. | Anuncio sin UTM guardados; Meta había reactivado enlaces al sitio, productos y "revelar detalles" | Edición del anuncio: UTM exactos; experiencias interactivas, optimizar texto por persona y enlaces o productos apagados | Corregir desviaciones encontradas en la auditoría de entrega | Poder atribuir en Shopify y tener un creativo controlado | Volvió a revisión y quedó Activo a las 7:49 a. m. **La entrega empezó a las 9:30 a. m.** [V] | No: aún no había entregado |
| 3 | 8 oct, durante el día | — | Sin cambios | — | — | **Ver resultados abajo.** Además, el píxel dejó de recibir PageView desde el 8 oct ~9:00 a. m. [R] | — |
| 4 | 9 oct, 10:31 a. m. | Activa | **Pausada** (con la confirmación de la dueña) | Optimizaba a un evento que el píxel no veía por el banner, y Audience Network se llevaba ~50 % del gasto con clics accidentales | Dejar de gastar a ciegas | Gasto final COP 4.541 [V] | Fin |

**Resultados de TEST 01 [V]:**
- 8 oct: COP 3.881; 337 impresiones; 14 clics; CTR 4,15 %.
- 9 oct: COP 660; 52 impresiones; 2 clics.
- Total: COP 4.541; 389 impresiones; 16 clics; **0 pagos iniciados**.
- Por ubicación, a mitad de la prueba [R]:
  - Audience Network: ~COP 982 con 14 impresiones y CTR de 27–33 %.
  - Feed de Facebook: CTR 10,7 %.
  - Instagram Stories: CTR 2,9 %.

### TEST 02: Tráfico
| # | Fecha y hora | Antes | Cambio | Por qué | Esperado | Resultado | ¿Afectó el aprendizaje? |
|---|---|---|---|---|---|---|---|
| 5 | 9 oct, 8:55 a. m. | — | Se crea TEST 02, con el conjunto CLICS \| WEB y el anuncio CLICS 01 (anuncio nuevo: la publicación de TEST 01 no servía para Instagram). Optimización a **clics en el enlace**, sin píxel, **sin Audience Network**, presupuesto total COP 91.000 hasta el 31 oct. Misma segmentación, video, texto y UTM; complemento de WhatsApp en "Ninguno" | Optimizar a algo que no dependa del píxel y quitar Audience Network | Tráfico barato a la colección | Aprobado a las 9:00 a. m.; **entrega iniciada a las 11:39 a. m.** [V] | Arranque |
| 6 | 9 oct (ver #4) | TEST 01 activa | TEST 01 pausada | Evitar gasto en paralelo | — | Hubo ~1 h de solapamiento (TEST 01 gastó COP 660 el 9 oct) [V] | — |
| 7 | 10 oct, ~8:00 a. m. (fuera de Meta) | En el celular, el 1er toque en una tarjeta de producto solo activaba el efecto hover | Arreglo del tema: el efecto hover queda solo para dispositivos con mouse | La dueña lo detectó en la prueba C | Que la clienta entre al producto con un solo toque | Verificado en el CSS en vivo [R] | No afecta a Meta |
| 8 | 10 oct, **8:30 a. m.** | Clics en el enlace | **Visitas a la página de destino** | 302 clics, 0 sesiones humanas medibles, CTR anómalo en el Feed de FB | Que Meta busque personas que esperan a que cargue la página | Revisión OK a las 8:33 a. m. [V]. **Muy temprano para evaluar** | **Sí: reinicia el aprendizaje** |
| 9 | 10 oct, ~9:15 a. m. (fuera de Meta) | Banner de cookies "Inferior centro", modal de ~media pantalla en el celular | Posición "Inferior (ancho completo)" | La dueña lo vio tapando la pantalla | Más aceptación | [R] | Puede subir la medición |
| 10 | 10 oct, ~10:20 a. m. (fuera de Meta; lo guardó la dueña) | Textos por defecto, colores claros | Banner "amable": fondo crema, botones Aceptar y Rechazar iguales en oscuro, título "Hagamos tu visita más fácil", texto corto y todo en español (también la ventana de preferencias) | Subir la tasa de aceptación sin un patrón engañoso | Más clientas medibles | [R] | Puede subir la medición |
| 11 | 10 oct, ~10:40 a. m. | Borrador sin publicar en el anuncio CLICS 01 ("ACTUALIZADO: Contenido"), de origen desconocido | Borrador **descartado**; nunca se publicó | Nadie lo reconoció | Evitar un cambio desconocido | Anuncio intacto [V] | No |

**Conteo de cambios:**
- Cambios estructurales con impacto en el aprendizaje en 3 días: el lanzamiento de TEST 01, la edición del anuncio de TEST 01 (antes de entregar), el reemplazo por TEST 02 y el cambio de optimización a visitas a la página de destino.
- Cambios de presupuesto: ninguno.
- Cambios de segmentación: ninguno.

---

## 3. RESULTADOS REALES

### 3.1 Por anuncio (vida completa, al 10 oct ~10:50 a. m.) [V]
| Métrica | CLICS 01 (TEST 02, activo) | WEB 01 (TEST 01, pausado) | VIDEO 03 PROMO 10S (WhatsApp, sep) | VIDEO 01 NECESIDAD (WhatsApp, sep) | VIDEO 02 UGC (WhatsApp, sep) | VIDEO 01 TEST MAN… (WhatsApp, sep) |
|---|---|---|---|---|---|---|
| Gasto | 5.027* | 4.541 | 37.624 | 21.849 | 31.478 | 17.595 |
| Impresiones | 2.380* | 389 | 2.107 | 1.606 | 1.907 | 872 |
| Alcance | 2.289 | 362 | 1.348 | 1.088 | 1.264 | 642 |
| Frecuencia | 1,04 | 1,07 | 1,56 | 1,48 | 1,51 | 1,36 |
| CPM | 2.111 | 11.674 | 17.857 | 13.605 | 16.507 | 20.178 |
| Clics (todos) – CTR | 13,24 % | 4,11 % | 3,23 % | 4,05 % | 2,15 % | 1,49 % |
| Clics en el enlace | 302* | 16 | 26 | 51 | 11 | 2 |
| CTR de enlace | 12,7 % | 4,11 % | 1,23 % | 3,18 % | 0,58 % | 0,23 % |
| CPC de enlace | ≈17 | 284 | 1.447 | 428 | 2.862 | 8.798 |
| Clics salientes | 300 | 16 | 4 | 4 | 8 | 1 |
| **Visitas a la página de destino** | **84** (28 % de los clics; COP 60 cada una) | [ND] (no se midió) | — | — | — | — |
| Ver contenido / carrito / pago iniciado / compras (Meta) | 0 / 0 / 0 / 0 | 0 / 0 / 0 / 0 | n/a | n/a | n/a | n/a |
| Conversaciones de WhatsApp | — | — | 21 (COP 1.792 c/u) | 25 (COP 874 c/u) | 1 (COP 31.478) | 2 (COP 8.798 c/u) |
| Ingresos atribuidos / ROAS | 0 / — | 0 / — | — | — | — | — |
| Video: reproducciones de 3 s / impresiones | 3,76 % | 17,99 % | 24,49 % | 7,29 % | 21,45 % | 17,43 % |
| Video 25 / 50 / 75 / 95 % | 102 / 69 / 49 / 39 | 74 / 52 / 40 / 35 | 488 / 273 / 174 / 109 | 158 / 80 / 61 / 52 | 198 / 166 / 78 / 32 | 206 / 107 / 71 / 62 |

\* Al día de hoy siguen subiendo; minutos después se leyeron 303 clics y 85 visitas.

### 3.2 Por período (campaña) [V]
| Período | Campaña | Gasto | Impresiones | Clics en el enlace | Visitas a la página | Visitas por clic | Compras Meta | Compras Shopify (reales) |
|---|---|---|---|---|---|---|---|---|
| sep (hasta el 18) | WhatsApp SEP 15D | 108.546 | 6.492 | 90 | — | — | — | [ND] (las ventas fueron por WhatsApp; no hay registro) |
| 8 oct | TEST 01 | 3.881 | 337 | 14 | [ND] | — | 0 | 0 |
| 9 oct | TEST 01 | 660 | 52 | 2 | [ND] | — | 0 | 0 |
| 9 oct | TEST 02 (clics) | 3.548 | 1.623 | 210 | 59 | 28,1 % | 0 | 0 |
| 10 oct (parcial; clics hasta las 8:30 y luego visitas) | TEST 02 | 1.479 | 757 | 93 | 26 | 28,0 % | 0 | 0 |

### 3.3 Por ubicación — TEST 02 [V]
| Ubicación | Gasto | Impresiones | Clics en el enlace | Visitas a la página | CTR |
|---|---|---|---|---|---|
| **Feed de Facebook** | 4.948 (98,4 %) | 2.275 | 299 | 84 | 13,14 % |
| Anuncios en Facebook Reels | 51 | 98 | 0 | — | 0 % |
| Instagram Stories | 18 | 3 | 0 | — | — |
| Facebook Reels | 3 | 1 | 1 | — | — |
| Marketplace | 1 | 1 | 0 | — | — |

### 3.4 Por edad y región — TEST 02 [V]
| Segmento | Gasto | Impresiones | Clics | Visitas a la página | CTR |
|---|---|---|---|---|---|
| 25–34 | 3.453 | 1.627 | 216 | 56 (26 % de los clics) | 13,3 % |
| 35–39 | 1.568 | 751 | 86 | 28 (33 % de los clics) | 11,5 % |
| Atlántico (Barranquilla) | 1.752 | 854 | 119 | [ND por región] | 13,9 % |
| Bogotá D. C. | 1.355 | 627 | 69 | [ND] | 11,0 % |
| Antioquia (Medellín) | 961 | 455 | 61 | [ND] | 13,4 % |
| Bolívar (Cartagena) | 830 | 388 | 46 | [ND] | 11,9 % |
| Magdalena / Cundinamarca (efecto del radio) | 54 / 69 | 20 / 34 | 5 / 2 | [ND] | — |

**Métricas no configuradas o no verificables:**
- Visitas a la página en TEST 01 (no era su objetivo).
- Visitas a la página por región.
- Compras confirmadas por canal en Shopify: no hay compras.
- Ventas por WhatsApp de septiembre.
- Calidad de la visita: tiempo en el sitio y páginas por sesión del tráfico de Meta. Shopify no lo ve sin consentimiento.

---

## 4. CREATIVOS Y CONTENIDO

| Anuncio | Producto | Formato | Texto / gancho / CTA | Activación | Público | Inversión | Resultado | Estado |
|---|---|---|---|---|---|---|---|---|
| **CLICS 01** (TEST 02) | Colección Oasis Natural | Video vertical 9:16, 10 s (archivo copy_11AE0386, de la dueña, con "20 % OFF") | Título "Descubre Oasis Natural"; descripción "Compra online en Radaelli Swimwear"; **CTA Comprar**; URL /collections/oasis-natural con UTM. Texto principal: el mismo de WEB 01 (**no se extrajo literal hoy [ND]**) | 9 oct, 11:39 a. m. | Mujeres 25–39, 4 ciudades, viajeras | 5.027 | 302 clics, 84 visitas, 0 intención medible | Activo |
| **WEB 01** (TEST 01) | Oasis Natural | El mismo video | Igual a CLICS 01 | 8 oct, 9:30 a. m. | El mismo | 4.541 | 16 clics, 0 pagos iniciados | Reemplazado el 9 oct: optimizaba a un evento invisible y entregaba en Audience Network. Su publicación no servía para Instagram |
| VIDEO 03 PROMO 10S | [ND] (campaña de viaje / promo) | Video | [ND] | sep | [ND] | 37.624 | 21 conversaciones | Desactivado |
| VIDEO 01 NECESIDAD | [ND] | Video | [ND] | sep | [ND] | 21.849 | 25 conversaciones (el mejor costo: COP 874) | Completado |
| VIDEO 02 UGC | [ND] | Video UGC | [ND] | sep | [ND] | 31.478 | 1 conversación | Desactivado |
| VIDEO 01 TEST MAN… | [ND] | Video | [ND] | sep | [ND] | 17.595 | 2 conversaciones | Desactivado |

**El mejor anuncio según cada objetivo:**
- **Conversaciones:** VIDEO 01 NECESIDAD, con 25 a COP 874.
- **Retención del video:** VIDEO 03 PROMO 10S, con 24,5 % de reproducciones de 3 s y 109 vistas al 95 %.
- **Tráfico web:** CLICS 01 es el único con visitas a la página (84 a COP 60). Su gancho en el Feed de FB es débil (3,8 % de reproducciones de 3 s) y su CTR es anormalmente alto, así que puede haber clics por error.
- **Ventas:** ningún anuncio tiene ventas comprobadas. **No se puede declarar un "mejor anuncio" por ventas.**

---

## 5. CALIDAD DEL TRÁFICO Y CONVERSIÓN

**Sesiones de Shopify desde el 7 oct, sin filtro de consentimiento [V]:**
- Con `utm_source=meta`:
  - 8 oct: 4 sesiones, todas "Bot" (móvil), rebote 100 %, 0 carritos.
  - 9 oct: 4 sesiones, todas "Bot", rebote 100 %, 0 carritos.
  - 10 oct: 0.
- Sesiones humanas desde el 7 oct: solo 7. Son la dueña o pruebas internas:
  - validacion_meta (2), directas (4) y prueba_d (1).
  - Una sesión directa del 10 oct entró a /collections/oasis-natural/products/oasis-serena-azul. No tiene UTM y su origen es [ND].
- **Carritos abandonados: 0. Pagos iniciados reales: 0. Pedidos reales: 0.**

**Lectura objetiva:**

1. **Un clic no es una visita.**
   - De 302 clics, Meta mide 84 visitas a la página (28 %).
   - El 72 % no llegó a cargar la página: toque accidental, salida inmediata o conexión lenta.
2. **Una visita no es una compradora potencial.**
   - Ninguna de las 84 visitas generó un evento de ver contenido, carrito o pago, ni en Meta ni en Shopify.
   - Parte de la explicación es el consentimiento: hoy se demostró que sin "Aceptar" el visitante es invisible.
   - El número real de visitas que navegaron productos es **[ND]**.
3. **Señales de baja calidad:**
   - CTR de 13 % en el Feed de Facebook. Lo normal en moda está entre 0,8 y 2 % [E, referencia de la industria].
   - Reproducciones de 3 s de solo 3,8 %: la gente hace clic sin ver el video.
   - CPM muy bajo, COP 2.111: inventario barato.
   - Es el perfil típico de clics de curiosidad o por error.
4. **¿Llegan a la página correcta?**
   - Sí: la URL es /collections/oasis-natural, responde HTTP 200 y conserva los UTM [R].
   - Hasta hoy, en el celular, el primer toque sobre un producto no lo abría. Ya está corregido.
5. **Productos más visitados, abandono en producto, carrito y checkout:** **[ND]**. No hay datos suficientes ni visitas medibles. El checkout no ha sido probado por clientas reales.
6. **Precio, envío y métodos de pago (factores de conversión):**
   - Precios entre COP 159.920 y 199.920, con el 20 % ya incluido.
   - Envío de 9.900 a 44.900 según zona; gratis desde 299.900 (2 prendas).
   - Pago con Wompi (tarjeta, PSE, etc.).
   - Antecedente [R]: en WhatsApp, las clientas callaban tras conocer el precio. **El precio podría ser una barrera, sin evidencia causal todavía.**
7. **Quién responde:**
   - Las de 35–39 cargan la página en mayor proporción que las de 25–34 (33 % frente a 26 %).
   - Barranquilla aporta el mayor volumen de clics.
   - No hay datos de calidad por ciudad.

---

## 6. RENTABILIDAD

| Concepto | Valor | Fuente |
|---|---|---|
| Inversión total en Meta (histórica) | COP 118.114 | [V] |
| Inversión en campañas web (TEST 01 + TEST 02) | COP 9.568 | [V] |
| Ventas confirmadas durante las campañas web | 0 | [V] |
| Ventas atribuibles a Meta con evidencia | 0 | [V] |
| Ingresos netos asociados | 0 | [V] |
| Ventas por WhatsApp de septiembre | [ND] | — |
| Precio promedio del catálogo (ponderado por inventario) | COP 179.045 | [R, 2 oct] |
| Comisiones por venta de 1 prenda (escenario): Shopify 2 % + Wompi 2,65 % + COP 700 + IVA | ≈ COP 10.060 (5,6 %) | [V] Shopify 2 %; [R] Wompi con tarifa pública, la real está [ND] |
| Guía de envío (ejemplo Barranquilla → Bogotá, 1 kg) | TCC COP 14.570; Interrapidísimo 16.940; Coordinadora 17.300 | [V] cotización de Envia de hoy |
| Costo del producto (tela, confección, insumos), empaque y devoluciones | **[ND]**: falta el dato de la dueña | — |
| Margen de contribución, CPA máximo y ROAS de equilibrio | **No calculable** sin el costo del producto | — |
| Cota superior del CPA (asumiendo producto gratis) | ≈ COP 169.000 por pedido de 1 prenda (ROAS piso ≈ 1,06) | [R]. **No sirve para decidir**: el CPA real de equilibrio es mucho menor |

**Ejemplo ilustrativo, NO dato real.** Si el costo del producto más el empaque fuera COP 70.000 por prenda:
- La contribución antes de publicidad de una prenda de 179.045 con envío cobrado de 17.900 sería aproximadamente: 179.045 + 17.900 − 70.000 − 10.900 (comisiones con envío) − 15.000 (guía) ≈ **COP 101.000**.
- Ese sería el CPA máximo de equilibrio y daría un ROAS de equilibrio ≈ 1,9.
- Hay que reemplazarlo con el costo real.

**Conclusión:** hoy la rentabilidad real es **negativa**, con COP 9.568 gastados en web y 0 ventas. El punto de equilibrio **no puede calcularse** hasta tener el costo unitario.

---

## 7. PÍXEL Y MEDICIÓN

| Ítem | Estado | Fuente |
|---|---|---|
| Integración | App "Facebook & Instagram" de Shopify, canal conectado; dataset **Radaelli Swimwear Web 1415307240666037**; 1 catálogo conectado | [V] |
| Pixel + API de conversiones | Ambos activos ("API de conversiones • Píxel de Meta"; los eventos figuran como "Múltiple" = navegador + servidor) | [V] |
| Nivel de datos compartidos | "Optimizado" en Shopify (un registro anterior decía "Máximo"; contradicción sin aclarar) | [R] |
| Eventos (28 días, 12 sep–9 oct + hoy) | PageView 230 · Ver contenido 56 · Agregar al carrito 16 · Iniciar pago 13 · Agregar info de pago 3 · Comprar 3 (las 3 son pruebas). Hay eventos antiguos de la web anterior (select_size, view_cart, filter_use) sin actividad reciente | [V] |
| Calidad de coincidencia de eventos | 6,1/10 (PageView y Ver contenido) | [V] |
| Deduplicación | Los IDs de evento llevan el prefijo `sh-` de Shopify, preparados para deduplicar (verificado en la prueba del 2 oct). **No se verificó hoy en el panel de deduplicación** | [R] / [ND] |
| Dominio verificado | Registro DNS `facebook-domain-verification` presente en radaelliswimwear.com. El estado en la Configuración del negocio no se revisó hoy | [V] DNS / [ND] |
| Consentimiento | Banner de Shopify activo en 32 regiones, Colombia incluida (decisión legal). El píxel y Shopify Analytics **solo registran a quien acepta**. **Probado hoy:** sin aceptar = invisible; aceptando = medido | [V] |
| Posibles errores de atribución | 1) Las visitas a la página las mide Meta con su navegador interno, sin depender del consentimiento; por eso Meta ve 84 y Shopify ve 0. 2) Las sesiones "Bot" con UTM de Meta probablemente son rastreadores o precargas de Meta. 3) Si llega una venta de alguien que rechazó cookies, Meta **no** la atribuirá y Shopify la verá como "directa o desconocida". 4) Las ventas por WhatsApp no se atribuyen a nada | [V] / [E] |
| Diferencia Meta vs Shopify | Meta: 302 clics, 84 visitas, 0 compras. Shopify: 0 sesiones humanas desde Meta, 0 ventas. **En ventas coinciden (0); en tráfico divergen por el consentimiento y la calidad** | [V] |

---

## 8. DIAGNÓSTICO CRÍTICO

1. **¿Usamos bien el presupuesto?**
   - Parcialmente. El gasto es bajo y está controlado (≈ COP 4.000/día).
   - Pero el 98 % fue a inventario barato del Feed de Facebook, que generó clics de baja intención.
   - En TEST 01, la mitad se fue a Audience Network.
   - En septiembre se gastaron COP 108.546 en conversaciones de WhatsApp sin medir las ventas resultantes.
2. **¿Demasiadas modificaciones?**
   - En pocos días, sí: 3 cambios con impacto en el aprendizaje entre el 7 y el 10 oct.
   - Cada uno respondió a un problema real y verificado (evento invisible, Audience Network, clics basura).
   - Pero ninguna configuración tuvo más de ~24 h de datos antes del siguiente cambio.
   - **A partir de ahora hay que congelar**: mínimo 72 h y, mejor, ≥7 días o ~50 resultados.
3. **¿El público está bien segmentado?**
   - Edad, sexo y ciudades tienen sentido para la marca.
   - El interés "viajeros" lo impone Meta como sugerencia; su aporte es **[ND]**.
   - El problema mayor no es el público sino la **ubicación**: Instagram casi no entrega.
   - En septiembre, el anuncio "NECESIDAD" sugiere que el mensaje importa más que el interés.
4. **¿Los anuncios generan intención de compra?**
   - No hay evidencia: 0 vistas de producto, carritos o pagos medidos.
   - El CTR alto con poca reproducción del video indica curiosidad o error, no intención.
5. **¿El presupuesto está fragmentado?**
   - No. Hoy hay 1 campaña, 1 conjunto y 1 anuncio.
   - El riesgo es el contrario: un solo creativo y ningún aprendizaje comparativo.
6. **¿La campaña aprende o solo consume?**
   - Hasta hoy, **consumió**: optimizaba a clics y no a intención.
   - Con visitas a la página de destino (desde las 8:30 de hoy) puede empezar a aprender. A ~COP 60 por visita y ~COP 4.000/día son ~65 visitas/día [E], volumen suficiente para salir de aprendizaje si la calidad acompaña.
7. **¿El problema está en el anuncio, el público, la página o el checkout?**
   - Orden de probabilidad, con la evidencia disponible:
     1. **Medición** (consentimiento).
     2. **Calidad del tráfico por ubicación** (Feed de FB / clics accidentales).
     3. **Fricción de la página en el celular** (banner que tapaba, doble toque; ambos corregidos hoy).
     4. **Precio** (hipótesis, sin prueba).
     5. Checkout: **sin evidencia**, porque nadie real llegó.
8. **¿Qué decisiones funcionaron y cuáles no?**
   - Funcionaron:
     - Quitar Audience Network.
     - Fijar los UTM.
     - Detectar el problema del consentimiento con pruebas controladas.
     - Arreglar el doble toque y el banner.
     - Pasar a visitas a la página de destino.
   - No funcionaron:
     - Optimizar a Iniciar pago sin señal.
     - Optimizar a clics (atrae clics basura).
     - Excluir el Feed de IG sin un creativo 4:5 (dejó a Instagram sin entrega).
9. **Errores que no hay que repetir:**
   - Lanzar sin verificar que la medición funciona en un visitante real que no acepta cookies.
   - Juzgar por CTR.
   - Editar durante el aprendizaje.
   - Excluir la ubicación principal de la marca por un problema del creativo en vez de adaptar el creativo.
   - Gastar en WhatsApp sin registrar ventas por conversación.
10. **Información que falta para decidir responsablemente:**
    - Costo unitario del producto y del empaque.
    - Tarifa real de Wompi.
    - Tasa de aceptación del banner nuevo: medible al comparar visitas de Meta con sesiones de Shopify con UTM de Meta en los próximos días.
    - Calidad de las visitas tras el cambio.
    - Ventas reales de la campaña de WhatsApp de septiembre.
    - Saldo prepago actual de Meta.
    - Texto principal exacto del anuncio.
    - Rendimiento de Instagram con un creativo adecuado.

---

## 9. RECOMENDACIÓN PARA LO QUE QUEDA DE OCTUBRE (no ejecutar todavía)

### Escenario A — Mantener sin cambios hasta el lunes 13 oct ~9:00 (72 h después del cambio)
- **Ventajas:**
  - Deja aprender la optimización nueva.
  - Mide por primera vez el efecto del banner nuevo y del arreglo del doble toque.
  - Costo bajo.
- **Riesgos:** si el tráfico sigue siendo de baja calidad, se gastan ~COP 12.000 sin señal.
- **Costo:** ≈ COP 12.000 [E].
- **Condiciones:**
  - Los fondos prepago tienen que alcanzar; la dueña los recarga.
  - Monitoreo diario de solo lectura.
  - **Reglas de decisión del 13 oct:**
    - **Seguir** si las sesiones humanas con `utm_source=meta` en Shopify son ≥5 y hay al menos 1 vista de producto o carrito.
    - **Ir a B** si hay visitas en Meta pero Shopify sigue en 0 sesiones humanas desde Meta.
    - **Ir a C** si el costo por visita supera COP 150, o si no hay ninguna señal de intención.

### Escenario B — Ajustes puntuales (después del 13 oct, uno a la vez)
- **Opciones,** en orden de impacto esperado:
  1. **Habilitar el Feed de Instagram con una versión 4:5 del video**, donde el "20 % OFF" quede dentro del recuadro, o pasar a ubicaciones Advantage+ con exclusión de Audience Network.
  2. Agregar 1–2 creativos nuevos de producto con el precio visible, para filtrar curiosas, y comparar contra el actual.
  3. Cuando la medición muestre ≥20–30 vistas de producto por semana, probar la optimización a "Ver contenido". Volver a Ventas solo con señal real.
- **Ventajas:** ataca la causa más probable (ubicación y creativo) sin abandonar la prueba.
- **Riesgos:** cada ajuste reinicia el aprendizaje; con un presupuesto bajo, las conclusiones tardan.
- **Costo:** dentro del mismo presupuesto (~COP 86.000), sin escalar.
- **Condiciones:**
  - Un solo cambio por ventana de 72 h–7 días.
  - Un creativo 4:5 producido por la dueña.

### Escenario C — Pausar y replantear
- **Ventajas:**
  - Ahorra el saldo de presupuesto (~COP 86.000).
  - Da tiempo a resolver los costos, decidir con criterio legal el consentimiento, producir creativos para Instagram y definir la oferta y el precio.
- **Riesgos:**
  - Se pierde lo que ya aprendió la campaña.
  - Se retrasa la primera venta.
  - La "Edición rosa" (20 %) vence el 31 oct, y se perdería la ventana promocional.
- **Costo:** 0 en pauta; costo de oportunidad de ventas.
- **Condiciones:** un plan de relanzamiento con medición validada y un creativo nuevo. Evaluar también volver a WhatsApp (el mejor costo por conversación fue COP 874), pero midiendo ventas por conversación.

**Recomendación de Claude:**
1. **A** hasta el 13 oct, con las reglas de corte de arriba.
2. Después, **B1**: Instagram con creativo 4:5.
3. **C** solo si el 13 oct no hay ninguna sesión humana de Meta ni señal de intención.

En paralelo, sin tocar la campaña: la dueña entrega el costo unitario y la tarifa de Wompi, y se mide la tasa de aceptación del banner.

---

## 10. EVIDENCIAS Y FUENTES

### Fuentes
- **Meta Ads Manager, en modo lectura:**
  - Tabla de anuncios (vida completa) con columnas de rendimiento, embudo de conversión y ventas.
  - Desgloses por día, ubicación, edad y región.
  - Historial de actividad de TEST 01 y TEST 02.
  - Todo leído el 10 oct entre las ~10:30 y las 11:00 a. m.
- **Administrador de eventos:** dataset 1415307240666037, resumen de 28 días e integraciones.
- **Shopify Analytics (ShopifyQL, no guardado):**
  - Sesiones por día, UTM, humano o bot, dispositivo y página de entrada, del 7 oct a hoy.
  - Pedidos abandonados: 0.
  - Pedidos: solo pruebas.
- **Pruebas controladas con el celular de la dueña:** C (sin aceptar, 7:38 a. m.) y D (aceptando, ~8:00 a. m.).
- **DNS público** del dominio.
- **Registros:** `ai-handoff/claude-result.md`, `ai-handoff/chatgpt-update-2026-10-09.md`, `ai-handoff/cost-audit-2026-10-10.md` y `unit-economics-summary.md` (2 oct).

### Datos faltantes (pedir a la dueña)
1. Costo de producción por prenda o por nivel de precio.
2. Costo del empaque.
3. Tarifa real de Wompi.
4. Ventas cerradas por WhatsApp en septiembre, con sus fechas.
5. Saldo prepago actual de Meta (captura de Facturación).
6. Texto principal del anuncio, o captura de la vista previa.
7. ¿Hay un creativo 4:5 disponible?

**Cambios de vista hechos durante la lectura:** columnas y desgloses de Ads Manager. Al agregar columnas, Meta creó automáticamente el valor predefinido "Copia de Ventas", que es solo una vista y no afecta la campaña. No se tocó ninguna campaña, conjunto, anuncio, presupuesto ni configuración de la tienda.
