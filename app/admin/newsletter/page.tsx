import type { Metadata } from "next";
import { AdminShell } from "components/admin/admin-shell";
import { NewsletterManager } from "components/admin/newsletter-manager";
import Footer from "components/layout/footer";
import { adminNewsletterRepository } from "lib/admin/newsletter-repository";

export const metadata: Metadata = {
  title: "Admin — Newsletter",
  robots: { index: false, follow: false },
};

export default async function AdminNewsletterPage() {
  const [subscribers, campaigns] = await Promise.all([
    adminNewsletterRepository.listSubscribers(),
    adminNewsletterRepository.listCampaigns(),
  ]);

  return (
    <>
      <AdminShell title="Newsletter">
        <NewsletterManager
          initialSubscribers={subscribers}
          initialCampaigns={campaigns}
        />
      </AdminShell>
      <Footer />
    </>
  );
}
