'use client';

import React, { useState } from 'react';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  User,
  Percent,
  CreditCard,
} from 'lucide-react';
import { Customer } from '../../../../types';
import { formatRupiah } from '../../../../lib/formatters';
import { CartItem } from '../../../../hooks/useCart';

interface CartPanelProps {
  items: CartItem[];
  customer: Customer | null;
  customers: Customer[];
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT' | null;
  discountValue: number;
  subtotal: number;
  discountTotal: number;
  total: number;
  totalItemCount: number;
  onSetCustomer: (customer: Customer | null) => void;
  onSetDiscount: (type: 'PERCENTAGE' | 'FIXED_AMOUNT' | null, value: number) => void;
  onUpdateQuantity: (productId: string, variantId: string | null | undefined, qty: number) => void;
  onRemoveItem: (productId: string, variantId?: string | null) => void;
  onClearCart: () => void;
  onOpenCheckout: () => void;
}

export function CartPanel({
  items,
  customer,
  customers,
  discountType,
  discountValue,
  subtotal,
  discountTotal,
  total,
  totalItemCount,
  onSetCustomer,
  onSetDiscount,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOpenCheckout,
}: CartPanelProps) {
  const [showDiscountInput, setShowDiscountInput] = useState(false);
  const [tempDiscVal, setTempDiscVal] = useState(discountValue.toString());
  const [tempDiscType, setTempDiscType] = useState<'PERCENTAGE' | 'FIXED_AMOUNT'>('PERCENTAGE');

  return (
    <div className="w-96 bg-[#0b0f19] flex flex-col h-full shrink-0 border-l border-slate-800">
      {/* Header & Customer Picker */}
      <div className="p-4 border-b border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-indigo-400" />
            <h2 className="font-bold text-slate-100 text-sm">Keranjang Penjualan</h2>
            <span className="text-xs bg-indigo-500/20 text-indigo-400 font-bold px-2 py-0.5 rounded-full">
              {totalItemCount}
            </span>
          </div>
          {items.length > 0 && (
            <button
              onClick={onClearCart}
              className="text-xs text-rose-400 hover:text-rose-300 font-medium transition-colors cursor-pointer"
            >
              Kosongkan
            </button>
          )}
        </div>

        {/* Customer Select */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2">
          <User className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={customer?.id || ''}
            onChange={(e) => {
              const selected = customers.find((c) => c.id === e.target.value) || null;
              onSetCustomer(selected);
            }}
            className="w-full bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="" className="bg-slate-900 text-slate-300">
              Pelanggan Umum (Guest)
            </option>
            {customers.map((c) => (
              <option key={c.id} value={c.id} className="bg-slate-900 text-slate-200">
                {c.name} {c.phone ? `(${c.phone})` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2">
            <ShoppingBag className="w-10 h-10 stroke-[1.2]" />
            <p className="text-xs font-medium text-slate-400">Keranjang masih kosong</p>
            <p className="text-[11px] text-slate-500 text-center">
              Pilih produk di katalog atau scan barcode untuk menambah
            </p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={`${item.productId}-${item.variantId || 'base'}`}
              className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3 flex flex-col gap-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-semibold text-slate-100 truncate">{item.name}</h4>
                  <p className="text-[11px] text-slate-400">{formatRupiah(item.unitPrice)}</p>
                </div>
                <button
                  onClick={() => onRemoveItem(item.productId, item.variantId)}
                  className="text-slate-500 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center justify-between pt-1">
                {/* Quantity modifier */}
                <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg p-0.5">
                  <button
                    onClick={() => onUpdateQuantity(item.productId, item.variantId, item.quantity - 1)}
                    className="w-6 h-6 flex items-center justify-center text-slate-300 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center text-xs font-bold text-slate-100 font-mono">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => onUpdateQuantity(item.productId, item.variantId, item.quantity + 1)}
                    disabled={item.quantity >= item.stock}
                    className="w-6 h-6 flex items-center justify-center text-slate-300 hover:bg-slate-800 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <span className="text-xs font-bold text-slate-100">{formatRupiah(item.total)}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary & Checkout Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/70 space-y-3">
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-400">
            <span>Subtotal</span>
            <span>{formatRupiah(subtotal)}</span>
          </div>

          {/* Discount Trigger / Editor */}
          <div className="flex items-center justify-between text-slate-400">
            <button
              onClick={() => setShowDiscountInput(!showDiscountInput)}
              className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 text-[11px] cursor-pointer"
            >
              <Percent className="w-3 h-3" />
              {discountTotal > 0 ? 'Edit Diskon' : '+ Beri Diskon'}
            </button>
            {discountTotal > 0 && (
              <span className="text-emerald-400 font-medium">-{formatRupiah(discountTotal)}</span>
            )}
          </div>

          {showDiscountInput && (
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-2 space-y-2 mt-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-300 font-medium">Tipe Diskon</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setTempDiscType('PERCENTAGE')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                      tempDiscType === 'PERCENTAGE'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    %
                  </button>
                  <button
                    onClick={() => setTempDiscType('FIXED_AMOUNT')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                      tempDiscType === 'FIXED_AMOUNT'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    Rp
                  </button>
                </div>
              </div>
              <div className="flex gap-1.5">
                <input
                  type="number"
                  placeholder={tempDiscType === 'PERCENTAGE' ? 'Contoh: 10' : 'Contoh: 5000'}
                  value={tempDiscVal}
                  onChange={(e) => setTempDiscVal(e.target.value)}
                  className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded text-xs text-white"
                />
                <button
                  onClick={() => {
                    const val = parseFloat(tempDiscVal) || 0;
                    onSetDiscount(val > 0 ? tempDiscType : null, val);
                    setShowDiscountInput(false);
                  }}
                  className="px-2.5 py-1 bg-indigo-600 text-white rounded text-xs font-semibold cursor-pointer"
                >
                  OK
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-between text-sm font-bold text-slate-100 pt-2 border-t border-slate-800">
            <span>Total Akhir</span>
            <span className="text-indigo-400 text-base">{formatRupiah(total)}</span>
          </div>
        </div>

        <button
          disabled={items.length === 0}
          onClick={onOpenCheckout}
          className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer text-sm"
        >
          <CreditCard className="w-4 h-4" />
          <span>Bayar {formatRupiah(total)}</span>
        </button>
      </div>
    </div>
  );
}
