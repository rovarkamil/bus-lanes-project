"use client";

import { FC, useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useTranslation } from "@/i18n/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MoonIcon, SunIcon } from "lucide-react";

const ThemeToggleButton: FC<{ isExpanded?: boolean }> = ({
  isExpanded = true,
}) => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { t, i18n } = useTranslation("Dashboard");
  const isRTL = i18n.language !== "en";

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <Button
      className={cn(
        "bg-primary/20 text-primary hover:bg-primary/30",
        "w-auto gap-4",
        isExpanded && "px-4",
        !isExpanded && "justify-center px-2"
      )}
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="w-6 h-6 flex-shrink-0" dir={isRTL ? "rtl" : "ltr"}>
        <MoonIcon className="dark:hidden" />
        <SunIcon className="hidden dark:block" />
      </div>
      {isExpanded && (
        <span className="flex-1 text-sm text-left" dir={isRTL ? "rtl" : "ltr"}>
          <span className="dark:hidden">{t("Common.Theme.Light")}</span>
          <span className="hidden dark:block">{t("Common.Theme.Dark")}</span>
        </span>
      )}
    </Button>
  );
};

export default ThemeToggleButton;
