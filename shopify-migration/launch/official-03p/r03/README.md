# 03R — entregables (2026-10-02)

| Carril | Archivo | Qué es |
|---|---|---|
| B/C | `meta-integration-runbook.md` | Runbook con fuentes: conexión oficial Shopify↔Meta, niveles de datos, deduplicación, plan de prueba T0–T8 con UTM, 12 puertas READY_FOR_PAID_MEDIA, riesgos (Colombia/Shops, modo Optimized, Meta Ads Data Advisor) |
| D | `dashboard/tablero.html` | Tablero semanal en español (publicado como artefacto privado de Claude); lógica probada con `dashboard/test.cjs` (datos de prueba inventados, solo en la prueba) |
| E | `unit-economics-filled.csv`, `unit-economics-summary.md`, `owner-cost-questions.md`, `eval_csv.js`, `eval-output.txt` | Hoja con precios por nivel, 2 % de Shopify y tarifa pública de Wompi verificados; todo costo real = `FALTA_DATO`; 8 preguntas mínimas a la dueña |
| F | `d13-colombia-consent-research.md`, `d13-privacy-policy-audit.md`, `d13-proposed-texts-es.md`, `final/` | Investigación de consentimiento en Colombia, auditoría de políticas, textos propuestos y **textos publicados** (`final/privacy-policy.html`, `final/cookie-policy.html`), respaldo de los textos anteriores (`final/backup-before-2026-10-02.json`) y script de aplicación (`final/apply-policies.mjs`) |
| G | `monitor/monitor.mjs`, `monitor/monitoring-runbook-es.md`, `monitor/baseline.json`, `monitor/run-*.json|md` | Monitoreo de solo lectura (DNS, TLS, HTTP, rutas, catálogo, Admin, IVA 0, inventario, precios, envíos) |
| tiempo | `timing-reconciliation-2026-10-02.md` | Conciliación de tiempos por puerta/tarea y total de reloj de pared desde 07:30 |

Notas: las pruebas sintéticas de este equipo (monitor y verificación de UTM con `curl`) no ejecutan JavaScript y no generan sesiones de analítica; las 2 sesiones de carrito/checkout del monitor (~12:15–12:16) sí pudieron registrarse: excluirlas al leer analítica de la ventana 03R.
