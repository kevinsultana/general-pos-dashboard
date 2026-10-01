'use client';

import { useState, useEffect } from 'react';
import {
  X,
  ClipboardCheck,
  Plus,
  Trash2,
  AlertCircle,
  Package,
  FileText,
  Save,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';

export default function StockOpnameModal({ isOpen, onClose, onSuccess, branchId }) {
  const [notes, setNotes] = useState('');
  const [products, setProducts] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const res = await api.get('/products', { params: { limit: 100 } });
        if (res.data?.success) {
          const prods = res.data.data || [];
          setProducts(prods);

          // Inisialisasi baris opname
          if (prods.length > 0) {
            setItems(
              prods.slice(0, 5).map((p) => {
                const stockEntry = p.stocks?.find((s) => s.branchId === branchId);
                const currentSystemQty = stockEntry ? stockEntry.quantity : 0;
                return {
                  productId: p.id,
                  productName: p.name,
                  sku: p.sku || '',
                  systemQty: currentSystemQty,
                  physicalQty: currentSystemQty,
                  reason: 'Audit Rutin',
                };
              })
            );
          }
        }
      } catch (err) {
        console.error('Failed to load products for opname:', err);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchProducts();
      setNotes('');
    }
  }, [isOpen, branchId]);

  if (!isOpen) return null;

  const handleAddProductRow = (prodId) => {
    if (!prodId) return;
    if (items.some((it) => it.productId === prodId)) {
      toast.error('Produk ini sudah ada di daftar opname.');
      return;
    }

    const prod = products.find((p) => p.id === prodId);
    if (!prod) return;

    const stockEntry = prod.stocks?.find((s) => s.branchId === branchId);
    const currentSystemQty = stockEntry ? stockEntry.quantity : 0;

    setItems((prev) => [
      ...prev,
      {
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku || '',
        systemQty: currentSystemQty,
        physicalQty: currentSystemQty,
        reason: 'Audit Rutin',
      },
    ]);
  };

  const handleRemoveRow = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePhysicalQtyChange = (index, value) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], physicalQty: Number(value) || 0 };
      return copy;
    });
  };

  const handleReasonChange = (index, value) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], reason: value };
      return copy;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error('Pilih minimal satu produk untuk diaudit.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        notes: notes.trim() || undefined,
        items: items.map((it) => ({
          productId: it.productId,
          physicalQty: Number(it.physicalQty),
          reason: it.reason || undefined,
        })),
      };

      const res = await api.post('/opnames', payload);
      if (res.data?.success) {
        toast.success('Hasil audit stok opname berhasil disimpan dan stok disesuaikan!');
        onSuccess?.();
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan stok opname.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-white/95 backdrop-blur-2xl border border-white/90 shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-3xl overflow-hidden text-slate-800">
        {/* Header Modal */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-linear-to-r from-amber-500/10 to-transparent shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold">
              <ClipboardCheck className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">Sesi Audit Stok Opname Fisik</h3>
              <p className="text-xs text-slate-500">
                Cocokkan stok di sistem dengan perhitungan fisik di gerai Anda
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
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 custom-scrollbar flex-1">
          {/* Pilih Produk Tambahan */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Tambah Produk ke Audit:
            </span>
            <select
              onChange={(e) => {
                handleAddProductRow(e.target.value);
                e.target.value = '';
              }}
              defaultValue=""
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="" disabled>
                -- Pilih Produk Lain --
              </option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.sku ? `(${p.sku})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Tabel Baris Opname */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Produk</th>
                  <th className="py-2.5 px-2 text-center">Stok Sistem</th>
                  <th className="py-2.5 px-2 text-center w-28">Stok Fisik</th>
                  <th className="py-2.5 px-2 text-center">Selisih</th>
                  <th className="py-2.5 px-3">Alasan / Keterangan</th>
                  <th className="py-2.5 px-2 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, idx) => {
                  const diff = item.physicalQty - item.systemQty;

                  return (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3">
                        <p className="font-bold text-slate-900 leading-tight">{item.productName}</p>
                        {item.sku && <p className="text-[10px] text-slate-400 font-mono">{item.sku}</p>}
                      </td>
                      <td className="py-3 px-2 text-center font-bold text-slate-700">
                        {item.systemQty}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <input
                          type="number"
                          min="0"
                          required
                          value={item.physicalQty}
                          onChange={(e) => handlePhysicalQtyChange(idx, e.target.value)}
                          className="w-20 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-center font-black text-slate-900 text-xs"
                        />
                      </td>
                      <td className="py-3 px-2 text-center">
                        {diff === 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px]">
                            Pas (0)
                          </span>
                        )}
                        {diff > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-black text-[10px]">
                            +{diff} (Lebih)
                          </span>
                        )}
                        {diff < 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-black text-[10px]">
                            {diff} (Kurang)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <select
                          value={item.reason}
                          onChange={(e) => handleReasonChange(idx, e.target.value)}
                          className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-700"
                        >
                          <option value="Audit Rutin">Audit Rutin</option>
                          <option value="Barang Rusak / Basi">Barang Rusak / Basi</option>
                          <option value="Hilang / Selisih Kasir">Hilang / Selisih Kasir</option>
                          <option value="Koreksi Salah Input">Koreksi Salah Input</option>
                        </select>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Catatan Sesi Opname */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Catatan Sesi Audit
            </label>
            <div className="relative">
              <FileText className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Misal: Stok opname bulanan gerai oleh Tim Supervisor..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
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
              disabled={isSubmitting || items.length === 0}
              className="px-6 py-2.5 rounded-xl bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-md shadow-amber-500/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan & Sesuaikan Stok'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
