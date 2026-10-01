'use client';

import { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  Banknote,
  QrCode,
  Building,
  CheckCircle,
  AlertCircle,
  FileText,
  User,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';

const PAYMENT_METHODS = [
  { id: 'CASH', label: 'Tunai (Cash)', icon: Banknote },
  { id: 'QRIS', label: 'QRIS', icon: QrCode },
  { id: 'TRANSFER', label: 'Transfer Bank', icon: Building },
  { id: 'DEBIT', label: 'Kartu Debit', icon: CreditCard },
];

export default function PayDebtModal({ isOpen, onClose, customer, onSuccess }) {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (customer?.totalDebt) {
      setAmount(customer.totalDebt.toString());
    } else {
      setAmount('');
    }
    setPaymentMethod('CASH');
    setNotes('');
  }, [customer, isOpen]);

  if (!isOpen || !customer) return null;

  const totalDebt = customer.totalDebt || 0;
  const numAmount = parseInt(amount, 10) || 0;
  const isOverpaid = numAmount > totalDebt;
  const remainingAfterPayment = Math.max(0, totalDebt - numAmount);

  const handleQuickAmount = (val) => {
    if (val === 'ALL') {
      setAmount(totalDebt.toString());
    } else {
      setAmount(Math.min(totalDebt, val).toString());
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!numAmount || numAmount <= 0) {
      toast.error('Masukkan nominal pembayaran kasbon.');
      return;
    }

    if (numAmount > totalDebt) {
      toast.error('Nominal pembayaran melebihi total kasbon.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post(`/customers/${customer.id}/pay-debt`, {
        amount: numAmount,
        paymentMethod,
        notes: notes.trim() || undefined,
      });

      if (res.data?.success) {
        toast.success(
          `Pembayaran kasbon Rp ${numAmount.toLocaleString('id-ID')} berhasil dicatat!`
        );
        onSuccess?.();
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memproses pembayaran kasbon.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white/95 backdrop-blur-2xl border border-white/90 shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-3xl overflow-hidden text-slate-800">
        {/* Header Modal */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-linear-to-r from-emerald-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center font-bold">
              <Banknote className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">
                Pelunasan Kasbon Pelanggan
              </h3>
              <p className="text-xs text-slate-500">
                Catat penerimaan pembayaran hutang / kasbon
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Card Info Pelanggan & Tagihan */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-sm">
                {(customer.name || 'P').charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">{customer.name}</h4>
                <p className="text-xs text-slate-500">{customer.phone || 'Tanpa no. telepon'}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500 block">
                Total Kasbon
              </span>
              <span className="text-base font-black text-rose-600">
                Rp {totalDebt.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* Input Nominal Pembayaran */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Nominal Bayar (Rp) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-2.5 text-sm font-bold text-slate-400">
                Rp
              </span>
              <input
                type="number"
                min="1"
                max={totalDebt}
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className={`w-full pl-12 pr-4 py-2.5 bg-slate-50 border rounded-2xl text-base font-black outline-none focus:ring-2 transition-all ${
                  isOverpaid
                    ? 'border-rose-400 text-rose-600 focus:ring-rose-400/20'
                    : 'border-slate-200 text-slate-900 focus:ring-amber-500'
                }`}
              />
            </div>
            {isOverpaid && (
              <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Nominal melebihi total kasbon (Rp {totalDebt.toLocaleString('id-ID')})</span>
              </p>
            )}
          </div>

          {/* Quick Amount Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleQuickAmount('ALL')}
              className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-colors cursor-pointer"
            >
              Lunas Penuh (Rp {totalDebt.toLocaleString('id-ID')})
            </button>
            {[50000, 100000, 200000, 500000]
              .filter((val) => val < totalDebt)
              .map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickAmount(val)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                >
                  {val.toLocaleString('id-ID')}
                </button>
              ))}
          </div>

          {/* Metode Pembayaran */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Metode Pembayaran
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {PAYMENT_METHODS.map((method) => {
                const Icon = method.icon;
                const isSelected = paymentMethod === method.id;

                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setPaymentMethod(method.id)}
                    className={`p-3 rounded-2xl border text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-50 border-amber-300 text-amber-900 ring-2 ring-amber-500/20 shadow-2xs'
                        : 'bg-slate-50 border-slate-200/80 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-amber-600' : 'text-slate-400'}`} />
                    <span>{method.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Catatan / Keterangan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Catatan / Referensi (Opsional)
            </label>
            <div className="relative">
              <FileText className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Misal: Titipan via transfer BCA / Tunai di kasir"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Sisa Kasbon Setelah Bayar */}
          <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200/60 flex items-center justify-between text-xs">
            <span className="font-semibold text-amber-900">Sisa Kasbon Setelah Bayar:</span>
            <span className="font-black text-amber-950">
              Rp {remainingAfterPayment.toLocaleString('id-ID')}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isOverpaid || numAmount <= 0}
              className="px-6 py-2.5 rounded-xl bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{isSubmitting ? 'Memproses...' : 'Konfirmasi Pelunasan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
