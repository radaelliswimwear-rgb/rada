-- Category.active: interruptor del Panel Admin para nav/footer/home.
ALTER TABLE "Category" ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true;

-- Product.active: usado por deleteProductAction para archivar en vez de
-- fallar cuando el producto tiene pedidos/carritos/favoritos asociados.
ALTER TABLE "Product" ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true;

-- Backfill: refleja el estado actual (archivadas fuera de nav/home tras el
-- rebrand a Radaelli Swimwear) para no cambiar el comportamiento visible.
UPDATE "Category" SET "active" = false
WHERE "slug" IN ('hombre', 'mujer', 'ninos', 'calzado', 'accesorios');
