import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { DollarSign } from "lucide-react";
import ReactDOMServer from "react-dom/server";
import { useSession } from "next-auth/react";
import { useTranslation } from "@/i18n/client";

export const OpenCashBox = () => {
  const { data: session } = useSession();
  const { t } = useTranslation("Common");

  const openCashBox = useCallback(() => {
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    document.body.appendChild(iframe);

    const iframeDocument =
      iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDocument) return;

    const receiptHtml = ReactDOMServer.renderToString(
      <div>
        <style>
          {`
            @media print {
              body { margin: 0; padding: 0; }
              @page { size: 72mm auto; margin: 0; }
            }
          `}
        </style>
        <div
          style={{
            fontFamily: "monospace",
            width: "72mm",
            padding: "8px",
            margin: "0 auto",
            fontSize: "12px",
            lineHeight: "1.2",
            direction: "rtl",
            fontWeight: "bold",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "8px" }}>
            <div style={{ direction: "ltr" }}>
              {new Date().toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: true,
              })}
            </div>
            {session?.user?.name}
          </div>
        </div>
      </div>
    );

    iframeDocument.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Receipt</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body>${receiptHtml}</body>
      </html>
    `);
    iframeDocument.close();

    setTimeout(() => {
      if (iframe.contentWindow) {
        iframe.contentWindow.print();
      }
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 500);
  }, [session?.user?.name]);

  return (
    <Button
      variant="outline"
      onClick={openCashBox}
      className="flex items-center gap-2 whitespace-nowrap"
    >
      <DollarSign className="h-4 w-4" />
      {t("OpenCashBox")}
    </Button>
  );
};
