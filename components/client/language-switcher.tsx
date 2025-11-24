"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { switchLocaleAction } from "@/utils/switch-locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe, ChevronDown } from "lucide-react";

const languages = [
  { code: "en", label: "English" },
  { code: "ckb", label: "کوردی" },
  { code: "ar", label: "عربي" },
];

interface LanguageSwitcherProps {
  currentLocale: string;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  currentLocale,
}) => {
  const handleLocaleChange = (locale: string) => {
    switchLocaleAction(locale);
  };

  const currentLanguage = languages.find((lang) => lang.code === currentLocale);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all duration-300 font-medium bg-white/80 dark:bg-white/10 text-slate-700 dark:text-slate-300 hover:bg-white/90 dark:hover:bg-white/20 backdrop-blur-sm hover:scale-105 border border-slate-200/50 dark:border-white/20 hover:border-purple-400/50">
          <Globe className="w-4 h-4" />
          <span className="hidden sm:inline">{currentLanguage?.label}</span>
          <span className="sm:hidden">
            {currentLanguage?.code.toUpperCase()}
          </span>
          <ChevronDown className="w-3 h-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-32 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-slate-200/50 dark:border-white/20"
      >
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLocaleChange(lang.code)}
            className={cn(
              "cursor-pointer transition-all duration-300 hover:scale-105",
              currentLocale === lang.code
                ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-white/10 hover:text-slate-800 dark:hover:text-white"
            )}
          >
            {lang.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
