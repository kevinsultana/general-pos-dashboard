export type SubscriptionPlan = 'FREE' | 'PAID' | 'PRO';
export type SubscriptionStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED';

export interface User {
  id: string;
  username: string;
  displayName: string;
  role: {
    id: string;
    name: string;
    permissions?: Array<{ permission: { key: string } }>;
  };
  active: boolean;
  storeId: string;
}

export interface Store {
  id: string;
  name: string;
  ownerName?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  currency: string;
  timezone: string;
  language: string;
  businessType: 'GENERAL' | 'RESTAURANT';
  customerEnabled: boolean;
  draftEnabled: boolean;
  splitPaymentEnabled: boolean;
  refundEnabled: boolean;
  restaurantEnabled: boolean;
  kitchenPrintingEnabled: boolean;
  cashRoundingEnabled: boolean;
  cashRoundingIncrement: number;
  cashRoundingMode: 'ROUND_NEAREST' | 'ROUND_UP' | 'ROUND_DOWN';
  subscriptionPlan: SubscriptionPlan;
  subscriptionStatus: SubscriptionStatus;
  subscriptionExpiresAt?: string | null;
}

export interface Customer {
  id: string;
  storeId: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  createdAt: string;
  transactions?: Array<{ id: string; total: number; createdAt: string }>;
}

export interface PaymentMethod {
  id: string;
  storeId: string;
  name: string;
  type: 'CASH' | 'QRIS' | 'TRANSFER' | 'DEBIT' | 'CREDIT';
  active: boolean;
  requiresReference: boolean;
  sortOrder: number;
}


export interface Category {
  id: string;
  storeId: string;
  name: string;
  active: boolean;
  createdAt: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  sku?: string | null;
  barcode?: string | null;
  cost: number;
  sellingPrice: number;
  stock: number;
  lowStockThreshold: number;
  active: boolean;
}

export interface Product {
  id: string;
  storeId: string;
  categoryId: string;
  name: string;
  sku?: string | null;
  barcode?: string | null;
  cost: number;
  sellingPrice: number;
  stock: number;
  lowStockThreshold: number;
  active: boolean;
  category?: Category;
  variants?: ProductVariant[];
  createdAt: string;
}

export interface StockMovement {
  id: string;
  storeId: string;
  productId: string;
  variantId?: string | null;
  type: 'INITIAL' | 'PURCHASE' | 'SALE' | 'ADJUSTMENT' | 'TRANSFER' | 'RETURN' | 'CANCEL_REVERSAL';
  quantityDelta: number;
  unitCost: number;
  reason?: string | null;
  referenceType?: string | null;
  referenceId?: string | null;
  createdAt: string;
  product?: { name: string };
  createdBy?: { displayName: string };
}

export interface TransactionItem {
  id: string;
  transactionId: string;
  productId: string;
  productNameSnapshot: string;
  variantNameSnapshot?: string | null;
  quantity: number;
  unitPrice: number;
  unitCostSnapshot: number;
  discountAmount: number;
  subtotal: number;
  total: number;
}

export interface Payment {
  id: string;
  paymentMethodId: string;
  paymentMethod?: { id: string; name: string; type: string };
  amount: number;
  status: string;
  paidAt: string;
}

export interface Transaction {
  id: string;
  storeId: string;
  transactionNumber: string;
  status: 'COMPLETED' | 'CANCELLED';
  subtotal: number;
  discountTotal: number;
  roundingAmount: number;
  total: number;
  paidTotal: number;
  createdAt: string;
  completedAt?: string | null;
  cancelledAt?: string | null;
  items: TransactionItem[];
  payments: Payment[];
  customer?: { id: string; name: string; phone?: string | null } | null;
  createdBy?: { displayName: string; username: string };
  cancelledBy?: { displayName: string };
}

export interface Promotion {
  id: string;
  storeId: string;
  name: string;
  code?: string | null;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minSpend: number;
  active: boolean;
  startDate?: string | null;
  endDate?: string | null;
}

export interface DashboardSummary {
  store: {
    name: string;
    subscriptionPlan: SubscriptionPlan;
    subscriptionStatus: SubscriptionStatus;
  };
  revenue: {
    allTime: number;
    today: number;
    thisMonth: number;
  };
  transactions: {
    total: number;
    completed: number;
    cancelled: number;
    todayCount: number;
  };
  topProducts: Array<{
    name: string;
    totalQuantity: number;
    totalRevenue: number;
  }>;
  paymentBreakdown: Array<{
    paymentMethodId: string;
    paymentMethodName: string;
    totalAmount: number;
    transactionCount: number;
  }>;
  lowStockProducts: Array<{
    id: string;
    name: string;
    sku?: string | null;
    stock: number;
    sellingPrice: number;
    category?: { name: string };
  }>;
  recentTransactions: Array<{
    id: string;
    transactionNumber: string;
    status: string;
    total: number;
    createdAt: string;
    createdBy?: { displayName: string };
  }>;
}

export interface SubscriptionInfo {
  storeId: string;
  storeName: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  expiresAt: string | null;
  entitlements: {
    offlinePos: boolean;
    cloudSync: boolean;
    multiDevice: boolean;
    rolePermissions: boolean;
    inventoryTracking: boolean;
    webDashboard: boolean;
    advancedReports: boolean;
    exportData: boolean;
  };
}
