'use client';

import { useState, useEffect } from 'react';
import {
  X,
  ShoppingCart,
  Plus,
  Trash2,
  Building,
  Package,
  Calendar,
  FileText,
  Send,
  DollarSign,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';

export default function CreatePoModal({ isOpen, onClose, onSuccess, suppliers = [], branches = [] }) {
  const [supplierId, setSupplierId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [notes, setNotes] = useState('');
  const [orderDate, setOrderDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState([
    { productId: '', quantity: 1, costPrice: 0 },
  ]);
  const [products, setProducts] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (suppliers.length > 0) {
      setSupplierId(suppliers[0].id);
    }
    if (branches.length > 0) {
      setBranchId(branches[0].id);
    }
  }, [suppliers, branches, isOpen]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get('/products', { params: { limit: 100 } });
        if (res.data?.success) {
          setProducts(res.data.data || []);
        }
      } catch (err) {
        console.error('Failed to load products:', err);
      }
    };
    if (isOpen) {
      fetchProducts();
      setItems([{ productId: '', quantity: 1, costPrice: 0 }]);
      setNotes('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    setItems((prev) => [...prev, { productId: '', quantity: 1, costPrice: 0 }]);
  };

  const handleRemoveItem = (index) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemProductSelect = (index, prodId) => {
    const matched = products.find((p) => p.id === prodId);
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        productId: prodId,
        costPrice: matched?.costPrice || 0,
      };
      return copy;
    });
  };

  const handleItemFieldChange = (index, field, value) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const totalPoCost = items.reduce((acc, it) => {
    const qty = Number(it.quantity) || 0;
    const price = Number(it.costPrice) || 0;
    return acc + qty * price;
  }, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!supplierId) {
      toast.error('Pilih supplier pengadaan.');
      return;
    }

    const validItems = items.filter((it) => it.productId && it.quantity > 0);
    if (validItems.length === 0) {
      toast.error('Pilih minimal satu produk dengan kuantitas > 0.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        supplierId,
        branchId: branchId || undefined,
        orderDate: new Date(orderDate).toISOString(),
        notes: notes.trim() || undefined,
        items: validItems.map((it) => ({
          productId: it.productId,
          quantity: Number(it.quantity),
          costPrice: Number(it.costPrice) || 0,
        })),
      };

      const res = await api.post('/purchase-orders', payload);
      if (res.data?.success) {
        toast.success('Purchase Order berhasil dibuat (Status: ORDERED)!');
        onSuccess?.();
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal membuat Purchase Order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-white/95 backdrop-blur-2xl border border-white/90 shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-3xl overflow-hidden text-slate-800">
        {/* Header Modal */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-linear-to-r from-amber-500/10 to-transparent shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold">
              <ShoppingCart className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">Buat Purchase Order (PO)</h3>
              <p className="text-xs text-slate-500">Pesan pasokan stok barang masuk ke rekanan supplier</p>
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
          {/* Supplier & Cabang Masuk */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Pilih Supplier <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Building className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <select
                  required
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">-- Pilih Supplier --</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Cabang Tujuan Barang Masuk
              </label>
              <div className="relative">
                <Building className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} {b.isMain ? '(Pusat)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Tanggal Order */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Tanggal Pesanan (PO)
            </label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="date"
                required
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Daftar Produk PO */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Item Produk yang Dipesan <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Baris</span>
              </button>
            </div>

            <div className="space-y-2">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
                >
                  {/* Select Product */}
                  <div className="flex-1">
                    <select
                      required
                      value={item.productId}
                      onChange={(e) => handleItemProductSelect(idx, e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="">-- Pilih Produk --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} {p.sku ? `(${p.sku})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quantity */}
                  <div className="w-full sm:w-24">
                    <input
                      type="number"
                      min="1"
                      required
                      value={item.quantity}
                      onChange={(e) => handleItemFieldChange(idx, 'quantity', e.target.value)}
                      placeholder="Qty"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 text-center"
                    />
                  </div>

                  {/* Harga Beli Satuan (Cost Price) */}
                  <div className="w-full sm:w-36 relative">
                    <span className="absolute left-2.5 top-2 text-[10px] font-bold text-slate-400">
                      Rp
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={item.costPrice}
                      onChange={(e) => handleItemFieldChange(idx, 'costPrice', e.target.value)}
                      placeholder="Harga Beli"
                      className="w-full pl-8 pr-2 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 text-right"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    disabled={items.length <= 1}
                    className={`p-2 rounded-xl self-end sm:self-auto transition-colors ${
                      items.length <= 1
                        ? 'text-slate-300 cursor-not-allowed'
                        : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer'
                    }`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Total Estimasi PO */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-between text-xs">
            <span className="font-bold text-amber-900">Total Nilai Pengadaan:</span>
            <span className="text-base font-black text-amber-950">
              Rp {totalPoCost.toLocaleString('id-ID')}
            </span>
          </div>

          {/* Catatan / Keterangan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Catatan PO / Nomor Surat Jalan
            </label>
            <div className="relative">
              <FileText className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Misal: Harap kirim sebelum tanggal 10 / TOP 30 Hari..."
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
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-md shadow-amber-500/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Memproses...' : 'Buat Purchase Order'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
