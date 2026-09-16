'use client';

import React, { useEffect, useState } from 'react';
import { BadgePercent, Plus, CheckCircle, XCircle, Tag, Sparkles, Trash2 } from 'lucide-react';
import { Topbar } from '../../../components/Topbar';
import { Modal } from '../../../components/Modal';
import { api } from '../../../lib/api';
import { Promotion } from '../../../types';
import { formatRupiah, formatNumber } from '../../../lib/formatters';

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpenAdd, setIsOpenAdd] = useState(false);

  const [form, setForm] = useState({
    name: '',
    code: '',
    discountType: 'PERCENTAGE',
    discountValue: '',
    minSpend: '',
  });

  const loadPromotions = async () => {
    setIsLoading(true);
    try {
      const data = await api.getPromotions();
      setPromotions(data || []);
    } catch (err) {
      console.error('Failed to load promotions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPromotions();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isFixed = form.discountType === 'FIXED' || form.discountType === 'FIXED_AMOUNT';
      const type = isFixed ? 'FIXED_AMOUNT' : 'PERCENTAGE';
      const val = parseFloat(form.discountValue) || 0;
      const minSpend = parseFloat(form.minSpend) || 0;

      await api.createPromotion({
        name: form.name,
        code: form.code ? form.code.trim().toUpperCase() : undefined,
        type,
        value: val,
        minimumPurchase: minSpend,
        startAt: new Date().toISOString(),
        endAt: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
        discountType: type,
        discountValue: val,
        minSpend: minSpend,
      });
      setIsOpenAdd(false);
      setForm({ name: '', code: '', discountType: 'PERCENTAGE', discountValue: '', minSpend: '' });
      await loadPromotions();
    } catch (err: any) {
      alert(err.message || 'Gagal menambahkan promosi');
    }
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    try {
      await api.togglePromotion(id, !currentStatus);
      await loadPromotions();
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah status promosi');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus promosi "${name}"? Tindakan ini tidak dapat dibatalkan.`)) return;
    try {
      await api.deletePromotion(id);
      await loadPromotions();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus promosi');
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <Topbar
        title="Promosi & Kode Diskon"
        description="Atur program diskon persentase, nominal tetap, dan minimal belanja kasir"
      />

      <main className="p-6 space-y-6 flex-1">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-200">Daftar Voucher & Promosi</h3>
            <p className="text-xs text-slate-400">Promosi aktif akan otomatis berlaku di kasir mobile</p>
          </div>
          <button
            onClick={() => setIsOpenAdd(true)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs text-white rounded-xl font-semibold shadow-md shadow-indigo-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Promosi</span>
          </button>
        </div>

        {/* Promotions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            <div className="col-span-full py-12 text-center text-slate-500 text-xs">
              Memuat promosi...
            </div>
          ) : promotions.length > 0 ? (
            promotions.map((p) => {
              const isPercentage = (p.discountType || p.type) === 'PERCENTAGE';
              const val = p.discountValue ?? p.value ?? 0;
              const minSpend = p.minSpend ?? p.minimumPurchase ?? 0;
              const typeLabel = isPercentage ? 'Persentase' : 'Nominal Tetap';
              return (
                <div key={p.id} className="glass-card p-5 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono font-bold text-xs">
                        {p.code || 'PROMO-OTOMATIS'}
                      </span>
                      <button
                        onClick={() => handleToggle(p.id, p.active)}
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition ${
                          p.active
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-500 border border-slate-700'
                        }`}
                      >
                        {p.active ? 'Aktif' : 'Non-aktif'}
                      </button>
                    </div>
                    <h4 className="text-sm font-bold text-slate-100 mt-3">{p.name}</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Nilai Diskon:{' '}
                      <strong className="text-emerald-400 font-mono">
                        {isPercentage ? `${val}%` : formatRupiah(val)}
                      </strong>
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Min. Belanja: {formatRupiah(minSpend)}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="capitalize">{typeLabel}</span>
                    <div className="flex items-center space-x-2">
                      <span>Toko Utama</span>
                      <button
                        onClick={() => handleDelete(p.id, p.name)}
                        className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition"
                        title="Hapus Promosi"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-12 text-center text-slate-500 text-xs">
              Belum ada promosi yang dibuat
            </div>
          )}
        </div>
      </main>

      {/* Modal Add Promotion */}
      <Modal isOpen={isOpenAdd} onClose={() => setIsOpenAdd(false)} title="Tambah Program Promosi">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Nama Promosi *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100"
              placeholder="Contoh: Diskon Gajian 10%"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Kode Voucher</label>
            <input
              type="text"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 font-mono"
              placeholder="GAJIAN10"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Tipe Diskon *</label>
              <select
                value={form.discountType}
                onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100"
              >
                <option value="PERCENTAGE">Persentase (%)</option>
                <option value="FIXED_AMOUNT">Nominal Tetap (Rp)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {form.discountType === 'PERCENTAGE' ? 'Persen Diskon (%) *' : 'Nominal Diskon (Rp) *'}
              </label>
              <input
                type="number"
                min="1"
                required
                value={form.discountValue}
                onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 font-mono"
                placeholder={form.discountType === 'PERCENTAGE' ? '10' : '5000'}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Minimal Belanja (Rp)
            </label>
            <input
              type="number"
              min="0"
              value={form.minSpend}
              onChange={(e) => setForm({ ...form, minSpend: e.target.value })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 font-mono"
              placeholder="50000"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsOpenAdd(false)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:bg-slate-800 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition"
            >
              Simpan Promosi
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
