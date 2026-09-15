import type { ShippingAddressErrors, ShippingAddressInput } from "./types";

// Código postal colombiano (DANE, 6 dígitos) — opcional, a diferencia de
// España; solo se valida el formato si el usuario cargó uno.
const POSTAL_CODE_REGEX = /^\d{6}$/;
// Este campo es el WhatsApp de la clienta (Sprint 30, obligatorio para
// coordinar la entrega) — a diferencia de un teléfono cualquiera, tiene que
// ser un celular real: 10 dígitos, siempre empieza en 3, con o sin +57
// adelante. Un fijo no puede recibir WhatsApp, por eso ya no se acepta.
const PHONE_REGEX = /^(\+?57)?[\s-]?3\d{9}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Validación pura y reutilizable: la misma función corre en el cliente hoy
// y podría reusarse tal cual en un futuro endpoint /api/checkout.
export function validateShippingAddress(
  input: ShippingAddressInput,
): ShippingAddressErrors {
  const errors: ShippingAddressErrors = {};

  if (!EMAIL_REGEX.test(input.email.trim())) {
    errors.email = "Ingresá un correo válido.";
  }
  if (!input.fullName.trim()) errors.fullName = "Ingresá el nombre completo.";
  if (!input.street.trim()) errors.street = "Ingresá la dirección.";
  if (!input.neighborhood.trim()) errors.neighborhood = "Ingresá el barrio.";
  if (!input.city.trim()) errors.city = "Ingresá la ciudad o municipio.";
  if (!input.province.trim()) errors.province = "Ingresá el departamento.";
  if (!input.country.trim()) errors.country = "Ingresá el país.";
  if (input.postalCode.trim() && !POSTAL_CODE_REGEX.test(input.postalCode.trim())) {
    errors.postalCode = "Código postal inválido (6 dígitos).";
  }
  if (!PHONE_REGEX.test(input.phone.trim().replace(/\s/g, ""))) {
    errors.phone = "Ingresá un número de WhatsApp válido (celular colombiano de 10 dígitos).";
  }

  return errors;
}
