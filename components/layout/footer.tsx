import Image from "next/image";
import { catalogRepository } from "lib/catalog/catalog-repository";
import { ContactMenu } from "./contact-menu";
import { FooterSocialLinks } from "./footer-social-links";

const STATIC_FOOTER_LINKS: Record<string, { label: string; href: string }[]> = {
  Ayuda: [
    { label: "Envíos", href: "/envios" },
    { label: "Devoluciones", href: "/devoluciones" },
    { label: "Guía de tallas", href: "#contacto" },
  ],
  Empresa: [
    { label: "Sobre nosotros", href: "#contacto" },
    { label: "Sostenibilidad", href: "#contacto" },
    { label: "Prensa", href: "#contacto" },
  ],
};

export default async function Footer() {
  const currentYear = new Date().getFullYear();
  // Mismo interruptor que el Navbar (Category.active, /admin/categorias) —
  // único lugar de verdad para qué categorías se muestran en toda la tienda.
  const activeCategories = await catalogRepository.listActiveCategories();
  const comprarLinks = activeCategories.map((category) => ({
    label: category.name,
    href: `/${category.slug}`,
  }));

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
            <FooterSocialLinks />
          </div>

          {comprarLinks.length > 0 ? (
            <div>
              <h3 className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                Comprar
              </h3>
              <ul className="mt-4 space-y-2.5">
                {comprarLinks.map((link) => (
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
          ) : null}

          {Object.entries(STATIC_FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                {title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {title === "Ayuda" ? (
                  <li>
                    <ContactMenu />
                  </li>
                ) : null}
                {links.map((link) => {
                  const isExternal = link.href.startsWith("http");
                  return (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        target={isExternal ? "_blank" : undefined}
                        rel={isExternal ? "noopener noreferrer" : undefined}
                        className="text-sm text-neutral-700 transition-colors duration-200 hover:text-brand-crimson"
                      >
                        {link.label}
                      </a>
                    </li>
                  );
                })}
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
