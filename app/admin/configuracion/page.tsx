import type { Metadata } from "next";
import { AdminShell } from "components/admin/admin-shell";
import { SettingsManager } from "components/admin/settings-manager";
import Footer from "components/layout/footer";
import { settingsRepository } from "lib/currency/settings-repository";

export const metadata: Metadata = {
  title: "Admin — Configuración",
  robots: { index: false, follow: false },
};

export default async function AdminSettingsPage() {
  const settings = await settingsRepository.get();

  return (
    <>
      <AdminShell title="Configuración">
        <SettingsManager initial={settings} />
      </AdminShell>
      <Footer />
    </>
  );
}
