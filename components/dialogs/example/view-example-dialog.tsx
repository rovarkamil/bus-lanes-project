/* eslint-disable @next/next/no-img-element */
// This is an example of how to create a view dialog for a model.
// It is not a complete view dialog and should be used as a reference to create a new view dialog.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

"use client";

import { FC, useState } from "react";
import { useTranslation } from "@/i18n/client";
import { GalleryWithRelations } from "@/types/models/gallery";
import { CustomDialog } from "@/components/ui/custom-dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImagePreviewer } from "@/components/show-image-previewer";
import {
  Info,
  CheckCircle2,
  XCircle,
  FileText,
  Image as ImageIcon,
  Grid,
  Languages,
  LayoutGrid,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Separator } from "@/components/ui/separator";

interface ViewGalleryDetailsDialogProps {
  data: GalleryWithRelations;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ViewGalleryDetailsDialog: FC<ViewGalleryDetailsDialogProps> = ({
  data,
  isOpen,
  onOpenChange,
}) => {
  const { t, i18n } = useTranslation("Gallery");
  const isRTL = i18n.language !== "en";
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("details");
  const [activeLanguage, setActiveLanguage] = useState<string>("en");

  const MotionTabsContent = motion(TabsContent);

  if (!data) return null;

  return (
    <CustomDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={t("ViewDialog.Title")}
      description={t("ViewDialog.Description")}
      rtl={isRTL}
      icon={Info}
      maxWidth="3xl"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Badge
            variant={data.isActive ? "success" : "destructive"}
            className="px-3 py-1 text-sm font-medium flex items-center gap-1.5"
          >
            {data.isActive ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                {t("Common.Active")}
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4" />
                {t("Common.Inactive")}
              </>
            )}
          </Badge>

          <Badge
            variant="outline"
            className="bg-amber-50 text-amber-700 border-amber-200 px-3 py-1 text-sm font-medium flex items-center gap-1.5"
          >
            <Grid className="h-4 w-4" />
            {t(`HaircutStyleCategory.${data.category}`)}
          </Badge>
        </div>

        <Tabs
          defaultValue="details"
          className="w-full"
          value={activeTab}
          onValueChange={setActiveTab}
          dir={isRTL ? "rtl" : "ltr"}
        >
          <TabsList className="w-full grid grid-cols-2 h-12">
            <TabsTrigger
              value="details"
              className="flex items-center gap-2 data-[state=active]:bg-primary/10"
            >
              <Languages className="h-4 w-4" />
              {t("Common.Title")}
            </TabsTrigger>
            <TabsTrigger
              value="media"
              className="flex items-center gap-2 data-[state=active]:bg-primary/10"
            >
              <LayoutGrid className="h-4 w-4" />
              {t("Common.Images")}
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <MotionTabsContent
              value="details"
              className="space-y-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="overflow-hidden border border-border/50 shadow-sm">
                <div className="bg-muted/50 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <h3 className="font-medium">{t("Common.Title")}</h3>
                  </div>

                  <Tabs
                    defaultValue="en"
                    value={activeLanguage}
                    onValueChange={setActiveLanguage}
                    className="w-auto"
                  >
                    <TabsList className="grid grid-cols-3 h-8 w-auto">
                      <TabsTrigger value="en" className="px-3 text-xs">
                        English
                      </TabsTrigger>
                      <TabsTrigger value="ar" className="px-3 text-xs">
                        العربية
                      </TabsTrigger>
                      <TabsTrigger value="ckb" className="px-3 text-xs">
                        کوردی
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                <CardContent className="p-4">
                  {activeLanguage === "en" && (
                    <div className="rounded-md p-4 bg-muted/30" dir="ltr">
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">
                        {t("Common.Title")}
                      </h4>
                      <p className="font-medium text-lg">
                        {data.title?.en || t("Common.NotAvailable")}
                      </p>

                      <Separator className="my-3" />

                      <h4 className="text-sm font-medium text-muted-foreground mb-1">
                        {t("Common.Description")}
                      </h4>
                      <p className="text-muted-foreground">
                        {data.description?.en || t("Common.NotAvailable")}
                      </p>
                    </div>
                  )}

                  {activeLanguage === "ar" && (
                    <div className="rounded-md p-4 bg-muted/30" dir="rtl">
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">
                        {t("Common.Title")}
                      </h4>
                      <p className="font-medium text-lg">
                        {data.title?.ar || t("Common.NotAvailable")}
                      </p>

                      <Separator className="my-3" />

                      <h4 className="text-sm font-medium text-muted-foreground mb-1">
                        {t("Common.Description")}
                      </h4>
                      <p className="text-muted-foreground">
                        {data.description?.ar || t("Common.NotAvailable")}
                      </p>
                    </div>
                  )}

                  {activeLanguage === "ckb" && (
                    <div className="rounded-md p-4 bg-muted/30" dir="rtl">
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">
                        {t("Common.Title")}
                      </h4>
                      <p className="font-medium text-lg">
                        {data.title?.ckb || t("Common.NotAvailable")}
                      </p>

                      <Separator className="my-3" />

                      <h4 className="text-sm font-medium text-muted-foreground mb-1">
                        {t("Common.Description")}
                      </h4>
                      <p className="text-muted-foreground">
                        {data.description?.ckb || t("Common.NotAvailable")}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </MotionTabsContent>

            <MotionTabsContent
              value="media"
              className="space-y-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="overflow-hidden border border-border/50 shadow-sm">
                <div className="bg-muted/50 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 text-primary" />
                    <h3 className="font-medium">{t("Common.Images")}</h3>
                  </div>

                  {data.images && data.images.length > 0 && (
                    <Badge className="bg-primary/10 text-primary border-primary/20 px-3 py-1">
                      {data.images.length}{" "}
                      {data.images.length === 1
                        ? t("Common.Image")
                        : t("Common.Images")}
                    </Badge>
                  )}
                </div>

                <CardContent className="p-4">
                  {data.images && data.images.length > 0 ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {data.images.map((image, index) => (
                          <div
                            key={image.id || index}
                            className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group border border-border/40 shadow-sm"
                            onClick={() => {
                              setSelectedImageUrl(image.url);
                              setIsImagePreviewOpen(true);
                            }}
                          >
                            <img
                              src={image.url}
                              alt={`${data.title?.en || "Gallery image"} ${index + 1}`}
                              className={cn(
                                "w-full h-full object-cover transition-all duration-300",
                                "group-hover:scale-110"
                              )}
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <div className="flex flex-col items-center gap-1.5">
                                <ImageIcon className="h-6 w-6 text-white" />
                                <p className="text-white text-sm font-medium">
                                  {t("Common.ClickToView")}
                                </p>
                              </div>
                            </div>
                            <div className="absolute top-2 right-2 z-10">
                              <Badge className="bg-black/50 text-white border-none px-2 py-1 text-xs">
                                {index + 1}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (data.images && data.images.length > 0) {
                              setSelectedImageUrl(data.images[0].url);
                              setIsImagePreviewOpen(true);
                            }
                          }}
                          className="gap-2"
                        >
                          <ImageIcon className="h-4 w-4" />
                          {t("Common.ViewAllImages")}
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 p-8 bg-muted/30 rounded-lg">
                      <ImageIcon className="h-12 w-12 text-muted-foreground/60" />
                      <p className="text-muted-foreground">
                        {t("Common.NoImages")}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </MotionTabsContent>
          </div>
        </Tabs>
      </div>

      {isImagePreviewOpen && selectedImageUrl && (
        <ImagePreviewer
          isOpen={isImagePreviewOpen}
          onClose={() => {
            setIsImagePreviewOpen(false);
            setSelectedImageUrl(null);
          }}
          images={[
            {
              url: selectedImageUrl,
              alt: "Gallery image",
            },
          ]}
        />
      )}
    </CustomDialog>
  );
};
