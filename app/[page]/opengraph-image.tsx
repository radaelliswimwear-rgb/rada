import OpengraphImage from "components/opengraph-image";
import { getPage } from "lib/shopify";

export default async function Image({ params }: { params: { page: string } }) {
  const page = await getPage(params.page);
  // page puede ser undefined (Shopify no configurado, o el handle no
  // existe) -- OpengraphImage ya tiene su propio título de reserva
  // (SITE_NAME) cuando no se le pasa uno, ver components/opengraph-image.tsx.
  const title = page?.seo?.title || page?.title;

  return await OpengraphImage({ title });
}
