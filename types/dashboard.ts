export type DateRange =
  | "today"
  | "thisWeek"
  | "thisMonth"
  | "lastMonth"
  | "thisYear";

export interface DashboardMetric {
  label: string;
  value: string;
  previousValue?: string;
  trend?: number; // Percentage change
  icon: React.ComponentType<{ className?: string }>;
}

export interface ChartDataPoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface InventoryStatusItem {
  name: string;
  value: number;
}

export interface TopSellingItem {
  id: string;
  name: string;
  quantity: number;
}

export interface TopRevenueItem {
  id: string;
  name: string;
  revenue: number;
}

export interface RecentOrder {
  id: string;
  orderNumber: string;
  totalAmount: number;
  createdAt: Date;
  currency: string;
  topSellingItems: TopSellingItem[];
  topRevenueItems: TopRevenueItem[];
}

export interface RecentSupplierOrder {
  id: string;
  invoiceNumber: string | null;
  totalAmount: number;
  createdAt: Date;
  currency: string;
  supplier: {
    name: string;
  };
}

export interface LowStockItem {
  id: string;
  name: string;
  inStock: number;
}

export interface DashboardData {
  revenue: {
    total: number;
    trend: string;
  };
  orders: {
    total: number;
    trend: string;
  };
  items: {
    total: number;
    trend: string;
  };
  suppliers: {
    total: number;
    trend: string;
  };
  salesData: {
    daily: ChartDataPoint[];
    monthly: ChartDataPoint[];
  };
  inventoryStatus: InventoryStatusItem[];
  topSellingItems: TopSellingItem[];
  topRevenueItems: TopRevenueItem[];
  recentOrders: RecentOrder[];
  recentSupplierOrders: RecentSupplierOrder[];
  lowStockItems: LowStockItem[];
  categoryStats: CategoryStat[];
  paymentStats: PaymentStat[];
  supplierBalances: SupplierBalance[];
}

export interface CategoryStat {
  name: string;
  itemCount: number;
  stockCount: number;
}

export interface PaymentStat {
  type: string;
  count: number;
  amount: number;
}

export interface SupplierBalance {
  name: string;
  iqdBalance: number;
  usdBalance: number;
}
