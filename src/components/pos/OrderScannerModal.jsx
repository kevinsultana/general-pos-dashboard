"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  Barcode,
  ArrowRight,
  ShoppingBag,
  UserCheck,
  Phone,
  UtensilsCrossed,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../lib/api";

/**
 * Modal scan barcode & antrean pesanan pelanggan (QR self-order).
 *
 * Props:
 *   isOpen        – boolean, apakah modal ditampilkan
 *   onClose       – () => void
 *   pendingOrders – Array<order>, daftar pesanan pending dari server
 *   onSelectOrder – (order) => void  dipanggil saat kasir memilih / muat pesanan
 *   onRefresh     – () => void       dipanggil saat kasir tekan "Segarkan Antrean"
 */
export default function OrderScannerModal({
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
          toast.error(
            `Pesanan #${res.data.orderNumber} statusnya sudah "${res.data.status}".`
          );
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
    if (
      !window.confirm(
        `Batalkan pesanan #${order.orderNumber} (${order.customerName})?`
      )
    ) {
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

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center">
              <Barcode className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Scan Barcode & Antrean Pesanan
              </h3>
              <p className="text-[11px] text-slate-400">
                Pindai barcode HP pelanggan atau pilih antrean
              </p>
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

        {/* Input barcode scanner */}
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
            Mendukung laser scanner USB/Bluetooth maupun ketik kode manual lalu
            tekan Enter.
          </p>
        </div>

        {/* Daftar pesanan pending */}
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
              <p className="text-xs font-bold text-slate-500">
                Tidak ada pesanan menggantung
              </p>
              <p className="text-[11px] text-slate-400">
                Pesanan yang dibuat oleh pelanggan melalui QR menu meja akan
                tampil di sini.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {pendingOrders.map((ord, ordIdx) => {
                const isRegistered = Boolean(ord.customer || ord.customerId);
                const phoneDisplay =
                  ord.customerPhone || ord.customer?.phone;

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

                        <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px]">
                          {phoneDisplay ? (
                            <span className="font-bold text-slate-700 flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                              <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span>{phoneDisplay}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10px]">
                              Tanpa No. HP
                            </span>
                          )}
                          <span className="text-slate-500 font-semibold flex items-center gap-1">
                            {ord.orderType === "DINE_IN" ? (
                              <>
                                <UtensilsCrossed className="w-3 h-3 text-amber-600" />
                                <span>
                                  Dine-In{" "}
                                  {ord.tableNumber
                                    ? `(Meja ${ord.tableNumber})`
                                    : ""}
                                </span>
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
                          Rp{" "}
                          {parseFloat(ord.totalAmount).toLocaleString("id-ID")}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(ord.createdAt).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Tombol aksi */}
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
