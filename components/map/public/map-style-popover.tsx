"use client";

import { useMemo, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Palette, X } from "lucide-react";
import { useTranslation } from "@/i18n/client";
import {
  DEFAULT_MAP_STYLE,
  MAP_TILE_STYLES,
  MapBaseStyle,
} from "@/lib/map/tile-styles";
import { cn } from "@/lib/utils";
import Image from "next/image";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

interface MapStylePopoverProps {
  value?: MapBaseStyle;
  onChange?: (style: MapBaseStyle) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const MapStylePopover = ({
  value = DEFAULT_MAP_STYLE,
  onChange,
  open,
  onOpenChange,
}: MapStylePopoverProps) => {
  const { t, i18n } = useTranslation("Map");
  const isRTL = i18n.language !== "en";
  const [internalOpen, setInternalOpen] = useState(false);
  const isMobile = useIsMobile();
  const isOpen = open ?? internalOpen;
  const styles = useMemo(() => Object.values(MAP_TILE_STYLES), []);

  const triggerPosition = isRTL
    ? { left: "calc(1.5rem + 3.5rem + 0.75rem)" }
    : { right: "calc(1.5rem + 3.5rem + 0.75rem)" };

  const handleOpenChange = (next: boolean) => {
    setInternalOpen(next);
    onOpenChange?.(next);
  };

  const Trigger = (
    <Button
      size="icon"
      className="fixed bottom-14 z-[1499] h-12 w-12 rounded-full shadow-lg"
      style={triggerPosition}
      dir={isRTL ? "rtl" : "ltr"}
      aria-label={t("MapAppearance", { defaultValue: "Map appearance" })}
      onClick={() => handleOpenChange(true)}
    >
      <Palette className="h-5 w-5" />
      {value !== DEFAULT_MAP_STYLE && (
        <Badge
          variant="destructive"
          className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full p-0 text-[9px]"
        >
          !
        </Badge>
      )}
    </Button>
  );

  const Content = (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-base font-semibold">
            {t("MapAppearance", { defaultValue: "Map appearance" })}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {t("ChooseMapStyle", {
              defaultValue: "Choose how the basemap should look.",
            })}
          </p>
        </div>
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {styles.map((style) => {
          const isActive = style.id === value;
          return (
            <button
              key={style.id}
              type="button"
              className={cn(
                "rounded-xl border bg-background/90 p-2 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
                isActive
                  ? "border-primary shadow-md"
                  : "border-border/50 hover:border-primary/40"
              )}
              aria-pressed={isActive}
              onClick={() => {
                onChange?.(style.id);
                handleOpenChange(false);
              }}
            >
              <div className="relative mb-2 h-16 w-full overflow-hidden rounded-lg border border-border/40">
                <Image
                  src={style.previewImage}
                  alt={style.label}
                  fill
                  sizes="160px"
                  className="object-cover"
                />
                <div
                  className={cn(
                    "pointer-events-none absolute inset-0 rounded-lg border-2 border-primary opacity-0 transition",
                    isActive && "opacity-100"
                  )}
                />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {style.label}
              </p>
              <p className="text-sm font-semibold">
                {t(`MapStyle.${style.id}`, {
                  defaultValue: style.label,
                })}
              </p>
              <p className="text-xs text-muted-foreground">
                {t(`MapStyle.Description.${style.id}`, {
                  defaultValue: style.description,
                })}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        {Trigger}
        <Sheet open={isOpen} onOpenChange={handleOpenChange}>
          <SheetContent
            side="bottom"
            className="h-[70vh] w-full border-border/60 bg-card/95 text-card-foreground"
          >
            <SheetHeader className="sr-only">
              <SheetTitle>
                {t("MapAppearance", { defaultValue: "Map appearance" })}
              </SheetTitle>
            </SheetHeader>
            {Content}
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>{Trigger}</PopoverTrigger>
      <PopoverContent
        side="top"
        align={isRTL ? "start" : "end"}
        dir={isRTL ? "rtl" : "ltr"}
        className="w-[86vw] max-w-sm border border-border/60 bg-card/95 p-3 text-card-foreground shadow-2xl backdrop-blur z-[2000]"
      >
        {Content}
      </PopoverContent>
    </Popover>
  );
};

export default MapStylePopover;
