import { ImageResponse } from "next/og";
import { join } from "path";
import { readFile } from "fs/promises";
import { SITE_NAME } from "lib/seo/site";

export type Props = {
  title?: string;
};

// Reemplaza el placeholder genérico del template de Next.js Commerce
// (fondo negro + triángulo blanco de LogoIcon, sin relación con la marca)
// por el logo oficial real (public/logo/radaelli-swimwear.png, el mismo
// que usan navbar/footer/menú móvil) sobre el crema de marca -- mismos
// valores hex exactos provistos por la clienta (app/globals.css,
// --color-brand-blush / --color-background-soft), no un color inventado.
export default async function OpengraphImage(
  props?: Props,
): Promise<ImageResponse> {
  const { title } = {
    ...{ title: SITE_NAME },
    ...props,
  };
  // Evita duplicar el nombre de la marca: el logo YA incluye el wordmark
  // "RADAELLI SWIMWEAR" -- el título solo se muestra como caption cuando
  // es distinto (ej. una colección o página real), nunca cuando cae en el
  // default genérico de SITE_NAME.
  const caption = title && title !== SITE_NAME ? title : null;

  const [fontFile, logoFile] = await Promise.all([
    readFile(join(process.cwd(), "./fonts/Inter-Bold.ttf")),
    readFile(join(process.cwd(), "./public/logo/radaelli-swimwear.png")),
  ]);
  const font = Uint8Array.from(fontFile).buffer;
  const logoDataUrl = `data:image/png;base64,${logoFile.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        tw="flex h-full w-full flex-col items-center justify-center"
        style={{ backgroundColor: "#f7f4ef" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- next/og (Satori) exige <img>, no soporta next/image */}
        <img src={logoDataUrl} width={520} height={370} alt={SITE_NAME} />
        {caption ? (
          <p tw="mt-10 text-5xl font-bold" style={{ color: "#171717" }}>
            {caption}
          </p>
        ) : null}
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Inter",
          data: font,
          style: "normal",
          weight: 700,
        },
      ],
    },
  );
}
