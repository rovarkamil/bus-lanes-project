"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/lib/stores/settings-store";
import { useUpdateSetting } from "@/hooks/employee-hooks/use-settings";
import { toast } from "sonner";
import { settingsMap } from "@/lib/settings";
import { useQueryClient } from "@tanstack/react-query";
import { SettingWithRelations } from "@/types/models/setting";
import { PaginatedResponse } from "@/types/models/common";
import { StartingLocationDialog } from "@/components/dialogs/map/starting-location-dialog";
import { useTranslation } from "@/i18n/client";

type LocationData = {
  lat: number;
  lng: number;
};

export const StartingLocationButton = () => {
  const { t } = useTranslation("Dashboard");
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
      <Button
        className={cn(
          "bg-primary/20 text-primary hover:bg-primary/30",
          "w-full gap-4"
        )}
        onClick={() => setIsDialogOpen(true)}
        title={t("StartingLocation") || "Starting Location"}
      >
        <MapPin />
      </Button>

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
