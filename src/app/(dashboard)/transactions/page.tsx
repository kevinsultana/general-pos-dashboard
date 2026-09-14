'use client';

import React, { useEffect, useState } from 'react';
import {
  ReceiptText,
  Search,
  Filter,
  Eye,
  Ban,
  Calendar,
  CheckCircle,
  XCircle,
  CreditCard,
  User,
} from 'lucide-react';
import { Topbar } from '../../../components/Topbar';
import { Modal } from '../../../components/Modal';
import { api } from '../../../lib/api';
import { Transaction } from '../../../types';
import { formatRupiah, formatDate, formatNumber } from '../../../lib/formatters';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [cancellingTx, setCancellingTx] = useState<Transaction | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  const loadTransactions = async () => {
    setIsLoading(true);
    try {
      const data = await api.getTransactions({
        status: statusFilter || undefined,
        limit: 50,
      });
      setTransactions(data.transactions || []);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [statusFilter]);

  const handleOpenDetail = async (id: string) => {
    try {
      const detail = await api.getTransaction(id);
      setSelectedTx(detail);
    } catch (err: any) {
      alert(err.message || 'Gagal memuat detail transaksi');
    }
  };

  const handleConfirmCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellingTx || !cancelReason.trim()) return;

    setIsCancelling(true);
    try {
      await api.cancelTransaction(cancellingTx.id, cancelReason.trim());
      setCancellingTx(null);
      setCancelReason('');
      await loadTransactions();
      if (selectedTx?.id === cancellingTx.id) {
        setSelectedTx(null);
      }
    } catch (err: any) {
      alert(err.message || 'Gagal membatalkan transaksi');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <Topbar
        title="Riwayat Transaksi Penjualan"
        description="Semua struk dan rekaman kasir yang tersinkronisasi dari seluruh perangkat POS"
      />

      <main className="p-6 space-y-6 flex-1">
        {/* Filter bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pos-select px-3.5 py-2"
            >
              <option value="">Semua Status</option>
              <option value="COMPLETED">Selesai (COMPLETED)</option>
              <option value="CANCELLED">Dibatalkan (CANCELLED)</option>
            </select>
          </div>
          <span className="text-xs text-slate-400">{transactions.length} transaksi dimuat</span>
        </div>

        {/* Transactions Table */}
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400">
                  <th className="py-3 px-4 font-semibold">No. Struk</th>
                  <th className="py-3 px-4 font-semibold">Tanggal & Waktu</th>
                  <th className="py-3 px-4 font-semibold">Kasir</th>
                  <th className="py-3 px-4 font-semibold">Pelanggan</th>
                  <th className="py-3 px-4 font-semibold text-right">Nilai Transaksi</th>
                  <th className="py-3 px-4 font-semibold text-center">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      Memuat data transaksi...
                    </td>
                  </tr>
                ) : transactions.length > 0 ? (
                  transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-100">
                        {t.transactionNumber}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">{formatDate(t.createdAt)}</td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {t.createdBy?.displayName || t.createdBy?.username || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {t.customer?.name || 'Pelanggan Umum'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-100">
                        {formatRupiah(t.total)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            t.status === 'COMPLETED'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          <span>{t.status}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => handleOpenDetail(t.id)}
                            className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition"
                            title="Lihat Struk"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {t.status === 'COMPLETED' && (
                            <button
                              onClick={() => {
                                setCancellingTx(t);
                                setCancelReason('');
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                              title="Batalkan Transaksi"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      Tidak ada transaksi ditemukan
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Detail Transaction Modal */}
      <Modal
        isOpen={!!selectedTx}
        onClose={() => setSelectedTx(null)}
        title={`Struk: ${selectedTx?.transactionNumber || ''}`}
        maxWidth="max-w-xl"
      >
        {selectedTx && (
          <div className="space-y-4 text-xs">
            {/* Header info */}
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Waktu:</span>
                <span className="text-slate-200 font-medium">{formatDate(selectedTx.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Kasir:</span>
                <span className="text-slate-200 font-medium">
                  {selectedTx.createdBy?.displayName || 'Kasir'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span
                  className={`font-bold ${
                    selectedTx.status === 'COMPLETED' ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {selectedTx.status}
                </span>
              </div>
            </div>

            {/* Items List */}
            <div>
              <h5 className="font-semibold text-slate-200 mb-2">Daftar Barang</h5>
              <div className="rounded-xl overflow-hidden border border-slate-800">
                <div className="divide-y divide-slate-800">
                  {selectedTx.items.map((it, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-200">{it.productNameSnapshot}</p>
                        <p className="text-[11px] text-slate-400 font-mono">
                          {it.quantity} x {formatRupiah(it.unitPrice)}
                        </p>
                      </div>
                      <span className="font-mono font-bold text-slate-100">
                        {formatRupiah(it.total)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Totals Breakdown */}
            <div className="pt-2 border-t border-slate-800 space-y-1.5">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal:</span>
                <span className="font-mono">{formatRupiah(selectedTx.subtotal)}</span>
              </div>
              {selectedTx.discountTotal > 0 && (
                <div className="flex justify-between text-rose-400">
                  <span>Diskon:</span>
                  <span className="font-mono">-{formatRupiah(selectedTx.discountTotal)}</span>
                </div>
              )}
              {selectedTx.roundingAmount !== 0 && (
                <div className="flex justify-between text-slate-400">
                  <span>Pembulatan:</span>
                  <span className="font-mono">{formatRupiah(selectedTx.roundingAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-slate-100 pt-1 border-t border-slate-800">
                <span>Total Akhir:</span>
                <span className="font-mono text-emerald-400">{formatRupiah(selectedTx.total)}</span>
              </div>
            </div>

            {/* Payment Info */}
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="font-semibold text-slate-300">Pembayaran</span>
              {selectedTx.payments.map((p, idx) => (
                <div key={idx} className="flex justify-between text-slate-400">
                  <span>{p.paymentMethod?.name || 'Metode Pembayaran'}:</span>
                  <span className="font-mono text-slate-200">{formatRupiah(p.amount)}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedTx(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium transition"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Cancel Transaction Modal */}
      <Modal
        isOpen={!!cancellingTx}
        onClose={() => setCancellingTx(null)}
        title="Konfirmasi Pembatalan Transaksi"
      >
        <form onSubmit={handleConfirmCancel} className="space-y-4">
          <p className="text-xs text-slate-300">
            Anda akan membatalkan struk{' '}
            <strong className="text-slate-100 font-mono">{cancellingTx?.transactionNumber}</strong>{' '}
            senilai <strong className="text-emerald-400">{formatRupiah(cancellingTx?.total)}</strong>.
            Stok barang akan secara otomatis dikembalikan ke inventori toko.
          </p>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Alasan Pembatalan *
            </label>
            <input
              type="text"
              required
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Contoh: Kesalahan input kasir / pelanggan batal"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setCancellingTx(null)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:bg-slate-800 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isCancelling}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition disabled:opacity-50"
            >
              {isCancelling ? 'Memproses...' : 'Batalkan Transaksi'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
