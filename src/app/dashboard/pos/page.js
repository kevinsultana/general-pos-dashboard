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
  Barcode,
  UtensilsCrossed,
  ShoppingBag,
  UserCheck,
  Phone,
  FileText,
  Pencil,
  Printer,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../../contexts/AuthContext";
import api from "../../../lib/api";
import CustomerSelect from "../../../components/common/CustomerSelect";
import { useBluetooth, buildReceiptBytes } from "../../../contexts/BluetoothPrinterContext";
import BluetoothModal from "../../../components/bluetooth/BluetoothModal";
import ThermalReceipt from "../../../components/pos/ThermalReceipt";
import TransactionSuccessModal from "../../../components/pos/TransactionSuccessModal";
import { cn } from "../../../lib/utils";

// ─── Formatter ────────────────────────────────────────────────────────────────
const fmt = (n) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(n) || 0);

const formatRibuan = (val) => {
  if (val === undefined || val === null || val === "") return "";
  const clean = String(val).replace(/\D/g, "");
  if (!clean) return "";
  return new Intl.NumberFormat("id-ID").format(Number(clean));
};

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
                type="text"
                inputMode="numeric"
                value={formatRibuan(startingCash)}
                onChange={(e) => setStartingCash(e.target.value.replace(/\D/g, ""))}
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
          {product.variants.map((v, vIdx) => (
            <button
              key={v.id || `variant-${vIdx}`}
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
function CheckoutModal({ cart, shift, selectedCustomer, activeOrder, onSuccess, onClose }) {
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [cashReceived, setCashReceived] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);

  const handleCheckout = async () => {
    if (!paymentMethod) return toast.error("Pilih metode pembayaran.");

    const items = cart.map((i) => ({
      productVariantId: i.variantId,
      quantity: i.qty,
      notes: i.notes || undefined,
    }));

    try {
      setIsSubmitting(true);
      const res = await api.post("/transactions/checkout", {
        shiftId: shift.id,
        paymentMethod,
        customerId: selectedCustomer?.customer?.id || null,
        customerName: selectedCustomer?.customer?.name || (selectedCustomer?.value ? selectedCustomer?.label : null),
        customerPhone: selectedCustomer?.customer?.phone || null,
        orderId: activeOrder?.id || null,
        orderNumber: activeOrder?.orderNumber || null,
        items,
      });
      if (res?.success) {
        const receivedVal = paymentMethod === "CASH" ? (parseFloat(cashReceived) || total) : total;
        const changeVal = paymentMethod === "CASH" ? Math.max(0, receivedVal - total) : 0;
        toast.success(`Transaksi ${res.data.receiptNumber} berhasil!`);
        onSuccess({
          transaction: res.data,
          paymentMethod,
          cashReceived: receivedVal,
          changeAmount: changeVal,
        });
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
            {/* Info Pesanan Meja / Barcode jika ada */}
            {activeOrder && (
              <div className="pb-2 mb-2 border-b border-slate-200/80 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-semibold">Pesanan Meja:</span>
                <span className="font-extrabold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Barcode className="w-3 h-3 text-amber-700" />
                  #{activeOrder.orderNumber} {activeOrder.tableNumber ? `(Meja ${activeOrder.tableNumber})` : ""}
                </span>
              </div>
            )}

            {/* Info Pelanggan Terpilih */}
            {(selectedCustomer?.customer || selectedCustomer?.label) && (
              <div className="pb-2 mb-2 border-b border-slate-200/80 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-semibold">Pelanggan:</span>
                <span className="font-extrabold text-slate-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{selectedCustomer.label || selectedCustomer.customer?.name}</span>
                </span>
              </div>
            )}
            {cart.map((item, idx) => (
              <div key={item.key || item.variantId || `checkout-item-${idx}`} className="space-y-0.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-700 font-semibold">
                    {item.productName} <span className="text-slate-400">({item.variantName})</span> ×{item.qty}
                  </span>
                  <span className="font-bold text-slate-900">{fmt(item.price * item.qty)}</span>
                </div>
                {item.notes && (
                  <p className="text-[10px] text-amber-800 italic bg-amber-50/80 border border-amber-200/60 px-2 py-0.5 rounded inline-block max-w-full truncate">
                    Catatan: {item.notes}
                  </p>
                )}
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

          {/* Input Tunai jika CASH */}
          {paymentMethod === "CASH" && (
            <div className="space-y-2 p-3 rounded-2xl bg-amber-50/70 border border-amber-200">
              <label className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block">
                Uang Tunai Diterima (Rp)
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={formatRibuan(cashReceived)}
                onChange={(e) => setCashReceived(e.target.value.replace(/\D/g, ""))}
                placeholder={`Uang Pas (${fmt(total)})`}
                className="w-full px-3 py-2 rounded-xl bg-white border border-amber-300 focus:border-amber-500 text-sm font-extrabold text-slate-800 outline-none transition-all"
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setCashReceived(String(total))}
                  className="px-2.5 py-1 rounded-lg bg-amber-200/80 hover:bg-amber-300 text-[10px] font-bold text-amber-900 transition-colors cursor-pointer"
                >
                  Uang Pas
                </button>
                {[50000, 100000, 200000].map(
                  (nominal) =>
                    nominal >= total && (
                      <button
                        key={nominal}
                        type="button"
                        onClick={() => setCashReceived(String(nominal))}
                        className="px-2.5 py-1 rounded-lg bg-white border border-amber-200 hover:bg-amber-100 text-[10px] font-bold text-slate-700 transition-colors cursor-pointer"
                      >
                        {new Intl.NumberFormat("id-ID").format(nominal)}
                      </button>
                    )
                )}
              </div>
              <div className="pt-2 border-t border-amber-200/80 flex items-center justify-between text-xs">
                <span className="font-bold text-amber-900">Kembalian:</span>
                <span className="font-black text-amber-950 text-sm">
                  {fmt(Math.max(0, (Number(cashReceived) || total) - total))}
                </span>
              </div>
            </div>
          )}

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

// ─── Modal Scan Barcode & Antrean Pesanan Pelanggan ──────────────────────────
function OrderScannerModal({
  isOpen,
  onClose,
  pendingOrders = [],
  onSelectOrder,
  onRefresh,
}) {
  const [scanCode, setScanCode] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setScanCode("");
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleLookup = async (codeToLookup) => {
    const raw = codeToLookup || scanCode;
    const clean = raw.trim().replace(/^#/, "").toUpperCase();
    if (!clean) {
      toast.error("Ketik atau scan nomor pesanan terlebih dahulu.");
      return;
    }

    try {
      setIsSearching(true);
      const res = await api.get(`/orders/lookup/${encodeURIComponent(clean)}`);
      if (res?.success && res.data) {
        if (res.data.status !== "PENDING") {
          toast.error(`Pesanan #${res.data.orderNumber} statusnya sudah "${res.data.status}".`);
          return;
        }
        onSelectOrder(res.data);
        onClose();
      }
    } catch (err) {
      toast.error(err.message || "Pesanan tidak ditemukan.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleCancelOrder = async (order) => {
    if (!window.confirm(`Batalkan pesanan #${order.orderNumber} (${order.customerName})?`)) {
      return;
    }
    try {
      const res = await api.post(`/orders/${order.id}/cancel`);
      if (res?.success) {
        toast.success(`Pesanan #${order.orderNumber} berhasil dibatalkan.`);
        onRefresh();
      }
    } catch (err) {
      toast.error(err.message || "Gagal membatalkan pesanan.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center">
              <Barcode className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Scan Barcode & Antrean Pesanan</h3>
              <p className="text-[11px] text-slate-400">Pindai barcode HP pelanggan atau pilih antrean</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input Scanner Barcode */}
        <div className="space-y-1.5 shrink-0">
          <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
            Scanner Barcode / Masukkan Kode Pesanan
          </label>
          <div className="relative flex items-center">
            <Barcode className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={scanCode}
              onChange={(e) => setScanCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleLookup(scanCode);
                }
              }}
              placeholder="Arahkan scanner atau ketik contoh: ORD-882194..."
              className="w-full pl-10 pr-24 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-500 font-mono text-xs font-bold text-slate-900 outline-none uppercase transition-all"
            />
            <button
              type="button"
              disabled={isSearching}
              onClick={() => handleLookup(scanCode)}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold transition-all disabled:opacity-60"
            >
              {isSearching ? "Mencari..." : "Cari & Muat"}
            </button>
          </div>
          <p className="text-[10px] text-slate-400">
            Mendukung laser scanner USB/Bluetooth maupun ketik kode manual lalu tekan Enter.
          </p>
        </div>

        {/* Daftar Pesanan Pending */}
        <div className="space-y-2 overflow-y-auto pr-1 flex-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-extrabold text-slate-700 uppercase tracking-wider text-[11px]">
              Pesanan Menunggu ({pendingOrders.length})
            </span>
            <button
              type="button"
              onClick={onRefresh}
              className="text-[11px] font-bold text-amber-700 hover:underline"
            >
              Segarkan Antrean
            </button>
          </div>

          {pendingOrders.length === 0 ? (
            <div className="p-8 rounded-2xl border border-dashed border-slate-200 text-center space-y-2">
              <ShoppingBag className="w-7 h-7 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-500">Tidak ada pesanan menggantung</p>
              <p className="text-[11px] text-slate-400">
                Pesanan yang dibuat oleh pelanggan melalui QR menu meja akan tampil di sini.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {pendingOrders.map((ord, ordIdx) => {
                const isRegistered = Boolean(ord.customer || ord.customerId);
                const phoneDisplay = ord.customerPhone || ord.customer?.phone;

                return (
                  <div
                    key={ord.id || ord.orderNumber || `pending-ord-${ordIdx}`}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-amber-300 transition-colors space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-mono font-black text-slate-900 text-xs bg-white px-2 py-0.5 rounded-md border border-slate-200">
                            #{ord.orderNumber}
                          </span>
                          <span className="text-xs font-black text-slate-800 truncate">
                            {ord.customerName}
                          </span>
                          {isRegistered ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <UserCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span>Pelanggan Terdaftar di DB</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                              Tamu Baru
                            </span>
                          )}
                        </div>

                        {/* Info No Telp & Meja */}
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px]">
                          {phoneDisplay ? (
                            <span className="font-bold text-slate-700 flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                              <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span>{phoneDisplay}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10px]">Tanpa No. HP</span>
                          )}

                          <span className="text-slate-500 font-semibold flex items-center gap-1">
                            {ord.orderType === "DINE_IN" ? (
                              <>
                                <UtensilsCrossed className="w-3 h-3 text-amber-600" />
                                <span>Dine-In {ord.tableNumber ? `(Meja ${ord.tableNumber})` : ""}</span>
                              </>
                            ) : (
                              <span>Takeaway</span>
                            )}
                            <span>·</span>
                            <span>{ord.items?.length || 0} item</span>
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-black text-amber-700 text-sm block">
                          Rp {parseFloat(ord.totalAmount).toLocaleString("id-ID")}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(ord.createdAt).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Tombol Aksi */}
                    <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleCancelOrder(ord)}
                        className="text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:underline"
                      >
                        Batalkan
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onSelectOrder(ord);
                          onClose();
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs flex items-center gap-1 shadow-xs active:scale-95 transition-all"
                      >
                        <span>Muat ke Keranjang</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Kartu Produk di Grid ─────────────────────────────────────────────────────
function ProductCard({ product, onClick }) {
  const firstVariant = product.variants?.[0];
  const hasMultiVariant = product.variants?.length > 1;
  const isOutOfStock = product.isActive === false;

  return (
    <button
      type="button"
      onClick={() => onClick(product)}
      className={`p-4 rounded-2xl border transition-all text-left group relative overflow-hidden ${
        isOutOfStock
          ? "bg-slate-100/90 border-slate-200/90 opacity-70 cursor-not-allowed hover:border-slate-300"
          : "bg-white/80 backdrop-blur-xl border-white/90 shadow-sm hover:shadow-md hover:border-amber-200 hover:-translate-y-0.5 active:scale-95 cursor-pointer"
      }`}
    >
      {/* Icon produk & Badge Habis */}
      <div className="flex items-start justify-between mb-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
            isOutOfStock
              ? "bg-slate-200 text-slate-400"
              : "bg-amber-50 border border-amber-100 text-amber-600 group-hover:bg-amber-100"
          }`}
        >
          <Package className="w-5 h-5" />
        </div>

        {isOutOfStock && (
          <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 text-[10px] font-black tracking-wide border border-rose-200">
            HABIS
          </span>
        )}
      </div>

      {/* Nama */}
      <p
        className={`text-xs font-black line-clamp-2 leading-snug ${
          isOutOfStock ? "text-slate-500 line-through decoration-slate-400" : "text-slate-900"
        }`}
      >
        {product.name}
      </p>

      {/* Harga & varian badge */}
      <div className="mt-2 flex items-center justify-between gap-1">
        <span
          className={`text-xs font-extrabold ${
            isOutOfStock ? "text-slate-400" : "text-emerald-700"
          }`}
        >
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
  const { user, tenant, activeBranch, activeBranchId, hasPermission } = useAuth();
  const { btStatus, btDeviceName, isConnected, isReconnecting, printBytes } = useBluetooth();

  const [shift, setShift] = useState(null);
  const [shiftLoading, setShiftLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [search, setSearch] = useState("");

  // Cart: [{ key, variantId, productName, variantName, price, costPrice, qty, notes }]
  const [cart, setCart] = useState([]);
  const [editingNoteKey, setEditingNoteKey] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Modals
  const [variantPickerProduct, setVariantPickerProduct] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showCloseShift, setShowCloseShift] = useState(false);
  const [closingCash, setClosingCash] = useState("");
  const [isClosingShift, setIsClosingShift] = useState(false);

  // Pending self-order queue & barcode scanner
  const [pendingOrders, setPendingOrders] = useState([]);
  const [showOrderScannerModal, setShowOrderScannerModal] = useState(false);
  const [activeOrder, setActiveOrder] = useState(null);

  // Bluetooth Thermal Printer & Receipt State
  const [showBluetoothModal, setShowBluetoothModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
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

  const handlePrintBluetooth = async (orderData, mode = "CUSTOMER") => {
    if (!orderData) return;
    if (!isConnected) {
      setShowBluetoothModal(true);
      return;
    }

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
    setTimeout(() => {
      window.print();
    }, 150);
  };

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

  // ── Fetch pesanan online/self-order pending ────────────────────────────────
  const fetchPendingOrders = useCallback(async () => {
    try {
      const res = await api.get("/orders/pending");
      if (res?.success) {
        setPendingOrders(res.data || []);
      }
    } catch {
      // background polling silent error
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
      setActiveOrder(null);
      setPendingOrders([]);
      prevBranchRef.current = activeBranchId;
    }
  }, [activeBranchId]);

  useEffect(() => {
    fetchActiveShift();
  }, [fetchActiveShift]);

  useEffect(() => {
    if (shift) {
      fetchProducts();
      fetchPendingOrders();
      const interval = setInterval(fetchPendingOrders, 6000);
      return () => clearInterval(interval);
    }
  }, [shift, fetchProducts, fetchPendingOrders]);

  // ── Cart helpers ───────────────────────────────────────────────────────────
  const addToCart = (product, variant) => {
    const key = variant.id || `${product.id}-${variant.name}`;
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
        costPrice: parseFloat(variant.costPrice || 0),
        qty: 1,
        notes: "",
      }];
    });
    setVariantPickerProduct(null);
  };

  const updateNotes = (key, notes) => {
    setCart((prev) =>
      prev.map((i) => (i.key === key ? { ...i, notes } : i))
    );
  };

  const updateQty = (key, delta) => {
    setCart((prev) =>
      prev
        .map((i) => i.key === key ? { ...i, qty: i.qty + delta } : i)
        .filter((i) => i.qty > 0)
    );
  };

  const removeItem = (key) => setCart((prev) => prev.filter((i) => i.key !== key));

  const clearCart = () => {
    setCart([]);
    setActiveOrder(null);
    setEditingNoteKey(null);
  };

  // ── Handler Pilih Pesanan Masuk (dari scanner / antrean) ───────────────────
  const handleSelectOrder = (order) => {
    if (!order) return;
    setActiveOrder(order);

    // Map item pesanan ke format cart POS (dukung productVariantId atau variantId)
    const newCart = (order.items || []).map((item, idx) => {
      const vId = item.productVariantId || item.variantId || item.id || `order-item-${idx}`;
      return {
        key: vId,
        variantId: item.productVariantId || item.variantId || item.id,
        productName: item.productName,
        variantName: item.variantName,
        price: parseFloat(item.price),
        costPrice: parseFloat(item.costPrice || 0),
        qty: item.quantity,
        notes: item.notes || "",
      };
    });

    setCart(newCart);

    // Set data pelanggan otomatis ke CustomerSelect ({ value, label, customer })
    const custData = order.customer || (order.customerId ? {
      id: order.customerId,
      name: order.customerName,
      phone: order.customerPhone || "",
    } : null);

    if (custData) {
      const opt = {
        value: custData.id,
        label: `${custData.name} ${custData.phone ? `(${custData.phone})` : ""}`,
        customer: custData,
      };
      setSelectedCustomer(opt);

      toast.success(
        `Pelanggan terdaftar: ${custData.name} (${custData.phone || "No HP terhubung"})`,
        {
          icon: "✅",
          duration: 4000,
        }
      );
    } else if (order.customerName) {
      const opt = {
        value: null,
        label: `${order.customerName} ${order.customerPhone ? `(${order.customerPhone})` : ""}`,
        customer: {
          id: null,
          name: order.customerName,
          phone: order.customerPhone || null,
        },
      };
      setSelectedCustomer(opt);

      toast.success(`Pesanan #${order.orderNumber} dimuat untuk ${order.customerName}`, {
        icon: "📋",
        duration: 3000,
      });
    }
  };

  const handleUnlinkOrder = () => {
    setActiveOrder(null);
    toast("Kaitan pesanan dilepas dari keranjang.", { icon: "ℹ️" });
  };

  // ── Klik produk ───────────────────────────────────────────────────────────
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
          activeOrder={activeOrder}
          onSuccess={(checkoutInfo) => {
            setShowCheckout(false);
            const completedOrderData = {
              receiptNumber:
                checkoutInfo.transaction?.receiptNumber ||
                `TRX-${Date.now().toString().slice(-6)}`,
              createdAt:
                checkoutInfo.transaction?.createdAt || new Date().toISOString(),
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
                selectedCustomer?.customer?.phone ||
                activeOrder?.customerPhone ||
                null,
              items: cart.map((item) => ({
                productName: item.productName,
                variantName: item.variantName,
                quantity: item.qty,
                price: item.price,
                subtotal: item.price * item.qty,
                notes: item.notes || "",
              })),
              totalAmount:
                checkoutInfo.transaction?.totalAmount || cartTotal,
              paymentMethod: checkoutInfo.paymentMethod,
              cashReceived: checkoutInfo.cashReceived,
              changeAmount: checkoutInfo.changeAmount,
            };
            setCompletedOrder(completedOrderData);
            setActivePrintOrder(completedOrderData);
            setShowSuccessModal(true);
            clearCart();
            setSelectedCustomer(null);
            setActiveOrder(null);
            fetchPendingOrders();
          }}
          onClose={() => setShowCheckout(false)}
        />
      )}

      {/* ── Modal: Scan Barcode & Antrean Pesanan Pelanggan ── */}
      <OrderScannerModal
        isOpen={showOrderScannerModal}
        onClose={() => setShowOrderScannerModal(false)}
        pendingOrders={pendingOrders}
        onSelectOrder={handleSelectOrder}
        onRefresh={fetchPendingOrders}
      />

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
          <div className="flex items-center gap-2">
            {/* Tombol Bluetooth Thermal Printer */}
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
                {search ? `Tidak ada hasil untuk "${search}"` : "Tambahkan produk di menu Produk"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 gap-3 pb-4">
              {filteredProducts.map((p, idx) => (
                <ProductCard key={p.id || `product-${idx}`} product={p} onClick={handleProductClick} />
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

        {/* Pemilih Pelanggan & Kaitan Pesanan Masuk POS */}
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
                    “{activeOrder.notes}”
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

                  {/* Input Catatan / Tampilan Catatan Per Produk */}
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
                        <span className="truncate italic">“{item.notes}”</span>
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

      {/* ── Wadah Struk Thermal untuk Browser Native Print (@media print) ── */}
      <ThermalReceipt
        order={activePrintOrder}
        store={storeInfo}
        printMode={printMode}
      />
    </div>
  );
}
