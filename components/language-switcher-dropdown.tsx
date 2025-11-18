import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { switchLocaleAction } from "@/utils/switch-locale";
import { cn } from "@/lib/utils";
import Cookies from "js-cookie";
import { Languages } from "lucide-react";

const languages = [
  { code: "en", label: "English" },
  { code: "ckb", label: "کوردی" },
  { code: "ar", label: "عربي" },
];

interface LanguageSwitcherProps {
  isExpanded?: boolean;
}

const LanguageSwitcherDropdown: React.FC<LanguageSwitcherProps> = ({
  isExpanded = true,
}) => {
  const currentLocale = Cookies.get("preferred_language") || "en";
  languages.find((lang) => lang.code === currentLocale);

  const handleLocaleChange = (locale: string) => {
    switchLocaleAction(locale);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className={cn(
            "bg-primary/20 text-primary hover:bg-primary/30",
            // eslint-disable-next-line @zohodesk/no-hardcoding/no-hardcoding
            "w-full gap-4",
            isExpanded && "px-4",
            // eslint-disable-next-line @zohodesk/no-hardcoding/no-hardcoding
            !isExpanded && "justify-center px-2"
          )}
        >
          <div className="w-6 h-6 flex-shrink-0">
            <Languages />
          </div>
          {isExpanded && (
            <span className="flex-1 text-sm text-left hidden md:block">
              {languages.find((lang) => lang.code === currentLocale)?.label}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[150px]">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            className={cn(
              // eslint-disable-next-line @zohodesk/no-hardcoding/no-hardcoding
              "flex items-center gap-2",
              currentLocale === language.code && "bg-muted",
              language.code !== "en" && "font-arabic"
            )}
            onClick={() => handleLocaleChange(language.code)}
          >
            <span>{language.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcherDropdown;
