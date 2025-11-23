"use client";

import { useTranslation } from "@/i18n/client";
import { useUpdateSetting } from "@/hooks/employee-hooks/use-settings";
import { toast } from "sonner";
import { settingsMap } from "@/lib/settings";
import { useState } from "react";
import { MapPin, Edit2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/lib/stores/settings-store";
import { useQueryClient } from "@tanstack/react-query";
import { SettingWithRelations } from "@/types/models/setting";
import { PaginatedResponse } from "@/types/models/common";
import { StartingLocationDialog } from "@/components/dialogs/map/starting-location-dialog";

type LocationData = {
  lat: number;
  lng: number;
};

export const StartingLocationSetting = () => {
  const { t, i18n } = useTranslation("Dashboard");
  const isRTL = i18n.language !== "en";
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { getSetting, setSettings } = useSettingsStore();
  const queryClient = useQueryClient();
  const { mutate: updateSetting, isPending: isSubmitting } = useUpdateSetting();

  const parseLocation = (value: string): LocationData | null => {
    if (!value) return null;
    try {
      const parsed = JSON.parse(value) as LocationData;
      if (
        typeof parsed.lat === "number" &&
        typeof parsed.lng === "number" &&
        !isNaN(parsed.lat) &&
        !isNaN(parsed.lng)
      ) {
        return parsed;
      }
    } catch {
      // Invalid JSON
    }
    return null;
  };

  const getCurrentLocation = (): LocationData | null => {
    const value = getSetting(settingsMap.STARTING_POSITION);
    return parseLocation(value);
  };

  const formatLocation = (location: LocationData | null): string => {
    if (!location) return "Not set";
    return `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`;
  };

  const handleLocationSelect = (location: LocationData) => {
    const settings = useSettingsStore.getState().settings;
    const setting = settings?.items?.find(
      (setting) => setting.key === settingsMap.STARTING_POSITION
    );

    if (!setting) return;

    const newValue = JSON.stringify(location);
    const previousSettings = queryClient.getQueryData<
      PaginatedResponse<SettingWithRelations>
    >(["settings"]);

    try {
      // Optimistically update the UI
      queryClient.setQueryData<PaginatedResponse<SettingWithRelations>>(
        ["settings"],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((item) =>
              item.key === settingsMap.STARTING_POSITION
                ? { ...item, value: newValue }
                : item
            ),
          };
        }
      );

      updateSetting(
        {
          id: setting.id,
          key: settingsMap.STARTING_POSITION,
          value: newValue,
          type: setting.type,
        },
        {
          onSuccess: () => {
            toast.success(t("Settings.Updated"));
            setIsDialogOpen(false);
          },
          onError: () => {
            // Rollback on error
            if (previousSettings) {
              queryClient.setQueryData(["settings"], previousSettings);
            }
            toast.error(t("Settings.UpdateFailed"));
          },
        }
      );

      setSettings({
        total: settings?.total ?? 0,
        page: settings?.page ?? 1,
        limit: settings?.limit ?? 10,
        totalPages: settings?.totalPages ?? 1,
        items: settings?.items
          ? settings.items.map((item) =>
              item.key === settingsMap.STARTING_POSITION
                ? { ...item, value: newValue }
                : item
            )
          : [],
      });
    } catch (error) {
      console.error(error);
      // Rollback on error
      if (previousSettings) {
        queryClient.setQueryData(["settings"], previousSettings);
      }
    }
  };

  const currentLocation = getCurrentLocation();

  return (
    <>
      <main
        className="text-sm font-medium flex items-center gap-1 whitespace-nowrap"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <span className="text-muted-foreground">{t("StartingLocation")}: </span>
        <span className="flex items-center gap-0.5">
          <span
            onClick={() => setIsDialogOpen(true)}
            className={cn(
              "group flex items-center gap-1 rounded-md bg-primary/5 px-2 py-1 transition-all duration-200",
              "cursor-pointer hover:bg-primary/10"
            )}
          >
            {isSubmitting ? (
              <>
                <span className="text-base font-semibold text-primary">
                  {t("Common.PleaseWait")}
                </span>
              </>
            ) : (
              <>
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-base font-semibold text-primary">
                  {formatLocation(currentLocation)}
                </span>
                <Edit2 className="h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </>
            )}
          </span>
        </span>
      </main>

      <StartingLocationDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        initialLocation={currentLocation}
        onLocationSelect={handleLocationSelect}
        isSubmitting={isSubmitting}
      />
    </>
  );
};
