import type { Metadata } from "next";
import { AdminShell } from "components/admin/admin-shell";
import { DashboardStatsGrid } from "components/admin/dashboard-stats";
import Footer from "components/layout/footer";
import { adminDashboardRepository } from "lib/admin/dashboard-repository";

export const metadata: Metadata = {
  title: "Admin — Resumen",
  robots: { index: false, follow: false },
};

export default async function AdminDashboardPage() {
  const stats = await adminDashboardRepository.getStats();

  return (
    <>
      <AdminShell title="Resumen">
        <DashboardStatsGrid stats={stats} />
      </AdminShell>
      <Footer />
    </>
  );
}
