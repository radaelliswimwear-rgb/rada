import { CatalogPage } from "components/catalog/catalog-page";
import type { CatalogSearchParams } from "lib/placeholder-data";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Oasis Natural",
  description:
    "Trajes de baño inspirados en tonos tierra y vegetación exuberante.",
  alternates: { canonical: "/oasis-natural" },
  openGraph: {
    title: "Oasis Natural",
    description:
      "Trajes de baño inspirados en tonos tierra y vegetación exuberante.",
  },
};

export default function OasisNaturalPage(props: {
  searchParams: Promise<CatalogSearchParams>;
}) {
  return (
    <CatalogPage category="Oasis Natural" searchParams={props.searchParams} />
  );
}
