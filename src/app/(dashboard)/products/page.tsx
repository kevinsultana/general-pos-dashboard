'use client';

import React, { useEffect, useState } from 'react';
import {
  Plus,
  Search,
  Tag,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Layers,
  ChevronDown,
  ChevronRight,
  Package,
} from 'lucide-react';
import { Topbar } from '../../../components/Topbar';
import { Modal } from '../../../components/Modal';
import { useToast } from '../../../context/ToastContext';
import { api } from '../../../lib/api';
import { Product, Category } from '../../../types';
import { formatRupiah, formatNumber } from '../../../lib/formatters';

interface VariantFormItem {
  id?: string;
  name: string;
  sku: string;
  barcode: string;
  cost: string;
  sellingPrice: string;
  stock: string;
  lowStockThreshold: string;
  active: boolean;
}

const emptyProductForm = {
  name: '',
  categoryId: '',
  cost: '0',
  sellingPrice: '0',
  stock: '0',
  lowStockThreshold: '5',
  sku: '',
  barcode: '',
  active: true,
};

export default function ProductsPage() {
  const toast = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [expandedProductIds, setExpandedProductIds] = useState<Set<string>>(new Set());

  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form states
  const [productForm, setProductForm] = useState(emptyProductForm);
  const [hasVariants, setHasVariants] = useState(false);
  const [variants, setVariants] = useState<VariantFormItem[]>([]);
  const [categoryName, setCategoryName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [prodData, catData] = await Promise.all([
        api.getProducts(),
        api.getCategories(),
      ]);
      setProducts(prodData || []);
      setCategories(catData || []);
    } catch (err: any) {
      console.error('Failed to load products:', err);
      toast.error('Gagal memuat data produk & kategori');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setProductForm({
      ...emptyProductForm,
      categoryId: categories.length > 0 ? categories[0].id : '',
    });
    setHasVariants(false);
    setVariants([]);
    setIsProductModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setProductForm({
      name: p.name,
      categoryId: p.categoryId,
      cost: String(p.cost),
      sellingPrice: String(p.sellingPrice),
      stock: String(p.stock),
      lowStockThreshold: String(p.lowStockThreshold || 5),
      sku: p.sku || '',
      barcode: p.barcode || '',
      active: p.active,
    });

    if (p.variants && p.variants.length > 0) {
      setHasVariants(true);
      setVariants(
        p.variants.map((v) => ({
          id: v.id,
          name: v.name,
          sku: v.sku || '',
          barcode: v.barcode || '',
          cost: String(v.cost),
          sellingPrice: String(v.sellingPrice),
          stock: String(v.stock),
          lowStockThreshold: String(v.lowStockThreshold || 5),
          active: v.active,
        }))
      );
    } else {
      setHasVariants(false);
      setVariants([]);
    }

    setIsProductModalOpen(true);
  };

  const handleAddVariantRow = () => {
    setVariants((prev) => [
      ...prev,
      {
        name: '',
        sku: '',
        barcode: '',
        cost: productForm.cost || '0',
        sellingPrice: productForm.sellingPrice || '0',
        stock: '0',
        lowStockThreshold: '5',
        active: true,
      },
    ]);
  };

  const handleRemoveVariantRow = (index: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleVariantChange = (
    index: number,
    field: keyof VariantFormItem,
    value: any
  ) => {
    setVariants((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name.trim()) {
      toast.warning('Nama produk wajib diisi');
      return;
    }
    if (!productForm.categoryId) {
      toast.warning('Pilih kategori produk terlebih dahulu');
      return;
    }

    if (hasVariants && variants.length === 0) {
      toast.warning('Tambahkan minimal satu varian atau matikan opsi varian');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        name: productForm.name.trim(),
        categoryId: productForm.categoryId,
        cost: parseFloat(productForm.cost) || 0,
        sellingPrice: parseFloat(productForm.sellingPrice) || 0,
        stock: parseFloat(productForm.stock) || 0,
        lowStockThreshold: parseFloat(productForm.lowStockThreshold) || 0,
        sku: productForm.sku.trim() || undefined,
        barcode: productForm.barcode.trim() || undefined,
        active: productForm.active,
      };

      if (hasVariants && variants.length > 0) {
        payload.variants = variants
          .filter((v) => v.name.trim() !== '')
          .map((v) => ({
            ...(v.id ? { id: v.id } : {}),
            name: v.name.trim(),
            sku: v.sku.trim() || undefined,
            barcode: v.barcode.trim() || undefined,
            cost: parseFloat(v.cost) || 0,
            sellingPrice: parseFloat(v.sellingPrice) || 0,
            stock: parseFloat(v.stock) || 0,
            lowStockThreshold: parseFloat(v.lowStockThreshold) || 0,
            active: v.active,
          }));
      }

      if (editingProduct) {
        await api.updateProduct(editingProduct.id, payload);
        toast.success(`Produk "${productForm.name}" berhasil diperbarui!`);
      } else {
        await api.createProduct(payload);
        toast.success(`Produk "${productForm.name}" berhasil ditambahkan!`);
      }

      setIsProductModalOpen(false);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan data produk');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) return;
    try {
      await api.createCategory({ name: categoryName.trim() });
      toast.success(`Kategori "${categoryName.trim()}" berhasil dibuat!`);
      setIsAddCategoryOpen(false);
      setCategoryName('');
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menambahkan kategori');
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Hapus produk "${name}"? Tindakan ini tidak dapat dibatalkan.`)) return;
    try {
      await api.deleteProduct(id);
      toast.success(`Produk "${name}" berhasil dihapus`);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus produk');
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(search.toLowerCase())) ||
      (p.barcode && p.barcode.toLowerCase().includes(search.toLowerCase())) ||
      (p.variants && p.variants.some((v) => v.name.toLowerCase().includes(search.toLowerCase())));
    const matchesCategory = selectedCategory ? p.categoryId === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Topbar
        title="Katalog Produk & Varian"
        description="Kelola master barang dagang, variasi rasa/ukuran, penetapan harga jual, dan kategori menu"
      />

      <main className="p-6 space-y-6 flex-1">
        {/* Action Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Cari nama produk, SKU, barcode, atau varian..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pos-input pl-9 pr-4 py-2"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="pos-select px-3 py-2"
            >
              <option value="">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsAddCategoryOpen(true)}
              className="pos-btn-secondary"
            >
              <Tag className="w-3.5 h-3.5 text-indigo-400" />
              <span>Tambah Kategori</span>
            </button>
            <button
              onClick={openCreateModal}
              className="pos-btn-primary"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Produk</span>
            </button>
          </div>
        </div>

        {/* Product Table */}
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400">
                  <th className="py-3.5 px-4 font-semibold w-8"></th>
                  <th className="py-3.5 px-4 font-semibold">Nama Produk</th>
                  <th className="py-3.5 px-4 font-semibold">Kategori</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Harga Modal (HPP)</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Harga Jual</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Stok</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      Memuat daftar produk...
                    </td>
                  </tr>
                ) : filteredProducts.length > 0 ? (
                  filteredProducts.map((p) => {
                    const hasVars = p.variants && p.variants.length > 0;
                    const isExpanded = expandedProductIds.has(p.id);

                    return (
                      <React.Fragment key={p.id}>
                        <tr className="hover:bg-slate-800/30 transition group">
                          <td className="py-3.5 px-4 text-center">
                            {hasVars ? (
                              <button
                                onClick={() => toggleExpand(p.id)}
                                className="p-1 rounded text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition"
                                title={isExpanded ? 'Tutup rincian varian' : 'Lihat rincian varian'}
                              >
                                {isExpanded ? (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronRight className="w-3.5 h-3.5" />
                                )}
                              </button>
                            ) : null}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-100">{p.name}</span>
                              {hasVars && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[10px] font-medium">
                                  <Layers className="w-2.5 h-2.5" />
                                  {p.variants?.length} Varian
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-0.5 text-[10px] text-slate-400 font-mono">
                              {p.sku && <span>SKU: {p.sku}</span>}
                              {p.barcode && <span>Barcode: {p.barcode}</span>}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[11px] font-medium">
                              {p.category?.name || 'Umum'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-slate-400">
                            {formatRupiah(p.cost)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-semibold text-emerald-400">
                            {formatRupiah(p.sellingPrice)}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`font-mono font-semibold px-2 py-0.5 rounded-full text-[11px] ${
                                p.stock <= p.lowStockThreshold
                                  ? 'bg-rose-500/15 text-rose-400 border border-rose-500/25'
                                  : 'text-slate-200'
                              }`}
                            >
                              {formatNumber(p.stock)}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {p.active ? (
                              <span className="inline-flex items-center space-x-1 text-emerald-400 text-[11px]">
                                <CheckCircle className="w-3 h-3" />
                                <span>Aktif</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1 text-slate-500 text-[11px]">
                                <XCircle className="w-3 h-3" />
                                <span>Non-aktif</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end space-x-1">
                              <button
                                onClick={() => openEditModal(p)}
                                className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition"
                                title="Edit Produk & Varian"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(p.id, p.name)}
                                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                                title="Hapus Produk"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expandable Variant Sub-Table */}
                        {hasVars && isExpanded && (
                          <tr className="bg-slate-900/40">
                            <td colSpan={8} className="py-2.5 px-6">
                              <div className="pl-6 border-l-2 border-indigo-500/50 space-y-2 py-1">
                                <div className="text-[11px] font-semibold text-indigo-300 flex items-center gap-1.5">
                                  <Layers className="w-3.5 h-3.5" />
                                  <span>Daftar Varian Produk ({p.variants?.length})</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                  {p.variants?.map((v) => (
                                    <div
                                      key={v.id}
                                      className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] flex justify-between items-start"
                                    >
                                      <div>
                                        <div className="font-semibold text-slate-200">{v.name}</div>
                                        {v.sku && (
                                          <div className="text-[10px] text-slate-400 font-mono">
                                            SKU: {v.sku}
                                          </div>
                                        )}
                                        {v.barcode && (
                                          <div className="text-[10px] text-slate-400 font-mono">
                                            Barcode: {v.barcode}
                                          </div>
                                        )}
                                        <div className="text-[10px] text-slate-400 mt-1">
                                          HPP: {formatRupiah(v.cost)}
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className="font-semibold text-emerald-400 font-mono">
                                          {formatRupiah(v.sellingPrice)}
                                        </div>
                                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                          Stok: <span className="text-slate-200">{v.stock}</span>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      Tidak ada produk ditemukan
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal Add / Edit Product */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title={editingProduct ? `Edit Produk: ${editingProduct.name}` : 'Tambah Produk Baru'}
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleSaveProduct} className="space-y-4">
          {/* Base Product Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Nama Produk <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                className="pos-input px-3 py-2"
                placeholder="Contoh: Kopi Susu Aren"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Kategori <span className="text-rose-400">*</span>
              </label>
              <select
                required
                value={productForm.categoryId}
                onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                className="pos-select px-3 py-2"
              >
                <option value="">Pilih Kategori...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Harga Modal (HPP Master)
              </label>
              <input
                type="number"
                min="0"
                required
                value={productForm.cost}
                onChange={(e) => setProductForm({ ...productForm, cost: e.target.value })}
                className="pos-input px-3 py-2 font-mono"
                placeholder="10000"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Harga Jual (Master) <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                min="0"
                required
                value={productForm.sellingPrice}
                onChange={(e) => setProductForm({ ...productForm, sellingPrice: e.target.value })}
                className="pos-input px-3 py-2 font-mono"
                placeholder="18000"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Stok Awal Master
              </label>
              <input
                type="number"
                min="0"
                value={productForm.stock}
                onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                className="pos-input px-3 py-2 font-mono"
                placeholder="20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">SKU Master</label>
              <input
                type="text"
                value={productForm.sku}
                onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                className="pos-input px-3 py-2 font-mono"
                placeholder="KOPI-01"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Barcode</label>
              <input
                type="text"
                value={productForm.barcode}
                onChange={(e) => setProductForm({ ...productForm, barcode: e.target.value })}
                className="pos-input px-3 py-2 font-mono"
                placeholder="89912345678"
              />
            </div>
          </div>

          {/* Toggle Variants */}
          <div className="pt-2 border-t border-slate-800">
            <label className="flex items-center space-x-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={hasVariants}
                onChange={(e) => {
                  setHasVariants(e.target.checked);
                  if (e.target.checked && variants.length === 0) {
                    handleAddVariantRow();
                  }
                }}
                className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700 focus:ring-0 focus:ring-offset-0"
              />
              <div>
                <span className="text-xs font-semibold text-slate-200">
                  Produk Memiliki Varian (Ukuran / Rasa / Opsi Khusus)
                </span>
                <p className="text-[11px] text-slate-400">
                  Aktifkan untuk menambahkan opsi varian seperti Regular, Large, Panas, Dingin dengan harga & stok tersendiri.
                </p>
              </div>
            </label>
          </div>

          {/* Variant Repeater */}
          {hasVariants && (
            <div className="space-y-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Daftar Varian Produk ({variants.length})</span>
                </h4>
                <button
                  type="button"
                  onClick={handleAddVariantRow}
                  className="flex items-center space-x-1 px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 rounded-lg text-xs font-medium transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Baris Varian</span>
                </button>
              </div>

              {variants.length === 0 ? (
                <div className="text-center py-4 text-xs text-slate-500">
                  Belum ada varian ditambahkan. Klik &quot;Tambah Baris Varian&quot; di atas.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {variants.map((v, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-400">
                          Varian #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveVariantRow(idx)}
                          className="text-slate-500 hover:text-rose-400 p-1 transition"
                          title="Hapus baris varian"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-0.5">
                            Nama Varian <span className="text-rose-400">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={v.name}
                            onChange={(e) => handleVariantChange(idx, 'name', e.target.value)}
                            placeholder="Contoh: Cup Large / Dingin"
                            className="pos-input px-2.5 py-1.5"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-0.5">
                            SKU Varian
                          </label>
                          <input
                            type="text"
                            value={v.sku}
                            onChange={(e) => handleVariantChange(idx, 'sku', e.target.value)}
                            placeholder="KOP-LG"
                            className="pos-input px-2.5 py-1.5 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-0.5">
                            Barcode Varian
                          </label>
                          <input
                            type="text"
                            value={v.barcode}
                            onChange={(e) => handleVariantChange(idx, 'barcode', e.target.value)}
                            placeholder="899112233"
                            className="pos-input px-2.5 py-1.5 font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-0.5">
                            HPP Modal
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={v.cost}
                            onChange={(e) => handleVariantChange(idx, 'cost', e.target.value)}
                            className="pos-input px-2.5 py-1.5 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-0.5">
                            Harga Jual <span className="text-rose-400">*</span>
                          </label>
                          <input
                            type="number"
                            min="0"
                            required
                            value={v.sellingPrice}
                            onChange={(e) => handleVariantChange(idx, 'sellingPrice', e.target.value)}
                            className="pos-input px-2.5 py-1.5 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-0.5">
                            Stok Varian
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={v.stock}
                            onChange={(e) => handleVariantChange(idx, 'stock', e.target.value)}
                            className="pos-input px-2.5 py-1.5 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-0.5">
                            Batas Stok Tipis
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={v.lowStockThreshold}
                            onChange={(e) => handleVariantChange(idx, 'lowStockThreshold', e.target.value)}
                            className="pos-input px-2.5 py-1.5 font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsProductModalOpen(false)}
              className="pos-btn-secondary"
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="pos-btn-primary disabled:opacity-50"
            >
              {isSubmitting
                ? 'Menyimpan...'
                : editingProduct
                  ? 'Perbarui Produk'
                  : 'Simpan Produk'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Add Category */}
      <Modal
        isOpen={isAddCategoryOpen}
        onClose={() => setIsAddCategoryOpen(false)}
        title="Tambah Kategori Menu"
      >
        <form onSubmit={handleCreateCategory} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Nama Kategori <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              className="pos-input px-3 py-2"
              placeholder="Contoh: Minuman Dingin"
            />
          </div>
          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddCategoryOpen(false)}
              className="pos-btn-secondary"
            >
              Batal
            </button>
            <button
              type="submit"
              className="pos-btn-primary"
            >
              Simpan Kategori
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
