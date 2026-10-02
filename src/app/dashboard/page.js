'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  Clock,
  AlertTriangle,
  Receipt,
  ChevronRight,
  PlusCircle,
  ArrowUpRight,
  CheckCircle2,
  QrCode,
  CreditCard,
  Banknote,
  Download,
  Calendar,
  Package,
  DollarSign,
  RefreshCw,
  Loader2,
  Store,
  Timer,
  User,
  GitBranch,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import api from '../../lib/api';

// ─── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(Number(n) || 0);

const fmtTime = (d) =>
  new Date(d).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

function shiftDuration(start) {
  const ms = Date.now() - new Date(start);
  if (ms < 0) return '—';
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  return `${hours}j ${minutes}m`;
}

// Ikon metode pembayaran
const METHOD_ICONS = {
  CASH: Banknote,
  QRIS: QrCode,
  TRANSFER: CreditCard,
};

// ─── Skeleton Card ──────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="p-5 rounded-3xl bg-white/75 backdrop-blur-2xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] animate-pulse space-y-3">
      <div className="flex items-center justify-between">
        <div className="h-3 w-24 bg-slate-200 rounded-full" />
        <div className="w-8 h-8 rounded-xl bg-slate-100" />
      </div>
      <div className="h-7 w-32 bg-slate-200 rounded-full" />
      <div className="h-3 w-20 bg-slate-100 rounded-full" />
    </div>
  );
}

// ─── Halaman Utama ─────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user, tenant, activeBranchId } = useAuth();
  const { t, language } = useLanguage();

  // ── State ────────────────────────────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Data hari ini
  const [todaySummary, setTodaySummary] = useState(null);
  // Transaksi terkini (5 terakhir)
  const [recentTransactions, setRecentTransactions] = useState([]);
  // Shift aktif user ini
  const [activeShift, setActiveShift] = useState(null);
  // Jumlah produk
  const [productCount, setProductCount] = useState(null);

  // ── Fetch semua data ─────────────────────────────────────────────────────────
  const fetchDashboardData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const today = new Date().toISOString().slice(0, 10);

      const [summaryRes, recentRes, shiftRes, productRes] = await Promise.allSettled([
        // Ringkasan transaksi hari ini
        api.get(`/transactions?startDate=${today}&endDate=${today}&limit=5`),
        // 5 transaksi terbaru (dengan items)
        api.get(`/transactions?limit=5`),
        // Shift aktif
        api.get('/shifts/active'),
        // Jumlah produk
        api.get('/products?limit=1'),
      ]);

      // Summary hari ini
      if (summaryRes.status === 'fulfilled' && summaryRes.value?.success) {
        setTodaySummary(summaryRes.value.summary);
        // Ambil 5 transaksi hari ini untuk tabel
        setRecentTransactions(summaryRes.value.data?.slice(0, 5) || []);
      }

      // Jika tidak ada transaksi hari ini, ambil dari recent
      if (
        summaryRes.status === 'fulfilled' &&
        summaryRes.value?.data?.length === 0 &&
        recentRes.status === 'fulfilled' &&
        recentRes.value?.success
      ) {
        setRecentTransactions(recentRes.value.data?.slice(0, 5) || []);
      }

      // Shift aktif
      if (shiftRes.status === 'fulfilled' && shiftRes.value?.success) {
        setActiveShift(shiftRes.value.data);
      }

      // Jumlah produk
      if (productRes.status === 'fulfilled' && productRes.value?.success) {
        // Coba ambil dari pagination.total (jika ?limit dipakai), atau total, atau hitung array
        const count =
          productRes.value.pagination?.total ??
          productRes.value.total ??
          productRes.value.data?.length ??
          0;
        setProductCount(count);
      }
    } catch (err) {
      toast.error('Gagal memuat data dashboard.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [activeBranchId]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleRefresh = () => {
    fetchDashboardData(true);
    toast.success('Data diperbarui.', { duration: 1500 });
  };

  // ── Hitung rata-rata per transaksi ─────────────────────────────────────────
  const avgPerTrx =
    todaySummary?.totalTransactions > 0
      ? (parseFloat(todaySummary.totalRevenue || 0) / todaySummary.totalTransactions).toFixed(0)
      : 0;

  return (
    <div className="space-y-6">
      {/* ── 1. Header Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50/90 border border-amber-200/70 text-amber-800 text-[11px] font-bold mb-2 shadow-xs">
            <Calendar className="w-3 h-3 text-amber-600" />
            <span>{fmtDate(new Date())}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Ringkasan Hari Ini
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Selamat datang, <strong>{user?.name || 'Pengguna'}</strong> ·{' '}
            {tenant?.name || 'Toko'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Tombol refresh */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-white/80 hover:bg-white border border-slate-200/80 shadow-xs transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {/* Shortcut ke POS */}
          <Link
            href="/dashboard/pos"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-md shadow-slate-900/15 transition-all active:scale-95"
          >
            <Store className="w-3.5 h-3.5 text-amber-400" />
            <span>Buka Kasir</span>
          </Link>
        </div>
      </div>

      {/* ── 2. KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            {/* Card 1: Omzet Hari Ini */}
            <div className="p-5 rounded-3xl bg-white/75 backdrop-blur-2xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-inset ring-white/60 hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Omzet Hari Ini
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-xs">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 tracking-tight">
                {fmt(todaySummary?.totalRevenue || 0)}
              </p>
              <div className="flex items-center gap-1.5 mt-2 text-[11px] font-semibold text-emerald-600">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>
                  {todaySummary?.totalTransactions || 0} transaksi hari ini
                </span>
              </div>
            </div>

            {/* Card 2: Jumlah Transaksi */}
            <div className="p-5 rounded-3xl bg-white/75 backdrop-blur-2xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-inset ring-white/60 hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Transaksi
                </span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shadow-xs">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 tracking-tight">
                {todaySummary?.totalTransactions || 0}{' '}
                <span className="text-base font-semibold text-slate-400">trx</span>
              </p>
              <p className="text-[11px] font-medium text-slate-500 mt-2">
                Rata-rata{' '}
                <span className="font-bold text-slate-700">{fmt(avgPerTrx)}</span>
                {' '}/ transaksi
              </p>
            </div>

            {/* Card 3: Laba Bersih */}
            <div className="p-5 rounded-3xl bg-white/75 backdrop-blur-2xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-inset ring-white/60 hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Laba Bersih
                </span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-xs">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 tracking-tight">
                {fmt(todaySummary?.totalProfit || 0)}
              </p>
              <p className="text-[11px] font-medium text-slate-500 mt-2">
                Modal{' '}
                <span className="font-bold text-slate-700">
                  {fmt(todaySummary?.totalCost || 0)}
                </span>
              </p>
            </div>

            {/* Card 4: Status Shift / Produk Aktif */}
            {activeShift ? (
              <div className="p-5 rounded-3xl bg-white/75 backdrop-blur-2xl border border-emerald-200/60 shadow-[0_8px_30px_rgba(16,185,129,0.06)] ring-1 ring-inset ring-emerald-100/60 hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Shift Berjalan
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-xs">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-black text-slate-900 tracking-tight truncate">
                    {activeShift.user?.name || user?.name}
                  </p>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Timer className="w-3 h-3" />
                    {shiftDuration(activeShift.startTime)}
                  </span>
                  <Link
                    href="/dashboard/shifts"
                    className="text-[10px] font-bold text-amber-700 hover:text-amber-800 underline underline-offset-2"
                  >
                    Lihat shift →
                  </Link>
                </div>
              </div>
            ) : (
              <div className="p-5 rounded-3xl bg-white/75 backdrop-blur-2xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-inset ring-white/60 hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Produk Aktif
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 shadow-xs">
                    <Package className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-black text-slate-900 tracking-tight">
                  {productCount ?? '—'}
                  <span className="text-base font-semibold text-slate-400 ml-1">produk</span>
                </p>
                <Link
                  href="/dashboard/products"
                  className="text-[11px] font-semibold text-amber-700 hover:text-amber-800 mt-2 flex items-center gap-1"
                >
                  Kelola produk →
                </Link>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── 3. Banner Shift Tidak Aktif ── */}
      {!isLoading && !activeShift && (
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 flex items-center gap-4 shadow-lg shadow-slate-900/10">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 flex items-center justify-center shrink-0">
            <Store className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white">Belum ada shift berjalan</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Buka shift kasir untuk mulai mencatat transaksi hari ini.
            </p>
          </div>
          <Link
            href="/dashboard/pos"
            className="shrink-0 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-900 text-xs font-extrabold transition-colors"
          >
            Buka Kasir →
          </Link>
        </div>
      )}

      {/* ── 4. Transaksi Terkini ── */}
      <div className="rounded-3xl bg-white/75 backdrop-blur-2xl border border-white/80 shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] ring-1 ring-inset ring-white/60 p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/60">
          <div>
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-amber-600" />
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                Transaksi Terkini
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {todaySummary?.totalTransactions > 0
                ? `${todaySummary.totalTransactions} transaksi hari ini`
                : 'Belum ada transaksi hari ini'}
            </p>
          </div>

          <Link
            href="/dashboard/transactions"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-800 transition-colors self-start sm:self-auto"
          >
            <span>Lihat semua</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Loading skeleton tabel */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-12 rounded-2xl bg-slate-100/70 animate-pulse"
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && recentTransactions.length === 0 && (
          <div className="py-12 flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
              <Receipt className="w-6 h-6 text-slate-300" />
            </div>
            <p className="text-sm font-bold text-slate-700">Belum ada transaksi</p>
            <p className="text-xs text-slate-400 max-w-xs">
              Transaksi yang dibuat dari kasir akan muncul di sini secara real-time.
            </p>
            <Link
              href="/dashboard/pos"
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
            >
              Mulai Transaksi
            </Link>
          </div>
        )}

        {/* Tabel transaksi */}
        {!isLoading && recentTransactions.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/50 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-3">No. Resi</th>
                  <th className="py-3 px-3">Waktu</th>
                  <th className="py-3 px-3 hidden sm:table-cell">Kasir</th>
                  <th className="py-3 px-3 hidden md:table-cell">Metode</th>
                  <th className="py-3 px-3 text-right">Total</th>
                  <th className="py-3 px-3 text-right hidden sm:table-cell">Laba</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {recentTransactions.map((trx) => {
                  const MethodIcon = METHOD_ICONS[trx.paymentMethod] || Banknote;
                  const profit =
                    parseFloat(trx.totalAmount || 0) - parseFloat(trx.totalCost || 0);

                  return (
                    <tr
                      key={trx.id}
                      className="hover:bg-white/90 transition-colors"
                    >
                      {/* Nomor resi */}
                      <td className="py-3.5 px-3 font-mono font-bold text-slate-800 text-[11px]">
                        {trx.receiptNumber}
                      </td>

                      {/* Waktu */}
                      <td className="py-3.5 px-3 text-slate-500 font-medium">
                        {fmtTime(trx.createdAt)}
                      </td>

                      {/* Kasir */}
                      <td className="py-3.5 px-3 hidden sm:table-cell">
                        <span className="flex items-center gap-1.5 text-slate-600 font-semibold">
                          <User className="w-3 h-3 text-slate-400" />
                          {trx.shift?.user?.name || '—'}
                        </span>
                      </td>

                      {/* Metode Bayar */}
                      <td className="py-3.5 px-3 hidden md:table-cell">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100/80 border border-slate-200/60 text-[11px] font-semibold text-slate-700">
                          <MethodIcon className="w-3.5 h-3.5 text-amber-600" />
                          <span>{trx.paymentMethod}</span>
                        </div>
                      </td>

                      {/* Total */}
                      <td className="py-3.5 px-3 text-right font-extrabold text-slate-900">
                        {fmt(trx.totalAmount)}
                      </td>

                      {/* Laba */}
                      <td className="py-3.5 px-3 text-right hidden sm:table-cell">
                        <span
                          className={`text-[11px] font-bold ${
                            profit >= 0 ? 'text-emerald-700' : 'text-rose-600'
                          }`}
                        >
                          {fmt(profit)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer tabel */}
        {!isLoading && recentTransactions.length > 0 && (
          <div className="pt-3 border-t border-slate-200/50 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
            <span>Menampilkan {recentTransactions.length} transaksi terbaru</span>
            <Link
              href="/dashboard/transactions"
              className="font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1"
            >
              <span>Lihat semua transaksi</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>

      {/* ── 5. Quick Access Menu ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            href: '/dashboard/pos',
            icon: Store,
            color: 'bg-amber-500',
            label: 'Kasir POS',
            desc: 'Mulai transaksi',
          },
          {
            href: '/dashboard/products',
            icon: Package,
            color: 'bg-blue-500',
            label: 'Produk',
            desc: 'Kelola katalog',
          },
          {
            href: '/dashboard/transactions',
            icon: Receipt,
            color: 'bg-emerald-500',
            label: 'Transaksi',
            desc: 'Riwayat penjualan',
          },
          {
            href: '/dashboard/shifts',
            icon: Clock,
            color: 'bg-purple-500',
            label: 'Shift',
            desc: 'Manajemen shift',
          },
        ].map((menu) => (
          <Link
            key={menu.href}
            href={menu.href}
            className="p-4 rounded-2xl bg-white/70 border border-white/90 shadow-xs hover:shadow-md hover:bg-white/90 transition-all group flex items-center gap-3"
          >
            <div
              className={`w-9 h-9 rounded-xl ${menu.color} flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform`}
            >
              <menu.icon className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">{menu.label}</p>
              <p className="text-[10px] text-slate-400 truncate">{menu.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
