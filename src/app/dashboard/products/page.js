"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  X,
  ChevronDown,
  ChevronUp,
  Tag,
  ToggleLeft,
  ToggleRight,
  Search,
  AlertCircle,
  ShoppingBag,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../../contexts/AuthContext";
import api from "../../../lib/api";
import { showConfirmDialog } from "../../../lib/alerts";
import UnauthorizedState from "../../../components/common/UnauthorizedState";

// ─── Formatter ────────────────────────────────────────────────────────────────
const fmt = (n) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(n) || 0);

const formatRibuan = (val) => {
  if (val === undefined || val === null || val === "") return "";
  const clean = String(val).replace(/\D/g, "");
  if (!clean) return "";
  return new Intl.NumberFormat("id-ID").format(Number(clean));
};

const cleanInitialPrice = (val) => {
  if (val === undefined || val === null || val === "") return "";
  const num = Math.round(Number(val));
  return isNaN(num) ? "" : String(num);
};

// ─── Komponen Baris Varian di Tabel ──────────────────────────────────────────
function VariantBadge({ variant }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 font-semibold">
        {variant.name}
      </span>
      <span className="text-slate-400">Modal: {fmt(variant.costPrice)}</span>
      <span className="font-bold text-emerald-700">{fmt(variant.price)}</span>
    </div>
  );
}

// ─── Form Varian Dinamis ──────────────────────────────────────────────────────
function VariantRow({ variant, index, onChange, onRemove, canRemove }) {
  return (
    <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-200">
      <div className="flex-1 min-w-0">
        <input
          type="text"
          placeholder="Nama Varian (cth: Kecil)"
          value={variant.name}
          onChange={(e) => onChange(index, "name", e.target.value)}
          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 focus:border-amber-400 focus:bg-white text-xs font-semibold text-slate-900 outline-none transition-all"
          required
        />
      </div>
      <div className="w-28">
        <input
          type="text"
          inputMode="numeric"
          placeholder="Modal"
          value={formatRibuan(variant.costPrice)}
          onChange={(e) => onChange(index, "costPrice", e.target.value.replace(/\D/g, ""))}
          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 focus:border-amber-400 text-xs font-semibold text-slate-900 outline-none transition-all"
        />
      </div>
      <div className="w-28">
        <input
          type="text"
          inputMode="numeric"
          placeholder="Harga Jual"
          value={formatRibuan(variant.price)}
          onChange={(e) => onChange(index, "price", e.target.value.replace(/\D/g, ""))}
          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 focus:border-amber-400 text-xs font-semibold text-slate-900 outline-none transition-all"
        />
      </div>
      <button
        type="button"
        onClick={() => onRemove(index)}
        disabled={!canRemove}
        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── Modal Tambah / Edit Produk ───────────────────────────────────────────────
function ProductModal({ onClose, onSuccess, editProduct }) {
  const isEdit = !!editProduct;

  const [name, setName] = useState(editProduct?.name || "");
  const [description, setDescription] = useState(editProduct?.description || "");
  const [isActive, setIsActive] = useState(
    editProduct ? editProduct.isActive !== false : true
  );
  const [hasVariants, setHasVariants] = useState(
    editProduct
      ? editProduct.variants?.length > 1 ||
        (editProduct.variants?.[0]?.name && editProduct.variants?.[0]?.name !== "Regular")
      : false
  );
  const [singleCostPrice, setSingleCostPrice] = useState(
    cleanInitialPrice(editProduct?.variants?.[0]?.costPrice)
  );
  const [singlePrice, setSinglePrice] = useState(
    cleanInitialPrice(editProduct?.variants?.[0]?.price)
  );
  const [variants, setVariants] = useState(
    editProduct?.variants?.length > 0
      ? editProduct.variants.map((v) => ({
          id: v.id,
          name: v.name,
          costPrice: cleanInitialPrice(v.costPrice),
          price: cleanInitialPrice(v.price),
        }))
      : [{ name: "", costPrice: "", price: "" }]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleVariantChange = (idx, field, val) => {
    setVariants((prev) => prev.map((v, i) => (i === idx ? { ...v, [field]: val } : v)));
  };

  const addVariant = () => {
    setVariants((prev) => [...prev, { name: "", costPrice: "", price: "" }]);
  };

  const removeVariant = (idx) => {
    setVariants((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Nama produk wajib diisi.");

    const payload = {
      name: name.trim(),
      description: description.trim(),
      isActive,
    };

    if (hasVariants) {
      const filled = variants.filter((v) => v.name.trim());
      if (filled.length === 0) return toast.error("Minimal 1 varian wajib diisi.");
      payload.variants = filled.map((v) => ({
        id: v.id || undefined,
        name: v.name.trim(),
        costPrice: parseFloat(v.costPrice) || 0,
        price: parseFloat(v.price) || 0,
      }));
    } else {
      // Kirim harga single di root payload — backend akan buat/update varian "Regular"
      payload.variants = [];
      payload.costPrice = parseFloat(singleCostPrice) || 0;
      payload.price = parseFloat(singlePrice) || 0;
    }

    try {
      setIsSubmitting(true);
      if (isEdit) {
        await api.put(`/products/${editProduct.id}`, payload);
      } else {
        await api.post("/products", payload);
      }
      toast.success(isEdit ? "Produk dan harga berhasil diperbarui." : "Produk berhasil ditambahkan.");
      onSuccess();
    } catch (err) {
      toast.error(err.message || "Gagal menyimpan produk.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl bg-white/95 backdrop-blur-2xl border border-white/90 shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                {isEdit ? "Edit Produk" : "Tambah Produk Baru"}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isEdit ? `Mengubah "${editProduct.name}"` : "Daftarkan produk ke katalog toko"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {/* Nama */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Nama Produk <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Kopi Susu Kekinian"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-400 text-xs font-semibold text-slate-900 outline-none transition-all"
              required
            />
          </div>

          {/* Deskripsi */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Deskripsi
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Deskripsi singkat produk (opsional)"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-400 text-xs font-semibold text-slate-900 outline-none transition-all resize-none"
            />
          </div>

          {/* Toggle Ketersediaan Stok */}
          <div
            className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer select-none transition-all hover:bg-slate-100/70"
            onClick={() => setIsActive((v) => !v)}
          >
            <div>
              <p className="text-xs font-bold text-slate-800">Status Ketersediaan Stok</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {isActive
                  ? "Tersedia — produk dapat dipesan di POS kasir dan menu self-order"
                  : "Habis — produk ditandai habis stok dan tidak dapat dipesan"}
              </p>
            </div>
            {isActive ? (
              <div className="flex items-center gap-1.5 text-emerald-600 font-extrabold text-xs">
                <span>Tersedia</span>
                <ToggleRight className="w-8 h-8 text-emerald-500 shrink-0" />
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-rose-500 font-extrabold text-xs">
                <span>Habis</span>
                <ToggleLeft className="w-8 h-8 text-rose-400 shrink-0" />
              </div>
            )}
          </div>

          {/* Toggle Varian */}
          <div
            className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer select-none transition-all hover:bg-slate-100/70"
            onClick={() => setHasVariants((v) => !v)}
          >
            <div>
              <p className="text-xs font-bold text-slate-800">Produk memiliki banyak varian?</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {hasVariants
                  ? "Aktif — atur nama, modal & harga jual tiap varian di bawah"
                  : "Nonaktif — hanya 1 harga (varian \"Regular\" dibuat/diupdate otomatis)"}
              </p>
            </div>
            {hasVariants ? (
              <ToggleRight className="w-8 h-8 text-amber-500 shrink-0" />
            ) : (
              <ToggleLeft className="w-8 h-8 text-slate-300 shrink-0" />
            )}
          </div>

          {/* Input Harga Tunggal */}
          {!hasVariants && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Harga Modal (Rp)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatRibuan(singleCostPrice)}
                  onChange={(e) => setSingleCostPrice(e.target.value.replace(/\D/g, ""))}
                  placeholder="0"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-400 text-xs font-semibold text-slate-900 outline-none transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Harga Jual (Rp) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatRibuan(singlePrice)}
                  onChange={(e) => setSinglePrice(e.target.value.replace(/\D/g, ""))}
                  placeholder="0"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-400 text-xs font-semibold text-slate-900 outline-none transition-all"
                  required
                />
              </div>
            </div>
          )}

          {/* Input Varian Dinamis */}
          {hasVariants && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Daftar Varian
                </p>
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                  <span className="w-28 text-center">Modal (Rp)</span>
                  <span className="w-28 text-center">Jual (Rp)</span>
                  <span className="w-7" />
                </div>
              </div>

              <div className="space-y-2">
                {variants.map((v, idx) => (
                  <VariantRow
                    key={v.id || idx}
                    variant={v}
                    index={idx}
                    onChange={handleVariantChange}
                    onRemove={removeVariant}
                    canRemove={variants.length > 1}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={addVariant}
                className="w-full py-2.5 rounded-2xl border-2 border-dashed border-slate-200 text-xs font-bold text-slate-500 hover:border-amber-400 hover:text-amber-600 hover:bg-amber-50/50 transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Varian
              </button>
            </div>
          )}

          {/* Catatan Snapshot Transaksi */}
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/70 flex items-start gap-2.5 text-[11px] text-amber-900 leading-relaxed">
            <span className="text-sm shrink-0">💡</span>
            <span>
              <strong>Snapshot Transaksi:</strong> Perubahan harga modal & jual hanya berlaku untuk penjualan baru. Riwayat transaksi masa lalu tetap aman tersimpan dengan harga aslinya saat transaksi terjadi.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="py-2.5 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-md shadow-slate-900/15 flex items-center gap-2 transition-all active:scale-98 disabled:opacity-60"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>{isEdit ? "Simpan Perubahan" : "Tambah Produk"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Halaman Utama ─────────────────────────────────────────────────────────────
export default function ProductsPage() {
  const { user, hasPermission, activeBranchId } = useAuth();

  const canView = user?.isOwner || hasPermission("inventory:view");
  const canManage = user?.isOwner || hasPermission("inventory:manage");

  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);

  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/products");
      if (res?.success) setProducts(res.data);
    } catch (err) {
      toast.error(err.message || "Gagal memuat daftar produk.");
    } finally {
      setIsLoading(false);
    }
  }, [activeBranchId]);

  useEffect(() => {
    if (canView) fetchProducts();
  }, [canView, fetchProducts]);

  const handleDelete = async (product) => {
    const confirm = await showConfirmDialog({
      title: "Hapus Produk?",
      text: `Produk "${product.name}" dan semua variannya akan dihapus. Transaksi lama tetap tersimpan.`,
      confirmButtonText: "Ya, Hapus",
      icon: "warning",
    });
    if (!confirm.isConfirmed) return;

    const id = toast.loading("Menghapus produk...");
    try {
      await api.delete(`/products/${product.id}`);
      toast.dismiss(id);
      toast.success("Produk berhasil dihapus.");
      fetchProducts();
    } catch (err) {
      toast.dismiss(id);
      toast.error(err.message || "Gagal menghapus produk.");
    }
  };

  const handleToggleActive = async (product) => {
    if (!canManage) return;
    const newActiveState = product.isActive === false ? true : false;

    // Optimistic UI update
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, isActive: newActiveState } : p))
    );

    try {
      await api.put(`/products/${product.id}`, { isActive: newActiveState });
      if (newActiveState) {
        toast.success(`Stok "${product.name}" sekarang Tersedia.`);
      } else {
        toast.success(`Stok "${product.name}" ditandai Habis.`);
      }
    } catch (err) {
      // Revert jika gagal
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, isActive: !newActiveState } : p))
      );
      toast.error(err.message || "Gagal mengubah status ketersediaan.");
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  if (!canView && user) return <UnauthorizedState requiredPermission="inventory:view" />;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-400/40 text-amber-800 text-xs font-extrabold tracking-wide uppercase">
            <Package className="w-3.5 h-3.5 text-amber-600" />
            <span>Katalog Produk</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Manajemen Produk
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-lg">
            Kelola katalog produk dan varian harga yang tersedia di kasir.
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={() => { setEditProduct(null); setIsModalOpen(true); }}
            className="py-3 px-5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-md shadow-slate-900/15 flex items-center gap-2 transition-all active:scale-98 shrink-0"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Tambah Produk</span>
          </button>
        )}
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama produk..."
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/80 backdrop-blur-xl border border-white/90 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-300 transition-all shadow-sm"
        />
      </div>

      {/* Tabel Produk */}
      <div className="rounded-3xl bg-white/80 backdrop-blur-xl border border-white/90 shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] overflow-hidden">
        {/* Header tabel */}
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-6 py-3 border-b border-slate-100 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
          <span>Produk</span>
          <span className="text-center w-28">Status Stok</span>
          <span className="text-right w-24">Varian</span>
          <span className="text-right w-32">Harga Jual</span>
          {canManage && <span className="w-16 text-right">Aksi</span>}
        </div>

        {/* Loading skeleton */}
        {isLoading && (
          <div className="divide-y divide-slate-50">
            {[1, 2, 3].map((n) => (
              <div key={n} className="px-6 py-4 animate-pulse flex items-center gap-4">
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-slate-200 rounded-lg w-1/3" />
                  <div className="h-3 bg-slate-100 rounded-lg w-1/2" />
                </div>
                <div className="h-6 bg-slate-100 rounded-full w-24" />
                <div className="h-3 bg-slate-100 rounded-lg w-16" />
                <div className="h-3 bg-slate-100 rounded-lg w-20" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && filteredProducts.length === 0 && (
          <div className="py-16 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center">
              <Package className="w-8 h-8 text-slate-300" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700">
                {search ? "Produk tidak ditemukan" : "Belum ada produk"}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {search
                  ? `Tidak ada hasil untuk "${search}"`
                  : "Mulai tambahkan produk ke katalog toko Anda"}
              </p>
            </div>
          </div>
        )}

        {/* Baris Produk */}
        {!isLoading && (
          <div className="divide-y divide-slate-50/80">
            {filteredProducts.map((product) => {
              const isExpanded = expandedId === product.id;
              const firstVariant = product.variants?.[0];
              const variantCount = product.variants?.length || 0;
              const isOutOfStock = product.isActive === false;

              return (
                <div key={product.id}>
                  {/* Baris utama */}
                  <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-6 py-4 items-center hover:bg-slate-50/50 transition-colors">
                    {/* Nama & deskripsi */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p
                          className={`text-sm font-bold truncate ${
                            isOutOfStock ? "text-slate-500" : "text-slate-900"
                          }`}
                        >
                          {product.name}
                        </p>
                        {isOutOfStock && (
                          <span className="px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-700 text-[10px] font-black border border-rose-200 shrink-0">
                            HABIS
                          </span>
                        )}
                        {variantCount > 1 && (
                          <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200 shrink-0">
                            {variantCount} varian
                          </span>
                        )}
                      </div>
                      {product.description && (
                        <p className="text-xs text-slate-400 truncate mt-0.5">{product.description}</p>
                      )}
                    </div>

                    {/* Status Stok Toggle On/Off */}
                    <div className="w-28 flex items-center justify-center">
                      <button
                        type="button"
                        disabled={!canManage}
                        onClick={() => handleToggleActive(product)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold transition-all border shadow-2xs ${
                          !isOutOfStock
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200/80 hover:bg-emerald-100 hover:border-emerald-300"
                            : "bg-rose-50 text-rose-700 border-rose-200/80 hover:bg-rose-100 hover:border-rose-300"
                        } ${!canManage ? "opacity-75 cursor-default" : "cursor-pointer active:scale-95"}`}
                        title={
                          !isOutOfStock
                            ? "Klik untuk menandai produk Habis"
                            : "Klik untuk menandai produk Tersedia"
                        }
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            !isOutOfStock ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                          }`}
                        />
                        <span>{!isOutOfStock ? "Tersedia" : "Habis"}</span>
                      </button>
                    </div>

                    {/* Jumlah varian */}
                    <div className="w-24 text-right">
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : product.id)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-amber-600 transition-colors"
                      >
                        <Tag className="w-3.5 h-3.5" />
                        <span>{variantCount}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                      </button>
                    </div>

                    {/* Harga jual (varian pertama) */}
                    <div className="w-32 text-right">
                      <span className="text-sm font-extrabold text-emerald-700">
                        {firstVariant ? fmt(firstVariant.price) : "—"}
                      </span>
                    </div>

                    {/* Aksi */}
                    {canManage && (
                      <div className="w-16 flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => { setEditProduct(product); setIsModalOpen(true); }}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(product)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Expanded varian */}
                  {isExpanded && variantCount > 0 && (
                    <div className="px-6 pb-4 bg-slate-50/70 border-t border-slate-100 space-y-1.5">
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 pt-3 pb-1">
                        Semua Varian
                      </p>
                      {product.variants.map((v) => (
                        <VariantBadge key={v.id} variant={v} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        {!isLoading && filteredProducts.length > 0 && (
          <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400">
              {filteredProducts.length} produk{search ? " ditemukan" : " terdaftar"}
            </span>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <ProductModal
          editProduct={editProduct}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => { setIsModalOpen(false); fetchProducts(); }}
        />
      )}
    </div>
  );
}
