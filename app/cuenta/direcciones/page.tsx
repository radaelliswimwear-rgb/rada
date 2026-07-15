import { AccountShell } from "components/account/account-shell";
import { AddressesManager } from "components/account/addresses-manager";
import Footer from "components/layout/footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Direcciones",
  robots: { index: false, follow: false },
};

export default function DireccionesPage() {
  return (
    <>
      <AccountShell title="Direcciones">
        <AddressesManager />
      </AccountShell>
      <Footer />
    </>
  );
}
