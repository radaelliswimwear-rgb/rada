import type { Metadata } from "next";
import { AdminShell } from "components/admin/admin-shell";
import { CouponsManager } from "components/admin/coupons-manager";
import Footer from "components/layout/footer";
import { adminCouponsRepository } from "lib/admin/coupons-repository";

export const metadata: Metadata = {
  title: "Admin — Cupones",
  robots: { index: false, follow: false },
};

export default async function AdminCouponsPage() {
  const coupons = await adminCouponsRepository.listAll();

  return (
    <>
      <AdminShell title="Cupones">
        <CouponsManager initialCoupons={coupons} />
      </AdminShell>
      <Footer />
    </>
  );
}
