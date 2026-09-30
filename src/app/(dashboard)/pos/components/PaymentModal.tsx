'use client';

import React, { useState, useEffect } from 'react';
import { X, Banknote, QrCode, Building, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatRupiah } from '../../../../lib/formatters';
import { CartItem } from '../../../../hooks/useCart';
import { Customer } from '../../../../types';
import { api } from '../../../../lib/api';

interface PaymentModalProps {
  isOpen: boolean;
  total: number;
  subtotal: number;
  discountTotal: number;
  items: CartItem[];
  customer: Customer | null;
  onClose: () => void;
  onSuccess: (transaction: any) => void;
}

export function PaymentModal({
  isOpen,
  total,
  subtotal,
  discountTotal,
  items,
  customer,
  onClose,
  onSuccess,
}: PaymentModalProps) {
  const numTotal = Number(total) || 0;
  const numSubtotal = Number(subtotal) || 0;
  const numDiscountTotal = Number(discountTotal) || 0;

  const [method, setMethod] = useState<'CASH' | 'QRIS' | 'TRANSFER'>('CASH');
  const [cashTendered, setCashTendered] = useState<number>(numTotal);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setCashTendered(numTotal);
  }, [numTotal]);

  if (!isOpen) return null;

  const numTendered = Number(cashTendered) || 0;
  const change = Math.max(0, numTendered - numTotal);
  const isCashValid = method !== 'CASH' || numTendered >= numTotal;

  const quickAmounts = [
    { label: 'Uang Pas', value: numTotal },
    { label: 'Rp 20.000', value: 20000 },
    { label: 'Rp 50.000', value: 50000 },
    { label: 'Rp 100.000', value: 100000 },
    { label: 'Rp 200.000', value: 200000 },
  ].filter((q) => q.value >= numTotal || q.label === 'Uang Pas');

  const handleProcessPayment = async () => {
    if (!isCashValid) return;
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const payload = {
        customerId: customer?.id || null,
        subtotal: numSubtotal,
        discountTotal: numDiscountTotal,
        total: numTotal,
        items: items.map((it) => ({
          productId: it.productId,
          variantId: it.variantId || null,
          quantity: Number(it.quantity) || 1,
          unitPrice: Number(it.unitPrice) || 0,
          discountAmount: 0,
          subtotal: Number(it.subtotal) || 0,
          total: Number(it.total) || 0,
        })),
        payments: [
          {
            paymentMethodId: method,
            amount: method === 'CASH' ? numTendered : numTotal,
            roundingAmount: 0,
            metadata: {
              paymentType: method,
              amountTendered: method === 'CASH' ? numTendered : numTotal,
              change: method === 'CASH' ? change : 0,
            },
          },
        ],
      };

      const result = await api.createTransaction(payload);
      onSuccess(result);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memproses transaksi kasir');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-slate-100 text-base">Penyelesaian Pembayaran</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Total Tag */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-center">
            <p className="text-xs text-slate-400 font-medium">Total Tagihan</p>
            <p className="text-2xl font-black text-indigo-400 mt-1">{formatRupiah(total)}</p>
          </div>

          {/* Payment Method Selector */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setMethod('CASH')}
              className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-colors cursor-pointer ${
                method === 'CASH'
                  ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <Banknote className="w-5 h-5" />
              <span className="text-xs font-semibold">Tunai</span>
            </button>

            <button
              onClick={() => setMethod('QRIS')}
              className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-colors cursor-pointer ${
                method === 'QRIS'
                  ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <QrCode className="w-5 h-5" />
              <span className="text-xs font-semibold">QRIS</span>
            </button>

            <button
              onClick={() => setMethod('TRANSFER')}
              className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-colors cursor-pointer ${
                method === 'TRANSFER'
                  ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <Building className="w-5 h-5" />
              <span className="text-xs font-semibold">Transfer</span>
            </button>
          </div>

          {/* Cash Details */}
          {method === 'CASH' && (
            <div className="space-y-3 pt-2">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Uang Tunai Diterima (Rp)
                </label>
                <input
                  type="number"
                  value={cashTendered || ''}
                  onChange={(e) => setCashTendered(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 font-bold text-base focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap gap-1.5">
                {quickAmounts.map((q) => (
                  <button
                    key={q.label}
                    onClick={() => setCashTendered(q.value)}
                    className="px-2.5 py-1 bg-slate-850 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300 rounded-lg transition-colors cursor-pointer"
                  >
                    {q.label}
                  </button>
                ))}
              </div>

              {/* Kembalian */}
              <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">Uang Kembalian</span>
                <span
                  className={`text-base font-bold ${
                    cashTendered < total ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {cashTendered < total
                    ? `Kurang ${formatRupiah(total - cashTendered)}`
                    : formatRupiah(change)}
                </span>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2 text-xs text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            disabled={!isCashValid || isSubmitting}
            onClick={handleProcessPayment}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>Konfirmasi Pembayaran</span>
          </button>
        </div>
      </div>
    </div>
  );
}
