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
        "flex flex-col bg-background border-l shadow-lg relative z-10",
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

      <ScrollArea className="flex-1 bg-card">
        {isPending ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : icons.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-sm text-muted-foreground px-4 text-center">
            {search ? t("NoIconsFound") : t("NoIconsAvailable")}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 p-3 bg-card">
            {icons.map((icon) => (
              <button
                key={icon.id}
                onClick={() => onIconSelect(icon)}
                className={cn(
                  "relative aspect-square rounded-lg border-2 p-2 transition-all duration-200 bg-white shadow-sm hover:shadow-md cursor-pointer flex items-center justify-center",
                  selectedIconId === icon.id
                    ? "border-primary ring-2 ring-primary/30 shadow-lg scale-105 bg-primary/5"
                    : "border-muted hover:border-primary hover:scale-105"
                )}
                title={icon.name?.en || icon.id}
              >
                {icon.file?.url ? (
                  <img
                    src={icon.file.url}
                    alt={icon.name?.en || "Icon"}
                    className="w-full h-full object-contain p-0.5"
                  />
                ) : (
                  <div className="text-xs text-muted-foreground">?</div>
                )}
                {selectedIconId === icon.id && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-primary-foreground"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
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
