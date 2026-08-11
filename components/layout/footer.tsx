"use client";

import Image from "next/image";
import { toast } from "sonner";

const FOOTER_LINKS: Record<string, { label: string; href: string }[]> = {
  Comprar: [
    { label: "Hombre", href: "/hombre" },
    { label: "Mujer", href: "/mujer" },
    { label: "Accesorios", href: "/accesorios" },
    { label: "Novedades", href: "/#productos" },
  ],
  Ayuda: [
    { label: "Contacto", href: "#contacto" },
    { label: "Envíos", href: "#contacto" },
    { label: "Devoluciones", href: "#contacto" },
    { label: "Guía de tallas", href: "#contacto" },
  ],
  Empresa: [
    { label: "Sobre nosotros", href: "#contacto" },
    { label: "Sostenibilidad", href: "#contacto" },
    { label: "Prensa", href: "#contacto" },
  ],
};

const SOCIAL_LINKS = ["Instagram", "Pinterest", "TikTok"];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      id="contacto"
      className="scroll-mt-20 border-t border-neutral-200 bg-white"
    >
      <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <div className="grid gap-12 md:grid-cols-[2fr_1fr_1fr_1fr]">
          <div>
            <div className="relative h-24 w-64">
              <Image
                src="/logo/radaelli-swimwear.png"
                alt="Radaelli Swimwear"
                fill
                sizes="256px"
                className="object-contain"
              />
            </div>
            <p className="mt-4 max-w-xs text-sm text-neutral-600">
              Radaelli Swimwear: trajes de baño de diseño atemporal, hechos
              para durar, con materiales nobles y una mirada minimalista.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {SOCIAL_LINKS.map((social) => (
                <button
                  key={social}
                  onClick={() =>
                    toast(`Pronto podrás seguirnos en ${social}.`)
                  }
                  className="rounded-full border border-neutral-300 px-4 py-1.5 text-xs text-neutral-600 transition-colors duration-200 hover:border-brand-crimson hover:text-brand-crimson"
                >
                  {social}
                </button>
              ))}
            </div>
          </div>

          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                {title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-neutral-700 transition-colors duration-200 hover:text-brand-crimson"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-neutral-200 py-6">
        <div className="mx-auto flex max-w-7xl items-center justify-center px-4 text-center text-xs text-neutral-500 lg:px-8">
          <p>&copy; {currentYear} Radaelli Swimwear. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
