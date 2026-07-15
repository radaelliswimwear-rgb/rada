import { baseUrl } from "lib/utils";

// Constantes de marca reutilizadas por metadata/JSON-LD en toda la app
// (Sprint 17) — mismo texto que ya vive en components/layout/footer.tsx,
// centralizado acá para no repetirlo en cada página que arma su propio
// <title>/description/schema.org.
export const SITE_NAME = "LAGO";
export const SITE_DESCRIPTION =
  "LAGO es la firma de moda de Laura Gómez: moda atemporal, hecha para durar, diseñada con materiales nobles y una mirada minimalista.";
export const SITE_URL = baseUrl;
export const SITE_LOGO = `${baseUrl}/logo/logo-principal.png`;
export const TWITTER_HANDLE = "@lago_moda";
