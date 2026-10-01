'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { showConfirmDialog, showAlertNotice } from '../../lib/alerts';

export default function DashboardPage() {
  const { user, tenant } = useAuth();
  const [selectedFilter, setSelectedFilter] = useState('ALL');

  // Contoh Data Transaksi Semasa yang Realistik untuk POS F&B / Runcit
  const transactions = [
    {
      id: 'TRX-9082',
      time: '15:42',
      customer: 'Meja 06 (Dine-in)',
      items: '2x Kopi Susu Aren, 1x Croissant',
      method: 'QRIS',
      methodIcon: QrCode,
      amount: 78000,
      status: 'COMPLETED',
    },
    {
      id: 'TRX-9081',
      time: '15:28',
      customer: 'Budi Santoso (Take-away)',
      items: '1x Caramel Macchiato, 1x Cinnamon Roll',
      method: 'Tunai',
      methodIcon: Banknote,
      amount: 54000,
      status: 'COMPLETED',
    },
    {
      id: 'TRX-9080',
      time: '15:15',
      customer: 'Meja 02 (Dine-in)',
      items: '4x Americano, 2x Truffle Fries',
      method: 'Debit',
      methodIcon: CreditCard,
      amount: 142000,
      status: 'COMPLETED',
    },
    {
      id: 'TRX-9079',
      time: '14:55',
      customer: 'Meja 09 (Dine-in)',
      items: '2x Matcha Latte, 1x Red Velvet Cake',
      method: 'QRIS',
      methodIcon: QrCode,
      amount: 92000,
      status: 'COMPLETED',
    },
    {
      id: 'TRX-9078',
      time: '14:40',
      customer: 'Siti Aminah (Take-away)',
      items: '1x Hazelnut Latte',
      method: 'Tunai',
      methodIcon: Banknote,
      amount: 32000,
      status: 'PROCESSING',
    },
  ];

  const handlePrintReceipt = (trxId) => {
    toast.success(`Menghantar perintah cetak struk ${trxId} ke pencetak Bluetooth/Thermal...`, {
      icon: '🖨️',
    });
  };

  const handleCloseShift = async () => {
    const result = await showConfirmDialog({
      title: 'Tutup Syif Kasir Semasa?',
      text: 'Adakah anda ingin menutup syif ini dan menjana laporan imbangan wang tunai (laci tunai)?',
      confirmButtonText: 'Ya, Tutup Syif',
      cancelButtonText: 'Batal',
      icon: 'question',
    });

    if (result.isConfirmed) {
      toast.success('Syif kasir ditutup. Laporan ringkasan telah dijana ke peti masuk emel pengurus.', {
        duration: 5000,
      });
    }
  };

  const handleExportReport = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1000)),
      {
        loading: 'Menjana fail laporan jualan Excel/PDF...',
        success: 'Fail laporan harian sedia dimuat turun!',
        error: 'Gagal menjana laporan.',
      }
    );
  };

  const filteredTransactions = transactions.filter((trx) => {
    if (selectedFilter === 'COMPLETED') return trx.status === 'COMPLETED';
    if (selectedFilter === 'PROCESSING') return trx.status === 'PROCESSING';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header Bar: Ucapan Selamat & Butang Tindakan Pantas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50/90 border border-amber-200/70 text-amber-800 text-[11px] font-bold mb-2 shadow-2xs">
            <Calendar className="w-3 h-3 text-amber-600" />
            <span>
              {new Date().toLocaleDateString('id-ID', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Papan Pemuka Kasir & Analitik
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Selamat bertugas, <span className="font-bold text-slate-800">{user?.name}</span>. Pantau
            operasi harian kedai <span className="font-semibold text-slate-700">{tenant?.name}</span>.
          </p>
        </div>

        {/* Tindakan Pantas Header */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportReport}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-white/80 hover:bg-white border border-slate-200/80 shadow-2xs transition-all active:scale-95"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Eksport Data</span>
          </button>

          <button
            type="button"
            onClick={() =>
              toast('Membuka terminal juruwang pantas...', {
                icon: '🛒',
              })
            }
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-md shadow-slate-900/15 transition-all active:scale-95"
          >
            <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Pesanan Baharu</span>
          </button>
        </div>
      </div>

      {/* 2. Kad Metrik Ringkasan (KPI Stats Grid: 4 Glassmorphic Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Kad 1: Jumlah Jualan Hari Ini */}
        <div className="p-5 rounded-3xl bg-white/75 backdrop-blur-2xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-inset ring-white/60 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Jualan Hari Ini
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-2xs">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 tracking-tight">Rp 4.850.000</p>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] font-semibold text-emerald-600">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+18.4% vs kelmarin</span>
          </div>
        </div>

        {/* Kad 2: Bilangan Transaksi */}
        <div className="p-5 rounded-3xl bg-white/75 backdrop-blur-2xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-inset ring-white/60 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Transaksi Selesai
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shadow-2xs">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 tracking-tight">52 Pesanan</p>
          <p className="text-[11px] font-medium text-slate-500 mt-2">
            Purata tiket: <span className="font-bold text-slate-700">Rp 93.200</span>
          </p>
        </div>

        {/* Kad 3: Status Syif Kasir */}
        <div className="p-5 rounded-3xl bg-white/75 backdrop-blur-2xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-inset ring-white/60 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Syif Semasa
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-2xs">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-black text-slate-900 tracking-tight">Syif Pagi</p>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[11px] text-slate-500">Laci Tunai: Rp 500k</span>
            <button
              onClick={handleCloseShift}
              className="text-[10px] font-bold text-rose-600 hover:text-rose-700 underline underline-offset-2"
            >
              Tutup Syif
            </button>
          </div>
        </div>

        {/* Kad 4: Amaran Inventori & Stok */}
        <div className="p-5 rounded-3xl bg-white/75 backdrop-blur-2xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-inset ring-white/60 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Amaran Stok
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 shadow-2xs">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 tracking-tight">3 SKU Menipis</p>
          <p className="text-[11px] font-medium text-slate-500 mt-2 truncate">
            Biji Kopi Arabica & Susu UHT
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
                Transaksi Jualan Terkini
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Rekod pesanan yang masuk secara langsung melalui terminal kasir aktif.
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
              Semua
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
              Selesai
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
              Sedang Diproses
            </button>
          </div>
        </div>

        {/* Senarai Jadual Responsive */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/50 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-3">No. Pesanan</th>
                <th className="py-3 px-3">Masa & Pelanggan</th>
                <th className="py-3 px-3">Item Pesanan</th>
                <th className="py-3 px-3">Kaedah</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Jumlah</th>
                <th className="py-3 px-3 text-center">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredTransactions.map((trx) => {
                const MethodIcon = trx.methodIcon;
                return (
                  <tr
                    key={trx.id}
                    className="hover:bg-white/90 transition-colors group"
                  >
                    {/* ID */}
                    <td className="py-3.5 px-3 font-mono font-bold text-slate-800">
                      #{trx.id}
                    </td>

                    {/* Masa & Pelanggan */}
                    <td className="py-3.5 px-3">
                      <p className="font-semibold text-slate-800">{trx.customer}</p>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">{trx.time}</p>
                    </td>

                    {/* Ringkasan Item */}
                    <td className="py-3.5 px-3 max-w-50 truncate text-slate-600">
                      {trx.items}
                    </td>

                    {/* Kaedah Bayaran */}
                    <td className="py-3.5 px-3">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100/80 border border-slate-200/60 text-[11px] font-semibold text-slate-700">
                        <MethodIcon className="w-3.5 h-3.5 text-amber-600" />
                        <span>{trx.method}</span>
                      </div>
                    </td>

                    {/* Status Bayaran */}
                    <td className="py-3.5 px-3">
                      {trx.status === 'COMPLETED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Selesai</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold">
                          <Hourglass className="w-3 h-3 animate-spin" />
                          <span>Sedang Diproses</span>
                        </span>
                      )}
                    </td>

                    {/* Jumlah Nilai */}
                    <td className="py-3.5 px-3 text-right font-extrabold text-slate-900">
                      Rp {trx.amount.toLocaleString('id-ID')}
                    </td>

                    {/* Butang Tindakan Cetak Struk */}
                    <td className="py-3.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handlePrintReceipt(trx.id)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all shadow-2xs"
                        title="Cetak Struk Thermal"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Kaki Jadual */}
        <div className="pt-3 border-t border-slate-200/50 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <span>Menunjukkan 5 transaksi terbaharu daripada 52 pesanan hari ini</span>
          <button
            type="button"
            onClick={() =>
              toast('Membuka arkib sejarah transaksi penuh...', {
                icon: '📋',
              })
            }
            className="font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1"
          >
            <span>Lihat Semua Transaksi</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
