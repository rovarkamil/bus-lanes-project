"use client";

import { useState } from "react";
import { Column } from "@/types/data-table";
import { MapIconWithRelations } from "@/types/models/map-icon";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Move, ToggleLeft } from "lucide-react";
import { ImagePreviewer } from "@/components/show-image-previewer";

const IconPreview = ({
  url,
  name,
  t,
}: {
  url?: string;
  name?: string;
  t: (key: string) => string;
}) => {
  const [open, setOpen] = useState(false);

  if (!url) {
    return (
      <span className="text-sm text-muted-foreground">{t("NoPreview")}</span>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-left transition hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-md"
      >
        <div className="relative h-10 w-10 rounded-md border border-border bg-muted/40 overflow-hidden">
          <Image
            src={url}
            alt={name ?? ""}
            fill
            className="object-contain p-1"
          />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium">{name ?? t("CustomIcon")}</span>
          <span className="text-xs text-muted-foreground">
            {t("ClickToPreview")}
          </span>
        </div>
      </button>
      <ImagePreviewer
        isOpen={open}
        onClose={() => setOpen(false)}
        images={[{ url, alt: name ?? t("MapIconPreview") }]}
      />
    </>
  );
};

const AnchorCell = ({
  label,
  valueX,
  valueY,
}: {
  label: string;
  valueX?: number | null;
  valueY?: number | null;
}) => (
  <Badge
    variant="outline"
    className="font-medium bg-muted text-foreground border-border"
  >
    {label}: {valueX ?? 0}, {valueY ?? 0}
  </Badge>
);

const StatusBadge = ({
  isActive,
  t,
}: {
  isActive: boolean;
  t: (key: string) => string;
}) => (
  <Badge
    variant="outline"
    className={cn(
      "border font-medium",
      isActive
        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
        : "bg-rose-50 text-rose-700 border-rose-200"
    )}
  >
    <ToggleLeft className="w-3 h-3 mr-1" />
    {isActive ? t("Common.Active") : t("Common.Inactive")}
  </Badge>
);

const UsageCell = ({
  services,
  stops,
  t,
}: {
  services?: { id: string }[];
  stops?: { id: string }[];
  t: (key: string) => string;
}) => (
  <div className="flex flex-col gap-1">
    <Badge variant="secondary">
      {t("Services")}: {services?.length ?? 0}
    </Badge>
    <Badge variant="secondary">
      {t("Stops")}: {stops?.length ?? 0}
    </Badge>
  </div>
);

export const mapIconColumns: (
  t: (key: string) => string
) => Column<MapIconWithRelations>[] = (t) => [
  {
    key: "preview",
    label: t("Preview"),
    sortable: false,
    render: (icon) => (
      <IconPreview
        url={icon.file?.url}
        name={icon.name?.en ?? icon.file?.name ?? ""}
        t={t}
      />
    ),
  },
  {
    key: "name",
    label: t("Name"),
    sortable: true,
    render: (icon) => (
      <div className="flex flex-col">
        <span className="text-sm font-medium">{icon.name?.en ?? "-"}</span>
        {icon.description?.en && (
          <span className="text-xs text-muted-foreground line-clamp-2">
            {icon.description.en}
          </span>
        )}
      </div>
    ),
  },
  {
    key: "iconSize",
    label: t("Size"),
    sortable: true,
    render: (icon) => (
      <Badge
        variant="outline"
        className="bg-blue-50 text-blue-700 border-blue-200"
      >
        <Move className="w-3 h-3 mr-1" />
        {icon.iconSize ?? 32}px
      </Badge>
    ),
  },
  {
    key: "anchors",
    label: t("Anchors"),
    sortable: false,
    render: (icon) => (
      <div className="flex flex-wrap gap-2">
        <AnchorCell
          label={t("IconAnchorLabel")}
          valueX={icon.iconAnchorX}
          valueY={icon.iconAnchorY}
        />
        <AnchorCell
          label={t("PopupAnchorLabel")}
          valueX={icon.popupAnchorX}
          valueY={icon.popupAnchorY}
        />
      </div>
    ),
  },
  {
    key: "usage",
    label: t("Usage"),
    sortable: false,
    render: (icon) => (
      <UsageCell
        services={icon.transportServices}
        stops={icon.busStops}
        t={t}
      />
    ),
  },
  {
    key: "status",
    label: t("Status"),
    sortable: true,
    render: (icon) => <StatusBadge isActive={icon.isActive ?? false} t={t} />,
  },
];
