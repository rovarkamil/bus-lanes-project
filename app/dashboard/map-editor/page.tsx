"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import { Permission } from "@prisma/client";
import { useMapEditorData } from "@/hooks/employee-hooks/use-map";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, ShieldAlert } from "lucide-react";
import { hasPermission } from "@/lib/utils";
import { useTranslation } from "@/i18n/client";

const MapEditorPage = () => {
  const { t, i18n } = useTranslation("Map");
  const isRTL = i18n.language !== "en";
  const { data: session } = useSession();
  const canEdit = hasPermission(session, Permission.EDIT_MAP);
  const { data, isPending, error, refetch } = useMapEditorData({
    enabled: canEdit,
  });

  const payload = data?.data;

  const MapEditorClient = useMemo(
    () =>
      dynamic(() => import("@/components/map/map-editor"), {
        ssr: false,
        loading: () => (
          <div
            className="flex h-[480px] items-center justify-center gap-3 text-muted-foreground"
            dir={isRTL ? "rtl" : "ltr"}
          >
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>{t("LoadingMapData")}</span>
          </div>
        ),
      }),
    [isRTL, t]
  );

  const editorContent = useMemo(() => {
    if (!canEdit) {
      return (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="flex flex-col items-center gap-3 p-10 text-destructive">
            <ShieldAlert className="h-10 w-10" />
            <p className="text-lg font-semibold">
              {t("YouDontHavePermissionToEditTheMap")}
            </p>
            <p className="text-sm text-destructive/80">
              {t("AskAnAdministratorToGrantYouTheEditMapPermission")}
            </p>
          </CardContent>
        </Card>
      );
    }

    if (error) {
      return (
        <Card
          className="border-destructive/50 bg-destructive/5"
          dir={isRTL ? "rtl" : "ltr"}
        >
          <CardContent className="flex flex-col items-center gap-3 p-10 text-destructive">
            <p className="text-lg font-semibold">{t("FailedToLoadMapData")}</p>
            <p className="text-sm text-destructive/80">
              {error.message ?? t("PleaseTryAgainInAMoment")}
            </p>
            <Button
              type="button"
              variant="outline"
              className="border-destructive text-destructive hover:bg-destructive/10"
              onClick={() => refetch()}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {t("Retry")}
            </Button>
          </CardContent>
        </Card>
      );
    }

    if (isPending && !payload) {
      return (
        <div
          className="flex h-[480px] items-center justify-center gap-3 text-muted-foreground"
          dir={isRTL ? "rtl" : "ltr"}
        >
          <Loader2 className="h-5 w-5 animate-spin" />
          <span dir={isRTL ? "rtl" : "ltr"}>{t("LoadingMapData")}</span>
        </div>
      );
    }

    return (
      <MapEditorClient
        data={payload}
        onSave={(submission) => {
          console.log("Map editor submission", submission);
        }}
      />
    );
  }, [MapEditorClient, canEdit, error, isPending, isRTL, payload, refetch, t]);

  return (
    <main className="space-y-6 px-4 py-8 md:px-8" dir={isRTL ? "rtl" : "ltr"}>
      <PageHeader
        title={t("MapEditor")}
        description={t(
          "DrawUpdateAndPublishBusLanesAndDraftStopsChangesSyncWithThePublicMapAfterApproval"
        )}
      />
      {editorContent}
    </main>
  );
};

export default MapEditorPage;
