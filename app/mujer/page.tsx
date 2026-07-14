import { CatalogPage } from "components/catalog/catalog-page";
import type { CatalogSearchParams } from "lib/placeholder-data";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mujer",
  description: "Siluetas fluidas y materiales nobles para mujer.",
};

export default function MujerPage(props: {
  searchParams: Promise<CatalogSearchParams>;
}) {
  return <CatalogPage category="Mujer" searchParams={props.searchParams} />;
}
