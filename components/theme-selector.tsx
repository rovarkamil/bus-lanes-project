/* eslint-disable-next-line @zohodesk/no-hardcoding/no-hardcoding */
"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const themes = [
  {
    name: "Default",
    id: "default",
    colors: {
      background: "15 100% 98%",
      primary: "15 85.3% 54.5%",
      secondary: "15 30% 96%",
    },
  },
  {
    name: "Ocean",
    id: "ocean",
    colors: {
      background: "201 100% 98%",
      primary: "201 85% 45%",
      secondary: "201 30% 96%",
    },
  },
  {
    name: "Forest",
    id: "forest",
    colors: {
      background: "150 100% 98%",
      primary: "150 85% 40%",
      secondary: "150 30% 96%",
    },
  },
  {
    name: "Sunset",
    id: "sunset",
    colors: {
      background: "25 100% 98%",
      primary: "25 85% 50%",
      secondary: "25 30% 96%",
    },
  },
];

interface ThemeSelectorProps {
  onThemeChange: (theme: string) => void;
  activeTheme: string;
}

export function ThemeSelector({
  onThemeChange,
  activeTheme,
}: ThemeSelectorProps) {
  return (
    <>
      {themes.map((theme) => (
        <Card
          key={theme.id}
          className={cn(
            // eslint-disable-next-line @zohodesk/no-hardcoding/no-hardcoding
            "cursor-pointer hover:bg-accent transition-colors p-6",
            // eslint-disable-next-line @zohodesk/no-hardcoding/no-hardcoding
            "flex flex-col justify-between",
            activeTheme === theme.id && "border-primary"
          )}
          onClick={() => onThemeChange(theme.id)}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{theme.name}</h3>
              {activeTheme === theme.id && (
                <Check className="h-5 w-5 text-primary" />
              )}
            </div>

            <div className="flex gap-2">
              {Object.entries(theme.colors).map(([key, value]) => (
                <div
                  key={key}
                  className="h-8 w-8 rounded-full border shadow-sm"
                  style={{ backgroundColor: `hsl(${value})` }}
                />
              ))}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <div className="h-4 w-full rounded-full bg-primary/20" />
              <div className="h-4 w-2/3 rounded-full bg-primary/20" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-full rounded-full bg-muted" />
              <div className="h-4 w-2/3 rounded-full bg-muted" />
            </div>
          </div>
        </Card>
      ))}
    </>
  );
}
