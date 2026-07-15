import Footer from "components/layout/footer";
import { WishlistPage } from "components/wishlist/wishlist-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Favoritos",
  description: "Los productos que guardaste en tu lista de favoritos.",
  robots: { index: false, follow: false },
};

export default function FavoritosPage() {
  return (
    <>
      <WishlistPage />
      <Footer />
    </>
  );
}
