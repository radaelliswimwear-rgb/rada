import { AccountFavorites } from "components/account/account-favorites";
import { AccountShell } from "components/account/account-shell";
import Footer from "components/layout/footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Favoritos",
  robots: { index: false, follow: false },
};

export default function CuentaFavoritosPage() {
  return (
    <>
      <AccountShell title="Favoritos">
        <AccountFavorites />
      </AccountShell>
      <Footer />
    </>
  );
}
