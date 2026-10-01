"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  GitBranch,
  Store,
  Plus,
  Edit2,
  Trash2,
  MapPin,
  Phone,
  Users,
  Check,
  Sparkles,
  Lock,
  ArrowRight,
  X,
  AlertCircle,
  Building2,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../../contexts/AuthContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import api from "../../../lib/api";
import { showConfirmDialog } from "../../../lib/alerts";
import UnauthorizedState from "../../../components/common/UnauthorizedState";

export default function BranchesPage() {
  const {
    user,
    tenant,
    hasPermission,
    activeBranchId,
    activeBranch,
    switchBranch,
    checkAuth,
  } = useAuth();
  const { t } = useLanguage();

  const [branches, setBranches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSwitchingId, setIsSwitchingId] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Upgrade Modal State (Khusus Non-PRO)
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  // Hak Akses & Plan
  const isAllowed = user?.isOwner || hasPermission("branches:view");
  const canManage = user?.isOwner || hasPermission("branches:manage");
  const isProPlan = tenant?.plan === "PRO";

  // Fetch daftar cabang
  const fetchBranches = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/branches");
      if (res?.success && Array.isArray(res.data)) {
        setBranches(res.data);
      }
    } catch (err) {
      toast.error(err.message || "Gagal memuat daftar cabang.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAllowed) {
      fetchBranches();
    }
  }, [isAllowed, fetchBranches]);

  // Buka Modal Tambah Cabang
  const handleOpenAddModal = () => {
    if (!isProPlan) {
      setIsUpgradeModalOpen(true);
      return;
    }

    if (!canManage) {
      toast.error("Anda tidak memiliki izin untuk menambah cabang baru.");
      return;
    }

    setEditingBranch(null);
    setFormData({
      name: "",
      address: "",
      phone: "",
    });
    setIsModalOpen(true);
  };

  // Buka Modal Edit Cabang
  const handleOpenEditModal = (branch) => {
    if (!canManage) {
      toast.error("Anda tidak memiliki izin untuk mengedit cabang.");
      return;
    }

    setEditingBranch(branch);
    setFormData({
      name: branch.name || "",
      address: branch.address || "",
      phone: branch.phone || "",
    });
    setIsModalOpen(true);
  };

  // Submit Simpan Cabang (Tambah / Edit)
  const handleSubmitBranch = async (e) => {
    e?.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Nama cabang wajib diisi.");
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingBranch) {
        // Edit Branch
        const res = await api.put(`/branches/${editingBranch.id}`, {
          name: formData.name.trim(),
          address: formData.address.trim() || null,
          phone: formData.phone.trim() || null,
        });

        if (res?.success) {
          toast.success(
            res.message ||
              t("branches.saveBranch") ||
              "Data cabang berhasil diperbarui."
          );
          setIsModalOpen(false);
          await fetchBranches();
          await checkAuth();
        } else {
          throw new Error(res?.message || "Gagal memperbarui cabang.");
        }
      } else {
        // Tambah Branch
        const res = await api.post("/branches", {
          name: formData.name.trim(),
          address: formData.address.trim() || null,
          phone: formData.phone.trim() || null,
        });

        if (res?.success) {
          toast.success(res.message || "Cabang baru berhasil ditambahkan.");
          setIsModalOpen(false);
          await fetchBranches();
          await checkAuth();
        } else {
          throw new Error(res?.message || "Gagal menambahkan cabang.");
        }
      }
    } catch (err) {
      toast.error(err.message || "Terjadi kesalahan saat menyimpan cabang.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Status Aktif / Nonaktif Cabang
  const handleToggleStatus = async (branch) => {
    if (!canManage) {
      toast.error("Anda tidak memiliki izin untuk mengubah status cabang.");
      return;
    }

    if (branch.isMain) {
      toast.error(
        "Cabang Utama wajib selalu aktif dan tidak dapat dinonaktifkan."
      );
      return;
    }

    const nextStatus = !branch.isActive;
    const confirm = await showConfirmDialog({
      title: nextStatus ? "Aktifkan Cabang?" : "Nonaktifkan Cabang?",
      text: nextStatus
        ? `Cabang "${branch.name}" akan dapat dipilih kembali untuk operasional kasir.`
        : `Cabang "${branch.name}" akan dinonaktifkan dan tidak dapat digunakan untuk transaksi baru.`,
      confirmButtonText: nextStatus ? "Ya, Aktifkan" : "Ya, Nonaktifkan",
      icon: nextStatus ? "question" : "warning",
    });

    if (confirm.isConfirmed) {
      const toastId = toast.loading("Memperbarui status cabang...");
      try {
        const res = await api.put(`/branches/${branch.id}`, {
          isActive: nextStatus,
        });
        toast.dismiss(toastId);
        if (res?.success) {
          toast.success(
            `Cabang ${branch.name} berhasil di${
              nextStatus ? "aktifkan" : "nonaktifkan"
            }.`
          );
          await fetchBranches();
          await checkAuth();
        } else {
          throw new Error(res?.message || "Gagal mengubah status cabang.");
        }
      } catch (err) {
        toast.dismiss(toastId);
        toast.error(err.message || "Gagal mengubah status cabang.");
      }
    }
  };

  // Hapus Cabang
  const handleDeleteBranch = async (branch) => {
    if (!isProPlan) {
      setIsUpgradeModalOpen(true);
      return;
    }

    if (!canManage) {
      toast.error("Anda tidak memiliki izin untuk menghapus cabang.");
      return;
    }

    if (branch.isMain) {
      toast.error("Cabang Utama tidak dapat dihapus.");
      return;
    }

    const confirm = await showConfirmDialog({
      title: "Hapus Cabang Outlet?",
      text:
        t("branches.deleteBranchConfirm") ||
        `Apakah Anda yakin ingin menghapus "${branch.name}"? Riwayat transaksi lama akan tetap tersimpan di database.`,
      confirmButtonText: "Ya, Hapus Cabang",
      cancelButtonText: "Batal",
      icon: "warning",
    });

    if (confirm.isConfirmed) {
      const toastId = toast.loading("Menghapus cabang...");
      try {
        const res = await api.delete(`/branches/${branch.id}`);
        toast.dismiss(toastId);
        if (res?.success) {
          toast.success("Cabang berhasil dihapus.");
          await fetchBranches();
          await checkAuth();
        } else {
          throw new Error(res?.message || "Gagal menghapus cabang.");
        }
      } catch (err) {
        toast.dismiss(toastId);
        toast.error(err.message || "Gagal menghapus cabang.");
      }
    }
  };

  // Ganti Cabang Aktif Saat Ini
  const handleSwitchBranch = async (branch) => {
    if (branch.id === (activeBranchId || activeBranch?.id)) {
      return;
    }

    if (!branch.isActive) {
      toast.error("Cabang ini sedang nonaktif dan tidak dapat digunakan.");
      return;
    }

    try {
      setIsSwitchingId(branch.id);
      await switchBranch(branch.id);
      toast.success(
        t("branches.switchBranchSuccess", { branchName: branch.name }) ||
          `Berhasil beralih ke ${branch.name}`
      );
    } catch (err) {
      toast.error(err.message || "Gagal berpindah cabang.");
    } finally {
      setIsSwitchingId(null);
    }
  };

  // Proteksi Route Guarding
  if (!isAllowed && user) {
    return <UnauthorizedState requiredPermission="branches:view" />;
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16 animate-in fade-in duration-300">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-400/40 text-purple-800 text-xs font-extrabold tracking-wide uppercase shadow-2xs backdrop-blur-md">
            <GitBranch className="w-3.5 h-3.5 text-purple-600" />
            <span>{t("branches.badge") || "Multi-Outlet Toko"}</span>
            <span className="px-1.5 py-0.2 rounded-md bg-purple-200/80 text-[10px] font-black text-purple-900">
              PRO
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {t("branches.branchesTitle") || "Manajemen Cabang & Outlet"}
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl font-normal">
            {t("branches.branchesSubtitle") ||
              "Kelola outlet cabang toko Anda, pantau status operasional, dan alokasikan penugasan staf."}
          </p>
        </div>

        {/* Action Button: Tambah Cabang */}
        <button
          type="button"
          onClick={handleOpenAddModal}
          className="py-3 px-5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-md shadow-slate-900/15 flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>{t("branches.addBranchBtn") || "Tambah Cabang Baru"}</span>
        </button>
      </div>

      {/* 2. Banner Informasi Khusus Toko Non-PRO */}
      {!isProPlan && (
        <div className="p-6 sm:p-7 rounded-3xl bg-linear-to-r from-purple-500/10 via-purple-400/5 to-amber-500/10 backdrop-blur-xl border border-purple-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5 ring-1 ring-inset ring-purple-300/30">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-700 flex items-center justify-center shrink-0 shadow-inner">
              <Sparkles className="w-6 h-6 text-purple-600" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-slate-900">
                  {t("branches.proExclusiveTitle") ||
                    "Multi-Cabang Eksklusif Paket PRO"}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-purple-100 text-[10px] font-black text-purple-800 border border-purple-200 uppercase">
                  Paket PRO
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
                {t("branches.proExclusiveDesc") ||
                  "Kelola banyak outlet, transfer stok antar cabang, dan pantau omzet terpusat dengan mengaktifkan Paket PRO."}
              </p>
            </div>
          </div>

          <Link
            href="/dashboard/upgrade"
            className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-linear-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-extrabold text-xs shadow-md shadow-purple-600/25 transition-all active:scale-98 shrink-0"
          >
            <span>Upgrade ke Paket PRO</span>
            <ArrowRight className="w-4 h-4 text-purple-200" />
          </Link>
        </div>
      )}

      {/* 3. Grid Kartu Cabang (Frosted Glass Cards) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
            {t("branches.allBranches") || "Daftar Seluruh Cabang"}
          </h2>
          <span className="text-xs font-bold text-slate-500">
            {branches.length} Cabang Terdaftar
          </span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-64 rounded-3xl bg-white/60 backdrop-blur-xl border border-white/80 p-6 animate-pulse space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-200" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-slate-200 rounded-md w-3/4" />
                    <div className="h-3 bg-slate-200 rounded-md w-1/2" />
                  </div>
                </div>
                <div className="space-y-2 pt-4">
                  <div className="h-3 bg-slate-200 rounded-md w-full" />
                  <div className="h-3 bg-slate-200 rounded-md w-5/6" />
                </div>
              </div>
            ))}
          </div>
        ) : branches.length === 0 ? (
          <div className="p-12 rounded-3xl bg-white/80 backdrop-blur-xl border border-white/90 text-center space-y-4 shadow-sm">
            <Store className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">
              Belum ada cabang terdaftar
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {branches.map((branch) => {
              const isActiveCurrent =
                branch.id === (activeBranchId || activeBranch?.id);

              return (
                <div
                  key={branch.id}
                  className={`p-6 rounded-3xl bg-white/80 backdrop-blur-2xl border transition-all duration-200 flex flex-col justify-between space-y-5 hover:shadow-lg ${
                    isActiveCurrent
                      ? "border-amber-400/80 shadow-[0_8px_30px_rgb(251,191,36,0.12)] ring-2 ring-amber-400/40"
                      : "border-white/90 shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] hover:border-slate-300/80"
                  }`}
                >
                  {/* Top Part: Icon, Title & Badges */}
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform ${
                            isActiveCurrent
                              ? "bg-amber-500 text-white shadow-md shadow-amber-500/25"
                              : "bg-slate-100/90 text-slate-700 border border-slate-200/60"
                          }`}
                        >
                          <Store className="w-6 h-6" />
                        </div>

                        <div className="leading-tight">
                          <h3 className="text-base font-black text-slate-900 line-clamp-1">
                            {branch.name}
                          </h3>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            {branch.isMain && (
                              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider border border-amber-200/80">
                                {t("branches.mainBranchBadge") || "Cabang Utama"}
                              </span>
                            )}
                            {isActiveCurrent && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider border border-emerald-200/80">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span>
                                  {t("branches.activeBranchBadge") || "Sedang Dipakai"}
                                </span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Status Toggle Switch */}
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(branch)}
                        disabled={branch.isMain || !canManage}
                        title={
                          branch.isMain
                            ? "Cabang utama tidak dapat dinonaktifkan"
                            : branch.isActive
                            ? "Klik untuk menonaktifkan cabang"
                            : "Klik untuk mengaktifkan cabang"
                        }
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold border transition-all ${
                          branch.isMain
                            ? "bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed opacity-80"
                            : branch.isActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 cursor-pointer"
                            : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 cursor-pointer"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            branch.isActive ? "bg-emerald-500" : "bg-rose-500"
                          }`}
                        />
                        <span>
                          {branch.isActive
                            ? t("usersManagement.activeStatus") || "Aktif"
                            : t("usersManagement.inactiveStatus") || "Nonaktif"}
                        </span>
                      </button>
                    </div>

                    {/* Alamat & Telepon */}
                    <div className="space-y-2 pt-2 text-xs text-slate-600">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">
                          {branch.address || "Alamat outlet belum diatur."}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>{branch.phone || "Nomor telepon belum diatur."}</span>
                      </div>

                      <div className="flex items-center gap-2 pt-1 font-semibold text-slate-700">
                        <Users className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>
                          {branch._count?.userBranches || 0}{" "}
                          {t("branches.staffCount") || "Staf Bertugas"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action Buttons */}
                  <div className="pt-4 border-t border-slate-100/90 flex items-center justify-between gap-2">
                    {/* Switch Active Branch Button */}
                    <button
                      type="button"
                      onClick={() => handleSwitchBranch(branch)}
                      disabled={isActiveCurrent || isSwitchingId === branch.id}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
                        isActiveCurrent
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200/80 cursor-default"
                          : "bg-slate-900 hover:bg-slate-800 text-white shadow-sm shadow-slate-900/15 active:scale-95 cursor-pointer"
                      }`}
                    >
                      {isSwitchingId === branch.id ? (
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : isActiveCurrent ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>
                            {t("branches.activeBranchBadge") || "Sedang Dipakai"}
                          </span>
                        </>
                      ) : (
                        <span>
                          {t("branches.useThisBranch") || "Gunakan Cabang Ini"}
                        </span>
                      )}
                    </button>

                    {/* Edit & Delete Action Buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(branch)}
                          title={t("branches.editBranch") || "Edit Cabang"}
                          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {canManage && !branch.isMain && (
                        <button
                          type="button"
                          onClick={() => handleDeleteBranch(branch)}
                          title={t("branches.deleteBranch") || "Hapus Cabang"}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Modal Tambah / Edit Cabang */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-white/95 backdrop-blur-2xl border border-white/90 shadow-2xl p-6 sm:p-8 space-y-6 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {editingBranch
                      ? t("branches.editBranchTitle") || "Edit Data Cabang"
                      : t("branches.addBranchTitle") || "Tambah Cabang Baru"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {editingBranch
                      ? `Perbarui informasi untuk ${editingBranch.name}`
                      : "Daftarkan outlet cabang toko baru untuk operasional POS."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitBranch} className="space-y-4">
              {/* Nama Cabang */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  {t("branches.branchName") || "Nama Cabang"}{" "}
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Contoh: Cabang Dago Heritage"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-400 text-xs font-bold text-slate-900 outline-none transition-all"
                  required
                />
              </div>

              {/* Alamat Cabang */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  {t("branches.branchAddress") || "Alamat Cabang"}
                </label>
                <textarea
                  rows={3}
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="Contoh: Jl. Ir. H. Juanda No. 123, Bandung"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-400 text-xs font-semibold text-slate-900 outline-none transition-all resize-none"
                />
              </div>

              {/* Nomor Telepon Cabang */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  {t("branches.branchPhone") || "Nomor Telepon Cabang"}
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="Contoh: 081234567890"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-400 text-xs font-semibold text-slate-900 outline-none transition-all"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  {t("common.cancel") || "Batal"}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="py-2.5 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-md shadow-slate-900/15 flex items-center gap-2 transition-all active:scale-98 cursor-pointer"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>
                      {editingBranch
                        ? t("branches.saveBranch") || "Simpan Perubahan"
                        : t("branches.addBranchBtn") || "Tambah Cabang"}
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Modal Penawaran Upgrade ke PRO (Khusus Non-PRO) */}
      {isUpgradeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white/95 backdrop-blur-2xl border border-white/90 shadow-2xl p-6 sm:p-8 space-y-6 animate-in zoom-in-95 duration-200 text-center">
            <div className="w-16 h-16 rounded-3xl bg-purple-500/10 border border-purple-300 text-purple-700 flex items-center justify-center mx-auto shadow-inner">
              <Sparkles className="w-8 h-8 text-purple-600" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-bold border border-purple-200">
                <Lock className="w-3.5 h-3.5 text-purple-600" />
                <span>Eksklusif Paket PRO</span>
              </div>
              <h3 className="text-xl font-black text-slate-900">
                {t("branches.proExclusiveTitle") ||
                  "Multi-Cabang Eksklusif Paket PRO"}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                {t("branches.proExclusiveDesc") ||
                  "Kelola banyak outlet, transfer stok antar cabang, dan pantau omzet terpusat dengan mengaktifkan Paket PRO."}
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2.5">
              <Link
                href="/dashboard/upgrade"
                onClick={() => setIsUpgradeModalOpen(false)}
                className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-2xl bg-linear-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-extrabold text-xs shadow-lg shadow-purple-600/25 transition-all active:scale-98"
              >
                <span>Upgrade ke Paket PRO Sekarang</span>
                <ArrowRight className="w-4 h-4 text-purple-200" />
              </Link>
              <button
                type="button"
                onClick={() => setIsUpgradeModalOpen(false)}
                className="py-2.5 px-4 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
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
