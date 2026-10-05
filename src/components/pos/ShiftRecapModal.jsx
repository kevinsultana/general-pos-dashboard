"use client";

import { useState } from "react";
import {
  X,
  FileDown,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  GitBranch,
  Wallet,
  TrendingUp,
  Banknote,
  QrCode,
  CreditCard,
  Tag,
  Receipt,
  Printer,
  Calendar,
} from "lucide-react";
import toast from "react-hot-toast";
import { downloadZReportPdf } from "../../lib/generateZReportPdf";

const fmt = (n) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(n) || 0);

const fmtDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("id-ID", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

function shiftDuration(start, end) {
  if (!start) return "—";
  const ms = new Date(end || Date.now()) - new Date(start);
  if (ms < 0) return "—";
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  return `${hours}j ${minutes}m`;
}

export default function ShiftRecapModal({
  isOpen,
  onClose,
  shift,
  tenant,
  activeBranch,
}) {
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen || !shift) return null;

  const duration = shiftDuration(shift.startTime, shift.endTime || new Date());

  const startingCash = Number(shift.startingCash) || 0;
  const endingCash = Number(shift.endingCash) || 0;

  // Nilai summary penjualan dari shift
  const totalTransactions =
    shift.summary?.totalTransactions ||
    shift._count?.transactions ||
    0;
  const netSales =
    Number(shift.summary?.totalSales) ||
    Number(shift.summary?.totalRevenue) ||
    0;
  const totalDiscounts = Number(shift.summary?.totalDiscounts) || 0;
  const grossSales = netSales + totalDiscounts;

  // Breakdown metode pembayaran jika tersedia atau estimasi agregasi
  const cashSales =
    shift.summary?.cashSales !== undefined
      ? Number(shift.summary.cashSales)
      : netSales; // Fallback jika belum breakdown detail
  const qrisSales = Number(shift.summary?.qrisSales) || 0;
  const transferSales = Number(shift.summary?.transferSales) || 0;

  // Rekonsiliasi Kas Laci
  const expectedCash = startingCash + cashSales;
  const cashDifference = endingCash - expectedCash;

  const isDifferenceZero = Math.abs(cashDifference) < 1;
  const isSurplus = cashDifference > 0;

  // Data terstruktur untuk PDF generator
  const reportPayload = {
    storeName: tenant?.name || activeBranch?.name || "OmniPOS Store",
    branchName: shift.branch?.name || activeBranch?.name || "Cabang Utama",
    storeAddress: activeBranch?.address || tenant?.address || "",
    storePhone: activeBranch?.phone || tenant?.phone || "",
    shiftId: shift.id || "",
    cashierName: shift.user?.name || "Kasir",
    startTime: shift.startTime,
    endTime: shift.endTime || new Date().toISOString(),
    duration,
    startingCash,
    endingCash,
    totalTransactions,
    grossSales,
    totalDiscounts,
    netSales,
    cashSales,
    qrisSales,
    transferSales,
    expectedCash,
    cashDifference,
    differenceStatus: isDifferenceZero
      ? "SESUAI"
      : isSurplus
      ? "SURPLUS"
      : "MINUS",
  };

  const handleDownloadPdf = () => {
    try {
      setIsDownloading(true);
      downloadZReportPdf(reportPayload);
      toast.success("File PDF Z-Report berhasil diunduh!", { icon: "📄" });
    } catch (err) {
      toast.error("Gagal membuat PDF rekap shift.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="w-full max-w-xl rounded-3xl bg-white/95 backdrop-blur-2xl border border-white/90 shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col my-6 max-h-[92vh]">
        {/* Header Modal */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-linear-to-r from-slate-900 to-slate-800 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 font-extrabold shadow-inner">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-tight">
                  Rekap Tutup Shift (Z-Report)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Resmi
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {shift.branch?.name || activeBranch?.name || "Cabang"} · Kasir:{" "}
                {shift.user?.name || "Kasir"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Konten Scrollable */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
          {/* Metadata Shift */}
          <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Waktu Buka
              </span>
              <p className="font-extrabold text-slate-800 mt-0.5">
                {fmtDate(shift.startTime)}
              </p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Waktu Tutup
              </span>
              <p className="font-extrabold text-slate-800 mt-0.5">
                {fmtDate(shift.endTime || new Date())}
              </p>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Durasi Shift
              </span>
              <p className="font-extrabold text-amber-700 mt-0.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{duration}</span>
              </p>
            </div>
          </div>

          {/* 4 Kartu KPI Keuangan */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200/70 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Wallet className="w-3 h-3 text-slate-400" /> Modal Awal
              </span>
              <p className="text-xs sm:text-sm font-extrabold text-slate-900">
                {fmt(startingCash)}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-blue-50/80 border border-blue-200/70 space-y-1">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-blue-500" /> Total Omzet
              </span>
              <p className="text-xs sm:text-sm font-black text-blue-950">
                {fmt(netSales)}
              </p>
              <p className="text-[10px] font-bold text-blue-600">
                {totalTransactions} Transaksi
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200/70 space-y-1">
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1">
                <Tag className="w-3 h-3 text-amber-500" /> Diskon Promo
              </span>
              <p className="text-xs sm:text-sm font-extrabold text-amber-900">
                {fmt(totalDiscounts)}
              </p>
              <p className="text-[10px] font-medium text-amber-600">
                Potongan harga
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200/70 space-y-1">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                <Banknote className="w-3 h-3 text-emerald-500" /> Kas Akhir Fisik
              </span>
              <p className="text-xs sm:text-sm font-black text-emerald-950">
                {fmt(endingCash)}
              </p>
              <p className="text-[10px] font-medium text-emerald-600">
                Uang laci dihitung
              </p>
            </div>
          </div>

          {/* Rincian Metode Pembayaran */}
          <div className="p-4 rounded-2xl bg-white/80 border border-slate-200/80 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <CreditCard className="w-3.5 h-3.5 text-amber-500" />
              <span>Rincian Pembayaran Transaksi</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                <div className="flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-slate-700">Tunai (Cash)</span>
                </div>
                <span className="font-extrabold text-slate-900">
                  {fmt(cashSales)}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                <div className="flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-violet-600" />
                  <span className="font-bold text-slate-700">
                    QRIS (Digital)
                  </span>
                </div>
                <span className="font-extrabold text-slate-900">
                  {fmt(qrisSales)}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-slate-700">
                    Transfer Bank / Kartu
                  </span>
                </div>
                <span className="font-extrabold text-slate-900">
                  {fmt(transferSales)}
                </span>
              </div>
            </div>
          </div>

          {/* Rekonsiliasi Kas Laci & Analisis Selisih */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-200/80">
              <Wallet className="w-3.5 h-3.5 text-amber-500" />
              <span>Rekonsiliasi Kas Laci (Cash Drawer)</span>
            </h3>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Modal Awal Uang Laci</span>
                <span className="font-bold text-slate-800">
                  {fmt(startingCash)}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Penerimaan Penjualan Tunai (+)</span>
                <span className="font-bold text-slate-800">
                  {fmt(cashSales)}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between font-bold text-slate-900">
                <span>Total Kas Seharusnya di Laci (Expected)</span>
                <span className="text-sm font-extrabold text-slate-950">
                  {fmt(expectedCash)}
                </span>
              </div>
              <div className="flex items-center justify-between font-bold text-slate-900">
                <span>Uang Kas Fisik yang Dihitung Kasir (Actual)</span>
                <span className="text-sm font-extrabold text-slate-950">
                  {fmt(endingCash)}
                </span>
              </div>
            </div>

            {/* Banner Status Selisih */}
            <div
              className={`p-3 rounded-xl border flex items-center justify-between text-xs font-extrabold ${
                isDifferenceZero
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : isSurplus
                  ? "bg-amber-50 border-amber-200 text-amber-900"
                  : "bg-rose-50 border-rose-200 text-rose-800"
              }`}
            >
              <div className="flex items-center gap-2">
                {isDifferenceZero ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle
                    className={`w-4 h-4 shrink-0 ${
                      isSurplus ? "text-amber-600" : "text-rose-600"
                    }`}
                  />
                )}
                <span>
                  {isDifferenceZero
                    ? "Status Selisih: PAS / SEIMBANG (Tidak ada selisih uang laci)"
                    : isSurplus
                    ? "Status Selisih: SURPLUS (Kelebihan Uang Fisik di Laci)"
                    : "Status Selisih: MINUS (Kekurangan Uang Fisik di Laci)"}
                </span>
              </div>
              <span className="text-sm font-black">
                {cashDifference > 0 ? `+${fmt(cashDifference)}` : fmt(cashDifference)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Tombol Aksi */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between gap-3 shrink-0">
          <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
            Dokumen resmi Z-Report siap diunduh dalam format PDF.
          </p>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200/80 bg-white/80 hover:bg-white text-slate-700 font-bold text-xs transition-colors cursor-pointer"
            >
              Tutup
            </button>

            <button
              type="button"
              disabled={isDownloading}
              onClick={handleDownloadPdf}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-md shadow-slate-900/15 flex items-center gap-2 transition-all active:scale-98 disabled:opacity-60 cursor-pointer"
            >
              <FileDown className="w-4 h-4 text-amber-400" />
              <span>
                {isDownloading ? "Membuat PDF..." : "Download PDF (Z-Report)"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
