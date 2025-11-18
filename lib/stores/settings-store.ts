import { create } from "zustand";
import { SettingWithRelations } from "@/types/models/setting";
import { PaginatedResponse } from "@/types/models/common";

interface SettingsState {
  settings: PaginatedResponse<SettingWithRelations> | null;
  setSettings: (settings: PaginatedResponse<SettingWithRelations>) => void;
  getSetting: (key: string) => string;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: null,
  setSettings: (settings) => set({ settings }),
  getSetting: (key) =>
    get().settings?.items?.find((setting) => setting.key === key)?.value || "",
}));
