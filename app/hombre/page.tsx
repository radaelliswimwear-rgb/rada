import { CatalogPage } from "components/catalog/catalog-page";
import type { CatalogSearchParams } from "lib/placeholder-data";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hombre",
  description: "Sastrería moderna y esenciales atemporales para hombre.",
};

export default function HombrePage(props: {
  searchParams: Promise<CatalogSearchParams>;
}) {
  return <CatalogPage category="Hombre" searchParams={props.searchParams} />;
}
