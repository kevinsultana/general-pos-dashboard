"use client";

import { useState, useEffect, useRef } from "react";
import {
  Barcode,
  ArrowRight,
  UserCheck,
  Phone,
  UtensilsCrossed,
  ShoppingBag,
  RotateCw,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../lib/api";
import GlassModal from "../ui/GlassModal";
import Badge from "../ui/Badge";
import EmptyState from "../ui/EmptyState";
import { fmt } from "../../lib/posUtils";

/**
 * OrderScannerModal - Modal scan barcode & antrean pesanan masuk (QR self-order).
 *
 * Menggunakan GlassModal dengan estetika Modern Clean Glassmorphism.
 *
 * @param {object} props
 * @param {boolean} props.isOpen - status buka/tutup modal
 * @param {Function} props.onClose - callback()
 * @param {Array} [props.pendingOrders=[]] - daftar pesanan pending dari server
 * @param {Function} props.onSelectOrder - callback(order)
 * @param {Function} props.onRefresh - callback() untuk segarkan antrean
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
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title="Scan Barcode & Antrean Pesanan"
      description="Pindai barcode HP pelanggan atau pilih dari antrean QR self-order"
      icon={<Barcode className="w-5 h-5 text-amber-500" />}
      size="lg"
    >
      <div className="space-y-4">

        {/* Input Barcode Scanner */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
            Scanner Barcode / Masukkan Kode Pesanan
          </label>
          <div className="relative flex items-center">
            <Barcode className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
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
              placeholder="Scan barcode atau ketik contoh: ORD-882194..."
              className="w-full pl-10 pr-24 py-3 rounded-2xl bg-white/70 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 focus:bg-white dark:focus:bg-slate-800 focus:border-amber-400 font-mono text-xs font-black text-slate-900 dark:text-white outline-none uppercase transition-all shadow-xs"
            />
            <button
              type="button"
              disabled={isSearching}
              onClick={() => handleLookup(scanCode)}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-600 text-white text-xs font-black transition-all active:scale-95 disabled:opacity-60 cursor-pointer shadow-xs"
            >
              {isSearching ? "Mencari..." : "Cari & Muat"}
            </button>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">
            Mendukung laser scanner USB/Bluetooth maupun ketik kode manual lalu tekan Enter.
          </p>
        </div>

        {/* Header List Pesanan */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px]">
              Pesanan Menunggu
            </span>
            <Badge variant="primary" size="sm">
              {pendingOrders.length}
            </Badge>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Segarkan Antrean</span>
          </button>
        </div>

        {/* Daftar Pesanan Pending */}
        <div className="space-y-2.5 max-h-72 overflow-y-auto custom-scrollbar pr-1">
          {pendingOrders.length === 0 ? (
            <EmptyState
              icon={<ShoppingBag className="w-6 h-6 text-slate-400" />}
              title="Tidak ada pesanan menunggu"
              description="Pesanan yang dibuat oleh pelanggan melalui QR menu meja akan otomatis tampil di sini."
            />
          ) : (
            pendingOrders.map((ord, ordIdx) => {
              const isRegistered = Boolean(ord.customer || ord.customerId);
              const phoneDisplay = ord.customerPhone || ord.customer?.phone;

              return (
                <div
                  key={ord.id || ord.orderNumber || `pending-ord-${ordIdx}`}
                  className="p-4 rounded-2xl bg-white/60 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 hover:border-amber-400/70 transition-all space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-mono font-black text-slate-900 dark:text-white text-xs bg-slate-100 dark:bg-slate-700/80 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-600">
                          #{ord.orderNumber}
                        </span>
                        <span className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">
                          {ord.customerName}
                        </span>
                        {isRegistered ? (
                          <Badge variant="success" size="sm">
                            <UserCheck className="w-3 h-3" />
                            <span>Terdaftar</span>
                          </Badge>
                        ) : (
                          <Badge variant="neutral" size="sm">
                            Tamu
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px]">
                        {phoneDisplay ? (
                          <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-emerald-600" />
                            <span>{phoneDisplay}</span>
                          </span>
                        ) : null}

                        <span className="text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1">
                          {ord.orderType === "DINE_IN" ? (
                            <>
                              <UtensilsCrossed className="w-3 h-3 text-amber-600" />
                              <span>
                                Dine-In {ord.tableNumber ? `(Meja ${ord.tableNumber})` : ""}
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
                      <span className="font-black text-amber-700 dark:text-amber-400 text-sm block">
                        {fmt(ord.totalAmount)}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">
                        {new Date(ord.createdAt).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Tombol Aksi */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleCancelOrder(ord)}
                      className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                    >
                      Batalkan
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onSelectOrder(ord);
                        onClose();
                      }}
                      className="min-h-9 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-600 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer"
                    >
                      <span>Muat ke Keranjang</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </GlassModal>
  );
}
