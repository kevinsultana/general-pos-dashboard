export type SubscriptionPlan = 'FREE' | 'PAID' | 'PRO';
export type SubscriptionStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED';

export interface Permission {
  id: string;
  key: string;
  description: string;
  category: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string | null;
  isSystem: boolean;
  userCount?: number;
  permissions: string[];
  createdAt?: string;
  updatedAt?: string;
}

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

export interface SyncStatusData {
  totalEvents: number;
  deviceCount: number;
  devices: Array<{
    deviceId: string;
    cursor: string;
    updatedAt: string;
  }>;
  recentEvents: Array<{
    id: string;
    deviceId: string;
    entityType: string;
    entityId: string;
    operation: string;
    status: string;
    createdAt: string;
    syncedAt?: string | null;
  }>;
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

export type PaymentMethodType = 'CASH' | 'QRIS' | 'TRANSFER' | 'DEBIT' | 'CREDIT';

export interface PaymentMethod {
  id: string;
  storeId: string;
  name: string;
  type: PaymentMethodType;
  active: boolean;
  requiresReference: boolean;
  sortOrder: number;
}

export interface Printer {
  id: string;
  storeId: string;
  name: string;
  connectionType: 'BLUETOOTH' | 'USB' | 'NETWORK';
  addressReference?: string | null;
  paperSize: 'PAPER_58MM' | 'PAPER_80MM';
  role: 'RECEIPT' | 'KITCHEN' | 'BOTH';
  receiptCopies: number;
  kitchenCopies: number;
  autoPrint: boolean;
  active: boolean;
  configuration?: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
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

export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'VOIDED';

export interface Payment {
  id: string;
  paymentMethodId: string;
  paymentMethod?: { id: string; name: string; type: PaymentMethodType | string };
  amount: number;
  status: PaymentStatus;
  paidAt: string;
}

export type TransactionStatus =
  | 'DRAFT'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'PARTIALLY_REFUNDED'
  | 'REFUNDED';

export interface RefundItem {
  id: string;
  refundId: string;
  transactionItemId: string;
  quantity: number;
  amount: number;
  transactionItem?: TransactionItem;
}

export type RefundStatus = 'COMPLETED' | 'VOIDED';

export interface Refund {
  id: string;
  transactionId: string;
  amount: number;
  reason: string;
  status: RefundStatus;
  createdAt: string;
  createdBy?: { id?: string; displayName: string; username?: string };
  items?: RefundItem[];
}

export type OrderType = 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY' | 'ONLINE';

export interface Transaction {
  id: string;
  storeId: string;
  transactionNumber: string;
  status: TransactionStatus;
  orderType?: OrderType | null;
  queueNumber?: string | null;
  subtotal: number;
  discountTotal: number;
  roundingAmount: number;
  total: number;
  paidTotal: number;
  createdAt: string;
  completedAt?: string | null;
  cancelledAt?: string | null;
  refundedAt?: string | null;
  items: TransactionItem[];
  payments: Payment[];
  refunds?: Refund[];
  customer?: { id: string; name: string; phone?: string | null } | null;
  createdBy?: { displayName: string; username: string };
  cancelledBy?: { displayName: string };
}

export interface Promotion {
  id: string;
  storeId: string;
  name: string;
  code?: string | null;
  type?: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FIXED';
  discountType?: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FIXED';
  value?: number;
  discountValue?: number;
  minimumPurchase?: number | null;
  minSpend?: number;
  active: boolean;
  startAt?: string | null;
  endAt?: string | null;
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
