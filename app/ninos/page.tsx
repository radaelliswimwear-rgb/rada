import { CatalogPage } from "components/catalog/catalog-page";
import type { CatalogSearchParams } from "lib/placeholder-data";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Niños",
  description: "Comodidad y estilo para los más pequeños.",
  alternates: { canonical: "/ninos" },
  openGraph: {
    title: "Niños",
    description: "Comodidad y estilo para los más pequeños.",
  },
};

export default function NinosPage(props: {
  searchParams: Promise<CatalogSearchParams>;
}) {
  return <CatalogPage category="Niños" searchParams={props.searchParams} />;
}
