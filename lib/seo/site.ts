import { getAppBaseUrl } from "lib/utils";

const baseUrl = getAppBaseUrl();

// Constantes de marca reutilizadas por metadata/JSON-LD en toda la app
// (Sprint 17) — mismo texto que ya vive en components/layout/footer.tsx,
// centralizado acá para no repetirlo en cada página que arma su propio
// <title>/description/schema.org.
export const SITE_NAME = "Radaelli Swimwear";
export const SITE_DESCRIPTION =
  "Radaelli Swimwear: trajes de baño de diseño atemporal, materiales nobles y una mirada minimalista.";
export const SITE_URL = baseUrl;
export const SITE_LOGO = `${baseUrl}/logo/radaelli-swimwear.png`;
export const TWITTER_HANDLE = "@radaelli_swim";
