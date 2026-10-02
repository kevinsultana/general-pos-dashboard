"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Clock,
  ChevronDown,
  ChevronUp,
  User,
  GitBranch,
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  CheckCircle2,
  AlertCircle,
  Receipt,
  ChevronLeft,
  ChevronRight,
  LogIn,
  LogOut,
  Timer,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../../contexts/AuthContext";
import api from "../../../lib/api";
import UnauthorizedState from "../../../components/common/UnauthorizedState";

// ─── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(n) || 0);

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("id-ID", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const fmtTime = (d) =>
  new Date(d).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });

/** Hitung durasi shift dalam format "X j Y m" */
function shiftDuration(start, end) {
  const ms = new Date(end || Date.now()) - new Date(start);
  if (ms < 0) return "—";
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  return `${hours}j ${minutes}m`;
}

// ─── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  if (status === "OPEN") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-extrabold uppercase tracking-wider">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Berjalan
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-500 text-[10px] font-extrabold uppercase tracking-wider">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
      Selesai
    </span>
  );
}

// ─── Kartu Shift ───────────────────────────────────────────────────────────────
function ShiftCard({ shift, isExpanded, onToggle }) {
  const isOpen = shift.status === "OPEN";
  const duration = shiftDuration(shift.startTime, shift.endTime);

  return (
    <div
      className={`rounded-3xl border overflow-hidden transition-all duration-200 ${
        isOpen
          ? "bg-white/90 border-emerald-200 shadow-[0_8px_30px_rgba(16,185,129,0.08)]"
          : "bg-white/70 border-white/90 shadow-[0_4px_16px_0_rgba(31,38,135,0.05)]"
      }`}
    >
      {/* Header kartu (klik untuk expand) */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full p-5 flex items-start gap-4 text-left hover:bg-slate-50/40 transition-colors"
      >
        {/* Ikon status */}
        <div
          className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 ${
            isOpen
              ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/25"
              : "bg-slate-100 text-slate-400 border border-slate-200"
          }`}
        >
          <Clock className="w-5 h-5" />
        </div>

        {/* Info utama */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Baris atas: tanggal + status */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-sm font-black text-slate-900">
                {fmtDate(shift.startTime)}
              </p>
              <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400 font-semibold flex-wrap">
                <span className="flex items-center gap-1">
                  <LogIn className="w-3 h-3 text-emerald-500" />
                  {fmtTime(shift.startTime)}
                </span>
                {shift.endTime && (
                  <span className="flex items-center gap-1">
                    <LogOut className="w-3 h-3 text-rose-400" />
                    {fmtTime(shift.endTime)}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Timer className="w-3 h-3 text-amber-500" />
                  {isOpen ? `${duration} (berlangsung)` : duration}
                </span>
              </div>
            </div>
            <StatusBadge status={shift.status} />
          </div>

          {/* Baris bawah: kasir + cabang + ringkasan */}
          <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
            <span className="flex items-center gap-1.5 font-semibold">
              <User className="w-3.5 h-3.5 text-slate-400" />
              {shift.user?.name || "—"}
            </span>
            <span className="flex items-center gap-1.5 font-semibold">
              <GitBranch className="w-3.5 h-3.5 text-slate-400" />
              {shift.branch?.name || "—"}
            </span>
            <span className="flex items-center gap-1.5 font-semibold">
              <ShoppingBag className="w-3.5 h-3.5 text-amber-500" />
              {shift.summary?.totalTransactions || 0} transaksi
            </span>
            <span className="font-extrabold text-emerald-700">
              {fmt(shift.summary?.totalRevenue || 0)}
            </span>
          </div>
        </div>

        {/* Chevron */}
        <div className="text-slate-300 shrink-0 mt-1">
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </div>
      </button>

      {/* Detail expanded */}
      {isExpanded && (
        <div className="border-t border-slate-100 px-5 pb-5 pt-4 space-y-4 animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Grid ringkasan keuangan */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Wallet className="w-3 h-3" /> Modal Awal
              </p>
              <p className="text-sm font-extrabold text-slate-900">
                {fmt(shift.startingCash)}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Wallet className="w-3 h-3" /> Uang Akhir
              </p>
              <p className="text-sm font-extrabold text-slate-900">
                {shift.endingCash != null ? fmt(shift.endingCash) : "—"}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-blue-50 border border-blue-100 space-y-1">
              <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider flex items-center gap-1">
                <DollarSign className="w-3 h-3" /> Omzet
              </p>
              <p className="text-sm font-extrabold text-slate-900">
                {fmt(shift.summary?.totalRevenue || 0)}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100 space-y-1">
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Laba
              </p>
              <p className="text-sm font-extrabold text-emerald-700">
                {fmt(shift.summary?.totalProfit || 0)}
              </p>
            </div>
          </div>

          {/* Selisih uang laci jika shift sudah ditutup */}
          {!isOpen && shift.endingCash != null && (
            <div
              className={`flex items-center gap-3 p-3 rounded-2xl border text-xs font-semibold ${
                parseFloat(shift.endingCash) >=
                parseFloat(shift.startingCash) +
                  parseFloat(shift.summary?.totalRevenue || 0)
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-rose-50 border-rose-200 text-rose-700"
              }`}
            >
              {parseFloat(shift.endingCash) >=
              parseFloat(shift.startingCash) +
                parseFloat(shift.summary?.totalRevenue || 0) ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>
                Selisih uang laci:{" "}
                <strong>
                  {fmt(
                    parseFloat(shift.endingCash) -
                      parseFloat(shift.startingCash) -
                      parseFloat(shift.summary?.totalRevenue || 0)
                  )}
                </strong>{" "}
                (uang akhir − modal awal − omzet cash)
              </span>
            </div>
          )}

          {/* Tautan ke transaksi shift ini */}
          <a
            href={`/dashboard/transactions?shiftId=${shift.id}`}
            className="inline-flex items-center gap-2 text-xs font-bold text-amber-700 hover:text-amber-800 transition-colors"
          >
            <Receipt className="w-3.5 h-3.5" />
            Lihat {shift.summary?.totalTransactions || 0} transaksi shift ini →
          </a>
        </div>
      )}
    </div>
  );
}

// ─── Halaman Utama ─────────────────────────────────────────────────────────────
export default function ShiftsPage() {
  const { user, hasPermission, activeBranchId } = useAuth();

  const canView = user?.isOwner || hasPermission("pos:shift");

  const [shifts, setShifts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(""); // "" | "OPEN" | "CLOSED"
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState(null);

  // ── Stats ringkas dari data yang ter-load ────────────────────────────────────
  const openShifts = shifts.filter((s) => s.status === "OPEN");
  const closedShifts = shifts.filter((s) => s.status === "CLOSED");

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const fetchShifts = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({ page, limit: 15 });
      if (statusFilter) params.set("status", statusFilter);

      const res = await api.get(`/shifts?${params.toString()}`);
      if (res?.success) {
        setShifts(res.data);
        setPagination(res.pagination);
        // Auto-expand shift OPEN pertama
        const firstOpen = res.data.find((s) => s.status === "OPEN");
        if (firstOpen && page === 1) setExpandedId(firstOpen.id);
      }
    } catch (err) {
      toast.error(err.message || "Gagal memuat data shift.");
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, page, activeBranchId]);

  useEffect(() => {
    if (canView) fetchShifts();
  }, [canView, fetchShifts]);

  const handleFilterChange = (val) => {
    setStatusFilter(val);
    setPage(1);
    setExpandedId(null);
  };

  if (!canView && user) return <UnauthorizedState requiredPermission="pos:shift" />;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 animate-in fade-in duration-300">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-400/40 text-amber-800 text-xs font-extrabold tracking-wide uppercase">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Manajemen Shift</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Shift Kasir
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-lg">
            Pantau riwayat shift kasir, durasi kerja, dan ringkasan penjualan per shift.
          </p>
        </div>
      </div>

      {/* ── Banner shift sedang berjalan ── */}
      {!isLoading && openShifts.length > 0 && (
        <div className="p-5 rounded-3xl bg-linear-to-r from-emerald-500/10 via-emerald-400/5 to-emerald-500/5 border border-emerald-200/80 flex items-center gap-4 shadow-sm">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500 flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/30">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-slate-900">
              {openShifts.length} Shift Sedang Berjalan
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {openShifts.map((s) => s.user?.name).join(", ")} ·{" "}
              {openShifts[0]?.branch?.name}
            </p>
          </div>
          <a
            href="/dashboard/pos"
            className="shrink-0 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold transition-colors"
          >
            Buka Kasir →
          </a>
        </div>
      )}

      {/* ── Filter Status ── */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { key: "", label: "Semua Shift" },
          { key: "OPEN", label: "Sedang Berjalan" },
          { key: "CLOSED", label: "Selesai" },
        ].map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => handleFilterChange(f.key)}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
              statusFilter === f.key
                ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                : "bg-white/80 text-slate-600 border-slate-200 hover:border-slate-300"
            }`}
          >
            {f.label}
            {!isLoading && f.key === "OPEN" && openShifts.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-emerald-500 text-white text-[9px] font-extrabold">
                {openShifts.length}
              </span>
            )}
          </button>
        ))}

        {pagination && (
          <span className="ml-auto text-[11px] font-semibold text-slate-400">
            {pagination.total} shift
          </span>
        )}
      </div>

      {/* ── Loading skeleton ── */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-28 rounded-3xl bg-white/60 border border-white/90 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* ── Empty state ── */}
      {!isLoading && shifts.length === 0 && (
        <div className="py-20 flex flex-col items-center gap-4 text-center rounded-3xl bg-white/70 border border-white/90">
          <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center">
            <Clock className="w-8 h-8 text-slate-300" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-700">Belum ada shift tercatat</p>
            <p className="text-xs text-slate-400 mt-1">
              {statusFilter === "OPEN"
                ? "Tidak ada shift yang sedang berjalan saat ini."
                : statusFilter === "CLOSED"
                ? "Belum ada shift yang selesai."
                : "Buka kasir untuk memulai shift pertama Anda."}
            </p>
          </div>
          <a
            href="/dashboard/pos"
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold transition-colors"
          >
            Buka Kasir
          </a>
        </div>
      )}

      {/* ── Daftar kartu shift ── */}
      {!isLoading && shifts.length > 0 && (
        <div className="space-y-3">
          {shifts.map((shift) => (
            <ShiftCard
              key={shift.id}
              shift={shift}
              isExpanded={expandedId === shift.id}
              onToggle={() =>
                setExpandedId(expandedId === shift.id ? null : shift.id)
              }
            />
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold text-slate-400">
            Halaman {pagination.page} dari {pagination.totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-center gap-1">
              {Array.from(
                { length: Math.min(5, pagination.totalPages) },
                (_, i) => {
                  const pageNum =
                    pagination.totalPages <= 5
                      ? i + 1
                      : Math.max(
                          1,
                          Math.min(
                            pagination.page - 2,
                            pagination.totalPages - 4
                          )
                        ) + i;
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setPage(pageNum)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                        pageNum === pagination.page
                          ? "bg-slate-900 text-white"
                          : "text-slate-500 hover:bg-slate-100"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                }
              )}
            </div>

            <button
              type="button"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() =>
                setPage((p) => Math.min(pagination.totalPages, p + 1))
              }
              className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
