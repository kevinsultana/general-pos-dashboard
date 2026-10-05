"use client";

import { useState } from "react";
import {
  Store,
  Clock,
  Wallet,
  ArrowRight,
  Loader2,
  GitBranch,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../lib/api";
import { formatRibuan } from "../../lib/posUtils";
import GlassCard from "../ui/GlassCard";

/**
 * NoShiftScreen - Layar pembuka shift kasir saat shift belum aktif.
 *
 * Menggunakan GlassCard dengan desain Modern Clean Glassmorphism dan responsive layout.
 *
 * @param {object} props
 * @param {Function} props.onSuccess - callback(newShift) saat shift berhasil dibuka
 */
export default function NoShiftScreen({ onSuccess }) {
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
        onSuccess?.(res.data);
      }
    } catch (err) {
      toast.error(err.message || "Gagal membuka shift.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 animate-in fade-in duration-300 min-h-[60vh]">
      <div className="w-full max-w-md space-y-6">

        {/* Ilustrasi & Header */}
        <div className="text-center space-y-4">
          <div className="relative inline-flex">
            <div className="w-24 h-24 rounded-3xl bg-linear-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-xl shadow-amber-500/30">
              <Store className="w-12 h-12 text-white" />
            </div>
            <span className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-rose-500 border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-xs">
              <Clock className="w-3.5 h-3.5 text-white" />
            </span>
          </div>

          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Buka Shift Kasir
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              Shift belum dibuka. Masukkan modal awal laci untuk mulai mencatat transaksi.
            </p>
          </div>

          {/* Info Kasir & Cabang */}
          <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/50 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-2xs">
            <span className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-lg bg-amber-500 flex items-center justify-center text-white text-[10px] font-black">
                {(user?.name || "K").charAt(0).toUpperCase()}
              </div>
              <span>{user?.name || "Kasir"}</span>
            </span>
            <span className="text-slate-300 dark:text-slate-600">·</span>
            <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
              <GitBranch className="w-3.5 h-3.5 text-amber-500" />
              <span>{activeBranch?.name || "Cabang Utama"}</span>
            </span>
          </div>
        </div>

        {/* Form Modal Awal */}
        <GlassCard className="p-6 sm:p-7 space-y-5">
          <form onSubmit={handleOpen} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                <Wallet className="w-4 h-4 text-amber-500" />
                Modal Awal Uang Laci (Rp)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 dark:text-slate-500 pointer-events-none select-none">
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
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 focus:bg-white dark:focus:bg-slate-800 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 text-base font-extrabold text-slate-900 dark:text-white outline-none transition-all shadow-xs"
                  autoFocus
                />
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
                Jumlah uang tunai pecahan di laci kasir saat mulai shift. Bisa diisi 0 jika tidak ada.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full min-h-[48px] py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-600 active:scale-[0.98] text-white font-extrabold text-sm shadow-lg shadow-slate-900/15 dark:shadow-amber-500/20 flex items-center justify-center gap-2.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Membuka shift kasir...</span>
                </>
              ) : (
                <>
                  <Clock className="w-4 h-4 text-amber-400 dark:text-white" />
                  <span>Buka Shift & Mulai Berjualan</span>
                  <ArrowRight className="w-4 h-4 text-slate-400 dark:text-amber-200 ml-auto" />
                </>
              )}
            </button>
          </form>

          {/* Info Shift Note */}
          <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 text-xs text-blue-800 dark:text-blue-300">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-blue-500 dark:text-blue-400" />
            <span className="leading-relaxed">
              Semua penjualan akan otomatis tercatat pada shift ini. Tutup shift di akhir hari kerja untuk mencetak Z-Report rekap omzet kasir.
            </span>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
