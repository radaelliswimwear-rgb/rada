// Factor de exhibición para las "vistas totales" del cliente (Sprint 19):
// se aplica solo al leer/mostrar, nunca se guarda inflado en la base —
// Product.realViews sigue siendo el conteo real que ve el admin en el
// panel. Usa un factor distinto al de "personas viendo esto ahora"
// (lib/catalog/presence-actions.ts, x5 solo cuando hay 1 sola persona)
// para que ambos números no coincidan y se lean como métricas separadas.
const REAL_VIEWS_DISPLAY_MULTIPLIER = 6;

export function getDisplayedTotalViews(
  realViews: number,
  promotionalViews: number,
): number {
  return realViews * REAL_VIEWS_DISPLAY_MULTIPLIER + promotionalViews;
}
