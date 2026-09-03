"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type CatalogChrome = {
  filterReachesNav: boolean;
  setFilterReachesNav: (value: boolean) => void;
};

const CatalogChromeContext = createContext<CatalogChrome>({
  filterReachesNav: false,
  setFilterReachesNav: () => {},
});

export function CatalogChromeProvider({ children }: { children: ReactNode }) {
  const [filterReachesNav, setFilterReachesNav] = useState(false);
  const value = useMemo(() => ({ filterReachesNav, setFilterReachesNav }), [filterReachesNav]);
  return <CatalogChromeContext.Provider value={value}>{children}</CatalogChromeContext.Provider>;
}

export function useCatalogChrome() {
  return useContext(CatalogChromeContext);
}
