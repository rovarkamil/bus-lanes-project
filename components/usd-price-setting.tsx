"use client";

import { useTranslation } from "@/i18n/client";
import { useUpdateSetting } from "@/hooks/employee-hooks/use-settings";
import { toast } from "sonner";
import { settingsMap } from "@/lib/settings";
import { useState, useEffect } from "react";
import { Edit2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/formatNumber";
import { useSettingsStore } from "@/lib/stores/settings-store";
import { useQueryClient } from "@tanstack/react-query";
import { SettingWithRelations } from "@/types/models/setting";
import { PaginatedResponse } from "@/types/models/common";

export const UsdPriceSetting = () => {
  const { t } = useTranslation("Dashboard");
  const [usdPrice, setUsdPrice] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const { getSetting, settings, setSettings } = useSettingsStore();
  const queryClient = useQueryClient();
  const { mutate: updateSetting, isPending: isSubmitting } = useUpdateSetting();

  useEffect(() => {
    const currentPrice = getSetting(settingsMap.USD_PRICE);
    setUsdPrice(currentPrice);
  }, [getSetting, settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const settings = useSettingsStore.getState().settings;
    const setting = settings?.items?.find(
      (setting) => setting.key === settingsMap.USD_PRICE
    );

    if (!setting) return;

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
              item.key === settingsMap.USD_PRICE
                ? { ...item, value: usdPrice }
                : item
            ),
          };
        }
      );

      await updateSetting(
        {
          id: setting.id,
          key: settingsMap.USD_PRICE,
          value: usdPrice,
          type: setting.type,
        },
        {
          onSuccess: () => {
            toast.success(t("Settings.Updated"));
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
              item.key === settingsMap.USD_PRICE
                ? { ...item, value: usdPrice }
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

  return (
    <main className="text-sm font-medium flex items-center gap-1 whitespace-nowrap">
      <span className="text-muted-foreground">$1 = </span>
      <span className="flex items-center gap-0.5">
        {!isEditing ? (
          <span
            onClick={() => setIsEditing(true)}
            className={cn(
              "group flex items-center gap-1 rounded-md bg-primary/5 px-2 py-1 transition-all duration-200",
              "cursor-pointer hover:bg-primary/10"
            )}
          >
            {isSubmitting ? (
              <>
                <span className="text-base font-semibold text-primary">
                  Please wait...
                </span>
              </>
            ) : (
              <>
                <span className="text-base font-semibold text-primary">
                  {formatNumber(Number(getSetting(settingsMap.USD_PRICE)))}
                </span>
                <span className="text-xs text-muted-foreground">IQD</span>
                <Edit2 className="h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </>
            )}
          </span>
        ) : (
          <div className="flex items-center gap-1 rounded-md bg-primary/5 px-2 py-1">
            <input
              type="number"
              value={usdPrice}
              onChange={(e) => setUsdPrice(e.target.value)}
              onBlur={(e) => {
                handleSubmit(e);
                setIsEditing(false);
              }}
              className="w-14 bg-transparent text-base font-semibold text-primary outline-none"
              autoFocus
            />
            <span className="text-xs text-muted-foreground">IQD</span>
          </div>
        )}
      </span>
    </main>
  );
};
