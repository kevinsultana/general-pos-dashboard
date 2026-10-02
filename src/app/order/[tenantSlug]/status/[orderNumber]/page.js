"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  XCircle,
  Store,
  MapPin,
  ShoppingBag,
  ArrowLeft,
  RefreshCw,
  Sparkles,
  QrCode,
  Barcode,
  Layers,
  UtensilsCrossed,
  Package,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../../../../lib/api";
import BarcodeSvg from "../../../../../components/common/BarcodeSvg";
import QrCodeSvg from "../../../../../components/common/QrCodeSvg";

export default function OrderStatusPage({ params }) {
  const resolvedParams = use(params);
  const tenantSlug = resolvedParams?.tenantSlug;
  const orderNumber = resolvedParams?.orderNumber;

  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("barcode"); // "barcode" | "qr"

  // Fetch status pesanan
  const fetchOrderStatus = async (showLoading = false) => {
    try {
      if (showLoading) setIsLoading(true);
      const res = await api.get(`/public/orders/${orderNumber}`);
      if (res?.success) {
        setOrder(res.data);
      }
    } catch (err) {
      toast.error(err.message || "Gagal memuat status pesanan.");
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  useEffect(() => {
    if (orderNumber) {
      fetchOrderStatus(true);

      // Auto-poll setiap 4 detik untuk update status real-time saat kasir menyelesaikan checkout
      const interval = setInterval(() => {
        fetchOrderStatus(false);
      }, 4000);

      return () => clearInterval(interval);
    }
  }, [orderNumber]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center animate-spin mb-4">
          <RefreshCw className="w-6 h-6" />
        </div>
        <h2 className="text-base font-extrabold text-slate-800">
          Memuat Tiket Pesanan...
        </h2>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <XCircle className="w-12 h-12 text-rose-500 mb-3" />
        <h2 className="text-lg font-black text-slate-900">
          Pesanan Tidak Ditemukan
        </h2>
        <p className="text-xs text-slate-500 max-w-sm mt-1 mb-6">
          Kode pesanan "{orderNumber}" tidak ditemukan di sistem.
        </p>
        <Link
          href={`/order/${tenantSlug}`}
          className="px-5 py-2.5 rounded-2xl bg-slate-900 text-white font-bold text-xs"
        >
          Kembali ke Menu
        </Link>
      </div>
    );
  }

  const isCompleted = order.status === "COMPLETED";
  const isCancelled = order.status === "CANCELLED";
  const isPending = order.status === "PENDING";

  return (
    <div className="min-h-screen bg-slate-100/70 py-6 px-4 flex flex-col items-center justify-center text-slate-800 antialiased selection:bg-amber-100">
      <div className="w-full max-w-md space-y-4">
        {/* Tombol Kembali / Header */}
        <div className="flex items-center justify-between px-1">
          <Link
            href={`/order/${tenantSlug}`}
            className="flex items-center gap-1.5 text-xs font-extrabold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Pesan Lagi</span>
          </Link>
          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
            <Store className="w-3.5 h-3.5" />
            <span>{order.tenant?.name}</span>
          </div>
        </div>

        {/* ─── KARTU TIKET DIGITAL DENGAN BARCODE ─────────────────────────────── */}
        <div className="rounded-3xl bg-white border border-slate-200/90 shadow-xl overflow-hidden transition-all">
          {/* Header Status Tiket */}
          <div
            className={`p-5 text-center text-white transition-colors ${
              isCompleted
                ? "bg-linear-to-r from-emerald-600 to-teal-600"
                : isCancelled
                  ? "bg-slate-700"
                  : "bg-linear-to-r from-amber-500 to-amber-600"
            }`}
          >
            <div className="inline-flex items-center justify-center p-2 rounded-2xl bg-white/20 backdrop-blur-md mb-2">
              {isCompleted ? (
                <CheckCircle2 className="w-6 h-6 text-white" />
              ) : isCancelled ? (
                <XCircle className="w-6 h-6 text-white" />
              ) : (
                <Clock className="w-6 h-6 text-white animate-pulse" />
              )}
            </div>

            <h2 className="text-lg font-black tracking-tight">
              {isCompleted
                ? "Pesanan Selesai & Lunas!"
                : isCancelled
                  ? "Pesanan Dibatalkan"
                  : "Tunjukkan Barcode ke Kasir"}
            </h2>
            <p className="text-xs text-white/90 font-medium mt-0.5">
              {isCompleted
                ? "Terima kasih, pesanan Anda telah diproses kasir."
                : isCancelled
                  ? "Pesanan ini telah dibatalkan oleh kasir."
                  : "Kasir akan memindai barcode ini untuk pembayaran"}
            </p>
          </div>

          {/* Area Barcode / QR Code Scanner */}
          {!isCancelled && (
            <div className="p-6 bg-slate-50/60 border-b border-slate-100 flex flex-col items-center justify-center space-y-4">
              {/* Tab Switcher: Barcode vs QR Code */}
              <div className="flex items-center p-1 rounded-xl bg-slate-200/70 text-xs font-extrabold">
                <button
                  type="button"
                  onClick={() => setActiveTab("barcode")}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
                    activeTab === "barcode"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Barcode className="w-3.5 h-3.5" />
                  <span>Barcode 1D</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("qr")}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
                    activeTab === "qr"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>QR Code 2D</span>
                </button>
              </div>

              {/* Tampilan Visual Barcode atau QR Code */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm w-full max-w-75 flex flex-col items-center justify-center min-h-35">
                {activeTab === "barcode" ? (
                  <BarcodeSvg
                    value={order.orderNumber}
                    width={2}
                    height={72}
                    showText={false}
                    className="w-full"
                  />
                ) : (
                  <QrCodeSvg
                    value={order.orderNumber}
                    size={150}
                    fgColor="#0f172a"
                    bgColor="#ffffff"
                  />
                )}

                {/* Nomor Pesanan Huruf Tebal Besar */}
                <div className="text-center mt-3 pt-2 border-t border-slate-100 w-full">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Kode Pesanan Kasir
                  </p>
                  <span className="font-mono text-xl font-black text-slate-900 tracking-wider">
                    #{order.orderNumber}
                  </span>
                </div>
              </div>

              {/* Status Pill Live */}
              <div className="flex items-center gap-2 text-xs font-bold">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isCompleted
                      ? "bg-emerald-500"
                      : isCancelled
                        ? "bg-rose-500"
                        : "bg-amber-500 animate-ping"
                  }`}
                />
                <span className="text-slate-600">
                  {isCompleted
                    ? "Status: Selesai di Kasir"
                    : isCancelled
                      ? "Status: Dibatalkan"
                      : "Menunggu kasir memproses pesanan..."}
                </span>
              </div>
            </div>
          )}

          {/* Rincian Pesanan */}
          <div className="p-5 space-y-3.5 text-xs">
            {/* Info Meja & Pemesan */}
            <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">
                  Pemesan
                </p>
                <p className="font-extrabold text-slate-800">
                  {order.customerName}
                </p>
                {order.customerPhone && (
                  <p className="text-[11px] text-slate-500">
                    {order.customerPhone}
                  </p>
                )}
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">
                  Tipe Pesanan
                </p>
                <p className="font-extrabold text-slate-800 flex items-center gap-1">
                  {order.orderType === "DINE_IN" ? (
                    <>
                      <UtensilsCrossed className="w-3 h-3 text-amber-500" />
                      <span>
                        Dine-In{" "}
                        {order.tableNumber ? `(Meja ${order.tableNumber})` : ""}
                      </span>
                    </>
                  ) : (
                    <>
                      <Package className="w-3 h-3 text-amber-500" />
                      <span>Takeaway</span>
                    </>
                  )}
                </p>
                <p className="text-[10px] text-slate-500">
                  {order.branch?.name}
                </p>
              </div>

              {order.notes && (
                <div className="col-span-full pt-1.5 border-t border-slate-200/60">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">
                    Catatan
                  </p>
                  <p className="text-[11px] font-medium text-slate-700 italic">
                    “{order.notes}”
                  </p>
                </div>
              )}
            </div>

            {/* Daftar Item Belanjaan */}
            <div className="space-y-2">
              <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                Daftar Item ({order.items?.length || 0})
              </p>
              <div className="divide-y divide-slate-100">
                {order.items?.map((item) => (
                  <div
                    key={item.id}
                    className="py-2 flex justify-between items-center"
                  >
                    <div>
                      <p className="font-bold text-slate-800">
                        {item.quantity}x {item.productName}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {item.variantName !== "Regular"
                          ? item.variantName
                          : "Porsi Standar"}
                      </p>
                    </div>
                    <span className="font-extrabold text-slate-900">
                      Rp {parseFloat(item.subtotal).toLocaleString("id-ID")}
                    </span>
                  </div>
                ))}
              </div>

              {/* Total Belanja */}
              <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-sm font-black">
                <span className="text-slate-900">Total Tagihan</span>
                <span className="text-amber-700 text-base">
                  Rp {parseFloat(order.totalAmount).toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            {/* Info Struk Kasir jika sudah selesai */}
            {isCompleted && order.transaction && (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] space-y-1">
                <p className="font-extrabold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Transaksi Selesai #{order.transaction.receiptNumber}
                </p>
                <p className="text-emerald-700">
                  Metode Pembayaran:{" "}
                  <strong>{order.transaction.paymentMethod}</strong>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Bantuan & Keterangan */}
        <p className="text-center text-[11px] text-slate-400 font-medium">
          Simpan halaman ini atau tunjukkan layar HP Anda langsung ke meja kasir
          saat memesan.
        </p>
      </div>
    </div>
  );
}
