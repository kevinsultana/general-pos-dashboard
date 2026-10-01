'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Boxes, Loader2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';

export default function QuickStockModal({ isOpen, onClose, product, branchId, onSuccess }) {
  const [quantity, setQuantity] = useState('');
  const [minStock, setMinStock] = useState('');
  const [loading, setLoading] = useState(false);

  // [M-2] isMountedRef — cegah state update setelah unmount
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  // [M-6] Tutup modal dengan tombol Escape
  const handleEscape = useCallback((e) => {
    if (e.key === 'Escape' && !loading) onClose();
  }, [onClose, loading]);
  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, handleEscape]);

  const currentStock = product?.stocks?.find((s) => s.branchId === branchId)?.quantity ?? 0;
  const currentMinStock = product?.stocks?.find((s) => s.branchId === branchId)?.minStock ?? 5;

  useEffect(() => {
    if (isOpen && product) {
      setQuantity(currentStock.toString());
      setMinStock(currentMinStock.toString());
    }
  }, [isOpen, product, currentStock, currentMinStock]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newQty = parseFloat(quantity);
    if (isNaN(newQty) || newQty < 0) {
      toast.error('Jumlah stok tidak valid.');
      return;
    }
    setLoading(true);
    try {
      await api.patch(`/products/${product.id}/stock`, {
        quantity: newQty,
        minStock: parseInt(minStock, 10) || 5,
        branchId,
      });
      if (isMountedRef.current) toast.success(`Stok "${product.name}" berhasil disesuaikan ke ${newQty}!`);
      onSuccess?.();
      onClose();
    } catch (err) {
      if (isMountedRef.current) toast.error(err.response?.data?.message || 'Gagal memperbarui stok.');
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  };

  if (!isOpen || !product) return null;

  const diff = parseFloat(quantity) - currentStock;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-white/90 backdrop-blur-xl border border-white/60 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Boxes className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">Sesuaikan Stok</h2>
              <p className="text-[11px] text-slate-500 truncate max-w-40">{product.name}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Stok saat ini */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Stok Saat Ini</span>
            <span className={`text-lg font-extrabold tabular-nums ${
              currentStock <= currentMinStock ? 'text-red-600' : 'text-slate-800'
            }`}>
              {currentStock.toLocaleString('id-ID')}
            </span>
          </div>

          {/* Input stok baru */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Stok Baru <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              step="0.001"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              autoFocus
              className="w-full px-3.5 py-3 rounded-xl border border-slate-200 bg-white text-lg font-bold text-slate-800 text-center placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition"
            />
            {quantity !== '' && !isNaN(parseFloat(quantity)) && (
              <p className={`mt-1.5 text-center text-xs font-semibold ${
                diff > 0 ? 'text-emerald-600' : diff < 0 ? 'text-rose-600' : 'text-slate-400'
              }`}>
                {diff > 0 ? `▲ +${diff.toLocaleString('id-ID')} (penambahan)` :
                 diff < 0 ? `▼ ${diff.toLocaleString('id-ID')} (pengurangan)` :
                 '─ Tidak ada perubahan'}
              </p>
            )}
          </div>

          {/* Batas minimum */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Batas Peringatan Minimum
            </label>
            <input
              type="number"
              min="0"
              value={minStock}
              onChange={(e) => setMinStock(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 text-center focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition"
            />
            <p className="mt-1 text-[11px] text-slate-400 text-center">
              Notifikasi muncul saat stok ≤ nilai ini
            </p>
          </div>

          {/* Warning jika stok rendah */}
          {parseFloat(quantity) <= parseInt(minStock) && parseFloat(quantity) >= 0 && quantity !== '' && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 font-medium">
                Stok baru berada di bawah atau sama dengan batas minimum. Peringatan stok rendah akan aktif.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Simpan Stok
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
