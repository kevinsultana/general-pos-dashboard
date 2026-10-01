'use client';

import { useState, useEffect } from 'react';
import {
  X, Package, Loader2, Plus, Trash2, ToggleLeft, ToggleRight,
  Info, Tag, DollarSign, Boxes, Sliders, ChevronDown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';

const TABS = [
  { id: 'info',       label: 'Info Dasar',      icon: Info },
  { id: 'pricing',    label: 'Harga & Stok',    icon: DollarSign },
  { id: 'variants',   label: 'Varian',           icon: Boxes },
  { id: 'units',      label: 'Satuan',           icon: Package },
  { id: 'modifiers',  label: 'Modifier',         icon: Sliders },
];

const emptyVariant = () => ({ _key: Math.random().toString(36).slice(2), name: '', priceAdj: '', sku: '' });
const emptyUnit    = () => ({ _key: Math.random().toString(36).slice(2), name: '', conversionRate: '', price: '' });

export default function ProductModal({ isOpen, onClose, product, categories, modifierGroups, onSuccess }) {
  const isEdit = Boolean(product?.id);
  const [activeTab, setActiveTab] = useState('info');
  const [loading, setLoading] = useState(false);

  // Tab 1 – Info Dasar
  const [name, setName]               = useState('');
  const [categoryId, setCategoryId]   = useState('');
  const [sku, setSku]                 = useState('');
  const [barcode, setBarcode]         = useState('');
  const [description, setDescription] = useState('');
  const [isService, setIsService]     = useState(false);
  const [trackStock, setTrackStock]   = useState(true);

  // Tab 2 – Harga & Stok
  const [basePrice, setBasePrice]     = useState('');
  const [cogs, setCogs]               = useState('');
  const [initialStock, setInitialStock] = useState('0');
  const [minStock, setMinStock]       = useState('5');

  // Tab 3 – Varian
  const [variants, setVariants]       = useState([]);

  // Tab 4 – Satuan
  const [unitPrices, setUnitPrices]   = useState([]);

  // Tab 5 – Modifiers
  const [selectedModifiers, setSelectedModifiers] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setActiveTab('info');
      if (product) {
        setName(product.name || '');
        setCategoryId(product.categoryId || '');
        setSku(product.sku || '');
        setBarcode(product.barcode || '');
        setDescription(product.description || '');
        setIsService(product.isService || false);
        setTrackStock(product.isService ? false : (product.trackStock ?? true));
        setBasePrice(product.basePrice?.toString() || '');
        setCogs(product.cogs?.toString() || '');
        setInitialStock('0');
        setMinStock(product.stocks?.[0]?.minStock?.toString() || '5');
        setVariants(
          product.variants?.map((v) => ({
            _key: v.id,
            id: v.id,
            name: v.name || '',
            priceAdj: v.priceAdj?.toString() || '0',
            sku: v.sku || '',
          })) || []
        );
        setUnitPrices(
          product.unitPrices?.map((u) => ({
            _key: u.id,
            id: u.id,
            name: u.name || '',
            conversionRate: u.conversionRate?.toString() || '',
            price: u.price?.toString() || '',
          })) || []
        );
        setSelectedModifiers(
          product.modifierGroups?.map((mg) => mg.modifierGroupId || mg.modifierGroup?.id) || []
        );
      } else {
        setName(''); setCategoryId(''); setSku(''); setBarcode(''); setDescription('');
        setIsService(false); setTrackStock(true); setBasePrice(''); setCogs('');
        setInitialStock('0'); setMinStock('5'); setVariants([]); setUnitPrices([]);
        setSelectedModifiers([]);
      }
    }
  }, [isOpen, product]);

  const toggleModifier = (id) => {
    setSelectedModifiers((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setActiveTab('info');
      toast.error('Nama produk wajib diisi.');
      return;
    }
    const payload = {
      name: name.trim(),
      categoryId: categoryId || null,
      sku: sku.trim() || null,
      barcode: barcode.trim() || null,
      description: description.trim() || null,
      isService,
      trackStock: isService ? false : trackStock,
      basePrice: parseInt(basePrice, 10) || 0,
      cogs: parseInt(cogs, 10) || 0,
      initialStock: parseFloat(initialStock) || 0,
      minStock: parseInt(minStock, 10) || 5,
      variants: variants
        .filter((v) => v.name.trim())
        .map((v) => ({
          ...(v.id ? { id: v.id } : {}),
          name: v.name.trim(),
          priceAdj: parseInt(v.priceAdj, 10) || 0,
          sku: v.sku.trim() || null,
        })),
      unitPrices: unitPrices
        .filter((u) => u.name.trim() && u.conversionRate)
        .map((u) => ({
          ...(u.id ? { id: u.id } : {}),
          name: u.name.trim(),
          conversionRate: parseInt(u.conversionRate, 10) || 1,
          price: parseInt(u.price, 10) || 0,
        })),
      modifierGroupIds: selectedModifiers,
    };

    setLoading(true);
    try {
      if (isEdit) {
        await api.put(`/products/${product.id}`, payload);
        toast.success('Produk berhasil diperbarui!');
      } else {
        await api.post('/products', payload);
        toast.success('Produk baru berhasil ditambahkan!');
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan produk.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-2xl bg-white/92 backdrop-blur-xl border border-white/60 rounded-2xl shadow-2xl mb-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white/92 backdrop-blur-xl rounded-t-2xl z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Package className="w-4 h-4 text-amber-600" />
            </div>
            <h2 className="text-base font-bold text-slate-800">
              {isEdit ? 'Edit Produk' : 'Tambah Produk Baru'}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 px-6 pt-4 border-b border-slate-100 overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-t-xl text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${
                  isActive
                    ? 'border-amber-500 text-amber-700 bg-amber-50/60'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 min-h-72">

            {/* ── TAB 1: Info Dasar ── */}
            {activeTab === 'info' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Nama Produk <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nama produk atau menu..."
                    autoFocus
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white/70 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    <Tag className="w-3.5 h-3.5 inline mr-1" /> Kategori
                  </label>
                  <div className="relative">
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full px-3.5 py-2.5 pr-9 rounded-xl border border-slate-200 bg-white/70 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition appearance-none"
                    >
                      <option value="">-- Tanpa Kategori --</option>
                      {(categories || []).map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">SKU</label>
                    <input type="text" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="SKU-001" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white/70 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Barcode</label>
                    <input type="text" value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="8991234567890" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white/70 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Deskripsi</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Deskripsi singkat produk (opsional)..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white/70 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => { setIsService((v) => !v); if (!isService) setTrackStock(false); }}
                    className={`flex items-center justify-between gap-2 px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
                      isService ? 'bg-cyan-50 border-cyan-300 text-cyan-700' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    <span>Layanan / Jasa</span>
                    {isService ? <ToggleRight className="w-5 h-5 text-cyan-600" /> : <ToggleLeft className="w-5 h-5 text-slate-400" />}
                  </button>
                  <button
                    type="button"
                    disabled={isService}
                    onClick={() => setTrackStock((v) => !v)}
                    className={`flex items-center justify-between gap-2 px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
                      isService ? 'opacity-40 cursor-not-allowed bg-slate-50 border-slate-200 text-slate-400' :
                      trackStock ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    <span>Lacak Stok</span>
                    {trackStock && !isService ? <ToggleRight className="w-5 h-5 text-emerald-600" /> : <ToggleLeft className="w-5 h-5 text-slate-400" />}
                  </button>
                </div>
              </div>
            )}

            {/* ── TAB 2: Harga & Stok ── */}
            {activeTab === 'pricing' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Harga Jual (Rp) <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold pointer-events-none">Rp</span>
                      <input type="number" min="0" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} placeholder="0" className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-white/70 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Modal / HPP (Rp)</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold pointer-events-none">Rp</span>
                      <input type="number" min="0" value={cogs} onChange={(e) => setCogs(e.target.value)} placeholder="0" className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-white/70 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition" />
                    </div>
                    {basePrice && cogs && parseInt(basePrice) > 0 && (
                      <p className="mt-1 text-[11px] text-emerald-600 font-semibold">
                        Margin: Rp {(parseInt(basePrice || 0) - parseInt(cogs || 0)).toLocaleString('id-ID')}
                        {' '}({Math.round(((parseInt(basePrice || 0) - parseInt(cogs || 0)) / parseInt(basePrice || 1)) * 100)}%)
                      </p>
                    )}
                  </div>
                </div>

                {!isService && trackStock && (
                  <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/60">
                    <div>
                      <label className="block text-xs font-semibold text-emerald-700 mb-1.5">
                        {isEdit ? 'Penyesuaian Stok' : 'Stok Awal (Cabang Aktif)'}
                      </label>
                      <input type="number" min="0" step="0.001" value={initialStock} onChange={(e) => setInitialStock(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition" />
                      {isEdit && <p className="mt-1 text-[10px] text-slate-400">Gunakan QuickStock untuk sesuaikan stok</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-emerald-700 mb-1.5">Batas Peringatan Minimum</label>
                      <input type="number" min="0" value={minStock} onChange={(e) => setMinStock(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition" />
                    </div>
                  </div>
                )}

                {(isService || !trackStock) && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 text-center">
                    {isService ? '⚡ Produk jasa tidak memiliki stok fisik.' : '📦 Lacak stok dinonaktifkan untuk produk ini.'}
                  </div>
                )}
              </div>
            )}

            {/* ── TAB 3: Varian ── */}
            {activeTab === 'variants' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-500">
                  Gunakan varian untuk produk dengan ukuran, rasa, atau pilihan berbeda (misal: S/M/L, Hot/Iced).
                </p>
                {variants.map((v, idx) => (
                  <div key={v._key} className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 bg-slate-50/50">
                    <span className="text-[10px] font-bold text-slate-400 w-4 text-center shrink-0">{idx + 1}</span>
                    <input type="text" value={v.name} onChange={(e) => setVariants((prev) => prev.map((x) => x._key === v._key ? { ...x, name: e.target.value } : x))} placeholder="Nama varian (Large, Iced...)" className="flex-1 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 transition" />
                    <div className="relative w-28 shrink-0">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-bold pointer-events-none">±Rp</span>
                      <input type="number" value={v.priceAdj} onChange={(e) => setVariants((prev) => prev.map((x) => x._key === v._key ? { ...x, priceAdj: e.target.value } : x))} placeholder="0" className="w-full pl-8 pr-2 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 transition" />
                    </div>
                    <input type="text" value={v.sku} onChange={(e) => setVariants((prev) => prev.map((x) => x._key === v._key ? { ...x, sku: e.target.value } : x))} placeholder="SKU varian" className="w-24 px-2.5 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 transition shrink-0" />
                    <button type="button" onClick={() => setVariants((prev) => prev.filter((x) => x._key !== v._key))} className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={() => setVariants((prev) => [...prev, emptyVariant()])} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-slate-200 hover:border-amber-400 text-xs font-semibold text-slate-400 hover:text-amber-600 transition-all">
                  <Plus className="w-3.5 h-3.5" /> Tambah Varian
                </button>
              </div>
            )}

            {/* ── TAB 4: Satuan ── */}
            {activeTab === 'units' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-500">
                  Satuan bertingkat memungkinkan penjualan dalam DUS, PACK, atau lusin dengan konversi otomatis.
                </p>
                {unitPrices.map((u, idx) => (
                  <div key={u._key} className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 bg-slate-50/50">
                    <span className="text-[10px] font-bold text-slate-400 w-4 text-center shrink-0">{idx + 1}</span>
                    <input type="text" value={u.name} onChange={(e) => setUnitPrices((prev) => prev.map((x) => x._key === u._key ? { ...x, name: e.target.value } : x))} placeholder="Nama satuan (DUS, PACK...)" className="flex-1 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 transition" />
                    <div className="relative w-24 shrink-0">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-bold pointer-events-none">×</span>
                      <input type="number" min="1" value={u.conversionRate} onChange={(e) => setUnitPrices((prev) => prev.map((x) => x._key === u._key ? { ...x, conversionRate: e.target.value } : x))} placeholder="Rasio" className="w-full pl-5 pr-2 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 transition" />
                    </div>
                    <div className="relative w-28 shrink-0">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-bold pointer-events-none">Rp</span>
                      <input type="number" min="0" value={u.price} onChange={(e) => setUnitPrices((prev) => prev.map((x) => x._key === u._key ? { ...x, price: e.target.value } : x))} placeholder="Harga" className="w-full pl-7 pr-2 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 transition" />
                    </div>
                    <button type="button" onClick={() => setUnitPrices((prev) => prev.filter((x) => x._key !== u._key))} className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={() => setUnitPrices((prev) => [...prev, emptyUnit()])} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-slate-200 hover:border-blue-400 text-xs font-semibold text-slate-400 hover:text-blue-600 transition-all">
                  <Plus className="w-3.5 h-3.5" /> Tambah Satuan
                </button>
              </div>
            )}

            {/* ── TAB 5: Modifier ── */}
            {activeTab === 'modifiers' && (
              <div className="space-y-2">
                <p className="text-xs text-slate-500 mb-3">
                  Pilih modifier group yang berlaku untuk produk ini. Modifier menentukan pilihan tambahan saat transaksi POS.
                </p>
                {(modifierGroups || []).length === 0 ? (
                  <div className="text-center py-10 text-slate-400">
                    <Sliders className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-xs">Belum ada modifier group. Buat dulu di tab Modifier.</p>
                  </div>
                ) : (
                  modifierGroups.map((mg) => {
                    const checked = selectedModifiers.includes(mg.id);
                    return (
                      <button
                        key={mg.id}
                        type="button"
                        onClick={() => toggleModifier(mg.id)}
                        className={`w-full flex items-center justify-between gap-3 p-3.5 rounded-xl border text-left transition-all ${
                          checked
                            ? 'bg-violet-50 border-violet-300 ring-1 ring-violet-400/30'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div>
                          <p className={`text-sm font-semibold ${checked ? 'text-violet-800' : 'text-slate-700'}`}>{mg.name}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {mg.options?.length || 0} opsi ·{' '}
                            {mg.isRequired && <span className="text-rose-500 font-medium">Wajib</span>}
                            {mg.isRequired && mg.isMultiple && ' · '}
                            {mg.isMultiple && <span className="text-blue-500 font-medium">Multi-pilih</span>}
                            {!mg.isRequired && !mg.isMultiple && <span className="text-slate-400">Opsional</span>}
                          </p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${checked ? 'bg-violet-600 border-violet-600' : 'border-slate-300'}`}>
                          {checked && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/60 rounded-b-2xl">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-white transition-colors">
              Batal
            </button>
            <div className="flex items-center gap-2">
              {activeTab !== 'info' && (
                <button
                  type="button"
                  onClick={() => {
                    const idx = TABS.findIndex((t) => t.id === activeTab);
                    if (idx > 0) setActiveTab(TABS[idx - 1].id);
                  }}
                  className="py-2.5 px-4 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-white transition-colors"
                >
                  ← Kembali
                </button>
              )}
              {activeTab !== 'modifiers' ? (
                <button
                  type="button"
                  onClick={() => {
                    const idx = TABS.findIndex((t) => t.id === activeTab);
                    if (idx < TABS.length - 1) setActiveTab(TABS[idx + 1].id);
                  }}
                  className="py-2.5 px-5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold transition-colors"
                >
                  Lanjut →
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="py-2.5 px-6 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-60"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {isEdit ? 'Simpan Perubahan' : 'Tambah Produk'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
