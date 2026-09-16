'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  CreditCard,
  Package,
  RefreshCw,
  PlusCircle,
  ArrowRight,
  Boxes,
  Receipt,
  FileText,
  Sliders,
  CheckCircle2,
  Medal,
} from 'lucide-react';
import { Topbar } from '../../components/Topbar';
import { StatCard } from '../../components/StatCard';
import { api } from '../../lib/api';
import { DashboardSummary } from '../../types';
import { formatRupiah, formatNumber, formatDate } from '../../lib/formatters';

export default function OverviewPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getDashboardSummary();
      setSummary(data);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat ringkasan dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const totalPaymentVol =
    summary?.paymentBreakdown.reduce((acc, curr) => acc + curr.totalAmount, 0) ||
    summary?.revenue.allTime ||
    1;

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Topbar
        title="Ringkasan Operasional & Keuangan"
        description="Pusat analitik performa penjualan, pergerakan stok, dan transaksi toko"
      />

      <main className="p-6 space-y-6 flex-1">
        {/* Quick Actions Bar */}
        <div className="glass-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Aksi Cepat Manajemen
            </h3>
            <p className="text-[11px] text-slate-400">Pintas navigasi ke modul operasional utama</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/products"
              className="pos-btn-primary text-xs py-1.5 px-3"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Tambah Produk</span>
            </Link>

            <Link
              href="/inventory"
              className="pos-btn-secondary text-xs py-1.5 px-3"
            >
              <Boxes className="w-3.5 h-3.5 text-indigo-400" />
              <span>Sesuaikan Stok</span>
            </Link>

            <Link
              href="/transactions"
              className="pos-btn-secondary text-xs py-1.5 px-3"
            >
              <Receipt className="w-3.5 h-3.5 text-emerald-400" />
              <span>Daftar Transaksi</span>
            </Link>

            <Link
              href="/reports"
              className="pos-btn-secondary text-xs py-1.5 px-3"
            >
              <FileText className="w-3.5 h-3.5 text-purple-400" />
              <span>Laporan Pro</span>
            </Link>

            <button
              onClick={fetchSummary}
              disabled={isLoading}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition"
              title="Segarkan Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={fetchSummary}
              className="underline font-semibold hover:text-rose-300"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Omzet Hari Ini"
            value={formatRupiah(summary?.revenue.today)}
            subtitle={`${summary?.transactions.todayCount || 0} struk transaksi hari ini`}
            icon={DollarSign}
            color="emerald"
            trend={{ value: '+8.4%', isPositive: true }}
            badge="Realtime"
          />
          <StatCard
            title="Omzet Bulan Ini"
            value={formatRupiah(summary?.revenue.thisMonth)}
            subtitle="Akumulasi bulan kalender berjalan"
            icon={TrendingUp}
            color="indigo"
            trend={{ value: '+14.2%', isPositive: true }}
          />
          <StatCard
            title="Total Pendapatan"
            value={formatRupiah(summary?.revenue.allTime)}
            subtitle="Keseluruhan periode toko"
            icon={CreditCard}
            color="purple"
            badge="All-time"
          />
          <StatCard
            title="Struk Selesai"
            value={`${formatNumber(summary?.transactions.completed)} Trx`}
            subtitle={`${summary?.transactions.cancelled || 0} transaksi dibatalkan`}
            icon={ShoppingCart}
            color="amber"
          />
        </div>

        {/* 2 Column Content: Top Products & Payment Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Selling Products (2 cols) */}
          <div className="lg:col-span-2 glass-card p-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-100">Produk Paling Laris</h4>
                  <p className="text-[10px] text-slate-400">Peringkat berdasarkan kuantitas item terjual</p>
                </div>
              </div>
              <Link
                href="/products"
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium transition"
              >
                <span>Kelola Produk</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="mt-4 overflow-x-auto">
              {summary?.topProducts && summary.topProducts.length > 0 ? (
                <div className="space-y-3">
                  {summary.topProducts.map((p, idx) => {
                    const maxQty = summary.topProducts[0]?.totalQuantity || 1;
                    const pct = Math.round((p.totalQuantity / maxQty) * 100);

                    return (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/60 hover:border-slate-700 transition"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-3">
                            <span
                              className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold ${idx === 0
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : idx === 1
                                  ? 'bg-slate-300/20 text-slate-200 border border-slate-400/30'
                                  : idx === 2
                                    ? 'bg-amber-700/20 text-amber-400 border border-amber-700/30'
                                    : 'bg-slate-800 text-slate-400'
                                }`}
                            >
                              {idx + 1}
                            </span>
                            <span className="font-semibold text-slate-200">{p.name}</span>
                          </div>

                          <div className="text-right flex items-center space-x-4">
                            <span className="font-mono text-slate-400">
                              {formatNumber(p.totalQuantity)} pcs
                            </span>
                            <span className="font-mono font-bold text-emerald-400">
                              {formatRupiah(p.totalRevenue)}
                            </span>
                          </div>
                        </div>

                        {/* Progress comparison bar */}
                        <div className="w-full h-1.5 rounded-full bg-slate-800 mt-2 overflow-hidden">
                          <div
                            className="h-full bg-linear-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-500 text-xs">
                  Belum ada riwayat penjualan produk
                </div>
              )}
            </div>
          </div>

          {/* Payment Method Breakdown (1 col) */}
          <div className="glass-card p-5 flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-400">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-100">Metode Pembayaran</h4>
                  <p className="text-[10px] text-slate-400">Distribusi kanal penerimaan dana</p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex-1 space-y-4">
              {summary?.paymentBreakdown && summary.paymentBreakdown.length > 0 ? (
                summary.paymentBreakdown.map((pm, idx) => {
                  const pct = Math.min(
                    100,
                    Math.round((pm.totalAmount / totalPaymentVol) * 100)
                  );

                  return (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/60 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-200 font-semibold">
                          {pm.paymentMethodName}
                        </span>
                        <span className="text-emerald-400 font-bold font-mono">
                          {formatRupiah(pm.totalAmount)}
                        </span>
                      </div>

                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-linear-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span>{pm.transactionCount} kali transaksi</span>
                        <span className="font-bold text-slate-300">{pct}%</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center text-slate-500 text-xs">
                  Belum ada data penerimaan pembayaran
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2 Column Bottom: Low Stock Warning & Recent Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Low Stock Warning */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-100">Peringatan Stok Menipis</h4>
                  <p className="text-[10px] text-slate-400">Stok mencapai atau di bawah batas aman</p>
                </div>
              </div>
              <Link
                href="/inventory"
                className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 transition"
              >
                <span>Pengadaan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="mt-4">
              {summary?.lowStockProducts && summary.lowStockProducts.length > 0 ? (
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {summary.lowStockProducts.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between hover:border-slate-700 transition"
                    >
                      <div>
                        <p className="text-xs font-semibold text-slate-200">{item.name}</p>
                        <p className="text-[10px] text-slate-400">
                          {item.category?.name || 'Kategori Umum'}{' '}
                          {item.sku ? `• SKU: ${item.sku}` : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-rose-500/15 text-rose-400 border border-rose-500/25">
                          Sisa {formatNumber(item.stock)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-emerald-400 text-xs flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-2">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  Semua stok produk saat ini dalam batas aman
                </div>
              )}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-100">Transaksi Kasir Terakhir</h4>
                  <p className="text-[10px] text-slate-400">Struk selesai terbaru di seluruh kasir</p>
                </div>
              </div>
              <Link
                href="/transactions"
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 transition"
              >
                <span>Semua Transaksi</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="mt-4">
              {summary?.recentTransactions && summary.recentTransactions.length > 0 ? (
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {summary.recentTransactions.map((trx) => (
                    <div
                      key={trx.id}
                      className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between hover:border-slate-700 transition"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="text-xs font-bold text-slate-200 font-mono">
                            {trx.transactionNumber}
                          </p>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                              trx.status === 'COMPLETED'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : trx.status === 'PARTIALLY_REFUNDED'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : trx.status === 'REFUNDED'
                                ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                : trx.status === 'DRAFT'
                                ? 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {trx.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {formatDate(trx.createdAt)}{' '}
                          {trx.createdBy ? `• Kasir: ${trx.createdBy.displayName}` : ''}
                        </p>
                      </div>
                      <p className="text-xs font-bold text-slate-100 font-mono">
                        {formatRupiah(trx.total)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-500 text-xs">
                  Belum ada transaksi kasir terekam
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
