// Cloudinary sirve el video ya optimizado (códec y calidad elegidos según
// el navegador/dispositivo de quien visita, igual que f_auto/q_auto para
// imágenes) si se agrega esta transformación en la URL de entrega — así el
// peso real que descarga la clienta queda muy por debajo del archivo que
// subió la fundadora, sin necesidad de comprimir nada antes de subirlo.
export function optimizedVideoUrl(url: string): string {
  if (!url.includes("/video/upload/")) return url;
  return url.replace("/video/upload/", "/video/upload/f_auto,q_auto/");
}
