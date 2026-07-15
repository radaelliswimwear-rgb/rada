import type { CardInput } from "./types";

export type CardErrors = Partial<Record<keyof CardInput, string>>;

function luhnCheck(digits: string): boolean {
  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = Number(digits[i]);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

// Validación pura y reutilizable (igual criterio que
// lib/checkout/validation.ts): sin dependencias de React ni del DOM, lista
// para reusarse tal cual en un futuro endpoint /api/checkout.
export function validateCard(input: CardInput): CardErrors {
  const errors: CardErrors = {};

  if (!input.cardholderName.trim()) {
    errors.cardholderName = "Ingresá el nombre del titular.";
  }

  const digits = input.cardNumber.replace(/\s/g, "");
  if (!/^\d{13,19}$/.test(digits) || !luhnCheck(digits)) {
    errors.cardNumber = "Número de tarjeta inválido.";
  }

  const expiryMatch = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(input.expiry.trim());
  if (!expiryMatch) {
    errors.expiry = "Formato inválido (MM/AA).";
  } else {
    const [, month, year] = expiryMatch;
    const expiryEnd = new Date(2000 + Number(year), Number(month), 0);
    if (expiryEnd < new Date()) {
      errors.expiry = "La tarjeta está vencida.";
    }
  }

  if (!/^\d{3,4}$/.test(input.cvc.trim())) {
    errors.cvc = "CVC inválido.";
  }

  return errors;
}
