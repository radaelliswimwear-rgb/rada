import type { Metadata } from "next";
import { AdminShell } from "components/admin/admin-shell";
import { BackInStockManager } from "components/admin/back-in-stock-manager";
import Footer from "components/layout/footer";
import { adminBackInStockRepository } from "lib/admin/back-in-stock-repository";

export const metadata: Metadata = {
  title: "Admin — Reposición",
  robots: { index: false, follow: false },
};

export default async function AdminReposicionPage() {
  const demand = await adminBackInStockRepository.listDemand();

  return (
    <>
      <AdminShell title="Solicitudes de reposición">
        <BackInStockManager initialDemand={demand} />
      </AdminShell>
      <Footer />
    </>
  );
}
