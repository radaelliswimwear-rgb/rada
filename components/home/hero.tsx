import { optimizedVideoUrl } from "lib/cloudinary/video-url";
import { settingsRepository } from "lib/currency/settings-repository";
import { BrandPattern } from "./brand-pattern";
import { HeroBackground } from "./hero-background";

const DEFAULT_EYEBROW = "Radaelli Swimwear";
const DEFAULT_HEADLINE =
  "Diseños que acompañan tu belleza natural con fuerza, libertad y estilo.";
const DEFAULT_SUBHEADLINE =
  "Swimwear pensado para mujeres auténticas, seguras y poderosas.";
const DEFAULT_CTA_LABEL = "Compra de forma sostenible";
const DEFAULT_CTA_HREF = "#productos";

// Portada del home (Sprint 21): si la fundadora subió un video en
// /admin/configuracion, la portada se vuelve una escena en loop (estilo
// Touché/Cupshe) destacando la colección del momento, con el texto de
// marca superpuesto en blanco sobre un degradado oscuro para que siga
// siendo legible sobre cualquier video. Sin video subido, cae exactamente
// al diseño anterior (manchas pastel + texto oscuro sobre blanco) — nunca
// se queda vacía. Todos los textos (eyebrow, título, subtítulo, botón) son
// editables desde el panel en ambos casos, así puede cambiar el mensaje
// sin depender de un video.
export async function Hero() {
  const { heroVideo, heroPoster, heroText } = await settingsRepository.get();

  const eyebrow = heroText.eyebrow ?? DEFAULT_EYEBROW;
  const headline = heroText.headline ?? DEFAULT_HEADLINE;
  const subheadline = heroText.subheadline ?? DEFAULT_SUBHEADLINE;
  const ctaLabel = heroText.ctaLabel ?? DEFAULT_CTA_LABEL;
  const ctaHref = heroText.ctaHref ?? DEFAULT_CTA_HREF;

  if (heroVideo) {
    // El video se graba horizontal (16:9) pero object-cover en un celular
    // (angosto y alto) lo agranda hasta que la altura encaje, dejando
    // visible solo ~30% del ancho original centrado — se ve como una foto
    // pegada a la cara de las modelas. Usar una relación de aspecto más
    // baja en pantallas chicas (en vez de min-h-[80vh], una caja fija de
    // 4:5 en celular, un poco menos alta en tablet) reduce ese recorte sin
    // necesitar un archivo de video distinto. lg:aspect-auto cancela esto
    // en escritorio, donde el ancho manda y el recorte queda arriba/abajo
    // (se ve bien, es el diseño de siempre).
    return (
      <section
        id="hero"
        className="relative flex aspect-[4/5] scroll-mt-20 items-end overflow-hidden bg-neutral-950 text-white sm:aspect-[3/4] md:aspect-[16/10] lg:aspect-auto lg:min-h-[90vh]"
      >
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src={optimizedVideoUrl(heroVideo.url)}
          poster={heroPoster?.url}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/10" />

        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-16 pt-24 lg:px-8">
          <p className="mb-4 animate-fade-in text-xs uppercase tracking-[0.4em] text-white/80">
            {eyebrow}
          </p>
          <h1 className="max-w-3xl animate-fade-in-up font-semibold text-4xl leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            {headline}
          </h1>
          <p className="mt-6 max-w-xl animate-fade-in-up text-base text-white/85 [animation-delay:120ms] sm:text-lg">
            {subheadline}
          </p>
          <div className="mt-10 flex animate-fade-in-up flex-wrap gap-4 [animation-delay:240ms]">
            <a
              href={ctaHref}
              className="rounded-full bg-white px-8 py-3.5 text-sm font-medium uppercase tracking-wide text-neutral-900 shadow-lg transition-colors duration-300 hover:bg-brand-coral hover:text-white"
            >
              {ctaLabel}
            </a>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      id="hero"
      className="relative flex min-h-[62vh] scroll-mt-20 items-center overflow-hidden bg-white text-neutral-900"
    >
      <HeroBackground />
      <BrandPattern className="absolute inset-0 h-full w-full text-brand-muted/[0.12]" />
      <div className="absolute inset-0 bg-gradient-to-t from-white via-white/50 to-transparent" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-16 lg:px-8">
        <p className="mb-4 animate-fade-in text-xs uppercase tracking-[0.4em] text-brand-crimson">
          {eyebrow}
        </p>
        <h1 className="max-w-3xl animate-fade-in-up font-semibold text-5xl leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
          {headline}
        </h1>
        <p className="mt-6 max-w-xl animate-fade-in-up text-base text-neutral-600 [animation-delay:120ms] sm:text-lg">
          {subheadline}
        </p>
        <div className="mt-10 flex animate-fade-in-up flex-wrap gap-4 [animation-delay:240ms]">
          <a
            href={ctaHref}
            className="rounded-full bg-brand-coral px-8 py-3.5 text-sm font-medium uppercase tracking-wide text-white shadow-lg shadow-brand-coral/20 transition-colors duration-300 hover:bg-brand-crimson"
          >
            {ctaLabel}
          </a>
        </div>
      </div>
    </section>
  );
}
