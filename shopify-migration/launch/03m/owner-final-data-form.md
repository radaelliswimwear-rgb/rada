# 03M — Formulario compacto de datos y decisiones de la dueña (solo lo que falta; no se le presenta hasta agotar el trabajo autónomo)

*Cada línea es un dato o un sí/no. Ninguno se inventa. Marcar `PENDING_OWNER` hasta recibir la respuesta.*

## A. Datos de hecho (los escribe ella)

| # | Dato | Dónde se usa | Estado |
|---|---|---|---|
| F1 | Razón social o nombre legal de quien vende | Términos, Privacidad, entidad de la tienda | `PENDING_OWNER` |
| F2 | NIT o documento tributario | Términos, Privacidad, etiqueta «Nit/CC» del checkout si se usa Envia.com | `PENDING_OWNER` |
| F3 | Dirección legal / de notificaciones (la comercial pública, no la personal) | Términos, Privacidad | `PENDING_OWNER` |
| F4 | Representante legal (si aplica) | Términos | `PENDING_OWNER` |
| F5 | Pesos y medidas de cada prenda (o de cada talla, según cómo las empaque) | Tarifas calculadas por la mensajería | `PENDING_OWNER` |
| F6 | Cantidades por variante (98) **o** «vender sin límite» | Inventario (`03m-post-decision.mjs inventory` o `unlimited`) | `PENDING_OWNER` |

## B. Decisiones sí/no

| # | Decisión | Opciones | Estado |
|---|---|---|---|
| D1 | Talla XL de `alba-dorada-cafe-claro` | conservar (98) / eliminar (97) | `PENDING_OWNER` |
| D2 | Aprobar los 4 textos legales pendientes (Privacidad, Términos, Envíos, Cookies) | sí / no / cambios | `PENDING_OWNER` |
| D3 | Datos del sitio actual a migrar: clientas y direcciones, pedidos históricos, cupones, suscriptores, blog | migrar / archivar (cada uno) | `PENDING_OWNER` |
| D4 | Contraste de botones (C4) | A texto oscuro / B arena más oscuro / C excepción firmada | `PENDING_OWNER` |
| D5 | Título y meta descripción de la Home (`seo/03K-home-seo-values.json`) | sí / no | `PENDING_OWNER` |
| D6 | Tarifa por debajo de $299.900 | cálculo en vivo con la mensajería (exige plan y pesos) / importe fijo que ella dé | `PENDING_OWNER` |

## C. Acciones que solo ella puede hacer (con la tienda ya lista)

1. Crear o entrar a su cuenta de Envia.com (pestaña de la app) y, si quiere etiquetas, cargar saldo.
2. Wompi: la integración oficial no aparece hoy en la tienda; cuando aparezca o Wompi indique la ruta, escribir ella las llaves de prueba directamente en la pantalla oficial.
3. Instalar Search & Discovery (aprobar el acceso).
4. Cuentas de analítica (GA4, Meta) y sus aprobaciones.
5. Al transferir: elegir plan, facturación y aceptar la transferencia; DNS y publicar.

## Las 4 únicas 404 intencionales de la tienda de lanzamiento

Las redirecciones `/envios`, `/terminos`, `/privacidad` y `/cookies` apuntan a `/pages/envios`, `/pages/terminos`, `/pages/privacidad` y `/pages/cookies`, páginas que no existen hasta que se resuelvan F1–F4 y D2. Las otras 47 redirecciones apuntan a recursos que sí existen.
