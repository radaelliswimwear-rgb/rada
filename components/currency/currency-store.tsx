"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { formatMoney } from "lib/currency/format";
import { settingsRepository } from "lib/currency/settings-repository";
import { SUPPORTED_CURRENCIES, type CurrencyCode } from "lib/currency/types";

const STORAGE_KEY = "lago-currency:v1";

type CurrencyContextValue = {
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  usdRate: number;
  format: (amountCop: number) => string;
};

const CurrencyContext = createContext<CurrencyContextValue | undefined>(
  undefined,
);

// Moneda de visualización elegida por el usuario (COP por defecto),
// persistida en localStorage para que se mantenga entre recargas y
// navegación (mismo patrón Context que cart-store.tsx/wishlist-store.tsx).
// Nunca es la fuente de verdad del precio: solo cambia cómo se muestra el
// mismo monto en COP (lib/currency/types.ts, BASE_CURRENCY) — el checkout
// siempre cobra en COP sin importar esta selección.
export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>("COP");
  const [usdRate, setUsdRate] = useState(4000);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED_CURRENCIES.includes(stored as CurrencyCode)) {
      setCurrencyState(stored as CurrencyCode);
    }
    settingsRepository.get().then((settings) => {
      setUsdRate(settings.usdRate);
    });
  }, []);

  const setCurrency = useCallback((next: CurrencyCode) => {
    setCurrencyState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const format = useCallback(
    (amountCop: number) => formatMoney(amountCop, currency, usdRate),
    [currency, usdRate],
  );

  const value = useMemo<CurrencyContextValue>(
    () => ({ currency, setCurrency, usdRate, format }),
    [currency, setCurrency, usdRate, format],
  );

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

// Ver el mismo comentario en components/wishlist/wishlist-store.tsx: antes
// esto lanzaba una excepción y tumbaba toda la página ante un desajuste
// transitorio del Context (Fast Refresh en desarrollo, imposible en
// producción). Degrada a COP con la tasa por defecto en vez de romper el
// sitio — sigue mostrando precios correctos, solo no recuerda el cambio de
// moneda del usuario hasta que el contexto real vuelva a estar disponible.
const FALLBACK_USD_RATE = 4000;
const FALLBACK_CURRENCY: CurrencyContextValue = {
  currency: "COP",
  setCurrency: () => {},
  usdRate: FALLBACK_USD_RATE,
  format: (amountCop: number) => formatMoney(amountCop, "COP", FALLBACK_USD_RATE),
};

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    if (process.env.NODE_ENV !== "production") {
      console.error(
        "useCurrency: CurrencyContext no disponible (probablemente un Fast Refresh a mitad de carga) — usando COP como reserva en vez de tumbar la página.",
      );
    }
    return FALLBACK_CURRENCY;
  }
  return context;
}
