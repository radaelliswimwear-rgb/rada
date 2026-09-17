import type { Metadata } from "next";
import { AdminShell } from "components/admin/admin-shell";
import { InternalTrafficManager } from "components/admin/internal-traffic-manager";
import Footer from "components/layout/footer";
import { adminInternalTrafficRepository } from "lib/admin/internal-traffic-repository";

export const metadata: Metadata = {
  title: "Admin — Tráfico interno",
  robots: { index: false, follow: false },
};

export default async function AdminInternalTrafficPage() {
  const devices = await adminInternalTrafficRepository.list();

  return (
    <>
      <AdminShell title="Tráfico interno">
        <InternalTrafficManager initialDevices={devices} />
      </AdminShell>
      <Footer />
    </>
  );
}
