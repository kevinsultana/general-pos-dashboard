'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  DollarSign,
  PieChart,
  BarChart3,
  Calendar,
  Building,
  Download,
  Receipt,
  Percent,
  Layers,
  ShoppingBag,
  CreditCard,
  QrCode,
  Banknote,
  ArrowUpRight,
  ArrowDownRight,
  FileSpreadsheet,
  RefreshCw,
  Award,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../contexts/AuthContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import api from '../../../lib/api';
import UnauthorizedState from '../../../components/common/UnauthorizedState';

export default function ReportsPage() {
  const { user, tenant, hasPermission, activeBranch } = useAuth();
  const { t } = useLanguage();

  const isAllowed = user?.isOwner || hasPermission('reports:view');
  const canExport = user?.isOwner || hasPermission('reports:export');

  // Filter State
  const [activeTab, setActiveTab] = useState('pnl'); // 'pnl' | 'products' | 'payments'
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(() => activeBranch?.id || '');
  const [dateFilterType, setDateFilterType] = useState('this_month'); // 'today' | '7days' | 'this_month' | 'custom'
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Data State
  const [summary, setSummary] = useState(null);
  const [salesChart, setSalesChart] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Load branches
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await api.get('/branches');
        if (res.data?.success) {
          setBranches(res.data.data || []);
        }
      } catch (err) {
        console.error('Failed to load branches:', err);
      }
    };
    if (isAllowed) {
      fetchBranches();
    }
  }, [isAllowed]);

  // Handle Quick Date Change
  const handleDatePresetChange = (type) => {
    setDateFilterType(type);
    const now = new Date();

    if (type === 'today') {
      const todayStr = now.toISOString().split('T')[0];
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (type === '7days') {
      const past7 = new Date();
      past7.setDate(now.getDate() - 7);
      setStartDate(past7.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    } else if (type === 'this_month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    }
  };

  // Fetch Reports Data
  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        branchId: selectedBranch || undefined,
      };

      const [summaryRes, chartRes, topProdRes] = await Promise.all([
        api.get('/reports/summary', { params }),
        api.get('/reports/sales-chart', { params }),
        api.get('/reports/top-products', { params }),
      ]);

      if (summaryRes.data?.success) {
        setSummary(summaryRes.data.data);
      }
      if (chartRes.data?.success) {
        setSalesChart(chartRes.data.data || []);
      }
      if (topProdRes.data?.success) {
        setTopProducts(topProdRes.data.data || []);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memuat laporan finansial.');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, selectedBranch]);

  useEffect(() => {
    if (isAllowed) {
      fetchReports();
    }
  }, [isAllowed, fetchReports]);

  // Export to CSV
  const handleExportCsv = async () => {
    if (!canExport) {
      toast.error('Akses Ditolak: Anda tidak memiliki izin ekspor laporan.');
      return;
    }

    setExporting(true);
    try {
      const params = {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        branchId: selectedBranch || undefined,
      };

      const res = await api.get('/reports/export', { params });
      if (res.data?.success) {
        const rows = res.data.data || [];
        if (rows.length === 0) {
          toast.error('Tidak ada data transaksi untuk diekspor pada rentang ini.');
          return;
        }

        // Generate CSV content
        const headers = [
          'No Order',
          'Tanggal',
          'Cabang',
          'Kasir',
          'Pelanggan',
          'Metode Pembayaran',
          'Jumlah Item',
          'Subtotal',
          'Diskon',
          'Pajak',
          'Total Penjualan',
        ];

        const csvLines = [headers.join(',')];
        rows.forEach((r) => {
          const rowVals = [
            `"${r.orderNumber}"`,
            `"${new Date(r.date).toLocaleString('id-ID')}"`,
            `"${r.branch}"`,
            `"${r.cashier}"`,
            `"${r.customerName}"`,
            `"${r.paymentMethod}"`,
            r.itemCount,
            r.subtotal,
            r.discount,
            r.tax,
            r.totalAmount,
          ];
          csvLines.push(rowVals.join(','));
        });

        const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Laporan_Penjualan_${startDate}_sd_${endDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success('Laporan berhasil diekspor ke file CSV!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengekspor laporan.');
    } finally {
      setExporting(false);
    }
  };

  if (!isAllowed && user) {
    return <UnauthorizedState requiredPermission="reports:view" />;
  }

  // Financial calculations
  const grossSales = summary?.grossSales || 0;
  const cogs = summary?.cogs || 0;
  const grossProfit = summary?.grossProfit || 0;
  const totalExpenses = summary?.totalExpenses || 0;
  const netProfit = summary?.netProfit || 0;
  const grossMargin = grossSales > 0 ? ((grossProfit / grossSales) * 100).toFixed(1) : 0;
  const netMargin = grossSales > 0 ? ((netProfit / grossSales) * 100).toFixed(1) : 0;

  // Chart max value calculation
  const maxDaySales = Math.max(...salesChart.map((d) => d.sales), 1);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-400/40 text-emerald-800 text-xs font-extrabold tracking-wide uppercase shadow-2xs backdrop-blur-md mb-2">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>Laporan Finansial & Analitik Real-Time</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Laporan Keuangan & Laba Rugi
          </h1>
          <p className="text-sm text-slate-600 font-normal">
            Pantau omzet riil, beban pokok penjualan (HPP), biaya operasional, dan laba bersih usaha.
          </p>
        </div>

        {/* Export & Refresh Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={fetchReports}
            disabled={loading}
            className="p-2.5 rounded-2xl bg-white/80 hover:bg-white border border-slate-200 text-slate-700 text-xs font-bold shadow-2xs transition-all cursor-pointer"
            title="Muat Ulang"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={exporting || loading}
            className="py-2.5 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md shadow-slate-900/15 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>{exporting ? 'Mengekspor...' : 'Ekspor Laporan (CSV)'}</span>
          </button>
        </div>
      </div>

      {/* 2. Filter Bar */}
      <div className="p-4 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        {/* Cabang Filter */}
        <div className="flex items-center gap-2">
          <Building className="w-4 h-4 text-slate-400" />
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {tenant?.plan === 'PRO' && <option value="all">Semua Cabang (Konsolidasi)</option>}
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} {b.isMain ? '(Pusat)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Date Presets & Custom Date */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => handleDatePresetChange('today')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                dateFilterType === 'today' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={() => handleDatePresetChange('7days')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                dateFilterType === '7days' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              7 Hari
            </button>
            <button
              type="button"
              onClick={() => handleDatePresetChange('this_month')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                dateFilterType === 'this_month' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Bulan Ini
            </button>
            <button
              type="button"
              onClick={() => setDateFilterType('custom')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                dateFilterType === 'custom' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Kustom
            </button>
          </div>

          {dateFilterType === 'custom' && (
            <div className="flex items-center gap-1.5 animate-in fade-in">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-xs text-slate-400">s/d</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}
        </div>
      </div>

      {/* 3. Ringkasan Finansial Utama (5 KPI Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Omzet Penjualan */}
        <div className="p-4 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] relative overflow-hidden">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Omzet Penjualan (Gross)
          </p>
          <h3 className="text-lg font-black text-slate-900 mt-1">
            Rp {grossSales.toLocaleString('id-ID')}
          </h3>
          <p className="text-[10px] text-emerald-600 font-bold mt-1">
            {summary?.totalTransactions || 0} Transaksi Selesai
          </p>
        </div>

        {/* HPP (COGS) */}
        <div className="p-4 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] relative overflow-hidden">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Total Modal Produk (HPP)
          </p>
          <h3 className="text-lg font-black text-slate-700 mt-1">
            Rp {cogs.toLocaleString('id-ID')}
          </h3>
          <p className="text-[10px] text-slate-500 font-medium mt-1">
            Beban Pokok Penjualan
          </p>
        </div>

        {/* Laba Kotor */}
        <div className="p-4 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] relative overflow-hidden">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Laba Kotor (Gross Profit)
          </p>
          <h3 className="text-lg font-black text-blue-600 mt-1">
            Rp {grossProfit.toLocaleString('id-ID')}
          </h3>
          <p className="text-[10px] text-blue-600 font-bold mt-1">
            Margin: {grossMargin}%
          </p>
        </div>

        {/* Beban Operasional */}
        <div className="p-4 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] relative overflow-hidden">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Beban Biaya (OPEX)
          </p>
          <h3 className="text-lg font-black text-rose-600 mt-1">
            Rp {totalExpenses.toLocaleString('id-ID')}
          </h3>
          <p className="text-[10px] text-rose-500 font-medium mt-1">
            Listrik, Sewa, Gaji, dll.
          </p>
        </div>

        {/* Laba Bersih */}
        <div className="p-4 rounded-3xl bg-linear-to-br from-emerald-500/10 to-teal-500/10 backdrop-blur-2xl border border-emerald-300/80 shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] relative overflow-hidden">
          <p className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider">
            Laba Bersih (Net Profit)
          </p>
          <h3 className={`text-lg font-black mt-1 ${netProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
            Rp {netProfit.toLocaleString('id-ID')}
          </h3>
          <p className="text-[10px] text-emerald-800 font-bold mt-1">
            Net Margin: {netMargin}%
          </p>
        </div>
      </div>

      {/* 4. Tab Navigation */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('pnl')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'pnl'
              ? 'border-emerald-600 text-emerald-700 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Laporan Laba Rugi (P&L)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('products')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'products'
              ? 'border-emerald-600 text-emerald-700 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Tren Penjualan & Produk Terlaris
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('payments')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'payments'
              ? 'border-emerald-600 text-emerald-700 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Distribusi Metode Pembayaran
        </button>
      </div>

      {/* 5. TAB CONTENT */}
      {/* TAB 1: P&L (PROFIT AND LOSS STATEMENT) */}
      {activeTab === 'pnl' && (
        <div className="bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-black text-slate-900">
              Laporan Laba Rugi Komprehensif
            </h3>
            <p className="text-xs text-slate-500">
              Periode: {new Date(startDate).toLocaleDateString('id-ID')} s/d{' '}
              {new Date(endDate).toLocaleDateString('id-ID')}
            </p>
          </div>

          <div className="space-y-4 max-w-2xl text-xs">
            {/* 1. Pendapatan */}
            <div className="space-y-2">
              <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px]">
                1. Pendapatan Penjualan (Revenue)
              </h4>
              <div className="pl-4 space-y-1.5 text-slate-600">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Penjualan Kotor (Gross Sales)</span>
                  <span className="font-bold text-slate-900">
                    Rp {grossSales.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Potongan Harga / Diskon Kasir</span>
                  <span className="font-bold text-rose-600">
                    - Rp {(summary?.totalDiscounts || 0).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between py-1 font-bold text-slate-800 bg-slate-50 px-2 rounded-lg">
                  <span>Total Penjualan Bersih (Net Sales)</span>
                  <span>
                    Rp {(grossSales - (summary?.totalDiscounts || 0)).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Harga Pokok Penjualan (COGS) */}
            <div className="space-y-2 pt-2">
              <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px]">
                2. Harga Pokok Penjualan (COGS / HPP)
              </h4>
              <div className="pl-4 space-y-1.5 text-slate-600">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Biaya Bahan Baku / Modal Produk Terjual</span>
                  <span className="font-bold text-slate-800">
                    Rp {cogs.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between py-1 font-black text-blue-700 bg-blue-50 px-2 rounded-lg text-sm">
                  <span>LABA KOTOR (GROSS PROFIT)</span>
                  <span>Rp {grossProfit.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>

            {/* 3. Beban Operasional (OPEX) */}
            <div className="space-y-2 pt-2">
              <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px]">
                3. Beban Operasional (Operating Expenses)
              </h4>
              <div className="pl-4 space-y-1.5 text-slate-600">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Total Pengeluaran Kas (Listrik, Gaji, Sewa, dsb.)</span>
                  <span className="font-bold text-rose-600">
                    Rp {totalExpenses.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>

            {/* 4. LABA BERSIH (NET PROFIT) */}
            <div className="pt-4 border-t-2 border-slate-200">
              <div className="flex justify-between items-center p-3 rounded-2xl bg-linear-to-r from-emerald-600 to-teal-700 text-white font-black text-sm sm:text-base shadow-md">
                <span>LABA BERSIH USAHA (NET PROFIT)</span>
                <span>Rp {netProfit.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TREN PENJUALAN & TOP PRODUK */}
      {activeTab === 'products' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Grafik Batang Penjualan Harian */}
          <div className="lg:col-span-7 bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900">Tren Omzet Harian</h3>
              <span className="text-[10px] text-slate-400 font-bold uppercase">
                {salesChart.length} Hari Aktif
              </span>
            </div>

            {salesChart.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-400">
                Belum ada transaksi pada periode ini.
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                {salesChart.map((day) => {
                  const percent = Math.round((day.sales / maxDaySales) * 100);
                  return (
                    <div key={day.date} className="space-y-1 text-xs">
                      <div className="flex justify-between font-bold text-slate-700">
                        <span>
                          {new Date(day.date).toLocaleDateString('id-ID', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                        <span className="text-slate-900 font-black">
                          Rp {day.sales.toLocaleString('id-ID')}{' '}
                          <span className="text-[10px] text-slate-400 font-normal">
                            ({day.orders} order)
                          </span>
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-linear-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(percent, 4)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Top 5 Produk Terlaris */}
          <div className="lg:col-span-5 bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-black text-slate-900">5 Produk Terlaris (Best Sellers)</h3>
            </div>

            {topProducts.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-400">
                Belum ada data produk terjual.
              </div>
            ) : (
              <div className="space-y-3">
                {topProducts.map((p, idx) => (
                  <div
                    key={p.productId || idx}
                    className="p-3 rounded-2xl bg-slate-50/70 border border-slate-100 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-xl bg-amber-500/10 text-amber-700 font-black text-xs flex items-center justify-center shrink-0">
                        #{idx + 1}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-xs leading-tight">{p.name}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Terjual: <strong className="text-slate-800">{p.totalQty} unit</strong>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-slate-900">
                        Rp {p.totalRevenue.toLocaleString('id-ID')}
                      </p>
                      <p className="text-[10px] text-emerald-600 font-semibold">Omzet</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: METODE PEMBAYARAN */}
      {activeTab === 'payments' && (
        <div className="bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] rounded-3xl p-6 space-y-4">
          <h3 className="text-sm font-black text-slate-900">
            Sebaran Metode Pembayaran Diterima
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            {/* CASH */}
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800">Tunai (CASH)</span>
                <Banknote className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-lg font-black text-emerald-950">
                Rp {(summary?.paymentBreakdown?.CASH?.total || 0).toLocaleString('id-ID')}
              </p>
              <p className="text-[10px] text-emerald-700 font-medium">
                {summary?.paymentBreakdown?.CASH?.count || 0} Kali Transaksi
              </p>
            </div>

            {/* QRIS */}
            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-800">QRIS Statis / Dinamis</span>
                <QrCode className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-lg font-black text-blue-950">
                Rp {(summary?.paymentBreakdown?.QRIS?.total || 0).toLocaleString('id-ID')}
              </p>
              <p className="text-[10px] text-blue-700 font-medium">
                {summary?.paymentBreakdown?.QRIS?.count || 0} Kali Transaksi
              </p>
            </div>

            {/* TRANSFER */}
            <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-800">Transfer Bank</span>
                <CreditCard className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-lg font-black text-purple-950">
                Rp {(summary?.paymentBreakdown?.TRANSFER?.total || 0).toLocaleString('id-ID')}
              </p>
              <p className="text-[10px] text-purple-700 font-medium">
                {summary?.paymentBreakdown?.TRANSFER?.count || 0} Kali Transaksi
              </p>
            </div>

            {/* DEBIT */}
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-800">Kartu Debit / EDC</span>
                <CreditCard className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-lg font-black text-amber-950">
                Rp {(summary?.paymentBreakdown?.DEBIT?.total || 0).toLocaleString('id-ID')}
              </p>
              <p className="text-[10px] text-amber-700 font-medium">
                {summary?.paymentBreakdown?.DEBIT?.count || 0} Kali Transaksi
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
