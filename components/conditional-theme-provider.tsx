/* eslint-disable-next-line @zohodesk/no-hardcoding/no-hardcoding */
"use client";

import { usePathname } from "next/navigation";
import { ThemeProvider } from "@/components/theme-provider";
import { type ThemeProviderProps } from "next-themes/dist/types";

export function ConditionalThemeProvider({
  children,
  ...props
}: ThemeProviderProps) {
  const pathname = usePathname();
  const isDashboardRoute = pathname?.startsWith("/dashboard");

  if (!isDashboardRoute) {
    return <>{children}</>;
  }

  return <ThemeProvider {...props}>{children}</ThemeProvider>;
}
