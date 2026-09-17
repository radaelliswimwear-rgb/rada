import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";
import { ActivateInternalTrafficPanel } from "components/internal-traffic/activate-internal-traffic-panel";
import Footer from "components/layout/footer";

export const metadata: Metadata = {
  title: "Activar tráfico interno",
  robots: { index: false, follow: false },
};

export default function ActivarTraficoInternoPage() {
  return (
    <>
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-4 py-16">
        <Link
          href="/"
          aria-label="Radaelli Swimwear — inicio"
          className="relative mb-6 h-14 w-36"
        >
          <Image
            src="/logo/radaelli-swimwear.png"
            alt="Radaelli Swimwear"
            fill
            sizes="144px"
            className="object-contain"
          />
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Tráfico interno
        </h1>
        <div className="mt-8 w-full rounded-2xl border border-neutral-200 p-6 dark:border-neutral-800 sm:p-8">
          <Suspense fallback={null}>
            <ActivateInternalTrafficPanel />
          </Suspense>
        </div>
      </div>
      <Footer />
    </>
  );
}
