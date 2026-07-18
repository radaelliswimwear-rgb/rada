import type { ShippingAddressErrors, ShippingAddressInput } from "./types";

// Código postal colombiano (DANE, 6 dígitos) — opcional, a diferencia de
// España; solo se valida el formato si el usuario cargó uno.
const POSTAL_CODE_REGEX = /^\d{6}$/;
// Celular colombiano (10 dígitos, empieza en 3) o fijo con indicativo, con
// o sin +57 — reemplaza la validación genérica europea de 9-15 dígitos.
const PHONE_REGEX = /^(\+?57)?[\s-]?[13]\d{6,9}$/;

// Validación pura y reutilizable: la misma función corre en el cliente hoy
// y podría reusarse tal cual en un futuro endpoint /api/checkout.
export function validateShippingAddress(
  input: ShippingAddressInput,
): ShippingAddressErrors {
  const errors: ShippingAddressErrors = {};

  if (!input.fullName.trim()) errors.fullName = "Ingresá el nombre completo.";
  if (!input.street.trim()) errors.street = "Ingresá la dirección.";
  if (!input.city.trim()) errors.city = "Ingresá la ciudad o municipio.";
  if (!input.province.trim()) errors.province = "Ingresá el departamento.";
  if (!input.country.trim()) errors.country = "Ingresá el país.";
  if (input.postalCode.trim() && !POSTAL_CODE_REGEX.test(input.postalCode.trim())) {
    errors.postalCode = "Código postal inválido (6 dígitos).";
  }
  if (!PHONE_REGEX.test(input.phone.trim().replace(/\s/g, ""))) {
    errors.phone = "Teléfono inválido.";
  }

  return errors;
}
