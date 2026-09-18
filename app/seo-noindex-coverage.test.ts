import { test } from "node:test";
import assert from "node:assert/strict";
import { mockModule } from "../tests/mock-module";

// Estos page.tsx solo se IMPORTAN acá, nunca se invocan -- alcanza con que
// el módulo cargue sin romper (lib/prisma.ts instancia el cliente en el
// top-level del módulo, no de forma perezosa, así que cualquier cadena de
// imports que llegue hasta ahí necesita algo en su lugar aunque nunca se
// llame ningún método).
mockModule("lib/prisma", { prisma: {} });

// SEO técnico (sep. 2026): regresión -- páginas privadas/transaccionales
// reales deben declarar robots noindex explícito, para que nadie lo borre
// sin querer más adelante. No exhaustivo por diseño (section 28: "no tests
// frágiles"), cubre una muestra representativa de cada grupo (checkout,
// cuenta, favoritos, búsqueda, admin, interno).
const PAGES_THAT_MUST_BE_NOINDEX = [
  "./checkout/page",
  "./checkout/confirmacion/[orderId]/page",
  "./checkout/wompi/retorno/page",
  "./cuenta/iniciar-sesion/page",
  "./cuenta/registro/page",
  "./cuenta/pedidos/page",
  "./favoritos/page",
  "./buscar/page",
  "./admin/page",
  "./interno/activar/page",
  "./interno/desactivar/page",
];

for (const modulePath of PAGES_THAT_MUST_BE_NOINDEX) {
  test(`noindex: ${modulePath} declara robots index:false`, async () => {
    const mod = await import(modulePath);
    assert.ok(mod.metadata, `${modulePath} debe exportar metadata`);
    assert.equal(
      mod.metadata.robots?.index,
      false,
      `${modulePath} debe tener robots.index === false`,
    );
  });
}
