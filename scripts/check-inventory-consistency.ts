// Auditoría go-live (sep. 2026): checker de consistencia de catálogo/
// inventario, de SOLO LECTURA y reutilizable -- pensado para correrse antes
// de escalar tráfico/ventas y después, periódicamente, sin riesgo. Mismo
// patrón exacto que scripts/check-production-db-readiness.ts (pg.Client
// crudo, resolveDatabaseUrl/loadProjectEnv de scripts/lib/load-safe-env.ts):
// nunca escribe nada, nunca imprime DATABASE_URL ni datos de clientas, solo
// ids de producto/pedido y conteos agregados.
//
// A diferencia de check-production-db-readiness.ts (que SÍ falla el build
// si algo está mal), este script es puramente informativo: sale con código
// 0 siempre que pudo conectarse y consultar, incluso si encuentra
// inconsistencias -- reporta, no bloquea ningún deploy. Corre contra
// cualquier DATABASE_URL que reciba (dev local hoy; producción real solo
// si se le pasa la connection string de producción explícitamente en el
// entorno -- este repo no la tiene disponible localmente a propósito).
//
// Uso:
//   npx tsx scripts/check-inventory-consistency.ts
//   DATABASE_URL="postgres://..." npx tsx scripts/check-inventory-consistency.ts
import pg from "pg";
import {
  resolveDatabaseUrl,
  describeDatabaseTarget,
} from "./lib/load-safe-env";

async function main() {
  const { databaseUrl, target } = resolveDatabaseUrl();
  console.log("check-inventory-consistency:");
  console.log(describeDatabaseTarget(target));
  console.log("");

  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();

  let anyIssue = false;
  const flag = (label: string, count: number) => {
    if (count > 0) anyIssue = true;
    console.log(`  ${count > 0 ? "⚠" : "✓"} ${label}: ${count}`);
  };

  try {
    // 1. Stock negativo -- invariante que nunca debería poder violarse (ver
    // reserveStock/releaseReservedStock en lib/checkout/server-order-totals.ts).
    const negativeStock = await client.query<{
      id: string;
      productId: string;
      size: string;
      stock: number;
    }>(
      `SELECT id, "productId", size, stock FROM "ProductVariant" WHERE stock < 0`,
    );
    flag("variantes con stock negativo", negativeStock.rowCount ?? 0);
    for (const row of negativeStock.rows) {
      console.log(
        `      variant ${row.id} (product ${row.productId}, talla ${row.size}): stock=${row.stock}`,
      );
    }

    // 2. Productos activos (visibles en catálogo/búsqueda) sin ninguna
    // variante -- comprables en apariencia pero sin ninguna talla real que
    // seleccionar.
    const activeNoVariants = await client.query<{
      id: string;
      slug: string;
      name: string;
    }>(`
      SELECT p.id, p.slug, p.name FROM "Product" p
      WHERE p.active = true
        AND NOT EXISTS (SELECT 1 FROM "ProductVariant" v WHERE v."productId" = p.id)
    `);
    flag(
      "productos activos sin ninguna variante",
      activeNoVariants.rowCount ?? 0,
    );
    for (const row of activeNoVariants.rows) {
      console.log(`      ${row.slug} (${row.name}, id ${row.id})`);
    }

    // 3. Productos activos donde TODAS las variantes están en 0 -- no es un
    // error de datos (agotado es un estado válido), pero vale la pena
    // reportarlo aparte de "sin variantes" porque antes de escalar tráfico
    // conviene saber cuántos productos publicados no se pueden comprar hoy.
    const activeAllZero = await client.query<{
      id: string;
      slug: string;
      name: string;
    }>(`
      SELECT p.id, p.slug, p.name FROM "Product" p
      WHERE p.active = true
        AND EXISTS (SELECT 1 FROM "ProductVariant" v WHERE v."productId" = p.id)
        AND NOT EXISTS (SELECT 1 FROM "ProductVariant" v WHERE v."productId" = p.id AND v.stock > 0)
    `);
    flag(
      "productos activos agotados en TODAS sus tallas (informativo, no es un bug)",
      activeAllZero.rowCount ?? 0,
    );
    for (const row of activeAllZero.rows) {
      console.log(`      ${row.slug} (${row.name}, id ${row.id})`);
    }

    // 4. Slugs duplicados sin distinguir mayúsculas/minúsculas -- el índice
    // único de Postgres es case-sensitive, así que "Foo"/"foo" pasarían la
    // restricción del schema pero son duplicado real de cara a SEO/URLs.
    const caseInsensitiveSlugDup = await client.query<{
      slug_lower: string;
      count: string;
    }>(`
      SELECT lower(slug) AS slug_lower, count(*)::text AS count
      FROM "Product" GROUP BY lower(slug) HAVING count(*) > 1
    `);
    flag(
      "slugs duplicados (sin distinguir mayúsculas/minúsculas)",
      caseInsensitiveSlugDup.rowCount ?? 0,
    );
    for (const row of caseInsensitiveSlugDup.rows) {
      console.log(`      "${row.slug_lower}" x${row.count}`);
    }

    // 5. Slug vacío o solo espacios (el schema no lo impide explícitamente).
    const emptySlug = await client.query(
      `SELECT id, name FROM "Product" WHERE trim(slug) = ''`,
    );
    flag("productos con slug vacío", emptySlug.rowCount ?? 0);

    // 6. SKUs duplicados sin distinguir mayúsculas/minúsculas (mismo
    // razonamiento que el punto 4 -- el índice único del schema sí es
    // case-sensitive).
    const caseInsensitiveSkuDup = await client.query<{
      sku_lower: string;
      count: string;
    }>(`
      SELECT lower(sku) AS sku_lower, count(*)::text AS count
      FROM "Product" WHERE sku IS NOT NULL GROUP BY lower(sku) HAVING count(*) > 1
    `);
    flag(
      "SKUs duplicados (sin distinguir mayúsculas/minúsculas)",
      caseInsensitiveSkuDup.rowCount ?? 0,
    );
    for (const row of caseInsensitiveSkuDup.rows) {
      console.log(`      "${row.sku_lower}" x${row.count}`);
    }

    // 7. Precio <= 0 en un producto activo.
    const nonPositivePrice = await client.query<{
      id: string;
      slug: string;
      priceValue: number;
    }>(`
      SELECT id, slug, "priceValue" FROM "Product" WHERE active = true AND "priceValue" <= 0
    `);
    flag("productos activos con precio <= 0", nonPositivePrice.rowCount ?? 0);
    for (const row of nonPositivePrice.rows) {
      console.log(
        `      ${row.slug} (id ${row.id}): priceValue=${row.priceValue}`,
      );
    }

    // 8. discountPercent fuera de rango (0-100).
    const badDiscount = await client.query<{
      id: string;
      slug: string;
      discountPercent: number;
    }>(`
      SELECT id, slug, "discountPercent" FROM "Product" WHERE "discountPercent" < 0 OR "discountPercent" > 100
    `);
    flag(
      "productos con discountPercent fuera de 0-100",
      badDiscount.rowCount ?? 0,
    );
    for (const row of badDiscount.rows) {
      console.log(
        `      ${row.slug} (id ${row.id}): discountPercent=${row.discountPercent}`,
      );
    }

    // 9. El hallazgo más importante de este checker: Payment que reservó
    // stock (reservedItems no nulo), terminó en un estado NO aprobado y
    // NUNCA se marcó stockReleased -- significa que ese stock se descontó
    // al iniciar el checkout y jamás se devolvió (fuga real de inventario,
    // no teórica). Ver releaseReservedStock/reserveStock en
    // lib/checkout/server-order-totals.ts -- este es exactamente el
    // escenario que esa función existe para prevenir; que aparezca acá
    // significa que algún camino no pasó por ella.
    const leakedReservations = await client.query<{
      id: string;
      providerRef: string;
      status: string;
      createdAt: Date;
    }>(`
      SELECT id, "providerRef", status, "createdAt" FROM "Payment"
      WHERE "reservedItems" IS NOT NULL
        AND "stockReleased" = false
        AND status NOT IN ('SUCCEEDED', 'PENDING')
    `);
    flag(
      "pagos con stock reservado, nunca liberado, en estado terminal no aprobado (fuga de inventario)",
      leakedReservations.rowCount ?? 0,
    );
    for (const row of leakedReservations.rows) {
      console.log(
        `      payment ${row.id} (ref ${row.providerRef}, status ${row.status}, creado ${row.createdAt.toISOString()})`,
      );
    }

    // 10. Pedido con fulfillmentStatus CANCELADO pero su Payment sigue sin
    // stockReleased -- mismo síntoma que el punto 9, visto desde el pedido
    // en vez de desde el pago (cancelOrderFulfillmentAction sí llama
    // releaseReservedStock -- ver lib/admin/orders-actions.ts -- así que en
    // el camino normal esto nunca debería aparecer).
    const cancelledNotReleased = await client.query<{
      orderId: string;
      orderNumber: number;
      paymentId: string;
    }>(`
      SELECT o.id AS "orderId", o."orderNumber", p.id AS "paymentId"
      FROM "Order" o
      JOIN "Payment" p ON p."orderId" = o.id
      WHERE o."fulfillmentStatus" = 'CANCELADO' AND p."stockReleased" = false AND p."reservedItems" IS NOT NULL
    `);
    flag(
      "pedidos cancelados cuyo pago sigue con stock sin liberar",
      cancelledNotReleased.rowCount ?? 0,
    );
    for (const row of cancelledNotReleased.rows) {
      console.log(
        `      pedido #${row.orderNumber} (${row.orderId}), payment ${row.paymentId}`,
      );
    }

    // 11. Payment SUCCEEDED sin ningún Order asociado -- un cobro real que
    // nunca se convirtió en pedido visible en el admin (candidato a
    // recovery manual).
    const approvedNoOrder = await client.query<{
      id: string;
      providerRef: string;
      createdAt: Date;
    }>(`
      SELECT id, "providerRef", "createdAt" FROM "Payment"
      WHERE status = 'SUCCEEDED' AND "orderId" IS NULL
    `);
    flag(
      "pagos APROBADOS (SUCCEEDED) sin pedido asociado (requiere revisión manual)",
      approvedNoOrder.rowCount ?? 0,
    );
    for (const row of approvedNoOrder.rows) {
      console.log(
        `      payment ${row.id} (ref ${row.providerRef}, creado ${row.createdAt.toISOString()})`,
      );
    }

    console.log("");
    console.log(
      anyIssue
        ? "  RESULTADO: hay hallazgos -- ver detalle arriba (no bloquea nada, informativo)."
        : "  RESULTADO: sin hallazgos.",
    );
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(
    "check-inventory-consistency: error inesperado:",
    error instanceof Error ? error.message : error,
  );
  process.exitCode = 1;
});
