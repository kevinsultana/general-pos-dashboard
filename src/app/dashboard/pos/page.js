"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Barcode,
  UtensilsCrossed,
  UserCheck,
  FileText,
  Pencil,
  Printer,
  PauseCircle,
  Tag,
  Ticket,
  LogOut,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

// Context
import { useAuth } from "../../../contexts/AuthContext";

// Lib & Utils
import api from "../../../lib/api";
import { cn } from "../../../lib/utils";
import { fmt, formatRibuan } from "../../../lib/posUtils";

// Custom Hooks (Refactored & Modularized)
import { useShift } from "../../../hooks/pos/useShift";
import { useCart } from "../../../hooks/pos/useCart";
import { usePosProducts } from "../../../hooks/pos/usePosProducts";
import { usePrintReceipt } from "../../../hooks/pos/usePrintReceipt";

// UI Atomic Primitives (Modern Clean Glassmorphism)
import GlassCard from "../../../components/ui/GlassCard";
import GlassModal from "../../../components/ui/GlassModal";
import SearchInput from "../../../components/ui/SearchInput";
import Badge from "../../../components/ui/Badge";
import EmptyState from "../../../components/ui/EmptyState";

// POS Sub-components
import NoShiftScreen from "../../../components/pos/NoShiftScreen";
import ProductCard from "../../../components/pos/ProductCard";
import VariantPickerModal from "../../../components/pos/VariantPickerModal";
import CheckoutModal from "../../../components/pos/CheckoutModal";
import OrderScannerModal from "../../../components/pos/OrderScannerModal";
import CustomerSelect from "../../../components/common/CustomerSelect";
import PromoModal from "../../../components/pos/PromoModal";
import HoldCartModal from "../../../components/pos/HoldCartModal";
import ShiftRecapModal from "../../../components/pos/ShiftRecapModal";
import BluetoothModal from "../../../components/bluetooth/BluetoothModal";
import TransactionSuccessModal from "../../../components/pos/TransactionSuccessModal";
import ThermalReceipt from "../../../components/pos/ThermalReceipt";

export default function POSPage() {
  const { user, tenant, activeBranch, activeBranchId } = useAuth();

  // ── Custom Hooks ─────────────────────────────────────────────────────────────
  const shiftHook = useShift(activeBranch, user);
  const {
    shift,
    setShift,
    shiftLoading,
    fetchActiveShift,
    closingCash,
    setClosingCash,
    isClosingShift,
    showCloseShift,
    setShowCloseShift,
    showShiftRecap,
    setShowShiftRecap,
    closedShiftData,
    handleCloseShift,
  } = shiftHook;

  const cartHook = useCart(activeBranchId);
  const {
    cart,
    editingNoteKey,
    setEditingNoteKey,
    selectedCustomer,
    setSelectedCustomer,
    activeOrder,
    setActiveOrder,
    appliedPromo,
    setAppliedPromo,
    heldCarts,
    addToCart,
    updateQty,
    updateNotes,
    removeItem,
    clearCart,
    holdCart,
    recallCart,
    deleteHeldCart,
    handleSelectOrder,
    handleUnlinkOrder,
    resetForBranch,
    cartSubtotal,
    cartCount,
    discountAmount,
    finalTotal,
  } = cartHook;

  const productsHook = usePosProducts(activeBranchId);
  const {
    products,
    productsLoading,
    search,
    setSearch,
    selectedCategory,
    setSelectedCategory,
    categories,
    filteredProducts,
    fetchProducts,
    resetProductsForBranch,
  } = productsHook;

  const printHook = usePrintReceipt({ tenant, activeBranch });
  const {
    btDeviceName,
    isConnected,
    isReconnecting,
    showBluetoothModal,
    setShowBluetoothModal,
    showSuccessModal,
    setShowSuccessModal,
    completedOrder,
    setCompletedOrder,
    activePrintOrder,
    setActivePrintOrder,
    printMode,
    isPrinting,
    storeInfo,
    handlePrintBluetooth,
    handlePrintBrowser,
  } = printHook;

  // ── Local Modal & Auxiliary States ───────────────────────────────────────────
  const [variantPickerProduct, setVariantPickerProduct] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showHoldCartModal, setShowHoldCartModal] = useState(false);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [showOrderScannerModal, setShowOrderScannerModal] = useState(false);

  // ── Pending Orders & Promotions ──────────────────────────────────────────────
  const [pendingOrders, setPendingOrders] = useState([]);
  const [promotions, setPromotions] = useState([]);

  const fetchPendingOrders = useCallback(async () => {
    try {
      const res = await api.get("/orders/pending");
      if (res?.success) setPendingOrders(res.data || []);
    } catch {
      // background silent polling
    }
  }, [activeBranchId]);

  const fetchPromotions = useCallback(async () => {
    try {
      const res = await api.get("/promotions?activeOnly=true");
      if (res?.success && Array.isArray(res.data)) setPromotions(res.data);
    } catch {
      // silent fallback
    }
  }, []);

  // ── Sync pergantian cabang ───────────────────────────────────────────────────
  const prevBranchRef = useRef(activeBranchId);
  useEffect(() => {
    if (prevBranchRef.current !== activeBranchId) {
      resetForBranch(activeBranchId);
      resetProductsForBranch();
      setPendingOrders([]);
      prevBranchRef.current = activeBranchId;
    }
  }, [activeBranchId, resetForBranch, resetProductsForBranch]);

  // ── Lifecycle shift & promotions ─────────────────────────────────────────────
  useEffect(() => {
    fetchActiveShift();
    fetchPromotions();
  }, [fetchActiveShift, fetchPromotions]);

  // ── Fetch produk & polling pesanan saat shift aktif ─────────────────────────
  useEffect(() => {
    if (shift) {
      fetchProducts();
      fetchPendingOrders();
      const interval = setInterval(fetchPendingOrders, 6000);
      return () => clearInterval(interval);
    }
  }, [shift, fetchProducts, fetchPendingOrders]);

  // ── Product Click Handler ───────────────────────────────────────────────────
  const handleProductClick = useCallback(
    (product) => {
      if (product.isActive === false) {
        toast.error(`Produk "${product.name}" sedang habis stok.`, { icon: "🚫" });
        return;
      }
      if (!product.variants || product.variants.length === 0) return;
      if (product.variants.length === 1) {
        addToCart(product, product.variants[0]);
        toast.success(`${product.name} ditambahkan`, { duration: 1200 });
      } else {
        setVariantPickerProduct(product);
      }
    },
    [addToCart]
  );

  // ── Checkout Success Handler ────────────────────────────────────────────────
  const handleCheckoutSuccess = useCallback(
    (checkoutInfo) => {
      setShowCheckout(false);
      const completedOrderData = {
        receiptNumber:
          checkoutInfo.transaction?.receiptNumber ||
          `TRX-${Date.now().toString().slice(-6)}`,
        createdAt: checkoutInfo.transaction?.createdAt || new Date().toISOString(),
        tableNumber: activeOrder?.tableNumber || null,
        orderType:
          activeOrder?.orderType ||
          (activeOrder?.tableNumber ? "DINE_IN" : "TAKEAWAY"),
        cashierName: user?.name || "Kasir",
        customerName:
          selectedCustomer?.customer?.name ||
          (selectedCustomer?.value
            ? selectedCustomer?.label
            : activeOrder?.customerName || "Umum"),
        customerPhone:
          selectedCustomer?.customer?.phone || activeOrder?.customerPhone || null,
        items: cart.map((item) => ({
          productName: item.productName,
          variantName: item.variantName,
          quantity: item.qty,
          price: item.price,
          subtotal: item.price * item.qty,
          notes: item.notes || "",
        })),
        subtotal: cartSubtotal,
        totalAmount: checkoutInfo.transaction?.totalAmount || finalTotal,
        discountAmount: checkoutInfo.discountAmount || discountAmount || 0,
        paymentMethod: checkoutInfo.paymentMethod,
        cashReceived: checkoutInfo.cashReceived,
        changeAmount: checkoutInfo.changeAmount,
      };

      setCompletedOrder(completedOrderData);
      setActivePrintOrder(completedOrderData);
      setShowSuccessModal(true);

      clearCart();
      setAppliedPromo(null);
      setSelectedCustomer(null);
      setActiveOrder(null);
      fetchPendingOrders();
    },
    [
      activeOrder,
      user,
      selectedCustomer,
      cart,
      cartSubtotal,
      finalTotal,
      discountAmount,
      setCompletedOrder,
      setActivePrintOrder,
      setShowSuccessModal,
      clearCart,
      setAppliedPromo,
      setSelectedCustomer,
      setActiveOrder,
      fetchPendingOrders,
    ]
  );

  // ── Loading & Guard ──────────────────────────────────────────────────────────
  if (shiftLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-500">
            Memeriksa shift aktif...
          </p>
        </div>
      </div>
    );
  }

  if (!shift) {
    return (
      <NoShiftScreen
        onSuccess={(newShift) => {
          setShift(newShift);
          fetchProducts();
        }}
      />
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col lg:flex-row gap-4 sm:gap-5 h-[calc(100vh-115px)] max-h-[calc(100vh-115px)] overflow-hidden animate-in fade-in duration-300">

      {/* ── Modal: Pilih Varian ── */}
      <VariantPickerModal
        product={variantPickerProduct}
        onSelect={(product, variant) => {
          addToCart(product, variant);
          toast.success(`${product.name} – ${variant.name} ditambahkan`, {
            duration: 1200,
          });
        }}
        onClose={() => setVariantPickerProduct(null)}
      />

      {/* ── Modal: Checkout & Pembayaran ── */}
      {showCheckout && (
        <CheckoutModal
          cart={cart}
          shift={shift}
          selectedCustomer={selectedCustomer}
          activeOrder={activeOrder}
          discountAmount={discountAmount}
          appliedPromoCode={appliedPromo?.code}
          onSuccess={handleCheckoutSuccess}
          onClose={() => setShowCheckout(false)}
        />
      )}

      {/* ── Modal: Scan Barcode & Antrean QR ── */}
      <OrderScannerModal
        isOpen={showOrderScannerModal}
        onClose={() => setShowOrderScannerModal(false)}
        pendingOrders={pendingOrders}
        onSelectOrder={handleSelectOrder}
        onRefresh={fetchPendingOrders}
      />

      {/* ── Modal: Hold Cart (Antrean Tertahan) ── */}
      <HoldCartModal
        isOpen={showHoldCartModal}
        onClose={() => setShowHoldCartModal(false)}
        heldCarts={heldCarts}
        onRecall={recallCart}
        onDelete={deleteHeldCart}
      />

      {/* ── Modal: Promo & Diskon ── */}
      <PromoModal
        isOpen={showPromoModal}
        onClose={() => setShowPromoModal(false)}
        promotions={promotions}
        cart={cart}
        subtotal={cartSubtotal}
        appliedPromo={appliedPromo}
        onSelectPromo={(promo) => {
          setAppliedPromo(promo);
          setShowPromoModal(false);
          toast.success(
            `Promo "${promo.name}" diterapkan! Hemat ${fmt(
              promo.estimatedSavings || promo.discountValue
            )}`,
            { icon: "🎉" }
          );
        }}
        onRemovePromo={() => {
          setAppliedPromo(null);
          toast("Promo dihapus dari keranjang.", { icon: "✖️" });
        }}
      />

      {/* ── Modal: Z-Report (Shift Recap) ── */}
      <ShiftRecapModal
        isOpen={showShiftRecap}
        onClose={() => setShowShiftRecap(false)}
        shift={closedShiftData}
        tenant={tenant}
        activeBranch={activeBranch}
      />

      {/* ── Modal: Tutup Shift ── */}
      <GlassModal
        isOpen={showCloseShift}
        onClose={() => setShowCloseShift(false)}
        title="Tutup Shift Kasir"
        description="Rekap pendapatan dan sesuaikan uang laci kasir"
        size="sm"
      >
        <form
          onSubmit={(e) =>
            handleCloseShift(e, () => {
              clearCart();
              setAppliedPromo(null);
            })
          }
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Uang di Laci Saat Ini (Rp)
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={formatRibuan(closingCash)}
              onChange={(e) =>
                setClosingCash(e.target.value.replace(/\D/g, ""))
              }
              placeholder="0"
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:border-amber-400 text-sm font-black text-slate-900 outline-none transition-all"
              autoFocus
            />
          </div>

          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setShowCloseShift(false)}
              className="flex-1 min-h-11 rounded-2xl text-xs font-extrabold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isClosingShift}
              className="flex-1 min-h-11 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-60 cursor-pointer shadow-sm"
            >
              {isClosingShift ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Tutup Shift</span>
                </>
              )}
            </button>
          </div>
        </form>
      </GlassModal>

      {/* ══ SISI KIRI: KATALOG PRODUK ═══════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Baris Header Atas */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3 shrink-0">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Kasir POS
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Shift dibuka{" "}
              {new Date(shift.startTime).toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              · {activeBranch?.name}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Tombol Printer Bluetooth */}
            <button
              type="button"
              onClick={() => setShowBluetoothModal(true)}
              className={cn(
                "min-h-10 flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-extrabold transition-all border shadow-2xs active:scale-95 cursor-pointer backdrop-blur-md",
                isConnected
                  ? "bg-emerald-500/10 text-emerald-800 border-emerald-300 hover:bg-emerald-500/20"
                  : isReconnecting
                  ? "bg-amber-500/10 text-amber-800 border-amber-300 hover:bg-amber-500/20"
                  : "bg-white/80 text-slate-700 border-white/60 hover:bg-white"
              )}
              title="Pengaturan Koneksi Printer Bluetooth"
            >
              <Printer
                className={cn(
                  "w-4 h-4",
                  isConnected
                    ? "text-emerald-600"
                    : isReconnecting
                    ? "text-amber-600 animate-spin"
                    : "text-slate-400"
                )}
              />
              <span className="hidden sm:inline">
                {isConnected
                  ? btDeviceName || "Printer Siap"
                  : isReconnecting
                  ? "Menghubungkan..."
                  : "Printer"}
              </span>
              {isConnected && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </button>

            {/* Tombol Scan Barcode & Pesanan QR */}
            <button
              type="button"
              onClick={() => setShowOrderScannerModal(true)}
              className="min-h-10 relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl text-xs font-black text-amber-950 bg-amber-400/20 border border-amber-300/80 hover:bg-amber-400/30 backdrop-blur-md shadow-2xs transition-all active:scale-95 cursor-pointer"
            >
              <Barcode className="w-4 h-4 text-amber-700" />
              <span className="hidden md:inline">Scan / Pesanan QR</span>
              <span className="md:hidden">Scan</span>
              {pendingOrders.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black animate-pulse">
                  {pendingOrders.length}
                </span>
              )}
            </button>

            {/* Tombol Tutup Shift */}
            <button
              type="button"
              onClick={() => setShowCloseShift(true)}
              className="min-h-10 flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold text-rose-600 bg-rose-50/80 border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tutup Shift</span>
            </button>
          </div>
        </div>

        {/* Baris Pencarian & Kategori */}
        <div className="space-y-2.5 mb-3 shrink-0">
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari produk atau scan barcode..."
          />

          {/* Chips Kategori */}
          {categories.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 text-xs select-none">
              <button
                type="button"
                onClick={() => setSelectedCategory("ALL")}
                className={cn(
                  "min-h-8 px-3 py-1 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer",
                  selectedCategory === "ALL"
                    ? "bg-slate-900 hover:bg-slate-800 text-white shadow-xs"
                    : "bg-white/70 border border-white/60 text-slate-600 hover:bg-white"
                )}
              >
                Semua Menu ({products.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "min-h-8 px-3 py-1 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer",
                    selectedCategory === cat
                      ? "bg-slate-900 hover:bg-slate-800 text-white shadow-xs"
                      : "bg-white/70 border border-white/60 text-slate-600 hover:bg-white"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Grid Produk (Scrollable) */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 pb-4">
          {productsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {[...Array(8)].map((_, i) => (
                <div
                  key={`skeleton-${i}`}
                  className="h-32 rounded-3xl bg-white/50 animate-pulse border border-white/40"
                />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <EmptyState
              title={search ? "Produk tidak ditemukan" : "Belum ada produk"}
              description={
                search
                  ? `Tidak ada hasil pencarian untuk "${search}".`
                  : "Silakan tambahkan produk di menu Manajemen Produk."
              }
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredProducts.map((p, idx) => (
                <ProductCard
                  key={p.id || `prod-${idx}`}
                  product={p}
                  onClick={handleProductClick}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ══ SISI KANAN: PANEL KERANJANG BELANJA ═════════════════════════════════ */}
      <GlassCard className="w-full lg:w-80 xl:w-92 shrink-0 flex flex-col overflow-hidden max-h-full">

        {/* Header Keranjang */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-black text-slate-900">
              Keranjang
            </span>
            {cartCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black">
                {cartCount}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {heldCarts.length > 0 && (
              <button
                type="button"
                onClick={() => setShowHoldCartModal(true)}
                title="Lihat antrean pesanan tertahan"
                className="min-h-8 flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-black text-amber-950 bg-amber-400/20 border border-amber-300/80 hover:bg-amber-400/30 transition-all cursor-pointer"
              >
                <PauseCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>Antrean ({heldCarts.length})</span>
              </button>
            )}

            {cart.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="text-[11px] font-bold text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
              >
                Kosongkan
              </button>
            )}
          </div>
        </div>

        {/* Pemilih Pelanggan & Kaitan Pesanan QR */}
        <div className="p-3 border-b border-slate-100 bg-slate-50/50 space-y-2 shrink-0">
          {activeOrder && (
            <div className="p-2.5 rounded-2xl bg-amber-500/15 border border-amber-300/80 text-amber-950 flex items-start justify-between gap-2 text-xs">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 font-black">
                  <UtensilsCrossed className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span className="truncate">#{activeOrder.orderNumber}</span>
                  <Badge variant="primary" size="sm">
                    {activeOrder.orderType === "DINE_IN"
                      ? `Meja ${activeOrder.tableNumber || "-"}`
                      : "Takeaway"}
                  </Badge>
                </div>
                <p className="text-[11px] font-medium mt-0.5 truncate opacity-90">
                  {activeOrder.customerName}{" "}
                  {activeOrder.customerPhone ? `(${activeOrder.customerPhone})` : ""}
                </p>
                {(activeOrder.customer || activeOrder.customerId) && (
                  <div className="mt-1 flex items-center gap-1.5 text-emerald-800 text-[10px] font-black">
                    <UserCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>Pelanggan Terdaftar di DB</span>
                  </div>
                )}
                {activeOrder.notes && (
                  <p className="text-[10px] italic mt-0.5 line-clamp-1 opacity-80">
                    "{activeOrder.notes}"
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={handleUnlinkOrder}
                title="Lepas kaitan pesanan"
                className="p-1 rounded-lg hover:bg-amber-200/70 text-amber-800 transition-colors shrink-0 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <CustomerSelect
            value={selectedCustomer}
            onChange={(opt) => setSelectedCustomer(opt)}
          />
        </div>

        {/* Daftar Item Keranjang (Scrollable) */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-44 gap-2.5 text-center">
              <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-300">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-400">
                Klik produk di sebelah kiri untuk menambah ke keranjang
              </p>
            </div>
          ) : (
            cart.map((item, idx) => {
              const isEditingNote = editingNoteKey === item.key;
              return (
                <div
                  key={item.key || item.variantId || `cart-item-${idx}`}
                  className="p-3 rounded-2xl bg-white/70 border border-slate-100 hover:border-slate-200 transition-all space-y-2"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-slate-900 truncate">
                        {item.productName}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {item.variantName}
                      </p>
                      <p className="text-xs font-extrabold text-emerald-700 mt-0.5">
                        {fmt(item.price * item.qty)}
                      </p>
                    </div>

                    {/* Tombol Kuantitas (- / + / trash) */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => updateQty(item.key, -1)}
                        className="w-7 h-7 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-black text-slate-900">
                        {item.qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQty(item.key, 1)}
                        className="w-7 h-7 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(item.key)}
                        className="w-7 h-7 rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50 flex items-center justify-center transition-colors ml-0.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Catatan Per Item */}
                  {isEditingNote ? (
                    <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 animate-in fade-in duration-150">
                      <input
                        type="text"
                        autoFocus
                        value={item.notes || ""}
                        onChange={(e) => updateNotes(item.key, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            setEditingNoteKey(null);
                          }
                        }}
                        placeholder="Contoh: Pedas, es sedikit..."
                        className="flex-1 px-2.5 py-1 text-[11px] rounded-xl bg-white border border-amber-300 focus:ring-1 focus:ring-amber-500 text-slate-800 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setEditingNoteKey(null)}
                        className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black transition-colors shrink-0 cursor-pointer"
                      >
                        Selesai
                      </button>
                    </div>
                  ) : item.notes ? (
                    <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between gap-1 group/note">
                      <button
                        type="button"
                        onClick={() => setEditingNoteKey(item.key)}
                        className="flex items-center gap-1 text-[11px] text-amber-900 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-lg text-left transition-colors flex-1 min-w-0 cursor-pointer"
                        title="Klik untuk ubah catatan"
                      >
                        <FileText className="w-3 h-3 text-amber-600 shrink-0" />
                        <span className="truncate italic">"{item.notes}"</span>
                        <Pencil className="w-2.5 h-2.5 text-amber-500 shrink-0 opacity-0 group-hover/note:opacity-100 transition-opacity ml-auto" />
                      </button>
                      <button
                        type="button"
                        onClick={() => updateNotes(item.key, "")}
                        title="Hapus catatan"
                        className="p-1 rounded-md text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="pt-1 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setEditingNoteKey(item.key)}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-amber-700 px-1.5 py-0.5 rounded-md transition-colors cursor-pointer"
                      >
                        <FileText className="w-2.5 h-2.5" />
                        <span>+ Catatan</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer Keranjang: Total, Promo & Checkout */}
        <div className="p-4 border-t border-slate-100 space-y-3 shrink-0">

          {/* Badge Promo yang Diterapkan */}
          {appliedPromo && (
            <div className="flex items-center justify-between px-3 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-300 text-xs animate-in fade-in duration-200">
              <div className="flex items-center gap-1.5 font-black text-emerald-800 truncate">
                <Ticket className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">{appliedPromo.name}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-black text-emerald-700">
                  - {fmt(discountAmount)}
                </span>
                <button
                  type="button"
                  onClick={() => setAppliedPromo(null)}
                  className="p-0.5 rounded-md text-emerald-500 hover:text-rose-500 transition-colors cursor-pointer"
                  title="Hapus promo"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Rincian Subtotal & Total */}
          <div className="space-y-1">
            {discountAmount > 0 && (
              <>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Subtotal</span>
                  <span className="font-bold">{fmt(cartSubtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-emerald-700 font-bold">
                  <span>Diskon Promo</span>
                  <span>- {fmt(discountAmount)}</span>
                </div>
              </>
            )}

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-black text-slate-500 uppercase tracking-wider">
                Total
              </span>
              <span className="text-xl font-black text-slate-900">
                {fmt(finalTotal)}
              </span>
            </div>
          </div>

          {/* Tombol Promo */}
          <button
            type="button"
            onClick={() => setShowPromoModal(true)}
            disabled={cart.length === 0}
            className={cn(
              "w-full min-h-10 py-2 rounded-2xl border text-xs font-black flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer",
              appliedPromo
                ? "bg-emerald-500/10 border-emerald-300 text-emerald-800"
                : "bg-white/70 border-slate-200/80 text-slate-700 hover:bg-white"
            )}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>
              {appliedPromo
                ? `Promo: ${appliedPromo.code || appliedPromo.name}`
                : "Gunakan Promo & Diskon"}
            </span>
          </button>

          {/* Baris Tombol Aksi Kasir: Tahan & Checkout */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={holdCart}
              disabled={!shift || cart.length === 0}
              title="Tahan pesanan aktif ini ke antrean (Hold Cart)"
              className="min-h-12 py-3.5 px-3.5 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-300/80 text-amber-900 font-black flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shrink-0 cursor-pointer"
            >
              <PauseCircle className="w-5 h-5 text-amber-600" />
              <span className="text-xs hidden xl:inline">Tahan</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (cart.length === 0) return toast.error("Keranjang masih kosong.");
                setShowCheckout(true);
              }}
              disabled={!shift || cart.length === 0}
              className="flex-1 min-h-12 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-sm shadow-md shadow-slate-900/15 flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-40 cursor-pointer"
            >
              <CreditCard className="w-4 h-4 text-amber-400" />
              <span>Checkout</span>
            </button>
          </div>
        </div>
      </GlassCard>

      {/* ── Modal: Transaksi Sukses & Cetak Struk ── */}
      <TransactionSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        orderData={completedOrder}
        storeInfo={storeInfo}
        onPrintBluetooth={handlePrintBluetooth}
        onPrintBrowser={handlePrintBrowser}
        isPrinting={isPrinting}
        isConnected={isConnected}
        onOpenBluetoothModal={() => setShowBluetoothModal(true)}
      />

      {/* ── Modal: Koneksi Bluetooth Printer ── */}
      <BluetoothModal
        isOpen={showBluetoothModal}
        onClose={() => setShowBluetoothModal(false)}
        userName={user?.name || "Kasir"}
        storeInfo={storeInfo}
        onConnectedContinue={
          showSuccessModal && completedOrder
            ? () => handlePrintBluetooth(completedOrder, "CUSTOMER")
            : undefined
        }
      />

      {/* ── Struk Thermal untuk Browser Print (@media print) ── */}
      <ThermalReceipt
        order={activePrintOrder}
        store={storeInfo}
        printMode={printMode}
      />
    </div>
  );
}
