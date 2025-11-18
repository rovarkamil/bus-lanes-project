import { Currency } from "@prisma/client";

export interface CartItem {
  cartEntryId: string;
  id: string;
  name: string;
  bundleSellPrice: number;
  singleSellPrice: number;
  originalBundlePrice: number;
  originalSinglePrice: number;
  barcodes: string[];
  quantity: number;
  isBundle: boolean;
  currency: Currency;
  itemsInBundle: number;
  bundleBuyPrice: number;
  singleBuyPrice: number;
}

export interface RemovedOrderItem {
  itemId: string;
  name: string;
  quantity: number;
  sellPriceAtOrder: number;
  buyPriceAtOrder: number;
  isBundle: boolean;
  removedAt: number;
}

export interface Tab {
  id: string;
  orderNumber: string;
  cart: CartItem[];
  deletedItems: string[];
  removedItems: RemovedOrderItem[];
}

export interface SavedOrder {
  orderNumber: string;
  orderItems: {
    itemId: string;
    name: string;
    quantity: number;
    sellPriceAtOrder: number;
    buyPriceAtOrder: number;
    isBundle: boolean;
  }[];
  removedOrderItems: RemovedOrderItem[];
  amountReceived: number;
  change: number;
  timestamp: number;
  orderDate: number;
  cashierSessionId: string;
}

export interface SavedRefund {
  refundNumber: string;
  refundItems: {
    itemId: string;
    name: string;
    quantity: number;
    sellPriceAtOrder: number;
    buyPriceAtOrder: number;
    isBundle: boolean;
  }[];
  totalAmount: number;
  timestamp: number;
  cashierSessionId: string;
}
