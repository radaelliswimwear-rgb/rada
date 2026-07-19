// Equivalencias de talla de calzado (Calzado y Niños cuando la talla es
// numérica, es decir zapatos y no ropa infantil). La talla que se guarda en
// Product.sizes sigue siendo un solo string (igual que para Hombre/Mujer,
// sin cambio de esquema) y se interpreta como la talla CO/EU — a partir de
// ahí se deriva US/UK/CM solo para mostrar, con las tablas de equivalencia
// estándar de la industria (aproximadas).
type ShoeSizeRow = { co: string; us: string; uk: string; cm: string };

const ADULT_SHOE_SIZES: ShoeSizeRow[] = [
  { co: "35", us: "4", uk: "2.5", cm: "22" },
  { co: "36", us: "4.5", uk: "3", cm: "22.5" },
  { co: "37", us: "5", uk: "3.5", cm: "23" },
  { co: "38", us: "5.5", uk: "4.5", cm: "23.5" },
  { co: "39", us: "6", uk: "5", cm: "24.5" },
  { co: "40", us: "6.5", uk: "5.5", cm: "25" },
  { co: "41", us: "7.5", uk: "6.5", cm: "25.5" },
  { co: "42", us: "8", uk: "7", cm: "26.5" },
  { co: "43", us: "9", uk: "8", cm: "27" },
  { co: "44", us: "9.5", uk: "8.5", cm: "27.5" },
  { co: "45", us: "10.5", uk: "9.5", cm: "28.5" },
  { co: "46", us: "11", uk: "10", cm: "29" },
];

const KIDS_SHOE_SIZES: ShoeSizeRow[] = [
  { co: "22", us: "6", uk: "5", cm: "13.5" },
  { co: "23", us: "7", uk: "6", cm: "14.5" },
  { co: "24", us: "8", uk: "7", cm: "15" },
  { co: "25", us: "9", uk: "8", cm: "15.5" },
  { co: "26", us: "10", uk: "9", cm: "16.5" },
  { co: "27", us: "11", uk: "10", cm: "17" },
  { co: "28", us: "11.5", uk: "10.5", cm: "17.5" },
  { co: "29", us: "12.5", uk: "11.5", cm: "18" },
  { co: "30", us: "13", uk: "12", cm: "18.5" },
  { co: "31", us: "13.5", uk: "12.5", cm: "19.5" },
  { co: "32", us: "1", uk: "13", cm: "20" },
  { co: "33", us: "1.5", uk: "13.5", cm: "20.5" },
  { co: "34", us: "2.5", uk: "1.5", cm: "21.5" },
  { co: "35", us: "3", uk: "2", cm: "22" },
];

export function isNumericSize(size: string): boolean {
  return /^\d+(\.\d+)?$/.test(size.trim());
}

// Calzado siempre usa talla numérica; en Niños solo aplica si la talla es
// numérica (así no afecta la ropa infantil, que usa "S", "4-5 años", etc.).
export function usesShoeSizeSystem(
  category: string,
  sizes: string[],
): boolean {
  if (category === "Calzado") return true;
  if (category === "Niños") return sizes.every(isNumericSize);
  return false;
}

export function formatShoeSize(size: string, isKids: boolean): string {
  const table = isKids ? KIDS_SHOE_SIZES : ADULT_SHOE_SIZES;
  const row = table.find((r) => r.co === size.trim());
  if (!row) return size;
  return `${row.co} CO · US ${row.us} · UK ${row.uk} · ${row.cm} CM`;
}
