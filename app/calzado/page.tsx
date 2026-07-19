import { CatalogPage } from "components/catalog/catalog-page";
import type { CatalogSearchParams } from "lib/placeholder-data";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Calzado",
  description: "Zapatillas y calzado de diseño atemporal.",
  alternates: { canonical: "/calzado" },
  openGraph: {
    title: "Calzado",
    description: "Zapatillas y calzado de diseño atemporal.",
  },
};

export default function CalzadoPage(props: {
  searchParams: Promise<CatalogSearchParams>;
}) {
  return <CatalogPage category="Calzado" searchParams={props.searchParams} />;
}
