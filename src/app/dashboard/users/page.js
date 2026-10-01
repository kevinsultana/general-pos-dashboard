"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  Shield,
  Plus,
  Search,
  Edit2,
  Trash2,
  Lock,
  Sparkles,
  Phone,
  Mail,
  Store,
  KeyRound,
  CheckCircle2,
  XCircle,
  ArrowRight,
  UserCheck,
  Check,
  X,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../../contexts/AuthContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import api from "../../../lib/api";
import { showConfirmDialog, showAlertNotice } from "../../../lib/alerts";
import UnauthorizedState from "../../../components/common/UnauthorizedState";

// Master daftar permission RBAC terstandarisasi (8 kategori)
const DEFAULT_PERMISSION_GROUPS = [
  {
    id: "settings",
    name: "Pengaturan Toko",
    description: "Pengaturan profil toko, domain, dan konfigurasi umum",
    permissions: [
      { key: "settings:view", label: "Lihat Informasi Toko", desc: "Melihat informasi identitas dan profil toko" },
      { key: "settings:manage", label: "Ubah Pengaturan Toko", desc: "Mengubah nama dan konfigurasi umum toko" },
    ],
  },
  {
    id: "branches",
    name: "Manajemen Cabang",
    description: "Daftar dan operasional outlet cabang toko",
    permissions: [
      { key: "branches:view", label: "Lihat Daftar Cabang", desc: "Melihat daftar seluruh outlet cabang toko" },
      { key: "branches:manage", label: "Kelola Outlet Cabang", desc: "Menambah, mengedit, dan menonaktifkan cabang" },
    ],
  },
  {
    id: "subscriptions",
    name: "Langganan & Paket",
    description: "Status paket langganan dan transaksi pembayaran",
    permissions: [
      { key: "subscriptions:view", label: "Lihat Status Langganan", desc: "Melihat status paket langganan dan tagihan toko" },
      { key: "subscriptions:manage", label: "Beli / Upgrade Paket", desc: "Melakukan transaksi pembayaran dan upgrade paket" },
    ],
  },
  {
    id: "roles",
    name: "Hak Akses & Peran (RBAC)",
    description: "Administrasi peran dan checklist hak akses",
    permissions: [
      { key: "roles:view", label: "Lihat Daftar Peran", desc: "Melihat daftar peran karyawan dan rincian izin" },
      { key: "roles:manage", label: "Kelola Peran & Hak Akses", desc: "Membuat, mengubah, dan menghapus peran kustom" },
    ],
  },
  {
    id: "users",
    name: "Manajemen Karyawan",
    description: "Pengelolaan akun staf kasir dan supervisor",
    permissions: [
      { key: "users:view", label: "Lihat Daftar Karyawan", desc: "Melihat daftar akun staf dan penugasan cabang" },
      { key: "users:manage", label: "Kelola Karyawan", desc: "Menambah, mengedit, atau menghapus akun staf" },
    ],
  },
  {
    id: "pos",
    name: "Terminal Kasir POS",
    description: "Operasional penjualan, transaksi, dan shift kasir",
    permissions: [
      { key: "pos:access", label: "Akses Terminal Kasir", desc: "Membuka terminal kasir dan melayani transaksi" },
      { key: "pos:shift", label: "Buka & Tutup Shift Kasir", desc: "Buka dan tutup shift kasir serta audit laci kas" },
      { key: "pos:void", label: "Void / Batalkan Transaksi", desc: "Membatalkan item pesanan yang sudah tercatat" },
    ],
  },
  {
    id: "inventory",
    name: "Inventori Produk",
    description: "Katalog produk, manajemen stok, dan opname",
    permissions: [
      { key: "inventory:view", label: "Lihat Stok & Produk", desc: "Melihat daftar produk, harga, dan sisa stok" },
      { key: "inventory:manage", label: "Kelola Stok & Produk", desc: "Menambah, mengubah produk, dan penyesuaian stok" },
    ],
  },
  {
    id: "reports",
    name: "Keuangan & Laporan",
    description: "Analitik penjualan, omzet harian, dan pembukuan",
    permissions: [
      { key: "reports:view", label: "Lihat Laporan Penjualan", desc: "Melihat grafik penjualan dan analitik pendapatan" },
      { key: "reports:export", label: "Ekspor Data Laporan", desc: "Mengunduh file laporan ke format Excel / PDF" },
    ],
  },
];

export default function UsersManagementPage() {
  const { tenant, user: currentUser, hasPermission } = useAuth();
  const { t, language } = useLanguage();

  const isFreePlan = tenant?.plan === "FREE";
  const isProPlan = tenant?.plan === "PRO";

  // Evaluasi Hak Akses Granular
  const canViewUsers = Boolean(currentUser?.isOwner || hasPermission("users:view"));
  const canViewRoles = Boolean(currentUser?.isOwner || hasPermission("roles:view"));
  const canManageUsers = Boolean(currentUser?.isOwner || hasPermission("users:manage"));
  const canManageRoles = Boolean(currentUser?.isOwner || hasPermission("roles:manage"));

  const isAllowed = canViewUsers || canViewRoles;

  useEffect(() => {
    if (!isAllowed && !isFreePlan && currentUser) {
      toast.error(
        t("common.accessDeniedToast") ||
          "Akses Ditolak: Anda tidak memiliki izin untuk fitur ini."
      );
    }
  }, [isAllowed, isFreePlan, currentUser, t]);

  const [activeTab, setActiveTab] = useState(canViewUsers ? "staff" : "roles"); // "staff" | "roles"
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [branches, setBranches] = useState([]);
  const [permissionGroups, setPermissionGroups] = useState(DEFAULT_PERMISSION_GROUPS);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Sinkronkan tab jika izin role tidak dimiliki
  useEffect(() => {
    if (!canViewRoles && activeTab === "roles") {
      setActiveTab("staff");
    }
  }, [canViewRoles, activeTab]);

  // Modal State - User
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userFormData, setUserFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    pin: "",
    roleId: "",
    branchIds: [],
    allBranchesAccess: false,
  });
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);

  // Modal State - Role
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [roleFormData, setRoleFormData] = useState({
    name: "",
    description: "",
    permissions: [],
  });
  const [isSubmittingRole, setIsSubmittingRole] = useState(false);

  // Muat data awal pengguna, peran, cabang, dan master permissions
  const fetchData = async () => {
    if (isFreePlan) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const [usersRes, rolesRes, branchesRes, permsRes] = await Promise.all([
        canViewUsers
          ? api.get("/users").catch(() => ({ success: false, data: [] }))
          : Promise.resolve({ success: true, data: [] }),
        canViewRoles
          ? api.get("/roles").catch(() => ({ success: false, data: [] }))
          : Promise.resolve({ success: true, data: [] }),
        api.get("/branches").catch(() => ({ success: false, data: [] })),
        api.get("/roles/permissions").catch(() => ({ success: false, data: null })),
      ]);

      if (usersRes?.success) setUsers(usersRes.data || []);
      if (rolesRes?.success) setRoles(rolesRes.data || []);
      if (branchesRes?.success) setBranches(branchesRes.data || []);
      if (permsRes?.success && permsRes.data?.grouped && permsRes.data.grouped.length > 0) {
        setPermissionGroups(permsRes.data.grouped);
      }
    } catch (err) {
      console.error("Gagal memuat data staf & peran:", err);
      toast.error(err.message || "Gagal memuat data karyawan & peran.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isFreePlan, canViewUsers, canViewRoles]);

  // Filter daftar staf berdasarkan pencarian
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const query = searchQuery.toLowerCase();
    return users.filter(
      (u) =>
        u.name?.toLowerCase().includes(query) ||
        u.email?.toLowerCase().includes(query) ||
        u.phone?.toLowerCase().includes(query) ||
        u.role?.name?.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  // Buka modal tambah karyawan baru
  const handleOpenAddUser = () => {
    const defaultRoleId = roles.find((r) => r.name === "KASIR")?.id || roles[0]?.id || "";
    setEditingUser(null);
    setUserFormData({
      name: "",
      email: "",
      password: "",
      phone: "",
      pin: "",
      roleId: defaultRoleId,
      branchIds: branches.length > 0 ? [branches[0].id] : [],
      allBranchesAccess: false,
    });
    setIsUserModalOpen(true);
  };

  // Buka modal edit karyawan
  const handleOpenEditUser = (userItem) => {
    setEditingUser(userItem);
    setUserFormData({
      name: userItem.name || "",
      email: userItem.email || "",
      password: "", // Kosongkan password saat edit
      phone: userItem.phone || "",
      pin: userItem.pin || "",
      roleId: userItem.roleId || "",
      branchIds: userItem.userBranches?.map((ub) => ub.branchId) || [],
      allBranchesAccess: Boolean(userItem.allBranchesAccess),
    });
    setIsUserModalOpen(true);
  };

  // Submit form simpan karyawan
  const handleSaveUser = async (e) => {
    e?.preventDefault();
    if (!userFormData.name.trim()) {
      toast.error("Nama lengkap karyawan wajib diisi.");
      return;
    }
    if (!editingUser && !userFormData.email.trim()) {
      toast.error("Email karyawan wajib diisi.");
      return;
    }
    if (!editingUser && (!userFormData.password || userFormData.password.length < 6)) {
      toast.error("Kata sandi minimal 6 karakter.");
      return;
    }
    if (!userFormData.roleId) {
      toast.error("Peran (Role) wajib dipilih.");
      return;
    }

    setIsSubmittingUser(true);
    const toastId = toast.loading(editingUser ? "Memperbarui data staf..." : "Mendaftarkan karyawan baru...");

    try {
      if (editingUser) {
        // PUT /api/users/:id
        const payload = {
          name: userFormData.name.trim(),
          phone: userFormData.phone?.trim() || null,
          pin: userFormData.pin?.trim() || null,
          roleId: userFormData.roleId,
          allBranchesAccess: userFormData.allBranchesAccess,
          branchIds: userFormData.branchIds,
        };
        if (userFormData.password.trim()) {
          payload.password = userFormData.password.trim();
        }

        const res = await api.put(`/users/${editingUser.id}`, payload);
        toast.dismiss(toastId);
        if (res?.success) {
          toast.success("Data karyawan berhasil diperbarui.");
          setIsUserModalOpen(false);
          fetchData();
        } else {
          throw new Error(res?.message || "Gagal memperbarui data karyawan.");
        }
      } else {
        // POST /api/users
        const payload = {
          name: userFormData.name.trim(),
          email: userFormData.email.trim(),
          password: userFormData.password,
          phone: userFormData.phone?.trim() || null,
          pin: userFormData.pin?.trim() || null,
          roleId: userFormData.roleId,
          allBranchesAccess: userFormData.allBranchesAccess,
          branchIds: userFormData.branchIds,
        };

        const res = await api.post("/users", payload);
        toast.dismiss(toastId);
        if (res?.success) {
          toast.success("Karyawan baru berhasil ditambahkan.");
          setIsUserModalOpen(false);
          fetchData();
        } else {
          throw new Error(res?.message || "Gagal menambahkan karyawan.");
        }
      }
    } catch (err) {
      toast.dismiss(toastId);
      toast.error(err.message || "Terjadi kesalahan saat memproses data.");
    } finally {
      setIsSubmittingUser(false);
    }
  };

  // Toggle status aktif/nonaktif user
  const handleToggleUserStatus = async (userItem) => {
    if (userItem.isOwner) {
      toast.error("Akun Pemilik Toko (Owner) tidak dapat dinonaktifkan.");
      return;
    }

    const nextStatus = !userItem.isActive;
    const confirm = await showConfirmDialog({
      title: nextStatus ? "Aktifkan Karyawan?" : "Nonaktifkan Karyawan?",
      text: nextStatus
        ? `Akun ${userItem.name} akan dapat kembali login dan mengakses sistem kasir.`
        : `Akun ${userItem.name} tidak akan dapat login sampai diaktifkan kembali.`,
      confirmButtonText: nextStatus ? "Ya, Aktifkan" : "Ya, Nonaktifkan",
      icon: nextStatus ? "question" : "warning",
    });

    if (confirm.isConfirmed) {
      const toastId = toast.loading("Memperbarui status karyawan...");
      try {
        const res = await api.put(`/users/${userItem.id}`, { isActive: nextStatus });
        toast.dismiss(toastId);
        if (res?.success) {
          toast.success(`Karyawan ${userItem.name} berhasil di${nextStatus ? "aktifkan" : "nonaktifkan"}.`);
          fetchData();
        } else {
          throw new Error(res?.message || "Gagal mengubah status karyawan.");
        }
      } catch (err) {
        toast.dismiss(toastId);
        toast.error(err.message || "Gagal mengubah status karyawan.");
      }
    }
  };

  // Hapus Karyawan
  const handleDeleteUser = async (userItem) => {
    if (userItem.isOwner) {
      toast.error("Akun Pemilik Toko (Owner) tidak dapat dihapus.");
      return;
    }

    const confirm = await showConfirmDialog({
      title: "Hapus Akun Karyawan?",
      text: `Apakah Anda yakin ingin menghapus akun "${userItem.name}"? Riwayat transaksi lama akan tetap tersimpan di database.`,
      confirmButtonText: "Ya, Hapus Akun",
      cancelButtonText: "Batal",
      icon: "warning",
    });

    if (confirm.isConfirmed) {
      const toastId = toast.loading("Menghapus akun staf...");
      try {
        const res = await api.delete(`/users/${userItem.id}`);
        toast.dismiss(toastId);
        if (res?.success) {
          toast.success("Akun karyawan berhasil dihapus.");
          fetchData();
        } else {
          throw new Error(res?.message || "Gagal menghapus karyawan.");
        }
      } catch (err) {
        toast.dismiss(toastId);
        toast.error(err.message || "Gagal menghapus karyawan.");
      }
    }
  };

  // Buka modal tambah peran kustom
  const handleOpenAddRole = () => {
    setEditingRole(null);
    setRoleFormData({
      name: "",
      description: "",
      permissions: ["pos:access", "pos:shift"],
    });
    setIsRoleModalOpen(true);
  };

  // Buka modal edit peran
  const handleOpenEditRole = (roleItem) => {
    setEditingRole(roleItem);
    let perms = roleItem.permissions || [];
    if (typeof perms === "string") {
      try {
        perms = JSON.parse(perms);
      } catch {
        perms = [perms];
      }
    }
    setRoleFormData({
      name: roleItem.name || "",
      description: roleItem.description || "",
      permissions: Array.isArray(perms) ? perms : [],
    });
    setIsRoleModalOpen(true);
  };

  // Toggle checklist permission
  const handleTogglePermission = (permKey) => {
    setRoleFormData((prev) => {
      const exists = prev.permissions.includes(permKey);
      if (exists) {
        return { ...prev, permissions: prev.permissions.filter((p) => p !== permKey) };
      } else {
        return { ...prev, permissions: [...prev.permissions, permKey] };
      }
    });
  };

  // Pilih semua permission dalam 1 kategori
  const handleSelectAllInGroup = (groupId) => {
    const group = permissionGroups.find((g) => g.id === groupId);
    if (!group) return;
    const groupKeys = group.permissions.map((p) => p.key);
    setRoleFormData((prev) => {
      const merged = Array.from(new Set([...prev.permissions, ...groupKeys]));
      return { ...prev, permissions: merged };
    });
  };

  // Hapus semua permission dalam 1 kategori
  const handleClearAllInGroup = (groupId) => {
    const group = permissionGroups.find((g) => g.id === groupId);
    if (!group) return;
    const groupKeys = new Set(group.permissions.map((p) => p.key));
    setRoleFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.filter(
        (k) => !groupKeys.has(k) && k !== `${groupId}:*` && k !== "*"
      ),
    }));
  };

  // Helper judul grup izin dari kamus bahasa
  const getGroupTitle = (groupId, fallback) => {
    switch (groupId) {
      case "settings":
        return t("usersManagement.groupSettings") || "Pengaturan Toko";
      case "branches":
        return t("usersManagement.groupBranches") || "Manajemen Cabang";
      case "subscriptions":
        return t("usersManagement.groupSubscriptions") || "Langganan & Upgrade";
      case "roles":
        return t("usersManagement.groupRoles") || "Hak Akses & Peran (RBAC)";
      case "users":
        return t("usersManagement.groupUsers") || "Manajemen Karyawan";
      case "pos":
        return t("usersManagement.groupPos") || "Terminal Kasir & POS";
      case "inventory":
        return t("usersManagement.groupInventory") || "Inventori & Produk";
      case "reports":
        return t("usersManagement.groupReports") || "Laporan & Transaksi";
      default:
        return fallback;
    }
  };

  // Submit form simpan peran
  const handleSaveRole = async (e) => {
    e?.preventDefault();
    if (!roleFormData.name.trim()) {
      toast.error("Nama peran wajib diisi.");
      return;
    }
    if (roleFormData.permissions.length === 0) {
      toast.error("Pilih minimal satu hak akses.");
      return;
    }

    setIsSubmittingRole(true);
    const toastId = toast.loading(editingRole ? "Menyimpan perubahan peran..." : "Membuat peran kustom baru...");

    try {
      if (editingRole) {
        const payload = {
          description: roleFormData.description?.trim() || null,
          permissions: roleFormData.permissions,
        };
        if (!editingRole.isSystem) {
          payload.name = roleFormData.name.trim().toUpperCase();
        }

        const res = await api.put(`/roles/${editingRole.id}`, payload);
        toast.dismiss(toastId);
        if (res?.success) {
          toast.success("Peran berhasil diperbarui.");
          setIsRoleModalOpen(false);
          fetchData();
        } else {
          throw new Error(res?.message || "Gagal memperbarui peran.");
        }
      } else {
        const payload = {
          name: roleFormData.name.trim().toUpperCase(),
          description: roleFormData.description?.trim() || null,
          permissions: roleFormData.permissions,
        };

        const res = await api.post("/roles", payload);
        toast.dismiss(toastId);
        if (res?.success) {
          toast.success("Peran kustom baru berhasil dibuat.");
          setIsRoleModalOpen(false);
          fetchData();
        } else {
          throw new Error(res?.message || "Gagal membuat peran kustom.");
        }
      }
    } catch (err) {
      toast.dismiss(toastId);
      toast.error(err.message || "Terjadi kesalahan saat memproses peran.");
    } finally {
      setIsSubmittingRole(false);
    }
  };

  // Hapus Peran
  const handleDeleteRole = async (roleItem) => {
    if (roleItem.isSystem) {
      toast.error("Peran bawaan sistem tidak dapat dihapus.");
      return;
    }

    const confirm = await showConfirmDialog({
      title: "Hapus Peran Kustom?",
      text: `Apakah Anda yakin ingin menghapus peran "${roleItem.name}"? Pastikan tidak ada karyawan aktif yang menggunakan peran ini.`,
      confirmButtonText: "Ya, Hapus Peran",
      cancelButtonText: "Batal",
      icon: "warning",
    });

    if (confirm.isConfirmed) {
      const toastId = toast.loading("Menghapus peran...");
      try {
        const res = await api.delete(`/roles/${roleItem.id}`);
        toast.dismiss(toastId);
        if (res?.success) {
          toast.success("Peran berhasil dihapus.");
          fetchData();
        } else {
          throw new Error(res?.message || "Gagal menghapus peran.");
        }
      } catch (err) {
        toast.dismiss(toastId);
        toast.error(err.message || "Gagal menghapus peran.");
      }
    }
  };

  // Dapatkan style badge untuk peran
  const getRoleBadge = (roleName) => {
    switch (roleName?.toUpperCase()) {
      case "OWNER":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "MANAGER":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "KASIR":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      default:
        return "bg-amber-100 text-amber-800 border-amber-200";
    }
  };

  // Proteksi Hak Akses (RBAC Guard)
  if (!isFreePlan && !isAllowed && currentUser) {
    return <UnauthorizedState requiredPermission="users:view" />;
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16 animate-in fade-in duration-300">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-400/40 text-amber-800 text-xs font-extrabold tracking-wide uppercase shadow-2xs backdrop-blur-md">
            <Users className="w-3.5 h-3.5 text-amber-600" />
            <span>{t("usersManagement.badge") || "RBAC & Akses Pengguna"}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {t("usersManagement.title") || "Kelola Karyawan & Hak Akses"}
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl font-normal">
            {t("usersManagement.subtitle") ||
              "Atur akun staf kasir, supervisor, dan tentukan batasan hak akses per peran."}
          </p>
        </div>

        {/* Action Button: Tambah Staf / Peran */}
        {!isFreePlan && (
          <div className="flex items-center gap-3">
            {activeTab === "staff" && canManageUsers && (
              <button
                type="button"
                onClick={handleOpenAddUser}
                className="py-3 px-5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-md shadow-slate-900/15 flex items-center gap-2 transition-all active:scale-98 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-amber-400" />
                <span>{t("usersManagement.addUserBtn") || "Tambah Karyawan"}</span>
              </button>
            )}
            {activeTab === "roles" && canManageRoles && (
              <button
                type="button"
                onClick={handleOpenAddRole}
                className="py-3 px-5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-md shadow-slate-900/15 flex items-center gap-2 transition-all active:scale-98 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-amber-400" />
                <span>{t("usersManagement.addRoleBtn") || "Tambah Peran Kustom"}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* 2. Banner Proteksi Khusus Paket FREE */}
      {isFreePlan ? (
        <div className="p-8 sm:p-12 rounded-3xl bg-white/85 backdrop-blur-2xl border border-white/90 shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] ring-1 ring-inset ring-white/70 text-center space-y-6 max-w-2xl mx-auto my-8">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-400/40 text-amber-700 flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-8 h-8 text-amber-600" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Khusus Paket PLUS & PRO</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              {t("usersManagement.freeRestrictionTitle") || "Fitur Multi-User dan Hak Akses Karyawan"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              {t("usersManagement.freeRestrictionDesc") ||
                "Fitur Multi-User dan Hak Akses Karyawan hanya tersedia di Paket PLUS & PRO. Silakan upgrade toko Anda untuk menambahkan akun kasir dan staf."}
            </p>
          </div>

          <div className="pt-2">
            <Link
              href="/dashboard/upgrade"
              className="inline-flex items-center justify-center gap-2 py-3.5 px-8 rounded-2xl bg-linear-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/25 transition-all active:scale-98"
            >
              <span>{t("usersManagement.upgradeBtn") || "Upgrade ke Paket PLUS / PRO"}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* 3. Navigation Tabs */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-200/50 backdrop-blur-xl border border-white/60 w-fit">
            {canViewUsers && (
              <button
                type="button"
                onClick={() => setActiveTab("staff")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  activeTab === "staff"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>{t("usersManagement.staffTab") || "Daftar Karyawan"}</span>
                <span className="ml-1 px-1.5 py-0.2 rounded-md bg-slate-100 text-[10px] text-slate-600 font-bold">
                  {users.length}
                </span>
              </button>
            )}

            {canViewRoles && (
              <button
                type="button"
                onClick={() => setActiveTab("roles")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  activeTab === "roles"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>{t("usersManagement.rolesTab") || "Kelola Peran (Roles)"}</span>
                <span className="ml-1 px-1.5 py-0.2 rounded-md bg-slate-100 text-[10px] text-slate-600 font-bold">
                  {roles.length}
                </span>
              </button>
            )}
          </div>

          {/* 4. Tab Content: Daftar Karyawan */}
          {activeTab === "staff" && (
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="flex items-center gap-3 p-2 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/90 shadow-2xs">
                <Search className="w-4 h-4 text-slate-400 ml-2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("usersManagement.searchPlaceholder") || "Cari nama, email, nomor hp, atau peran..."}
                  className="w-full bg-transparent text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="p-1 text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* Tabel Frosted Glass Karyawan */}
              <div className="rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] ring-1 ring-inset ring-white/70 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                        <th className="py-4 px-6">{t("usersManagement.thName") || "Nama & Email"}</th>
                        <th className="py-4 px-6">{t("usersManagement.thPhone") || "Nomor Telepon"}</th>
                        <th className="py-4 px-6">{t("usersManagement.thRole") || "Peran (Role)"}</th>
                        <th className="py-4 px-6">{t("usersManagement.thBranch") || "Cabang Bertugas"}</th>
                        <th className="py-4 px-6">{t("usersManagement.thStatus") || "Status"}</th>
                        <th className="py-4 px-6 text-right">{t("usersManagement.thActions") || "Aksi"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                      {isLoading ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-400">
                            <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                            <span>Memuat daftar karyawan...</span>
                          </td>
                        </tr>
                      ) : filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-400">
                            <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                            <span>Tidak ada karyawan yang ditemukan.</span>
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                            {/* Nama & Email */}
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-linear-to-br from-amber-400 to-amber-600 text-slate-950 font-black text-xs flex items-center justify-center shadow-2xs shrink-0">
                                  {item.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="leading-tight">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-slate-900">{item.name}</span>
                                    {item.isOwner && (
                                      <span className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 text-[9px] font-black uppercase">
                                        Owner
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-slate-500 mt-0.5">{item.email}</p>
                                </div>
                              </div>
                            </td>

                            {/* Nomor Telepon */}
                            <td className="py-4 px-6 font-mono text-[11px]">
                              {item.phone || <span className="text-slate-300">-</span>}
                            </td>

                            {/* Role Badge */}
                            <td className="py-4 px-6">
                              <span
                                className={`px-2.5 py-1 rounded-lg border text-[11px] font-extrabold uppercase tracking-wide ${getRoleBadge(
                                  item.role?.name
                                )}`}
                              >
                                {item.role?.name || "Kasir"}
                              </span>
                            </td>

                            {/* Cabang Bertugas */}
                            <td className="py-4 px-6">
                              {item.allBranchesAccess ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-extrabold">
                                  <Store className="w-3 h-3 text-emerald-600" />
                                  <span>{t("usersManagement.allBranches") || "Semua Cabang"}</span>
                                </span>
                              ) : item.userBranches && item.userBranches.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {item.userBranches.map((ub) => (
                                    <span
                                      key={ub.id || ub.branchId}
                                      className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold border border-slate-200"
                                    >
                                      {ub.branch?.name || "Cabang Utama"}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-slate-400 text-[11px]">
                                  {t("usersManagement.mainBranchOnly") || "Cabang Utama"}
                                </span>
                              )}
                            </td>

                            {/* Status (Aktif / Nonaktif Switch) */}
                            <td className="py-4 px-6">
                              <button
                                type="button"
                                onClick={() => handleToggleUserStatus(item)}
                                disabled={item.isOwner || !canManageUsers}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold border transition-all ${
                                  item.isOwner || !canManageUsers
                                    ? "bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed opacity-80"
                                    : item.isActive
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 cursor-pointer"
                                    : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 cursor-pointer"
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    item.isActive ? "bg-emerald-500" : "bg-rose-500"
                                  }`}
                                />
                                <span>{item.isActive ? "Aktif" : "Nonaktif"}</span>
                              </button>
                            </td>

                            {/* Tombol Aksi */}
                            <td className="py-4 px-6 text-right">
                              {canManageUsers ? (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditUser(item)}
                                    title="Edit Karyawan"
                                    className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  {!item.isOwner && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteUser(item)}
                                      title="Hapus Karyawan"
                                      className="p-1.5 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-400 text-xs italic">-</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 5. Tab Content: Kelola Peran & Hak Akses (RBAC) */}
          {activeTab === "roles" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {roles.map((roleItem) => {
                  let perms = roleItem.permissions || [];
                  if (typeof perms === "string") {
                    try {
                      perms = JSON.parse(perms);
                    } catch {
                      perms = [perms];
                    }
                  }

                  const isOwnerRole = roleItem.name === "OWNER";

                  return (
                    <div
                      key={roleItem.id}
                      className="p-6 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] ring-1 ring-inset ring-white/70 flex flex-col justify-between space-y-4 relative"
                    >
                      <div>
                        {/* Header Kartu Peran */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="text-base font-black text-slate-900 tracking-tight">
                                {roleItem.name}
                              </h3>
                              {roleItem.isSystem ? (
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-extrabold uppercase border border-slate-200">
                                  Bawaan Sistem
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-extrabold uppercase border border-amber-200">
                                  Kustom
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 line-clamp-2">
                              {roleItem.description || "Peran operasional toko."}
                            </p>
                          </div>

                          {canManageRoles && (
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleOpenEditRole(roleItem)}
                                title="Edit Hak Akses Peran"
                                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              {!roleItem.isSystem && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteRole(roleItem)}
                                  title="Hapus Peran Kustom"
                                  className="p-1.5 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Jumlah User */}
                        <div className="mt-4 flex items-center gap-2 text-xs text-slate-600">
                          <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            Digunakan oleh{" "}
                            <strong className="font-extrabold text-slate-900">
                              {roleItem._count?.users || 0}
                            </strong>{" "}
                            karyawan
                          </span>
                        </div>

                        {/* List Permissions Preview */}
                        <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                            Cakupan Hak Akses:
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {isOwnerRole ? (
                              <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-800 border border-purple-200 text-[10px] font-extrabold">
                                Akses Penuh Superadmin (*)
                              </span>
                            ) : Array.isArray(perms) && perms.length > 0 ? (
                              perms.map((p, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-mono font-bold"
                                >
                                  {p}
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] text-slate-400">Belum ada hak akses.</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* 6. Modal Tambah / Edit Karyawan */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-white/95 backdrop-blur-2xl border border-white/90 shadow-2xl p-6 sm:p-8 space-y-6 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-black">
                  <Users className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {editingUser ? "Edit Data Karyawan" : "Tambah Karyawan Baru"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {editingUser
                      ? "Perbarui profil staf dan cabang penugasan."
                      : "Buat akun login baru untuk kasir atau supervisor toko."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsUserModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4">
              {/* Nama Lengkap */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={userFormData.name}
                  onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                  placeholder="Contoh: Siti Rahmawati"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-400 text-xs font-bold text-slate-900 outline-none"
                  required
                />
              </div>

              {/* Email Login */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Email Login <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  value={userFormData.email}
                  disabled={Boolean(editingUser)}
                  onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                  placeholder="kasir@toko.com"
                  className={`w-full px-4 py-2.5 rounded-xl border text-xs font-bold outline-none ${
                    editingUser
                      ? "bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed"
                      : "bg-slate-50 border-slate-200 focus:bg-white focus:border-amber-400 text-slate-900"
                  }`}
                  required
                />
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Kata Sandi {editingUser ? "(Kosongkan jika tidak diubah)" : <span className="text-rose-500">*</span>}
                </label>
                <input
                  type="password"
                  value={userFormData.password}
                  onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                  placeholder="Minimal 6 karakter..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-400 text-xs font-bold text-slate-900 outline-none"
                  required={!editingUser}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nomor HP */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Nomor WhatsApp / HP
                  </label>
                  <input
                    type="tel"
                    value={userFormData.phone}
                    onChange={(e) => setUserFormData({ ...userFormData, phone: e.target.value })}
                    placeholder="08123456789"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-400 text-xs font-bold text-slate-900 outline-none"
                  />
                </div>

                {/* PIN Kasir */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    PIN Kasir (4-6 Angka)
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    value={userFormData.pin}
                    onChange={(e) => setUserFormData({ ...userFormData, pin: e.target.value })}
                    placeholder="1234"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-400 text-xs font-bold text-slate-900 outline-none"
                  />
                </div>
              </div>

              {/* Pilihan Peran (Role Dropdown) */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Peran & Hak Akses <span className="text-rose-500">*</span>
                </label>
                <select
                  value={userFormData.roleId}
                  onChange={(e) => setUserFormData({ ...userFormData, roleId: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-400 text-xs font-bold text-slate-900 outline-none cursor-pointer"
                  required
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} - {r.description || "Peran"}
                    </option>
                  ))}
                </select>
              </div>

              {/* Penugasan Cabang */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Penugasan Cabang
                </label>

                {isProPlan ? (
                  <div className="space-y-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={userFormData.allBranchesAccess}
                        onChange={(e) =>
                          setUserFormData({
                            ...userFormData,
                            allBranchesAccess: e.target.checked,
                          })
                        }
                        className="rounded text-amber-500 focus:ring-amber-400"
                      />
                      <span>Akses ke Seluruh Cabang (All Outlets)</span>
                    </label>

                    {!userFormData.allBranchesAccess && (
                      <div className="pt-2 border-t border-slate-200/60 space-y-1.5">
                        <p className="text-[11px] text-slate-500">Pilih cabang khusus karyawan ini:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {branches.map((b) => {
                            const isChecked = userFormData.branchIds.includes(b.id);
                            return (
                              <label
                                key={b.id}
                                className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                                  isChecked
                                    ? "bg-amber-50 border-amber-300 text-amber-900"
                                    : "bg-white border-slate-200 text-slate-700"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setUserFormData({
                                        ...userFormData,
                                        branchIds: [...userFormData.branchIds, b.id],
                                      });
                                    } else {
                                      setUserFormData({
                                        ...userFormData,
                                        branchIds: userFormData.branchIds.filter((id) => id !== b.id),
                                      });
                                    }
                                  }}
                                  className="rounded text-amber-500"
                                />
                                <span className="truncate">{b.name}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">
                      {t("usersManagement.assignedToMain") || "Ditugaskan ke Cabang Utama"}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-black uppercase">
                      Paket PLUS
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingUser}
                  className="py-2.5 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-md shadow-slate-900/15 flex items-center gap-2 transition-all active:scale-98 cursor-pointer"
                >
                  {isSubmittingUser ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>{editingUser ? "Simpan Perubahan" : "Tambah Karyawan"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Modal Tambah / Edit Peran Kustom (RBAC) */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-xl rounded-3xl bg-white/95 backdrop-blur-2xl border border-white/90 shadow-2xl p-6 sm:p-8 space-y-6 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-black">
                  <Shield className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {editingRole ? `Edit Peran: ${editingRole.name}` : "Tambah Peran Kustom Baru"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Tentukan nama peran dan pilih batasan hak akses yang diizinkan.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRoleModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRole} className="space-y-5">
              {/* Nama Peran */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Nama Peran (Role Name) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={roleFormData.name}
                  disabled={Boolean(editingRole?.isSystem)}
                  onChange={(e) => setRoleFormData({ ...roleFormData, name: e.target.value })}
                  placeholder="Contoh: SUPERVISOR"
                  className={`w-full px-4 py-2.5 rounded-xl border text-xs font-bold uppercase tracking-wider outline-none ${
                    editingRole?.isSystem
                      ? "bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed"
                      : "bg-slate-50 border-slate-200 focus:bg-white focus:border-amber-400 text-slate-900"
                  }`}
                  required
                />
              </div>

              {/* Deskripsi Peran */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Deskripsi Tanggung Jawab
                </label>
                <input
                  type="text"
                  value={roleFormData.description}
                  onChange={(e) => setRoleFormData({ ...roleFormData, description: e.target.value })}
                  placeholder="Contoh: Pengawas shift kasir dan persetujuan void pesanan"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-400 text-xs font-bold text-slate-900 outline-none"
                />
              </div>

              {/* Checklist Hak Akses Berkelompok */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                    Daftar Hak Akses (Permissions)
                  </label>
                  <span className="text-[11px] font-bold text-amber-700">
                    {roleFormData.permissions.length} dipilih
                  </span>
                </div>

                <div className="space-y-3.5">
                  {permissionGroups.map((group) => {
                    const groupKeys = group.permissions.map((p) => p.key);
                    const selectedCount = groupKeys.filter(
                      (k) =>
                        roleFormData.permissions.includes(k) ||
                        roleFormData.permissions.includes("*") ||
                        roleFormData.permissions.includes(`${group.id}:*`)
                    ).length;
                    const isAllSelected =
                      groupKeys.length > 0 && selectedCount === groupKeys.length;

                    return (
                      <div
                        key={group.id}
                        className="p-4 rounded-2xl bg-white/70 backdrop-blur-md border border-slate-200/80 shadow-xs space-y-3 transition-all hover:border-slate-300"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-black text-slate-900">
                                {getGroupTitle(group.id, group.name)}
                              </p>
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-600 border border-slate-200">
                                {selectedCount}/{group.permissions.length}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                              {group.description}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleSelectAllInGroup(group.id)}
                              disabled={isAllSelected}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                                isAllSelected
                                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                  : "bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 border border-amber-300/60 cursor-pointer active:scale-95"
                              }`}
                            >
                              {t("usersManagement.selectAll") || "Pilih Semua"}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleClearAllInGroup(group.id)}
                              disabled={selectedCount === 0}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                                selectedCount === 0
                                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                  : "bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 hover:border-rose-200 cursor-pointer active:scale-95"
                              }`}
                            >
                              {t("usersManagement.clearAll") || "Hapus Semua"}
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5">
                          {group.permissions.map((perm) => {
                            const isChecked =
                              roleFormData.permissions.includes(perm.key) ||
                              roleFormData.permissions.includes("*") ||
                              roleFormData.permissions.includes(`${group.id}:*`);

                            return (
                              <label
                                key={perm.key}
                                className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                                  isChecked
                                    ? "bg-amber-50/90 border-amber-300 text-slate-900 shadow-2xs ring-1 ring-amber-300/40"
                                    : "bg-white/90 border-slate-200/80 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleTogglePermission(perm.key)}
                                  className="mt-0.5 rounded text-amber-500 focus:ring-amber-400 cursor-pointer"
                                />
                                <div className="leading-tight select-none">
                                  <p className="font-bold text-[11px] text-slate-900">
                                    {perm.label}
                                  </p>
                                  <p className="text-[10px] text-slate-500 font-normal mt-0.5 leading-snug">
                                    {perm.desc}
                                  </p>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRoleModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRole}
                  className="py-2.5 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-md shadow-slate-900/15 flex items-center gap-2 transition-all active:scale-98 cursor-pointer"
                >
                  {isSubmittingRole ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>{editingRole ? "Simpan Perubahan Peran" : "Buat Peran Kustom"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
