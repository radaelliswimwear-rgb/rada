import { CatalogPage } from "components/catalog/catalog-page";
import type { CatalogSearchParams } from "lib/placeholder-data";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Accesorios",
  description: "Los detalles que definen el conjunto.",
  alternates: { canonical: "/accesorios" },
  openGraph: {
    title: "Accesorios",
    description: "Los detalles que definen el conjunto.",
  },
};

export default function AccesoriosPage(props: {
  searchParams: Promise<CatalogSearchParams>;
}) {
  return (
    <CatalogPage category="Accesorios" searchParams={props.searchParams} />
  );
}
