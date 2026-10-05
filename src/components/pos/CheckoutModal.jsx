"use client";

import { useState, useEffect } from "react";
import {
  X,
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

const PAYMENT_METHODS = [
  { key: "CASH",     label: "Tunai",    icon: Banknote,    color: "bg-emerald-50 border-emerald-300 text-emerald-800" },
  { key: "QRIS",     label: "QRIS",     icon: QrCode,      color: "bg-violet-50 border-violet-300 text-violet-800" },
  { key: "TRANSFER", label: "Transfer", icon: CreditCard,   color: "bg-blue-50 border-blue-300 text-blue-800" },
];

/**
 * Modal konfirmasi pembayaran POS.
 *
 * Props:
 *   cart             – item keranjang: Array<{ key, variantId, productName, variantName, price, qty, notes }>
 *   shift            – objek shift aktif, dibutuhkan shiftId
 *   selectedCustomer – objek customer terpilih ({ value, label, customer })
 *   activeOrder      – pesanan meja/self-order aktif (nullable)
 *   discountAmount   – jumlah diskon dalam Rupiah (number)
 *   appliedPromoCode – kode promo yang diterapkan (string | null)
 *   onSuccess        – (checkoutInfo) => void  dipanggil setelah checkout berhasil
 *   onClose          – () => void
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
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [cashReceived, setCashReceived] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [roundingMode, setRoundingMode] = useState(0);

  // Baca rounding mode dari localStorage saat modal dibuka
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
            <h3 className="text-sm font-black text-slate-900">
              Konfirmasi Pembayaran
            </h3>
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
          {/* Ringkasan order */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
            {/* Info pesanan meja */}
            {activeOrder && (
              <div className="pb-2 mb-2 border-b border-slate-200/80 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-semibold">
                  Pesanan Meja:
                </span>
                <span className="font-extrabold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Barcode className="w-3 h-3 text-amber-700" />
                  #{activeOrder.orderNumber}{" "}
                  {activeOrder.tableNumber
                    ? `(Meja ${activeOrder.tableNumber})`
                    : ""}
                </span>
              </div>
            )}

            {/* Info pelanggan */}
            {(selectedCustomer?.customer || selectedCustomer?.label) && (
              <div className="pb-2 mb-2 border-b border-slate-200/80 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-semibold">Pelanggan:</span>
                <span className="font-extrabold text-slate-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    {selectedCustomer.label ||
                      selectedCustomer.customer?.name}
                  </span>
                </span>
              </div>
            )}

            {/* Item keranjang */}
            {cart.map((item, idx) => (
              <div
                key={item.key || item.variantId || `checkout-item-${idx}`}
                className="space-y-0.5 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-slate-700 font-semibold">
                    {item.productName}{" "}
                    <span className="text-slate-400">({item.variantName})</span>{" "}
                    ×{item.qty}
                  </span>
                  <span className="font-bold text-slate-900">
                    {fmt(item.price * item.qty)}
                  </span>
                </div>
                {item.notes && (
                  <p className="text-[10px] text-amber-800 italic bg-amber-50/80 border border-amber-200/60 px-2 py-0.5 rounded inline-block max-w-full truncate">
                    Catatan: {item.notes}
                  </p>
                )}
              </div>
            ))}

            {/* Subtotal + diskon */}
            {discount > 0 && (
              <div className="pt-2 mt-2 border-t border-slate-200 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600">Subtotal</span>
                  <span className="font-bold text-slate-700">
                    {fmt(subtotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-emerald-700 flex items-center gap-1">
                    <Ticket className="w-3 h-3" />
                    {appliedPromoCode
                      ? `Promo (${appliedPromoCode})`
                      : "Diskon Promo"}
                  </span>
                  <span className="font-bold text-emerald-700">
                    - {fmt(discount)}
                  </span>
                </div>
              </div>
            )}

            {/* Total bayar */}
            <div
              className={`${
                discount > 0 ? "pt-2 border-t border-slate-200" : "pt-2 mt-2 border-t border-slate-200"
              } flex items-center justify-between`}
            >
              <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Total Bayar
              </span>
              <div className="text-right">
                {roundingMode > 0 && roundingDiff > 0 && (
                  <p className="text-[10px] text-slate-400 line-through font-mono">
                    {fmt(rawTotal)}
                  </p>
                )}
                <span className="text-lg font-black text-emerald-700">
                  {fmt(total)}
                </span>
              </div>
            </div>
          </div>

          {/* Pilih metode pembayaran */}
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
                    <Icon
                      className={`w-5 h-5 ${
                        selected ? "text-amber-600" : "text-slate-400"
                      }`}
                    />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Input tunai (hanya jika CASH) */}
          {paymentMethod === "CASH" && (
            <div className="space-y-2 p-3 rounded-2xl bg-amber-50/70 border border-amber-200">
              <label className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block">
                Uang Tunai Diterima (Rp)
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={formatRibuan(cashReceived)}
                onChange={(e) =>
                  setCashReceived(e.target.value.replace(/\D/g, ""))
                }
                placeholder={`Uang Pas (${fmt(total)})`}
                className="w-full px-3 py-2 rounded-xl bg-white border border-amber-300 focus:border-amber-500 text-sm font-extrabold text-slate-800 outline-none transition-all"
              />

              {/* Tombol quick cash */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setCashReceived(String(total))}
                  className="px-2.5 py-1 rounded-lg bg-amber-400/80 hover:bg-amber-500 text-[10px] font-black text-white transition-colors cursor-pointer"
                >
                  Uang Pas
                </button>
                {getSmartQuickCash(total).map((nominal) => (
                  <button
                    key={nominal}
                    type="button"
                    onClick={() => setCashReceived(String(nominal))}
                    className="px-2.5 py-1 rounded-lg bg-white border border-amber-200 hover:bg-amber-100 text-[10px] font-bold text-slate-700 transition-colors cursor-pointer"
                  >
                    {new Intl.NumberFormat("id-ID").format(nominal)}
                  </button>
                ))}
              </div>

              {roundingMode > 0 && roundingDiff > 0 && (
                <p className="text-[10px] text-amber-700 italic">
                  Total dibulatkan ke atas Rp{" "}
                  {new Intl.NumberFormat("id-ID").format(roundingMode)} terdekat
                  {" "}(+Rp {new Intl.NumberFormat("id-ID").format(roundingDiff)})
                </p>
              )}

              <div className="pt-2 border-t border-amber-200/80 flex items-center justify-between text-xs">
                <span className="font-bold text-amber-900">Kembalian:</span>
                <span className="font-black text-amber-950 text-sm">
                  {fmt(Math.max(0, (Number(cashReceived) || total) - total))}
                </span>
              </div>
            </div>
          )}

          {/* Tombol bayar */}
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
