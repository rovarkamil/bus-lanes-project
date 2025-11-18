/* eslint-disable-next-line @zohodesk/no-hardcoding/no-hardcoding */
"use client";

import { Locales, FALLBACK_LOCALE } from "@/i18n/settings";
import { createContext, useContext } from "react";

const Context = createContext<Locales>(FALLBACK_LOCALE);

export function LocaleProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: Locales;
}) {
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useLocale() {
  return useContext(Context);
}
