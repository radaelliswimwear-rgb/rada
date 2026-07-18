// TRM (Tasa Representativa del Mercado) oficial de Colombia, publicada por
// la Superintendencia Financiera / Banco de la República como dato abierto
// del gobierno — sin API key ni registro, dataset "32sa-8pi3" en
// datos.gov.co. Único punto donde se consulta; si el servicio falla,
// getSettingsAction() conserva la última tasa guardada (nunca rompe el
// checkout por una consulta externa caída).
const TRM_ENDPOINT =
  "https://www.datos.gov.co/resource/32sa-8pi3.json?$order=vigenciadesde%20DESC&$limit=1";

export async function fetchOfficialTrm(): Promise<number | null> {
  try {
    const response = await fetch(TRM_ENDPOINT, {
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;

    const rows = (await response.json()) as Array<{ valor?: string }>;
    const valor = rows[0]?.valor;
    const parsed = valor ? Number.parseFloat(valor) : NaN;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  } catch (error) {
    console.error("fetchOfficialTrm: no se pudo consultar la TRM", error);
    return null;
  }
}
