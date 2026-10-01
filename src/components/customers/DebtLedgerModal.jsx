'use client';

import { useState, useEffect } from 'react';
import {
  X,
  BookOpen,
  Receipt,
  Clock,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Banknote,
  Calendar,
  User,
  ArrowDownLeft,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';

export default function DebtLedgerModal({
  isOpen,
  onClose,
  customer,
  onPayDebtClick,
}) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    customer: null,
    unpaidOrders: [],
    debtPayments: [],
  });

  useEffect(() => {
    const fetchDebts = async () => {
      if (!customer?.id) return;
      setLoading(true);
      try {
        const res = await api.get(`/customers/${customer.id}/debts`);
        if (res.data?.success) {
          setData(res.data.data);
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Gagal memuat buku kasbon.');
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchDebts();
    }
  }, [customer, isOpen]);

  if (!isOpen || !customer) return null;

  const currentCustomer = data.customer || customer;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-white/95 backdrop-blur-2xl border border-white/90 shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-3xl overflow-hidden text-slate-800">
        {/* Header Modal */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-linear-to-r from-amber-500/10 to-transparent shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">
                Buku Kasbon & Riwayat Pelunasan
              </h3>
              <p className="text-xs text-slate-500">
                {currentCustomer.name} • {currentCustomer.phone || 'Tanpa no. telepon'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {currentCustomer.totalDebt > 0 && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onPayDebtClick?.(currentCustomer);
                }}
                className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Banknote className="w-4 h-4" />
                <span>Bayar Kasbon</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar flex-1">
          {/* Summary Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Total Belanja Terdaftar
              </span>
              <span className="text-base font-black text-slate-900">
                Rp {(currentCustomer.totalSpent || 0).toLocaleString('id-ID')}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Total Transaksi
              </span>
              <span className="text-base font-black text-slate-900">
                {currentCustomer.totalOrders || 0} Transaksi
              </span>
            </div>

            <div
              className={`p-4 rounded-2xl border ${
                currentCustomer.totalDebt > 0
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider block">
                Sisa Piutang / Kasbon
              </span>
              <span className="text-base font-black">
                Rp {(currentCustomer.totalDebt || 0).toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2">
              <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-500 font-semibold">Memuat rincian kasbon...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* 1. Tagihan Belum Lunas (Unpaid Orders) */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Receipt className="w-4 h-4 text-amber-600" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Daftar Transaksi Belum Lunas ({data.unpaidOrders.length})
                  </h4>
                </div>

                {data.unpaidOrders.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500 font-medium">
                    Tidak ada tagihan tertunggak. Semua pesanan pelanggan ini telah lunas.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {data.unpaidOrders.map((ord) => (
                      <div
                        key={ord.id}
                        className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 font-mono">
                              {ord.orderNo}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                ord.paymentStatus === 'PARTIAL'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {ord.paymentStatus === 'PARTIAL' ? 'Cicilan / DP' : 'Belum Bayar'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1">
                            {new Date(ord.createdAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}{' '}
                            • {ord.branch?.name || 'Cabang'}
                          </p>
                        </div>

                        <div className="text-right flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0">
                          <div>
                            <span className="text-[10px] text-slate-400 block">Total Pesanan</span>
                            <span className="text-xs font-bold text-slate-700">
                              Rp {ord.grandTotal.toLocaleString('id-ID')}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-rose-500 font-bold block">
                              Sisa Kasbon
                            </span>
                            <span className="text-sm font-black text-rose-600">
                              Rp {(ord.remainingDebt || 0).toLocaleString('id-ID')}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. Riwayat Pembayaran Kasbon (Debt Payments) */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Riwayat Pembayaran Pelunasan ({data.debtPayments.length})
                  </h4>
                </div>

                {data.debtPayments.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500 font-medium">
                    Belum ada riwayat pembayaran pelunasan kasbon.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {data.debtPayments.map((pay) => (
                      <div
                        key={pay.id}
                        className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 font-mono">
                              {pay.paymentNo}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase">
                              {pay.paymentMethod}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1">
                            {new Date(pay.paidAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}{' '}
                            • Kasir: {pay.cashier?.name || 'Kasir'}
                          </p>
                          {pay.notes && (
                            <p className="text-[11px] text-slate-600 italic mt-0.5">
                              &ldquo;{pay.notes}&rdquo;
                            </p>
                          )}
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-emerald-600 font-bold block uppercase">
                            Nominal Dibayar
                          </span>
                          <span className="text-sm font-black text-emerald-700">
                            + Rp {pay.amount.toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
