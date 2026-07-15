import { AuthShell } from "components/auth/auth-shell";
import { ForgotPasswordForm } from "components/auth/forgot-password-form";
import Footer from "components/layout/footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Recuperar contraseña",
  robots: { index: false, follow: false },
};

export default function RecuperarContrasenaPage() {
  return (
    <>
      <AuthShell
        title="Recuperar contraseña"
        description="Te enviamos instrucciones para restablecerla."
      >
        <ForgotPasswordForm />
      </AuthShell>
      <Footer />
    </>
  );
}
