import {
  createAddressAction,
  listAddressesByUserAction,
  removeAddressAction,
  updateAddressAction,
} from "./addresses-actions";

// Adaptador Prisma/Postgres (Sprint 12). Mismo contrato público que antes
// (localStorage, Sprint 9) — components/account/addresses-manager.tsx y
// components/checkout/shipping-address-form.tsx no cambian.
export const addressesRepository = {
  listByUser: listAddressesByUserAction,
  create: createAddressAction,
  update: updateAddressAction,
  remove: removeAddressAction,
};
