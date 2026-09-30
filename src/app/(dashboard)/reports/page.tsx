'use client';

import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  Download,
  TrendingUp,
  DollarSign,
  PieChart,
  Layers,
  Calendar,
  RotateCcw,
  Boxes,
  Percent,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { Topbar } from '../../../components/Topbar';
import { StatCard } from '../../../components/StatCard';
import { api } from '../../../lib/api';
import { formatRupiah, formatNumber } from '../../../lib/formatters';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'sales' | 'products' | 'inventory'>('sales');
  const [isLoading, setIsLoading] = useState(true);

  // Filter dates (format YYYY-MM-DD)
  const [preset, setPreset] = useState<'today' | '7days' | 'month' | 'all'>('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Data states
  const [salesReport, setSalesReport] = useState<any>(null);
  const [productReport, setProductReport] = useState<any[]>([]);
  const [inventoryReport, setInventoryReport] = useState<any>(null);

  // Set date preset helpers
  const applyPreset = (type: 'today' | '7days' | 'month' | 'all') => {
    setPreset(type);
    const now = new Date();
    const toDateStr = (d: Date) => d.toISOString().slice(0, 10);

    if (type === 'today') {
      const todayStr = toDateStr(now);
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (type === '7days') {
      const past = new Date();
      past.setDate(past.getDate() - 7);
      setStartDate(toDateStr(past));
      setEndDate(toDateStr(now));
    } else if (type === 'month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(toDateStr(firstDay));
      setEndDate(toDateStr(now));
    } else if (type === 'all') {
      setStartDate('');
      setEndDate('');
    }
  };

  useEffect(() => {
    // Default: Bulan Ini
    applyPreset('month');
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const params = {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };

      const [salesData, productsData, invData] = await Promise.all([
        api.getSalesReport(params).catch(() => null),
        api.getProductReport(params).catch(() => []),
        api.getInventoryReport().catch(() => null),
      ]);

      setSalesReport(salesData);
      setProductReport(productsData || []);
      setInventoryReport(invData);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (preset !== 'all' && (!startDate || !endDate)) return;
    loadData();
  }, [startDate, endDate]);

  const handleExportCSV = () => {
    let filename = `laporan_${activeTab}_${new Date().toISOString().slice(0, 10)}.csv`;
    let headers: string[] = [];
    let rows: any[][] = [];

    if (activeTab === 'sales' && salesReport) {
      filename = `laporan_penjualan_${new Date().toISOString().slice(0, 10)}.csv`;
      headers = ['Metrik', 'Nilai (IDR / Jumlah)'];
      rows = [
        ['Omzet Kotor (Gross Sales)', salesReport.metrics.grossSales],
        ['Total Diskon', salesReport.metrics.discountTotal],
        ['Penjualan Bersih (Net Sales)', salesReport.metrics.netSales],
        ['Estimasi Laba Kotor (Gross Profit)', salesReport.metrics.grossProfit],
        ['Margin Laba Kotor (%)', `${salesReport.metrics.profitMarginPercentage}%`],
        ['Total Nilai Refund', salesReport.metrics.totalRefundAmount],
        ['Jumlah Transaksi Selesai', salesReport.counts.completed],
        ['Jumlah Transaksi Dibatalkan', salesReport.counts.cancelled],
        ['Jumlah Transaksi Direfund', salesReport.counts.refunded],
      ];
    } else if (activeTab === 'products') {
      filename = `laporan_performa_produk_${new Date().toISOString().slice(0, 10)}.csv`;
      headers = ['No', 'Nama Produk', 'Varian', 'Unit Terjual', 'Pendapatan', 'Modal HPP', 'Laba Kotor', 'Margin (%)'];
      rows = productReport.map((p, i) => [
        i + 1,
        `"${p.name}"`,
        `"${p.variantName || '-'}"`,
        p.quantitySold,
        p.revenue,
        p.cost,
        p.grossProfit,
        `${p.marginPercentage}%`,
      ]);
    } else if (activeTab === 'inventory' && inventoryReport) {
      filename = `laporan_inventori_${new Date().toISOString().slice(0, 10)}.csv`;
      headers = ['Nama Produk', 'SKU', 'Kategori', 'Stok Saat Ini', 'Batas Minimum', 'Harga Modal (HPP)'];
      rows = (inventoryReport.lowStockItems || []).map((it: any) => [
        `"${it.name}"`,
        `"${it.sku || '-'}"`,
        `"${it.category || '-'}"`,
        it.stock,
        it.threshold,
        it.cost,
      ]);
    }

    if (rows.length === 0) {
      alert('Tidak ada data yang dapat diekspor pada filter ini');
      return;
    }

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const metrics = salesReport?.metrics || {
    grossSales: 0,
    discountTotal: 0,
    netSales: 0,
    grossProfit: 0,
    profitMarginPercentage: 0,
    totalRefundAmount: 0,
  };

  const counts = salesReport?.counts || {
    completed: 0,
    cancelled: 0,
    refunded: 0,
    refundEvents: 0,
  };

  return (
    <div className="flex-1 flex flex-col">
      <Topbar
        title="Laporan Penjualan & Analitik Keuangan"
        description="Analisis berkala omzet, estimasi laba kotor HPP, performa produk, dan valuasi stok gudang"
      />

      <main className="p-6 space-y-6 flex-1">
        {/* Date Filter & Export Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 glass-card p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5 mr-2">
              <Calendar className="w-4 h-4 text-indigo-400" />
              <span>Periode:</span>
            </span>
            <button
              onClick={() => applyPreset('today')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                preset === 'today'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              Hari Ini
            </button>
            <button
              onClick={() => applyPreset('7days')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                preset === '7days'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              7 Hari Terakhir
            </button>
            <button
              onClick={() => applyPreset('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                preset === 'month'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              Bulan Ini
            </button>
            <button
              onClick={() => applyPreset('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                preset === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              Semua Waktu
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 text-xs text-slate-300">
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPreset('all');
                }}
                className="pos-input px-2.5 py-1 text-xs"
              />
              <span className="text-slate-500">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPreset('all');
                }}
                className="pos-input px-2.5 py-1 text-xs"
              />
            </div>
            <button
              onClick={handleExportCSV}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-xs text-white rounded-xl font-semibold shadow-md shadow-emerald-600/20 transition shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor CSV</span>
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-800 space-x-4">
          <button
            onClick={() => setActiveTab('sales')}
            className={`pb-3 text-xs font-semibold flex items-center space-x-2 border-b-2 transition ${
              activeTab === 'sales'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Penjualan & Keuangan</span>
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`pb-3 text-xs font-semibold flex items-center space-x-2 border-b-2 transition ${
              activeTab === 'products'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Performa Produk & Margin</span>
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`pb-3 text-xs font-semibold flex items-center space-x-2 border-b-2 transition ${
              activeTab === 'inventory'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>Valuasi Stok & Inventori</span>
          </button>
        </div>

        {/* TAB 1: SALES & FINANCE */}
        {activeTab === 'sales' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Penjualan Bersih (Net Sales)"
                value={formatRupiah(metrics.netSales)}
                subtitle={`Omzet kotor: ${formatRupiah(metrics.grossSales)}`}
                icon={DollarSign}
                color="emerald"
              />
              <StatCard
                title="Estimasi Laba Kotor"
                value={formatRupiah(metrics.grossProfit)}
                subtitle={`Margin laba: ${metrics.profitMarginPercentage}%`}
                icon={TrendingUp}
                color="indigo"
              />
              <StatCard
                title="Total Potongan Diskon"
                value={formatRupiah(metrics.discountTotal)}
                subtitle="Voucher dan promosi kasir"
                icon={Percent}
                color="amber"
              />
              <StatCard
                title="Pengembalian (Refund)"
                value={formatRupiah(metrics.totalRefundAmount)}
                subtitle={`${counts.refunded} transaksi direfund`}
                icon={RotateCcw}
                color="purple"
              />
            </div>

            {/* Split row: Payment Breakdown & Transaction Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Payment Methods Breakdown */}
              <div className="glass-card p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center space-x-2">
                    <PieChart className="w-4 h-4 text-indigo-400" />
                    <h4 className="text-sm font-semibold text-slate-100">
                      Sebaran Metode Pembayaran
                    </h4>
                  </div>
                  <span className="text-xs text-slate-400">Total Transaksi Selesai</span>
                </div>

                <div className="space-y-3">
                  {salesReport?.paymentBreakdown && salesReport.paymentBreakdown.length > 0 ? (
                    salesReport.paymentBreakdown.map((pm: any) => {
                      const pct =
                        metrics.netSales > 0
                          ? ((pm.amount / metrics.netSales) * 100).toFixed(1)
                          : '0';
                      return (
                        <div
                          key={pm.paymentMethodId}
                          className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between"
                        >
                          <div>
                            <p className="text-xs font-semibold text-slate-200">{pm.name}</p>
                            <p className="text-[10px] text-slate-400">{pm.count} transaksi</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-mono font-bold text-slate-100">
                              {formatRupiah(pm.amount)}
                            </p>
                            <p className="text-[10px] font-mono text-indigo-400">{pct}% omzet</p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-center py-8 text-xs text-slate-500">
                      Belum ada catatan pembayaran pada periode ini
                    </p>
                  )}
                </div>
              </div>

              {/* Transactions Lifecycle Counters */}
              <div className="glass-card p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="w-4 h-4 text-cyan-400" />
                    <h4 className="text-sm font-semibold text-slate-100">Status Siklus Transaksi</h4>
                  </div>
                  <span className="text-xs text-slate-400">Audit Integritas Data</span>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-center">
                    <CheckCircle className="w-5 h-5 text-emerald-400 mx-auto mb-1.5" />
                    <p className="text-lg font-bold font-mono text-emerald-400">
                      {counts.completed}
                    </p>
                    <p className="text-[11px] text-slate-400">Selesai</p>
                  </div>
                  <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/20 text-center">
                    <XCircle className="w-5 h-5 text-rose-400 mx-auto mb-1.5" />
                    <p className="text-lg font-bold font-mono text-rose-400">
                      {counts.cancelled}
                    </p>
                    <p className="text-[11px] text-slate-400">Dibatalkan</p>
                  </div>
                  <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/20 text-center">
                    <RotateCcw className="w-5 h-5 text-purple-400 mx-auto mb-1.5" />
                    <p className="text-lg font-bold font-mono text-purple-400">
                      {counts.refunded}
                    </p>
                    <p className="text-[11px] text-slate-400">Direfund</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PRODUCT PERFORMANCE */}
        {activeTab === 'products' && (
          <div className="glass-card p-5 space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <h4 className="text-sm font-semibold text-slate-100">
                  Rincian Penjualan & Margin Keuntungan per Produk
                </h4>
              </div>
              <span className="text-xs text-slate-400">{productReport.length} produk terjual</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-3 font-semibold">No</th>
                    <th className="pb-3 font-semibold">Nama Produk</th>
                    <th className="pb-3 font-semibold">Varian</th>
                    <th className="pb-3 font-semibold text-center">Volume Terjual</th>
                    <th className="pb-3 font-semibold text-right">Omzet Kotor</th>
                    <th className="pb-3 font-semibold text-right">Total Modal (HPP)</th>
                    <th className="pb-3 font-semibold text-right">Laba Kotor</th>
                    <th className="pb-3 font-semibold text-right">Margin (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {productReport.length > 0 ? (
                    productReport.map((p, i) => (
                      <tr key={i} className="hover:bg-slate-800/30 transition">
                        <td className="py-3 font-mono text-slate-500">#{i + 1}</td>
                        <td className="py-3 font-semibold text-slate-200">{p.name}</td>
                        <td className="py-3 text-slate-400 font-mono text-[11px]">
                          {p.variantName || '-'}
                        </td>
                        <td className="py-3 text-center font-mono font-bold text-slate-100">
                          {formatNumber(p.quantitySold)}
                        </td>
                        <td className="py-3 text-right font-mono font-semibold text-slate-200">
                          {formatRupiah(p.revenue)}
                        </td>
                        <td className="py-3 text-right font-mono text-slate-400">
                          {formatRupiah(p.cost)}
                        </td>
                        <td className="py-3 text-right font-mono font-bold text-emerald-400">
                          {formatRupiah(p.grossProfit)}
                        </td>
                        <td className="py-3 text-right font-mono font-bold text-indigo-300">
                          {p.marginPercentage}%
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500">
                        Belum ada penjualan produk pada periode yang dipilih
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: INVENTORY VALUATION */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            {/* Valuation Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard
                title="Total Valuasi Modal Stok Toko"
                value={formatRupiah(inventoryReport?.summary.totalValuation || 0)}
                subtitle="Nilai aset fisik modal barang berjalan"
                icon={Boxes}
                color="indigo"
              />
              <StatCard
                title="Produk Terdata"
                value={formatNumber(inventoryReport?.summary.totalItemsTracked || 0)}
                subtitle="Total varian dan item aktif"
                icon={Layers}
                color="cyan"
              />
              <StatCard
                title="Peringatan Stok Menipis"
                value={formatNumber(inventoryReport?.summary.lowStockCount || 0)}
                subtitle="Stok di bawah batas minimum"
                icon={AlertTriangle}
                color="amber"
              />
            </div>

            {/* Low stock table */}
            <div className="glass-card p-5 space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <h4 className="text-sm font-semibold text-slate-100">
                    Daftar Produk Perlu Restock (Menipis)
                  </h4>
                </div>
                <span className="text-xs text-slate-400">
                  {inventoryReport?.lowStockItems?.length || 0} item
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="pb-3 font-semibold">Nama Produk</th>
                      <th className="pb-3 font-semibold">Kategori</th>
                      <th className="pb-3 font-semibold text-center">Batas Min</th>
                      <th className="pb-3 font-semibold text-center">Stok Fisik</th>
                      <th className="pb-3 font-semibold text-right">Harga Modal (HPP)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {inventoryReport?.lowStockItems && inventoryReport.lowStockItems.length > 0 ? (
                      inventoryReport.lowStockItems.map((it: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-800/30 transition">
                          <td className="py-3 font-semibold text-slate-200">{it.name}</td>
                          <td className="py-3 text-slate-400">{it.category}</td>
                          <td className="py-3 text-center font-mono text-slate-400">
                            {it.threshold}
                          </td>
                          <td className="py-3 text-center font-mono font-bold text-rose-400">
                            {it.stock}
                          </td>
                          <td className="py-3 text-right font-mono font-semibold text-slate-200">
                            {formatRupiah(it.cost)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-500">
                          Semua produk memiliki stok di atas batas minimum
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
