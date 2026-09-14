import { AuthShell } from "components/auth/auth-shell";
import { VerifyEmailPanel } from "components/auth/verify-email-panel";
import Footer from "components/layout/footer";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Confirmar correo",
  robots: { index: false, follow: false },
};

export default function VerificarEmailPage() {
  return (
    <>
      <AuthShell
        title="Confirmar correo"
        description="Un último paso para activar del todo tu cuenta."
      >
        <Suspense fallback={null}>
          <VerifyEmailPanel />
        </Suspense>
      </AuthShell>
      <Footer />
    </>
  );
}
