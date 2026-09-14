import { getSitewideDiscountPercentAction } from "lib/pricing/discount-actions";

// Aviso global (arriba del Navbar, en todas las páginas) que anuncia el
// descuento del sitio completo — ver /admin/configuracion. Se apaga solo
// cuando el descuento vuelve a 0, nadie tiene que acordarse de quitarlo a
// mano. Lectura liviana (getSitewideDiscountPercentAction, no
// getSettingsAction) para no disparar el chequeo de la TRM en cada
// request de cada página del sitio.
export async function DiscountAnnouncementBar() {
  const discountPercent = await getSitewideDiscountPercentAction();
  if (discountPercent <= 0) return null;

  return (
    <div className="bg-brand-crimson px-4 py-2 text-center text-xs font-medium uppercase tracking-[0.15em] text-white sm:text-sm">
      {discountPercent}% de descuento en toda la tienda
    </div>
  );
}
