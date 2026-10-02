"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  UserCheck,
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  FileText,
  ShoppingBag,
  Edit2,
  Trash2,
  Eye,
  X,
  Loader2,
  Calendar,
  Sparkles,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  MessageSquare,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../../contexts/AuthContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import api from "../../../lib/api";
import { showConfirmDialog } from "../../../lib/alerts";
import UnauthorizedState from "../../../components/common/UnauthorizedState";

export default function CustomersPage() {
  const { user, hasPermission } = useAuth();
  const { t } = useLanguage();

  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 1,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Modal Tambah / Edit
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal / Drawer Detail Pelanggan
  const [detailCustomer, setDetailCustomer] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // Hak Akses
  const isAllowed = user?.isOwner || hasPermission("customers:view");
  const canManage = user?.isOwner || hasPermission("customers:manage");

  // Fetch daftar pelanggan
  const fetchCustomers = useCallback(
    async (page = 1, search = "") => {
      try {
        setIsLoading(true);
        const res = await api.get(
          `/customers?page=${page}&limit=15&search=${encodeURIComponent(search || "")}`
        );
        if (res?.success) {
          setCustomers(res.data || []);
          if (res.pagination) {
            setPagination(res.pagination);
          }
        }
      } catch (err) {
        toast.error(err.message || "Gagal memuat data pelanggan.");
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (isAllowed) {
      const timer = setTimeout(() => {
        fetchCustomers(1, searchTerm);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isAllowed, searchTerm, fetchCustomers]);

  // Handle Buka Modal Tambah
  const handleOpenCreateModal = () => {
    setEditingCustomer(null);
    setFormData({
      name: "",
      phone: "",
      email: "",
      address: "",
      notes: "",
    });
    setIsFormModalOpen(true);
  };

  // Handle Buka Modal Edit
  const handleOpenEditModal = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name || "",
      phone: customer.phone || "",
      email: customer.email || "",
      address: customer.address || "",
      notes: customer.notes || "",
    });
    setIsFormModalOpen(true);
  };

  // Handle Simpan (Create / Update)
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Nama pelanggan wajib diisi.");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim() || null,
        email: formData.email.trim() || null,
        address: formData.address.trim() || null,
        notes: formData.notes.trim() || null,
      };

      if (editingCustomer) {
        const res = await api.put(`/customers/${editingCustomer.id}`, payload);
        if (res?.success) {
          toast.success(`Data "${res.data.name}" berhasil diperbarui.`);
          setIsFormModalOpen(false);
          fetchCustomers(pagination.page, searchTerm);
          if (detailCustomer?.id === editingCustomer.id) {
            setDetailCustomer((prev) => ({ ...prev, ...res.data }));
          }
        }
      } else {
        const res = await api.post("/customers", payload);
        if (res?.success) {
          toast.success(`Pelanggan "${res.data.name}" berhasil ditambahkan.`);
          setIsFormModalOpen(false);
          fetchCustomers(1, searchTerm);
        }
      }
    } catch (err) {
      toast.error(err.message || "Gagal menyimpan data pelanggan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Hapus Pelanggan
  const handleDeleteCustomer = async (customer) => {
    const isConfirmed = await showConfirmDialog({
      title: "Hapus Pelanggan?",
      text: `Apakah Anda yakin ingin menghapus data pelanggan "${customer.name}"? Riwayat transaksi sebelumnya akan tetap tersimpan secara anonim.`,
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
      icon: "warning",
    });

    if (!isConfirmed) return;

    try {
      const res = await api.delete(`/customers/${customer.id}`);
      if (res?.success) {
        toast.success(`Pelanggan "${customer.name}" berhasil dihapus.`);
        fetchCustomers(pagination.page, searchTerm);
        if (detailCustomer?.id === customer.id) {
          setDetailCustomer(null);
        }
      }
    } catch (err) {
      toast.error(err.message || "Gagal menghapus data pelanggan.");
    }
  };

  // Handle Lihat Detail Pelanggan (termasuk riwayat transaksi)
  const handleOpenDetail = async (customer) => {
    try {
      setIsDetailLoading(true);
      setDetailCustomer(customer); // preview awal
      const res = await api.get(`/customers/${customer.id}`);
      if (res?.success) {
        setDetailCustomer(res.data);
      }
    } catch (err) {
      toast.error(err.message || "Gagal memuat detail pelanggan.");
    } finally {
      setIsDetailLoading(false);
    }
  };

  // Format link WhatsApp
  const getWhatsAppLink = (phone) => {
    if (!phone) return null;
    let clean = phone.replace(/[^0-9]/g, "");
    if (clean.startsWith("0")) {
      clean = "62" + clean.slice(1);
    }
    return `https://wa.me/${clean}`;
  };

  if (!isAllowed) {
    return (
      <UnauthorizedState
        title="Akses Dibatasi"
        message="Anda tidak memiliki izin untuk melihat database pelanggan."
      />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* 1. Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-amber-500 to-amber-600 p-0.5 shadow-md shadow-amber-500/20">
              <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center text-amber-600">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                Database Pelanggan
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Kelola profil pelanggan, kontak WhatsApp, dan riwayat transaksi toko
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => fetchCustomers(pagination.page, searchTerm)}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-slate-200/90 bg-white/80 hover:bg-slate-50 text-slate-600 font-bold transition-all shadow-xs active:scale-95 disabled:opacity-50"
            title="Muat Ulang"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>

          {canManage && (
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-slate-900/10 transition-all active:scale-98"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Pelanggan</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Ringkasan Statistik */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white/80 backdrop-blur-xl border border-white/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Total Pelanggan
              </p>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                {pagination.total.toLocaleString("id-ID")}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white/80 backdrop-blur-xl border border-white/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Pelanggan Terdaftar
              </p>
              <h3 className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">
                {customers.length.toLocaleString("id-ID")}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white/80 backdrop-blur-xl border border-white/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Integrasi Kasir POS
              </p>
              <h3 className="text-sm font-extrabold text-slate-900 mt-1 flex items-center gap-1.5 text-amber-700">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Registrasi Cepat Aktif
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <ShoppingBag className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bar Pencarian */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-white/80 backdrop-blur-xl border border-white/80 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama, nomor telepon/WhatsApp, atau email..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200/90 focus:bg-white focus:border-amber-400 text-xs sm:text-sm font-bold text-slate-900 outline-none transition-all placeholder:text-slate-400 placeholder:font-normal"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 4. Tabel / Daftar Pelanggan */}
      <div className="rounded-3xl bg-white/80 backdrop-blur-xl border border-white/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
            <p className="text-xs font-bold text-slate-400">Memuat database pelanggan...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-base font-extrabold text-slate-800">
              {searchTerm ? "Tidak ada pelanggan ditemukan" : "Belum ada pelanggan terdaftar"}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1 mb-5">
              {searchTerm
                ? `Tidak ada data yang cocok dengan kata kunci "${searchTerm}". Silakan periksa kembali ejaan.`
                : "Daftarkan pelanggan setia toko Anda untuk kemudahan transaksi kasir dan pencatatan riwayat belanja."}
            </p>
            {canManage && (
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-md transition-all active:scale-98"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Pelanggan Baru</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">Pelanggan</th>
                  <th className="py-3.5 px-4 sm:px-6">Kontak</th>
                  <th className="py-3.5 px-4 sm:px-6">Alamat & Catatan</th>
                  <th className="py-3.5 px-4 sm:px-6 text-center">Riwayat</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                {customers.map((c) => {
                  const waLink = getWhatsAppLink(c.phone);
                  const initial = c.name?.charAt(0)?.toUpperCase() || "P";

                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-amber-50/30 transition-colors group"
                    >
                      {/* Kolom Profil Pelanggan */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-700 font-black text-sm flex items-center justify-center shrink-0 border border-amber-500/20">
                            {initial}
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-900 text-sm">
                              {c.name}
                            </p>
                            <p className="text-[10px] text-slate-400 font-medium">
                              Terdaftar:{" "}
                              {new Date(c.createdAt).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Kolom Kontak */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="space-y-1">
                          {c.phone ? (
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900">{c.phone}</span>
                              {waLink && (
                                <a
                                  href={waLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5 bg-emerald-50 px-1.5 py-0.5 rounded-md font-extrabold transition-colors"
                                  title="Buka WhatsApp"
                                >
                                  <MessageSquare className="w-2.5 h-2.5" />
                                  <span>WA</span>
                                </a>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">
                              Tidak ada telepon
                            </span>
                          )}

                          {c.email ? (
                            <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate max-w-44">{c.email}</span>
                            </div>
                          ) : null}
                        </div>
                      </td>

                      {/* Kolom Alamat & Catatan */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="space-y-0.5 max-w-xs">
                          {c.address ? (
                            <div className="flex items-start gap-1 text-slate-700 text-xs">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                              <span className="truncate">{c.address}</span>
                            </div>
                          ) : null}

                          {c.notes ? (
                            <div className="flex items-start gap-1 text-slate-500 text-[11px]">
                              <FileText className="w-3 h-3 text-amber-500/70 shrink-0 mt-0.5" />
                              <span className="truncate italic">“{c.notes}”</span>
                            </div>
                          ) : null}

                          {!c.address && !c.notes && (
                            <span className="text-slate-400 italic text-[11px]">-</span>
                          )}
                        </div>
                      </td>

                      {/* Kolom Total Transaksi */}
                      <td className="py-4 px-4 sm:px-6 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-slate-100 text-slate-800">
                          <ShoppingBag className="w-3 h-3 text-amber-600" />
                          {c._count?.transactions || 0} order
                        </span>
                      </td>

                      {/* Kolom Aksi */}
                      <td className="py-4 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(c)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                            title="Detail Riwayat Pelanggan"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {canManage && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(c)}
                                className="p-1.5 rounded-lg text-amber-600 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                                title="Edit Pelanggan"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCustomer(c)}
                                className="p-1.5 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Hapus Pelanggan"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-t border-slate-100 bg-slate-50/50">
            <p className="text-xs text-slate-500 font-bold">
              Menampilkan {customers.length} dari {pagination.total} pelanggan
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => fetchCustomers(pagination.page - 1, searchTerm)}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-extrabold text-slate-700 px-2.5">
                Halaman {pagination.page} / {pagination.totalPages}
              </span>
              <button
                type="button"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchCustomers(pagination.page + 1, searchTerm)}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Tambah / Edit Pelanggan */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white/95 backdrop-blur-2xl border border-white/90 shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center">
                  <UserCheck className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    {editingCustomer ? "Edit Data Pelanggan" : "Tambah Pelanggan Baru"}
                  </h3>
                  <p className="text-[11px] text-slate-400">Database pelanggan toko</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">
                  Nama Pelanggan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Budi Santoso"
                  required
                  autoFocus
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-400 text-xs font-bold text-slate-900 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">
                  Nomor WhatsApp / Telepon
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Contoh: 081234567890"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-400 text-xs font-bold text-slate-900 outline-none"
                  />
                </div>
                <p className="text-[10px] text-slate-400">Nomor unik untuk tiap pelanggan dalam toko</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">
                  Alamat Email (Opsional)
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="budi@example.com"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-400 text-xs font-bold text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">
                  Alamat Fisik (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Alamat domisili atau pengiriman..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-400 text-xs font-bold text-slate-900 outline-none resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">
                  Catatan / Preferensi (Opsional)
                </label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Contoh: Member VIP, suka diskon, alergi udang"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-400 text-xs font-bold text-slate-900 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-md flex items-center gap-1.5 transition-all active:scale-98 disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>{editingCustomer ? "Simpan Perubahan" : "Tambah Pelanggan"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal / Drawer Detail Pelanggan & Riwayat Transaksi */}
      {detailCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-xl rounded-3xl bg-white/95 backdrop-blur-2xl border border-white/90 shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-700 font-black text-base flex items-center justify-center border border-amber-500/20">
                  {detailCustomer.name?.charAt(0)?.toUpperCase() || "P"}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {detailCustomer.name}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Terdaftar sejak{" "}
                    {new Date(detailCustomer.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailCustomer(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto pr-1 flex-1">
              {/* Kontak & Detail Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50/80 border border-slate-100">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Telepon / WA</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-slate-800">
                      {detailCustomer.phone || "-"}
                    </span>
                    {getWhatsAppLink(detailCustomer.phone) && (
                      <a
                        href={getWhatsAppLink(detailCustomer.phone)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md font-extrabold hover:bg-emerald-100 transition-colors flex items-center gap-1"
                      >
                        <MessageSquare className="w-2.5 h-2.5" />
                        Chat WA
                      </a>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Email</p>
                  <span className="text-xs font-bold text-slate-800">
                    {detailCustomer.email || "-"}
                  </span>
                </div>

                {detailCustomer.address && (
                  <div className="col-span-full space-y-1 pt-1 border-t border-slate-200/50">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Alamat</p>
                    <p className="text-xs font-medium text-slate-700">
                      {detailCustomer.address}
                    </p>
                  </div>
                )}

                {detailCustomer.notes && (
                  <div className="col-span-full space-y-1 pt-1 border-t border-slate-200/50">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Catatan</p>
                    <p className="text-xs font-semibold text-amber-800 bg-amber-50/80 p-2 rounded-xl border border-amber-100/80">
                      {detailCustomer.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Riwayat 10 Transaksi Terakhir */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5 text-amber-500" />
                    Riwayat Transaksi Terakhir (Maks 10)
                  </h4>
                  <span className="text-[11px] font-bold text-slate-400">
                    Total: {detailCustomer._count?.transactions || 0} order
                  </span>
                </div>

                {isDetailLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
                  </div>
                ) : !detailCustomer.transactions || detailCustomer.transactions.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                    Belum ada riwayat transaksi yang tercatat untuk pelanggan ini.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {detailCustomer.transactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="p-3 rounded-2xl bg-white border border-slate-100 shadow-2xs hover:border-amber-200 transition-colors space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-extrabold text-slate-800">
                              #{tx.receiptNumber}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-100 text-slate-600">
                              {tx.paymentMethod}
                            </span>
                          </div>
                          <span className="font-black text-amber-700">
                            Rp {parseFloat(tx.totalAmount || 0).toLocaleString("id-ID")}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>
                            {new Date(tx.createdAt).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <span className="text-slate-500 font-semibold">
                            {tx.items?.length || 0} jenis produk
                          </span>
                        </div>

                        {tx.items && tx.items.length > 0 && (
                          <div className="pt-1.5 border-t border-slate-50 text-[11px] text-slate-600 space-y-0.5">
                            {tx.items.map((it, idx) => (
                              <div key={idx} className="flex justify-between">
                                <span>
                                  {it.quantity}x {it.productNameSnapshot || "Produk"}
                                </span>
                                <span className="font-semibold text-slate-700">
                                  Rp {parseFloat(it.subtotal || 0).toLocaleString("id-ID")}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={() => setDetailCustomer(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
