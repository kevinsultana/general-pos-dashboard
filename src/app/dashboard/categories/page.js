"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  X,
  Search,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  FolderTree,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../../contexts/AuthContext";
import api from "../../../lib/api";
import { showConfirmDialog } from "../../../lib/alerts";
import UnauthorizedState from "../../../components/common/UnauthorizedState";

// ─── Modal Tambah / Edit Kategori ─────────────────────────────────────────────
function CategoryModal({ onClose, onSuccess, editCategory }) {
  const isEdit = !!editCategory;
  const [name, setName] = useState(editCategory?.name || "");
  const [sortOrder, setSortOrder] = useState(editCategory?.sortOrder ?? 0);
  const [isActive, setIsActive] = useState(editCategory?.isActive ?? true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Nama kategori wajib diisi.");

    try {
      setIsSubmitting(true);
      const payload = {
        name: name.trim(),
        sortOrder: Number(sortOrder) || 0,
        isActive,
      };

      if (isEdit) {
        await api.put(`/categories/${editCategory.id}`, payload);
        toast.success("Kategori berhasil diperbarui.");
      } else {
        await api.post("/categories", payload);
        toast.success("Kategori berhasil ditambahkan.");
      }
      onSuccess();
    } catch (err) {
      toast.error(err.message || "Gagal menyimpan kategori.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl bg-white/95 backdrop-blur-2xl border border-white/90 shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center">
              <Layers className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                {isEdit ? "Edit Kategori" : "Tambah Kategori Baru"}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isEdit ? `Mengubah "${editCategory.name}"` : "Kelompokkan menu agar rapi di kasir & QR order"}
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Nama Kategori <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Makanan, Minuman, Snack, Paket Hemat"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-400 text-xs font-semibold text-slate-900 outline-none transition-all"
              required
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Urutan Tampilan
            </label>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              placeholder="0"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-400 text-xs font-semibold text-slate-900 outline-none transition-all"
            />
            <p className="text-[10px] text-slate-400 font-medium">
              Angka lebih kecil tampil lebih dulu pada tab kasir dan menu pelanggan.
            </p>
          </div>

          {isEdit && (
            <div
              className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer select-none transition-all hover:bg-slate-100/70"
              onClick={() => setIsActive((v) => !v)}
            >
              <div>
                <p className="text-xs font-bold text-slate-800">Status Kategori</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {isActive ? "Aktif — tampil di POS & menu pelanggan" : "Nonaktif — disembunyikan"}
                </p>
              </div>
              {isActive ? (
                <ToggleRight className="w-8 h-8 text-emerald-500 shrink-0" />
              ) : (
                <ToggleLeft className="w-8 h-8 text-slate-300 shrink-0" />
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-xs font-black text-white shadow-md shadow-amber-500/20 transition-all disabled:opacity-50"
            >
              {isSubmitting ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Tambah Kategori"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Halaman Utama Kategori Produk ───────────────────────────────────────────
export default function CategoriesPage() {
  const { hasPermission } = useAuth();
  const canView = hasPermission("inventory:view");
  const canManage = hasPermission("inventory:manage");

  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editCategory, setEditCategory] = useState(null);

  const fetchCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/categories");
      if (res?.success) {
        setCategories(res.data || []);
      }
    } catch (err) {
      toast.error(err.message || "Gagal memuat kategori.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canView) fetchCategories();
  }, [canView, fetchCategories]);

  const handleDelete = async (cat) => {
    const result = await showConfirmDialog({
      title: "Hapus Kategori?",
      text: `Kategori "${cat.name}" akan dihapus. Produk yang terhubung tidak akan terhapus, tetapi menjadi tanpa kategori.`,
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
      confirmButtonColor: "#e11d48",
    });

    if (!result.isConfirmed) return;

    try {
      await api.delete(`/categories/${cat.id}`);
      toast.success("Kategori berhasil dihapus.");
      fetchCategories();
    } catch (err) {
      toast.error(err.message || "Gagal menghapus kategori.");
    }
  };

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  if (!canView) {
    return <UnauthorizedState requiredPermission="inventory:view" />;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center">
              <Layers className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Kategori Produk</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Kelola kategori untuk memudahkan kasir mencari menu dan filter di katalog QR order.
              </p>
            </div>
          </div>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={() => {
              setEditCategory(null);
              setIsModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-xs font-black text-white shadow-md shadow-amber-500/20 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Kategori</span>
          </button>
        )}
      </div>

      {/* Bar Pencarian */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari kategori..."
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/90 border border-slate-200/80 focus:border-amber-400 text-xs font-semibold text-slate-900 outline-none shadow-xs"
        />
      </div>

      {/* Tabel Kategori */}
      <div className="rounded-3xl bg-white/90 backdrop-blur-xl border border-white/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs font-bold text-slate-400">
            Memuat daftar kategori...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <FolderTree className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-600">
              {search ? "Kategori tidak ditemukan" : "Belum ada kategori"}
            </p>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
              {search
                ? "Coba kata kunci pencarian yang lain."
                : "Tambahkan kategori pertama Anda agar produk terkelompokkan dengan rapi."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-6 py-3.5 w-16 text-center">Urutan</th>
                  <th className="px-6 py-3.5">Nama Kategori</th>
                  <th className="px-6 py-3.5 text-center">Status</th>
                  {canManage && <th className="px-6 py-3.5 text-right w-24">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((cat) => (
                  <tr key={cat.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 text-center font-bold text-slate-500">
                      {cat.sortOrder}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-black text-slate-900">{cat.name}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                          cat.isActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-500 border-slate-200"
                        }`}
                      >
                        {cat.isActive ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    {canManage && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditCategory(cat);
                              setIsModalOpen(true);
                            }}
                            title="Edit"
                            className="p-1.5 rounded-xl text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(cat)}
                            title="Hapus"
                            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <CategoryModal
          editCategory={editCategory}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchCategories();
          }}
        />
      )}
    </div>
  );
}
