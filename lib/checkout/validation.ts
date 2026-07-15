import type { ShippingAddressErrors, ShippingAddressInput } from "./types";

const POSTAL_CODE_REGEX = /^\d{4,5}$/;
const PHONE_REGEX = /^[+]?[\d\s-]{9,15}$/;

// Validación pura y reutilizable: la misma función corre en el cliente hoy
// y podría reusarse tal cual en un futuro endpoint /api/checkout.
export function validateShippingAddress(
  input: ShippingAddressInput,
): ShippingAddressErrors {
  const errors: ShippingAddressErrors = {};

  if (!input.fullName.trim()) errors.fullName = "Ingresá el nombre completo.";
  if (!input.street.trim()) errors.street = "Ingresá la calle y número.";
  if (!input.city.trim()) errors.city = "Ingresá la ciudad.";
  if (!input.province.trim()) errors.province = "Ingresá la provincia.";
  if (!input.country.trim()) errors.country = "Ingresá el país.";
  if (!POSTAL_CODE_REGEX.test(input.postalCode.trim())) {
    errors.postalCode = "Código postal inválido.";
  }
  if (!PHONE_REGEX.test(input.phone.trim())) {
    errors.phone = "Teléfono inválido.";
  }

  return errors;
}
