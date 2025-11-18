/* eslint-disable-next-line @zohodesk/no-hardcoding/no-hardcoding */
"use client";

import { useTheme } from "next-themes";
import { useEffect } from "react";
import { settingsMap } from "@/lib/settings";
import { useFetchSettings } from "@/hooks/employee-hooks/use-settings";

// Convert hex to HSL
function hexToHSL(hex: string) {
  // Remove the # if present
  hex = hex.replace(/^#/, "");

  // Parse the hex values
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }

    h /= 6;
  }

  // Convert to degrees and percentages
  h = Math.round(h * 360);
  s = Math.round(s * 100);
  const lPercent = Math.round(l * 100);

  return `${h} ${s}% ${lPercent}%`;
}

export function ThemeInitializer() {
  const { setTheme } = useTheme();
  const { data: settings } = useFetchSettings();

  useEffect(() => {
    // Check if theme exists in localStorage
    const storedTheme = localStorage.getItem("theme");

    // If no theme is set, default to light theme
    if (!storedTheme) {
      setTheme("light");
      localStorage.setItem("theme", "light");
    }

    // Apply custom theme colors if they exist in settings
    const root = document.documentElement;
    const themeColors = {
      [settingsMap.THEME_PRIMARY_COLOR]: "--primary",
      [settingsMap.THEME_SECONDARY_COLOR]: "--secondary",
      [settingsMap.THEME_BACKGROUND_COLOR]: "--background",
      [settingsMap.THEME_FOREGROUND_COLOR]: "--foreground",
      [settingsMap.THEME_MUTED_COLOR]: "--muted",
      [settingsMap.THEME_ACCENT_COLOR]: "--accent",
      [settingsMap.THEME_DESTRUCTIVE_COLOR]: "--destructive",
    };

    if (settings?.items) {
      settings.items.forEach((setting) => {
        const cssVar = themeColors[setting.key];
        if (cssVar && setting.value) {
          // Convert hex to HSL if it's a hex color
          if (setting.value.startsWith("#")) {
            const hslValue = hexToHSL(setting.value);
            root.style.setProperty(cssVar, hslValue);
          } else {
            root.style.setProperty(cssVar, setting.value);
          }
        }
      });
    }
  }, [setTheme, settings]);

  return null;
}
