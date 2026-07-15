import { AuthShell } from "components/auth/auth-shell";
import { RegisterForm } from "components/auth/register-form";
import Footer from "components/layout/footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Crear cuenta",
  robots: { index: false, follow: false },
};

export default function RegistroPage() {
  return (
    <>
      <AuthShell
        title="Creá tu cuenta"
        description="Guardá tus direcciones, favoritos y pedidos."
      >
        <RegisterForm />
      </AuthShell>
      <Footer />
    </>
  );
}
