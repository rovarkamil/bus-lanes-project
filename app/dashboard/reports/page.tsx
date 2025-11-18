"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslation } from "@/i18n/client";
import { Permission } from "@prisma/client";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { cn, hasPermission } from "@/lib/utils";
import { Loader2, Download } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pagination } from "@/components/pagination";
import { DisplayLimit } from "@/components/data-table/display-limit";

type MostSoldItem = {
  id: string;
  name: string;
  barcode: string;
  quantity: string;
  bundleQuantity: number;
  singleQuantity: number;
  totalAmount: number;
};

type DailyOrder = {
  id: string;
  createdAt: Date;
  totalAmount: number;
  cashierName: string;
  profit: number;
  loss: number;
};

type RevenueReport = {
  totalOrders: number;
  totalRevenue: number;
  totalProfit: number;
  totalLoss: number;
  orders: DailyOrder[];
};

type SupplierSalesReport = {
  id: string;
  name: string;
  totalRevenue: number;
  totalQuantity: number;
  totalProfit: number;
  totalLoss: number;
  itemsSold: number;
}[];

type CashierReport = {
  id: string;
  name: string;
  totalSessions: number;
  totalOrders: number;
  totalRefunds: number;
  totalRevenue: number;
}[];

type OrderReport = {
  id: string;
  date: Date;
  orderNumber?: string;
  refundNumber?: string;
  cashierName: string;
  totalAmount: number;
  currency: string;
  itemsCount: number;
}[];

type SupplierOrderReport = {
  id: string;
  date: Date;
  invoiceNumber: string;
  supplierName: string;
  createdBy: string;
  totalAmount: number;
  currency: string;
  paymentType: string;
  itemsCount: number;
}[];

type ItemPriceReport = {
  id: string;
  name: string;
  barcodes: string[];
  singleBuyPrice: number;
  bundleBuyPrice: number;
  singleSellPrice: number;
  bundleSellPrice: number;
  inStock: number;
}[];

type ItemWithSalesAndStock = {
  id: string;
  name: string;
  barcode: string;
  inStock: number;
  isWeightable: boolean;
  singleBuyPrice: number;
  bundleBuyPrice: number;
  singleSellPrice: number;
  bundleSellPrice: number;
  totalSoldQuantity: number;
  totalRevenue: number;
};

type ItemsWithSalesAndStockReport = {
  items: ItemWithSalesAndStock[];
  totalStock: number;
};

type CategoryReport = {
  categories: {
    id: string;
    name: string;
    totalRevenue: number;
    totalProfit: number;
    totalLoss: number;
    itemsSold: number;
    ordersCount: number;
  }[];
  summary: {
    totalRevenue: number;
    totalProfit: number;
    totalLoss: number;
    totalItemsSold: number;
  };
};

type ReportType = "none";

const ReportsPage = () => {
  const { t, i18n } = useTranslation("Reports");
  const isRTL = i18n.language !== "en";
  const { data: session } = useSession();
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [reportData, setReportData] = useState<
    | MostSoldItem[]
    | RevenueReport
    | SupplierSalesReport
    | CashierReport
    | OrderReport
    | SupplierOrderReport
    | ItemPriceReport
    | ItemsWithSalesAndStockReport
    | CategoryReport
  >();
  const [reportType, setReportType] = useState<ReportType>("none");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [, setSelectedDate] = useState<string | null>(null);
  const [, setSelectedDayData] = useState<{
    date: string;
    orders: DailyOrder[];
    totalAmount: number;
    totalProfit: number;
    totalLoss: number;
  } | null>(null);
  const [, setSelectedItem] = useState<MostSoldItem | null>(null);

  const handleGenerateReport = async () => {
    if (!startDate || !endDate) return;

    try {
      setIsLoading(true);
      setCurrentPage(1);

      // Adjust dates to start and end of day in local time
      const adjustedStartDate = new Date(startDate);
      adjustedStartDate.setHours(0, 0, 0, 0);

      const adjustedEndDate = new Date(endDate);
      adjustedEndDate.setHours(23, 59, 59, 999);

      const response = await fetch("/api/employee/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reportType,
          startDate: adjustedStartDate.toISOString(),
          endDate: adjustedEndDate.toISOString(),
        }),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || "Failed to generate report");
      }

      setReportData(result.data);
      toast.success(t("ReportGeneratedSuccessfully"));
    } catch (error) {
      console.error("Failed to generate report:", error);
      toast.error(t("FailedToGenerateReport"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadExcel = async () => {
    if (!reportData) return;

    try {
      setIsExporting(true);

      // Dynamic import to avoid SSR issues
      const ExcelJS = (await import("exceljs")).default;
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Report");

      // Set the headers based on report type
      if (reportType === "none") {
        worksheet.columns = [
          { header: "#", key: "index", width: 5 },
          { header: t("Item"), key: "name", width: 30 },
          { header: t("Barcode"), key: "barcode", width: 20 },
          { header: t("BundleQty"), key: "bundleQuantity", width: 15 },
          { header: t("SingleQty"), key: "singleQuantity", width: 15 },
          { header: t("TotalAmount"), key: "totalAmount", width: 15 },
        ];

        const items = reportData as MostSoldItem[];
        items.forEach((item, index) => {
          worksheet.addRow({
            index: index + 1,
            name: item.name,
            barcode: item.barcode,
            bundleQuantity: item.bundleQuantity > 0 ? item.bundleQuantity : "-",
            singleQuantity: item.singleQuantity > 0 ? item.singleQuantity : "-",
            totalAmount: `${formatNumber(item.totalAmount)} IQD`,
          });
        });

        // Add total row
        worksheet.addRow({
          index: "",
          name: "",
          barcode: t("Total"),
          bundleQuantity: formatNumber(
            items.reduce(
              (sum: number, item: MostSoldItem) =>
                sum + (item.bundleQuantity > 0 ? item.bundleQuantity : 0),
              0
            )
          ),
          singleQuantity: formatNumber(
            items.reduce(
              (sum: number, item: MostSoldItem) => sum + item.singleQuantity,
              0
            )
          ),
          totalAmount: `${formatNumber(
            items.reduce(
              (sum: number, item: MostSoldItem) => sum + item.totalAmount,
              0
            )
          )} IQD`,
        });
      } else if (reportType === "revenue") {
        const data = reportData as RevenueReport;

        // Group orders by date
        const groupedOrders = data.orders.reduce(
          (acc, order) => {
            const date = new Date(order.createdAt).toLocaleDateString();

            if (!acc[date]) {
              acc[date] = {
                date,
                orders: [],
                totalAmount: 0,
                totalProfit: 0,
                totalLoss: 0,
              };
            }
            acc[date].orders.push(order);
            acc[date].totalAmount += order.totalAmount ?? 0;
            acc[date].totalProfit += order.profit ?? 0;
            acc[date].totalLoss += order.loss ?? 0;
            return acc;
          },
          {} as Record<
            string,
            {
              date: string;
              orders: typeof data.orders;
              totalAmount: number;
              totalProfit: number;
              totalLoss: number;
            }
          >
        );

        const groupedOrdersArray = Object.values(groupedOrders);

        worksheet.columns = [
          { header: t("Date"), key: "date", width: 20 },
          { header: t("Orders"), key: "orders", width: 15 },
          { header: t("Revenue"), key: "revenue", width: 20 },
        ];

        groupedOrdersArray.forEach((dayData) => {
          worksheet.addRow({
            date: dayData.date,
            orders: dayData.orders.length,
            revenue: `${formatNumber(dayData.totalAmount)} IQD`,
          });
        });

        // Add summary
        worksheet.addRow({});
        worksheet.addRow({
          date: t("TotalOrders"),
          orders: formatNumber(data.totalOrders ?? 0),
        });
        worksheet.addRow({
          date: t("TotalRevenue"),
          orders: `${formatNumber(data.totalRevenue ?? 0)} IQD`,
        });
      } else if (reportType === "supplier-sales") {
        const suppliers = reportData as SupplierSalesReport;

        worksheet.columns = [
          { header: "#", key: "index", width: 5 },
          { header: t("Supplier"), key: "name", width: 30 },
          { header: t("ItemsSold"), key: "itemsSold", width: 15 },
          { header: t("TotalQuantity"), key: "totalQuantity", width: 15 },
          { header: t("TotalRevenue"), key: "totalRevenue", width: 20 },
        ];

        suppliers.forEach((supplier, index) => {
          worksheet.addRow({
            index: index + 1,
            name: supplier.name,
            itemsSold: supplier.itemsSold,
            totalQuantity: formatNumber(supplier.totalQuantity),
            totalRevenue: `${formatNumber(supplier.totalRevenue)} IQD`,
          });
        });

        // Add total row
        worksheet.addRow({
          index: "",
          name: t("Total"),
          itemsSold: formatNumber(
            suppliers.reduce((sum, supplier) => sum + supplier.itemsSold, 0)
          ),
          totalQuantity: formatNumber(
            suppliers.reduce((sum, supplier) => sum + supplier.totalQuantity, 0)
          ),
          totalRevenue: `${formatNumber(
            suppliers.reduce((sum, supplier) => sum + supplier.totalRevenue, 0)
          )} IQD`,
        });
      } else if (reportType === "best-cashier") {
        const cashiers = reportData as CashierReport;

        worksheet.columns = [
          { header: "#", key: "index", width: 5 },
          { header: t("Cashier"), key: "name", width: 30 },
          { header: t("Sessions"), key: "sessions", width: 15 },
          { header: t("Orders"), key: "orders", width: 15 },
          { header: t("Refunds"), key: "refunds", width: 15 },
          { header: t("TotalRevenue"), key: "revenue", width: 20 },
        ];

        cashiers.forEach((cashier, index) => {
          worksheet.addRow({
            index: index + 1,
            name: cashier.name,
            sessions: cashier.totalSessions,
            orders: cashier.totalOrders,
            refunds: cashier.totalRefunds,
            revenue: `${formatNumber(cashier.totalRevenue)} IQD`,
          });
        });

        // Add total row
        worksheet.addRow({
          index: "",
          name: t("Total"),
          sessions: formatNumber(
            cashiers.reduce((sum, cashier) => sum + cashier.totalSessions, 0)
          ),
          orders: formatNumber(
            cashiers.reduce((sum, cashier) => sum + cashier.totalOrders, 0)
          ),
          refunds: formatNumber(
            cashiers.reduce((sum, cashier) => sum + cashier.totalRefunds, 0)
          ),
          revenue: `${formatNumber(
            cashiers.reduce((sum, cashier) => sum + cashier.totalRevenue, 0)
          )} IQD`,
        });
      } else if (reportType === "orders" || reportType === "refunds") {
        const items = reportData as OrderReport;

        worksheet.columns = [
          { header: "#", key: "index", width: 5 },
          { header: t("Date"), key: "date", width: 15 },
          {
            header:
              reportType === "orders" ? t("OrderNumber") : t("RefundNumber"),
            key: "number",
            width: 20,
          },
          { header: t("Cashier"), key: "cashier", width: 20 },
          { header: t("ItemsCount"), key: "itemsCount", width: 15 },
          { header: t("TotalAmount"), key: "totalAmount", width: 20 },
        ];

        items.forEach((item, index) => {
          worksheet.addRow({
            index: index + 1,
            date: new Date(item.date).toLocaleDateString(),
            number:
              reportType === "orders" ? item.orderNumber : item.refundNumber,
            cashier: item.cashierName,
            itemsCount: item.itemsCount,
            totalAmount: `${formatNumber(item.totalAmount)} ${item.currency}`,
          });
        });

        // Add total row
        worksheet.addRow({
          index: "",
          date: "",
          number: "",
          cashier: t("Total"),
          itemsCount: formatNumber(
            items.reduce((sum, item) => sum + item.itemsCount, 0)
          ),
          totalAmount: `${formatNumber(
            items.reduce((sum, item) => sum + item.totalAmount, 0)
          )} ${items[0]?.currency}`,
        });
      } else if (
        reportType === "supplier-orders" ||
        reportType === "supplier-refunds"
      ) {
        const items = reportData as SupplierOrderReport;

        worksheet.columns = [
          { header: "#", key: "index", width: 5 },
          { header: t("Date"), key: "date", width: 15 },
          { header: t("InvoiceNumber"), key: "invoice", width: 20 },
          { header: t("Supplier"), key: "supplier", width: 20 },
          { header: t("CreatedBy"), key: "createdBy", width: 20 },
          { header: t("ItemsCount"), key: "itemsCount", width: 15 },
          { header: t("PaymentType"), key: "paymentType", width: 15 },
          { header: t("TotalAmount"), key: "totalAmount", width: 20 },
        ];

        items.forEach((item, index) => {
          worksheet.addRow({
            index: index + 1,
            date: new Date(item.date).toLocaleDateString(),
            invoice: item.invoiceNumber,
            supplier: item.supplierName,
            createdBy: item.createdBy,
            itemsCount: item.itemsCount,
            paymentType: item.paymentType,
            totalAmount: `${formatNumber(item.totalAmount)} ${item.currency}`,
          });
        });

        // Add total row
        worksheet.addRow({
          index: "",
          date: "",
          invoice: "",
          supplier: "",
          createdBy: t("Total"),
          itemsCount: formatNumber(
            items.reduce((sum, item) => sum + item.itemsCount, 0)
          ),
          paymentType: "",
          totalAmount: `${formatNumber(
            items.reduce((sum, item) => sum + item.totalAmount, 0)
          )} ${items[0]?.currency}`,
        });
      } else if (
        reportType === "items-without-buy-price" ||
        reportType === "items-with-invalid-prices"
      ) {
        const items = reportData as ItemPriceReport;

        worksheet.columns = [
          { header: "#", key: "index", width: 5 },
          { header: t("Item"), key: "name", width: 30 },
          { header: t("Barcode"), key: "barcode", width: 20 },
          { header: t("SingleBuyPrice"), key: "singleBuyPrice", width: 15 },
          { header: t("SingleSellPrice"), key: "singleSellPrice", width: 15 },
          { header: t("BundleBuyPrice"), key: "bundleBuyPrice", width: 15 },
          { header: t("BundleSellPrice"), key: "bundleSellPrice", width: 15 },
          { header: t("InStock"), key: "inStock", width: 10 },
        ];

        items.forEach((item, index) => {
          worksheet.addRow({
            index: index + 1,
            name: item.name,
            barcode: item.barcodes[0] || "-",
            singleBuyPrice: `${formatNumber(item.singleBuyPrice)} IQD`,
            singleSellPrice: `${formatNumber(item.singleSellPrice)} IQD`,
            bundleBuyPrice: `${formatNumber(item.bundleBuyPrice)} IQD`,
            bundleSellPrice: `${formatNumber(item.bundleSellPrice)} IQD`,
            inStock: formatNumber(item.inStock),
          });
        });
      } else if (reportType === "items-with-sales-and-stock") {
        const data = reportData as ItemsWithSalesAndStockReport;
        if (!data?.items) return;

        worksheet.columns = [
          { header: "#", key: "index", width: 5 },
          { header: t("Item"), key: "name", width: 30 },
          { header: t("Barcode"), key: "barcode", width: 20 },
          { header: t("InStock"), key: "inStock", width: 10 },
          { header: t("BundleStock"), key: "bundleStock", width: 15 },
          { header: t("SingleBuyPrice"), key: "singleBuyPrice", width: 15 },
          { header: t("SingleSellPrice"), key: "singleSellPrice", width: 15 },
          { header: t("BundleBuyPrice"), key: "bundleBuyPrice", width: 15 },
          { header: t("BundleSellPrice"), key: "bundleSellPrice", width: 15 },
          {
            header: t("TotalSoldQuantity"),
            key: "totalSoldQuantity",
            width: 15,
          },
          { header: t("TotalRevenue"), key: "totalRevenue", width: 20 },
        ];

        data.items.forEach((item, index) => {
          worksheet.addRow({
            index: index + 1,
            name: item.name,
            barcode: item.barcode,
            inStock: `${formatNumber(item.inStock)}${item.isWeightable ? " KG" : ""}`,
            bundleStock: `${formatNumber(Math.floor(item.inStock / 12))} ${t("Bundles")}`,
            singleBuyPrice: `${formatNumber(item.singleBuyPrice)} IQD`,
            singleSellPrice: `${formatNumber(item.singleSellPrice)} IQD`,
            bundleBuyPrice: `${formatNumber(item.bundleBuyPrice)} IQD`,
            bundleSellPrice: `${formatNumber(item.bundleSellPrice)} IQD`,
            totalSoldQuantity: `${formatNumber(item.totalSoldQuantity)}${item.isWeightable ? " KG" : ""}`,
            totalRevenue: `${formatNumber(item.totalRevenue)} IQD`,
          });
        });

        // Add total row
        worksheet.addRow({
          index: "",
          name: t("Total"),
          barcode: "",
          inStock: `${formatNumber(data.totalStock)}`,
          bundleStock: "",
          singleBuyPrice: "",
          singleSellPrice: "",
          bundleBuyPrice: "",
          bundleSellPrice: "",
          totalSoldQuantity: formatNumber(
            data.items.reduce((sum, item) => sum + item.totalSoldQuantity, 0)
          ),
          totalRevenue: `${formatNumber(
            data.items.reduce((sum, item) => sum + item.totalRevenue, 0)
          )} IQD`,
        });
      } else if (reportType === "revenue-by-category") {
        console.log("Rendering category report with data:", reportData);
        const data = reportData as CategoryReport;

        // Ensure we have the correct data structure
        if (!data?.categories || !data?.summary) {
          console.log("Invalid data structure:", data);
          return (
            <div className="flex items-center justify-center p-8 text-muted-foreground">
              {t("NoDataFound")}
            </div>
          );
        }

        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const currentCategories = data.categories.slice(startIndex, endIndex);
        const totalPages = Math.ceil(data.categories.length / itemsPerPage);

        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4">
                <h3 className="text-sm font-medium text-muted-foreground">
                  {t("TotalRevenue")}
                </h3>
                <p className="text-2xl font-bold">
                  {formatNumber(data.summary.totalRevenue)} IQD
                </p>
              </Card>
              <Card className="p-4">
                <h3 className="text-sm font-medium text-muted-foreground">
                  {t("TotalItemsSold")}
                </h3>
                <p className="text-2xl font-bold">
                  {formatNumber(data.summary.totalItemsSold)}
                </p>
              </Card>
              <Card className="p-4">
                <h3 className="text-sm font-medium text-muted-foreground">
                  {t("TotalOrders")}
                </h3>
                <p className="text-2xl font-bold">
                  {formatNumber(
                    data.categories.reduce(
                      (sum, category) => sum + category.ordersCount,
                      0
                    )
                  )}
                </p>
              </Card>
              <Card className="p-4">
                <h3 className="text-sm font-medium text-muted-foreground">
                  {t("TotalProfit")}
                </h3>
                <p className="text-2xl font-bold text-emerald-600">
                  +{formatNumber(data.summary.totalProfit)} IQD
                </p>
              </Card>
              <Card className="p-4">
                <h3 className="text-sm font-medium text-muted-foreground">
                  {t("TotalLoss")}
                </h3>
                <p className="text-2xl font-bold text-red-600">
                  -{formatNumber(data.summary.totalLoss)} IQD
                </p>
              </Card>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>{t("Category")}</TableHead>
                    <TableHead>{t("ItemsSold")}</TableHead>
                    <TableHead>{t("Orders")}</TableHead>
                    <TableHead>{t("Revenue")}</TableHead>
                    <TableHead>{t("Profit")}</TableHead>
                    <TableHead>{t("Loss")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentCategories.map((category, index) => (
                    <TableRow key={category.id}>
                      <TableCell>{startIndex + index + 1}</TableCell>
                      <TableCell>{category.name}</TableCell>
                      <TableCell>{formatNumber(category.itemsSold)}</TableCell>
                      <TableCell>
                        {formatNumber(category.ordersCount)}
                      </TableCell>
                      <TableCell>
                        {formatNumber(category.totalRevenue)} IQD
                      </TableCell>
                      <TableCell className="text-emerald-600">
                        {category.totalProfit > 0
                          ? `+${formatNumber(category.totalProfit)} IQD`
                          : "-"}
                      </TableCell>
                      <TableCell className="text-red-600">
                        {category.totalLoss > 0
                          ? `-${formatNumber(category.totalLoss)} IQD`
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              isLoading={isLoading}
            />
          </div>
        );
      }

      // Style headers
      worksheet.getRow(1).font = { bold: true };

      // Generate buffer and create download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${reportType}-report-${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success(t("ReportDownloadedSuccessfully"));
    } catch (error) {
      console.error("Failed to download report:", error);
      toast.error(t("FailedToDownloadReport"));
    } finally {
      setIsExporting(false);
    }
  };

  const formatNumber = (num: number | undefined | null) => {
    if (num === undefined || num === null) return "0";
    return num.toLocaleString("en-US");
  };

  const renderReportTable = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      );
    }

    if (!reportData) {
      return (
        <div className="flex items-center justify-center p-8 text-muted-foreground">
          {t("SelectDateRangeAndGenerateReport")}
        </div>
      );
    }

    if (reportType === "none") {
      console.log("Rendering category report with data:", reportData);
      const data = reportData as CategoryReport;

      // Ensure we have the correct data structure
      if (!data?.categories || !data?.summary) {
        console.log("Invalid data structure:", data);
        return (
          <div className="flex items-center justify-center p-8 text-muted-foreground">
            {t("NoDataFound")}
          </div>
        );
      }

      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const currentCategories = data.categories.slice(startIndex, endIndex);
      const totalPages = Math.ceil(data.categories.length / itemsPerPage);

      return (
        <div className="space-y-4" dir={isRTL ? "rtl" : "ltr"}>
          <div className="grid grid-cols-2 gap-4" dir={isRTL ? "rtl" : "ltr"}>
            <Card className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground">
                {t("TotalRevenue")}
              </h3>
              <p
                className={cn("text-2xl font-bold", isRTL && "text-right")}
                dir="ltr"
              >
                {formatNumber(data.summary.totalRevenue)} IQD
              </p>
            </Card>
            <Card className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground">
                {t("TotalItemsSold")}
              </h3>
              <p
                className={cn("text-2xl font-bold", isRTL && "text-right")}
                dir="ltr"
              >
                {formatNumber(data.summary.totalItemsSold)}
              </p>
            </Card>
            <Card className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground">
                {t("TotalOrders")}
              </h3>
              <p
                className={cn("text-2xl font-bold", isRTL && "text-right")}
                dir="ltr"
              >
                {formatNumber(
                  data.categories.reduce(
                    (sum, category) => sum + category.ordersCount,
                    0
                  )
                )}
              </p>
            </Card>
            <Card className="p-4" dir={isRTL ? "rtl" : "ltr"}>
              <h3 className="text-sm font-medium text-muted-foreground">
                {t("TotalProfit")}
              </h3>
              <p
                className={cn(
                  "text-2xl font-bold text-emerald-600",
                  isRTL && "text-right"
                )}
                dir="ltr"
              >
                +{formatNumber(data.summary.totalProfit)} IQD
              </p>
            </Card>
            <Card className="p-4" dir={isRTL ? "rtl" : "ltr"}>
              <h3 className="text-sm font-medium text-muted-foreground">
                {t("TotalLoss")}
              </h3>
              <p
                className={cn(
                  "text-2xl font-bold text-red-600",
                  isRTL && "text-right"
                )}
                dir="ltr"
              >
                -{formatNumber(data.summary.totalLoss)} IQD
              </p>
            </Card>
          </div>

          <div className="rounded-md border" dir={isRTL ? "rtl" : "ltr"}>
            <Table dir={isRTL ? "rtl" : "ltr"}>
              <TableHeader dir={isRTL ? "rtl" : "ltr"}>
                <TableRow dir={isRTL ? "rtl" : "ltr"}>
                  <TableHead>#</TableHead>
                  <TableHead>{t("Category")}</TableHead>
                  <TableHead>{t("ItemsSold")}</TableHead>
                  <TableHead>{t("Orders")}</TableHead>
                  <TableHead>{t("Revenue")}</TableHead>
                  <TableHead>{t("Profit")}</TableHead>
                  <TableHead>{t("Loss")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody dir={isRTL ? "rtl" : "ltr"}>
                {currentCategories.map((category, index) => (
                  <TableRow key={category.id}>
                    <TableCell>{startIndex + index + 1}</TableCell>
                    <TableCell>{category.name}</TableCell>
                    <TableCell>{formatNumber(category.itemsSold)}</TableCell>
                    <TableCell>{formatNumber(category.ordersCount)}</TableCell>
                    <TableCell dir="ltr">
                      {formatNumber(category.totalRevenue)} IQD
                    </TableCell>
                    <TableCell className="text-emerald-600" dir="ltr">
                      {category.totalProfit > 0
                        ? `+${formatNumber(category.totalProfit)} IQD`
                        : "-"}
                    </TableCell>
                    <TableCell className="text-red-600" dir="ltr">
                      {category.totalLoss > 0
                        ? `-${formatNumber(category.totalLoss)} IQD`
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            isLoading={isLoading}
          />
        </div>
      );
    }

    if (reportType === "items-with-sales-and-stock") {
      const data = reportData as ItemsWithSalesAndStockReport;
      if (!data?.items || data.items.length === 0) return null;

      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const currentItems = data.items.slice(startIndex, endIndex);
      const totalPages = Math.ceil(data.items.length / itemsPerPage);

      return (
        <div className="space-y-4" dir={isRTL ? "rtl" : "ltr"}>
          <div className="grid grid-cols-2 gap-4" dir={isRTL ? "rtl" : "ltr"}>
            <Card className="p-4" dir={isRTL ? "rtl" : "ltr"}>
              <h3 className="text-sm font-medium text-muted-foreground">
                {t("TotalItems")}
              </h3>
              <p
                className={cn("text-2xl font-bold", isRTL && "text-right")}
                dir="ltr"
              >
                {formatNumber(data.items.length)}
              </p>
            </Card>
            <Card className="p-4" dir={isRTL ? "rtl" : "ltr"}>
              <h3 className="text-sm font-medium text-muted-foreground">
                {t("TotalStock")}
              </h3>
              <p
                className={cn("text-2xl font-bold", isRTL && "text-right")}
                dir="ltr"
              >
                {formatNumber(data.totalStock)}
              </p>
            </Card>
          </div>

          <Table dir={isRTL ? "rtl" : "ltr"}>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>{t("Item")}</TableHead>
                <TableHead>{t("Barcode")}</TableHead>
                <TableHead>{t("InStock")}</TableHead>
                <TableHead>{t("BundleStock")}</TableHead>
                <TableHead>{t("SingleBuyPrice")}</TableHead>
                <TableHead>{t("SingleSellPrice")}</TableHead>
                <TableHead>{t("BundleBuyPrice")}</TableHead>
                <TableHead>{t("BundleSellPrice")}</TableHead>
                <TableHead>{t("TotalSoldQuantity")}</TableHead>
                <TableHead>{t("TotalRevenue")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody dir={isRTL ? "rtl" : "ltr"}>
              {currentItems.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell>{startIndex + index + 1}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.barcode}</TableCell>
                  <TableCell
                    className={item.inStock <= 0 ? "text-red-600" : ""}
                  >
                    {item.isWeightable
                      ? `${formatNumber(item.inStock)} KG`
                      : formatNumber(item.inStock)}
                  </TableCell>
                  <TableCell dir="ltr">
                    {item.isWeightable
                      ? "-"
                      : `${formatNumber(Math.floor(item.inStock / 12))} ${t("Bundles")}`}
                  </TableCell>
                  <TableCell dir="ltr">
                    {formatNumber(item.singleBuyPrice)} IQD
                  </TableCell>
                  <TableCell dir="ltr">
                    {formatNumber(item.singleSellPrice)} IQD
                  </TableCell>
                  <TableCell dir="ltr">
                    {formatNumber(item.bundleBuyPrice)} IQD
                  </TableCell>
                  <TableCell dir="ltr">
                    {formatNumber(item.bundleSellPrice)} IQD
                  </TableCell>
                  <TableCell dir="ltr">
                    {formatNumber(item.totalSoldQuantity)}{" "}
                    {item.isWeightable ? "KG" : ""}
                  </TableCell>
                  <TableCell dir="ltr">
                    {formatNumber(item.totalRevenue)} IQD
                  </TableCell>
                </TableRow>
              ))}
              <TableRow
                className="font-bold bg-muted/30"
                dir={isRTL ? "rtl" : "ltr"}
              >
                <TableCell colSpan={3}>{t("Total")}</TableCell>
                <TableCell dir="ltr">
                  {`${formatNumber(
                    data.items.reduce(
                      (sum, item) =>
                        sum + (item.isWeightable ? item.inStock : 0),
                      0
                    )
                  )} KG / ${formatNumber(
                    data.items.reduce(
                      (sum, item) =>
                        sum + (!item.isWeightable ? item.inStock : 0),
                      0
                    )
                  )} ${t("Items")}`}
                </TableCell>
                <TableCell dir="ltr">
                  {formatNumber(
                    data.items.reduce(
                      (sum, item) =>
                        sum +
                        (!item.isWeightable
                          ? Math.floor(item.inStock / 12)
                          : 0),
                      0
                    )
                  )}{" "}
                  {t("Bundles")}
                </TableCell>
                <TableCell colSpan={4}></TableCell>
                <TableCell dir="ltr">
                  {`${formatNumber(
                    data.items.reduce(
                      (sum, item) =>
                        sum + (item.isWeightable ? item.totalSoldQuantity : 0),
                      0
                    )
                  )} KG / ${formatNumber(
                    data.items.reduce(
                      (sum, item) =>
                        sum + (!item.isWeightable ? item.totalSoldQuantity : 0),
                      0
                    )
                  )} ${t("Items")}`}
                </TableCell>
                <TableCell dir="ltr">
                  {formatNumber(
                    data.items.reduce((sum, item) => sum + item.totalRevenue, 0)
                  )}{" "}
                  IQD
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            isLoading={isLoading}
          />
        </div>
      );
    }

    if (reportType === "revenue") {
      const data = reportData as RevenueReport;
      if (!data.orders?.length) return null;

      // Group orders by date
      const groupedOrders = data.orders.reduce(
        (acc, order) => {
          const date = new Date(order.createdAt).toLocaleDateString();

          if (!acc[date]) {
            acc[date] = {
              date,
              orders: [],
              totalAmount: 0,
              totalProfit: 0,
              totalLoss: 0,
            };
          }
          acc[date].orders.push(order);
          acc[date].totalAmount += order.totalAmount ?? 0;
          acc[date].totalProfit += order.profit ?? 0;
          acc[date].totalLoss += order.loss ?? 0;
          return acc;
        },
        {} as Record<
          string,
          {
            date: string;
            orders: typeof data.orders;
            totalAmount: number;
            totalProfit: number;
            totalLoss: number;
          }
        >
      );

      const groupedOrdersArray = Object.values(groupedOrders);
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const currentGroupedOrders = groupedOrdersArray
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(startIndex, endIndex);
      const totalPages = Math.ceil(groupedOrdersArray.length / itemsPerPage);

      return (
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow dir={isRTL ? "rtl" : "ltr"}>
                <TableHead>{t("Date")}</TableHead>
                <TableHead>{t("Orders")}</TableHead>
                <TableHead>{t("Revenue")}</TableHead>
                <TableHead>{t("Profit")}</TableHead>
                <TableHead>{t("Loss")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody dir={isRTL ? "rtl" : "ltr"}>
              {currentGroupedOrders.map((dayData) => (
                <TableRow
                  key={dayData.date}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => {
                    setSelectedDate(dayData.date);
                    setSelectedDayData({
                      date: dayData.date,
                      orders: dayData.orders.map((order) => ({
                        id: order.id,
                        createdAt: order.createdAt,
                        totalAmount: order.totalAmount,
                        cashierName: order.cashierName || t("UnknownCashier"),
                        profit: order.profit,
                        loss: order.loss,
                      })),
                      totalAmount: dayData.totalAmount,
                      totalProfit: dayData.totalProfit,
                      totalLoss: dayData.totalLoss,
                    });
                  }}
                >
                  <TableCell className="font-medium">{dayData.date}</TableCell>
                  <TableCell>{dayData.orders.length}</TableCell>
                  <TableCell dir="ltr">
                    {formatNumber(dayData.totalAmount)} IQD
                  </TableCell>
                  <TableCell className="text-emerald-600" dir="ltr">
                    {dayData.totalProfit > 0
                      ? `+${formatNumber(dayData.totalProfit)} IQD`
                      : "-"}
                  </TableCell>
                  <TableCell className="text-red-600" dir="ltr">
                    {dayData.totalLoss > 0
                      ? `-${formatNumber(dayData.totalLoss)} IQD`
                      : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            isLoading={isLoading}
          />

          <div className="grid grid-cols-2 gap-4" dir={isRTL ? "rtl" : "ltr"}>
            <Card className="p-4" dir={isRTL ? "rtl" : "ltr"}>
              <h3 className="text-sm font-medium text-muted-foreground">
                {t("TotalOrders")}
              </h3>
              <p
                className={cn("text-2xl font-bold", isRTL && "text-right")}
                dir="ltr"
              >
                {formatNumber(data.totalOrders ?? 0)}
              </p>
            </Card>
            <Card className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground">
                {t("TotalRevenue")}
              </h3>
              <p
                className={cn("text-2xl font-bold", isRTL && "text-right")}
                dir="ltr"
              >
                {formatNumber(data.totalRevenue ?? 0)} IQD
              </p>
            </Card>
            <Card className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground">
                {t("TotalProfit")}
              </h3>
              <p
                className={cn(
                  "text-2xl font-bold text-emerald-600",
                  isRTL && "text-right"
                )}
                dir="ltr"
              >
                +{formatNumber(data.totalProfit ?? 0)} IQD
              </p>
            </Card>
            <Card className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground">
                {t("TotalLoss")}
              </h3>
              <p
                className={cn(
                  "text-2xl font-bold text-red-600",
                  isRTL && "text-right"
                )}
                dir="ltr"
              >
                -{formatNumber(data.totalLoss ?? 0)} IQD
              </p>
            </Card>
          </div>
        </div>
      );
    }

    if (reportType === "supplier-sales") {
      const suppliers = reportData as SupplierSalesReport;
      if (!Array.isArray(suppliers)) return null;
      if (suppliers.length === 0) return null;

      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const currentSuppliers = suppliers.slice(startIndex, endIndex);
      const totalPages = Math.ceil(suppliers.length / itemsPerPage);

      return (
        <div className="space-y-4" dir={isRTL ? "rtl" : "ltr"}>
          <Table dir={isRTL ? "rtl" : "ltr"}>
            <TableHeader dir={isRTL ? "rtl" : "ltr"}>
              <TableRow dir={isRTL ? "rtl" : "ltr"}>
                <TableHead>#</TableHead>
                <TableHead>{t("Supplier")}</TableHead>
                <TableHead>{t("ItemsSold")}</TableHead>
                <TableHead>{t("TotalQuantity")}</TableHead>
                <TableHead>{t("TotalRevenue")}</TableHead>
                <TableHead>{t("Profit")}</TableHead>
                <TableHead>{t("Loss")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody dir={isRTL ? "rtl" : "ltr"}>
              {currentSuppliers.map((supplier, index) => (
                <TableRow key={supplier.id}>
                  <TableCell>{startIndex + index + 1}</TableCell>
                  <TableCell>{supplier.name}</TableCell>
                  <TableCell>{supplier.itemsSold}</TableCell>
                  <TableCell>{formatNumber(supplier.totalQuantity)}</TableCell>
                  <TableCell dir="ltr">
                    {formatNumber(supplier.totalRevenue)} IQD
                  </TableCell>
                  <TableCell className="text-emerald-600" dir="ltr">
                    {supplier.totalProfit > 0
                      ? `+${formatNumber(supplier.totalProfit)} IQD`
                      : "-"}
                  </TableCell>
                  <TableCell className="text-red-600" dir="ltr">
                    {supplier.totalLoss > 0
                      ? `-${formatNumber(supplier.totalLoss)} IQD`
                      : "-"}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow
                className="font-bold bg-muted/30"
                dir={isRTL ? "rtl" : "ltr"}
              >
                <TableCell colSpan={2}>{t("Total")}</TableCell>
                <TableCell dir="ltr">
                  {formatNumber(
                    suppliers.reduce(
                      (sum, supplier) => sum + supplier.itemsSold,
                      0
                    )
                  )}
                </TableCell>
                <TableCell dir="ltr">
                  {formatNumber(
                    suppliers.reduce(
                      (sum, supplier) => sum + supplier.totalQuantity,
                      0
                    )
                  )}
                </TableCell>
                <TableCell dir="ltr">
                  {formatNumber(
                    suppliers.reduce(
                      (sum, supplier) => sum + supplier.totalRevenue,
                      0
                    )
                  )}{" "}
                  IQD
                </TableCell>
                <TableCell className="text-emerald-600" dir="ltr">
                  +
                  {formatNumber(
                    suppliers.reduce(
                      (sum, supplier) => sum + supplier.totalProfit,
                      0
                    )
                  )}{" "}
                  IQD
                </TableCell>
                <TableCell className="text-red-600" dir="ltr">
                  -
                  {formatNumber(
                    suppliers.reduce(
                      (sum, supplier) => sum + supplier.totalLoss,
                      0
                    )
                  )}{" "}
                  IQD
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            isLoading={isLoading}
          />
        </div>
      );
    }

    if (reportType === "best-cashier") {
      const cashiers = reportData as CashierReport;
      if (!Array.isArray(cashiers)) return null;
      if (cashiers.length === 0) return null;

      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const currentCashiers = cashiers.slice(startIndex, endIndex);
      const totalPages = Math.ceil(cashiers.length / itemsPerPage);

      return (
        <div className="space-y-4" dir={isRTL ? "rtl" : "ltr"}>
          <Table dir={isRTL ? "rtl" : "ltr"}>
            <TableHeader dir={isRTL ? "rtl" : "ltr"}>
              <TableRow dir={isRTL ? "rtl" : "ltr"}>
                <TableHead>#</TableHead>
                <TableHead>{t("Cashier")}</TableHead>
                <TableHead>{t("Sessions")}</TableHead>
                <TableHead>{t("Orders")}</TableHead>
                <TableHead>{t("Refunds")}</TableHead>
                <TableHead>{t("TotalRevenue")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody dir={isRTL ? "rtl" : "ltr"}>
              {currentCashiers.map((cashier, index) => (
                <TableRow key={cashier.id}>
                  <TableCell>{startIndex + index + 1}</TableCell>
                  <TableCell>{cashier.name}</TableCell>
                  <TableCell>{cashier.totalSessions}</TableCell>
                  <TableCell>{cashier.totalOrders}</TableCell>
                  <TableCell>{cashier.totalRefunds}</TableCell>
                  <TableCell>
                    {formatNumber(cashier.totalRevenue)} IQD
                  </TableCell>
                </TableRow>
              ))}
              <TableRow
                className="font-bold bg-muted/30"
                dir={isRTL ? "rtl" : "ltr"}
              >
                <TableCell colSpan={2}>{t("Total")}</TableCell>
                <TableCell dir="ltr">
                  {formatNumber(
                    cashiers.reduce(
                      (sum, cashier) => sum + cashier.totalSessions,
                      0
                    )
                  )}
                </TableCell>
                <TableCell dir="ltr">
                  {formatNumber(
                    cashiers.reduce(
                      (sum, cashier) => sum + cashier.totalOrders,
                      0
                    )
                  )}
                </TableCell>
                <TableCell dir="ltr">
                  {formatNumber(
                    cashiers.reduce(
                      (sum, cashier) => sum + cashier.totalRefunds,
                      0
                    )
                  )}
                </TableCell>
                <TableCell dir="ltr">
                  {formatNumber(
                    cashiers.reduce(
                      (sum, cashier) => sum + cashier.totalRevenue,
                      0
                    )
                  )}{" "}
                  IQD
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            isLoading={isLoading}
          />
        </div>
      );
    }

    if (reportType === "orders" || reportType === "refunds") {
      const items = reportData as OrderReport;

      if (!Array.isArray(items) || items.length === 0) return null;

      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const currentItems = items.slice(startIndex, endIndex);
      const totalPages = Math.ceil(items.length / itemsPerPage);

      return (
        <div className="space-y-4" dir={isRTL ? "rtl" : "ltr"}>
          <Table dir={isRTL ? "rtl" : "ltr"}>
            <TableHeader dir={isRTL ? "rtl" : "ltr"}>
              <TableRow dir={isRTL ? "rtl" : "ltr"}>
                <TableHead>#</TableHead>
                <TableHead>{t("Date")}</TableHead>
                <TableHead>
                  {reportType === "orders"
                    ? t("OrderNumber")
                    : t("RefundNumber")}
                </TableHead>
                <TableHead>{t("Cashier")}</TableHead>
                <TableHead>{t("ItemsCount")}</TableHead>
                <TableHead>{t("TotalAmount")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentItems.map((item, index) => (
                <TableRow key={item.id} dir={isRTL ? "rtl" : "ltr"}>
                  <TableCell>{startIndex + index + 1}</TableCell>
                  <TableCell>
                    {new Date(item.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {reportType === "orders"
                      ? item.orderNumber
                      : item.refundNumber}
                  </TableCell>
                  <TableCell>{item.cashierName}</TableCell>
                  <TableCell>{item.itemsCount}</TableCell>
                  <TableCell>
                    {formatNumber(item.totalAmount)} {item.currency}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow
                className="font-bold bg-muted/30"
                dir={isRTL ? "rtl" : "ltr"}
              >
                <TableCell colSpan={4}>{t("Total")}</TableCell>
                <TableCell>
                  {formatNumber(
                    items.reduce((sum, item) => sum + item.itemsCount, 0)
                  )}
                </TableCell>
                <TableCell>
                  {formatNumber(
                    items.reduce((sum, item) => sum + item.totalAmount, 0)
                  )}{" "}
                  {items[0]?.currency}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            isLoading={isLoading}
          />
        </div>
      );
    }

    if (reportType === "supplier-orders" || reportType === "supplier-refunds") {
      const items = reportData as SupplierOrderReport;

      if (!Array.isArray(items) || items.length === 0) return null;

      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const currentItems = items.slice(startIndex, endIndex);
      const totalPages = Math.ceil(items.length / itemsPerPage);

      return (
        <div className="space-y-4">
          <Table>
            <TableHeader dir={isRTL ? "rtl" : "ltr"}>
              <TableRow dir={isRTL ? "rtl" : "ltr"}>
                <TableHead>#</TableHead>
                <TableHead>{t("Date")}</TableHead>
                <TableHead>{t("InvoiceNumber")}</TableHead>
                <TableHead>{t("Supplier")}</TableHead>
                <TableHead>{t("CreatedBy")}</TableHead>
                <TableHead>{t("ItemsCount")}</TableHead>
                <TableHead>{t("PaymentType")}</TableHead>
                <TableHead>{t("TotalAmount")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentItems.map((item, index) => (
                <TableRow key={item.id} dir={isRTL ? "rtl" : "ltr"}>
                  <TableCell>{startIndex + index + 1}</TableCell>
                  <TableCell>
                    {new Date(item.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{item.invoiceNumber}</TableCell>
                  <TableCell>{item.supplierName}</TableCell>
                  <TableCell>{item.createdBy}</TableCell>
                  <TableCell>{item.itemsCount}</TableCell>
                  <TableCell>{item.paymentType}</TableCell>
                  <TableCell>
                    {formatNumber(item.totalAmount)} {item.currency}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow
                className="font-bold bg-muted/30"
                dir={isRTL ? "rtl" : "ltr"}
              >
                <TableCell colSpan={5}>{t("Total")}</TableCell>
                <TableCell>
                  {formatNumber(
                    items.reduce((sum, item) => sum + item.itemsCount, 0)
                  )}
                </TableCell>
                <TableCell></TableCell>
                <TableCell>
                  {formatNumber(
                    items.reduce((sum, item) => sum + item.totalAmount, 0)
                  )}{" "}
                  {items[0]?.currency}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            isLoading={isLoading}
          />
        </div>
      );
    }

    if (
      reportType === "items-without-buy-price" ||
      reportType === "items-with-invalid-prices"
    ) {
      const items = reportData as ItemPriceReport;
      if (!Array.isArray(items)) return null;
      if (items.length === 0) return null;

      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const currentItems = items.slice(startIndex, endIndex);
      const totalPages = Math.ceil(items.length / itemsPerPage);

      return (
        <div className="space-y-4">
          <Table>
            <TableHeader dir={isRTL ? "rtl" : "ltr"}>
              <TableRow dir={isRTL ? "rtl" : "ltr"}>
                <TableHead>#</TableHead>
                <TableHead>{t("Item")}</TableHead>
                <TableHead>{t("Barcode")}</TableHead>
                <TableHead>{t("SingleBuyPrice")}</TableHead>
                <TableHead>{t("SingleSellPrice")}</TableHead>
                <TableHead>{t("BundleBuyPrice")}</TableHead>
                <TableHead>{t("BundleSellPrice")}</TableHead>
                <TableHead>{t("InStock")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentItems.map((item, index) => (
                <TableRow key={item.id} dir={isRTL ? "rtl" : "ltr"}>
                  <TableCell>{startIndex + index + 1}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.barcodes[0] || "-"}</TableCell>
                  <TableCell
                    className={item.singleBuyPrice <= 0 ? "text-red-600" : ""}
                  >
                    {formatNumber(item.singleBuyPrice)} IQD
                  </TableCell>
                  <TableCell>
                    {formatNumber(item.singleSellPrice)} IQD
                  </TableCell>
                  <TableCell
                    className={item.bundleBuyPrice <= 0 ? "text-red-600" : ""}
                  >
                    {formatNumber(item.bundleBuyPrice)} IQD
                  </TableCell>
                  <TableCell>
                    {formatNumber(item.bundleSellPrice)} IQD
                  </TableCell>
                  <TableCell>{formatNumber(item.inStock)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            isLoading={isLoading}
          />
        </div>
      );
    }

    // Most sold items report
    const items = reportData as MostSoldItem[];
    if (!Array.isArray(items)) return null;
    if (items.length === 0) return null;

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = items.slice(startIndex, endIndex);
    const totalPages = Math.ceil(items.length / itemsPerPage);

    return (
      <div className="space-y-4">
        <Table>
          <TableHeader dir={isRTL ? "rtl" : "ltr"}>
            <TableRow dir={isRTL ? "rtl" : "ltr"}>
              <TableHead>#</TableHead>
              <TableHead>{t("Item")}</TableHead>
              <TableHead>{t("Barcode")}</TableHead>
              <TableHead>{t("BundleQty")}</TableHead>
              <TableHead>{t("SingleQty")}</TableHead>
              <TableHead>{t("TotalAmount")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody dir={isRTL ? "rtl" : "ltr"}>
            {currentItems.map((item, index) => (
              <TableRow
                key={item.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => setSelectedItem(item)}
              >
                <TableCell>{startIndex + index + 1}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.barcode}</TableCell>
                <TableCell>
                  {item.bundleQuantity > 0
                    ? item.bundleQuantity.toLocaleString()
                    : "-"}
                </TableCell>
                <TableCell>
                  {item.singleQuantity > 0
                    ? item.singleQuantity.toLocaleString()
                    : "-"}
                </TableCell>
                <TableCell>{formatNumber(item.totalAmount)} IQD</TableCell>
              </TableRow>
            ))}
            <TableRow className="font-bold bg-muted/30">
              <TableCell colSpan={3}>{t("Total")}</TableCell>
              <TableCell>
                {formatNumber(
                  items.reduce(
                    (sum: number, item: MostSoldItem) =>
                      sum + (item.bundleQuantity > 0 ? item.bundleQuantity : 0),
                    0
                  )
                )}
              </TableCell>
              <TableCell>
                {formatNumber(
                  items.reduce(
                    (sum: number, item: MostSoldItem) =>
                      sum + item.singleQuantity,
                    0
                  )
                )}
              </TableCell>
              <TableCell>
                {formatNumber(
                  items.reduce(
                    (sum: number, item: MostSoldItem) => sum + item.totalAmount,
                    0
                  )
                )}{" "}
                IQD
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          isLoading={isLoading}
        />
      </div>
    );
  };

  if (!hasPermission(session, Permission.VIEW_REPORTS)) {
    return null;
  }

  return (
    <main className="space-y-4">
      <PageHeader
        title={t("Reports")}
        description={t("GenerateAndViewReports")}
      />

      <Card className="p-6" dir={isRTL ? "rtl" : "ltr"}>
        <form className="space-y-6">
          <div className="flex gap-4 w-full">
            <div className="space-y-2 w-full">
              <Label>{t("ReportType")}</Label>
              <Select
                value={reportType}
                onValueChange={(value) => {
                  setReportType(value as ReportType);
                  setCurrentPage(1);
                  setReportData(undefined);
                }}
                dir={isRTL ? "rtl" : "ltr"}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("SelectReportType")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="most-sold-items">
                    {t("MostSoldItems")}
                  </SelectItem>
                  <SelectItem value="revenue">{t("Revenue")}</SelectItem>
                  <SelectItem value="supplier-sales">
                    {t("SupplierSales")}
                  </SelectItem>
                  <SelectItem value="best-cashier">
                    {t("BestCashier")}
                  </SelectItem>
                  <SelectItem value="supplier-orders">
                    {t("SupplierOrders")}
                  </SelectItem>
                  <SelectItem value="supplier-refunds">
                    {t("SupplierRefunds")}
                  </SelectItem>
                  <SelectItem value="orders">{t("Orders")}</SelectItem>
                  <SelectItem value="refunds">{t("Refunds")}</SelectItem>
                  <SelectItem value="items-without-buy-price">
                    {t("ItemsWithoutBuyPrice")}
                  </SelectItem>
                  <SelectItem value="items-with-invalid-prices">
                    {t("ItemsWithInvalidPrices")}
                  </SelectItem>
                  <SelectItem value="items-with-sales-and-stock">
                    {t("ItemsWithSalesAndStock")}
                  </SelectItem>
                  <SelectItem value="revenue-by-category">
                    {t("RevenueByCategory")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 w-full">
              <Label>{t("StartDate")}</Label>
              <DatePicker date={startDate} onChange={setStartDate} />
            </div>

            <div className="space-y-2 w-full">
              <Label>{t("EndDate")}</Label>
              <DatePicker date={endDate} onChange={setEndDate} />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              onClick={handleGenerateReport}
              disabled={!startDate || !endDate || isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("GenerateReport")}
            </Button>
          </div>
        </form>
      </Card>

      {(reportData || isLoading) && (
        <Card className="p-6" dir={isRTL ? "rtl" : "ltr"}>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">
                {t("ReportResults")}
                {reportType === "none" && (
                  <>
                    ({(reportData as CategoryReport)?.categories?.length || 0}{" "}
                    {t("Categories")})
                  </>
                )}
              </h3>
              <div className="flex items-center gap-4">
                <DisplayLimit
                  limit={itemsPerPage}
                  onLimitChange={setItemsPerPage}
                  hasActiveFilters={false}
                  onClearFilters={() => {}}
                  isRtl={isRTL}
                  t={t}
                />
                <Button
                  variant="outline"
                  onClick={handleDownloadExcel}
                  disabled={isExporting || !reportData}
                >
                  {isExporting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  {t("DownloadExcel")}
                </Button>
              </div>
            </div>
            <div className="overflow-auto">{renderReportTable()}</div>
          </div>
        </Card>
      )}
    </main>
  );
};

export default ReportsPage;
