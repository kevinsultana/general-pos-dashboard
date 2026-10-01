'use client';

import { useState, useEffect } from 'react';
import { X, Tag, Palette, Loader2, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16',
  '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6',
  '#ec4899', '#64748b', '#1e293b', '#78716c',
];

export default function CategoryModal({ isOpen, onClose, category, onSuccess }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [loading, setLoading] = useState(false);

  const isEdit = Boolean(category?.id);

  useEffect(() => {
    if (isOpen) {
      setName(category?.name || '');
      setColor(category?.color || '#3b82f6');
    }
  }, [isOpen, category]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Nama kategori wajib diisi.');
      return;
    }
    setLoading(true);
    try {
      if (isEdit) {
        await api.put(`/categories/${category.id}`, { name: name.trim(), color });
        toast.success('Kategori berhasil diperbarui!');
      } else {
        await api.post('/categories', { name: name.trim(), color });
        toast.success('Kategori baru berhasil ditambahkan!');
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan kategori.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white/90 backdrop-blur-xl border border-white/60 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Tag className="w-4 h-4 text-blue-600" />
            </div>
            <h2 className="text-base font-bold text-slate-800">
              {isEdit ? 'Edit Kategori' : 'Tambah Kategori'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Nama */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Nama Kategori <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Misal: Minuman, Makanan Berat..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white/70 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition"
              autoFocus
            />
          </div>

          {/* Warna */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">
              <Palette className="w-3.5 h-3.5 inline mr-1" />
              Warna Label
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center"
                  style={{
                    backgroundColor: c,
                    borderColor: color === c ? '#1e293b' : 'transparent',
                    transform: color === c ? 'scale(1.15)' : 'scale(1)',
                  }}
                >
                  {color === c && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2.5">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-9 h-9 rounded-xl border border-slate-200 cursor-pointer bg-white"
                title="Pilih warna kustom"
              />
              <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2.5 py-1.5 rounded-lg">
                {color.toUpperCase()}
              </span>
              <div
                className="flex-1 h-8 rounded-xl border border-slate-200 shadow-inner"
                style={{ backgroundColor: color }}
              />
            </div>
          </div>

          {/* Preview */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Preview Badge</p>
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-white shadow-sm"
              style={{ backgroundColor: color }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-white/70" />
              {name || 'Nama Kategori'}
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
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
              className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isEdit ? 'Simpan Perubahan' : 'Tambah Kategori'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
