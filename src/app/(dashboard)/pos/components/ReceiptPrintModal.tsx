'use client';

import React from 'react';
import { Printer, CheckCircle, RotateCcw } from 'lucide-react';
import { formatRupiah } from '../../../../lib/formatters';

interface ReceiptPrintModalProps {
  isOpen: boolean;
  transaction: any;
  storeName?: string;
  storeAddress?: string | null;
  storePhone?: string | null;
  onNewTransaction: () => void;
}

export function ReceiptPrintModal({
  isOpen,
  transaction,
  storeName = 'General POS',
  storeAddress,
  storePhone,
  onNewTransaction,
}: ReceiptPrintModalProps) {
  if (!isOpen || !transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  const payment = transaction.payments?.[0];
  const items = transaction.items || [];
  const createdAt = transaction.createdAt ? new Date(transaction.createdAt).toLocaleString('id-ID') : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between no-print">
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle className="w-5 h-5" />
            <h3 className="font-bold text-slate-100 text-sm">Transaksi Berhasil!</h3>
          </div>
        </div>

        {/* Printable Receipt Preview */}
        <div className="p-4 overflow-y-auto flex-1 flex justify-center bg-slate-950/40">
          <div
            id="receipt-print-area"
            className="w-72 bg-white text-black p-4 font-mono text-[11px] leading-tight rounded shadow-inner"
          >
            {/* Store Info */}
            <div className="text-center space-y-0.5 mb-2">
              <h2 className="text-sm font-bold tracking-tight">{storeName}</h2>
              {storeAddress && <p className="text-[10px] text-gray-700">{storeAddress}</p>}
              {storePhone && <p className="text-[10px] text-gray-700">Telp: {storePhone}</p>}
            </div>

            <div className="border-t border-dashed border-gray-400 my-2" />

            {/* Trx Meta */}
            <div className="space-y-0.5 text-[10px] text-gray-700 mb-2">
              <p>No: {transaction.transactionNumber || transaction.id?.slice(0, 8)}</p>
              <p>Waktu: {createdAt}</p>
              <p>Kasir: {transaction.createdBy?.displayName || 'Kasir Web'}</p>
              {transaction.customer?.name && <p>Plg: {transaction.customer.name}</p>}
            </div>

            <div className="border-t border-dashed border-gray-400 my-2" />

            {/* Items */}
            <div className="space-y-1.5 my-2">
              {items.map((it: any, idx: number) => {
                const name = it.product?.name || it.productNameSnapshot || 'Produk';
                return (
                  <div key={idx}>
                    <p className="font-semibold">{name}</p>
                    <div className="flex justify-between text-gray-700">
                      <span>
                        {it.quantity} x {formatRupiah(it.unitPrice)}
                      </span>
                      <span className="font-bold text-black">{formatRupiah(it.total)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-dashed border-gray-400 my-2" />

            {/* Financial summary */}
            <div className="space-y-0.5">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatRupiah(transaction.subtotal)}</span>
              </div>
              {transaction.discountTotal > 0 && (
                <div className="flex justify-between">
                  <span>Diskon:</span>
                  <span>-{formatRupiah(transaction.discountTotal)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-xs pt-1 border-t border-gray-300">
                <span>TOTAL:</span>
                <span>{formatRupiah(transaction.total)}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span>Metode:</span>
                <span>{payment?.paymentMethod?.name || payment?.paymentMethodId || 'TUNAI'}</span>
              </div>
              {payment?.metadata?.amountTendered !== undefined && (
                <>
                  <div className="flex justify-between">
                    <span>Bayar:</span>
                    <span>{formatRupiah(payment.metadata.amountTendered)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kembali:</span>
                    <span>{formatRupiah(payment.metadata.change || 0)}</span>
                  </div>
                </>
              )}
            </div>

            <div className="border-t border-dashed border-gray-400 my-2.5" />

            <div className="text-center text-[10px] text-gray-600">
              <p>Terima kasih atas kunjungan Anda!</p>
              <p>Barang yang dibeli tidak dapat ditukar.</p>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between no-print gap-2">
          <button
            onClick={onNewTransaction}
            className="flex-1 py-2.5 px-3 rounded-xl border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Transaksi Baru</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Struk</span>
          </button>
        </div>
      </div>
    </div>
  );
}
