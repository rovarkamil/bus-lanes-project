import React from "react";
import Image from "next/image";
import { getSetting } from "@/lib/settings";

export interface BaseReceiptItem {
  id?: string;
  barcode?: string;
  name: string;
  unit?: string;
  quantity: number;
  price: number;
  total: number;
  note?: string;
}

export interface BaseReceiptProps {
  title: string;
  items: BaseReceiptItem[];
  info: {
    label: string;
    value: string | number;
  }[][];
  summary?: {
    itemCount: number;
    totalQuantity: number;
  };
  totals: {
    label: string;
    value: string | number;
    type?: "normal" | "discount" | "final";
  }[];
  paymentStatus?: {
    label: string;
    value: string;
    isPaid: boolean;
  };
  showSignature?: boolean;
  currency?: string;
  usdPrice?: number;
}

const BaseReceiptPrint: React.FC<BaseReceiptProps> = ({
  title,
  items,
  info,
  summary,
  totals,
  paymentStatus,
  showSignature,
  currency = "د.ع",
  usdPrice,
}) => {
  const logoUrl = getSetting("LOGO_URL") || "/images/logos/kubak-market.svg";
  const marketName = getSetting("MARKET_NAME");
  const marketAddress = getSetting("MARKET_ADDRESS");
  const marketPhone = getSetting("MARKET_PHONE");
  const developerMessage = getSetting("DEVELOPER_MESSAGE");

  const formatNumber = (num: number) => num.toLocaleString("en-US");

  const formatPrice = (num: number) => {
    if (currency === "$" && usdPrice) {
      return (num / usdPrice).toLocaleString("en-US");
    }
    return num.toLocaleString("en-US");
  };

  const ITEMS_PER_PAGE = 10;
  const LAST_PAGE_ITEMS = 5;

  const regularItemsCount = Math.max(0, items.length - LAST_PAGE_ITEMS * 2);
  const regularPages = Math.ceil(regularItemsCount / ITEMS_PER_PAGE);
  const totalPages =
    items.length <= LAST_PAGE_ITEMS
      ? 1
      : items.length <= LAST_PAGE_ITEMS * 2
        ? 2
        : regularPages + 2;

  const getPageItems = (pageIndex: number) => {
    // For very small item counts
    if (items.length <= LAST_PAGE_ITEMS) {
      return items;
    }

    // For item counts that fit in just two pages
    if (items.length <= LAST_PAGE_ITEMS * 2) {
      if (pageIndex === 0) {
        return items.slice(0, LAST_PAGE_ITEMS);
      }
      return items.slice(LAST_PAGE_ITEMS);
    }

    // Normal case with regular pages plus two special pages
    if (pageIndex === totalPages - 1) {
      // Last page
      return items.slice(items.length - LAST_PAGE_ITEMS);
    }
    if (pageIndex === totalPages - 2) {
      // Second to last page
      return items.slice(
        items.length - LAST_PAGE_ITEMS * 2,
        items.length - LAST_PAGE_ITEMS
      );
    }

    // Regular pages
    const startIndex = pageIndex * ITEMS_PER_PAGE;
    const maxRegularIndex = items.length - LAST_PAGE_ITEMS * 2;
    return items.slice(
      startIndex,
      Math.min(startIndex + ITEMS_PER_PAGE, maxRegularIndex)
    );
  };

  const pages = Array.from({ length: totalPages }, (_, pageIndex) => {
    const pageItems = getPageItems(pageIndex);

    return (
      <div key={pageIndex} style={styles.page}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerContent}>
            <div style={styles.logoContainer}>
              <Image
                src={logoUrl}
                alt={`${marketName} Logo`}
                width={100}
                height={100}
                priority
                style={styles.logo}
              />
            </div>
            <div style={styles.companyInfo}>
              <h1 style={styles.companyName}>{marketName}</h1>
              <div style={styles.companyDetails}>
                <div>{marketAddress}</div>
                <div style={{ direction: "ltr" }}>{marketPhone}</div>
              </div>
            </div>
          </div>
        </div>

        <div style={styles.titleWrapper}>
          <div style={styles.titleLine}></div>
          <div style={styles.documentTitle}>{title}</div>
          <div style={styles.titleLine}></div>
        </div>

        {/* Info Grid */}
        <div style={styles.infoGrid}>
          {info.map((row, rowIndex) => (
            <div key={rowIndex} style={styles.infoRow}>
              {row.map((item, itemIndex) => (
                <div key={itemIndex} style={styles.infoItem}>
                  <span style={styles.label}>{item.label}</span>
                  <span style={styles.value}>{item.value}</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Items Table */}
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>#</th>
              <th style={styles.th}>الباركود</th>
              <th style={{ ...styles.th, textAlign: "right" }}>اسم المادة</th>
              <th style={styles.th}>الوحدة</th>
              <th style={styles.th}>الكمية</th>
              <th style={styles.th}>السعر</th>
              <th style={styles.th}>السعر الاجمالي</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((item, index) => (
              <tr
                key={index}
                style={{
                  ...styles.tableRow,
                  backgroundColor: index % 2 === 1 ? "#f8f9fa" : "transparent",
                }}
              >
                <td style={styles.td}>{index + 1}</td>
                <td style={styles.td}>{item.barcode}</td>
                <td style={{ ...styles.td, textAlign: "right" }}>
                  {item.name}
                </td>
                <td style={styles.td}>{item.unit}</td>
                <td style={styles.td}>{formatNumber(item.quantity)}</td>
                <td style={styles.td}>{formatPrice(item.price)}</td>
                <td style={styles.td}>{formatPrice(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Page number indicator */}
        <div style={styles.pageNumber}>
          صفحة {pageIndex + 1} من {totalPages}
        </div>

        {/* Only show totals and signature on last page */}
        {pageIndex === totalPages - 1 && (
          <>
            <div style={styles.totalsContainer}>
              {summary && (
                <div style={styles.summaryBox}>
                  <div style={styles.summaryTitle}>ملخص الفاتورة</div>
                  <div style={styles.summaryContent}>
                    <div style={styles.summaryRow}>
                      <span>عدد الاقلام:</span>
                      <span>{formatNumber(summary.itemCount)}</span>
                    </div>
                    <div style={styles.summaryRow}>
                      <span>مجموع الكمية:</span>
                      <span>{formatNumber(summary.totalQuantity)}</span>
                    </div>
                  </div>
                </div>
              )}

              <div style={styles.totalBox}>
                {totals.map((total, index) => {
                  const style =
                    total.type === "discount"
                      ? styles.discountAmount
                      : total.type === "final"
                        ? styles.finalTotal
                        : styles.totalRow;

                  return (
                    <div key={index} style={style}>
                      <span>{total.label}</span>
                      <span
                        style={
                          total.type === "discount" ? style : styles.amount
                        }
                      >
                        {typeof total.value === "number"
                          ? `${formatPrice(total.value as number)} ${currency}`
                          : total.value}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {paymentStatus && (
              <div style={styles.paymentStatus}>
                <div style={styles.paymentRow}>
                  <span>{paymentStatus.label}</span>
                  <span
                    style={
                      paymentStatus.isPaid
                        ? styles.paidAmount
                        : styles.remainingAmount
                    }
                  >
                    {paymentStatus.value}
                  </span>
                </div>
              </div>
            )}

            {showSignature && (
              <div style={styles.signatureSection}>
                <div style={styles.signatureBox}>
                  <div style={styles.signatureLabel}>اسم المستلم:</div>
                  <div style={styles.signatureLine}></div>
                </div>
                <div style={styles.signatureBox}>
                  <div style={styles.signatureLabel}>التوقیع:</div>
                  <div style={styles.signatureLine}></div>
                </div>
              </div>
            )}
            {developerMessage && (
              <div
                style={{
                  ...styles.pageNumber,
                  opacity: 0.5,
                  direction: "ltr",
                  textAlign: "center",
                  marginTop: "5px",
                }}
              >
                {developerMessage}
              </div>
            )}
          </>
        )}
      </div>
    );
  });

  return <>{pages}</>;
};

const styles = {
  page: {
    width: "210mm",
    minHeight: "297mm",
    padding: "15mm",
    margin: "0 auto",
    direction: "rtl" as const,
    backgroundColor: "#FFFFFF",
    fontFamily: "'Segoe UI', Arial, sans-serif",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    pageBreakAfter: "always" as const,
  },
  header: {
    marginBottom: "25px",
    borderBottom: "none",
    paddingBottom: "15px",
    background: "linear-gradient(135deg, #f6f9fc 0%, #ffffff 100%)",
    borderRadius: "12px",
  },
  headerContent: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px",
  },
  logoContainer: {
    padding: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "auto",
    height: "auto",
    background: "white",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  },
  companyInfo: {
    textAlign: "right" as const,
    flex: 1,
    marginRight: "20px",
  },
  companyName: {
    margin: "0",
    fontSize: "36px",
    color: "#1a365d",
    fontWeight: "800",
    letterSpacing: "-0.5px",
  },
  companyDetails: {
    marginTop: "8px",
    color: "#4a5568",
    fontSize: "14px",
    lineHeight: "1.6",
  },
  documentTitle: {
    fontSize: "28px",
    color: "#1a365d",
    fontWeight: "700",
    padding: "0 25px",
    position: "relative" as const,
  },
  infoGrid: {
    backgroundColor: "#f8fafc",
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "25px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
    border: "1px solid #e2e8f0",
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "12px",
    padding: "8px 0",
  },
  infoItem: {
    flex: "1",
    padding: "0 15px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    color: "#64748b",
    marginLeft: "8px",
    fontSize: "14px",
    fontWeight: "500",
  },
  value: {
    color: "#1a365d",
    fontWeight: "600",
  },
  table: {
    width: "100%",
    borderCollapse: "separate" as const,
    borderSpacing: "0",
    marginBottom: "25px",
    fontSize: "14px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
    borderRadius: "12px",
    overflow: "hidden",
  },
  tableRow: {
    transition: "background-color 0.2s ease",
  },
  th: {
    backgroundColor: "#1a365d",
    color: "#ffffff",
    border: "none",
    padding: "14px 12px",
    fontWeight: "600",
    position: "relative" as const,
    fontSize: "13px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
  },
  td: {
    border: "1px solid #e2e8f0",
    borderLeft: "none",
    borderRight: "none",
    padding: "12px",
    color: "#1a365d",
    transition: "background-color 0.2s ease",
  },
  totalsContainer: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "30px",
    gap: "25px",
  },
  summaryBox: {
    flex: "1",
    backgroundColor: "#f8fafc",
    borderRadius: "12px",
    padding: "20px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
    border: "1px solid #e2e8f0",
  },
  summaryTitle: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#1a365d",
    marginBottom: "15px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
  },
  summaryContent: {
    fontSize: "14px",
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "10px",
    color: "#4a5568",
    padding: "8px 0",
    borderBottom: "1px dashed #e2e8f0",
  },
  totalBox: {
    flex: "1",
    backgroundColor: "#f8fafc",
    borderRadius: "12px",
    padding: "20px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
    border: "1px solid #e2e8f0",
  },
  totalRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "12px",
    fontSize: "14px",
    padding: "8px 0",
    borderBottom: "1px dashed #e2e8f0",
  },
  amount: {
    fontWeight: "600",
    color: "#1a365d",
  },
  discountAmount: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "12px",
    fontSize: "14px",
    color: "#e53e3e",
    padding: "8px 0",
    borderBottom: "1px dashed #e2e8f0",
  },
  finalTotal: {
    display: "flex",
    justifyContent: "space-between",
    borderTop: "2px solid #1a365d",
    marginTop: "15px",
    paddingTop: "15px",
    fontSize: "18px",
    fontWeight: "700",
    color: "#1a365d",
    backgroundColor: "#fff",
    padding: "15px",
    borderRadius: "8px",
  },
  paymentStatus: {
    marginTop: "25px",
    backgroundColor: "#f8fafc",
    borderRadius: "12px",
    padding: "20px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
    border: "1px solid #e2e8f0",
  },
  paymentRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "8px",
    fontSize: "14px",
    padding: "12px",
    backgroundColor: "#fff",
    borderRadius: "8px",
  },
  paidAmount: {
    color: "#38a169",
    fontWeight: "600",
    fontSize: "16px",
  },
  remainingAmount: {
    color: "#e53e3e",
    fontWeight: "600",
    fontSize: "16px",
  },
  logo: {
    borderRadius: "12px",
    padding: "8px",
    backgroundColor: "white",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    objectFit: "contain" as const,
    width: "auto",
    height: "auto",
    maxWidth: "100px",
    maxHeight: "100px",
  },
  titleWrapper: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "30px 0",
    gap: "15px",
  },
  titleLine: {
    height: "2px",
    flex: "1",
    background: "linear-gradient(to right, #e2e8f0, #1a365d, #e2e8f0)",
  },
  pageNumber: {
    textAlign: "center" as const,
    marginBottom: "15px",
    fontSize: "12px",
    color: "#64748b",
    fontWeight: "500",
    letterSpacing: "0.5px",
  },
  signatureSection: {
    marginTop: "50px",
    display: "flex",
    justifyContent: "space-between",
    padding: "0 50px",
    gap: "100px",
  },
  signatureBox: {
    flex: 1,
  },
  signatureLabel: {
    fontSize: "14px",
    color: "#1a365d",
    marginBottom: "10px",
    fontWeight: "600",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
  },
  signatureLine: {
    borderBottom: "2px solid #1a365d",
    height: "40px",
  },
};

export default BaseReceiptPrint;
