import { AuthShell } from "components/auth/auth-shell";
import { LoginForm } from "components/auth/login-form";
import Footer from "components/layout/footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Iniciar sesión",
  robots: { index: false, follow: false },
};

export default function IniciarSesionPage() {
  return (
    <>
      <AuthShell
        title="Iniciar sesión"
        description="Ingresá con tu email y contraseña."
      >
        <LoginForm />
      </AuthShell>
      <Footer />
    </>
  );
}
