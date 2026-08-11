import { CatalogPage } from "components/catalog/catalog-page";
import type { CatalogSearchParams } from "lib/placeholder-data";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aurora Viva",
  description:
    "Colores luminosos y siluetas frescas para los primeros rayos del día.",
  alternates: { canonical: "/aurora-viva" },
  openGraph: {
    title: "Aurora Viva",
    description:
      "Colores luminosos y siluetas frescas para los primeros rayos del día.",
  },
};

export default function AuroraVivaPage(props: {
  searchParams: Promise<CatalogSearchParams>;
}) {
  return (
    <CatalogPage category="Aurora Viva" searchParams={props.searchParams} />
  );
}
