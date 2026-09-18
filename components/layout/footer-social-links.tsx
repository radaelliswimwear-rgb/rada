"use client";

import { trackCustom } from "lib/analytics/client/track";
import { SOCIAL_LINKS } from "lib/social-links";

export function FooterSocialLinks() {
  return (
    <div className="mt-6 flex flex-wrap gap-3">
      {SOCIAL_LINKS.map((social) => (
        <a
          key={social.key}
          href={social.href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            if (social.key === "whatsapp") {
              trackCustom("click_whatsapp", { context: "footer" });
            }
          }}
          className="rounded-full border border-neutral-300 px-4 py-1.5 text-xs text-neutral-600 transition-colors duration-200 hover:border-brand-crimson hover:text-brand-crimson"
        >
          {social.label}
        </a>
      ))}
    </div>
  );
}
