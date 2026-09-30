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
  RotateCcw,
} from 'lucide-react';
import { Topbar } from '../../../components/Topbar';
import { Modal } from '../../../components/Modal';
import { api } from '../../../lib/api';
import { Transaction } from '../../../types';
import { formatRupiah, formatDate, formatNumber } from '../../../lib/formatters';

function getStatusBadge(status: string) {
  switch (status) {
    case 'COMPLETED':
      return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    case 'PARTIALLY_REFUNDED':
      return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
    case 'REFUNDED':
      return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
    case 'CANCELLED':
      return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
    case 'DRAFT':
      return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    default:
      return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
  }
}

function getStatusTextColor(status: string) {
  switch (status) {
    case 'COMPLETED':
      return 'text-emerald-400';
    case 'PARTIALLY_REFUNDED':
      return 'text-amber-400';
    case 'REFUNDED':
      return 'text-purple-400';
    case 'CANCELLED':
      return 'text-rose-400';
    default:
      return 'text-slate-400';
  }
}

function getOrderTypeBadge(type?: string | null) {
  switch (type) {
    case 'DINE_IN':
      return { label: 'Dine In', className: 'bg-blue-500/10 text-blue-400 border border-blue-500/20' };
    case 'TAKEAWAY':
      return { label: 'Takeaway', className: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' };
    case 'DELIVERY':
      return { label: 'Delivery', className: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' };
    case 'ONLINE':
      return { label: 'Online', className: 'bg-violet-500/10 text-violet-400 border border-violet-500/20' };
    default:
      return { label: type || 'Dine In', className: 'bg-slate-500/10 text-slate-400 border border-slate-500/20' };
  }
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [cancellingTx, setCancellingTx] = useState<Transaction | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  // Refund state
  const [refundingTx, setRefundingTx] = useState<Transaction | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [refundItems, setRefundItems] = useState<{
    [itemId: string]: {
      selected: boolean;
      quantity: number;
      amount: number;
      maxQty: number;
      unitPrice: number;
      productName: string;
    };
  }>({});
  const [isRefunding, setIsRefunding] = useState(false);

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

  const handleOpenRefund = async (tx: Transaction) => {
    try {
      const detail: Transaction = await api.getTransaction(tx.id);
      const prevRefundedQty: Record<string, number> = {};
      if (detail.refunds) {
        for (const ref of detail.refunds) {
          for (const it of ref.items || []) {
            prevRefundedQty[it.transactionItemId] =
              (prevRefundedQty[it.transactionItemId] || 0) + Number(it.quantity);
          }
        }
      }

      const initialItems: Record<string, any> = {};
      for (const it of detail.items) {
        const prev = prevRefundedQty[it.id] || 0;
        const remaining = Math.max(0, Number(it.quantity) - prev);
        if (remaining > 0) {
          const unitPrice = Number(it.unitPrice);
          initialItems[it.id] = {
            selected: true,
            quantity: remaining,
            amount: remaining * unitPrice,
            maxQty: remaining,
            unitPrice,
            productName: it.productNameSnapshot,
          };
        }
      }

      setRefundItems(initialItems);
      setRefundReason('');
      setRefundingTx(detail);
    } catch (err: any) {
      alert(err.message || 'Gagal menyiapkan data refund');
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

  const handleConfirmRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundingTx || !refundReason.trim()) return;

    const itemsToRefund = Object.entries(refundItems)
      .filter(([_, val]) => val.selected && val.quantity > 0)
      .map(([id, val]) => ({
        transactionItemId: id,
        quantity: Number(val.quantity),
        amount: Number(val.amount),
      }));

    if (itemsToRefund.length === 0) {
      alert('Pilih minimal 1 item untuk direfund');
      return;
    }

    setIsRefunding(true);
    try {
      await api.refundTransaction(refundingTx.id, {
        reason: refundReason.trim(),
        items: itemsToRefund,
      });
      setRefundingTx(null);
      setRefundReason('');
      setRefundItems({});
      await loadTransactions();
      if (selectedTx?.id === refundingTx.id) {
        const updated = await api.getTransaction(refundingTx.id);
        setSelectedTx(updated);
      }
    } catch (err: any) {
      alert(err.message || 'Gagal memproses refund');
    } finally {
      setIsRefunding(false);
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
              <option value="PARTIALLY_REFUNDED">Sebagian Direfund (PARTIALLY_REFUNDED)</option>
              <option value="REFUNDED">Direfund Penuh (REFUNDED)</option>
              <option value="CANCELLED">Dibatalkan (CANCELLED)</option>
              <option value="DRAFT">Draft (DRAFT)</option>
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
                        <div>{t.transactionNumber}</div>
                        {t.orderType && (
                          <span
                            className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-normal ${
                              getOrderTypeBadge(t.orderType).className
                            }`}
                          >
                            {getOrderTypeBadge(t.orderType).label}
                            {t.queueNumber ? ` • ${t.queueNumber}` : ''}
                          </span>
                        )}
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
                          className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getStatusBadge(
                            t.status
                          )}`}
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
                          {(t.status === 'COMPLETED' || t.status === 'PARTIALLY_REFUNDED') && (
                            <button
                              onClick={() => handleOpenRefund(t)}
                              className="p-1.5 text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition"
                              title="Refund Transaksi"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}
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
                <span className="text-slate-400">Tipe Pesanan:</span>
                <span className="text-slate-200 font-medium">
                  <span
                    className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                      getOrderTypeBadge(selectedTx.orderType).className
                    }`}
                  >
                    {getOrderTypeBadge(selectedTx.orderType).label}
                  </span>
                  {selectedTx.queueNumber ? ` (Antrian: ${selectedTx.queueNumber})` : ''}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Kasir:</span>
                <span className="text-slate-200 font-medium">
                  {selectedTx.createdBy?.displayName || 'Kasir'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span className={`font-bold ${getStatusTextColor(selectedTx.status)}`}>
                  {selectedTx.status}
                </span>
              </div>
              {selectedTx.refundedAt && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Waktu Refund:</span>
                  <span className="text-purple-400 font-medium">{formatDate(selectedTx.refundedAt)}</span>
                </div>
              )}
              {selectedTx.cancelledAt && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Waktu Pembatalan:</span>
                  <span className="text-rose-400 font-medium">{formatDate(selectedTx.cancelledAt)}</span>
                </div>
              )}
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

            {/* Refund History (if any) */}
            {selectedTx.refunds && selectedTx.refunds.length > 0 && (
              <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-purple-300">
                    Riwayat Pengembalian Dana (Refund)
                  </span>
                  <span className="font-mono font-bold text-rose-400">
                    -{formatRupiah(
                      selectedTx.refunds.reduce((sum, r) => sum + Number(r.amount), 0)
                    )}
                  </span>
                </div>
                <div className="divide-y divide-purple-900/40">
                  {selectedTx.refunds.map((ref) => (
                    <div key={ref.id} className="py-2 space-y-1">
                      <div className="flex justify-between text-slate-300">
                        <span className="font-medium text-slate-200">
                          {ref.reason ? `Alasan: ${ref.reason}` : 'Refund Transaksi'}
                        </span>
                        <span className="font-mono font-semibold text-rose-400">
                          -{formatRupiah(ref.amount)}
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>
                          {formatDate(ref.createdAt)}
                          {ref.createdBy?.displayName
                            ? ` • Oleh: ${ref.createdBy.displayName}`
                            : ''}
                        </span>
                        <span>{ref.items?.length || 0} item</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <div className="flex items-center space-x-2">
                {(selectedTx.status === 'COMPLETED' || selectedTx.status === 'PARTIALLY_REFUNDED') && (
                  <button
                    onClick={() => handleOpenRefund(selectedTx)}
                    className="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-xl font-medium transition flex items-center space-x-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Refund Transaksi</span>
                  </button>
                )}
                {selectedTx.status === 'COMPLETED' && (
                  <button
                    onClick={() => {
                      setCancellingTx(selectedTx);
                      setCancelReason('');
                    }}
                    className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-xl font-medium transition flex items-center space-x-1.5"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>Batalkan</span>
                  </button>
                )}
              </div>
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

      {/* Refund Transaction Modal */}
      <Modal
        isOpen={!!refundingTx}
        onClose={() => setRefundingTx(null)}
        title={`Refund Transaksi: ${refundingTx?.transactionNumber || ''}`}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleConfirmRefund} className="space-y-4 text-xs">
          <p className="text-slate-300">
            Pilih item dan jumlah kuantitas yang akan direfund. Stok barang yang direfund akan secara otomatis dipulihkan ke inventori.
          </p>

          <div className="space-y-2 border border-slate-800 rounded-xl p-3 bg-slate-900/60 max-h-60 overflow-y-auto">
            {Object.entries(refundItems).length > 0 ? (
              Object.entries(refundItems).map(([id, item]) => (
                <div
                  key={id}
                  className={`p-2.5 rounded-lg border transition ${
                    item.selected
                      ? 'bg-slate-800/80 border-purple-500/40'
                      : 'bg-slate-900/40 border-slate-800 text-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.selected}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setRefundItems((prev) => ({
                            ...prev,
                            [id]: {
                              ...prev[id],
                              selected: checked,
                              quantity: checked ? prev[id].maxQty : 0,
                              amount: checked ? prev[id].maxQty * prev[id].unitPrice : 0,
                            },
                          }));
                        }}
                        className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-slate-800 border-slate-700"
                      />
                      <span className="font-semibold text-slate-200">{item.productName}</span>
                    </label>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Maks. {item.maxQty} unit @ {formatRupiah(item.unitPrice)}
                    </span>
                  </div>

                  {item.selected && (
                    <div className="grid grid-cols-2 gap-3 mt-2.5 pt-2 border-t border-slate-800/80">
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">
                          Jumlah Refund (Qty)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max={item.maxQty}
                          value={item.quantity}
                          onChange={(e) => {
                            const q = Math.min(item.maxQty, Math.max(1, parseInt(e.target.value) || 1));
                            setRefundItems((prev) => ({
                              ...prev,
                              [id]: {
                                ...prev[id],
                                quantity: q,
                                amount: q * prev[id].unitPrice,
                              },
                            }));
                          }}
                          className="pos-input w-full px-2 py-1 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">
                          Nominal Refund (Rp)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={item.amount}
                          onChange={(e) => {
                            const val = Math.max(0, parseFloat(e.target.value) || 0);
                            setRefundItems((prev) => ({
                              ...prev,
                              [id]: { ...prev[id], amount: val },
                            }));
                          }}
                          className="pos-input w-full px-2 py-1 text-xs font-mono"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-center py-4 text-slate-400">
                Tidak ada item tersisa yang dapat direfund pada transaksi ini.
              </p>
            )}
          </div>

          {/* Total Refund Summary */}
          <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/20 flex items-center justify-between text-xs">
            <span className="text-purple-300 font-semibold">Total Nilai Refund:</span>
            <span className="font-mono font-bold text-sm text-purple-400">
              {formatRupiah(
                Object.values(refundItems)
                  .filter((it) => it.selected)
                  .reduce((sum, it) => sum + Number(it.amount), 0)
              )}
            </span>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Alasan Pengembalian (Refund) *
            </label>
            <input
              type="text"
              required
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              placeholder="Contoh: Barang cacat / pembeli berubah pikiran"
              className="pos-input w-full px-3 py-2 text-xs"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setRefundingTx(null)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:bg-slate-800 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isRefunding}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white transition disabled:opacity-50 flex items-center space-x-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isRefunding ? 'Memproses...' : 'Konfirmasi Refund'}</span>
            </button>
          </div>
        </form>
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
