"use client";

import { useFetchSettings } from "@/hooks/employee-hooks/use-settings";
import { useSettingsStore } from "@/lib/stores/settings-store";
import { useEffect } from "react";

export const SettingsInitializer = () => {
  const { data } = useFetchSettings();
  const setSettings = useSettingsStore((state) => state.setSettings);

  useEffect(() => {
    if (data) {
      setSettings(data);
    }
  }, [data, setSettings]);

  return null;
};
