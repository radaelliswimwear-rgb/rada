# CLAUDE RESULT

PHASE: 02L — CUSTOMER ACCOUNTS + ACCOUNT WISHLIST ARCHITECTURE
MODEL: OPUS 5.5 ULTRACODE
STATUS: READY_FOR_CHATGPT_REVIEW

Documentos (worktree Shopify, no pusheados):
- `shopify-migration/theme/customer-accounts-report.md`: reporte técnico completo, 24 secciones.
- `shopify-migration/theme/customer-accounts-decision.md`: decision record corto, **source of truth**.

## Informe final

1. **Model confirmed:** **claude-opus-5-5** (metadatos de la sesión). No hay un campo "Ultracode" aparte.

2. **Approximate elapsed time:** **~65 min** (14:05:55 → ~15:10, hora del sistema).

3. **Resource/usage:** leído de la app. **Consumo exacto por tokens: UNAVAILABLE.**
   - Ventana de 5 h: **15% → 41%** (≈26 puntos atribuibles a 02L, incluyendo 2 workflows multiagente: investigación + panel de diseño).
   - Semanal: se reinició durante la fase (22% → 0%).
   - Contexto: 34% (tras una compactación).

4. **Cuenta custom real reauditada:** **YES.** Lectura directa del código ejecutable, sin correr la app ni tocar la base.

5. **Archivos/componentes/modelos auditados:**
   - `lib/auth/*` (7 archivos)
   - `components/auth/*` (8)
   - `components/account/*` (7)
   - `app/cuenta/**` (7 páginas), `app/favoritos`, `app/checkout/confirmacion/[orderId]`, `app/admin/layout.tsx`, `app/admin/usuarios`
   - `lib/wishlist`, `lib/cart`, `lib/guest-identity`, `lib/addresses`, `lib/orders`, `lib/email`, `lib/newsletter`, `lib/back-in-stock`, `lib/request/client-ip.ts`
   - navbar + mobile menu, `components/checkout/*`, `next.config.ts`
   - `prisma/schema.prisma`: `User`, `Session`, `VerificationToken`, `AuthAttempt`, `Address`, `Wishlist`/`WishlistItem`, `Cart`, `Order`*, `Payment`, `EmailOutbox`, `NewsletterSubscriber`, `BackInStockRequest`, `SystemLog`
   - Todos los tests de auth, direcciones, wishlist y carrito.
   - Detalle en el reporte § 1.

6. **Official Shopify docs reviewed:** **≈65 URLs oficiales** (shopify.dev + Help Center), listadas en el reporte § 2.1.
   - Cada afirmación pasó una verificación adversarial: 7 preguntas, 5 confirmadas y 2 parciales, 0 fallas.
   - Los foros aparecen solo como evidencia secundaria y marcados como tal.
   - 4 URLs dieron 404 y se declararon.

7. **New Customer Accounts confirmed architecture:**
   - Ingreso sin contraseña (código de 6 dígitos). El cliente se crea en el primer ingreso (sin registro).
   - Páginas de cuenta alojadas por Shopify. Templates `customers/*` deprecados; las URLs legacy redirigen.
   - Componente oficial `<shopify-account>` para el theme.
   - Personalización de las páginas de cuenta: branding en el editor + extensiones de apps.

8. **Passwordless flow mapping:**
   - `<shopify-account>` abre la hoja de ingreso sin salir de la tienda.
   - `routes.account_login_url` → ingreso → pedidos.
   - `routes.storefront_login_url` → vuelve a la página donde estaba la clienta.
   - Login, registro y recuperación custom desaparecen.
   - Detalle: reporte § 2–3.

9. **Header account integration: PASS.**
   - Desktop: `<shopify-account>` (menú configurable por setting). Con sesión, la inicial la dibuja Shopify; no hay estado inventado.
   - Fallback: `<noscript>` y `routes.account_url` sin cuentas nuevas.
   - Mobile: sin cambio ("Mi cuenta" en el menú, EXACT del real).
   - Harness: 10 anchos (1440→320) sin overflow; 44 px.

10. **Native Shopify account features mapping:** matriz de 20 filas en el reporte § 3.
    - **Native:** ingreso, salir, alta, verificación, perfil, direcciones, pedidos, detalle, navegación, devoluciones (opcional).
    - **App:** favoritos y unión invitada → cuenta.
    - **Ext:** "Mis favoritos".
    - **Not needed:** contraseñas, pagos guardados.
    - **Change:** admin y roles.

11. **Legacy templates needed:** **NO.** El theme no los tiene. Que Shopify los ignore quedó como GO/NO-GO 9.

12. **Authenticated storefront detection strategy:**
    - Solo el objeto Liquid `customer`, y solo para mostrar. Que se llene con cuentas nuevas está implícito, no explícito → GO/NO-GO 1.
    - Para escribir: identidad **firmada por Shopify** (`logged_in_customer_id` en el app proxy) o session token en la extensión.
    - Nunca globals, cookies ni ids del navegador.

13. **Wishlist persistence options compared:** A–F × 14 criterios (reporte § 6).
    - Combinación elegida: **A** (dato) + **D** (escritura) + **C/E** ("Mis favoritos").
    - **B** (base propia) descartada: agrega mantenimiento sin ganar nada.

14. **Recommended remote wishlist architecture:**
    - **Dato:** metafield **del comercio** `custom.wishlist` (`list.product_reference`), creado en Admin, tope 100 para altas nuevas sin recortar nunca.
    - **Lectura:** Liquid → bootstrap JSON, 0 requests.
    - **Escritura:** app proxy → función sin estado → Admin `metafieldsSet` con `compareDigest`.
    - **Página en la cuenta:** extensión full-page.
    - **Interruptores:** setting apagado + app embed.

15. **App required:** **YES.** App custom de Radaelli, custom distribution.

16. **Backend required:** **YES**, mínimo: **una función sin estado, sin base de datos**, alojada fuera del Vercel/Neon actual.

17. **Customer Account extension required/recommended:** **YES (recomendada).**
    - `customer-account.page.render` en el menú de la cuenta; es la vía oficial para "Mis favoritos" dentro de la cuenta.
    - Fallback: link del menú a la página de la tienda.

18. **Customer metafields role:** son **la fuente de verdad** de los favoritos de la cuenta.
    - Del comercio, no `$app`: los de app se borran al desinstalar (documentado).
    - Liquid los lee; solo la app los escribe.

19. **Guest local adapter status:** **sin cambios de comportamiento respecto de 02K.** Regresión de invitada en el harness: 4 pruebas PASS.

20. **Remote adapter contract status:** **DEFINIDO E IMPLEMENTADO (inerte).**
    - `window.Radaelli.wishlist.connectAccount(transport)` con `transport.apply({add, remove}) → {items, rejected, notFound}`; errores con `.status`.
    - Se activa solo con bootstrap Liquid **y** transporte de la app.
    - **Sin `fetch` a `/apps` en el theme.**

21. **Merge algorithm defined:** **YES.**
    - `{A,B,C}+{B,D} = [B,D,A,C]`: la cuenta primero, después invitada.
    - Pseudoflujo exacto en el reporte § 9. Implementado en funciones puras + orquestación, y probado.

22. **Merge idempotency strategy:**
    - Unión por GID con deduplicación en el servidor; CAS con `compareDigest`.
    - Web Lock + relectura de lo local dentro del lock: **1 sola unión con 2 pestañas** (probado).
    - Reintentar la misma unión no duplica (probado).

23. **Merge failure preservation strategy:**
    - Lo local se poda **solo tras un 200** y solo lo confirmado, inexistente o quitado con sesión.
    - Falla 500/503: la vista no se revierte (cuenta ∪ invitada pendiente) y se reintenta a los 2/8/30 s.
    - 401: aviso + link a la cuenta, **sin bucle ni recarga**.
    - Tope: los rechazados quedan en el navegador y no se reenvían.
    - Todo probado.

24. **Logout/privacy strategy:**
    - La lista de la cuenta **nunca** se guarda en el navegador.
    - La cola guarda solo intenciones sin confirmar, separada por `sha256(customer.id:shop)`, y vence a 30 días **con aviso visible**.
    - Una página sin sesión publica `signed-out` y las otras pestañas vuelven a invitada sin recargar.
    - `pageshow` revalida.
    - Todo probado; riesgo residual declarado (reporte § 10).

25. **"Mis favoritos" account UX strategy:**
    - Extensión full-page en el menú, en la URL de Shopify (**sin forzar `/cuenta/favoritos`**).
    - Lee con la Customer Account API; "Ver producto" con `href`; sin carrito.
    - "Quitar" vía Customer Account API o session token; **nunca** por el proxy.

26. **Storefront wishlist strategy:**
    - Misma `page.wishlist` y misma UI: en modo cuenta la fuente es la cuenta.
    - Único agregado: un aviso oculto por defecto (401 / tope / vencidos).
    - Ningún botón que aparente sincronizar.

27. **Data model:** GIDs de producto en orden (sin precio, stock, HTML ni copias).
    - Invitada: `{v, items:[{id, handle}]}`.
    - Cola: `{v, owner, ops, rejected, updatedAt}`.
    - Casos: producto borrado, handle cambiado, archivado y variante resueltos en el reporte § 13.

28. **Security/trust boundary:**
    - La identidad solo la da Shopify: HMAC en tiempo constante, allowlist de tienda, ±300 s, 401 si está vacío.
    - Sin tokens en el navegador; token de Admin solo en la función.
    - Sin IDOR; sin email como llave.
    - `private, no-store`; CSRF con POST + JSON + header propio.
    - Diagrama en el reporte § 14.

29. **Current wishlist migration plan:** reporte § 15.
    - Export de solo lectura; usuario → cliente por email; slug → handle → GID.
    - Unión con `compareDigest`, dry run, auditoría JSONL, snapshot para rollback.
    - Las listas de cookie de invitada **no son migrables**.
    - Pre-crear clientes requiere aprobación de Daniela.
    - **Nada ejecutado; Neon no se tocó.**

30. **Orders/profile/addresses mapping:** todo **nativo**, sin dashboard propio.
    - Desaparecen `/cuenta/**`, login y registro, la sesión propia y los emails de cuenta.
    - Branding, menú e ingreso social se ajustan en el Admin.
    - Redirects `/cuenta`→cuenta y `/favoritos`→`/pages/favoritos` al lanzar (reporte § 16).

31. **Offline code changed:** **YES.**
    - `header.liquid`: `<shopify-account>` + fallbacks + setting `customer_account_menu`.
    - `section-header.css`.
    - `wishlist.js`: capa de cuenta inerte + núcleo puro + cola, lock, canal, TTL y `signed-out`; invitada idéntica.
    - `theme.liquid`: bootstrap / marcador `signedOut` detrás de `wishlist_account_sync`.
    - `main-wishlist.liquid`: aviso.
    - `section-wishlist.css`.
    - `settings_schema.json` / `settings_data.json`: `wishlist_account_sync` = false.
    - Locales es/en: 4 claves.
    - README + nota en `wishlist-report.md`.

32. **Theme Check errors:** **0** (57 archivos).

33. **Theme Check warnings:** **0**.

34. **JSON/Liquid/JS validation:** 16 JSON válidos, 12 JS con `node --check` OK, Liquid validado por Theme Check. Además, en 5 páginas del espejo: sin IDs duplicados ni interactivos anidados.

35. **Harness/tests result:** **28/28 PASS** en el harness aislado (127.0.0.1:4177, scratchpad; mocks **solo** ahí; `preview_start` solo por URL).
    - Cubre: núcleo puro, selección de adaptador, unión OK / idempotente / con falla / transitoria, tope, cola persistente, última intención gana, 401, logout, `signed-out` entre pestañas, TTL con aviso, superficies sincronizadas, página en modo cuenta, lock con 2 pestañas, BroadcastChannel, `pageshow`, header en 10 anchos, fallbacks, estructura y regresión 02K.
    - **0 requests a `/apps`.**
    - **Mutation testing: 6/6 regresiones inyectadas fueron detectadas.**
    - Declarado: clicks y `pageshow` sintéticos; el HTML es espejo del Liquid.

36. **Secrets:** **0.**

37. **Store-specific IDs/domains:** **0** en código funcional. Solo quedan menciones documentales previas (comentarios de `hero.liquid`, README).

38. **Production touched:** **NO.**

39. **Staging touched:** **NO.**

40. **Shopify Store created:** **NO.**

41. **Development Store created:** **NO.**

42. **App installed/created:** **NO.** Tampoco extensiones, scopes, clientes ni códigos de ingreso.

43. **Deploy:** **NO.**

44. **Push main:** **NO.** Solo archivos de handoff a `origin/ai-handoff`.

45. **Major self-corrections:**
    - (a) La vista de cuenta excluía lo de invitada pendiente, así que durante la unión o un 401 los corazones "se vaciaban". Se cambió a cuenta ∪ invitada pendiente ⊕ cola; quitar un ítem pendiente también lo poda de local.
    - (b) Sin almacenamiento, `loadOutbox` borraba la cola en memoria. Corregido.
    - (c) Al cruzar con los "must-fix" de los jueces faltaban el **TTL con aviso** y la **señal de `signed-out` entre pestañas**. Se agregaron, con pruebas y mutantes.
    - (d) El test del header no cubría 390/430/640. Se agregaron (10 anchos).
    - (e) Se envía la base por el canal **antes** de vaciar la cola, para evitar un parpadeo en otras pestañas.
    - (f) Conflicto entre jueces ante un 401 ("recargar" vs "no recargar"): se resolvió **sin recarga**, porque Liquid ya confirmó la sesión y el 401 probablemente sea el bug de `logged_in_customer_id`. Documentado.

46. **Concrete Opus value observed:**
    - Panel de 3 propuestas + 2 jueces: **cambió el almacén de `$app` a metafield del comercio**, porque desinstalar la app borraba todos los favoritos. También **rechazó** una aserción de identidad propia (bearer de 12 h que sobrevivía al logout).
    - La verificación adversarial separó lo oficial de los foros, marcó 1 contradicción del Help Center y 4 URLs 404.
    - El mutation testing demostró que la suite detecta regresiones reales.

47. **Blockers requiring Development Store (GO/NO-GO, reporte § 20):**
    1. `customer` en Liquid tras cada vía de ingreso con cuentas nuevas;
    2. tasa de `logged_in_customer_id` vacío;
    3. cache entre clientas;
    4. `compareDigest` en la Admin API;
    5. Customer Account API escribe en `custom.*`;
    6. extensión full-page en el plan real + ítem en la hoja;
    7. token de Admin sin base de datos;
    8. el proxy reenvía los headers anti-CSRF;
    9. templates legacy ignorados.

48. **Blockers requiring app/backend:**
    - App custom con app embed (transporte), app proxy, función sin estado y extensión "Mis favoritos".
    - Scopes (`read/write_customers`, `read_products`, `write_app_proxy`, `customer_read/write_customers`) y datos protegidos nivel 1.
    - Migración.
    - Además: definición `custom.wishlist` en Admin.

49. **READY FOR PHASE 02M:** **YES.** El alcance de 02M lo define ChatGPT; no se asume.

50. **CERO TAREAS DE SEGUNDO PLANO ACTIVAS** al cerrar la fase: servidores del harness detenidos, previews cerrados. Después de este handoff solo corren los chequeos finitos 1/2/5, que terminan solos.

## Observaciones para ChatGPT (fuera de alcance, no tocadas)

- `locales/` tiene **dos** `*.default.json` desde 02A. Shopify admite uno solo; el inglés debería ser `en.json`. Theme Check no lo marca. Propuesto para una fase de empaquetado.
- **Pendiente de Daniela:**
  - pre-alta de clientes (Habeas Data);
  - devoluciones;
  - ingreso social;
  - nota de privacidad;
  - redirects al lanzar.

## Manual Step Required

**NO** para cerrar 02L. Para avanzar a la implementación hace falta una **Development Store** con New Customer Accounts, que el usuario debe crear. Claude no crea tiendas ni inicia sesión en Shopify.

## Ready For Next Phase

02M — solo cuando `next-prompt.md` sea reemplazado y `status.md` diga `READY_FOR_CLAUDE_02M`.
