import { AccountShell } from "components/account/account-shell";
import { DashboardOverview } from "components/account/dashboard-overview";
import Footer from "components/layout/footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mi cuenta",
  robots: { index: false, follow: false },
};

export default function CuentaPage() {
  return (
    <>
      <AccountShell title="Resumen">
        <DashboardOverview />
      </AccountShell>
      <Footer />
    </>
  );
}
