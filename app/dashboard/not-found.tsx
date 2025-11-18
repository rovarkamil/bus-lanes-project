/* eslint-disable-next-line @zohodesk/no-hardcoding/no-hardcoding */
"use client";

import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n/client";
import { FileQuestion } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  const { t } = useTranslation("Dashboard");

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center gap-4 text-center">
      <div className="rounded-full bg-primary/10 p-4">
        <FileQuestion className="h-12 w-12 text-primary" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight text-primary">
        {t("NotFound.Title", "Page Not Found")}
      </h2>
      <p className="text-muted-foreground max-w-[400px]">
        {t(
          "NotFound.Description",
          "The page you're looking for doesn't exist or has been moved."
        )}
      </p>
      <Button asChild variant="default" className="mt-4">
        <Link href="/dashboard">
          {t("NotFound.BackToDashboard", "Back to Dashboard")}
        </Link>
      </Button>
    </div>
  );
}


