"use client";

import { FC, useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MoonIcon, SunIcon } from "lucide-react";

const ThemeToggle: FC = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <Button
      className={cn(
        "px-3 py-2 text-sm rounded-lg transition-all duration-300 font-medium",
        "bg-white/80 dark:bg-white/10 text-slate-700 dark:text-slate-300 hover:bg-white/90 dark:hover:bg-white/20 hover:scale-105 backdrop-blur-sm border border-slate-200/50 dark:border-white/20 hover:border-purple-400/50"
      )}
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      <div className="w-4 h-4 flex-shrink-0">
        {theme === "dark" ? (
          <SunIcon className="w-4 h-4" />
        ) : (
          <MoonIcon className="w-4 h-4" />
        )}
      </div>
    </Button>
  );
};

export default ThemeToggle;
