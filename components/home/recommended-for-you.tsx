"use client";

import { useEffect, useState } from "react";
import { ProductCarousel } from "components/home/product-carousel";
import { catalogRepository } from "lib/catalog/catalog-repository";
import { listRecentlyViewed } from "lib/recently-viewed/storage";
import type { PlaceholderProduct } from "lib/placeholder-data";
import type { CategoryLabel } from "lib/catalog/types";

// "Recomendaciones automáticas" (Sprint 17): heurística basada en las
// categorías del historial de "vistos recientemente" (client-side, ver
// lib/recently-viewed/storage.ts) — no hay servicio externo de ML, ver
// docs/sprints/SPRINT-17.md. Sin historial (visita nueva), recomienda de
// todas las categorías. Es un componente de cliente porque el historial
// vive en localStorage, no en Postgres.
export function RecommendedForYou({
  excludeSlugs = [],
}: {
  /** Slugs que "La belleza de sentirte tú" y "Productos destacados" ya
   * mostraron en esta misma carga del home (ver app/page.tsx) — se suman
   * acá a los de "vistos recientemente" para que ninguna prenda se repita
   * en dos vidrieras del home a la vez (Sprint 22). */
  excludeSlugs?: string[];
}) {
  const [products, setProducts] = useState<PlaceholderProduct[] | null>(null);

  useEffect(() => {
    const viewed = listRecentlyViewed();
    const categories = Array.from(
      new Set(viewed.map((item) => item.category as CategoryLabel)),
    );
    const viewedSlugs = viewed.map((item) => item.slug);
    const combinedExcludeSlugs = Array.from(
      new Set([...excludeSlugs, ...viewedSlugs]),
    );
    catalogRepository
      .listRecommended(categories, combinedExcludeSlugs, 7)
      .then(setProducts);
    // Solo al montar: excludeSlugs viene del render del server y no
    // cambia durante la vida del componente.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!products || products.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl bg-white px-4 py-16 lg:px-8">
      <h2 className="mb-6 text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
        Recomendado para vos
      </h2>
      <ProductCarousel products={products} />
    </section>
  );
}
