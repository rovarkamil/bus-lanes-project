/* eslint-disable @next/next/no-img-element */
"use client";

import { useTranslation } from "@/i18n/client";
import { Button } from "@/components/ui/button";
import LanguageSwitcher from "@/components/client/language-switcher";
import ThemeToggle from "@/components/client/theme-toggle";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserType } from "@prisma/client";
import { useCallback } from "react";
import { useTranslation as useDashboardTranslation } from "@/i18n/client";

export default function Navbar() {
  const { t, i18n } = useTranslation("Map");
  const { t: authT } = useTranslation("Auth");
  const { t: dashboardT } = useDashboardTranslation("Dashboard");
  const { data: session } = useSession();
  const locale = i18n.language as "en" | "ar" | "ckb";
  const pathname = usePathname();
  const hideNavbar =
    pathname?.startsWith("/dashboard") || pathname === "/login";

  const sessionUserType = session?.user?.userType as UserType | undefined;
  const canAccessDashboard =
    sessionUserType === UserType.EMPLOYEE ||
    sessionUserType === UserType.SUPER_ADMIN;

  const handleSignOut = useCallback(async () => {
    await signOut({ callbackUrl: "/login" });
  }, []);

  if (hideNavbar) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/95 text-slate-100 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative">
              <div className="h-12 w-12 rounded-2xl border border-slate-700 bg-slate-900 shadow-lg ring-1 ring-primary/30">
                <img
                  src="/images/project-logo.png"
                  alt={authT("AppName")}
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border border-slate-900 bg-emerald-400 shadow-emerald-500/50"></span>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-lg font-semibold tracking-tight">
                {authT("AppName")}
              </span>
              <span className="text-[11px] uppercase text-slate-400">
                {t("LiveTransitMap")}
              </span>
            </div>
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <LanguageSwitcher currentLocale={locale} />
            <ThemeToggle />

            {canAccessDashboard && (
              <Button
                asChild
                variant="secondary"
                className="border border-slate-700 bg-slate-900/80 text-slate-100 hover:bg-slate-800"
              >
                <Link href="/dashboard">{dashboardT("Dashboard")}</Link>
              </Button>
            )}

            {session ? (
              <Button
                onClick={handleSignOut}
                variant="outline"
                className="border-primary/50 text-primary hover:bg-primary/10"
              >
                {authT("SignOut")}
              </Button>
            ) : (
              <Button
                asChild
                className="bg-gradient-to-r from-primary to-indigo-500 text-white shadow-primary/40 hover:opacity-90"
              >
                <Link href="/login">{authT("LogIn")}</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
