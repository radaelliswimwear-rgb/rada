"use client";

import { useEffect, useState } from "react";
import { ProductCard } from "components/home/product-card";
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
export function RecommendedForYou() {
  const [products, setProducts] = useState<PlaceholderProduct[] | null>(null);

  useEffect(() => {
    const viewed = listRecentlyViewed();
    const categories = Array.from(
      new Set(viewed.map((item) => item.category as CategoryLabel)),
    );
    const excludeIds = viewed.map((item) => item.slug);
    catalogRepository
      .listRecommended(categories, excludeIds, 4)
      .then(setProducts);
  }, []);

  if (!products || products.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
      <h2 className="mb-6 text-2xl font-semibold tracking-tight sm:text-3xl">
        Recomendado para vos
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
