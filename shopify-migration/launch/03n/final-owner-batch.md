# 03N — Lote final de la dueña (una sola lista, solo lo que sigue abierto)

*Nada de esto se le pide a la dueña mientras quede trabajo autónomo. Cada fila dice qué hace Claude en cuanto ella actúe. «Bloquea» = bloquea publicar.*

## A. Se puede hacer ANTES de transferir

| # | Qué necesita (clic o dato exacto) | Por qué | ¿Bloquea? | Qué hace Claude después |
|---|---|---|---|---|
| A1 | **Wompi:** YA HECHO en modo prueba (03N). Falta solo guardar la **URL de eventos** también en el panel de PRODUCCIÓN de Wompi (Desarrolladores → Programadores). | Sin ella un pago aprobado no crea el pedido (se comprobó en Sandbox) | Sí, antes de cobrar de verdad | Nada hasta el corte; en C1 verifica un pago real mínimo solo si ella lo aprueba por escrito |
| A2 | **Envia.com:** la cuenta ya existe. La app de Shopify muestra «No encontramos tu tienda»; la causa probable es que el envío calculado por transportista (CCS) no esté habilitado por el plan. Nada que hacer antes de transferir. | Tarifas en vivo bajo $299.900 | Solo el cálculo en vivo | Tras transferir y elegir plan: Claude reabre la app, pulsa «Continuar», verifica la vinculación y configura origen y paquete estándar |
| A3 | **Peso y medidas reales de una prenda empaquetada** (un solo paquete estándar y el peso de cada producto o de cada talla, como ella prefiera) | Envia y Shopify calculan la tarifa con peso y medidas; hoy todo es 0,0 kg | Solo el cálculo en vivo | Carga los pesos por script a las 98 variantes y el paquete estándar; verifica un checkout bajo $299.900 |
| A4 | **Datos legales** (F1–F4 del formulario): razón social, NIT, dirección legal que quiera publicar, representante si aplica, y «aprobado» para los 4 textos | Privacidad, Términos, Envíos y Cookies | Sí | Crea las 4 páginas, reactiva menús y deja 0 redirecciones en 404 |
| A5 | **Inventario:** cantidades de las 98 variantes **o** «vender sin límite». **Talla XL** de alba-dorada-cafe-claro: conservar / eliminar | Stock y catálogo correcto | Sí (D1/D2) | Ejecuta `03m-post-decision.mjs` (requiere una autorización OAuth adicional de inventario) |
| A6 | **Datos del sitio actual:** clientas, pedidos, cupones, suscriptores, blog: migrar o archivar (una respuesta por tipo) | Evitar perder historial | Sí (D3) | Prepara el paquete y la importación de lo que ella elija |
| A7 | **Botones blancos sobre arena (C4):** elegir A texto oscuro / B arena más oscuro / C excepción firmada | Accesibilidad (1,69:1) | Sí, si no firma la excepción | Aplica el parche elegido, construye RC1.11 y repite paridad |

## B. DURANTE la transferencia y la elección de plan

| # | Qué necesita | Por qué | ¿Bloquea? | Qué hace Claude después |
|---|---|---|---|---|
| B1 | Aceptar la transferencia de la tienda y elegir el plan de Shopify | Sin plan no hay cobros reales ni acceso a más funciones | Sí | Verifica el plan y qué cambia (por ejemplo, si el cálculo de envío con mensajería queda permitido) |
| B2 | Tarjeta/facturación de Shopify | Cobrar el plan | Sí | Nada (solo ella) |
| B3 | Si el plan NO permite tarifas en vivo de terceros: elegir entre subir de plan / pagar el complemento / una tarifa fija bajo $299.900 | Decidir cómo cobrar el envío bajo $299.900 | Sí | Implementa la opción elegida y prueba UN checkout bajo el umbral |

## C. INMEDIATAMENTE DESPUÉS de transferir y antes de publicar

| # | Qué necesita | Por qué | ¿Bloquea? | Qué hace Claude después |
|---|---|---|---|---|
| C1 | Apagar el «Modo de prueba» de Wompi (hoy está encendido) y desactivar la pasarela de prueba de Shopify | Cobrar de verdad | Sí | Verifica que ambas quedaron apagadas y corre UN pago real mínimo solo si ella lo aprueba por escrito |
| C2 | Idioma principal: decidir si pasar de inglés a español (ver §Idioma) | Coherencia del Admin | No | Ejecuta la secuencia segura con respaldo previo |
| C3 | Dominio: proveedor de DNS y acceso; ventana de corte | Publicar | Sí | Runbook P13–P15 |
| C4 | Quitar la contraseña de la tienda y publicar RC1.10 (o RC1.11) | Salir al aire | Sí | Publica, mide y confirma |
| C5 | GA4/Meta: ID de medición y dataset; aprobar las apps oficiales | Analítica | No | Conecta y verifica eventos sin datos personales |

## D. Opcionales o diferibles

| # | Qué | Por qué |
|---|---|---|
| D1 | Borrar la página «Contact» por defecto y la colección vacía «Home page» | Limpieza |
| D2 | Título y meta descripción de la Home (propuesta lista) | SEO |
| D3 | «Recomendado para vos», voseo/tuteo, selector COP/USD, inglés (/en), orden de colecciones | Decisiones de marca sin bloqueo |
| D4 | Favoritos ligados a la cuenta (app personalizada; no permitida en tiendas de transferencia) | Función extra |
| D5 | Plataforma de correo de marketing y «Avísame» | Marketing |
| D6 | Confirmar que el correo de pedido llega a una bandeja real (AC-08) | Calidad |

## Idioma principal (paso 7)

Hoy: inglés principal, español publicado y por defecto en el dominio raíz (la tienda responde `lang=es`). Cambiar el principal aplica traducciones a «Pago y Sistema» y a los temas (efecto material). Secuencia segura para el corte: (1) respaldo del tema y de las traducciones (`shopify theme pull`, export de contenido); (2) cambiar el principal en Configuración > Idiomas; (3) repetir paridad 98/98, Q8 y humo; (4) si algo cambia, restaurar desde el respaldo y volver a inglés como principal. No se ejecuta antes de transferir.

## Conteo por momento

A: 7 · B: 3 · C: 5 · D: 6.
