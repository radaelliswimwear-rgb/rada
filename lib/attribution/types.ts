// Fase 1 de analytics (atribución first-party). Un "touch" es una sola
// llegada identificable con intención de marketing (UTM, click id, o
// referral externo) -- nunca PII: nada de nombre/email/teléfono/dirección,
// nada de IP ni fingerprint. Ver lib/attribution/parsing.ts para cómo se
// arma uno a partir de una URL real.
export type AttributionTouch = {
  source: string | null;
  medium: string | null;
  campaign: string | null;
  content: string | null;
  term: string | null;
  fbclid: string | null;
  gclid: string | null;
  landingPath: string | null;
  referrerDomain: string | null;
  capturedAt: string; // ISO
};

// firstTouch se fija una sola vez y nunca se pisa; lastTouch se actualiza
// cada vez que llega un touch válido nuevo (ver applyTouch en state.ts). Una
// visita directa o una navegación interna nunca generan un touch, así que
// nunca llegan a tocar ninguno de los dos.
export type AttributionState = {
  version: 1;
  firstTouch: AttributionTouch | null;
  lastTouch: AttributionTouch | null;
};
