import { AccountShell } from "components/account/account-shell";
import { ProfileForm } from "components/account/profile-form";
import Footer from "components/layout/footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Perfil",
  robots: { index: false, follow: false },
};

export default function PerfilPage() {
  return (
    <>
      <AccountShell title="Perfil">
        <ProfileForm />
      </AccountShell>
      <Footer />
    </>
  );
}
