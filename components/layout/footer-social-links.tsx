"use client";

import { toast } from "sonner";

const SOCIAL_LINKS = ["Instagram", "Pinterest", "TikTok"];

export function FooterSocialLinks() {
  return (
    <div className="mt-6 flex flex-wrap gap-3">
      {SOCIAL_LINKS.map((social) => (
        <button
          key={social}
          onClick={() => toast(`Pronto podrás seguirnos en ${social}.`)}
          className="rounded-full border border-neutral-300 px-4 py-1.5 text-xs text-neutral-600 transition-colors duration-200 hover:border-brand-crimson hover:text-brand-crimson"
        >
          {social}
        </button>
      ))}
    </div>
  );
}
