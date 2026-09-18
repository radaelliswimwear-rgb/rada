"use client";

import {
  FacebookIcon,
  InstagramIcon,
  TiktokIcon,
  WhatsappIcon,
} from "components/icons/social-icons";
import { trackCustom } from "lib/analytics/client/track";
import { SOCIAL_LINKS } from "lib/social-links";

const ICONS = {
  instagram: InstagramIcon,
  facebook: FacebookIcon,
  tiktok: TiktokIcon,
  whatsapp: WhatsappIcon,
};

// <details>/<summary> nativo: mismo look que un link de texto, pero al
// abrir muestra los 4 canales reales en vez de saltar directo a uno solo
// (antes "Contacto" solo abría WhatsApp y escondía el resto).
export function ContactMenu() {
  return (
    <details className="group relative">
      <summary className="cursor-pointer list-none text-sm text-neutral-700 transition-colors duration-200 hover:text-brand-crimson group-open:text-brand-crimson">
        Contacto
      </summary>
      <div className="absolute bottom-full left-0 z-10 mb-2 w-52 rounded-xl border border-neutral-200 bg-white p-2 shadow-lg">
        {SOCIAL_LINKS.map((social) => {
          const Icon = ICONS[social.key];
          return (
            <a
              key={social.key}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                if (social.key === "whatsapp") {
                  trackCustom("click_whatsapp", { context: "navbar" });
                }
              }}
              className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm text-neutral-700 transition-colors duration-200 hover:bg-neutral-50 hover:text-brand-crimson"
            >
              <Icon className="h-4 w-4 flex-none" />
              <span>
                {social.label}
                <span className="block text-xs text-neutral-400">
                  {social.handle}
                </span>
              </span>
            </a>
          );
        })}
      </div>
    </details>
  );
}
