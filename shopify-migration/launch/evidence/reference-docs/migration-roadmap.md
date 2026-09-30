# Roadmap, portabilidad, estrategia paralela y riesgos

Parte de la [auditoría de viabilidad de migración a Shopify](../shopify-migration-feasibility-audit.md). Ninguna fase de este documento fue ejecutada — es una propuesta para el momento en que se decida avanzar.

---

## 17. Estimación de esfuerzo por fases

| Fase | Contenido | Complejidad | Dependencias | Riesgos | ¿Claude puede ejecutar la mayoría? | Pasos manuales de Daniela |
|---|---|---|---|---|---|---|
| **0 — Viabilidad/arquitectura** | Este mismo audit | Hecho | — | — | Sí (ya ejecutado) | Decidir si se avanza |
| **1 — Esqueleto de theme** | Repetir el trabajo ya hecho en `shopify-theme/` (base Dawn + paleta/tipografía) sobre una tienda de desarrollo real | Baja-Media | Tienda de desarrollo creada | Ninguno relevante | Sí, casi todo | Crear la tienda de desarrollo (gratis, Shopify Partners) |
| **2 — Home/Header/Footer** | Secciones custom (hero, categorías, footer dinámico) | Media | Fase 1 | Fidelidad visual de las interacciones más complejas (zoom de categorías, hero dual) | Sí, con iteración visual | Revisar/aprobar el resultado visual |
| **3 — Producto/Colecciones** | PDP completa, galería, filtros | **Alta** | Fase 1 | El magnifier/lightbox y el filtrado animado son el trabajo más pesado de todo el frontend | Sí, pero es la fase más larga | Revisar/aprobar |
| **4 — Carrito/Cliente** | Cart drawer, cuentas de cliente nativas | Media-Alta | Fase 1 | Se pierde el dashboard de cuenta custom; wishlist requiere elegir/instalar una app | Sí para el drawer; la elección de app de wishlist es una decisión de negocio | Elegir la app de wishlist (hay costo asociado) |
| **5 — Pagos/Checkout** | Instalar y configurar Wompi Pagos; diseñar la estrategia de reconciliación de pagos huérfanos | **Alta — la fase de mayor riesgo real** | Fase 4 | Ver wompi-payments.md — bug documentado de pedidos "abandonados" pese a pago real | Parcialmente — instalar la app sí, pero decidir/construir la reconciliación automática (si se quiere) es una pieza de desarrollo custom seria | Confirmar con soporte de Shopify y de Wompi los puntos "REQUIERE CONFIRMACIÓN" de wompi-payments.md antes de procesar un solo pago real |
| **6 — Migración de datos** | Productos, clientes, pedidos, cupones, contenido | Media | Catálogo congelado | Ítems marcados REQUIRES DECISION en data-migration.md | Sí, con scripts de importación | Decidir la comunicación de "reseteo de acceso" a clientas; validar la muestra migrada |
| **7 — Analytics/SEO** | Configurar Web Pixels/Customer Events, Meta channel, mapa completo de redirects | Media-Alta | Fase 6 (URLs finales conocidas) | Pérdida temporal de ranking documentada como riesgo general de la industria | Sí | Aprobar el mapeo final de redirects antes de publicarlo |
| **8 — QA** | Probar cada flujo (visual + funcional) en la tienda de desarrollo, sin tocar producción | Media | Fases 1-7 | — | Sí, con la misma disciplina de testing ya usada en este proyecto | Aprobar el QA final |
| **9 — Prueba en paralelo con producción real** | Ventana acordada con tráfico/pedidos de prueba controlados, sin apagar el sitio actual | Media | Fase 8 | Confusión de datos si no se aísla bien (mismo criterio que el aislamiento de staging ya construido en este proyecto) | Sí | Definir la ventana y los criterios de éxito |
| **10 — Corte de dominio** | DNS, congelamiento final de catálogo/stock, publicación | Baja (técnicamente), Alta en tensión operativa | Fase 9 exitosa | Ventana de inconsistencia de stock/pedidos si no se coordina bien | Parcial — el cambio de DNS es una acción del proveedor de dominio, requiere acceso de Daniela | Ejecutar el cambio de DNS; congelar pedidos nuevos en el sitio viejo durante la ventana de corte |

---

## 18. Estrategia de migración en paralelo (reversible)

**Principio no negociable**: `radaelliswimwear.com` sigue sirviendo tráfico real, sin cambios, durante TODO el proceso de construcción y prueba de la versión Shopify.

1. **Tienda de desarrollo**: Shopify ofrece tiendas de desarrollo gratuitas e ilimitadas en el tiempo bajo una cuenta de Partners — no se paga ni se compra ningún plan hasta el día que se decida lanzar de verdad. Todo el trabajo de las Fases 1-8 ocurre ahí, en un dominio `*.myshopify.com` separado, sin ningún vínculo con `radaelliswimwear.com`.
2. **Cómo comparar páginas**: lado a lado, la tienda de desarrollo (`*.myshopify.com` o un dominio de prueba tipo `*.pentest.invalid`-style si se prefiere no exponer el nombre real) vs. la producción real — mismo criterio de comparación visual/funcional ya usado en este proyecto para el theme de evaluación construido antes.
3. **Implicancias de sincronización de datos**: mientras las dos tiendas corren en paralelo, cualquier pedido/cliente/stock nuevo ocurre SOLO en el sistema actual (Next.js/Postgres) — la tienda Shopify de desarrollo usa datos de prueba/una copia congelada, nunca datos reales en vivo, hasta el corte final. Esto evita el problema de "¿cuál de las dos tiendas es la verdad?" mientras se construye.
4. **Cuándo congelar el catálogo**: justo antes de la migración final de datos (Fase 6 → 9), no antes — mientras se construye el theme, el catálogo real puede seguir cambiando libremente en el sitio actual sin afectar el trabajo de Shopify (que usa una copia/muestra).
5. **Cuándo migrar el stock final**: en la ventana de corte (Fase 10), como el último paso antes de apagar la aceptación de pedidos nuevos en el sitio viejo — un snapshot final de stock real se importa a Shopify justo antes de apuntar el DNS ahí.
6. **Corte de DNS**: cambio de registro DNS de `radaelliswimwear.com` apuntando de Vercel a Shopify — acción reversible (ver rollback abajo) pero con tiempo de propagación real (minutos a horas según TTL).
7. **Estrategia de rollback**: mientras el DNS no se haya cambiado, el rollback es trivial (no hay nada que revertir, el sitio actual nunca dejó de correr). Una vez cambiado el DNS, revertir es simplemente volver a apuntar el DNS a Vercel — el sitio actual, si no se desmanteló, sigue funcionando exactamente igual que antes. **Recomendación explícita**: no desmantelar ni dar de baja Vercel/Neon/el código actual hasta tener varias semanas de operación estable confirmada en Shopify — la reversibilidad total depende de mantener el sistema viejo intacto y pagado durante ese período de transición.

**Esto hace que la migración sea reversible hasta el último momento**, tal como se pidió — el único paso genuinamente delicado es el corte de DNS mismo, y ese paso es en sí mismo reversible con la misma facilidad con la que se hizo.

---

## 19. Portabilidad del diseño actual

**¿Se puede convertir el resultado visual actual en un theme Shopify reutilizable/importable?** Sí, en gran medida — de hecho ya se hizo un primer ejercicio de esto en una fase anterior (`shopify-theme/`, basado en Dawn con la paleta/tipografía/estructura de home y footer de Radaelli ya aplicadas).

| Elemento | ¿Reutilizable tal cual? |
|---|---|
| Paleta de colores (`app/globals.css` tokens) | **Sí**, directo — son valores hex, van a `config/settings_data.json` |
| Tipografía (Poppins, Google Fonts) | **Sí**, directo |
| CSS de layout/espaciado (Tailwind utilities) | **Parcial** — los valores/proporciones se pueden reusar como referencia, pero Tailwind v4 (`@theme`) no corre en Shopify; hay que reescribir como CSS plano o adoptar un enfoque utility-first propio dentro del theme |
| JS de interacciones simples (scroll-blur del header, toggles) | **Parcial** — la lógica se puede portar a JS vanilla, pero no el código React tal cual |
| Componentes React (Hero, ProductCard, Gallery, etc.) | **NO** — deben reescribirse como Liquid + JS/web components; React no corre en un theme Shopify estándar |
| `framer-motion` (animación de wishlist, reflow de grilla) | **NO** — Shopify themes no incluyen React/framer-motion; hay que reconstruir con CSS transitions/Web Animations API o una librería JS ligera |
| `lib/image-framing.ts` (crop con zoom real) | **NO tiene traducción directa** — es un workaround de un bug específico de `next/image`; en Liquid habría que resolver el recorte de otra forma (CSS `object-position` + `background-size` calculado, posiblemente sin el mismo control fino) |
| Assets (imágenes/videos ya en Cloudinary) | **Sí**, se pueden seguir sirviendo desde Cloudinary igual que hoy, o migrar a Shopify Files |
| Contenido de copy (textos de home, políticas, etc.) | **Sí**, directo |

**Conclusión de la sección 19**: el resultado visual SÍ es portable a un `.zip` de theme Shopify — de hecho ya existe un punto de partida real. Los componentes React deben reescribirse (no traducirse automáticamente), y las interacciones más sofisticadas (magnifier, lightbox pinch-zoom, animaciones `framer-motion`, el workaround de recorte de imagen) requieren desarrollo custom en Vanilla JS/Web Components — son el grueso real del esfuerzo de las Fases 2-3 del roadmap, no un simple ejercicio de copy-paste de CSS.

---

## 20. Registro de riesgos

| Riesgo | Probabilidad | Impacto | Mitigación | ¿Bloqueante de la migración? |
|---|---|---|---|---|
| Checkout/Wompi: pedidos marcados "abandonados" pese a pago real | **Alta** (bug ya documentado por la comunidad de Shopify) | Alto (dinero cobrado sin pedido reconocido) | Construir un middleware/app propio de reconciliación (repite parte del trabajo actual), o aceptar reconciliación manual a menor escala que hoy | **NO bloqueante, pero cambia significativamente el caso de negocio de "migrar para dejar de mantener código propio"** |
| Wompi Pagos (app): cero reseñas públicas, sin trayectoria confirmada a escala | Media | Medio-Alto | Piloto controlado antes de procesar volumen real; confirmar con soporte de Wompi | No bloqueante, sí requiere validación previa |
| Pérdida de ranking SEO durante el corte de URLs | Alta (riesgo genérico de cualquier migración de URLs a gran escala) | Medio | Mapa de redirects 1:1 completo antes del corte, monitoreo post-corte | No bloqueante con buena ejecución |
| Analytics: gap en exclusión de tráfico interno / gating de Purchase en pedidos no pagados | Media | Bajo-Medio | Pixel custom con lógica de cookie propia | No bloqueante |
| Contraseñas de clientas no migrables | **Cierta** (confirmado técnicamente) | Bajo-Medio (fricción de UX, no de datos) | Comunicación proactiva + el modelo OTP de Shopify simplifica el "reset" a un simple primer login | No bloqueante, es un hecho a planear |
| Migración de historial de pedidos reales | Media | Medio | Confirmar herramienta/app de importación antes de comprometerse a fecha | No bloqueante |
| Stock inconsistente durante la ventana de corte | Media | Alto (sobreventa o pedidos perdidos) | Congelar pedidos nuevos en el sitio viejo durante una ventana corta y coordinada antes de importar el stock final | No bloqueante con buena coordinación |
| URLs de imágenes rotas si se migra de Cloudinary a Shopify Files sin plan | Baja | Bajo | Decisión explícita: mantener Cloudinary o migrar, no dejarlo a mitad de camino | No bloqueante |
| Apps de terceros (wishlist, etc.) introducen su propio riesgo de mantenimiento/costo/fiabilidad | Media | Bajo-Medio | Elegir apps con reseñas reales, evaluar antes de comprometerse | No bloqueante |
| Limitaciones de Shopify no descubiertas hasta la implementación real | Media | Medio | Fase 1-3 en tienda de desarrollo real antes de cualquier compromiso de fecha/presupuesto mayor | Mitigado por la estrategia paralela (sección 18) |
| Fidelidad visual del theme por debajo de lo esperado | Baja-Media | Medio (percepción de marca) | Iteración visual dedicada en Fases 2-3, comparación lado a lado | Mitigado por la estrategia paralela |
| Corte de dominio (DNS) | Baja (técnicamente simple) | Alto si sale mal sin plan | Ventana coordinada, TTL bajo preparado con antelación, plan de rollback documentado (sección 18) | No bloqueante con buena preparación |
| Rollback después del corte | Baja | Medio | Mantener el sistema actual intacto y pagado varias semanas post-corte antes de desmantelarlo | No bloqueante si se sigue la recomendación |
