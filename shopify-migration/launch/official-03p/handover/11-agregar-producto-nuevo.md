# 11 — Agregar un producto nuevo

Para: Daniela. Aquí sumas una prenda a la tienda sin romper filtros, precios ni inventario. `CONFIRMAR_EN_ADMIN` = verifica el nombre exacto en pantalla. `PENDIENTE_DUEÑA` = decisión tuya. Los GAP están en `CLAUDE-DOWNGRADE-READINESS` (este documento cierra GAP-23).

## 1. Antes de empezar
Ten esto listo en una nota:
- [ ] **Fotos**: verticales (2:3 o 3:4), todas del mismo tamaño, JPG, PNG o WebP. Las mejores de hoy miden 1800×2400 o 3333×5000 px. Evita menos de 1000 px de ancho.
- [ ] **Título** en MAYÚSCULAS y **valor de Color** (ej. `VERDE OLIVA`). El handle no debe repetir uno existente.
- [ ] **Precio de lista** (el tachado) y **precio actual** = lista × 0,8. Ej.: lista $219.900 → actual $175.920.
- [ ] **Costo por artículo** en COP. La hoja `analytics/unit-economics-inputs.csv` lo necesita para calcular ROAS y CPA (GAP-14).
- [ ] **Tallas y cantidad por talla**. Cantidades del nuevo: `PENDIENTE_DUEÑA`.
- [ ] **Colección** (una de las 3 líneas) y si va en "Destacados" (`PENDIENTE_DUEÑA`).
- [ ] **Peso** por prenda: 500 g.
- [ ] **Respaldo**: exporta productos antes (documento 08, sección 3).

## 2. Cómo es un producto hoy (leído en tu tienda el 2026-10-02)
Copia este patrón. No inventes otro.

| Campo | Lo que hacen los 29 productos |
|---|---|
| Título | MAYÚSCULAS: nombre de la prenda + color. Ej.: `BRISA NATURAL BEIGE`, `ALBA DORADA CAFÉ CLARO` |
| Handle (la URL) | Título en minúsculas, sin tildes, con guiones: `brisa-natural-beige`. Tres productos viejos tienen un handle distinto de su título: no los cambies sin ayuda ni los imites |
| Tipo de producto | Nombre de su colección: `Aurora Viva`, `Oasis Natural` o `Espuma de Ola` |
| Proveedor | `Radaelli Swimwear` |
| Etiquetas y categoría | Vacías (solo 1 producto lleva la etiqueta `MOSTAZA`). Déjalas vacías |
| Opción | Una sola, llamada exactamente **Talla**: S, M, L (Oasis Natural, Espuma de Ola) o S, M, L, XL (Aurora Viva). No hay XS. `CAMISETA SOLAR WAVES NEGRO` tiene una talla rara llamada "L y XL": no la imites |
| SKU | Código + talla: `LG-AUR-000002-M`, `LG-ESP-000009-S`, `RSONBI012-S`. El código del producto nuevo: `PENDIENTE_DUEÑA` (usa un número que no exista) |
| Precios | Precio actual = **80 %** del precio de comparación (tachado), exacto. Ej.: $199.900 tachado → $159.920 |
| Impuestos | "Cobrar impuesto" marcado en las 98 tallas. La tienda no tiene tasas, por eso no cobra IVA |
| Inventario | Rastreado; "seguir vendiendo sin stock" apagado; peso 500 g; requiere envío |
| Fotos | 3 a 5, verticales; el texto alternativo es el título |
| Metacampo Color | `custom.color`, en MAYÚSCULAS (`CAFÉ CLARO`). Alimenta el filtro Color |
| Canal | Solo "Tienda online" (29 de 29) |
| Colecciones | Todas son **manuales**: el producto no entra solo, lo agregas tú |
| Descripción | Un párrafo corto + lista de 3 viñetas |
| SEO | Vacío en los 29 |
| Guía de tallas | Su metacampo existe pero está vacío en los 29; la guía general sale del tema si está configurada (`CONFIRMAR_EN_ADMIN`) |
| Costo por artículo | Vacío en las 98 tallas |

## 3. Pasos en el Admin
Todo con el estado en **Borrador**. Nada sale a la tienda hasta el paso 13.
1. Admin > Productos > **Agregar producto**.
2. **Título** con el patrón. **Descripción**: un párrafo y 3 viñetas.
3. **Medios**: sube las fotos; la primera es la principal. Pon como texto alternativo el título (`CONFIRMAR_EN_ADMIN`).
4. **Precio**: tu precio actual. **Precio de comparación**: el de lista. Revisa la cuenta del 80 %. (Si la promoción ya terminó, documento 05, el tachado va vacío: decisión tuya.) **Costo por artículo**: el tuyo.
5. **Cobrar impuesto**: déjalo como en los demás productos (marcado). No toques Configuración > Impuestos y aranceles.
6. **Inventario**: marca "Rastrear cantidad". Deja **desmarcado** "Seguir vendiendo cuando no haya existencias". Escribe el SKU.
7. **Envío**: producto físico; peso **500 g** (gramos).
8. **Opciones**: agrega la opción **Talla** y sus valores. Shopify crea una variante por talla. En cada variante revisa precio, comparación, SKU y cantidad.
9. **Cantidad**: en la ubicación "Shop location" (Calle 93 #72-71, Barranquilla), la cantidad real de cada talla.
10. **Organización**: Tipo de producto = nombre de la colección; Proveedor = `Radaelli Swimwear`; Colecciones = la elegida; etiquetas y categoría vacías.
11. **Metacampos**: **Color** = el color en MAYÚSCULAS, igual que en el título. Deja vacía la Guía de tallas.
12. **Canales**: solo "Tienda online" (`CONFIRMAR_EN_ADMIN`: no marques "Point of Sale"). SEO: vacío.
13. **Guardar**. Haz la revisión A de la sección 4. Solo después cambia el estado a **Activo** y haz la revisión B.

Si el producto no quedó en su colección, agrégalo en Productos > Colecciones > la colección (`CONFIRMAR_EN_ADMIN`). En una colección manual el orden lo decides tú: arrastra el producto a su lugar.

## 4. Revisar antes y después de publicar
**A. En Borrador (vista previa del Admin, `CONFIRMAR_EN_ADMIN`)**
1. Abre la vista previa en el computador y en el celular, o reduce la ventana a 390 px de ancho.
2. El selector muestra cada talla; las tallas sin stock salen "agotado".
3. Se ven el precio actual, el tachado y la etiqueta -20 %.
4. Agrega una talla al carrito y llega al pago **sin pagar**: aparece Wompi, el envío es el de tu zona y no hay línea de IVA.
5. Las fotos se ven completas y en orden.

**B. Ya Activo (espera unos minutos para el índice)**
1. La colección elegida lo muestra.
2. `/collections/all` lo muestra.
3. Los filtros **Color** (`CONFIRMAR_EN_ADMIN` si el color es nuevo) y **Talla** lo encuentran.
4. La búsqueda del sitio lo encuentra por nombre.
5. Si algo falla: vuelve a **Borrador** y revisa la sección 8.

## 5. Verificar después de publicar
1. Productos: filtra por estado **Activo**. Deben ser 29 más los que agregaste.
2. Hay un borrador interno `PRUEBA DE LANZAMIENTO - NO COMPRAR` (etiqueta `interno`, creado el 2026-10-02, parece del equipo de lanzamiento): no lo publiques ni lo borres sin preguntar.
3. Productos > Inventario: las tallas nuevas muestran la cantidad que pusiste. Súmala al libro de inventario (documento 04: unidades esperadas = 128 + reposiciones − vendidas).
4. Exporta productos de nuevo (documento 08).

**QUÉ NO HACER**
- No repitas el handle de otro producto.
- No edites el código del tema (documento 06).
- No crees tasas de impuesto ni cambies la lógica de "cobrar impuesto".
- No importes un CSV de productos sin respaldo previo (documento 08): puede sobrescribir precios.
- No actives "seguir vendiendo sin stock".
- No pongas un precio actual distinto del 80 % del tachado mientras la promoción siga (documento 05).

## 6. Usar un producto como plantilla (Duplicar)
1. Productos > abre un producto parecido > **Más acciones > Duplicar** (`CONFIRMAR_EN_ADMIN`).
2. Escribe el nuevo título. Shopify copia opciones, variantes y precios, y puede copiar las fotos. Deja el duplicado en **Borrador** hasta terminar.
3. El handle sale del nuevo título: revisa que siga el patrón y que no repita otro.
4. Cambia a mano lo que el duplicado hereda del original: SKU, color (metacampo), fotos, descripción, colecciones y cantidades.

## 7. Retirar o esconder un producto sin borrarlo
- **Agotado:** déjalo con cantidad 0. La tienda lo muestra "agotado".
- **Esconder un tiempo:** estado **Borrador**.
- **Retirar para siempre:** estado **Archivado**. Nunca "Eliminar": no se deshace.
- **Si su enlace ya circuló** (Instagram, anuncios): crea una redirección de `/products/su-handle` a `/collections/aurora-viva` (o su colección) en Contenido > Menús > Redireccionamientos (también puede estar en Tienda online > Navegación; `CONFIRMAR_EN_ADMIN`). No borres las 51 redirecciones que existen.

## 8. Si algo sale mal
| Síntoma | Revisa |
|---|---|
| No aparece en la tienda | ¿Activo? ¿Canal "Tienda online"? ¿Está en una colección? |
| El filtro Color no lo muestra | ¿El metacampo Color tiene valor, en MAYÚSCULAS y sin espacios de más? |
| Sin tachado ni -20 % | Falta el precio de comparación |
| No se puede comprar con stock | ¿Cantidad puesta en "Shop location"? ¿Rastreo activado? |
| Cobra IVA o muestra impuestos | Para. No cambies Impuestos. Captura y pide ayuda |
| Handle repetido | Shopify suele añadirle `-1`; cámbialo y revisa que no choque con una redirección |

Salida segura: ponlo en **Borrador**. Si cambiaste precios en bloque, restaura con el CSV del respaldo (documento 08).

## 9. Qué decirle a la IA de bajo costo
Pega primero: "Tienda Shopify Radaelli Swimwear, Colombia, COP, plan Basic, sin IVA; sigo el documento 11 de mi manual. No toques precios existentes, impuestos, envíos ni DNS."
1. "Quiero agregar el producto [TÍTULO] a la colección [LÍNEA], precio de lista [X], costo [Y], tallas [S/M/L] con cantidades [..]. Calcula el precio actual (80 %), propón el SKU y el handle, y guíame paso a paso (sección 3) sin que yo toque impuestos."
2. "Publiqué [PRODUCTO] pero [no sale en el filtro Color / en la búsqueda / sin tachado]. Esto veo: [captura sin claves]. Ayúdame con la sección 8."
3. "Quiero retirar [PRODUCTO] sin borrarlo y que el enlace viejo lleve a [colección]. Dime qué estado elegir y qué escribir en la redirección."

## Estado al escribir (2026-10-02)
- La tienda sigue **privada** (con contraseña). Wompi está en **PRUEBA**. El dominio está conectado pero **aún no es el principal**. El tema RC1.10 está sin publicar (Horizon es el publicado).
- Hay 29 productos activos (98 tallas, 128 unidades) y 1 borrador interno.
- Nadie ha agregado un producto nuevo con este procedimiento. Ensáyalo una vez (simulacro, GAP-18) con un producto en Borrador que luego archivas.
- Pendientes: código SKU, cantidades y colección "Destacados" del producto nuevo (`PENDIENTE_DUEÑA`), y los nombres de menú marcados (`CONFIRMAR_EN_ADMIN`).
