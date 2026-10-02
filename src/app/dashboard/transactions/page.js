"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Receipt,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  X,
  Banknote,
  QrCode,
  CreditCard,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  Calendar,
  Clock,
  User,
  ChevronLeft,
  ChevronRight,
  Package,
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
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const fmtTime = (d) =>
  new Date(d).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });

const fmtDateTime = (d) => `${fmtDate(d)}, ${fmtTime(d)}`;

// ─── Konstanta ─────────────────────────────────────────────────────────────────
const PAYMENT_METHODS = [
  { key: "", label: "Semua Metode" },
  { key: "CASH", label: "Tunai", icon: Banknote, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  { key: "QRIS", label: "QRIS", icon: QrCode, color: "text-violet-600 bg-violet-50 border-violet-200" },
  { key: "TRANSFER", label: "Transfer", icon: CreditCard, color: "text-blue-600 bg-blue-50 border-blue-200" },
];

function paymentMeta(method) {
  return (
    PAYMENT_METHODS.find((m) => m.key === method) || {
      label: method,
      icon: CreditCard,
      color: "text-slate-600 bg-slate-50 border-slate-200",
    }
  );
}

// Tanggal hari ini dalam format yyyy-mm-dd
function today() {
  return new Date().toISOString().slice(0, 10);
}

// ─── Kartu Ringkasan ───────────────────────────────────────────────────────────
function SummaryCard({ icon: Icon, label, value, sub, color, trend }) {
  return (
    <div className="p-5 rounded-3xl bg-white/80 backdrop-blur-xl border border-white/90 shadow-[0_8px_32px_0_rgba(31,38,135,0.05)] space-y-3">
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend !== undefined && (
          <div
            className={`flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full ${
              trend >= 0
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-rose-50 text-rose-700 border border-rose-200"
            }`}
          >
            {trend >= 0 ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
          </div>
        )}
      </div>
      <div>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-xl font-black text-slate-900 mt-0.5 tracking-tight">{value}</p>
        {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Baris Transaksi (collapsible detail) ──────────────────────────────────────
function TransactionRow({ tx, isExpanded, onToggle }) {
  const pm = paymentMeta(tx.paymentMethod);
  const PMIcon = pm.icon || CreditCard;

  return (
    <div className="border-b border-slate-50 last:border-0">
      {/* Baris utama */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 px-5 py-4 items-center hover:bg-slate-50/60 transition-colors text-left"
      >
        {/* Expand icon */}
        <div className="text-slate-300">
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </div>

        {/* Receipt + waktu */}
        <div className="min-w-0">
          <p className="text-xs font-black text-slate-900 font-mono tracking-tight">
            {tx.receiptNumber}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <Clock className="w-3 h-3 text-slate-300 shrink-0" />
            <span className="text-[11px] text-slate-400">{fmtDateTime(tx.createdAt)}</span>
            {tx.shift?.user?.name && (
              <>
                <span className="text-slate-200">·</span>
                <User className="w-3 h-3 text-slate-300 shrink-0" />
                <span className="text-[11px] text-slate-400">{tx.shift.user.name}</span>
              </>
            )}
          </div>
        </div>

        {/* Metode bayar */}
        <div
          className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold ${pm.color}`}
        >
          <PMIcon className="w-3 h-3" />
          <span>{pm.label}</span>
        </div>

        {/* Jumlah item */}
        <div className="hidden md:block text-right">
          <span className="text-xs font-semibold text-slate-400">
            {tx.items?.length || 0} item
          </span>
        </div>

        {/* Total */}
        <div className="text-right shrink-0">
          <p className="text-sm font-black text-emerald-700">{fmt(tx.totalAmount)}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Laba {fmt(parseFloat(tx.totalAmount) - parseFloat(tx.totalCost))}
          </p>
        </div>
      </button>

      {/* Detail item (expanded) */}
      {isExpanded && (
        <div className="px-5 pb-4 bg-slate-50/70 border-t border-slate-100 animate-in fade-in slide-in-from-top-1 duration-150">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 pt-3 pb-2">
            Rincian Item
          </p>
          <div className="space-y-1.5 mb-4">
            {tx.items?.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 py-2 px-3 rounded-xl bg-white border border-slate-100"
              >
                <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                  <Package className="w-3.5 h-3.5 text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">
                    {item.productName}
                    {item.variantName !== "Regular" && (
                      <span className="text-slate-400 font-normal"> — {item.variantName}</span>
                    )}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {fmt(item.price)} × {item.quantity}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-extrabold text-slate-900">{fmt(item.subtotal)}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Ringkasan kecil */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2.5 rounded-xl bg-white border border-slate-100 text-center">
              <p className="text-[10px] text-slate-400 font-semibold">Omzet</p>
              <p className="text-xs font-extrabold text-slate-900 mt-0.5">{fmt(tx.totalAmount)}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-slate-100 text-center">
              <p className="text-[10px] text-slate-400 font-semibold">Modal</p>
              <p className="text-xs font-extrabold text-slate-900 mt-0.5">{fmt(tx.totalCost)}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-center">
              <p className="text-[10px] text-emerald-600 font-semibold">Laba</p>
              <p className="text-xs font-extrabold text-emerald-700 mt-0.5">
                {fmt(parseFloat(tx.totalAmount) - parseFloat(tx.totalCost))}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Halaman Utama ─────────────────────────────────────────────────────────────
export default function TransactionsPage() {
  const { user, hasPermission, activeBranchId } = useAuth();

  const canView = user?.isOwner || hasPermission("reports:view");

  // Filter state — default ke hari ini
  const [startDate, setStartDate] = useState(today());
  const [endDate, setEndDate] = useState(today());
  const [paymentMethod, setPaymentMethod] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Data state
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const fetchTransactions = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      if (paymentMethod) params.set("paymentMethod", paymentMethod);
      params.set("page", page);
      params.set("limit", 20);

      const res = await api.get(`/transactions?${params.toString()}`);
      if (res?.success) {
        setTransactions(res.data);
        setPagination(res.pagination);
        setSummary(res.summary);
      }
    } catch (err) {
      toast.error(err.message || "Gagal memuat data transaksi.");
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate, paymentMethod, page, activeBranchId]);

  useEffect(() => {
    if (canView) fetchTransactions();
  }, [canView, fetchTransactions]);

  // Reset page ke 1 saat filter berubah
  const applyFilter = () => {
    setPage(1);
    setExpandedId(null);
  };

  // Filter client-side by receipt number / product name
  const filteredTx = search.trim()
    ? transactions.filter(
        (tx) =>
          tx.receiptNumber.toLowerCase().includes(search.toLowerCase()) ||
          tx.items?.some((i) =>
            i.productName.toLowerCase().includes(search.toLowerCase())
          )
      )
    : transactions;

  if (!canView && user) return <UnauthorizedState requiredPermission="reports:view" />;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 animate-in fade-in duration-300">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/40 text-emerald-800 text-xs font-extrabold tracking-wide uppercase">
            <Receipt className="w-3.5 h-3.5 text-emerald-600" />
            <span>Riwayat Transaksi</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Transaksi Penjualan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-lg">
            Pantau omzet, laba, dan riwayat setiap transaksi yang terjadi di kasir.
          </p>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="p-4 rounded-3xl bg-white/80 backdrop-blur-xl border border-white/90 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3 flex-wrap">
          {/* Tanggal Mulai */}
          <div className="space-y-1.5 min-w-0">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3 h-3" /> Dari Tanggal
            </label>
            <input
              type="date"
              value={startDate}
              max={endDate || today()}
              onChange={(e) => { setStartDate(e.target.value); applyFilter(); }}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:border-amber-400 focus:bg-white text-xs font-semibold text-slate-800 outline-none transition-all"
            />
          </div>

          {/* Tanggal Akhir */}
          <div className="space-y-1.5 min-w-0">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3 h-3" /> Sampai Tanggal
            </label>
            <input
              type="date"
              value={endDate}
              min={startDate}
              max={today()}
              onChange={(e) => { setEndDate(e.target.value); applyFilter(); }}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:border-amber-400 focus:bg-white text-xs font-semibold text-slate-800 outline-none transition-all"
            />
          </div>

          {/* Filter Metode Pembayaran */}
          <div className="space-y-1.5 min-w-0">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="w-3 h-3" /> Metode
            </label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => { setPaymentMethod(m.key); applyFilter(); }}
                  className={`px-3 py-2 rounded-xl text-[11px] font-bold border transition-all ${
                    paymentMethod === m.key
                      ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Shortcut hari ini / 7 hari */}
          <div className="space-y-1.5 min-w-0">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Cepat
            </label>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => { setStartDate(today()); setEndDate(today()); applyFilter(); }}
                className="px-3 py-2 rounded-xl text-[11px] font-bold border bg-slate-50 border-slate-200 text-slate-600 hover:border-amber-400 hover:text-amber-700 transition-all"
              >
                Hari ini
              </button>
              <button
                type="button"
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() - 6);
                  setStartDate(d.toISOString().slice(0, 10));
                  setEndDate(today());
                  applyFilter();
                }}
                className="px-3 py-2 rounded-xl text-[11px] font-bold border bg-slate-50 border-slate-200 text-slate-600 hover:border-amber-400 hover:text-amber-700 transition-all"
              >
                7 Hari
              </button>
              <button
                type="button"
                onClick={() => {
                  const d = new Date();
                  d.setDate(1);
                  setStartDate(d.toISOString().slice(0, 10));
                  setEndDate(today());
                  applyFilter();
                }}
                className="px-3 py-2 rounded-xl text-[11px] font-bold border bg-slate-50 border-slate-200 text-slate-600 hover:border-amber-400 hover:text-amber-700 transition-all"
              >
                Bulan ini
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Kartu Ringkasan ── */}
      {summary && !isLoading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <SummaryCard
            icon={ShoppingBag}
            label="Total Transaksi"
            value={summary.totalTransactions}
            sub={`${fmtDate(startDate)} — ${fmtDate(endDate)}`}
            color="bg-amber-50 border border-amber-100 text-amber-600"
          />
          <SummaryCard
            icon={DollarSign}
            label="Total Omzet"
            value={fmt(summary.totalRevenue)}
            color="bg-blue-50 border border-blue-100 text-blue-600"
          />
          <SummaryCard
            icon={TrendingDown}
            label="Total Modal"
            value={fmt(summary.totalCost)}
            color="bg-slate-100 border border-slate-200 text-slate-500"
          />
          <SummaryCard
            icon={TrendingUp}
            label="Total Laba Bersih"
            value={fmt(summary.totalProfit)}
            color="bg-emerald-50 border border-emerald-100 text-emerald-600"
          />
        </div>
      )}

      {/* Skeleton summary saat loading */}
      {isLoading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-28 rounded-3xl bg-white/60 border border-white/90 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* ── Tabel Transaksi ── */}
      <div className="rounded-3xl bg-white/80 backdrop-blur-xl border border-white/90 shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] overflow-hidden">

        {/* Search + info */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari no. resi atau produk..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:border-amber-400 focus:bg-white text-xs font-semibold text-slate-800 outline-none transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-md text-slate-400 hover:text-slate-700"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          {pagination && (
            <p className="text-[11px] font-semibold text-slate-400 ml-auto shrink-0">
              {pagination.total} transaksi
            </p>
          )}
        </div>

        {/* Header kolom */}
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 px-5 py-3 border-b border-slate-100 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
          <span className="w-4" />
          <span>Transaksi</span>
          <span className="hidden sm:block w-24">Metode</span>
          <span className="hidden md:block w-16 text-right">Item</span>
          <span className="text-right w-28">Total</span>
        </div>

        {/* Skeleton loading */}
        {isLoading && (
          <div>
            {[1, 2, 3, 4, 5].map((n) => (
              <div
                key={n}
                className="grid grid-cols-[auto_1fr_auto_auto] gap-4 px-5 py-4 border-b border-slate-50 animate-pulse items-center"
              >
                <div className="w-4 h-4 rounded bg-slate-200" />
                <div className="space-y-2">
                  <div className="h-3 bg-slate-200 rounded-lg w-36" />
                  <div className="h-2.5 bg-slate-100 rounded-lg w-48" />
                </div>
                <div className="h-5 bg-slate-100 rounded-full w-16 hidden sm:block" />
                <div className="text-right space-y-1">
                  <div className="h-3.5 bg-slate-200 rounded-lg w-20 ml-auto" />
                  <div className="h-2.5 bg-slate-100 rounded-lg w-16 ml-auto" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && filteredTx.length === 0 && (
          <div className="py-20 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center">
              <Receipt className="w-8 h-8 text-slate-300" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700">Belum ada transaksi</p>
              <p className="text-xs text-slate-400 mt-1">
                {search
                  ? `Tidak ada hasil untuk "${search}"`
                  : "Tidak ada transaksi dalam rentang tanggal yang dipilih"}
              </p>
            </div>
          </div>
        )}

        {/* Baris transaksi */}
        {!isLoading && filteredTx.length > 0 && (
          <div>
            {filteredTx.map((tx) => (
              <TransactionRow
                key={tx.id}
                tx={tx}
                isExpanded={expandedId === tx.id}
                onToggle={() => setExpandedId(expandedId === tx.id ? null : tx.id)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && !search && (
          <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between">
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

              {/* Nomor halaman */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const pageNum =
                    pagination.totalPages <= 5
                      ? i + 1
                      : Math.max(1, Math.min(pagination.page - 2, pagination.totalPages - 4)) + i;
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
                })}
              </div>

              <button
                type="button"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
