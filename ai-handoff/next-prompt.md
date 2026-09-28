# NEXT PROMPT

STATUS: READY_FOR_CLAUDE

PHASE: 02D — FOOTER
MODEL: SONNET 5 ULTRACODE

RADAELLI SWIMWEAR — SHOPIFY MIGRATION
FASE 02D — FOOTER

CONTEXTO

La Fase 02C — Header & Navigation terminó correctamente.

Estado confirmado:
- Header actual reauditado contra código real
- Announcement bar implementada
- Desktop nav implementada
- Mobile header implementado
- Mobile drawer implementado
- Sticky behavior replicado
- Dropdown capability preparada
- Accessibility PASS
- Keyboard PASS
- Focus management PASS
- Reduced motion PASS
- Logo configurable
- Menu Shopify configurable
- Cart count real
- Search trigger preparado
- Wishlist placeholder preparado
- Account placeholder preparado
- Theme Check: 0 errores / 0 warnings
- JSON PASS
- Liquid PASS
- 0 secrets
- 0 store-specific IDs/domains
- Production NO tocada
- Staging NO tocado
- Shopify Store NO creada
- Deploy NO
- Push main NO

OBJETIVO

Construir el FOOTER real del futuro theme Shopify de Radaelli,
manteniendo alta fidelidad con la web actual y dejando su contenido
administrable desde Shopify.

Debe incluir:
- logo / brand identity
- navegación footer
- links legales
- contacto
- redes sociales
- newsletter placeholder/arquitectura
- copyright
- responsive mobile/desktop
- accesibilidad
- Theme Editor configurability

NO construir todavía:
- Home
- Product page
- Collection page
- Cart funcional
- Wishlist
- Customer Accounts
- Newsletter backend/app real

==================================================
FUENTE DE VERDAD
==================================================

Antes de implementar, REAUDITAR el footer REAL actual en:
- componentes
- layouts
- páginas
- globals
- navegación
- social links
- textos
- políticas
- responsive behavior

NO depender únicamente del blueprint.

Si blueprint y código actual difieren:
priorizar el comportamiento visual/funcional real actual.

==================================================
IMPLEMENTACIÓN
==================================================

1. Documentar inventario exacto del footer actual:
   logo, tagline, columnas, títulos, links, legales, contacto, redes,
   newsletter, copyright, medios de pago/badges si existen, spacing,
   background, colors, desktop y mobile.

2. Actualizar:
   sections/footer.liquid
   sections/footer-group.json

3. Usar Blocks solo donde aporten valor:
   menu, text, contact, social, newsletter placeholder, image/logo.

4. Menús y legales:
   usar Shopify Navigation/linklists.
   NO hardcodear URLs, handles, colecciones ni páginas legales.

5. Brand area:
   logo configurable, fallback de texto, tagline opcional y texto corto opcional.
   Usar image_url / image_tag.

6. Social:
   Instagram, TikTok, Facebook solo si existe URL.
   NO inventar perfiles.
   Usar snippet icon existente.

7. Contacto:
   email, WhatsApp link y texto configurables.
   Sin integración avanzada.

8. Newsletter:
   auditar si existe hoy.
   Si existe, usar patrón estándar Shopify si corresponde.
   Si no existe, dejar opcional/desactivada.
   NO instalar apps ni integrar Klaviyo/Mailchimp/Resend.

9. Copyright dinámico:
   © {{ 'now' | date: '%Y' }}
   + shop.name o brand text configurable.

10. CSS:
   crear assets/section-footer.css
   usar tokens y foundation de 02B.
   No contaminar base.css innecesariamente.

11. Responsive:
   validar 320 / 375 / 390 / 430 / 768 / 1024 / 1440.
   No inventar accordions mobile si no existen actualmente.

12. Accessibility:
   semantic footer, nav labels, heading hierarchy, focus-visible,
   link text meaningful, form labels, icon labels, contrast, keyboard,
   tap targets >= 44px cuando corresponda.

13. Performance:
   HTML server-rendered.
   JS cero o mínimo.
   Si no hace falta JS, no crear JS.

14. Theme Editor:
   Daniela debe poder modificar sin código:
   footer menus, logo, tagline/text, contact info, social URLs,
   newsletter enable/disable si aplica y copyright/brand text.

15. No hardcodear:
   radaelliswimwear.com
   emails
   teléfonos
   handles
   policy URLs
   store IDs
   theme IDs
   secrets

16. Footer debe funcionar con:
   index, product, collection, cart, search, page, blog, article y 404.

17. Documentar en:
   shopify-migration/theme/footer-report.md

==================================================
VALIDACIÓN
==================================================

Ejecutar:
npx @shopify/cli theme check

Objetivo:
0 errors
0 warnings

Validar además:
- JSON
- Liquid
- CSS
- references
- section schema
- block IDs
- locale keys

Escanear:
- secrets
- tokens
- passwords
- myshopify domains
- store IDs
- theme IDs
- radaelliswimwear.com hardcodeado
- emails hardcodeados
- teléfonos hardcodeados
- Next
- React
- Prisma
- Neon
- Wompi
- Vercel

Resultado funcional esperado: 0.

==================================================
REGLAS DE AISLAMIENTO
==================================================

NO:
- Production
- Staging
- Vercel
- Neon
- Wompi
- DNS
- Shopify Store
- Development Store
- deploy
- push a main
- merge
- PR
- customer auth
- wishlist real
- Home todavía

Trabajar solo en el entorno/branch/worktree Shopify aislado ya usado para 02A–02C.

==================================================
HANDOFF OBLIGATORIO AL TERMINAR
==================================================

Al terminar 02D:

1. Actualizar:
   ai-handoff/claude-result.md

2. Crear copia histórica:
   ai-handoff/archive/02D-result.md

3. Actualizar:
   ai-handoff/status.md

con:
LAST_COMPLETED_PHASE: 02D
CURRENT_PHASE: 02D
NEXT_PHASE: 02E
CURRENT_MODEL: SONNET 5 ULTRACODE
STOP_AFTER_PHASE: 02G
NEXT_MODEL: OPUS 5.5 ULTRACODE
STATUS: READY_FOR_CHATGPT_REVIEW

4. Push SOLO de los archivos de handoff a:
   origin/ai-handoff

NO push de código funcional Shopify a ai-handoff.
NO push a main.

5. El reporte final debe incluir:

- footer actual auditado
- footer implementado YES/NO
- menus configurables YES/NO
- logo configurable YES/NO
- contact configurable YES/NO
- social configurable YES/NO
- newsletter status
- copyright dinámico YES/NO
- blocks implementados
- desktop responsive PASS/FAIL
- mobile responsive PASS/FAIL
- 320px safety
- accessibility PASS/FAIL
- keyboard PASS/FAIL
- contrast PASS/FAIL
- CSS añadido
- JS añadido
- Theme Check errors
- Theme Check warnings
- JSON validation
- Liquid validation
- secrets 0
- store-specific IDs/domains 0
- hardcoded contact/brand URLs 0
- Next/React references 0
- Production tocada NO
- Staging tocado NO
- Shopify Store creada NO
- Deploy NO
- Push main NO
- READY FOR PHASE 02E — HOME YES/NO

==================================================
BACKGROUND TASK RULE
==================================================

NO watchers.
NO loops.
NO long sleeps.
NO background monitoring.

CERO TAREAS DE SEGUNDO PLANO ACTIVAS.

Después DETENTE.
