'use client';

import React, { useEffect, useState } from 'react';
import { BarChart3, Download, TrendingUp, DollarSign, PieChart, Layers } from 'lucide-react';
import { Topbar } from '../../../components/Topbar';
import { StatCard } from '../../../components/StatCard';
import { api } from '../../../lib/api';
import { DashboardSummary } from '../../../types';
import { formatRupiah, formatNumber } from '../../../lib/formatters';

export default function ReportsPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getDashboardSummary();
        setSummary(data);
      } catch (err) {
        console.error('Failed to load report summary:', err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const handleExportCSV = () => {
    if (!summary?.topProducts) return;
    const headers = ['No', 'Nama Produk', 'Jumlah Terjual', 'Nilai Penjualan (IDR)'];
    const rows = summary.topProducts.map((p, i) => [
      i + 1,
      `"${p.name}"`,
      p.totalQuantity,
      p.totalRevenue,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `laporan_penjualan_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalSales = summary?.revenue.allTime || 0;
  const todaySales = summary?.revenue.today || 0;
  const monthSales = summary?.revenue.thisMonth || 0;

  return (
    <div className="flex-1 flex flex-col">
      <Topbar
        title="Laporan Penjualan & Analitik Keuangan Pro"
        description="Analisis mendalam laba-rugi, pergerakan omzet, dan ekspor laporan pembukuan toko"
      />

      <main className="p-6 space-y-6 flex-1">
        {/* Header with Export */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-200">Rekapitulasi Keuangan Toko</h3>
            <p className="text-xs text-slate-400">Periode all-time toko beroperasi</p>
          </div>
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-xs text-white rounded-xl font-semibold shadow-md shadow-emerald-600/20 transition"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor Laporan (CSV)</span>
          </button>
        </div>

        {/* Financial KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Total Omzet Kumulatif"
            value={formatRupiah(totalSales)}
            subtitle="Akumulasi seluruh transaksi selesai"
            icon={DollarSign}
            color="emerald"
          />
          <StatCard
            title="Penjualan Bulan Berjalan"
            value={formatRupiah(monthSales)}
            subtitle="Pertumbuhan bulan ini"
            icon={TrendingUp}
            color="indigo"
          />
          <StatCard
            title="Penjualan Hari Ini"
            value={formatRupiah(todaySales)}
            subtitle={`${summary?.transactions.todayCount || 0} struk tercatat hari ini`}
            icon={PieChart}
            color="purple"
          />
        </div>

        {/* Detailed Product Sales Report */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <h4 className="text-sm font-semibold text-slate-100">Performa Penjualan Produk</h4>
            </div>
            <span className="text-[11px] text-slate-400">Peringkat 5 Produk Terlaris</span>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3 font-semibold">Peringkat</th>
                  <th className="pb-3 font-semibold">Nama Produk</th>
                  <th className="pb-3 font-semibold text-center">Volume Terjual</th>
                  <th className="pb-3 font-semibold text-right">Kontribusi Omzet</th>
                  <th className="pb-3 font-semibold text-right">Persentase</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {summary?.topProducts && summary.topProducts.length > 0 ? (
                  summary.topProducts.map((p, i) => {
                    const pct = totalSales > 0 ? ((p.totalRevenue / totalSales) * 100).toFixed(1) : '0';
                    return (
                      <tr key={i} className="hover:bg-slate-800/30 transition">
                        <td className="py-3.5 font-bold text-slate-400">#{i + 1}</td>
                        <td className="py-3.5 font-semibold text-slate-200">{p.name}</td>
                        <td className="py-3.5 text-center font-mono text-slate-300">
                          {formatNumber(p.totalQuantity)} pcs
                        </td>
                        <td className="py-3.5 text-right font-mono font-bold text-emerald-400">
                          {formatRupiah(p.totalRevenue)}
                        </td>
                        <td className="py-3.5 text-right font-mono text-slate-400">{pct}%</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      Belum ada data penjualan produk
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
