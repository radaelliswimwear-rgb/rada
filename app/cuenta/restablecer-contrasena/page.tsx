import { AuthShell } from "components/auth/auth-shell";
import { ResetPasswordForm } from "components/auth/reset-password-form";
import Footer from "components/layout/footer";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Restablecer contraseña",
  robots: { index: false, follow: false },
};

export default function RestablecerContrasenaPage() {
  return (
    <>
      <AuthShell
        title="Restablecer contraseña"
        description="Elegí una nueva contraseña para tu cuenta."
      >
        <Suspense fallback={null}>
          <ResetPasswordForm />
        </Suspense>
      </AuthShell>
      <Footer />
    </>
  );
}
