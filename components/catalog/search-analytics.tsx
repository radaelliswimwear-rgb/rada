"use client";

import { useEffect, useRef } from "react";
import { trackCustom } from "lib/analytics/client/track";
import { sanitizeSearchTerm } from "lib/analytics/sanitize";

// Fase 2A de analytics (sección 30): "search" con search_term/result_count,
// para detectar búsquedas con 0 resultados. app/buscar/page.tsx es un
// Server Component -- este puente client-only dispara una vez por término
// real de búsqueda.
export function SearchAnalytics({
  query,
  resultCount,
}: {
  query: string;
  resultCount: number;
}) {
  const lastTrackedRef = useRef<string | null>(null);

  useEffect(() => {
    const term = sanitizeSearchTerm(query);
    if (!term || lastTrackedRef.current === term) return;
    lastTrackedRef.current = term;
    trackCustom("search", { search_term: term, result_count: resultCount });
  }, [query, resultCount]);

  return null;
}
