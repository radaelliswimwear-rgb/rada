import { CatalogPage } from "components/catalog/catalog-page";
import type { CatalogSearchParams } from "lib/placeholder-data";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Salidas de Baño",
  description: "Prendas ligeras para después del sol, entre la playa y la ciudad.",
  alternates: { canonical: "/salidas-de-bano" },
  openGraph: {
    title: "Salidas de Baño",
    description:
      "Prendas ligeras para después del sol, entre la playa y la ciudad.",
  },
};

export default function SalidasDeBanoPage(props: {
  searchParams: Promise<CatalogSearchParams>;
}) {
  return (
    <CatalogPage category="Salidas de Baño" searchParams={props.searchParams} />
  );
}
