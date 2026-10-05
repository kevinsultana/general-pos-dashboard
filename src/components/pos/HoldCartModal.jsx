"use client";

import { useState } from "react";
import {
  X,
  PauseCircle,
  PlayCircle,
  Trash2,
  Clock,
  User,
  ShoppingBag,
  ArrowRight,
  AlertCircle,
  FileText,
} from "lucide-react";
import toast from "react-hot-toast";
import { confirmDeleteHeldCart } from "../../lib/alerts";

const fmt = (n) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(n) || 0);

function formatTimeAgo(timestamp) {
  if (!timestamp) return "Baru saja";
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) return "Baru saja";
  if (diffMinutes < 60) return `${diffMinutes} menit lalu`;
  const diffHours = Math.floor(diffMinutes / 60);
  return `${diffHours} jam lalu`;
}

export default function HoldCartModal({
  isOpen,
  onClose,
  heldCarts = [],
  onRecall,
  onDelete,
}) {
  const [search, setSearch] = useState("");

  if (!isOpen) return null;

  const filteredCarts = heldCarts.filter((item) => {
    const query = search.toLowerCase();
    const labelMatch = (item.label || "").toLowerCase().includes(query);
    const customerMatch = (item.customerName || "")
      .toLowerCase()
      .includes(query);
    const notesMatch = (item.notes || "").toLowerCase().includes(query);
    return labelMatch || customerMatch || notesMatch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl bg-white/95 backdrop-blur-2xl border border-white/90 shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col my-6 max-h-[90vh]">
        {/* Header Modal */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-300 text-amber-700 flex items-center justify-center font-bold shadow-2xs">
              <PauseCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-tight text-slate-900">
                  Keranjang Tertahan (Hold Cart)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-200">
                  {heldCarts.length} Antrean
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Lanjutkan antrean pelanggan yang sempat menepi tanpa memblokir
                kasir
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search input jika antrean > 2 */}
        {heldCarts.length > 2 && (
          <div className="px-5 pt-4 shrink-0">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama antrean / pelanggan..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:border-amber-400"
            />
          </div>
        )}

        {/* Daftar Antrean Tertahan */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1 custom-scrollbar">
          {heldCarts.length === 0 ? (
            <div className="py-12 px-4 rounded-3xl border border-dashed border-slate-200 text-center space-y-3 bg-slate-50/50">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-700">
                  Tidak Ada Keranjang Tertahan
                </p>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Gunakan tombol <strong>“Tahan Pesanan”</strong> di bawah
                  keranjang saat pelanggan perlu mengambil dompet atau memilih
                  menu tambahan.
                </p>
              </div>
            </div>
          ) : filteredCarts.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              Tidak ada antrean yang cocok dengan &quot;{search}&quot;.
            </div>
          ) : (
            filteredCarts.map((item) => {
              const totalAmount =
                item.items?.reduce((sum, it) => sum + it.price * it.qty, 0) ||
                0;
              const itemCount =
                item.items?.reduce((sum, it) => sum + it.qty, 0) || 0;

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-amber-300 hover:shadow-md transition-all space-y-3 group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-xs text-slate-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg">
                          {item.label || "Antrean"}
                        </span>
                        {item.customerName && (
                          <span className="text-xs font-bold text-slate-700 truncate flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-400" />
                            {item.customerName}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTimeAgo(item.heldAt)}
                        </span>
                      </div>

                      {item.notes && (
                        <p className="text-[11px] text-amber-800 italic bg-amber-50/60 border border-amber-200/50 px-2 py-0.5 rounded-md inline-block max-w-full truncate">
                          Catatan: “{item.notes}”
                        </p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-sm font-black text-emerald-700">
                        {fmt(totalAmount)}
                      </p>
                      <p className="text-[10px] text-slate-400 font-semibold">
                        {itemCount} item
                      </p>
                    </div>
                  </div>

                  {/* Ringkasan Item Pesanan */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1.5 text-[11px] text-slate-600">
                    {item.items?.slice(0, 3).map((it, idx) => (
                      <span
                        key={idx}
                        className="bg-slate-50 border border-slate-200/80 px-2 py-0.5 rounded-md truncate max-w-40"
                      >
                        {it.productName} ({it.qty}x)
                      </span>
                    ))}
                    {(item.items?.length || 0) > 3 && (
                      <span className="bg-slate-100 text-slate-500 font-bold px-1.5 py-0.5 rounded-md text-[10px]">
                        +{item.items.length - 3} lainnya
                      </span>
                    )}
                  </div>

                  {/* Tombol Aksi */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        const result = await confirmDeleteHeldCart(
                          item.label || "Antrean Ini",
                        );
                        if (result.isConfirmed) {
                          onDelete(item.id);
                          toast.success(
                            `Antrean "${item.label || "Antrean"}" berhasil dihapus.`,
                            {
                              icon: "🗑️",
                            },
                          );
                        }
                      }}
                      className="text-xs font-bold text-slate-400 hover:text-rose-600 flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-rose-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onRecall(item);
                        onClose();
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer"
                    >
                      <PlayCircle className="w-3.5 h-3.5 text-amber-400" />
                      <span>Muat Kembali ke Kasir</span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span className="text-[11px]">
            Tersimpan aman di browser lokal cabang aktif.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
