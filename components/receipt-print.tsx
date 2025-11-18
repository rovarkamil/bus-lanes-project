"use client";
import React from "react";

interface OrderItem {
  itemId: string;
  name: string;
  quantity: number;
  sellPriceAtOrder: number;
  isBundle: boolean;
  itemsInBundle?: number;
}

interface ReceiptProps {
  order: OrderItem[];
  customOrderId: string;
  amountReceived: number;
  change: number;
  cashierName: string;
  isRefund?: boolean;
  marketName: string;
  marketAddress: string;
  marketPhone: string;
  developerMessage: string;
}

const ReceiptPrint: React.FC<ReceiptProps> = ({
  order,
  customOrderId,
  amountReceived,
  change,
  cashierName,
  isRefund = false,
  marketName,
  marketAddress,
  marketPhone,
  developerMessage,
}) => {
  // Aggregate identical items
  const aggregatedOrder = order.reduce<OrderItem[]>((acc, item) => {
    const existingItem = acc.find(
      (i) => i.itemId === item.itemId && i.isBundle === item.isBundle
    );
    if (existingItem) {
      existingItem.quantity += item.quantity;
      existingItem.itemsInBundle = item.itemsInBundle;
    } else {
      acc.push({
        ...item,
        itemsInBundle: item.itemsInBundle,
      });
    }
    return acc;
  }, []);

  const total = aggregatedOrder.reduce((sum, item) => {
    const effectiveQuantity =
      item.isBundle && item.itemsInBundle
        ? item.quantity / item.itemsInBundle
        : item.quantity;
    return sum + effectiveQuantity * item.sellPriceAtOrder;
  }, 0);

  return (
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
        <h2 style={{ margin: "4px 0", fontSize: "16px" }}>{marketName}</h2>
        {isRefund && (
          <div style={{ color: "red", fontSize: "14px", marginBottom: "4px" }}>
            *** مرتجع ***
          </div>
        )}
        <div>رقم الوصل: {customOrderId}</div>
        <div>اسم الكاشير: {cashierName}</div>
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
      </div>
      <div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "4fr 1fr 1.5fr 1.5fr",
            borderBottom: "1px dotted #000",
            paddingBottom: "4px",
            marginBottom: "4px",
          }}
        >
          <span>اسم المادة</span>
          <span>عدد</span>
          <span>سعر</span>
          <span>المجموع</span>
        </div>
        {aggregatedOrder.map((item, index) => (
          <div
            key={index}
            style={{
              display: "grid",
              gridTemplateColumns: "4fr 1fr 1.5fr 1.5fr",
              marginBottom: "4px",
              gap: "8px",
            }}
          >
            <span>
              {item.name} {item.isBundle ? "(کارتون)" : ""}
            </span>
            <span>
              {item.isBundle && item.itemsInBundle
                ? `${item.quantity / item.itemsInBundle} (${item.quantity})`
                : item.quantity}
            </span>
            <span>{item.sellPriceAtOrder.toLocaleString()}</span>
            <span>
              {(
                (item.isBundle && item.itemsInBundle
                  ? item.quantity / item.itemsInBundle
                  : item.quantity) * item.sellPriceAtOrder
              ).toLocaleString()}
            </span>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: "16px",
          borderTop: "1px solid #000",
          paddingTop: "8px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>{isRefund ? "مبلغ المرتجع:" : "المبلغ الإجمالي:"}</div>
          <div>{total.toLocaleString()}</div>
        </div>
        {!isRefund && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>المبلغ المستلم:</div>
              <div>{amountReceived.toLocaleString()}</div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>الباقي:</div>
              <div>
                {change > 0
                  ? change.toLocaleString()
                  : (amountReceived - total).toLocaleString()}
              </div>
            </div>
          </>
        )}
      </div>
      <div
        style={{
          marginTop: "16px",
          fontSize: "10px",
          textAlign: "center",
        }}
      >
        <div>{marketAddress}</div>
        <div style={{ direction: "ltr" }}>{marketPhone}</div>
        <div style={{ direction: "ltr", opacity: 0.5 }}>{developerMessage}</div>
      </div>
    </div>
  );
};

export default ReceiptPrint;
