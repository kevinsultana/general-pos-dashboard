"use client";

import { useState, useEffect } from "react";
import {
  Receipt,
  Banknote,
  QrCode,
  CreditCard,
  CheckCircle2,
  Barcode,
  UserCheck,
  Ticket,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../lib/api";
import { fmt, formatRibuan, getSmartQuickCash } from "../../lib/posUtils";
import GlassModal from "../ui/GlassModal";
import NumericKeypad from "../ui/NumericKeypad";
import Badge from "../ui/Badge";
import { cn } from "../../lib/utils";

const PAYMENT_METHODS = [
  {
    key: "CASH",
    label: "Tunai",
    icon: Banknote,
    color: "bg-emerald-500/10 border-emerald-400 text-emerald-800 dark:text-emerald-300",
  },
  {
    key: "QRIS",
    label: "QRIS",
    icon: QrCode,
    color: "bg-violet-500/10 border-violet-400 text-violet-800 dark:text-violet-300",
  },
  {
    key: "TRANSFER",
    label: "Transfer",
    icon: CreditCard,
    color: "bg-blue-500/10 border-blue-400 text-blue-800 dark:text-blue-300",
  },
];

/**
 * CheckoutModal - Modal konfirmasi pembayaran & checkout kasir POS.
 *
 * Menggunakan GlassModal dan terintegrasi dengan NumericKeypad untuk input kasir layar sentuh.
 *
 * @param {object} props
 * @param {Array} props.cart - item keranjang
 * @param {object} props.shift - data shift aktif
 * @param {object|null} props.selectedCustomer - customer terpilih
 * @param {object|null} props.activeOrder - pesanan QR self-order aktif
 * @param {number} props.discountAmount - nominal diskon promo
 * @param {string|null} props.appliedPromoCode - kode promo
 * @param {Function} props.onSuccess - callback(checkoutInfo)
 * @param {Function} props.onClose - callback()
 */
export default function CheckoutModal({
  cart,
  shift,
  selectedCustomer,
  activeOrder,
  discountAmount,
  appliedPromoCode,
  onSuccess,
  onClose,
}) {
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [cashReceived, setCashReceived] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [roundingMode, setRoundingMode] = useState(0);

  // Ambil mode pembulatan dari localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("omnipos_rounding_mode");
      if (saved !== null) setRoundingMode(Number(saved));
    } catch {}
  }, []);

  const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const discount = Number(discountAmount) || 0;
  const rawTotal = Math.max(0, subtotal - discount);
  const total =
    roundingMode > 0
      ? Math.ceil(rawTotal / roundingMode) * roundingMode
      : rawTotal;
  const roundingDiff = total - rawTotal;

  const currentCashReceivedNum = Number(cashReceived) || total;
  const changeAmount = Math.max(0, currentCashReceivedNum - total);

  const handleCheckout = async () => {
    if (!paymentMethod) return toast.error("Pilih metode pembayaran.");

    if (paymentMethod === "CASH" && Number(cashReceived) > 0 && Number(cashReceived) < total) {
      return toast.error("Uang tunai yang diterima kurang dari total belanja.");
    }

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
        customerName:
          selectedCustomer?.customer?.name ||
          (selectedCustomer?.value ? selectedCustomer?.label : null),
        customerPhone: selectedCustomer?.customer?.phone || null,
        orderId: activeOrder?.id || null,
        orderNumber: activeOrder?.orderNumber || null,
        discountAmount: discount > 0 ? discount : undefined,
        promoCode: appliedPromoCode || undefined,
        items,
      });

      if (res?.success) {
        const receivedVal =
          paymentMethod === "CASH" ? parseFloat(cashReceived) || total : total;
        const changeVal =
          paymentMethod === "CASH" ? Math.max(0, receivedVal - total) : 0;

        toast.success(`Transaksi ${res.data.receiptNumber} berhasil!`);
        onSuccess({
          transaction: res.data,
          paymentMethod,
          cashReceived: receivedVal,
          changeAmount: changeVal,
          discountAmount: discount,
        });
      }
    } catch (err) {
      toast.error(err.message || "Checkout gagal diproses.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <GlassModal
      isOpen={true}
      onClose={onClose}
      title="Konfirmasi Pembayaran"
      description={`Shift #${shift?.id?.slice(-6) || "Aktif"}`}
      icon={<Receipt className="w-5 h-5" />}
      size="lg"
      footer={
        <div className="flex items-center justify-between w-full gap-3">
          <div className="text-left">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              Total Bayar
            </span>
            <span className="text-lg sm:text-xl font-black text-emerald-700 dark:text-emerald-400">
              {fmt(total)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-11 px-4 py-2.5 rounded-2xl text-xs font-extrabold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleCheckout}
              disabled={isSubmitting}
              className="min-h-11 px-6 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-600 text-white font-extrabold text-xs sm:text-sm shadow-md flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-white" />
                  <span>Bayar Sekarang</span>
                </>
              )}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">

        {/* Ringkasan Order & Pelanggan */}
        <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5 text-xs">
          {/* Info Pesanan Meja */}
          {activeOrder && (
            <div className="pb-2 border-b border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 font-semibold">
                Pesanan Meja
              </span>
              <Badge variant="primary" size="sm">
                <Barcode className="w-3 h-3" />
                <span>
                  #{activeOrder.orderNumber}{" "}
                  {activeOrder.tableNumber ? `(Meja ${activeOrder.tableNumber})` : ""}
                </span>
              </Badge>
            </div>
          )}

          {/* Info Pelanggan */}
          {(selectedCustomer?.customer || selectedCustomer?.label) && (
            <div className="pb-2 border-b border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 font-semibold">
                Pelanggan
              </span>
              <Badge variant="success" size="sm">
                <UserCheck className="w-3 h-3" />
                <span>
                  {selectedCustomer.label || selectedCustomer.customer?.name}
                </span>
              </Badge>
            </div>
          )}

          {/* Item List Ringkas */}
          <div className="max-h-36 overflow-y-auto custom-scrollbar space-y-1.5 pr-1">
            {cart.map((item, idx) => (
              <div
                key={item.key || item.variantId || `chk-${idx}`}
                className="flex items-center justify-between text-xs"
              >
                <div className="min-w-0 pr-2">
                  <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                    {item.productName} ({item.variantName}) ×{item.qty}
                  </span>
                  {item.notes && (
                    <span className="text-[10px] text-amber-800 dark:text-amber-400 italic block">
                      "{item.notes}"
                    </span>
                  )}
                </div>
                <span className="font-extrabold text-slate-900 dark:text-white shrink-0">
                  {fmt(item.price * item.qty)}
                </span>
              </div>
            ))}
          </div>

          {/* Subtotal & Diskon */}
          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 space-y-1">
            {discount > 0 && (
              <>
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span>Subtotal</span>
                  <span>{fmt(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 font-bold">
                  <span className="flex items-center gap-1">
                    <Ticket className="w-3 h-3" />
                    {appliedPromoCode ? `Promo (${appliedPromoCode})` : "Diskon"}
                  </span>
                  <span>- {fmt(discount)}</span>
                </div>
              </>
            )}

            <div className="flex items-center justify-between pt-1 text-sm font-black">
              <span className="text-slate-800 dark:text-slate-200">Total Tagihan</span>
              <span className="text-emerald-700 dark:text-emerald-400 text-base">
                {fmt(total)}
              </span>
            </div>
          </div>
        </div>

        {/* Pilihan Metode Pembayaran */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
            Metode Pembayaran
          </label>
          <div className="grid grid-cols-3 gap-2">
            {PAYMENT_METHODS.map((m) => {
              const Icon = m.icon;
              const isSelected = paymentMethod === m.key;
              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setPaymentMethod(m.key)}
                  className={cn(
                    "min-h-12 py-3 px-2 rounded-2xl border-2 font-black text-xs transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer",
                    isSelected
                      ? "border-amber-500 bg-amber-500/15 dark:bg-amber-400/10 text-amber-900 dark:text-amber-300 shadow-sm"
                      : "border-slate-200/80 dark:border-slate-700/80 bg-white/60 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-5 h-5",
                      isSelected
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-slate-400 dark:text-slate-500"
                    )}
                  />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Panel Kasir Tunai dengan Numpad Sentuh */}
        {paymentMethod === "CASH" && (
          <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-950/20 border border-amber-300/60 dark:border-amber-800/40 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                Uang Diterima
              </label>
              <div className="text-right">
                <span className="text-base font-black text-slate-900 dark:text-white">
                  {cashReceived ? `Rp ${formatRibuan(cashReceived)}` : fmt(total)}
                </span>
              </div>
            </div>

            {/* Kembalian Live */}
            <div className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-amber-200/60 dark:border-amber-800/40 text-xs">
              <span className="font-bold text-slate-600 dark:text-slate-400">
                Kembalian Kasir:
              </span>
              <span className="text-sm font-black text-emerald-700 dark:text-emerald-400">
                {fmt(changeAmount)}
              </span>
            </div>

            {/* Numeric Keypad Touchscreen */}
            <NumericKeypad
              value={cashReceived}
              onChange={(val) => setCashReceived(val)}
              quickAmounts={getSmartQuickCash(total)}
              onExactAmount={() => setCashReceived(String(total))}
            />
          </div>
        )}
      </div>
    </GlassModal>
  );
}
