import ReactDOMServer from "react-dom/server";
import ReceiptPrint from "@/components/receipt-print";
import { getSetting } from "@/lib/settings";

interface PrintOrderItem {
  itemId: string;
  name: string;
  quantity: number;
  sellPriceAtOrder: number;
  buyPriceAtOrder: number;
  isBundle: boolean;
  itemsInBundle?: number;
}

interface PrintOrderOptions {
  orderItems: PrintOrderItem[];
  orderNumber: string;
  amountReceived: number;
  change: number;
  cashierName: string;
  isRefund?: boolean;
}

export const printOrder = ({
  orderItems,
  orderNumber,
  amountReceived,
  change,
  cashierName,
  isRefund = false,
}: PrintOrderOptions) => {
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
      <ReceiptPrint
        order={orderItems}
        customOrderId={orderNumber}
        amountReceived={amountReceived}
        change={change}
        cashierName={cashierName}
        isRefund={isRefund}
        marketName={getSetting("MARKET_NAME")}
        marketAddress={getSetting("MARKET_ADDRESS")}
        marketPhone={getSetting("MARKET_PHONE")}
        developerMessage={getSetting("DEVELOPER_MESSAGE")}
      />
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
};

export const printA4Document = <T,>(
  Component: React.ComponentType<T>,
  props: T & JSX.IntrinsicAttributes
) => {
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
            @page { size: A4; margin: 0; }
          }
        `}
      </style>
      <Component {...props} />
    </div>
  );

  iframeDocument.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Print A4 Document</title>
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
};
