"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  Trash2,
  Edit2,
  Percent,
  Banknote,
  RefreshCw,
  X,
  Ticket,
  GitBranch,
  MapPin,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../../lib/api";
import { useAuth } from "../../../contexts/AuthContext";

const fmt = (n) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(n) || 0);

/**
 * Format angka ke tampilan ribuan: "15000" → "15.000"
 * Hanya angka, titik sebagai pemisah ribuan (id-ID style)
 */
const fmtRibuan = (val) => {
  if (val === "" || val === null || val === undefined) return "";
  const num = String(val).replace(/\D/g, "");
  if (!num) return "";
  return new Intl.NumberFormat("id-ID").format(Number(num));
};

/**
 * Parse string format ribuan kembali ke angka murni: "15.000" → 15000
 */
const parseRibuan = (val) => {
  if (!val) return "";
  return String(val).replace(/\./g, "").replace(/\D/g, "");
};

const fmtDate = (d) => {
  if (!d) return "Selamanya";
  return new Date(d).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function PromotionsPage() {
  const { activeBranchId, activeBranch } = useAuth();

  const [promotions, setPromotions] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State — branchId selalu dikunci ke activeBranchId
  const emptyForm = useCallback(() => ({
    name: "",
    code: "",
    description: "",
    discountType: "PERCENTAGE",
    discountValue: "",
    maxDiscount: "",
    minPurchase: "",
    scope: "ALL",
    scopeVariantIds: [],
    usageLimit: "",
    isActive: true,
    startDate: "",
    endDate: "",
  }), []);

  const [formData, setFormData] = useState(emptyForm);

  // Fetch promo hanya milik cabang aktif
  const fetchPromotions = useCallback(async () => {
    if (!activeBranchId) return;
    try {
      setLoading(true);
      // Filter by cabang aktif di backend menggunakan query param
      const res = await api.get(`/promotions?branchId=${activeBranchId}`);
      if (res?.success) {
        setPromotions(res.data || []);
      }
    } catch (err) {
      toast.error(err.message || "Gagal memuat daftar promo.");
    } finally {
      setLoading(false);
    }
  }, [activeBranchId]);

  // Fetch produk & varian untuk scope PRODUCT
  const fetchProducts = useCallback(async () => {
    try {
      const res = await api.get("/products");
      if (res?.success) {
        setProducts(res.data || []);
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchPromotions();
    fetchProducts();
  }, [fetchPromotions, fetchProducts]);

  // Buka modal tambah
  const handleOpenAdd = () => {
    if (!activeBranchId) {
      toast.error("Tidak ada cabang aktif. Pilih cabang terlebih dahulu.");
      return;
    }
    setEditingPromo(null);
    setFormData(emptyForm());
    setShowModal(true);
  };

  // Buka modal edit
  const handleOpenEdit = (promo) => {
    setEditingPromo(promo);
    setFormData({
      name: promo.name || "",
      code: promo.code || "",
      description: promo.description || "",
      discountType: promo.discountType || "PERCENTAGE",
      discountValue: String(promo.discountValue || ""),
      maxDiscount: promo.maxDiscount ? String(promo.maxDiscount) : "",
      minPurchase: promo.minPurchase ? String(promo.minPurchase) : "",
      scope: promo.scope || "ALL",
      scopeVariantIds: promo.scopeVariantIds || [],
      usageLimit: promo.usageLimit ? String(promo.usageLimit) : "",
      isActive: promo.isActive !== false,
      startDate: promo.startDate ? promo.startDate.slice(0, 10) : "",
      endDate: promo.endDate ? promo.endDate.slice(0, 10) : "",
    });
    setShowModal(true);
  };

  // Simpan (create / update) — branchId selalu dikunci ke activeBranchId
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!activeBranchId) {
      return toast.error("Tidak ada cabang aktif. Tidak dapat menyimpan promo.");
    }
    if (!formData.name.trim()) return toast.error("Nama promo wajib diisi.");
    if (!formData.code.trim()) return toast.error("Kode kupon wajib diisi.");
    if (!formData.discountValue || Number(formData.discountValue) <= 0) {
      return toast.error("Nilai diskon harus lebih dari 0.");
    }
    if (formData.discountType === "PERCENTAGE" && Number(formData.discountValue) > 100) {
      return toast.error("Diskon persentase maksimal 100%.");
    }
    if (formData.scope === "PRODUCT" && formData.scopeVariantIds.length === 0) {
      return toast.error("Pilih minimal 1 varian produk untuk scope Produk Khusus.");
    }

    try {
      setIsSubmitting(true);
      const payload = {
        branchId: activeBranchId, // selalu dikunci ke cabang aktif
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase().replace(/\s+/g, ""),
        description: formData.description.trim() || null,
        discountType: formData.discountType,
        discountValue: parseFloat(formData.discountValue),
        maxDiscount: formData.maxDiscount ? parseFloat(formData.maxDiscount) : null,
        minPurchase: formData.minPurchase ? parseFloat(formData.minPurchase) : 0,
        scope: formData.scope,
        scopeVariantIds: formData.scope === "PRODUCT" ? formData.scopeVariantIds : null,
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit, 10) : null,
        isActive: formData.isActive,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
      };

      if (editingPromo) {
        await api.put(`/promotions/${editingPromo.id}`, payload);
        toast.success("Promo berhasil diperbarui!");
      } else {
        await api.post("/promotions", payload);
        toast.success("Promo baru berhasil ditambahkan!");
      }

      setShowModal(false);
      fetchPromotions();
    } catch (err) {
      toast.error(err.message || "Gagal menyimpan promo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle aktif/nonaktif
  const handleToggle = async (id) => {
    try {
      await api.patch(`/promotions/${id}/toggle`);
      toast.success("Status promo diperbarui.");
      fetchPromotions();
    } catch (err) {
      toast.error(err.message || "Gagal mengubah status.");
    }
  };

  // Hapus promo
  const handleDelete = async (promo) => {
    if (!window.confirm(`Hapus promo "${promo.name}" (${promo.code}) secara permanen?`)) return;
    try {
      await api.delete(`/promotions/${promo.id}`);
      toast.success("Promo berhasil dihapus.");
      fetchPromotions();
    } catch (err) {
      toast.error(err.message || "Gagal menghapus promo.");
    }
  };

  // Filter berdasarkan search & status
  const filteredPromotions = promotions.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch =
      p.name.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q) ||
      (p.description || "").toLowerCase().includes(q);
    if (!matchSearch) return false;
    if (statusFilter === "ACTIVE" && !p.isActive) return false;
    if (statusFilter === "INACTIVE" && p.isActive) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-300 flex items-center justify-center shadow-2xs">
              <Ticket className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900">
                Promo & Diskon Kasir
              </h1>
              <p className="text-xs text-slate-500">
                Kode kupon, diskon, dan kuota pemakaian di kasir
              </p>
            </div>
          </div>

          {/* Info Cabang Aktif */}
          {activeBranch && (
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-[11px] font-bold">
              <MapPin className="w-3 h-3 text-amber-400" />
              <span>Cabang Aktif:</span>
              <span className="text-amber-300">{activeBranch.name}</span>
              <span className="text-slate-400 font-normal ml-0.5">
                — Semua promo di halaman ini hanya berlaku untuk cabang ini
              </span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          disabled={!activeBranchId}
          className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-xs shadow-md shadow-slate-900/15 flex items-center gap-2 transition-all active:scale-95 cursor-pointer self-start shrink-0"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>Buat Promo Baru</span>
        </button>
      </div>

      {/* Bar Pencarian & Filter Status */}
      <div className="p-4 rounded-3xl bg-white/80 backdrop-blur-xl border border-white/90 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama promo atau kode kupon..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:border-amber-400 transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Status Pills */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {["ALL", "ACTIVE", "INACTIVE"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === st
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {st === "ALL" ? "Semua" : st === "ACTIVE" ? "Aktif" : "Nonaktif"}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={fetchPromotions}
            title="Segarkan data"
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Grid Kartu Promo */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-52 rounded-3xl bg-white/60 animate-pulse border border-slate-200/60" />
          ))}
        </div>
      ) : filteredPromotions.length === 0 ? (
        <div className="p-12 rounded-3xl border border-dashed border-slate-200 text-center space-y-3 bg-slate-50/50">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
            <Ticket className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-slate-700">
              {search || statusFilter !== "ALL"
                ? "Tidak ada promo yang sesuai filter"
                : `Belum ada promo untuk ${activeBranch?.name || "cabang ini"}`}
            </p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {search || statusFilter !== "ALL"
                ? "Coba ubah kata kunci pencarian atau filter status."
                : "Buat promo pertama untuk cabang ini. Promo hanya berlaku di kasir cabang yang sama."}
            </p>
          </div>
          {!search && statusFilter === "ALL" && (
            <button
              type="button"
              onClick={handleOpenAdd}
              disabled={!activeBranchId}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>Buat Promo Pertama</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPromotions.map((p) => {
            const isPercent = p.discountType === "PERCENTAGE";
            const quotaRemaining =
              p.usageLimit !== null ? Math.max(0, p.usageLimit - p.usageCount) : null;

            return (
              <div
                key={p.id}
                className={`p-5 rounded-3xl bg-white/90 backdrop-blur-xl border transition-all space-y-4 hover:shadow-lg relative overflow-hidden ${
                  p.isActive
                    ? "border-white/90 shadow-2xs hover:border-amber-300"
                    : "border-slate-200/60 opacity-60 bg-slate-50/60"
                }`}
              >
                {/* Header Kartu */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5 min-w-0">
                    <span className="font-mono text-xs font-black px-2.5 py-1 rounded-xl bg-amber-100 text-amber-950 border border-amber-300 tracking-wider inline-block shadow-2xs">
                      {p.code}
                    </span>
                    <h3 className="text-sm font-black text-slate-900 leading-snug truncate">
                      {p.name}
                    </h3>
                  </div>

                  {/* Toggle Aktif */}
                  <button
                    type="button"
                    onClick={() => handleToggle(p.id)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border cursor-pointer transition-colors shrink-0 ${
                      p.isActive
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                        : "bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200"
                    }`}
                  >
                    {p.isActive ? "Aktif" : "Nonaktif"}
                  </button>
                </div>

                {/* Deskripsi */}
                {p.description && (
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {p.description}
                  </p>
                )}

                {/* Besaran Diskon */}
                <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Nilai Diskon
                  </span>
                  <div className="text-right">
                    <span className="text-base font-black text-emerald-700">
                      {isPercent ? `${p.discountValue}%` : fmt(p.discountValue)}
                    </span>
                    {isPercent && p.maxDiscount && (
                      <p className="text-[10px] text-slate-400 font-semibold">
                        Maks. {fmt(p.maxDiscount)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Info Ketentuan & Kuota */}
                <div className="space-y-1.5 text-[11px] text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Min. Belanja:</span>
                    <span className="font-bold text-slate-700">
                      {p.minPurchase > 0 ? fmt(p.minPurchase) : "Tanpa minimal"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Cakupan:</span>
                    <span className="font-bold text-slate-700">
                      {p.scope === "PRODUCT" ? (
                        <span className="text-amber-700">
                          Produk Khusus ({p.scopeVariantIds?.length || 0} varian)
                        </span>
                      ) : (
                        "Semua Produk"
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Kuota Terpakai:</span>
                    <span className="font-bold text-slate-800">
                      {p.usageLimit ? (
                        <span>
                          {p.usageCount}/{p.usageLimit}
                          <span className="text-slate-400 font-normal ml-1">
                            ({quotaRemaining} tersisa)
                          </span>
                        </span>
                      ) : (
                        <span>
                          {p.usageCount}
                          <span className="text-slate-400 font-normal ml-1">(Unlimited)</span>
                        </span>
                      )}
                    </span>
                  </div>

                  {(p.startDate || p.endDate) && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Periode:</span>
                      <span className="font-bold text-slate-700 text-[10px]">
                        {fmtDate(p.startDate)} – {fmtDate(p.endDate)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Tombol Edit & Hapus */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(p)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Edit Promo"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(p)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Hapus Promo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Modal Form Tambah / Edit ────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl bg-white/95 backdrop-blur-2xl border border-white/90 shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col my-6 max-h-[92vh]">
            {/* Header Modal */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                  <Ticket className="w-4.5 h-4.5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    {editingPromo ? "Ubah Promo" : "Buat Promo Baru"}
                  </h3>
                  {/* Label cabang dikunci — tidak bisa diubah */}
                  <div className="flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-amber-500" />
                    <span className="text-[11px] font-bold text-amber-700">
                      {activeBranch?.name || "Cabang Aktif"}
                    </span>
                    <span className="text-[10px] text-slate-400">— promo berlaku di cabang ini</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1 custom-scrollbar">

              {/* Nama & Kode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Nama Promo <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Cth: Diskon Weekend 10%"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-amber-400 transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Kode Kupon <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        code: e.target.value.toUpperCase().replace(/\s+/g, ""),
                      })
                    }
                    placeholder="Cth: WEEKEND10"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-black text-slate-900 outline-none focus:bg-white focus:border-amber-400 uppercase transition-all"
                  />
                </div>
              </div>

              {/* Deskripsi */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Deskripsi (Opsional)</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Cth: Berlaku setiap hari Sabtu & Minggu untuk makan di tempat..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:bg-white focus:border-amber-400 transition-all resize-none"
                />
              </div>

              {/* Tipe & Nilai Diskon */}
              <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-3">
                <label className="text-xs font-black text-amber-900 uppercase tracking-wider block">
                  Nilai Diskon
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, discountType: "PERCENTAGE" })}
                    className={`py-2 px-3 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      formData.discountType === "PERCENTAGE"
                        ? "bg-amber-500 text-white border-amber-600 shadow-xs"
                        : "bg-white text-slate-600 border-slate-200"
                    }`}
                  >
                    <Percent className="w-3.5 h-3.5" />
                    <span>Persentase (%)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, discountType: "FIXED" })}
                    className={`py-2 px-3 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      formData.discountType === "FIXED"
                        ? "bg-amber-500 text-white border-amber-600 shadow-xs"
                        : "bg-white text-slate-600 border-slate-200"
                    }`}
                  >
                    <Banknote className="w-3.5 h-3.5" />
                    <span>Nominal Tetap (Rp)</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">
                      {formData.discountType === "PERCENTAGE" ? "Besar Diskon (%)" : "Besar Diskon (Rp)"}
                      <span className="text-rose-500 ml-1">*</span>
                    </label>
                    {formData.discountType === "PERCENTAGE" ? (
                      /* Persentase — input angka biasa 1–100 */
                      <div className="relative">
                        <input
                          type="text"
                          inputMode="numeric"
                          required
                          value={formData.discountValue}
                          onChange={(e) => {
                            // Hanya angka, max 3 digit (max 100)
                            const raw = e.target.value.replace(/\D/g, "").slice(0, 3);
                            const num = Math.min(Number(raw), 100);
                            setFormData({ ...formData, discountValue: raw === "" ? "" : String(num) });
                          }}
                          placeholder="10"
                          className="w-full px-3 py-2 pr-8 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:border-amber-400"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 pointer-events-none">
                          %
                        </span>
                      </div>
                    ) : (
                      /* Nominal Tetap — format ribuan */
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                          Rp
                        </span>
                        <input
                          type="text"
                          inputMode="numeric"
                          required
                          value={fmtRibuan(formData.discountValue)}
                          onChange={(e) => {
                            const raw = parseRibuan(e.target.value);
                            setFormData({ ...formData, discountValue: raw });
                          }}
                          placeholder="5.000"
                          className="w-full pl-8 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:border-amber-400"
                        />
                      </div>
                    )}
                  </div>

                  {formData.discountType === "PERCENTAGE" && (
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700">
                        Maks. Potongan (Rp, opsional)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                          Rp
                        </span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={fmtRibuan(formData.maxDiscount)}
                          onChange={(e) => {
                            const raw = parseRibuan(e.target.value);
                            setFormData({ ...formData, maxDiscount: raw });
                          }}
                          placeholder="15.000"
                          className="w-full pl-8 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Min. Belanja & Batas Kuota */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Min. Belanja (Rp)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                      Rp
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={fmtRibuan(formData.minPurchase)}
                      onChange={(e) => {
                        const raw = parseRibuan(e.target.value);
                        setFormData({ ...formData, minPurchase: raw });
                      }}
                      placeholder="0 = Tanpa minimal"
                      className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Batas Kuota Penggunaan</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={fmtRibuan(formData.usageLimit)}
                    onChange={(e) => {
                      const raw = parseRibuan(e.target.value);
                      setFormData({ ...formData, usageLimit: raw });
                    }}
                    placeholder="Kosongkan = unlimited"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-amber-400"
                  />
                  <p className="text-[10px] text-slate-400">
                    Kuota khusus untuk cabang {activeBranch?.name}
                  </p>
                </div>
              </div>

              {/* Cakupan Produk */}
              <div className="space-y-2 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                  Cakupan Produk
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {["ALL", "PRODUCT"].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setFormData({ ...formData, scope: s })}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        formData.scope === s
                          ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                          : "bg-white text-slate-600 border-slate-200"
                      }`}
                    >
                      {s === "ALL" ? "Semua Produk" : "Produk Khusus"}
                    </button>
                  ))}
                </div>

                {formData.scope === "PRODUCT" && (
                  <div className="pt-2 space-y-1.5">
                    <p className="text-[11px] font-semibold text-slate-500">
                      Pilih produk/varian yang harus ada di keranjang:
                    </p>
                    <div className="max-h-40 overflow-y-auto space-y-1 p-2 rounded-xl bg-white border border-slate-200">
                      {products.flatMap((prod) =>
                        (prod.variants || []).map((v) => {
                          const isSelected = formData.scopeVariantIds.includes(v.id);
                          return (
                            <label
                              key={v.id}
                              className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer text-xs"
                            >
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setFormData({
                                        ...formData,
                                        scopeVariantIds: [...formData.scopeVariantIds, v.id],
                                      });
                                    } else {
                                      setFormData({
                                        ...formData,
                                        scopeVariantIds: formData.scopeVariantIds.filter(
                                          (id) => id !== v.id
                                        ),
                                      });
                                    }
                                  }}
                                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                                />
                                <span className="font-bold text-slate-800">
                                  {prod.name}
                                  {v.name !== "Default" && ` — ${v.name}`}
                                </span>
                              </div>
                              <span className="text-[11px] font-extrabold text-emerald-700">
                                {fmt(v.price)}
                              </span>
                            </label>
                          );
                        })
                      )}
                      {products.length === 0 && (
                        <p className="text-center text-[11px] text-slate-400 py-3">
                          Belum ada produk terdaftar.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Tanggal Masa Berlaku */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Mulai Berlaku (Opsional)</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-amber-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Berakhir Pada (Opsional)</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Toggle Status Aktif */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Status Promo Aktif</span>
                  <span className="text-[11px] text-slate-400">
                    Promo bisa langsung digunakan kasir di terminal POS
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
              </div>

              {/* Tombol Aksi */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-xs transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-md shadow-slate-900/15 transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
                >
                  {isSubmitting ? "Menyimpan..." : editingPromo ? "Simpan Perubahan" : "Buat Promo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
