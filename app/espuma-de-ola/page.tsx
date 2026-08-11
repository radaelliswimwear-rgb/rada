import { CatalogPage } from "components/catalog/catalog-page";
import type { CatalogSearchParams } from "lib/placeholder-data";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Espuma de Ola",
  description: "Texturas suaves y tonos marinos, como la espuma sobre la arena.",
  alternates: { canonical: "/espuma-de-ola" },
  openGraph: {
    title: "Espuma de Ola",
    description:
      "Texturas suaves y tonos marinos, como la espuma sobre la arena.",
  },
};

export default function EspumaDeOlaPage(props: {
  searchParams: Promise<CatalogSearchParams>;
}) {
  return (
    <CatalogPage category="Espuma de Ola" searchParams={props.searchParams} />
  );
}
