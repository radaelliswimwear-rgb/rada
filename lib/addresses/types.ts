export type Address = {
  id: string;
  userId: string;
  label: string; // "Casa", "Oficina"
  fullName: string;
  street: string;
  city: string;
  postalCode: string;
  province: string;
  country: string;
  phone: string;
  isDefault: boolean;
};

export type AddressInput = Omit<Address, "id" | "userId">;
