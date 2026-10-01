'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  ShoppingBag,
  Clock,
  AlertTriangle,
  Receipt,
  Printer,
  ChevronRight,
  Filter,
  PlusCircle,
  ArrowUpRight,
  CheckCircle2,
  Hourglass,
  QrCode,
  CreditCard,
  Banknote,
  Sparkles,
  Download,
  Calendar,
  Layers,
  Store,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import api from '../../lib/api';

export default function DashboardPage() {
  const { user, tenant, activeBranch } = useAuth();
  const { t, language } = useLanguage();
  const [selectedFilter, setSelectedFilter] = useState('ALL');

  // Real data states
  const [summary, setSummary] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [activeShift, setActiveShift] = useState(null);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch real data from backend
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];

      const [summaryRes, ordersRes, shiftRes, productsRes] = await Promise.allSettled([
        api.get('/reports/summary', { params: { startDate: todayStr, endDate: todayStr } }),
        api.get('/orders', { params: { limit: 8 } }),
        api.get('/shifts/active'),
        api.get('/products', { params: { limit: 50 } }),
      ]);

      if (summaryRes.status === 'fulfilled' && summaryRes.value.data?.success) {
        setSummary(summaryRes.value.data.data);
      }

      if (ordersRes.status === 'fulfilled' && ordersRes.value.data?.success) {
        setRecentOrders(ordersRes.value.data.data || []);
      }

      if (shiftRes.status === 'fulfilled' && shiftRes.value.data?.success) {
        setActiveShift(shiftRes.value.data.data);
      }

      if (productsRes.status === 'fulfilled' && productsRes.value.data?.success) {
        const prods = productsRes.value.data.data || [];
        const low = prods.filter((p) => {
          const totalStock = p.stocks?.reduce((acc, s) => acc + (s.quantity || 0), 0) || 0;
          return totalStock <= (p.minStock || 5);
        });
        setLowStockCount(low.length);
      }
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handlePrintReceipt = (orderNo) => {
    toast.success(t('dashboard.page.printReceiptNotice', { id: orderNo }) || `Mencetak struk transaksi #${orderNo}`, {
      icon: '🖨️',
    });
    window.print();
  };

  const getMethodIcon = (method) => {
    switch (method) {
      case 'QRIS':
        return QrCode;
      case 'DEBIT':
      case 'TRANSFER':
        return CreditCard;
      default:
        return Banknote;
    }
  };

  // Filter orders
  const filteredOrders = recentOrders.filter((ord) => {
    if (selectedFilter === 'COMPLETED') return ord.status === 'COMPLETED';
    if (selectedFilter === 'PROCESSING') return ord.status !== 'COMPLETED';
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Header Bar: Ucapan Selamat & Butang Tindakan Pantas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50/90 border border-amber-200/70 text-amber-800 text-[11px] font-bold mb-2 shadow-2xs">
            <Calendar className="w-3 h-3 text-amber-600" />
            <span>
              {new Date().toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {t('dashboard.page.title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t('dashboard.page.greeting', {
              name: user?.name || (language === 'id' ? 'Pengguna' : 'User'),
              store: tenant?.name || (language === 'id' ? 'Kedai Utama' : 'Main Store'),
            })}
          </p>
        </div>

        {/* Tindakan Pantas Header */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/dashboard/reports"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-white/80 hover:bg-white border border-slate-200/80 shadow-2xs transition-all active:scale-95"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Laporan Lengkap</span>
          </Link>

          <Link
            href="/dashboard/pos"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-md shadow-slate-900/15 transition-all active:scale-95"
          >
            <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>{t('dashboard.page.newOrderBtn')}</span>
          </Link>
        </div>
      </div>

      {/* 2. Kad Metrik Ringkasan (KPI Stats Grid: 4 Glassmorphic Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Kad 1: Jumlah Jualan Hari Ini */}
        <div className="p-5 rounded-3xl bg-white/75 backdrop-blur-2xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-inset ring-white/60 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {t('dashboard.page.kpiSalesTitle')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-2xs">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 tracking-tight">
            Rp {(summary?.grossSales || 0).toLocaleString('id-ID')}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] font-semibold text-emerald-600">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Hari Ini Terkini</span>
          </div>
        </div>

        {/* Kad 2: Bilangan Transaksi */}
        <div className="p-5 rounded-3xl bg-white/75 backdrop-blur-2xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-inset ring-white/60 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {t('dashboard.page.kpiTrxTitle')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shadow-2xs">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 tracking-tight">
            {summary?.totalTransactions || 0} {t('dashboard.page.kpiTrxUnit')}
          </p>
          <p className="text-[11px] font-medium text-slate-500 mt-2">
            {t('dashboard.page.kpiTrxAvg')}{' '}
            <span className="font-bold text-slate-700">
              Rp {(summary?.avgTicketSize || 0).toLocaleString('id-ID')}
            </span>
          </p>
        </div>

        {/* Kad 3: Status Syif Kasir */}
        <div className="p-5 rounded-3xl bg-white/75 backdrop-blur-2xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-inset ring-white/60 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {t('dashboard.page.kpiShiftTitle')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-2xs">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-black text-slate-900 tracking-tight">
              {activeShift ? 'Syif Terbuka' : 'Syif Tertutup'}
            </p>
            {activeShift && <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />}
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[11px] text-slate-500">
              {activeShift ? `Kas: Rp ${(activeShift.startCash || 0).toLocaleString('id-ID')}` : 'Buka di POS'}
            </span>
            <Link
              href="/dashboard/pos"
              className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 underline underline-offset-2"
            >
              Kelola di POS
            </Link>
          </div>
        </div>

        {/* Kad 4: Amaran Inventori & Stok */}
        <div className="p-5 rounded-3xl bg-white/75 backdrop-blur-2xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-inset ring-white/60 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {t('dashboard.page.kpiStockTitle')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 shadow-2xs">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 tracking-tight">
            {lowStockCount} Item
          </p>
          <p className="text-[11px] font-medium text-slate-500 mt-2 truncate">
            {lowStockCount > 0 ? 'Perlu pengadaan / restock' : 'Semua stok aman'}
          </p>
        </div>
      </div>

      {/* 3. Jadual Transaksi Terkini (Frosted Glass Table) */}
      <div className="rounded-3xl bg-white/75 backdrop-blur-2xl border border-white/80 shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] ring-1 ring-inset ring-white/60 p-6 space-y-5">
        {/* Header Jadual & Penapis */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/60">
          <div>
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-amber-600" />
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                {t('dashboard.page.tableTitle')}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {t('dashboard.page.tableSubtitle')}
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100/80 border border-slate-200/60 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setSelectedFilter('ALL')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                selectedFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {t('dashboard.page.filterAll')}
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter('COMPLETED')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                selectedFilter === 'COMPLETED'
                  ? 'bg-white text-emerald-700 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {t('dashboard.page.filterCompleted')}
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter('PROCESSING')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                selectedFilter === 'PROCESSING'
                  ? 'bg-white text-amber-700 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {t('dashboard.page.filterProcessing')}
            </button>
          </div>
        </div>

        {/* Senarai Jadual Responsive */}
        <div className="overflow-x-auto">
          {filteredOrders.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <p className="text-sm font-bold text-slate-800">Belum ada transaksi penjualan terbaru</p>
              <p className="text-xs text-slate-500">
                Buka terminal kasir di POS untuk memulai transaksi pertama Anda hari ini.
              </p>
              <Link
                href="/dashboard/pos"
                className="inline-flex items-center gap-1.5 px-4 py-2 mt-2 rounded-xl bg-amber-500 text-white font-bold text-xs shadow-xs"
              >
                <Store className="w-3.5 h-3.5" />
                <span>Buka Terminal POS</span>
              </Link>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/50 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-3">{t('dashboard.page.thOrderNo')}</th>
                  <th className="py-3 px-3">{t('dashboard.page.thCustomer')}</th>
                  <th className="py-3 px-3">{t('dashboard.page.thItems')}</th>
                  <th className="py-3 px-3">{t('dashboard.page.thMethod')}</th>
                  <th className="py-3 px-3">{t('dashboard.page.thStatus')}</th>
                  <th className="py-3 px-3 text-right">{t('dashboard.page.thTotal')}</th>
                  <th className="py-3 px-3 text-center">{t('dashboard.page.thAction')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredOrders.map((ord) => {
                  const MethodIcon = getMethodIcon(ord.paymentMethod);
                  const itemsSummary =
                    ord.items?.map((it) => `${it.quantity}x ${it.productName}`).join(', ') ||
                    `${ord.items?.length || 0} item`;

                  return (
                    <tr
                      key={ord.id}
                      className="hover:bg-white/90 transition-colors group"
                    >
                      {/* ID */}
                      <td className="py-3.5 px-3 font-mono font-bold text-slate-800">
                        {ord.orderNumber}
                      </td>

                      {/* Masa & Pelanggan */}
                      <td className="py-3.5 px-3">
                        <p className="font-semibold text-slate-800">
                          {ord.customerName || (ord.tableNumber ? `Meja ${ord.tableNumber}` : 'Pelanggan Umum')}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {new Date(ord.createdAt).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </td>

                      {/* Ringkasan Item */}
                      <td className="py-3.5 px-3 max-w-56 truncate text-slate-600">
                        {itemsSummary}
                      </td>

                      {/* Kaedah Bayaran */}
                      <td className="py-3.5 px-3">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100/80 border border-slate-200/60 text-[11px] font-semibold text-slate-700">
                          <MethodIcon className="w-3.5 h-3.5 text-amber-600" />
                          <span>{ord.paymentMethod}</span>
                        </div>
                      </td>

                      {/* Status Bayaran */}
                      <td className="py-3.5 px-3">
                        {ord.status === 'COMPLETED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{t('dashboard.page.statusCompleted')}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold">
                            <Hourglass className="w-3 h-3 animate-spin" />
                            <span>{t('dashboard.page.statusProcessing')}</span>
                          </span>
                        )}
                      </td>

                      {/* Jumlah Nilai */}
                      <td className="py-3.5 px-3 text-right font-extrabold text-slate-900">
                        Rp {(ord.totalAmount || 0).toLocaleString('id-ID')}
                      </td>

                      {/* Butang Tindakan Cetak Struk */}
                      <td className="py-3.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handlePrintReceipt(ord.orderNumber)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all shadow-2xs cursor-pointer"
                          title={t('dashboard.page.printReceiptTitle')}
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Kaki Jadual */}
        <div className="pt-3 border-t border-slate-200/50 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <span>{t('dashboard.page.tableFooter')}</span>
          <Link
            href="/dashboard/reports"
            className="font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1"
          >
            <span>{t('dashboard.page.viewAllBtn')}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
