'use client';

import { useState, useEffect } from 'react';
import {
  X,
  Truck,
  Plus,
  Trash2,
  AlertCircle,
  Package,
  Building,
  FileText,
  Send,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';

export default function CreateTransferModal({ isOpen, onClose, onSuccess, branches = [] }) {
  const [fromBranchId, setFromBranchId] = useState('');
  const [toBranchId, setToBranchId] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([
    { productId: '', quantity: 1 },
  ]);
  const [productList, setProductList] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set default branches
  useEffect(() => {
    if (branches.length >= 2) {
      setFromBranchId(branches[0].id);
      setToBranchId(branches[1].id);
    } else if (branches.length === 1) {
      setFromBranchId(branches[0].id);
    }
  }, [branches, isOpen]);

  // Load products list
  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        const res = await api.get('/products', { params: { limit: 100 } });
        if (res.data?.success) {
          setProductList(res.data.data || []);
        }
      } catch (err) {
        console.error('Failed to load products:', err);
      } finally {
        setLoadingProducts(false);
      }
    };

    if (isOpen) {
      fetchProducts();
      setItems([{ productId: '', quantity: 1 }]);
      setNotes('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    setItems((prev) => [...prev, { productId: '', quantity: 1 }]);
  };

  const handleRemoveItem = (index) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!fromBranchId || !toBranchId) {
      toast.error('Pilih cabang asal dan cabang tujuan.');
      return;
    }

    if (fromBranchId === toBranchId) {
      toast.error('Cabang asal dan cabang tujuan tidak boleh sama.');
      return;
    }

    const validItems = items.filter((item) => item.productId && item.quantity > 0);
    if (validItems.length === 0) {
      toast.error('Pilih minimal satu produk dengan jumlah > 0.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        fromBranchId,
        toBranchId,
        notes: notes.trim() || undefined,
        items: validItems.map((item) => ({
          productId: item.productId,
          quantity: Number(item.quantity),
        })),
      };

      const res = await api.post('/transfers', payload);
      if (res.data?.success) {
        toast.success('Pengiriman transfer stok berhasil dibuat!');
        onSuccess?.();
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memproses transfer stok.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-white/95 backdrop-blur-2xl border border-white/90 shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-3xl overflow-hidden text-slate-800">
        {/* Header Modal */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-linear-to-r from-purple-500/10 to-transparent shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-700 flex items-center justify-center font-bold">
              <Truck className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900">
                  Kirim Transfer Stok Antar Cabang
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[10px] font-black uppercase">
                  PRO
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Stok akan langsung dipotong dari cabang pengirim dan berstatus PENDING
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
          {/* Pemilihan Cabang */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Cabang Pengirim (Asal) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Building className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <select
                  required
                  value={fromBranchId}
                  onChange={(e) => setFromBranchId(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">-- Pilih Cabang Pengirim --</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} {b.isMain ? '(Pusat)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Cabang Penerima (Tujuan) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Building className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <select
                  required
                  value={toBranchId}
                  onChange={(e) => setToBranchId(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">-- Pilih Cabang Penerima --</option>
                  {branches
                    .filter((b) => b.id !== fromBranchId)
                    .map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} {b.isMain ? '(Pusat)' : ''}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>

          {/* Daftar Produk yang Ditransfer */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Daftar Barang yang Ditransfer <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs font-bold text-purple-700 hover:text-purple-800 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Baris</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3"
                >
                  <div className="flex-1">
                    <select
                      required
                      value={item.productId}
                      onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">-- Pilih Produk --</option>
                      {productList.map((prod) => (
                        <option key={prod.id} value={prod.id}>
                          {prod.name} {prod.sku ? `(${prod.sku})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-28">
                    <input
                      type="number"
                      min="1"
                      required
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                      placeholder="Qty"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 text-center focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    disabled={items.length <= 1}
                    className={`p-2 rounded-xl transition-colors ${
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

          {/* Catatan / Keterangan Pengiriman */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Catatan Pengiriman / Surat Jalan
            </label>
            <div className="relative">
              <FileText className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Misal: Dikirim menggunakan mobil operasional / Driver: Pak Joko"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Info Card Pro */}
          <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200/80 text-purple-950 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Begitu transfer dibuat, stok di cabang pengirim akan otomatis dipotong. Staf di cabang tujuan dapat mengklik tombol <strong>&ldquo;Konfirmasi Terima&rdquo;</strong> untuk menambah stok fisik mereka.
            </p>
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
              className="px-6 py-2.5 rounded-xl bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Mengirim...' : 'Kirim Transfer Sekarang'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
