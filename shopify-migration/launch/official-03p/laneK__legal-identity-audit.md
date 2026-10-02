# Lane K-A — Auditoría de identidad del vendedor / textos legales (tienda oficial `wgcvpd-ib`)

- **START (America/Bogota):** 2026-10-02 09:41:54 · **END:** 2026-10-02 09:52:13
- **Modo:** SOLO LECTURA. Cero mutaciones en Shopify, sin navegador, sin git, sin archivos de handoff, tienda `launch` inactiva intacta, lab solo por archivos ya capturados.
- **Fuentes leídas:** `content/legal/*.html` + `manifest.json` + `owner-fields.json` + `navigation-final-store.json`; `official/laneD/lab-content-snapshot.json`; tema RC1.10 (`rc110-extract/` y `official/laneA/pull-official/`: `config/settings_data.json`, `sections/footer-group.json`, `sections/footer.liquid`, `sections/header-group.json`, `snippets/seo-structured-data.liquid`, `templates/*.json`); `theme/03F-legal-owner-runbook.md`, `theme/03D-legal-policies-inventory.md`; `ai-handoff/owner-action-batch.md` (D9) y `launch/official-03p/launch-today-runbook.md`.
- **Lectura en vivo (solo `query`) de la tienda oficial a las 09:45 Bogotá:** `shop`, `shopAddress`, `shopPolicies`, `locations`, `pages`, `shopLocales`. La salida cruda tenía datos personales (dirección de la tienda, correo) y **se borró** tras extraer solo banderas de presencia: `official-identity-sanitized.json`.
- **Privacidad de este informe:** no se reproducen calle, correo personal ni número completo de WhatsApp; se citan por ubicación (archivo/campo).
- **Aviso:** las referencias a la Ley 1480 de 2011 y a la Ley 1581 de 2012 son un mapa de verificación para la dueña o su asesor, **no asesoría legal**. Los números de artículo marcados `[validar]` deben confirmarse con el texto vigente.

---

## 1. Veredicto en 6 líneas

1. **Ningún texto legal aprobado ni ningún ajuste de la tienda identifica hoy al vendedor.** No hay razón social, NIT, domicilio/dirección de notificaciones, teléfono visible como dato, correo público ni jurisdicción en ninguna de las 6 páginas/4 políticas, ni en el tema, ni en el JSON-LD.
2. **Lo único que "nombra" al vendedor es la marca `Radaelli Swimwear`** (nombre comercial, `shop.name`, copyright del footer) y canales sociales/WhatsApp.
3. **Shopify en vivo:** las políticas «Información de contacto» (`CONTACT_INFORMATION`) y «Aviso legal» (`LEGAL_NOTICE`) **no existen**; `shopAddress.phone` y `shopAddress.company` están **vacíos**; sí hay dirección de tienda cargada (Barranquilla, Atlántico; calle y código postal presentes) y un correo de contacto/remitente Gmail, pero **nada de eso se muestra al público**.
4. **Las 4 políticas nativas publicadas en la tienda oficial coinciden 4/4 con los artefactos aprobados** (privacidad 1697, reembolso 2245, envío 3079, términos 1341 caracteres); por lo tanto los huecos del texto aprobado se replican tal cual.
5. **Huecos adicionales, además de la identidad:** no se menciona la SIC; el título «Garantías y derecho de retracto» de la política de envíos no trae contenido de retracto; la política de privacidad no identifica al Responsable, no da procedimiento/plazos de consultas y reclamos, y nombra proveedores del stack anterior (Resend, Cloudinary) mientras omite a Shopify y a la transportadora (Envia).
6. **Ruta de mínimo impacto** (no toca los textos aprobados): crear «Información de contacto» + «Aviso legal» como políticas nativas con la plantilla del § 6, enlazarlas en el menú «Ayuda», cargar teléfono/empresa en Configuración, y llenar `contact_email`/`brand_name` en el footer. Todo depende de **datos que solo la dueña puede dar (§ 5)**; no se inventó ninguno.

---

## 2. Inventario: dónde aparece (o no) el vendedor

### 2.1 Textos legales aprobados (6 páginas + 4 políticas nativas = mismo cuerpo)

Matriz por documento. `—` = no aparece. Fuente de cada celda: lectura directa de `content/legal/<archivo>.html`; las 4 políticas nativas (reembolso=devoluciones, privacidad, envío=envios, términos) son idénticas al archivo según hash en vivo.

| Dato de identidad / requisito | Términos | Privacidad | Devoluciones (reembolso) | Envíos | Garantía | Cookies |
|---|---|---|---|---|---|---|
| Razón social / nombre legal | — | — | — | — | — | — |
| NIT / documento tributario | — | — | — | — | — | — |
| Dirección / domicilio / notificaciones | — | — | — | — | — | — |
| Teléfono (como texto) | — | — | — | — | — | — |
| WhatsApp | menciona el canal («coordinar tu compra por WhatsApp»), sin número | — | enlace `wa.me/57…` solo en el `href`; texto «Escríbenos por WhatsApp» | — | enlace `wa.me/57…` solo en el `href` | — |
| Instagram | — | — | «WhatsApp o Instagram» (sin usuario) | — | — | — |
| Correo electrónico | — | — | — | — | — | — |
| Canal de contacto citado | «Contáctanos» → `/#contacto` (footer) | «canales de contacto de la tienda» + `/#contacto` | WhatsApp/Instagram | «Contáctanos» → `/#contacto` | WhatsApp | «Contáctanos» → `/#contacto` |
| Nombre de marca | «Radaelli Swimwear es una tienda de trajes de baño…» + «se reserva el derecho» | «Radaelli Swimwear se reserva el derecho» | «costo… corre por cuenta de Radaelli Swimwear» | «Radaelli Swimwear ofrece envío gratuito…» | «productos Radaelli Swimwear» | — |
| Jurisdicción / ley aplicable / foro | — | — | — | — | — | — |
| Mención de la SIC | — | — | — | — | — | — |
| Derecho de retracto | — | — | no lo menciona; niega cambios por «cambió de opinión» | solo el **título** «Garantías y derecho de retracto»; el cuerpo remite a devoluciones/garantía | — | — |
| Habeas Data / Ley 1581 | — | «normativa colombiana de protección de datos (Habeas Data)» (sin ley, sin Responsable, sin procedimiento) | — | — | — | — |
| Fecha de vigencia | — (la quitó 03D: era fecha de render) | — | — | — | — | — |
| Terceros nombrados | Wompi | Wompi, Resend, Cloudinary | — | Envia | — | — |

Evidencia: `content/legal/owner-fields.json` ya declara `razon_social`, `nit`, `direccion_legal`, `representante_legal`, `fecha_publicacion_politicas` como `PENDING_OWNER` / `value: null`, y `theme/03D-legal-policies-inventory.md` línea 78: «NIT, razón social y dirección física: NOT_AVAILABLE en todo el repo».

### 2.2 Estado de Shopify en la tienda oficial (lectura 2026-10-02 09:45 Bogotá)

| Elemento | Estado | Visible al público |
|---|---|---|
| Nombre de la tienda (`shop.name`) | `Radaelli Swimwear` (en el baseline era `My Store 2`) | sí (título, footer, JSON-LD) |
| Política `CONTACT_INFORMATION` («Información de contacto») | **NO existe** | — |
| Política `LEGAL_NOTICE` («Aviso legal») | **NO existe** | — |
| Políticas `TERMS_OF_SALE`, `SUBSCRIPTION_POLICY` | no existen (no son obligatorias para este caso) | — |
| `PRIVACY_POLICY`, `REFUND_POLICY`, `SHIPPING_POLICY`, `TERMS_OF_SERVICE` | existen; cuerpo idéntico al artefacto (4/4); títulos nativos «Política de privacidad», «Política de reembolso», «Envío», «Términos del servicio» | sí (enlaces en el pie del checkout; reembolso y envío en la ficha) |
| `shopAddress.company` (empresa) | **vacío** | no |
| `shopAddress.phone` (teléfono de la tienda) | **vacío** | no |
| `shopAddress.address1/zip/city/province` | **cargados** (Barranquilla, Atlántico, CO; calle y código postal presentes, no reproducidos aquí) | no (no aparece en tema ni en políticas) |
| Dirección de la `location` «Shop location» | cargada (misma ciudad); `phone` vacío | no |
| Correo de contacto y de remitente (`shop.contactEmail`, `shop.email`) | cuenta Gmail (misma para ambos; no reproducida) | **solo** como «responder a»: los clientes ven el remitente `store+<id>@shopifyemail.com` según `owner-action-batch.md` C2 |
| `shop.description` (SEO/Preferencias) | vacía | — |
| Dominio principal | `wgcvpd-ib.myshopify.com` (aún no se conecta el dominio de la marca) | — |
| Página `contact` (`/pages/contact`) | **publicada, título en inglés «Contact», cuerpo vacío, `templateSuffix: contact`**; el tema no trae `page.contact.json` (cae a `page.json`) → página vacía en el sitemap; **no está enlazada** en ningún menú | sí, si alguien conoce la URL |
| Páginas `garantia`, `privacidad`, `terminos`, `envios`, `cookies`, `favoritos` | publicadas | sí |
| Idiomas | `en` principal, `es` publicado | — |
| Autogestión de la política de privacidad | NO legible (token sin `read_privacy_settings`); el wave E la sobrescribió con éxito, por lo que está en OFF | — |

### 2.3 Tema RC1.10 (idéntico en `rc110-extract/` y en `official/laneA/pull-official/`; el ZIP está subido a la tienda oficial como tema **no publicado** id `191904514347`; el tema real publicado no se pudo leer: el token no tiene `read_themes`)

| Dónde | Qué muestra | ¿Identifica al vendedor? |
|---|---|---|
| `config/settings_data.json` → `social_instagram`, `social_facebook`, `social_tiktok` | URLs de perfiles de la marca | No (canales, no identidad legal) |
| `config/settings_data.json` → `social_whatsapp` | enlace `wa.me/57<10 dígitos>` | Solo canal; el footer lo formatea como «+57 XXX XXX XXXX» dentro del desplegable «Contacto» |
| `sections/footer-group.json` → bloque `contacto`: `contact_email` | **vacío** (`""`) | No hay correo público |
| `sections/footer-group.json` → bloque `contacto`: `show_social_channels` | `true` → desplegable «Contacto» con Instagram/Facebook/TikTok/WhatsApp y sus usuarios | Solo redes |
| `sections/footer-group.json` → `brand_name` | `Radaelli Swimwear` → copyright «© 2026 Radaelli Swimwear. Todos los derechos reservados.» | Solo marca |
| `sections/footer-group.json` → `brand_description` | «Radaelli Swimwear: trajes de baño de diseño atemporal…» | Solo marca |
| Footer → menú «Ayuda» (`navigation-final-store.json`) | Envíos, Devoluciones, Garantía, Términos y condiciones, Privacidad, Cookies | **No** enlaza «Información de contacto» ni «Aviso legal» |
| Ancla `#contacto` (`<footer id="contacto">`) | destino de todos los «Contáctanos» de los textos legales | Lleva a un footer que **no** trae correo, teléfono, razón social ni NIT |
| `snippets/seo-structured-data.liquid` (JSON-LD `Organization` en la Home) | `name`=`shop.name`, `url`, `logo` si hay, `description` si hay, `sameAs`=3 redes | **No** emite `legalName`, `taxID`, `address`, `telephone`, `email`, `contactPoint` (por diseño: «sin valores escritos a mano») |
| `templates/product.json` → bloque envíos | enlaces a política de envío y reembolso nativas + `/pages/garantia` | No |
| `layout/password.liquid`, `main-password.liquid` | marca/logo, sin identidad | No |
| `locales/es.default.json` → `general.footer.rights_reserved` | «Todos los derechos reservados.» | No |

### 2.4 Superficies que esta lane NO puede auditar (declaradas)

- **Plantillas de notificación por correo** (pedido, envío, etc.): no existen en Admin API (token sin `read_translations`); lo esperado es pie con el correo de la tienda.
- **Checkout de Shopify:** el pie muestra los enlaces de las políticas guardadas; una vez creadas «Información de contacto» y «Aviso legal» aparecerían ahí (comportamiento de Shopify según `03F-legal-owner-runbook.md` § 4.3 y fuente S1; **verificar tras crearlas**).
- **Razón social que muestra Wompi al pagar:** viene de la cuenta Wompi de la dueña; no legible.
- **Etiquetas de Envia/guías:** vienen de la cuenta Envia (empresa #764546 según `owner-action-batch.md` A5); no auditadas.
- **Correo `info@` en el dominio de la marca:** el recon DNS (`launch-today-runbook.md` §1) indica que el buzón existe (MX Hostinger); **es un candidato a correo público, no un dato confirmado como público**.

---

## 3. Brechas frente a lo que suele exigirse en e-commerce colombiano

Leyenda de **dónde está la brecha**: `TXT` = texto legal aprobado (cambiarlo requiere OK de la dueña/asesor porque es «verbatim del sitio actual»); `SHOP` = campo de Shopify sin llenar; `TEMA` = ajuste del tema (se edita sin código); `DATO` = dato que solo la dueña tiene.

| # | Requisito (referencia a validar por asesor) | Estado hoy | Dónde está la brecha | Ruta de cierre |
|---|---|---|---|---|
| G1 | Identificar al proveedor: nombre o razón social (Ley 1480/2011 art. 50 `[validar]`) | No existe en ningún lado | `TXT` + `SHOP` (empresa vacía, políticas sin crear) + `TEMA` + `DATO` | F2 → Aviso legal / Información de contacto / footer |
| G2 | NIT (art. 50 `[validar]`) | No existe | igual que G1 | F3 |
| G3 | Dirección física / de notificaciones judiciales (art. 50 `[validar]`) | La tienda tiene una dirección en Shopify, pero **no se publica** y no se sabe si es la de notificaciones (el repo dice que no se asume ninguna: `owner-fields.json`) | `SHOP` (políticas) + `DATO` (confirmar cuál publicar) | F4 |
| G4 | Teléfono de contacto (art. 50 `[validar]`) | Solo WhatsApp en el footer (desplegable) y en 2 enlaces; teléfono de la tienda **vacío** | `SHOP` (phone vacío) + `TEMA` | F6, F7 |
| G5 | Correo electrónico de contacto (art. 50 `[validar]`) | `contact_email` del footer vacío; el Gmail de la tienda no se publica | `TEMA` + `SHOP` + `DATO` | F8 |
| G6 | Canal para peticiones, quejas y reclamos (PQR) en el mismo medio (art. 50 `[validar]`) | Hay WhatsApp/Instagram informales; no hay canal PQR declarado ni plazos; `/pages/contact` está vacía y en inglés | `TXT` (parcial) + `SHOP` | F9 |
| G7 | Información de medios de pago y términos y condiciones accesibles | Términos publicados; «Pago» nombra Wompi, tarjeta/PSE/Nequi/Bancolombia (puerta G-PAY ya registrada en `03F`) | `TXT` (revisión humana pendiente) | revisión asesor |
| G8 | Derecho de retracto en ventas a distancia (Ley 1480 art. 47 `[validar]`: 5 días hábiles desde la entrega, con excepciones, p. ej. bienes de uso personal) | Ningún texto lo explica; Devoluciones niega devolución por «cambio de opinión» por tratarse de prendas de baño; el título «Garantías y derecho de retracto» de Envíos queda **sin contenido de retracto** | `TXT` — **decisión legal** (si se invoca excepción, decirlo expresamente) | F18 |
| G9 | Garantía legal / garantía de 12 meses | Garantía de 12 meses publicada; Envíos dice que no limita los derechos de la consumidora | `TXT` OK (revisar con asesor si hace falta citar la garantía legal) | — |
| G10 | Mención de la SIC como autoridad de consumo | **No aparece** | `TXT` / `DATO` | F15 (texto sugerido en § 6) |
| G11 | Entrega en plazo (art. 51 `[validar]`: máx. 30 días) y reversión del pago (art. 52 `[validar]`) | Envíos da 3–5 días hábiles estimados; la reversión del pago no se menciona | `TXT` (recomendado, opcional) | decisión asesor |
| G12 | Protección de datos (Ley 1581/2012 y reglamentación `[validar]`): identificar al **Responsable** (nombre/razón social, domicilio, correo, teléfono), finalidades, derechos, **procedimiento y plazos para consultas/reclamos**, canal, vigencia, transferencias | Privacidad solo cubre datos recolectados, terceros, retención y derechos genéricos; sin Responsable ni procedimiento ni plazos; no dice que sus datos se almacenan en Shopify (fuera de Colombia) | `TXT` + `DATO` | F10 + plantilla § 6.4 |
| G13 | Exactitud del texto de privacidad | Nombra **Resend** y **Cloudinary** (stack anterior) y **omite Shopify** y **Envia**; ya marcado en `03F` § 7.2 como revisión humana | `TXT` — decisión dueña/asesor | revisión asesor |
| G14 | Promociones y ofertas (Ley 1480 art. 33 `[validar]`: condiciones, fechas de inicio y fin o unidades) | Ver `announcement-bar-evidence.md` (sin fecha de fin) | fuera de esta auditoría | ver el otro informe |
| G15 | Fecha de vigencia de cada política | Quitada en 03D (era fecha de render); `owner-fields.json: fecha_publicacion_politicas = null` | `TXT` + `DATO` | F14 |
| G16 | Página «Contact» publicada, vacía y en inglés, sin enlazar | Hallazgo nuevo de esta lane | `SHOP` | llenar con el bloque «Información de contacto», o despublicar |
| G17 | Coherencia de lenguaje (voseo vs. tuteo) | Mezcla heredada (D2 de `owner-action-batch.md`) | `TXT` | decisión D2 |

**Qué es TXT (texto aprobado) y qué es SHOP/TEMA:**
- **Resoluble sin tocar el texto aprobado** (y por eso recomendable): G1–G6, G10, G15 parcial, G16 → vía las políticas nativas «Información de contacto» y «Aviso legal», teléfono/empresa en Configuración y `contact_email`/`brand_name` del footer.
- **Solo resoluble editando el texto aprobado** (necesita OK de dueña/asesor): G8 (retracto), G11, G12 (Responsable, plazos), G13 (proveedores). Se puede hacer sin editar los archivos de `content/legal/` si se pone el contenido nuevo en el «Aviso legal» y se deja una línea de remisión en Privacidad (decisión del asesor).

---

## 4. Otras observaciones de exactitud que descubrí (no cambian identidad, pero afectan lo «aprobado»)

1. **Envíos**: el encabezado «Garantías y derecho de retracto» promete algo que el cuerpo no desarrolla (G8).
2. **Términos «Quiénes somos»**: no es una identificación; la meta description antigua de esa página decía «identificación de la tienda» (`03F` § 3.1).
3. **Privacidad «Tus derechos»** manda a «los canales de contacto de la tienda»: hoy esos canales son el desplegable de redes del footer (sin correo).
4. **Envíos**: «ya con el cupón aplicado, si usaste uno»: hoy no hay cupones migrados (D7).
5. **Políticas nativas**: Shopify titula «Envío» y «Términos del servicio» (títulos nativos); los textos internos y menús dicen «Política de envíos», «Términos y condiciones». No es identidad; es coherencia.

---

## 5. Lista EXACTA de datos que debe entregar la dueña (nada se inventó)

Claves alineadas con `content/legal/owner-fields.json` cuando existen. **R** = requerido para cerrar G1–G6; **Rec** = recomendado; **Op** = opcional.

| # | Clave | Dato exacto que debe entregar | Prioridad | Dónde se usará |
|---|---|---|---|---|
| F1 | `tipo_vendedor` | ¿Persona natural (comerciante) o persona jurídica (S.A.S./Ltda./otra)? | R | decide qué datos corresponden (nombre vs. razón social; C.C. vs. NIT) |
| F2 | `razon_social` | Nombre legal completo exactamente como figura en el RUT / Cámara de Comercio (y nombre comercial «Radaelli Swimwear» si es distinto) | R | Aviso legal, Información de contacto, footer, empresa en Configuración |
| F3 | `nit` | NIT con dígito de verificación (o C.C. si es persona natural y así lo decide con su asesor) | R | idem; también el rótulo «NIT/CC» de Envia (nota de `owner-fields.json`) |
| F4 | `direccion_legal` | Dirección física **que SÍ quiere hacer pública** como domicilio y de notificaciones: calle/carrera y número, barrio, ciudad, departamento. **Confirmar si la dirección ya cargada en Shopify (Barranquilla, Atlántico) es esa**; el repo advierte que puede ser personal y no la asume | R | Aviso legal, Información de contacto |
| F5 | `ciudad_domicilio` | Ciudad de domicilio principal para la cláusula de jurisdicción | R (si se incluye cláusula) | Aviso legal |
| F6 | `telefono_publico` | Número de teléfono de contacto (fijo o celular) | R | Información de contacto + **Configuración > Detalles de la tienda > Teléfono** (hoy vacío) |
| F7 | `whatsapp_comercial` | Confirmar que el WhatsApp del sitio (`social_whatsapp`) es el número comercial que quiere publicar como texto (hoy solo aparece formateado dentro del desplegable «Contacto») | R | Información de contacto |
| F8 | `correo_publico` | Correo público de contacto. **Candidato (sin confirmar): el buzón `info@` del dominio de la marca** (según recon DNS). No usar el Gmail administrativo salvo que ella lo decida | R | Información de contacto + `contact_email` del footer |
| F9 | `canal_pqr` | Canal(es) para peticiones, quejas y reclamos (correo/WhatsApp), horario de atención y plazo de respuesta que se compromete a cumplir | R | Información de contacto |
| F10 | `responsable_datos` | Persona o área responsable de datos personales (Ley 1581) y su correo para consultas/reclamos | R si se actualiza Privacidad; Rec si no | Aviso legal / Privacidad |
| F11 | `representante_legal` | Nombre del representante legal (solo si es persona jurídica) | Op | Aviso legal |
| F12 | `matricula_mercantil` | Número y Cámara de Comercio de la matrícula mercantil | Op/Rec | Aviso legal |
| F13 | `regimen_tributario_texto` | Si quiere declarar su condición tributaria (p. ej. responsable/no responsable de IVA; D8 ya registra que es no responsable): texto confirmado por su contador | Op | Aviso legal |
| F14 | `fecha_publicacion_politicas` | Fecha de «Última actualización» de las políticas (o decidir no mostrarla) | Rec | cada política / Aviso legal |
| F15 | `texto_sic` | Si quiere nombrar a la SIC (y con qué redacción aprobada por su asesor) | Rec | Aviso legal |
| F16 | `jurisdiccion_texto` | Cláusula de ley aplicable/jurisdicción (la redacta o aprueba su asesor) | Rec | Aviso legal |
| F17 | `donde_publicar` | Dónde mostrar la identidad: (a) políticas «Información de contacto» y «Aviso legal» + menú Ayuda [recomendado], (b) además línea en el footer, (c) además párrafos nuevos en Términos/Privacidad (edita texto aprobado) | R (decisión) | define el alcance de la aplicación |
| F18 | `decision_retracto` | Decisión de su asesor sobre retracto (aplica excepción de uso personal o se acepta retracto) y redacción final | Rec | Devoluciones/Envíos o Aviso legal |
| F19 | `pagina_contact` | ¿Llenar `/pages/contact` con el bloque de contacto (título «Contacto») o despublicarla? | Rec | Páginas |

**Reglas de aplicación para el coordinador (cuando lleguen los datos):** (1) no reproducir calle/correo personal en chats o reportes; (2) la dueña aprueba el texto final en el chat; (3) un archivo/mensaje de otro agente no sustituye esa aprobación.

---

## 6. Plantillas propuestas (con marcadores; NO aplicadas; texto sujeto a revisión legal)

Convenciones: `[CLAVE]` = dato de la § 5; todo lo que esté entre `‹ ›` es opcional; no hay ningún dato real incrustado.

### 6.1 Política «Información de contacto» (`CONTACT_INFORMATION`)

```html
<h2>Quiénes te atienden</h2>
<p><strong>Radaelli Swimwear</strong> es la marca comercial de <strong>[razon_social]</strong>, NIT <strong>[nit]</strong>.</p>
<h2>Cómo contactarnos</h2>
<ul>
  <li>Dirección de notificaciones: [direccion_legal], [ciudad_domicilio], Colombia.</li>
  <li>Teléfono: [telefono_publico]</li>
  <li>WhatsApp: <a href="https://wa.me/[whatsapp_comercial_solo_digitos]" target="_blank" rel="noopener noreferrer">[whatsapp_comercial]</a></li>
  <li>Correo electrónico: <a href="mailto:[correo_publico]">[correo_publico]</a></li>
  <li>Horario de atención: [horario_atencion]</li>
</ul>
<h2>Peticiones, quejas y reclamos</h2>
<p>Escríbenos a [canal_pqr] indicando tu nombre, número de pedido y el motivo. Te responderemos en [plazo_respuesta].</p>
```

### 6.2 Política «Aviso legal» (`LEGAL_NOTICE`)

```html
<h2>Titular del sitio y vendedor</h2>
<p>[razon_social] ‹, representada legalmente por [representante_legal]›, NIT [nit], con domicilio en [ciudad_domicilio], Colombia, y dirección de notificaciones en [direccion_legal]. Opera bajo la marca <strong>Radaelli Swimwear</strong>.</p>
<p>‹Matrícula mercantil No. [matricula_mercantil], Cámara de Comercio de [camara].› ‹[regimen_tributario_texto]›</p>
<h2>Contacto</h2>
<p>Teléfono [telefono_publico] · WhatsApp [whatsapp_comercial] · Correo [correo_publico]. Más datos en nuestra <a href="/policies/contact-information">Información de contacto</a>.</p>
<h2>Precios y moneda</h2>
<p>Los precios se expresan en pesos colombianos (COP). [texto_iva_segun_D8_y_contador]</p>
<h2>Protección al consumidor</h2>
<p>[texto_sic: ej. «Si tienes una queja o reclamo que no resolvimos, puedes acudir a la Superintendencia de Industria y Comercio (SIC).»] [VALIDAR CON ASESOR]</p>
<h2>Protección de datos personales</h2>
<p>El responsable del tratamiento de tus datos es [razon_social] ([responsable_datos], [correo_datos]). Consulta nuestra <a href="/pages/privacidad">Política de privacidad</a>.</p>
<h2>Ley aplicable y jurisdicción</h2>
<p>[jurisdiccion_texto — la redacta o aprueba el asesor]</p>
<p>Última actualización: [fecha_publicacion_politicas]</p>
```

### 6.3 Línea de footer (sin código: solo ajustes del tema)

- `sections/footer-group.json` → `footer.settings.brand_name`: `Radaelli Swimwear · [razon_social] · NIT [nit]` → imprime «© 2026 Radaelli Swimwear · [razon_social] · NIT [nit]. Todos los derechos reservados.»
- `sections/footer-group.json` → bloque `contacto` → `contact_email`: `[correo_publico]` (muestra el enlace `mailto:` en el footer, hoy vacío).
- Menú `ayuda`: agregar «Información de contacto» (`/policies/contact-information`) y «Aviso legal» (`/policies/legal-notice`).

### 6.4 Párrafos opcionales para los textos aprobados (**editan texto aprobado → solo con OK de dueña y asesor**)

- **Términos, «Quiénes somos»** (añadir): «Radaelli Swimwear es operada por [razon_social], NIT [nit], con domicilio en [ciudad_domicilio], Colombia. Encuentra todos nuestros datos en el [Aviso legal](/policies/legal-notice).»
- **Privacidad** (añadir sección «Responsable del tratamiento»): «El responsable del tratamiento de tus datos personales es [razon_social], NIT [nit], con domicilio en [direccion_legal], correo [correo_datos] y teléfono [telefono_publico]. Para consultas o reclamos sobre tus datos escribe a [correo_datos]; los atenderemos en los plazos que establece la ley [plazos confirmados por asesor]. Tus datos se almacenan en la plataforma de comercio electrónico Shopify, que puede procesarlos fuera de Colombia.» [REVISAR proveedores nombrados: ver G13]
- **Devoluciones o Envíos, retracto** — `[DECISIÓN LEGAL F18]`: ya sea (a) «Por tratarse de prendas de baño de uso personal e higiene íntima, no aplica el derecho de retracto, conforme a la excepción de la Ley 1480 de 2011 `[artículo a validar]`» o (b) texto de retracto de 5 días hábiles. **No se redacta definitivamente en este informe.**

---

## 7. Cómo se aplicaría cuando haya datos y OK (nada ejecutado por esta lane)

| Paso | Vía | Notas / riesgos |
|---|---|---|
| 1. Crear/actualizar políticas `CONTACT_INFORMATION` y `LEGAL_NOTICE` | Admin GraphQL `shopPolicyUpdate` con el body de § 6.1–6.2 (el wave de políticas ya usó la misma mutación con éxito en esta tienda) | No toca los 4 textos aprobados. Verificar scope `write_legal_policies` en el momento; leer de vuelta con hash; confirmar que aparecen en el pie del checkout |
| 2. Teléfono y empresa de la tienda | **UI** (Configuración > Detalles de la tienda). No hay mutación pública | owner-only o con sesión abierta |
| 3. Menú `ayuda` | `menuUpdate` agregando 2 ítems a políticas | requiere que las políticas existan antes |
| 4. Footer (`brand_name`, `contact_email`) | editar `footer-group.json` y empujar tema (CLI) **o** Personalizar tema | token sin `read_themes`: antes de empujar, leer el tema real en vivo por UI para no pisar ediciones; recordar que RC1.10 aún no está publicado |
| 5. Página `contact` | `pageUpdate` (título «Contacto», cuerpo = bloque § 6.1) o despublicar | hoy vacía y en inglés |
| 6. Textos aprobados (§ 6.4) | solo con aprobación explícita; nueva versión con hash propio | seguir `03F-legal-owner-runbook.md` § 11 |
| 7. Verificación | `shopPolicies` (hash/longitud), `/policies/contact-information`, `/policies/legal-notice`, footer, checkout, JSON-LD (opcional: agregar `legalName`/`taxID`/`address`/`telephone` solo con datos confirmados) | |

---

## 8. Bitácora de lo ejecutado (solo lectura)

- Archivos leídos: ver cabecera.
- Consultas Admin GraphQL (todas `query`, sin `--allow-mutations`): `q-identity.graphql` (shop/shopAddress/shopPolicies/locations/pages/shopLocales), `q-disc-*.graphql` (denegadas: ver el otro informe), `q-variants.graphql`, `q-orders-disc.graphql`. Salidas crudas con datos personales **eliminadas**.
- Conservado: `official-identity-sanitized.json` (banderas de presencia, hashes de políticas 4/4), scripts y `.graphql` en esta carpeta.
- No leído / no legible: tema real publicado (sin `read_themes`), plantillas de correo (sin `read_translations`), autogestión de privacidad (sin `read_privacy_settings`), descuentos (sin `read_discounts`).
