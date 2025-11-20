/* eslint-disable @zohodesk/no-hardcoding/no-hardcoding */
import type { Metadata, Viewport } from "next";
import { Lato } from "next/font/google";
import "./globals.css";
import { Providers } from "./_providers";
import { ThemeProvider } from "next-themes";
import { Suspense } from "react";
import { getLocale } from "@/i18n/server";
import { LocaleProvider } from "../components/locale-provder";
import localFont from "next/font/local";
import { ThemeInitializer } from "./theme-init";
import { SettingsInitializer } from "./setting-init";

const lato = Lato({
  subsets: ["latin"],
  weight: ["100", "300", "400", "700", "900"],
  display: "swap",
});

const Bahij = localFont({
  src: "../public/fonts/bahij.ttf",
  display: "swap",
});
// push
export const metadata: Metadata = {
  title: "Bus Interactive Map",
  description: "Bus Interactive Map",
  icons: [
    {
      rel: "icon",
      url: "/images/project-logo.png",
      media: "(prefers-color-scheme: light)",
      type: "image/png",
    },
    {
      rel: "icon",
      url: "/images/project-logo.png",
      media: "(prefers-color-scheme: dark)",
      type: "image/png",
    },
  ],
};

export const viewport: Viewport = {
  initialScale: 1,
  maximumScale: 1,
  width: "device-width",
  userScalable: false,
};

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: { lang: string };
}>) {
  const locale = await getLocale();
  const font = params.lang === "en" ? lato : Bahij;

  return (
    <html
      lang={params.lang}
      dir={locale === "en" ? "ltr" : "rtl"}
      className={font.className}
      suppressHydrationWarning
    >
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>
            <LocaleProvider value={locale}>
              <SettingsInitializer />
              <Suspense>{children}</Suspense>
            </LocaleProvider>
            <ThemeInitializer />
          </Providers>

          {/* {process.env.ENVIRONMENT === "development" ? <ScreenDebug /> : <></>} */}
        </ThemeProvider>
      </body>
    </html>
  );
}
