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
  Banknote,
  QrCode,
  Clock,
  Search,
  Package,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Wallet,
  Receipt,
  LogOut,
  Loader2,
  GitBranch,
  ArrowRight,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../../contexts/AuthContext";
import api from "../../../lib/api";
import CustomerSelect from "../../../components/common/CustomerSelect";

// ─── Formatter ────────────────────────────────────────────────────────────────
const fmt = (n) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(n) || 0);

// ─── Metode Pembayaran ─────────────────────────────────────────────────────────
const PAYMENT_METHODS = [
  { key: "CASH", label: "Tunai", icon: Banknote, color: "bg-emerald-50 border-emerald-300 text-emerald-800" },
  { key: "QRIS", label: "QRIS", icon: QrCode, color: "bg-violet-50 border-violet-300 text-violet-800" },
  { key: "TRANSFER", label: "Transfer", icon: CreditCard, color: "bg-blue-50 border-blue-300 text-blue-800" },
];

// ─── Layar Buka Shift (inline, bukan modal) ───────────────────────────────────
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
                type="number"
                value={startingCash}
                onChange={(e) => setStartingCash(e.target.value)}
                placeholder="0"
                min="0"
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


// ─── Modal Pilih Varian ────────────────────────────────────────────────────────
function VariantPickerModal({ product, onSelect, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xs rounded-3xl bg-white/95 backdrop-blur-2xl border border-white/90 shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-black text-slate-900">Pilih Varian</h3>
            <p className="text-xs text-slate-500 mt-0.5 truncate max-w-45">{product.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 space-y-1.5 max-h-72 overflow-y-auto">
          {product.variants.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => onSelect(product, v)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-amber-50 border border-transparent hover:border-amber-200 transition-all group text-left"
            >
              <div>
                <p className="text-sm font-bold text-slate-900 group-hover:text-amber-800">
                  {v.name}
                </p>
                <p className="text-[11px] text-slate-400">Modal: {fmt(v.costPrice)}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-emerald-700">{fmt(v.price)}</span>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-amber-500 transition-colors" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Modal Checkout ────────────────────────────────────────────────────────────
function CheckoutModal({ cart, shift, selectedCustomer, onSuccess, onClose }) {
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);

  const handleCheckout = async () => {
    if (!paymentMethod) return toast.error("Pilih metode pembayaran.");

    const items = cart.map((i) => ({
      productVariantId: i.variantId,
      quantity: i.qty,
    }));

    try {
      setIsSubmitting(true);
      const res = await api.post("/transactions/checkout", {
        shiftId: shift.id,
        paymentMethod,
        customerId: selectedCustomer?.customer?.id || null,
        customerName: selectedCustomer?.customer?.name || (selectedCustomer?.value ? selectedCustomer?.label : null),
        customerPhone: selectedCustomer?.customer?.phone || null,
        items,
      });
      if (res?.success) {
        toast.success(`Transaksi ${res.data.receiptNumber} berhasil!`);
        onSuccess(res.data);
      }
    } catch (err) {
      toast.error(err.message || "Checkout gagal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-3xl bg-white/95 backdrop-blur-2xl border border-white/90 shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
              <Receipt className="w-4.5 h-4.5 text-emerald-600" />
            </div>
            <h3 className="text-sm font-black text-slate-900">Konfirmasi Pembayaran</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Ringkasan */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
            {/* Info Pelanggan Terpilih */}
            {selectedCustomer?.value && (
              <div className="pb-2 mb-2 border-b border-slate-200/80 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-semibold">Pelanggan:</span>
                <span className="font-extrabold text-amber-800 bg-amber-100/60 px-2 py-0.5 rounded-md">
                  {selectedCustomer.label}
                </span>
              </div>
            )}
            {cart.map((item) => (
              <div key={item.key} className="flex items-center justify-between text-xs">
                <span className="text-slate-700 font-semibold">
                  {item.productName} <span className="text-slate-400">({item.variantName})</span> ×{item.qty}
                </span>
                <span className="font-bold text-slate-900">{fmt(item.price * item.qty)}</span>
              </div>
            ))}
            <div className="pt-2 mt-2 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Total</span>
              <span className="text-lg font-black text-emerald-700">{fmt(total)}</span>
            </div>
          </div>

          {/* Pilih Metode Pembayaran */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Metode Pembayaran
            </p>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_METHODS.map((m) => {
                const Icon = m.icon;
                const selected = paymentMethod === m.key;
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setPaymentMethod(m.key)}
                    className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl border-2 font-bold text-xs transition-all ${
                      selected
                        ? "border-amber-400 bg-amber-50 text-amber-800 shadow-md shadow-amber-500/10"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${selected ? "text-amber-600" : "text-slate-400"}`} />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tombol Bayar */}
          <button
            type="button"
            onClick={handleCheckout}
            disabled={!paymentMethod || isSubmitting}
            className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Proses Pembayaran</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Kartu Produk di Grid ─────────────────────────────────────────────────────
function ProductCard({ product, onClick }) {
  const firstVariant = product.variants?.[0];
  const hasMultiVariant = product.variants?.length > 1;

  return (
    <button
      type="button"
      onClick={() => onClick(product)}
      className="p-4 rounded-2xl bg-white/80 backdrop-blur-xl border border-white/90 shadow-sm hover:shadow-md hover:border-amber-200 hover:-translate-y-0.5 transition-all text-left group active:scale-95"
    >
      {/* Icon produk */}
      <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center mb-3 group-hover:bg-amber-100 transition-colors">
        <Package className="w-5 h-5 text-amber-600" />
      </div>

      {/* Nama */}
      <p className="text-xs font-black text-slate-900 line-clamp-2 leading-snug">{product.name}</p>

      {/* Harga & varian badge */}
      <div className="mt-2 flex items-center justify-between gap-1">
        <span className="text-xs font-extrabold text-emerald-700">
          {firstVariant ? fmt(firstVariant.price) : "—"}
        </span>
        {hasMultiVariant && (
          <span className="px-1.5 py-0.5 rounded-md bg-violet-100 text-violet-700 text-[10px] font-bold border border-violet-200">
            {product.variants.length} varian
          </span>
        )}
      </div>
    </button>
  );
}

// ─── Halaman POS ──────────────────────────────────────────────────────────────
export default function POSPage() {
  const { user, activeBranch, activeBranchId, hasPermission } = useAuth();

  const [shift, setShift] = useState(null);
  const [shiftLoading, setShiftLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [search, setSearch] = useState("");

  // Cart: [{ key, variantId, productName, variantName, price, costPrice, qty }]
  const [cart, setCart] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Modals
  const [variantPickerProduct, setVariantPickerProduct] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showCloseShift, setShowCloseShift] = useState(false);
  const [closingCash, setClosingCash] = useState("");
  const [isClosingShift, setIsClosingShift] = useState(false);

  // ── Fetch shift aktif ──────────────────────────────────────────────────────
  const fetchActiveShift = useCallback(async () => {
    try {
      setShiftLoading(true);
      const res = await api.get("/shifts/active");
      setShift(res?.data || null);
    } catch {
      setShift(null);
    } finally {
      setShiftLoading(false);
    }
  }, [activeBranchId]);

  // ── Fetch produk ───────────────────────────────────────────────────────────
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

  // ── Reset saat cabang ganti ────────────────────────────────────────────────
  const prevBranchRef = useRef(activeBranchId);
  useEffect(() => {
    if (prevBranchRef.current !== activeBranchId) {
      // Branch ganti: reset semua state
      setShift(null);
      setCart([]);
      setSelectedCustomer(null);
      setSearch("");
      setProducts([]);
      prevBranchRef.current = activeBranchId;
    }
  }, [activeBranchId]);

  useEffect(() => {
    fetchActiveShift();
  }, [fetchActiveShift]);

  useEffect(() => {
    if (shift) fetchProducts();
  }, [shift, fetchProducts]);

  // ── Cart helpers ───────────────────────────────────────────────────────────
  const addToCart = (product, variant) => {
    const key = variant.id;
    setCart((prev) => {
      const existing = prev.find((i) => i.key === key);
      if (existing) {
        return prev.map((i) => i.key === key ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, {
        key,
        variantId: variant.id,
        productName: product.name,
        variantName: variant.name,
        price: parseFloat(variant.price),
        costPrice: parseFloat(variant.costPrice),
        qty: 1,
      }];
    });
    setVariantPickerProduct(null);
  };

  const updateQty = (key, delta) => {
    setCart((prev) =>
      prev
        .map((i) => i.key === key ? { ...i, qty: i.qty + delta } : i)
        .filter((i) => i.qty > 0)
    );
  };

  const removeItem = (key) => setCart((prev) => prev.filter((i) => i.key !== key));

  const clearCart = () => setCart([]);

  // ── Klik produk ───────────────────────────────────────────────────────────
  const handleProductClick = (product) => {
    if (!product.variants || product.variants.length === 0) return;
    if (product.variants.length === 1) {
      addToCart(product, product.variants[0]);
      toast.success(`${product.name} ditambahkan`, { duration: 1200 });
    } else {
      setVariantPickerProduct(product);
    }
  };

  // ── Tutup shift ───────────────────────────────────────────────────────────
  const handleCloseShift = async (e) => {
    e.preventDefault();
    try {
      setIsClosingShift(true);
      const res = await api.put(`/shifts/${shift.id}/close`, {
        endingCash: parseFloat(closingCash) || 0,
      });
      if (res?.success) {
        toast.success("Shift berhasil ditutup.");
        setShift(null);
        setCart([]);
        setShowCloseShift(false);
      }
    } catch (err) {
      toast.error(err.message || "Gagal menutup shift.");
    } finally {
      setIsClosingShift(false);
    }
  };

  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  // ── Loading state ──────────────────────────────────────────────────────────
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

  // ── Belum ada shift: tampilkan layar buka shift penuh ──────────────────────
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
          onSuccess={() => {
            setShowCheckout(false);
            clearCart();
            setSelectedCustomer(null);
          }}
          onClose={() => setShowCheckout(false)}
        />
      )}

      {/* ── Modal: Tutup Shift ── */}
      {showCloseShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-white/95 backdrop-blur-2xl border border-white/90 shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900">Tutup Shift Kasir</h3>
              <button type="button" onClick={() => setShowCloseShift(false)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCloseShift} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Uang di Laci Saat Ini (Rp)
                </label>
                <input
                  type="number"
                  value={closingCash}
                  onChange={(e) => setClosingCash(e.target.value)}
                  placeholder="0"
                  min="0"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-amber-400 text-sm font-bold outline-none transition-all"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowCloseShift(false)} className="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors">
                  Batal
                </button>
                <button type="submit" disabled={isClosingShift} className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-60">
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

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* Sisi Kiri: Grid Produk                                               */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
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
          <button
            type="button"
            onClick={() => setShowCloseShift(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Tutup Shift</span>
          </button>
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
                <div key={i} className="h-28 rounded-2xl bg-white/60 animate-pulse" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
              <Package className="w-10 h-10 text-slate-300" />
              <p className="text-sm font-bold text-slate-600">
                {search ? "Produk tidak ditemukan" : "Belum ada produk"}
              </p>
              <p className="text-xs text-slate-400">
                {search ? `Tidak ada hasil untuk "${search}"` : "Tambahkan produk di menu Produk"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 gap-3 pb-4">
              {filteredProducts.map((p) => (
                <ProductCard key={p.id} product={p} onClick={handleProductClick} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* Sisi Kanan: Keranjang Belanja                                        */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
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

        {/* Pemilih Pelanggan POS */}
        <div className="p-3 border-b border-slate-100 bg-slate-50/50">
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
            cart.map((item) => (
              <div
                key={item.key}
                className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100"
              >
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
            ))
          )}
        </div>

        {/* Footer keranjang: Total & Checkout */}
        <div className="p-4 border-t border-slate-100 space-y-3">
          {/* Summary */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total</span>
            <span className="text-xl font-black text-slate-900">{fmt(cartTotal)}</span>
          </div>

          {/* Tombol Checkout */}
          <button
            type="button"
            onClick={() => {
              if (cart.length === 0) return toast.error("Keranjang masih kosong.");
              setShowCheckout(true);
            }}
            disabled={!shift || cart.length === 0}
            className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm shadow-md shadow-slate-900/15 flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-40"
          >
            <CreditCard className="w-4 h-4 text-amber-400" />
            <span>Checkout</span>
          </button>

          {!shift && (
            <p className="text-[11px] text-slate-400 text-center">
              Buka shift terlebih dahulu untuk memulai transaksi
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
