# 04 — Inventario y pedidos: revisión diaria y problemas

Para: Daniela. Rutas del Admin: ver el Manual (sección 5). `CONFIRMAR_EN_ADMIN` = verificar el nombre exacto en pantalla.

## 1. Línea base (leída en la tienda el 2026-10-02, antes de vender)
| Dato | Valor |
|---|---|
| Productos / variantes (tallas) | 29 / 98 |
| Variantes con inventario rastreado | 98 de 98 |
| Unidades disponibles (total) | **128** |
| "Seguir vendiendo sin stock" | NO (98 de 98 en "denegar": el checkout no vende lo que no hay) |
| Peso por variante | 500 g (98 de 98) |
| Pedidos | 1 (el #1001 de prueba, cancelado y archivado). El primer pedido real puede no ser #1002 (la compra real de prueba del lanzamiento usa un número) |
| Cantidades de partida (reglas que diste) | Oasis Natural: S=2, M=3, L=1 por producto. Todo lo demás: 1 por talla ("de momento"). La talla XL de `alba-dorada-cafe-claro` se conservó con 1 |
| Hoja con las 98 cantidades | Rama GitHub `shopify-migration-backup`, archivo `shopify-migration/import/inventory-sheet-03o.csv` (columnas: sku, handle, talla, cantidad, nota). Cópiala a tu Drive (documento 08) |

Fórmula de control: **unidades esperadas = 128 + reposiciones − unidades vendidas (pedidos no cancelados)**. Llévala en una hoja simple ("libro de inventario").

## 2. Revisión diaria de 5 minutos
1. Pedidos: abre cada pedido nuevo. Estado de pago "Pagado". Dirección y teléfono completos.
2. Pedidos > filtra "Sin cumplir": ¿alguno lleva más de 2 días hábiles? Despáchalo o avisa al cliente.
3. Productos > Inventario: ordena por "Disponible" de menor a mayor.
   - 0 = agotado (la tienda lo muestra "agotado"; correcto).
   - **Negativo = problema** (sección 5).
4. Suma el total "Disponible" (o usa el exportar). Compáralo con la fórmula. Si no cuadra, revisa los pedidos del día.
5. Pedidos > Checkouts abandonados: mira que no haya pagos aprobados sin pedido (documento 02).
6. Anota la hora y el resultado.

QUÉ HACER: revisar cada día aunque no haya ventas; despachar el mismo día; anotar todo en el libro de inventario.
QUÉ NO HACER: no editar cantidades "a ojo" sin anotar; no borrar pedidos; no vender por fuera de la tienda sin descontar el inventario.

## 3. Cómo reponer inventario
Una talla:
1. Productos > Inventario.
2. Busca la prenda y talla. Haz clic en la cifra "Disponible".
3. Escribe la nueva cantidad (o suma la que llegó). Si te pide motivo, elige "Reposición recibida" (`CONFIRMAR_EN_ADMIN`).
4. Guarda. Revisa en la tienda que la talla ya se pueda comprar.
5. Anótalo en el libro de inventario.

Varias tallas a la vez:
1. Productos > Inventario > Exportar (descarga CSV). `CONFIRMAR_EN_ADMIN` si también existe "Importar" en esta pantalla.
2. Edita solo la columna de disponibles en una **copia** del archivo.
3. Si existe "Importar" en Inventario, súbelo. Si no, haz los cambios uno por uno. **No uses la importación de productos para esto** (puede cambiar precios y otros datos).
4. Verifica 5 tallas al azar.

QUÉ NO HACER
- No actives "Seguir vendiendo cuando no haya stock" en ninguna variante.
- No cambies el SKU de una variante.
- No borres variantes para "bajar" inventario.

## 4. Cómo ver una sobreventa
Una sobreventa es vender más unidades de las que hay. Señales:
- Cantidad **negativa** en Productos > Inventario.
- Un pedido con prendas que ya no tienes.
- Un cliente compró la última unidad al mismo tiempo que otro.
- Un pedido creado a mano (borrador) sin revisar stock.
Qué hacer:
1. Detecta qué pedido se quedó sin prenda (el más reciente).
2. Escribe al cliente de inmediato: ofrece otra talla/producto o reembolso.
3. Si reembolsas: documento 02, sección 6.
4. Corrige la cantidad a 0 (o la real).
5. Anota el caso. Si se repite, pide ayuda.

## 5. Cancelar un pedido de prueba y devolver el inventario
Úsalo para pedidos de prueba (no para pedidos reales).
1. Pedidos > abre el pedido > "Más acciones" > **Cancelar pedido** (`CONFIRMAR_EN_ADMIN`).
2. Marca **Reponer inventario** (que vuelvan las unidades).
3. **Desmarca "Enviar notificación al cliente"**.
4. Motivo: Otro. Confirma.
5. Si el pago fue con dinero real (prueba de lanzamiento): primero intenta **anular** el pago en Wompi (mismo día) o reembolsa (documento 02, sección 6) y luego cancela.
6. Pedido > Más acciones > **Archivar**.
7. Vuelve a Productos > Inventario: el total debe ser 128 + movimientos reales.
8. Anota en el libro de inventario "pedido de prueba cancelado".
Así se cerró el pedido #1001.

## 6. Pedidos reales: cancelar o editar
- Cancelar un pedido real **notifica al cliente** (déjalo marcado) y repone inventario.
- Si ya despachaste: no canceles. Es una devolución (política en `Configuración > Políticas`).
- Antes de editar un pedido pagado, consulta: puede crear diferencias con Wompi.

## 7. Estados de un pedido (qué significan)
| Estado | Qué hacer |
|---|---|
| Pagado + Sin cumplir | Empacar y enviar (documento 03) |
| Pagado + Cumplido | Listo; seguir tránsito |
| Pago pendiente | NO despachar; documento 02 sección D |
| Reembolsado | Confirmar en Wompi |
| Cancelado | Sin acción; revisa inventario repuesto |
| Archivado | Solo oculto |

## 8. Reglas de la tienda que afectan pedidos
- Envío gratis desde $299.900 (se probó: 299.899 = paga envío $9.900; 299.900 = gratis). Con códigos de descuento no se ha probado si el umbral cuenta el valor antes o después del descuento (`CONFIRMAR_EN_ADMIN`): prueba un carrito antes de prometer envío gratis con un cupón.
- Teléfono obligatorio; contacto por correo.
- Sin IVA en ningún pedido (NO RESPONSABLE DE IVA).
- Estar en el carrito NO reserva inventario: dos clientes pueden ver la última unidad.

## 9. Herramientas del equipo (solo para quien te ayude)
El equipo usó un script (`03o-inventory-verify.mjs`) que compara la tienda con la hoja de 98 filas. Tú NO lo necesitas: el libro de inventario y el exportar bastan (ver `CLAUDE-DOWNGRADE-READINESS`, tabla B).

## 10. Cuándo pedir ayuda
- Cantidades negativas.
- El total de unidades no cuadra y no encuentras el motivo.
- Un producto no se deja comprar teniendo stock.
- Un pedido real aparece con importe distinto al de Wompi.
Lleva: captura de Inventario, números de pedido y el libro de inventario.
