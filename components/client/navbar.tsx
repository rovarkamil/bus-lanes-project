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
import { LayoutDashboard, LogIn, LogOut } from "lucide-react";

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
    <header className="sticky top-0 z-50 border-b border-blue-200 dark:border-blue-800 bg-blue-100/50 dark:bg-slate-800 text-slate-900 dark:text-slate-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-3 sm:px-4 py-2 pt-12 md:pt-0">
        <div className="flex items-center justify-between gap-2">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-700">
                <img
                  src="/images/project-logo.png"
                  alt={authT("AppName")}
                  className="h-full w-full object-cover rounded-2xl"
                />
              </div>
              <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white dark:border-slate-800 bg-emerald-500"></span>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-base sm:text-lg font-semibold tracking-tight text-blue-700 dark:text-blue-400">
                {authT("AppName")}
              </span>
              <span className="text-[11px] uppercase text-blue-600/70 dark:text-blue-400/70">
                {t("LiveTransitMap")}
              </span>
            </div>
          </Link>

          <div className="flex flex-1 items-center justify-end gap-1 sm:gap-2">
            <LanguageSwitcher currentLocale={locale} />
            <ThemeToggle />

            {canAccessDashboard && (
              <Button
                asChild
                variant="secondary"
                size="icon"
                className="border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-600"
                title={dashboardT("Dashboard")}
              >
                <Link href="/dashboard">
                  <LayoutDashboard className="h-4 w-4" />
                </Link>
              </Button>
            )}

            {session ? (
              <Button
                onClick={handleSignOut}
                variant="outline"
                size="icon"
                className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-500 dark:text-red-300 dark:hover:bg-red-500/10"
                title={authT("SignOut")}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                asChild
                size="icon"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                title={authT("LogIn")}
              >
                <Link href="/login" aria-label={authT("LogIn")}>
                  <LogIn className="h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
