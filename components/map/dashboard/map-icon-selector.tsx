/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { useFetchMapIcons } from "@/hooks/employee-hooks/use-map-icon";
import { MapIconWithRelations } from "@/types/models/map-icon";
import { useTranslation } from "@/i18n/client";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface MapIconSelectorProps {
  onIconSelect: (icon: MapIconWithRelations | null) => void;
  selectedIconId?: string;
  className?: string;
}

export function MapIconSelector({
  onIconSelect,
  selectedIconId,
  className,
}: MapIconSelectorProps) {
  const { t } = useTranslation("Map");
  const [search, setSearch] = useState("");

  const { data, isPending } = useFetchMapIcons({
    page: 1,
    limit: 50,
    ...(search ? { search } : {}),
  });

  const icons = data?.items || [];

  return (
    <div
      className={cn(
        "flex flex-col bg-background border-t shadow-lg relative z-10",
        className
      )}
    >
      <div className="p-3 border-b space-y-2 bg-background">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">{t("MapIcons")}</h3>
          {selectedIconId && (
            <button
              onClick={() => onIconSelect(null)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {t("ClearSelection")}
            </button>
          )}
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("SearchIcons")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8"
          />
        </div>
      </div>

      <ScrollArea className="flex-1 bg-background">
        {isPending ? (
          <div className="flex items-center justify-center h-20">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : icons.length === 0 ? (
          <div className="flex items-center justify-center h-20 text-sm text-muted-foreground">
            {search ? t("NoIconsFound") : t("NoIconsAvailable")}
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-1.5 p-2 bg-background">
            {icons.map((icon) => (
              <button
                key={icon.id}
                onClick={() => onIconSelect(icon)}
                className={cn(
                  "relative aspect-square rounded-md border-2 p-1 transition-all hover:border-primary hover:bg-accent bg-white",
                  selectedIconId === icon.id
                    ? "border-primary bg-accent ring-1 ring-primary"
                    : "border-border"
                )}
                title={icon.name?.en || icon.id}
              >
                {icon.file?.url ? (
                  <img
                    src={icon.file.url}
                    alt={icon.name?.en || "Icon"}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                    ?
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </ScrollArea>

      {selectedIconId && (
        <div className="p-2 border-t bg-muted/30 text-xs text-center text-muted-foreground">
          {t("ClickMapToPlaceIcon")}
        </div>
      )}
    </div>
  );
}
