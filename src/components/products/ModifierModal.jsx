'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  X, Sliders, Plus, Trash2, Loader2, ToggleLeft, ToggleRight,
  Package, ChevronDown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';

const EMPTY_OPTION = () => ({
  _key: Math.random().toString(36).slice(2),
  name: '',
  price: '',
  trackStock: false,
  inventoryProductId: '',
  deductQty: 1,
});

export default function ModifierModal({ isOpen, onClose, modifier, products, onSuccess }) {
  const [groupName, setGroupName] = useState('');
  const [isRequired, setIsRequired] = useState(false);
  const [isMultiple, setIsMultiple] = useState(false);
  const [options, setOptions] = useState([EMPTY_OPTION()]);
  const [loading, setLoading] = useState(false);

  const isEdit = Boolean(modifier?.id);

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

  useEffect(() => {
    if (isOpen) {
      if (modifier) {
        setGroupName(modifier.name || '');
        setIsRequired(modifier.isRequired || false);
        setIsMultiple(modifier.isMultiple || false);
        setOptions(
          modifier.options?.length > 0
            ? modifier.options.map((o) => ({
                _key: o.id || Math.random().toString(36).slice(2),
                id: o.id,
                name: o.name || '',
                price: o.price?.toString() || '0',
                trackStock: o.trackStock || false,
                inventoryProductId: o.inventoryProductId || '',
                deductQty: o.deductQty || 1,
              }))
            : [EMPTY_OPTION()]
        );
      } else {
        setGroupName('');
        setIsRequired(false);
        setIsMultiple(false);
        setOptions([EMPTY_OPTION()]);
      }
    }
  }, [isOpen, modifier]);

  const addOption = () => setOptions((prev) => [...prev, EMPTY_OPTION()]);

  const removeOption = (key) => {
    setOptions((prev) => prev.filter((o) => o._key !== key));
  };

  const updateOption = (key, field, value) => {
    setOptions((prev) =>
      prev.map((o) => (o._key === key ? { ...o, [field]: value } : o))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) {
      toast.error('Nama grup modifier wajib diisi.');
      return;
    }
    const validOpts = options.filter((o) => o.name.trim());
    if (validOpts.length === 0) {
      toast.error('Tambahkan minimal 1 opsi modifier.');
      return;
    }

    const payload = {
      name: groupName.trim(),
      isRequired,
      isMultiple,
      options: validOpts.map((o) => ({
        ...(o.id ? { id: o.id } : {}),
        name: o.name.trim(),
        price: Math.max(0, parseInt(o.price, 10) || 0),
        trackStock: Boolean(o.trackStock),
        inventoryProductId: o.trackStock && o.inventoryProductId ? o.inventoryProductId : null,
        deductQty: o.trackStock ? Math.max(0.001, parseFloat(o.deductQty) || 1) : null,
      })),
    };

    setLoading(true);
    try {
      if (isEdit) {
        await api.put(`/modifiers/${modifier.id}`, payload);
        if (isMountedRef.current) toast.success('Modifier group berhasil diperbarui!');
      } else {
        await api.post('/modifiers', payload);
        if (isMountedRef.current) toast.success('Modifier group berhasil ditambahkan!');
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      if (isMountedRef.current) toast.error(err.response?.data?.message || 'Gagal menyimpan modifier.');
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-12 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-xl bg-white/90 backdrop-blur-xl border border-white/60 rounded-2xl shadow-2xl mb-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white/90 backdrop-blur-xl rounded-t-2xl z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <Sliders className="w-4 h-4 text-violet-600" />
            </div>
            <h2 className="text-base font-bold text-slate-800">
              {isEdit ? 'Edit Modifier Group' : 'Tambah Modifier Group'}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Nama Grup */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Nama Grup Modifier <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Misal: Level Gula, Topping Boba, Pilihan Ukuran..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white/70 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition"
              autoFocus
            />
          </div>

          {/* Aturan Pilihan */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setIsRequired((v) => !v)}
              className={`flex items-center justify-between gap-2 px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
                isRequired
                  ? 'bg-rose-50 border-rose-300 text-rose-700'
                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
              }`}
            >
              <span>Wajib Dipilih</span>
              {isRequired ? <ToggleRight className="w-5 h-5 text-rose-600" /> : <ToggleLeft className="w-5 h-5 text-slate-400" />}
            </button>
            <button
              type="button"
              onClick={() => setIsMultiple((v) => !v)}
              className={`flex items-center justify-between gap-2 px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
                isMultiple
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
              }`}
            >
              <span>Pilih Banyak</span>
              {isMultiple ? <ToggleRight className="w-5 h-5 text-blue-600" /> : <ToggleLeft className="w-5 h-5 text-slate-400" />}
            </button>
          </div>

          {/* Daftar Opsi */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-600">
                Daftar Opsi <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={addOption}
                className="flex items-center gap-1 text-xs font-bold text-violet-600 hover:text-violet-800 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah Opsi
              </button>
            </div>

            <div className="space-y-3">
              {options.map((opt, idx) => (
                <div key={opt._key} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 w-5 text-center">{idx + 1}</span>
                    <input
                      type="text"
                      value={opt.name}
                      onChange={(e) => updateOption(opt._key, 'name', e.target.value)}
                      placeholder="Nama opsi (misal: Extra Boba, Less Sugar)"
                      className="flex-1 px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 transition"
                    />
                    <div className="relative w-28 shrink-0">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold pointer-events-none">Rp</span>
                      <input
                        type="number"
                        min="0"
                        value={opt.price}
                        onChange={(e) => updateOption(opt._key, 'price', e.target.value)}
                        placeholder="0"
                        className="w-full pl-8 pr-2 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 transition"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeOption(opt._key)}
                      disabled={options.length === 1}
                      className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Toggle potong stok */}
                  <div className="flex items-center gap-3 pl-7">
                    <button
                      type="button"
                      onClick={() => updateOption(opt._key, 'trackStock', !opt.trackStock)}
                      className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-all ${
                        opt.trackStock
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                          : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      {opt.trackStock ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                      Potong Stok Fisik
                    </button>

                    {opt.trackStock && (
                      <div className="flex items-center gap-2 flex-1">
                        <div className="relative flex-1">
                          <Package className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                          <select
                            value={opt.inventoryProductId}
                            onChange={(e) => updateOption(opt._key, 'inventoryProductId', e.target.value)}
                            className="w-full pl-8 pr-7 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 transition appearance-none"
                          >
                            <option value="">Pilih produk bahan</option>
                            {(products || [])
                              .filter((p) => p.trackStock && !p.isService)
                              .map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} {p.sku ? `(${p.sku})` : ''}
                                </option>
                              ))}
                          </select>
                          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-xs text-slate-500">×</span>
                          <input
                            type="number"
                            min="0.001"
                            step="0.001"
                            value={opt.deductQty}
                            onChange={(e) => updateOption(opt._key, 'deductQty', e.target.value)}
                            className="w-16 px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-center text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 transition"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isEdit ? 'Simpan Perubahan' : 'Tambah Modifier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
