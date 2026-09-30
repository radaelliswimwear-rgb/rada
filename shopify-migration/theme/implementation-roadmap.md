# Roadmap de implementación del theme (Fase 02, secciones 22 y 23)

## Regla de portabilidad permanente (sección 22)

**Nada crítico debe existir únicamente dentro de Shopify.** Aplicada de forma concreta a este proyecto:

- El theme completo se desarrolla y versiona en Git (este mismo repo o uno dedicado), nunca editado a mano solo desde el Theme Editor sin respaldo en código — mismo criterio ya usado en el ejercicio previo de theme Dawn de esta migración (`shopify-theme/`, repo propio, commits reales).
- Debe poder empaquetarse como `.zip` estándar de Shopify e instalarse en cualquier otra tienda sin dependencias ocultas.
- `settings_data.json` (los valores reales de marca: colores, textos, umbral de envío gratis) se versiona junto al theme — no queda como configuración manual no documentada solo en el Theme Editor.
- El catálogo maestro (`shopify-migration/catalog/`, `source-of-truth/`) sigue siendo la fuente de verdad portable fuera de Shopify, ya establecida desde la Fase 01 — el theme consume esos datos al importar, pero la fuente no vive solo en Shopify.
- Ninguna interacción custom (galería, lightbox, carrusel) depende de una app de terceros que pueda desinstalarse y romper la funcionalidad — todas están documentadas en `interaction-map.md` como vanilla JS propio del theme.

## Fases de implementación (sección 23)

**Ninguna de estas fases se ejecuta todavía** — es la planificación, no el desarrollo. Corresponde a la Fase 02Q en adelante (fuera del alcance de esta fase, que es 100% arquitectura).

| Fase | Input | Output | Dependencies | Estimated Claude time | Manual review required |
|---|---|---|---|---|---|
| **02A Skeleton** | `theme-file-map.md` | Estructura de carpetas + `theme.liquid` mínimo + `config/settings_schema.json` vacío | Ninguna (primer paso) | Baja (1 sesión corta) | Confirmar que el theme instala sin errores en una Development Store |
| **02B Global styles** | `design-tokens.md` | `assets/theme.css` con los 17 tokens de color reales + tipografía Poppins/Mont | 02A | Baja-media | Daniela confirma que los colores/tipografía coinciden con la marca real |
| **02C Header/navigation** | `storefront-blueprint.md` sección 13, `react-to-liquid-map.md` (Navbar) | `sections/header-group.json`, `snippets/predictive-search` | 02A, 02B | Media (drawer + búsqueda tienen JS real) | Revisar navegación mobile y accesibilidad del menú |
| **02D Footer** | `react-to-liquid-map.md` (Footer) | `sections/footer-group.json` | 02A, 02B | Baja | Confirmar links reales (WhatsApp, redes) |
| **02E Home** | `storefront-blueprint.md` sección 1 (Home), `interaction-map.md` #4 y #6 | `templates/index.json` + secciones hero/categorías/vidrieras/newsletter | 02C, 02D | Media-alta (hero dual + carrusel) | Daniela revisa fidelidad visual del Hero y del carrusel |
| **02F Product card** | `react-to-liquid-map.md` (CatalogProductCard), `interaction-map.md` #5 | `snippets/product-card.liquid` + `assets/animations.css` | 02B | Media (reflow de grilla sin framer-motion es la parte laboriosa) | Revisar animación de entrada/hover contra el sitio actual |
| **02G Collection** | `storefront-blueprint.md` sección 8 | `templates/collection.json`, filtros (nativo Search & Discovery o custom, decisión pendiente) | 02F | Media-alta (depende de la decisión de filtros) | Daniela decide si acepta Search & Discovery nativo o quiere conservar el selector de columnas custom |
| **02H Product page** | `storefront-blueprint.md` sección 7, `interaction-map.md` #1 y #2, `data-architecture.md` | `templates/product.json` + galería + lightbox + selector de talla | 02F | **Alta** — la fase más costosa del theme (lightbox es HARD) | Revisión obligatoria: zoom/pinch/pan deben sentirse igual que hoy |
| **02I Cart** | `storefront-blueprint.md` sección 9, `interaction-map.md` #7 | `snippets/cart-drawer.liquid` + Cart AJAX API | 02C | Alta (migra de Server Actions/Prisma a Cart AJAX — cambio de backend) | Probar fusión de carrito invitado→cuenta (paridad con `mergeGuestCartIntoUserAction`) |
| **02J Search** | `storefront-blueprint.md` sección 8, `interaction-map.md` #8 | `templates/search.json` + Predictive Search | 02C | Media | Confirmar que Predictive Search cubre los mismos campos (imagen+nombre+precio) |
| **02K Content pages** | `storefront-blueprint.md` sección 12 | 6 páginas de Shopify + `blog.json`/`article.json` | 02A | Baja | Daniela revisa que el copy legal se migró completo y sin errores |
| **02L Customer/account integration** | `storefront-blueprint.md` sección 11 | `templates/customers/*.json` | 02A | Media (Shopify controla gran parte de la lógica) | **Revisión obligatoria de negocio**: el cambio a login OTP sin contraseña es una decisión de UX que Daniela debe aprobar explícitamente antes de esta fase, no descubrir después |
| **02M Responsive polish** | Todas las fases anteriores | Ajustes finos mobile/tablet en cada template | 02C-02L | Media | QA visual en dispositivos reales |
| **02N Accessibility** | `storefront-blueprint.md` sección 18 | Cierre de las 4 brechas documentadas + verificación de lo que ya funciona bien | 02C-02M | Media | Prueba real de navegación por teclado y lector de pantalla |
| **02O Performance** | `storefront-blueprint.md` sección 17 | Ajuste de `priority`/lazy-load, medición Core Web Vitals real | 02C-02M | Media | Revisar métricas reales (Lighthouse/PageSpeed) contra el sitio actual |
| **02P QA** | Todo lo anterior | Checklist final de paridad visual/funcional contra `radaelliswimwear.com` real | Todas | Media-alta | **Revisión final obligatoria** antes de considerar el theme listo para una Development Store real |

### Notas sobre el orden

- **02H (Product page) es la fase de mayor riesgo e inversión de tiempo** — concentra 2 de las 2 interacciones clasificadas HARD en `interaction-map.md` (lightbox, animaciones). Conviene no subestimarla en la planificación de tiempo real con Daniela.
- **02I (Cart) y 02L (Customer accounts)** son las únicas fases que implican un cambio real de backend/arquitectura (Server Actions+Prisma → Shopify Cart/Customer Accounts nativos), no solo una traducción de UI — se marcan con revisión de negocio, no solo técnica.
- Las fases 02M-02P son transversales por diseño (no producen un template nuevo, endurecen lo ya construido) — no tiene sentido intentar adelantarlas antes de que exista contenido real que pulir.

### Qué NO se hace en ninguna de estas fases (recordatorio, ya establecido en reglas de esta fase)

Ninguna fase de esta tabla escribe Liquid funcional completo, crea una Shopify store, instala el CLI, instala apps, toca pagos, importa productos reales, ni toca el dominio — eso corresponde a fases posteriores (Fase 02Q en adelante), explícitamente fuera del alcance de esta fase de blueprint.
