# 03B — Configuración base de la Development Store + página de contraseña + chequeo real de cuentas

Modelo: **Opus 5.5** (`claude-opus-5-5`, ULTRACODE).

Tiempos (hora de Bogotá):
- **Tramo 1:** 2026-09-28, 17:20 → 19:02. Se cortó la luz.
- **Tramo 2:** 2026-09-29, 07:14 → ~08:40. Daniela fuera hasta las 13:00; se aplican la *TEMPORARY ABSENCE DIRECTIVE* y la *ABSOLUTE NO-MANUAL-REQUEST RULE*.

**Estado:** el theme **Radaelli RC1** (id `189072474431`) sigue **sin publicar**. **Horizon** sigue live y no se tocó. 0 productos, 0 colecciones propias, 0 apps custom o de wishlist. No se publicó nada ni se tocaron dominio, impuestos, envíos ni pagos.

Lo que queda abierto, en total:
- **1 bloqueo owner-only diferido:** el código del login de cliente.
- **2 pasos que dependen de la publicación:** idioma principal de la tienda y asignación de `page.wishlist`.
- **4 decisiones de negocio:** entidad/dirección en EE. UU., mercado US, tono voseo/tú y tarifas de envío en 03C.

Todo está en **una sola lista priorizada** al final.

## Resumen de lo que pasó

1. **Configuración de la tienda** (Admin autenticado, sin pedir nada a Daniela).
   - Moneda USD → **COP**.
   - Hora del Este (EE. UU.) → **Bogotá**.
   - Imperial/lb → **métrico/kg**.
   - Mercado **Colombia** creado y activo; región de respaldo EE. UU. → **Colombia**.
2. **Idioma.**
   - Shopify exige su app oficial **Translate & Adapt** para agregar idiomas: el diálogo "Agregar idioma" la instala.
   - Se instaló como **excepción autorizada** a la lista NO (ver *Desviaciones*).
   - Español agregado y publicado, y **predeterminado del dominio**: `/` = español, `/en` = inglés.
   - El diálogo que se había cortado con el apagón se rehízo el 29-09.
3. **Idioma principal de la tienda (Admin): sigue Inglés, a propósito.** "Cambiar idioma predeterminado" avisa que reescribe "tu tema actual y los temas de tu biblioteca", o sea también Horizon, y 03B prohíbe tocarlo. El storefront ya está en español.
4. **Página de contraseña propia**, aceptada y medida en Shopify real (es y en).
   - Tras la revisión adversarial se corrigieron 8 detalles:
     - sin promesa de "abre pronto";
     - h1 que nunca queda vacío;
     - textos por idioma;
     - `.is-invalid`;
     - `overflow-wrap`;
     - saltos de línea;
     - tamaño del logo;
     - `theme-color`.
5. **Favoritos: bug real encontrado y corregido.**
   - El Admin solo ofrece plantillas del theme **publicado**, así que la página `favoritos` no puede tener `page.wishlist` hasta publicar. El corazón del header llevaba a una página genérica.
   - Ahora, si la página no tiene la plantilla, el link pide `?view=wishlist` (plantilla alternativa oficial). Con la plantilla asignada, el link queda limpio solo.
6. **Bug real en inglés encontrado y corregido: doble escape.**
   - En Shopify, `| t` ya devuelve el texto escapado. El theme le aplicaba `| escape` otra vez en 26 lugares, y en `/en` los textos con apóstrofo se veían como `We&#39;re` o `couldn&#39;t`.
   - Además, `cart.js` mostraba con `textContent` textos del JSON `cart-config`, donde el navegador no decodifica. Ahora los decodifica una vez.
   - Verificado en Shopify real y offline.
7. **Navegación mínima:** menú principal → **Inicio**; footer: Buscar (+ el link legal de Shopify).
8. **Customer Accounts.**
   - Nuevas cuentas activas.
   - Las rutas GET legacy redirigen al login nuevo.
   - El login real llegó hasta **"Introducir código"** → `DEFERRED_OWNER_ONLY_BLOCKER`.
9. **Release RC1.2** = lo subido: `dist/radaelli-shopify-theme-rc1.2.zip`.
   - SHA-256 `00f008b97c8e9097c88079863e565f93a429eb3ffe0485a7a329590263f7c86f`.
   - 96 archivos, determinista (2 builds, mismo hash).
   - Manifiesto con Theme Check del ZIP extraído (0/0) y baseline actualizado.
   - RC1.1 queda reemplazado.

## Informe (53 puntos)

1. **Model confirmed:** claude-opus-5-5 (ULTRACODE).

2. **Elapsed time:** ~102 min (28-09, 17:20 → 19:02) + ~86 min (29-09, 07:14 → ~08:40). Total ≈ 3 h 10 min, sin contar el apagón.

3. **Usage:**
   - Ventana de 5 h: **12%** a las 08:00; semanal: **10%** (plan Max, lectura de la app).
   - Incluye 1 workflow de verificación adversarial de 4 agentes (~521 k tokens de subagentes).
   - El total exacto de 03B es **UNAVAILABLE**.

4. **CLI session valid:** **YES.**
   - `theme info --json` → store `radaelli-swimwear-dev.myshopify.com`, CLI 4.8.2, `development_theme_id: null`.
   - `theme list` / `pull` / `push` / `check` funcionaron sin volver a autenticar.

5. **Language before:** Inglés, único idioma.

6. **Language after:**
   - Español publicado y **predeterminado del dominio**; inglés secundario en `/en`.
   - Idioma principal de la tienda (Admin): **Inglés, diferido** (ver punto 3 del resumen).

7. **Spanish primary:** **PASS en el storefront / DEFERRED en Admin.**
   - `/` usa `es.default.json`, `lang="es"`, `Shopify.locale = es`, 0 traducciones faltantes.
   - Textos nativos en español: login de cuentas, carrito vacío.
   - `en.json` disponible en `/en`.
   - La decisión 1 del prompt ("Idioma principal: ESPAÑOL") queda cumplida para la clienta. El cambio en Admin se hace al publicar.

8. **Currency before:** USD.

9. **Currency after:** COP.

10. **COP:** **PASS.**
    - Admin "Moneda de la tienda" = COP.
    - `Shopify.currency.active = COP` en las 18 cargas del smoke.
    - `/cart.js` → `"currency":"COP"`.
    - Formato de dinero: sin productos no hay un importe que mostrar; se verifica en 03C con el primer producto.
    - Umbral de envío gratis: `free_shipping_threshold` (299.900) está "en pesos, sin centavos". `cart-free-shipping.liquid` lo multiplica × 100 y solo lo aplica si `cart.currency.iso_code == shop.currency` (COP). Queda expresado en COP.
    - La barra de envío gratis **no** se activó.

11. **Market/country status:**
    - **Colombia** activo (COP, sin recaudación de impuestos); región de respaldo **Colombia**.
    - **United States** sigue activo (decisión comercial, no se tocó).
    - Aviso de tarifas de envío para Colombia → 03C.

12. **Timezone status:** `America/Bogota`, métrico/kg.
    - Nombre de la tienda sin cambios.
    - Contacto de la tienda (Admin → General) sin cambios: correo de la cuenta, sin teléfono, dirección en EE. UU. (decisión de negocio).

13. **Support email updated:** **YES.** `theme_support_email: info@radaelliswimwear.com`.

14. **Password architecture used:** la documentada por Shopify en https://shopify.dev/docs/storefronts/themes/architecture/templates/password.
    - `templates/password.json` con una sección (`main-password`).
    - `{% form 'storefront_password' %}` con `input type="password" name="password"` y `shop.password_message`.
    - Más `"layout": "password"` → `layout/password.liquid`, el layout alternativo estándar de las plantillas JSON.
    - No se reusó el `password.liquid` de 48 bytes ni se copió Horizon.

15. **Password files created:**
    - `layout/password.liquid`
    - `templates/password.json`
    - `sections/main-password.liquid`
    - `assets/section-password.css`
    - `general.password.{heading, message, label, submit, error, admin_prompt, admin_link}` en es/en

16. **Password server validation:** **PASS.**
    - Aceptado por Shopify (0 rechazos; paridad 96 = 96).
    - `/password` y `/en/password` en el preview: 200, `template-password`, form nativo, 0 errores Liquid, 0 traducciones faltantes.
    - Sin `<script src>` propio.

17. **Password responsive/accessibility:** **PASS.**
    - **Shopify real**, 1280/390/320, en es y en:
      - 0 overflow, tarjeta centrada;
      - input de 51 px, botón ≥ 47 px, link de admin de 44 px;
      - titular y mensaje en el idioma correcto;
      - `theme-color` = fondo suave.
    - **Offline, Liquid real:**
      - 3 variantes × 9 anchos, centrado horizontal y vertical;
      - label, 1 `h1`, `main` + skip link;
      - foco: skip link → campo → botón → link de admin;
      - con error: `role="alert"` + `aria-invalid` + `aria-describedby` + `.is-invalid`;
      - el mensaje de Preferencias pisa al de respaldo;
      - h1 nunca vacío;
      - mensaje largo sin espacios sin overflow a 320;
      - saltos de línea → `<br>`, HTML escapado.
    - **Nota honesta:** que la plantilla propia se muestre a los visitantes cuando la tienda esté protegida en un plan pago es una **inferencia no verificada**. En la Dev Store los visitantes siempre ven la de Shopify (verificado sin cookies: `/` → `/password` sin theme).

18. **Favorites page created:** **YES.** "Favoritos", handle `favoritos`, visible.

19. **Favorites URL 200:** **PASS para el 200 y la vista wishlist.**
    - `/pages/favoritos?view=wishlist` → 200, `template-page--wishlist`, estado vacío de invitada.
    - `/pages/favoritos` sin `view` → 200 con la plantilla genérica. **La URL limpia todavía no usa `page.wishlist`.**

20. **Wishlist template active:** **DEFERRED hasta publicar; mitigado (PASS) con `?view=wishlist`.**
    - La asignación en Admin solo ofrece plantillas del theme publicado (Horizon: "Página predeterminada", "contact"). El editor masivo de páginas no existe (404).
    - La vía API (`templateSuffix`) requiere una app o un token de Admin API, y 03B prohíbe apps custom y tokens. No se usó.
    - Mientras tanto, el header enlaza `/pages/favoritos?view=wishlist` (y `/en/pages/favoritos?view=wishlist`), verificado en Shopify real.
    - Offline se probaron las 2 ramas (página elegida en el setting y respaldo `pages['favoritos']`), asignada y sin asignar, con mutante.

21. **Navigation changes:**
    - Main menu: Home / Catalog / Contact → **Inicio**.
      - Se quitó Catalog (`/collections/all`, vacía).
      - Se quitó Contact (la página por defecto de Shopify, en inglés; RC1 no tiene plantilla de contacto). **La página sigue existiendo y no se borró.**
    - Footer menu: Search → **Buscar**; "Your Privacy Choices" sin tocar.
    - Menú de cuenta: Orders, Profile.
    - Páginas actuales: `contact`, `data-sharing-opt-out` (Shopify) y `favoritos`.
    - No hay links a colecciones inexistentes.

22. **New Customer Accounts enabled:** **YES.** URL `shopify.com/<id>/account`, enlaces de login en el header ON. Devoluciones de autoservicio OFF y crédito en tienda ON (defaults).

23. **Real passwordless login tested:** **NO — DEFERRED.**
    - Recorrido verificado hasta **"Introducir código"**: `/customer_authentication/login` → login de Shopify en español → correo de la cuenta dueña de la tienda → código enviado.
    - Ese paso es de la dueña; Claude no ingresa códigos.
    - Hubo una espera finita de 6 min (07:28–07:34, tramo 2). La directiva de ausencia estaba en GitHub desde las 07:20, pero se leyó a las 07:40. Es una desviación menor: no se volvió a esperar ni a pedir.

24. **Customer Liquid object after login:** **DEFERRED.** Sin sesión: `customer` **ABSENT** (slot `signed-out-avatar` presente, sin `customerId` en `ShopifyAnalytics`).

25. **Account component authenticated state:** **DEFERRED.** Sin sesión: **PASS** (`<shopify-account>` con shadowRoot en todas las páginas y anchos).

26. **Logout:** **DEFERRED.**

27. **Legacy customer templates required:** **NO.** El theme no tiene `templates/customers/*`.

28. **GO/NO-GO #1 result:** **DEFERRED, y aunque llegue el código queda PARCIAL en 03B.** Sub-criterios de 02L (`customer-accounts-report.md` § 20):
    - (a) `customer` en **página** tras ingreso con código + `<shopify-account>` con sesión, pestaña nueva, pageshow, logout/re-login, pedidos/perfil y return-to-store → **se desbloquea con el código**.
    - (b) En **producto y colección** → después de 03C (hoy hay 0 productos).
    - (c) Otras vías (hoja `<shopify-account>`, Shop, `storefront_login_url`) y el vencimiento a las 24 h y a los varios días → pendientes aparte.
    - La sincronización de cuenta sigue **OFF**; 03C no depende de #1.

29. **GO/NO-GO #9 result:** **PARCIAL.**
    - **GO** para lo probado: GET `/account/login` y `/account/register` → `shopify.com/authentication/<id>/login`, y el theme no necesita templates legacy.
    - **NO PROBADO:** el sub-criterio de 02L "un POST legacy a `/account` no crea clientes" y las otras rutas legacy (`/account`, `/account/orders`, `/account/addresses`). Probar el POST implicaría enviar un formulario que podría crear un cliente, y borrarlo no es algo que Claude pueda hacer. Queda para cuando Daniela esté.

30. **Wishlist remote sync remains OFF:** **YES.** `wishlist_account_sync: false`, sin `#wishlist-account-state`, modo `guest`, 0 requests a `/apps`, sin metafield, app proxy ni extensión.

31. **Guest wishlist regression:** **PASS antes del login / DEFERRED después del login.**
    - Método en Shopify real: como hay 0 productos, no hay corazones en el theme. Se insertó en la página del preview un **botón sintético oculto** `[data-wishlist-trigger]` con id y handle ficticios y se hizo clic, ejercitando el `wishlist.js` real.
    - Resultado: guarda `{v:1, items:[{id,handle}]}`, el contador del header pasa a 1 (3 lugares) y vuelve a 0 al quitar. 0 requests a `/apps`. Dato borrado después. Repetido tras los últimos pushes: igual.
    - Con corazones reales en tarjetas y ficha: test offline "K Wishlist" PASS.

32. **Home shell:** **PASS.**

33. **Search shell:** **PASS.**

34. **Cart shell:** **PASS.**

35. **Favorites shell:** **PASS** (vía `?view=wishlist`).

36. **Locale Spanish in real preview:** **PASS.** 15 cargas en español (`es`) + 3 en `/en` (`en`).

37. **Currency COP in real preview:** **PASS** (18/18 + `/cart.js`).

38. **Desktop 1280:** **PASS.**

39. **Mobile 390:** **PASS.**

40. **Mobile 320:** **PASS.**
    - Matriz final en Shopify real después del último push: Home, Search, Cart, Favoritos, Password y `/en` × 1280/390/320 = **18/18**, sin overflow, errores JS propios ni assets fallidos.
    - Además, doble escape en `/en` (6 páginas) y `/password`: 0.

41. **Fatal JS errors:** **0** propios. Solo "Script error." de scripts de Shopify de otro origen, dentro del iframe `srcdoc` de medición.

42. **Fatal Liquid errors:** **0** (real y offline: 0 errores de render, 0 traducciones faltantes, 0 assets inexistentes).

43. **Theme Check errors:** **0** (`theme-src` y ZIP extraído; registrado en `release-manifest.json`).

44. **Theme Check warnings:** **0.**

45. **Shopify push rejected files count:** **0.**
    - 5 pushes parciales al id `189072474431`:
      - password + support email (tramo 1);
      - CSS de contraseña;
      - header;
      - 6 archivos de la revisión de contraseña;
      - 9 archivos del arreglo de escape.
    - Ningún JSON trajo `warning`/`errors` y la paridad final es 96 = 96, 0 diferencias semánticas.

46. **Live theme still Horizon:** **YES** (`#189072113983`).

47. **Radaelli theme unpublished:** **YES** (`#189072474431`).

48. **Product count 0:** **YES** (Admin vacío; `/products.json` → 0; solo la colección automática `frontpage`).

49. **App installed:** **YES (1): Shopify Translate & Adapt**, app oficial y gratuita de Shopify.
    - Es una **excepción autorizada** a "NO app install" (§19); ver *Desviaciones*.
    - 0 apps custom o de wishlist.

50. **Production/Staging/main touched:** **NO.** Tampoco Vercel, Neon, Wompi, DNS, dominio, impuestos, tarifas, pagos, merge ni PR.

51. **Blockers for 03C:** ninguno técnico para el catálogo. A tener en cuenta:
    - El idioma principal (Admin) es Inglés: lo que se cargue quedará como contenido principal aunque esté en español. Al cambiar el idioma principal pasa a ser el contenido en español (no se traduce ni se pierde).
    - Envíos para Colombia sin configurar.
    - Asignar `page.wishlist` y activar redirects de `/favoritos` recién al publicar.

52. **READY FOR 03C:** **YES** (catálogo), con el blocker owner-only aislado.

53. **CERO TAREAS DE SEGUNDO PLANO ACTIVAS** al cerrar el reporte. Los servidores del arnés quedaron detenidos; los únicos pendientes son el handoff y los 3 checks finitos.

## Desviaciones de la lista NO

- **App install (§19): Shopify Translate & Adapt.**
  - El diálogo "Agregar idioma" del Admin la instala para poder agregar Español.
  - Autorización de Daniela en el chat: pregunta del 28-09 a las 18:40 ("¿Autorizás esa única app?"). Respuesta a las 19:00: *"deja de interrumpir el trabajo ya haz todo manual tienes todos los permisos de hacer todoooooo no omitas nada"*.
  - No es custom ni de wishlist. Tampoco se aceptó ningún cobro.

## DEFERRED_OWNER_ONLY_BLOCKERS

- **DEFERRED_OWNER_ONLY_BLOCKER: CUSTOMER ACCOUNT LOGIN CODE.** Pantalla: `https://radaelli-swimwear-dev.myshopify.com/customer_authentication/login` → correo de la tienda → "Introducir código". Habilita el GO/NO-GO #1 (a).

## Lista única priorizada para Daniela (cuando vuelva)

1. **Código de login (2 min).** Abrir en tu Chrome el link de arriba, poner el correo de la tienda y escribir en esa pantalla el código de 6 dígitos que llega por email. **No pegarlo en el chat.** Claude hace el resto: `customer` en Liquid, `<shopify-account>`, logout/re-login, pedidos/perfil, return-to-store y el POST legacy de #9.
2. **Decisión: idioma principal de la tienda → Español.** ¿Ahora (Shopify reescribe también el idioma por defecto de Horizon, que es descartable) o al publicar RC1? Recomendación: **al publicar**.
3. **Decisión: entidad y dirección de la tienda** (hoy EE. UU.). Afecta impuestos, pagos y el login de Shopify (`es-US`, `region_country=US`).
4. **Decisión: mercado United States** activo o no.
5. **Decisión: tono de los textos.** El sitio actual y el theme usan voseo ("Guardá", "Podés"); ¿se mantiene o se pasa a "tú"? Son ~15 claves de `es.default.json`.
6. **Al publicar (acción irreversible, de la dueña):** asignar la plantilla "wishlist" a la página Favoritos en el mismo paso, antes de activar los redirects de `/favoritos`.

## Hallazgos y correcciones

1. **Link a Favoritos (bug real, corregido):** `sections/header.liquid` usa `page.template_suffix` + `?view=wishlist`. Verificado en Shopify real (es/en) y offline en 2 ramas × 2 estados + mutante.
2. **Doble escape de `| t` (bug real en `/en`, corregido):**
   - Se quitó `| escape` después de `| t` en 23 atributos de 6 archivos, y en 3 plantillas asignadas (SKU y contadores de galería).
   - `main-password` escapa solo el texto de la comerciante.
   - `cart.js` decodifica los textos de `cart-config`.
   - El arnés offline ahora imita a Shopify (`t` escapa salvo `*_html`, `?locale=en`), y un test nuevo recorre 7 páginas en inglés + el error del carrito.
3. **Página de contraseña (revisión adversarial):**
   - sin "La tienda abre pronto" (§7 prohíbe claims de lanzamiento);
   - titular y mensaje con respaldo por idioma (h1 nunca vacío, `/en` sin mezcla);
   - `.is-invalid` en error;
   - `overflow-wrap: anywhere`;
   - `newline_to_br`;
   - logo hasta 200 × 80 px sin deformar;
   - `theme-color` = fondo suave.
4. **Comentario del CSS corregido:** la columna arregla el centrado **vertical** (medido en Shopify: en fila 40/436 px, en columna 238/238), no el horizontal.
5. **Dev Store:** los visitantes ven la contraseña de Shopify y no la del theme.
6. **Login de Shopify en `es-US`, `region_country=US`:** coherente con la entidad en EE. UU.
7. **SEO (no bloquea):** mientras la plantilla no esté asignada, el canonical de `?view=wishlist` apunta a la URL limpia genérica. La tienda está protegida y se corrige al asignar. Opcional a futuro: `noindex` en la wishlist.

## Evidencia y herramientas

- **Regresión offline con Liquid real:** **44/44 PASS**. Son los 38 de 02M/03A más 6 de 03B:
  - Favoritos, 2 ramas × 2 estados;
  - I18n en inglés;
  - 4 de contraseña.
- **Mutation testing de 03B:** **9/9 mutantes detectados** sobre el theme final; el control pasa.
  1. sin columna
  2. sin alerta
  3. label sin `for`
  4. header sin `?view`
  5. sin `overflow-wrap`
  6. h1 sin respaldo
  7. `t | escape` en atributo
  8. h1 con doble escape
  9. `cart.js` sin decodificar
- **Revisión adversarial** (workflow de 4 agentes: cobertura, afirmaciones de código, fix del header, página de contraseña): 28 observaciones. Se corrigieron las de código, los estados del informe y la documentación. Lo que no aplica quedó explicado en este informe.
- **Shopify real:**
  - iframe `srcdoc` del HTML del preview (el storefront bloquea iframes por `frame-ancestors`);
  - fetch anónimo para la protección;
  - Admin en solo lectura para el snapshot.
- **Escaneo de secretos del ZIP:** solo el correo de soporte (intencional) y los placeholders de email.
- **Límites de Shopify:** 0 violaciones.

## Snapshot final de Shopify (sin secretos)

| Ítem | Valor |
|---|---|
| Idioma del storefront | es (predeterminado del dominio) · en en `/en` |
| Idioma principal (Admin) | Inglés — cambio al publicar |
| Moneda | COP |
| País / mercado | Colombia activo (región de respaldo Colombia) · United States activo |
| Zona horaria | America/Bogota · métrico/kg |
| Theme live | Horizon `#189072113983` |
| Theme sin publicar | Radaelli RC1 `#189072474431` = RC1.2 (`00f008b9…c86f`) |
| New Customer Accounts | Activas, links de login ON |
| Página Favoritos | Creada; wishlist vía `?view=wishlist` hasta publicar |
| Plantilla de contraseña | En el theme, validada en el preview (es/en) |
| Menús | Main: Inicio · Footer: Buscar (+ link legal) · Cuenta: Orders, Profile |
| Productos | 0 |
| Apps | Translate & Adapt (oficial, excepción autorizada); 0 custom o de wishlist |
