"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Store,
  ShoppingCart,
  X,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Clock,
  Search,
  Package,
  AlertCircle,
  Wallet,
  LogOut,
  Loader2,
  GitBranch,
  ArrowRight,
  Barcode,
  UtensilsCrossed,
  UserCheck,
  FileText,
  Pencil,
  Printer,
  RefreshCw,
  PauseCircle,
  Tag,
  Ticket,
} from "lucide-react";
import toast from "react-hot-toast";

// Context & auth
import { useAuth } from "../../../contexts/AuthContext";
import { useBluetooth, buildReceiptBytes } from "../../../contexts/BluetoothPrinterContext";

// Lib
import api from "../../../lib/api";
import { cn } from "../../../lib/utils";
import { fmt, formatRibuan } from "../../../lib/posUtils";

// Custom hooks
import { useCart } from "../../../hooks/pos/useCart";
import { useShift } from "../../../hooks/pos/useShift";

// Komponen POS (sudah diekstrak)
import VariantPickerModal from "../../../components/pos/VariantPickerModal";
import CheckoutModal from "../../../components/pos/CheckoutModal";
import OrderScannerModal from "../../../components/pos/OrderScannerModal";
import ProductCard from "../../../components/pos/ProductCard";

// Komponen POS lainnya (sudah ada sebelumnya)
import CustomerSelect from "../../../components/common/CustomerSelect";
import BluetoothModal from "../../../components/bluetooth/BluetoothModal";
import ThermalReceipt from "../../../components/pos/ThermalReceipt";
import TransactionSuccessModal from "../../../components/pos/TransactionSuccessModal";
import PromoModal from "../../../components/pos/PromoModal";
import HoldCartModal from "../../../components/pos/HoldCartModal";
import ShiftRecapModal from "../../../components/pos/ShiftRecapModal";

// ─── Layar Buka Shift (inline, bukan modal) ────────────────────────────────────
function NoShiftScreen({ onSuccess }) {
  const { user, activeBranch } = useAuth();
  const [startingCash, setStartingCash] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpen = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const res = await api.post("/shifts", {
        startingCash: parseFloat(startingCash) || 0,
      });
      if (res?.success) {
        toast.success("Shift berhasil dibuka. Selamat berjualan!");
        onSuccess(res.data);
      }
    } catch (err) {
      toast.error(err.message || "Gagal membuka shift.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center animate-in fade-in duration-300">
      <div className="w-full max-w-md space-y-6">

        {/* Ilustrasi atas */}
        <div className="text-center space-y-4">
          <div className="relative inline-flex">
            <div className="w-24 h-24 rounded-3xl bg-linear-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-xl shadow-amber-500/30">
              <Store className="w-12 h-12 text-white" />
            </div>
            <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-rose-500 border-2 border-white flex items-center justify-center">
              <Clock className="w-3 h-3 text-white" />
            </span>
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Buka Shift Kasir
            </h2>
            <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
              Shift belum dibuka. Mulai shift untuk bisa mencatat transaksi penjualan.
            </p>
          </div>

          {/* Info kasir & cabang */}
          <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-600">
            <span className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-lg bg-amber-500 flex items-center justify-center">
                <span className="text-white text-[9px] font-black">
                  {(user?.name || "U").charAt(0).toUpperCase()}
                </span>
              </div>
              {user?.name}
            </span>
            <span className="text-slate-300">·</span>
            <span className="flex items-center gap-1">
              <GitBranch className="w-3.5 h-3.5 text-slate-400" />
              {activeBranch?.name || "Cabang"}
            </span>
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={handleOpen}
          className="rounded-3xl bg-white/80 backdrop-blur-xl border border-white/90 shadow-[0_8px_30px_rgba(0,0,0,0.06)] p-6 space-y-5"
        >
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-amber-500" />
              Modal Awal Uang Laci (Rp)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 pointer-events-none select-none">
                Rp
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={formatRibuan(startingCash)}
                onChange={(e) =>
                  setStartingCash(e.target.value.replace(/\D/g, ""))
                }
                placeholder="0"
                className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 text-base font-bold text-slate-900 outline-none transition-all"
                autoFocus
              />
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Masukkan jumlah uang tunai di laci kasir sebelum mulai berjualan. Bisa diisi 0 jika tidak ada.
            </p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white font-extrabold text-sm shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Membuka shift...</span>
              </>
            ) : (
              <>
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Buka Shift & Mulai Berjualan</span>
                <ArrowRight className="w-4 h-4 text-slate-500 ml-auto" />
              </>
            )}
          </button>
        </form>

        {/* Tips */}
        <div className="flex items-start gap-2.5 px-4 py-3 rounded-2xl bg-blue-50/70 border border-blue-100 text-[11px] text-blue-700">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-blue-500" />
          <span>
            Setiap transaksi akan tercatat dalam shift ini. Tutup shift saat jam kerja selesai untuk melihat rekap penjualan.
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Halaman POS ───────────────────────────────────────────────────────────────
export default function POSPage() {
  const { user, tenant, activeBranch, activeBranchId, hasPermission } = useAuth();
  const { btStatus, btDeviceName, isConnected, isReconnecting, printBytes } = useBluetooth();

  // ── Custom hooks ─────────────────────────────────────────────────────────────
  const shiftHook = useShift(activeBranch, user);
  const {
    shift, setShift, shiftLoading, fetchActiveShift,
    closingCash, setClosingCash, isClosingShift,
    showCloseShift, setShowCloseShift,
    showShiftRecap, setShowShiftRecap,
    closedShiftData, handleCloseShift,
  } = shiftHook;

  const cartHook = useCart(activeBranchId);
  const {
    cart, editingNoteKey, setEditingNoteKey,
    selectedCustomer, setSelectedCustomer,
    activeOrder, setActiveOrder,
    appliedPromo, setAppliedPromo,
    heldCarts,
    addToCart, updateQty, updateNotes, removeItem, clearCart,
    holdCart, recallCart, deleteHeldCart,
    handleSelectOrder, handleUnlinkOrder,
    resetForBranch,
    cartSubtotal, cartCount, discountAmount, finalTotal,
  } = cartHook;

  // ── Product state ────────────────────────────────────────────────────────────
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [search, setSearch] = useState("");

  // ── Pending orders (QR self-order) ──────────────────────────────────────────
  const [pendingOrders, setPendingOrders] = useState([]);

  // ── Promotions ───────────────────────────────────────────────────────────────
  const [promotions, setPromotions] = useState([]);

  // ── Modal visibility ─────────────────────────────────────────────────────────
  const [variantPickerProduct, setVariantPickerProduct] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showHoldCartModal, setShowHoldCartModal] = useState(false);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [showOrderScannerModal, setShowOrderScannerModal] = useState(false);
  const [showBluetoothModal, setShowBluetoothModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // ── Print state ──────────────────────────────────────────────────────────────
  const [completedOrder, setCompletedOrder] = useState(null);
  const [activePrintOrder, setActivePrintOrder] = useState(null);
  const [printMode, setPrintMode] = useState("CUSTOMER");
  const [isPrinting, setIsPrinting] = useState(false);

  const storeInfo = {
    name: tenant?.name || activeBranch?.name || "OMNI POS",
    address: activeBranch?.address || "Cabang Utama",
    phone: activeBranch?.phone || "",
    printerWidth: 58,
    branchName: activeBranch?.name,
    receiptShowStoreName: true,
  };

  // ── Print handlers ───────────────────────────────────────────────────────────
  const handlePrintBluetooth = async (orderData, mode = "CUSTOMER") => {
    if (!orderData) return;
    if (!isConnected) { setShowBluetoothModal(true); return; }
    setIsPrinting(true);
    const toastId = toast.loading(
      `Mengirim ${mode === "KITCHEN" ? "tiket dapur" : "struk"} ke printer Bluetooth...`
    );
    try {
      const bytes = await buildReceiptBytes(orderData, storeInfo, mode);
      await printBytes(bytes);
      toast.success(
        `${mode === "KITCHEN" ? "Tiket dapur" : "Struk pelanggan"} berhasil dicetak!`,
        { id: toastId }
      );
    } catch (err) {
      toast.error(`Gagal mencetak: ${err.message || "Cek koneksi printer."}`, { id: toastId });
    } finally {
      setIsPrinting(false);
    }
  };

  const handlePrintBrowser = (orderData, mode = "CUSTOMER") => {
    if (!orderData) return;
    setActivePrintOrder(orderData);
    setPrintMode(mode);
    setTimeout(() => { window.print(); }, 150);
  };

  // ── Fetch helpers ────────────────────────────────────────────────────────────
  const fetchProducts = useCallback(async () => {
    try {
      setProductsLoading(true);
      const res = await api.get("/products");
      if (res?.success) setProducts(res.data.filter((p) => p.isActive));
    } catch {
      toast.error("Gagal memuat produk.");
    } finally {
      setProductsLoading(false);
    }
  }, [activeBranchId]);

  const fetchPendingOrders = useCallback(async () => {
    try {
      const res = await api.get("/orders/pending");
      if (res?.success) setPendingOrders(res.data || []);
    } catch {
      // background polling — silent
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

  // ── Effects ──────────────────────────────────────────────────────────────────

  // Reset saat cabang ganti
  const prevBranchRef = useRef(activeBranchId);
  useEffect(() => {
    if (prevBranchRef.current !== activeBranchId) {
      setSearch("");
      setProducts([]);
      setPendingOrders([]);
      resetForBranch(activeBranchId);
      prevBranchRef.current = activeBranchId;
    }
  }, [activeBranchId, resetForBranch]);

  // Fetch shift & promosi saat mount
  useEffect(() => {
    fetchActiveShift();
    fetchPromotions();
  }, [fetchActiveShift, fetchPromotions]);

  // Fetch produk & polling pesanan saat shift aktif
  useEffect(() => {
    if (shift) {
      fetchProducts();
      fetchPendingOrders();
      const interval = setInterval(fetchPendingOrders, 6000);
      return () => clearInterval(interval);
    }
  }, [shift, fetchProducts, fetchPendingOrders]);

  // ── Product interaction ──────────────────────────────────────────────────────
  const handleProductClick = (product) => {
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
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  // ── Checkout success ─────────────────────────────────────────────────────────
  const handleCheckoutSuccess = (checkoutInfo) => {
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
        (selectedCustomer?.value ? selectedCustomer?.label : activeOrder?.customerName || "Umum"),
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
  };

  // ── Loading / no-shift guards ─────────────────────────────────────────────────
  if (shiftLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Memeriksa shift aktif...</p>
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
    <div className="flex gap-5 h-[calc(100vh-120px)] animate-in fade-in duration-300">

      {/* ── Modal: Pilih Varian ── */}
      {variantPickerProduct && (
        <VariantPickerModal
          product={variantPickerProduct}
          onSelect={(product, variant) => {
            addToCart(product, variant);
            toast.success(`${product.name} – ${variant.name} ditambahkan`, { duration: 1200 });
          }}
          onClose={() => setVariantPickerProduct(null)}
        />
      )}

      {/* ── Modal: Checkout ── */}
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

      {/* ── Modal: Scan Barcode & Antrean ── */}
      <OrderScannerModal
        isOpen={showOrderScannerModal}
        onClose={() => setShowOrderScannerModal(false)}
        pendingOrders={pendingOrders}
        onSelectOrder={handleSelectOrder}
        onRefresh={fetchPendingOrders}
      />

      {/* ── Modal: Hold Cart ── */}
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
            `Promo "${promo.name}" diterapkan! Hemat ${fmt(promo.estimatedSavings || promo.discountValue)}`,
            { icon: "🎉" }
          );
        }}
        onRemovePromo={() => {
          setAppliedPromo(null);
          toast("Promo dihapus dari keranjang.", { icon: "✖️" });
        }}
      />

      {/* ── Modal: Shift Recap / Z-Report ── */}
      <ShiftRecapModal
        isOpen={showShiftRecap}
        onClose={() => {
          setShowShiftRecap(false);
        }}
        shift={closedShiftData}
        tenant={tenant}
        activeBranch={activeBranch}
      />

      {/* ── Modal: Tutup Shift ── */}
      {showCloseShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-white/95 backdrop-blur-2xl border border-white/90 shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900">Tutup Shift Kasir</h3>
              <button
                type="button"
                onClick={() => setShowCloseShift(false)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form
              onSubmit={(e) =>
                handleCloseShift(e, () => {
                  clearCart();
                  setAppliedPromo(null);
                })
              }
              className="p-6 space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Uang di Laci Saat Ini (Rp)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatRibuan(closingCash)}
                  onChange={(e) => setClosingCash(e.target.value.replace(/\D/g, ""))}
                  placeholder="0"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-amber-400 text-sm font-bold outline-none transition-all"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCloseShift(false)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isClosingShift}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-60"
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
          </div>
        </div>
      )}

      {/* ══ Sisi Kiri: Grid Produk ══════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Header kiri */}
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div>
            <h1 className="text-lg font-black text-slate-900">Kasir POS</h1>
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
            {/* Bluetooth printer button */}
            <button
              type="button"
              onClick={() => setShowBluetoothModal(true)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all border shadow-xs active:scale-95 cursor-pointer",
                isConnected
                  ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                  : isReconnecting
                  ? "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100"
                  : "bg-white/90 text-slate-700 border-slate-200 hover:bg-slate-100"
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
                    : "text-slate-500"
                )}
              />
              <span className="hidden sm:inline">
                {isConnected
                  ? btDeviceName || "Printer Siap"
                  : isReconnecting
                  ? "Reconnecting..."
                  : "Printer"}
              </span>
              {isConnected && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </button>

            {/* Scan / Pesanan Masuk */}
            <button
              type="button"
              onClick={() => setShowOrderScannerModal(true)}
              className="relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold text-amber-900 bg-amber-100/90 border border-amber-300 hover:bg-amber-200 shadow-xs transition-all active:scale-95"
            >
              <Barcode className="w-4 h-4 text-amber-700" />
              <span>Scan / Pesanan Masuk</span>
              {pendingOrders.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black animate-pulse">
                  {pendingOrders.length}
                </span>
              )}
            </button>

            {/* Tutup Shift */}
            <button
              type="button"
              onClick={() => setShowCloseShift(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Tutup Shift</span>
            </button>
          </div>
        </div>

        {/* Search produk */}
        <div className="relative mb-4 shrink-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari produk..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/80 backdrop-blur-xl border border-white/90 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-amber-400/40 transition-all shadow-sm"
          />
        </div>

        {/* Grid produk */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
          {productsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {[...Array(8)].map((_, i) => (
                <div key={`skeleton-${i}`} className="h-28 rounded-2xl bg-white/60 animate-pulse" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
              <Package className="w-10 h-10 text-slate-300" />
              <p className="text-sm font-bold text-slate-600">
                {search ? "Produk tidak ditemukan" : "Belum ada produk"}
              </p>
              <p className="text-xs text-slate-400">
                {search
                  ? `Tidak ada hasil untuk "${search}"`
                  : "Tambahkan produk di menu Produk"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 gap-3 pb-4">
              {filteredProducts.map((p, idx) => (
                <ProductCard
                  key={p.id || `product-${idx}`}
                  product={p}
                  onClick={handleProductClick}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ══ Sisi Kanan: Keranjang Belanja ════════════════════════════════════════ */}
      <div className="w-80 shrink-0 flex flex-col rounded-3xl bg-white/80 backdrop-blur-xl border border-white/90 shadow-[0_8px_32px_0_rgba(31,38,135,0.08)] overflow-hidden">

        {/* Header keranjang */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-black text-slate-900">Keranjang</span>
            {cartCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-extrabold">
                {cartCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {heldCarts.length > 0 && (
              <button
                type="button"
                onClick={() => setShowHoldCartModal(true)}
                title="Lihat daftar keranjang yang sedang ditahan"
                className="relative flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-extrabold text-amber-900 bg-amber-100 border border-amber-300 hover:bg-amber-200 transition-colors shadow-2xs"
              >
                <PauseCircle className="w-3 h-3 text-amber-700" />
                <span>Antrean ({heldCarts.length})</span>
              </button>
            )}
            {cart.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="text-[11px] font-bold text-slate-400 hover:text-rose-600 transition-colors"
              >
                Kosongkan
              </button>
            )}
          </div>
        </div>

        {/* Pemilih Pelanggan & Kaitan Pesanan */}
        <div className="p-3 border-b border-slate-100 bg-slate-50/50 space-y-2">
          {activeOrder && (
            <div className="p-2.5 rounded-2xl bg-amber-500/15 border border-amber-300 text-amber-950 flex items-start justify-between gap-2 text-xs">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 font-black">
                  <UtensilsCrossed className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span className="truncate">#{activeOrder.orderNumber}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-amber-200/90 text-amber-900 shrink-0">
                    {activeOrder.orderType === "DINE_IN"
                      ? `Meja ${activeOrder.tableNumber || "-"}`
                      : "Takeaway"}
                  </span>
                </div>
                <p className="text-[11px] font-medium text-amber-900/90 mt-0.5 truncate">
                  {activeOrder.customerName}{" "}
                  {activeOrder.customerPhone ? `(${activeOrder.customerPhone})` : ""}
                </p>
                {(activeOrder.customer || activeOrder.customerId) && (
                  <div className="mt-1 flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-600/15 border border-emerald-400/50 text-emerald-900 text-[10px] font-black">
                    <UserCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>Pelanggan Terdaftar di DB & Terpilih</span>
                  </div>
                )}
                {activeOrder.notes && (
                  <p className="text-[10px] italic text-amber-800/90 mt-0.5 line-clamp-1">
                    "{activeOrder.notes}"
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={handleUnlinkOrder}
                title="Lepas kaitan pesanan"
                className="p-1 rounded-lg hover:bg-amber-200/70 text-amber-800 transition-colors shrink-0"
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

        {/* List item keranjang */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-center">
              <ShoppingCart className="w-8 h-8 text-slate-200" />
              <p className="text-xs font-semibold text-slate-400">
                Klik produk untuk menambahkan
              </p>
            </div>
          ) : (
            cart.map((item, idx) => {
              const isEditingNote = editingNoteKey === item.key;
              return (
                <div
                  key={item.key || item.variantId || `cart-item-${idx}`}
                  className="p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors space-y-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{item.productName}</p>
                      <p className="text-[11px] text-slate-400">{item.variantName}</p>
                      <p className="text-xs font-extrabold text-emerald-700 mt-0.5">
                        {fmt(item.price * item.qty)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => updateQty(item.key, -1)}
                        className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-extrabold text-slate-900">
                        {item.qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQty(item.key, 1)}
                        className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(item.key)}
                        className="w-6 h-6 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 flex items-center justify-center transition-colors ml-0.5"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Catatan per item */}
                  {isEditingNote ? (
                    <div className="pt-2 border-t border-slate-200/60 flex items-center gap-1.5 animate-in fade-in duration-150">
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
                        placeholder="Tulis catatan (cth: Pedas, es sedikit)..."
                        className="flex-1 px-2.5 py-1 text-[11px] rounded-lg bg-white border border-amber-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 text-slate-800 placeholder:text-slate-400 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setEditingNoteKey(null)}
                        className="px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[10px] font-bold hover:bg-slate-800 transition-colors shrink-0"
                      >
                        Selesai
                      </button>
                    </div>
                  ) : item.notes ? (
                    <div className="pt-1.5 border-t border-slate-200/60 flex items-center justify-between gap-1 group/note">
                      <button
                        type="button"
                        onClick={() => setEditingNoteKey(item.key)}
                        className="flex items-center gap-1 text-[11px] text-amber-900 bg-amber-50 hover:bg-amber-100/80 border border-amber-200/80 px-2 py-0.5 rounded-lg text-left transition-colors flex-1 min-w-0"
                        title="Klik untuk mengubah catatan"
                      >
                        <FileText className="w-3 h-3 text-amber-600 shrink-0" />
                        <span className="truncate italic">"{item.notes}"</span>
                        <Pencil className="w-2.5 h-2.5 text-amber-500 shrink-0 opacity-0 group-hover/note:opacity-100 transition-opacity ml-auto" />
                      </button>
                      <button
                        type="button"
                        onClick={() => updateNotes(item.key, "")}
                        title="Hapus catatan"
                        className="p-1 rounded-md text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="pt-1 border-t border-slate-200/40">
                      <button
                        type="button"
                        onClick={() => setEditingNoteKey(item.key)}
                        className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400 hover:text-amber-700 hover:bg-amber-50/80 px-1.5 py-0.5 rounded-md transition-colors"
                      >
                        <FileText className="w-2.5 h-2.5" />
                        <span>+ Tambah Catatan</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer: Total & Checkout */}
        <div className="p-4 border-t border-slate-100 space-y-3">

          {/* Applied promo badge */}
          {appliedPromo && (
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-xs animate-in fade-in duration-200">
              <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                <Ticket className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">{appliedPromo.name}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-extrabold text-emerald-700">- {fmt(discountAmount)}</span>
                <button
                  type="button"
                  onClick={() => setAppliedPromo(null)}
                  className="p-0.5 rounded-md text-emerald-500 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                  title="Hapus promo"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="space-y-1.5">
            {discountAmount > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-500">Subtotal</span>
                <span className="font-bold text-slate-600">{fmt(cartSubtotal)}</span>
              </div>
            )}
            {discountAmount > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-emerald-700">Diskon Promo</span>
                <span className="font-bold text-emerald-700">- {fmt(discountAmount)}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total</span>
              <span className="text-xl font-black text-slate-900">{fmt(finalTotal)}</span>
            </div>
          </div>

          {/* Tombol Promo */}
          <button
            type="button"
            onClick={() => setShowPromoModal(true)}
            disabled={cart.length === 0}
            className={`w-full py-2.5 rounded-2xl border text-xs font-extrabold flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed ${
              appliedPromo
                ? "bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100"
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>
              {appliedPromo
                ? `Ganti Promo (${appliedPromo.code || appliedPromo.name})`
                : "Promo & Diskon"}
            </span>
          </button>

          {/* Tahan & Checkout */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={holdCart}
              disabled={!shift || cart.length === 0}
              title="Tahan pesanan aktif ini ke antrean (Hold Cart)"
              className="py-3.5 px-3.5 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-800 font-extrabold flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shrink-0 shadow-2xs cursor-pointer"
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
              className="flex-1 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm shadow-md shadow-slate-900/15 flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-40 cursor-pointer"
            >
              <CreditCard className="w-4 h-4 text-amber-400" />
              <span>Checkout</span>
            </button>
          </div>

          {!shift && (
            <p className="text-[11px] text-slate-400 text-center">
              Buka shift terlebih dahulu untuk memulai transaksi
            </p>
          )}
        </div>
      </div>

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
