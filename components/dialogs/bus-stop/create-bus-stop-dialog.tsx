"use client";

import { FC, useState } from "react";
import { useTranslation } from "@/i18n/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Info,
  Home,
  Sofa,
  Lightbulb,
  Accessibility,
  Radio,
  ToggleLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomDialog } from "@/components/ui/custom-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { LanguageTabs } from "@/components/language-tabs";
import { LanguageFields } from "@/utils/language-handler";
import { MultipleImageUploader } from "@/components/multiple-image-uploader";
import { useCreateBusStop } from "@/hooks/employee-hooks/use-bus-stop";
import {
  CreateBusStopData,
  createBusStopSchema,
} from "@/types/models/bus-stop";
import {
  uploadMultipleImages,
  type UploadedFile,
} from "@/utils/supabase-storage-handler";
import SelectWithPagination from "@/components/select-with-pagination";
import MultipleSelectWithPagination from "@/components/multiple-select-with-pagination";
import { useFetchZones } from "@/hooks/employee-hooks/use-zone";
import { useFetchMapIcons } from "@/hooks/employee-hooks/use-map-icon";
import { useFetchBusLanes } from "@/hooks/employee-hooks/use-bus-lane";
import { useFetchBusRoutes } from "@/hooks/employee-hooks/use-bus-route";
import { ZoneWithRelations } from "@/types/models/zone";
import { MapIconWithRelations } from "@/types/models/map-icon";
import { BusLaneWithRelations } from "@/types/models/bus-lane";
import { BusRouteWithRelations } from "@/types/models/bus-route";
import { cn } from "@/lib/utils";

type SelectedImage = {
  file: File;
  url: string;
  type: string;
  name: string;
  size: number;
};

interface CreateBusStopDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const CreateBusStopDialog: FC<CreateBusStopDialogProps> = ({
  isOpen,
  onOpenChange,
  onSuccess,
}) => {
  const { t, i18n } = useTranslation("BusStops");
  const isRTL = i18n.language !== "en";
  const [activeTab, setActiveTab] = useState<"english" | "arabic" | "kurdish">(
    "english"
  );
  const [images, setImages] = useState<SelectedImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedZone, setSelectedZone] = useState<ZoneWithRelations | null>(
    null
  );
  const [selectedIcon, setSelectedIcon] = useState<MapIconWithRelations | null>(
    null
  );
  const [selectedLanes, setSelectedLanes] = useState<BusLaneWithRelations[]>(
    []
  );
  const [selectedRoutes, setSelectedRoutes] = useState<BusRouteWithRelations[]>(
    []
  );

  const { mutateAsync: createBusStop, isPending: isSubmitting } =
    useCreateBusStop();

  const form = useForm<CreateBusStopData>({
    resolver: zodResolver(createBusStopSchema),
    defaultValues: {
      nameFields: {
        en: "",
        ar: null,
        ckb: null,
      },
      descriptionFields: {
        en: "",
        ar: null,
        ckb: null,
      },
      latitude: 36.1911,
      longitude: 44.0092,
      iconId: null,
      zoneId: null,
      hasShelter: false,
      hasBench: false,
      hasLighting: false,
      isAccessible: false,
      hasRealTimeInfo: false,
      order: undefined,
      isActive: true,
    },
  });

  type BusStopCreateToggleField =
    | "hasShelter"
    | "hasBench"
    | "hasLighting"
    | "isAccessible"
    | "hasRealTimeInfo"
    | "isActive";

  const BOOLEAN_FIELDS: BusStopCreateToggleField[] = [
    "hasShelter",
    "hasBench",
    "hasLighting",
    "isAccessible",
    "hasRealTimeInfo",
    "isActive",
  ];

  const handleSubmit = async (formData: CreateBusStopData) => {
    try {
      if (!formData.nameFields.en.trim()) {
        toast.error(t("Error.NameRequired"));
        return;
      }

      setIsUploading(true);

      let uploadedImages: UploadedFile[] = [];
      if (images.length > 0) {
        uploadedImages = await uploadMultipleImages(
          images.map((img) => img.file),
          "bus-stop-images"
        );
      }

      const payload: CreateBusStopData = {
        ...formData,
        latitude: Number(formData.latitude),
        longitude: Number(formData.longitude),
        order:
          formData.order === undefined || formData.order === null
            ? undefined
            : Number(formData.order),
        images: uploadedImages.map((image) => ({
          url: image.url,
          type: image.type,
          name: image.name,
          size: image.size,
        })),
        iconId: selectedIcon?.id || null,
        zoneId: selectedZone?.id || null,
        laneIds:
          selectedLanes.length > 0
            ? selectedLanes.map((lane) => lane.id)
            : undefined,
        routeIds:
          selectedRoutes.length > 0
            ? selectedRoutes.map((route) => route.id)
            : undefined,
      };

      await createBusStop(payload);

      toast.success(t("Success.Created"));
      onOpenChange(false);
      onSuccess?.();
      resetForm();
    } catch (error) {
      console.error("Error creating bus stop:", error);
      toast.error(t("Error.CreateFailed"));
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    form.reset();
    setImages([]);
    setSelectedZone(null);
    setSelectedIcon(null);
    setSelectedLanes([]);
    setSelectedRoutes([]);
  };

  const handleImageSelect = (files: File[], urls?: string[]) => {
    const newImages = files.map((file, index) => ({
      file,
      url: urls?.[index] ?? URL.createObjectURL(file),
      type: file.type || "",
      name: file.name || "",
      size: file.size || 0,
    }));
    setImages((prev) => [...prev, ...newImages]);
  };

  const handleImageRemove = (index: number) => {
    if (images[index]?.url.startsWith("blob:")) {
      URL.revokeObjectURL(images[index].url);
    }
    setImages(images.filter((_, i) => i !== index));
  };

  return (
    <CustomDialog
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          resetForm();
        }
        onOpenChange(open);
      }}
      title={t("CreateDialog.Title")}
      description={t("CreateDialog.Description")}
      rtl={isRTL}
      icon={Info}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit(handleSubmit)(e);
        }}
        className="space-y-6"
      >
        <LanguageTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          titleFields={form.watch("nameFields") as LanguageFields}
          onTitleChange={(fields: LanguageFields) =>
            form.setValue("nameFields", fields)
          }
          descriptionFields={form.watch("descriptionFields") as LanguageFields}
          onDescriptionChange={(fields: LanguageFields) =>
            form.setValue("descriptionFields", fields)
          }
        />

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("CreateDialog.Latitude")}</Label>
              <Input
                type="number"
                step="0.000001"
                value={form.watch("latitude")}
                onChange={(e) =>
                  form.setValue("latitude", Number(e.target.value))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>{t("CreateDialog.Longitude")}</Label>
              <Input
                type="number"
                step="0.000001"
                value={form.watch("longitude")}
                onChange={(e) =>
                  form.setValue("longitude", Number(e.target.value))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>{t("CreateDialog.ZoneId")}</Label>
              <SelectWithPagination<ZoneWithRelations>
                fetchFunction={useFetchZones}
                onSelect={(item) => {
                  setSelectedZone(item);
                  form.setValue("zoneId", item?.id || null);
                }}
                fields={[
                  {
                    key: "name",
                    label: t("Common.Name"),
                    type: "relation",
                  },
                ]}
                placeholder={t("CreateDialog.ZoneId")}
                value={selectedZone?.id}
                defaultValue={selectedZone || undefined}
                canClear
              />
            </div>
            <div className="space-y-2">
              <Label>{t("CreateDialog.IconId")}</Label>
              <SelectWithPagination<MapIconWithRelations>
                fetchFunction={useFetchMapIcons}
                onSelect={(item) => {
                  setSelectedIcon(item);
                  form.setValue("iconId", item?.id || null);
                }}
                fields={[
                  {
                    key: "name",
                    label: t("Common.Name"),
                    type: "relation",
                  },
                ]}
                placeholder={t("CreateDialog.IconId")}
                value={selectedIcon?.id}
                defaultValue={selectedIcon || undefined}
                canClear
              />
            </div>
            <div className="space-y-2">
              <Label>{t("CreateDialog.Order")}</Label>
              <Input
                type="number"
                min={1}
                value={form.watch("order") ?? ""}
                onChange={(e) =>
                  form.setValue(
                    "order",
                    e.target.value === "" ? undefined : Number(e.target.value)
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label>{t("CreateDialog.LaneIds")}</Label>
              <MultipleSelectWithPagination
                fetchFunction={useFetchBusLanes}
                onSelect={(items: BusLaneWithRelations[]) => {
                  setSelectedLanes(items);
                }}
                fields={[
                  {
                    key: "name",
                    label: t("Common.Name"),
                    type: "relation",
                  },
                ]}
                placeholder={t("CreateDialog.LaneIds")}
                value={selectedLanes.map((lane) => lane.id)}
                initialSelectedItems={selectedLanes}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("CreateDialog.RouteIds")}</Label>
              <MultipleSelectWithPagination
                fetchFunction={useFetchBusRoutes}
                onSelect={(items: BusRouteWithRelations[]) => {
                  setSelectedRoutes(items);
                }}
                fields={[
                  {
                    key: "name",
                    label: t("Common.Name"),
                    type: "relation",
                  },
                  {
                    key: "routeNumber",
                    label: t("Table.Route"),
                    type: "string",
                  },
                ]}
                placeholder={t("CreateDialog.RouteIds")}
                value={selectedRoutes.map((route) => route.id)}
                initialSelectedItems={selectedRoutes}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("CreateDialog.Images")}</Label>
            <MultipleImageUploader
              onImagesSelect={handleImageSelect}
              onImageRemove={handleImageRemove}
              selectedImages={images}
              maxSize={5 * 1024 * 1024}
              label={t("CreateDialog.Images")}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold text-foreground">
              {t("CreateDialog.Amenities")}
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {BOOLEAN_FIELDS.map((key) => {
                const isChecked = Boolean(form.watch(key));
                const icons: Record<string, typeof Home> = {
                  hasShelter: Home,
                  hasBench: Sofa,
                  hasLighting: Lightbulb,
                  isAccessible: Accessibility,
                  hasRealTimeInfo: Radio,
                  isActive: ToggleLeft,
                };
                const Icon = icons[key] || ToggleLeft;

                return (
                  <div
                    key={key.toString()}
                    onClick={() => form.setValue(key, !isChecked)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border-2 p-3 cursor-pointer transition-all duration-200",
                      isChecked
                        ? "bg-emerald-50 border-emerald-300 shadow-md hover:shadow-lg hover:border-emerald-400"
                        : "bg-background border-border hover:border-muted-foreground/50 hover:bg-muted/30"
                    )}
                  >
                    <div
                      className={cn(
                        "p-2 rounded-md transition-colors",
                        isChecked
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <Label className="text-sm font-medium cursor-pointer block">
                        {t(`CreateDialog.${key.toString()}`)}
                      </Label>
                    </div>
                    <Switch
                      checked={isChecked}
                      onCheckedChange={(checked) => form.setValue(key, checked)}
                      dir={isRTL ? "rtl" : "ltr"}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t("Cancel")}
          </Button>
          <Button
            type="submit"
            disabled={
              isSubmitting || isUploading || !form.watch("nameFields").en.trim()
            }
          >
            {isUploading
              ? t("Common.Uploading")
              : isSubmitting
                ? t("Common.Creating")
                : t("Common.Create")}
          </Button>
        </div>
      </form>
    </CustomDialog>
  );
};
