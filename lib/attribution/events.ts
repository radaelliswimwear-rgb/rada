// Contrato mínimo compartido entre ConsentBanner (lo dispara) y
// AttributionCapture (lo escucha) -- vive acá, no en lib/consent/, para que
// consent-banner.tsx solo necesite importar este nombre de evento y nunca
// el resto de la lógica de atribución. Permite capturar el touch actual
// apenas se otorga consentimiento de marketing SIN recargar la página (ver
// components/attribution/attribution-capture.tsx): si la clienta sigue en
// la misma landing cuando acepta, los UTMs siguen en la URL en ese mismo
// instante -- no hace falta (ni se permite) guardar nada en localStorage
// antes del consentimiento como atajo.
export const MARKETING_CONSENT_GRANTED_EVENT = "radaelli:marketing-consent-granted";
