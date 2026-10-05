"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Settings,
  Store,
  Calendar,
  Sparkles,
  Smartphone,
  Download,
  Copy,
  Check,
  ArrowRight,
  Crown,
  Clock,
  User,
  Save,
  Layers,
  Printer,
  Power,
  Sliders,
  FileText,
  RefreshCw,
  Coins,
  Upload,
  Image as ImageIcon,
  Trash2,
  Eye,
  Info,
  FileImage,
  ExternalLink,
  Search,
  HardDrive,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../../contexts/AuthContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import api from "../../../lib/api";
import { showAlertNotice, showConfirmDialog } from "../../../lib/alerts";
import UnauthorizedState from "../../../components/common/UnauthorizedState";
import { useBluetooth, BLE_PROFILES, buildReceiptBytes } from "../../../contexts/BluetoothPrinterContext";
import BluetoothModal from "../../../components/bluetooth/BluetoothModal";
import { cn, compressImage } from "../../../lib/utils";

// ─── Format Bytes Helper ───────────────────────────────────────────────────────
const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return "0 KB";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

export default function StoreSettingsPage() {
  const { tenant, user, checkAuth, hasPermission, activeBranch, activeBranchId } = useAuth();
  const { t, language } = useLanguage();

  // Tab Aktif: "store" | "printer" | "rounding" | "media"
  const [activeTab, setActiveTab] = useState("store");

  // ─── Tab 1: Pengaturan Toko ──────────────────────────────────────────────────
  const [storeName, setStoreName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Logo Toko & Opsi Cetak Struk
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isDeletingLogo, setIsDeletingLogo] = useState(false);
  const [receiptShowLogo, setReceiptShowLogo] = useState(true);
  const [isTogglingLogo, setIsTogglingLogo] = useState(false);

  // ─── Tab 2: Bluetooth Thermal Printer ────────────────────────────────────────
  const {
    btStatus,
    btDeviceName,
    btServiceUuid,
    setBtServiceUuid,
    btErrorMsg,
    isConnected,
    isReconnecting,
    connect,
    disconnect,
    printBytes,
  } = useBluetooth();

  const [showBtModal, setShowBtModal] = useState(false);
  const [printerWidth, setPrinterWidth] = useState(58);
  const [receiptFontSize, setReceiptFontSize] = useState("NORMAL");
  const [isTestPrinting, setIsTestPrinting] = useState(false);

  // ─── Tab 3: Pengaturan Pembulatan Transaksi ─────────────────────────────────
  const [roundingMode, setRoundingMode] = useState(0);

  // ─── Tab 4: Manajemen Media (MinIO) ─────────────────────────────────────────
  const [mediaItems, setMediaItems] = useState([]);
  const [mediaSummary, setMediaSummary] = useState({
    totalFiles: 0,
    totalUsed: 0,
    totalUnused: 0,
    totalBytes: 0,
  });
  const [isMediaLoading, setIsMediaLoading] = useState(false);
  const [mediaFilter, setMediaFilter] = useState("ALL"); // "ALL" | "USED" | "UNUSED"
  const [mediaSearch, setMediaSearch] = useState("");
  const [previewMediaUrl, setPreviewMediaUrl] = useState(null);
  const [isDeletingMediaKey, setIsDeletingMediaKey] = useState(null);

  // ─── Load Local Storage Preferences ──────────────────────────────────────────
  useEffect(() => {
    try {
      const savedWidth = localStorage.getItem("omnipos_printer_width");
      if (savedWidth) setPrinterWidth(Number(savedWidth));
      const savedFont = localStorage.getItem("omnipos_receipt_font_size");
      if (savedFont) setReceiptFontSize(savedFont);
      const savedRounding = localStorage.getItem("omnipos_rounding_mode");
      if (savedRounding !== null) setRoundingMode(Number(savedRounding));
    } catch {}
  }, []);

  // Sinkronkan nama toko & logo awal dari database
  useEffect(() => {
    if (tenant?.name) setStoreName(tenant.name);
    if (tenant?.logoUrl) setLogoPreview(tenant.logoUrl);
    else setLogoPreview(null);
    if (typeof tenant?.receiptShowLogo === "boolean") {
      setReceiptShowLogo(tenant.receiptShowLogo);
    }
  }, [tenant?.name, tenant?.logoUrl, tenant?.receiptShowLogo]);

  // Proteksi Hak Akses
  const isAllowed = user?.isOwner || hasPermission("settings:view");
  const canManage = user?.isOwner || hasPermission("settings:manage");

  useEffect(() => {
    if (!isAllowed && user) {
      toast.error(
        t("common.accessDeniedToast") ||
          "Akses Ditolak: Anda tidak memiliki izin untuk fitur ini."
      );
    }
  }, [isAllowed, user, t]);

  // ─── Fetch Media MinIO ───────────────────────────────────────────────────────
  const fetchMedia = useCallback(async () => {
    try {
      setIsMediaLoading(true);
      const branchQuery = activeBranchId ? `?branchId=${activeBranchId}` : "";
      const res = await api.get(`/media${branchQuery}`);
      if (res?.success) {
        setMediaItems(res.data.items || []);
        if (res.data.summary) {
          setMediaSummary(res.data.summary);
        }
      }
    } catch (err) {
      toast.error(err.message || "Gagal memuat daftar media MinIO.");
    } finally {
      setIsMediaLoading(false);
    }
  }, [activeBranchId]);

  useEffect(() => {
    if (activeTab === "media" && isAllowed) {
      fetchMedia();
    }
  }, [activeTab, isAllowed, fetchMedia]);

  // ─── Handler Aksi Media ──────────────────────────────────────────────────────
  const handleDeleteMedia = async (item) => {
    if (!canManage) {
      toast.error("Akses Ditolak: Anda tidak memiliki izin untuk menghapus media.");
      return;
    }

    const isUsed = item.usage?.type !== "UNUSED";
    const result = await showConfirmDialog({
      title: "Hapus Media dari MinIO?",
      text: isUsed
        ? `Media ini sedang digunakan oleh "${item.usage.label}". Jika dihapus, gambar pada ${item.usage.label} akan otomatis dikosongkan.`
        : `File "${item.filename}" akan dihapus permanen dari MinIO Object Storage.`,
      confirmButtonText: "Ya, Hapus File",
      cancelButtonText: "Batal",
      confirmButtonColor: "#e11d48",
    });

    if (!result.isConfirmed) return;

    try {
      setIsDeletingMediaKey(item.key);
      const res = await api.delete(`/media?key=${encodeURIComponent(item.key)}`);
      if (res?.success) {
        toast.success("Media berhasil dihapus dari MinIO.");
        fetchMedia();
        if (isUsed) await checkAuth();
      }
    } catch (err) {
      toast.error(err.message || "Gagal menghapus media.");
    } finally {
      setIsDeletingMediaKey(null);
    }
  };

  const handleCopyMediaUrl = (url) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(url);
      toast.success("URL media disalin ke papan klip!");
    }
  };

  // ─── Filter List Media ───────────────────────────────────────────────────────
  const filteredMedia = useMemo(() => {
    return mediaItems.filter((item) => {
      // Filter status
      if (mediaFilter === "USED" && item.usage.type === "UNUSED") return false;
      if (mediaFilter === "UNUSED" && item.usage.type !== "UNUSED") return false;

      // Filter pencarian
      if (mediaSearch.trim()) {
        const q = mediaSearch.toLowerCase();
        const matchName = item.filename?.toLowerCase().includes(q);
        const matchLabel = item.usage?.label?.toLowerCase().includes(q);
        return matchName || matchLabel;
      }
      return true;
    });
  }, [mediaItems, mediaFilter, mediaSearch]);

  // ─── Handler Toko & Logo ─────────────────────────────────────────────────────
  const handleSetRoundingMode = (mode) => {
    setRoundingMode(mode);
    try {
      localStorage.setItem("omnipos_rounding_mode", String(mode));
      toast.success(
        mode === 0
          ? "Pembulatan dinonaktifkan — total tampil apa adanya."
          : `Total transaksi akan dibulatkan ke kelipatan Rp ${new Intl.NumberFormat("id-ID").format(mode)} terdekat.`
      );
    } catch {}
  };

  const handleSetPrinterWidth = (w) => {
    setPrinterWidth(w);
    try {
      localStorage.setItem("omnipos_printer_width", String(w));
      toast.success(`Format lebar kertas diatur ke ${w}mm`);
    } catch {}
  };

  const handleSetReceiptFontSize = (sz) => {
    setReceiptFontSize(sz);
    try {
      localStorage.setItem("omnipos_receipt_font_size", sz);
      toast.success(`Ukuran font struk diatur ke ${sz}`);
    } catch {}
  };

  const handleTestPrintSettings = async () => {
    if (!isConnected) {
      toast.error("Printer belum terhubung. Hubungkan printer terlebih dahulu.");
      return;
    }
    setIsTestPrinting(true);
    const toastId = toast.loading("Mengirim data struk uji coba ke printer...");
    try {
      const testOrder = {
        receiptNumber: "TEST-" + Date.now().toString().slice(-4),
        createdAt: new Date().toISOString(),
        customerName: "Uji Coba Pengaturan",
        cashierName: user?.name || "Kasir",
        orderType: "DINE_IN",
        items: [
          {
            productName: "KONEKSI THERMAL PRINTER",
            variantName: `${printerWidth}mm / Font ${receiptFontSize}`,
            quantity: 1,
            price: 0,
            subtotal: 0,
            notes: "Web Bluetooth BLE Status OK",
          },
        ],
        totalAmount: 0,
        paymentMethod: "CASH",
        cashReceived: 0,
        changeAmount: 0,
      };
      const activeStore = {
        name: tenant?.name || "OMNI POS",
        printerWidth,
        receiptFontSize,
        address: activeBranch?.name || "Cabang Utama",
        logoUrl: tenant?.logoUrl || null,
        receiptShowLogo: receiptShowLogo,
      };
      const bytes = await buildReceiptBytes(testOrder, activeStore, "CUSTOMER");
      await printBytes(bytes);
      toast.success("Struk percobaan berhasil dicetak!", { id: toastId });
    } catch (err) {
      toast.error("Gagal mencetak: " + (err.message || "Cek printer."), { id: toastId });
    } finally {
      setIsTestPrinting(false);
    }
  };

  const handleSelectLogo = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Format tidak didukung. Gunakan file gambar PNG, JPG, atau WebP.");
      return;
    }

    setLogoFile(file);
    const objectUrl = URL.createObjectURL(file);
    setLogoPreview(objectUrl);
  };

  const handleUploadLogo = async () => {
    if (!logoFile) return;
    if (!canManage) {
      toast.error("Akses Ditolak: Anda tidak memiliki izin untuk mengunggah logo.");
      return;
    }

    setIsUploadingLogo(true);
    const toastId = toast.loading("Mengompres & mengunggah logo toko...");

    try {
      const compressed = await compressImage(logoFile, 300); // maks 300 KB
      const formData = new FormData();
      formData.append("logo", compressed);

      const response = await api.upload("/auth/store-logo", formData);

      if (response?.success) {
        setLogoFile(null);
        await checkAuth();
        toast.success("Logo toko berhasil diperbarui!", { id: toastId });
      } else {
        throw new Error(response?.message || "Gagal mengunggah logo.");
      }
    } catch (err) {
      toast.error(err.message || "Terjadi kesalahan saat mengunggah logo.", { id: toastId });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleDeleteLogo = async () => {
    if (!canManage) {
      toast.error("Akses Ditolak: Anda tidak memiliki izin untuk menghapus logo.");
      return;
    }

    setIsDeletingLogo(true);
    const toastId = toast.loading("Menghapus logo toko...");

    try {
      const response = await api.delete("/auth/store-logo");
      if (response?.success) {
        setLogoFile(null);
        setLogoPreview(null);
        await checkAuth();
        toast.success("Logo toko berhasil dihapus.", { id: toastId });
      } else {
        throw new Error(response?.message || "Gagal menghapus logo.");
      }
    } catch (err) {
      toast.error(err.message || "Gagal menghapus logo toko.", { id: toastId });
    } finally {
      setIsDeletingLogo(false);
    }
  };

  const handleToggleReceiptLogo = async () => {
    if (!canManage) {
      toast.error("Akses Ditolak: Anda tidak memiliki izin untuk mengubah pengaturan struk.");
      return;
    }

    const nextState = !receiptShowLogo;
    setReceiptShowLogo(nextState);
    setIsTogglingLogo(true);

    try {
      const response = await api.put("/auth/store-settings", {
        name: storeName.trim() || tenant?.name || "Toko",
        receiptShowLogo: nextState,
      });

      if (response?.success) {
        await checkAuth();
        toast.success(
          nextState
            ? "Logo akan dicetak di header struk penjualan."
            : "Logo dinonaktifkan dari struk penjualan (hanya nama teks)."
        );
      } else {
        setReceiptShowLogo(!nextState);
        throw new Error(response?.message || "Gagal mengubah opsi struk.");
      }
    } catch (err) {
      setReceiptShowLogo(!nextState);
      toast.error(err.message || "Terjadi kesalahan saat menyimpan opsi cetak logo.");
    } finally {
      setIsTogglingLogo(false);
    }
  };

  const handleSaveStoreSettings = async (e) => {
    e?.preventDefault();
    if (!canManage) {
      toast.error("Akses Ditolak: Anda tidak memiliki izin untuk mengubah pengaturan toko.");
      return;
    }
    if (!storeName.trim()) {
      toast.error("Nama toko wajib diisi.");
      return;
    }

    setIsSaving(true);
    const toastId = toast.loading(t("storeSettings.savingBtn") || "Menyimpan perubahan...");

    try {
      const response = await api.put("/auth/store-settings", {
        name: storeName.trim(),
      });

      toast.dismiss(toastId);
      if (response?.success) {
        await checkAuth();
        toast.success(t("storeSettings.saveSuccess") || "Pengaturan toko berhasil disimpan!");
      } else {
        throw new Error(response?.message || "Gagal memperbarui pengaturan toko.");
      }
    } catch (err) {
      toast.dismiss(toastId);
      toast.error(err.message || "Terjadi kesalahan saat menyimpan pengaturan toko.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadApk = () => {
    showAlertNotice({
      title: t("storeSettings.downloadApkBtn") || "Unduh APK Kasir Mobile",
      text:
        t("storeSettings.downloadAlert") ||
        "File instalasi APK Omni POS Mobile akan segera dapat diunduh langsung untuk Android dan iOS.",
      icon: "info",
      confirmButtonText: t("common.faham") || "Mengerti",
    });
  };

  const publicStoreUrl = `omnipos.app/store/${tenant?.slug || "toko"}`;

  const handleCopyUrl = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(`https://${publicStoreUrl}`);
      setCopied(true);
      toast.success(
        language === "id" ? "URL toko disalin ke papan klip!" : "Store URL copied to clipboard!"
      );
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString(language === "id" ? "id-ID" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const calculateDaysRemaining = (expiresAt) => {
    if (!expiresAt) return null;
    try {
      const now = new Date();
      const expiry = new Date(expiresAt);
      const diffTime = expiry.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 0;
    } catch {
      return null;
    }
  };

  const remainingDays = calculateDaysRemaining(tenant?.subscriptionExpiresAt);
  const isFreePlan = tenant?.plan === "FREE";

  const getPlanBadge = (plan) => {
    switch (plan) {
      case "PRO":
        return {
          label: "Paket PRO",
          classes: "bg-purple-100 text-purple-800 border-purple-300 font-black",
          dot: "bg-purple-500",
        };
      case "PLUS":
        return {
          label: "Paket PLUS",
          classes: "bg-amber-100 text-amber-800 border-amber-300 font-extrabold",
          dot: "bg-amber-500",
        };
      default:
        return {
          label: "Paket FREE",
          classes: "bg-slate-100 text-slate-700 border-slate-300 font-bold",
          dot: "bg-amber-500",
        };
    }
  };

  const planBadge = getPlanBadge(tenant?.plan);

  if (!isAllowed && user) {
    return <UnauthorizedState requiredPermission="settings:view" />;
  }

  // ─── Tab Definitions ─────────────────────────────────────────────────────────
  const tabs = [
    {
      id: "store",
      label: "Pengaturan Toko",
      icon: Store,
      desc: "Profil, Logo & Langganan",
    },
    {
      id: "printer",
      label: "Pengaturan Printer",
      icon: Printer,
      desc: "Bluetooth & Format Struk",
    },
    {
      id: "rounding",
      label: "Pembulatan Transaksi",
      icon: Coins,
      desc: "Pecahan Uang Tunai",
    },
    {
      id: "media",
      label: "Manajemen Media (MinIO)",
      icon: FileImage,
      desc: "Semua File & Status Pakai",
      badge: mediaSummary.totalFiles > 0 ? String(mediaSummary.totalFiles) : null,
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 animate-in fade-in duration-300">
      {/* 1. Header Section */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-400/40 text-amber-800 text-xs font-extrabold tracking-wide uppercase shadow-2xs backdrop-blur-md">
          <Settings className="w-3.5 h-3.5 text-amber-600" />
          <span>Pusat Konfigurasi & Media</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Pengaturan Toko
        </h1>

        <p className="text-sm text-slate-600 leading-relaxed font-normal">
          Kelola profil toko, koneksi printer thermal, pembulatan transaksi kasir, serta manajemen seluruh media penyimpanan MinIO.
        </p>
      </div>

      {/* 2. TAB NAVIGATION BAR (Modern Liquid Glass Style) */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/80 backdrop-blur-xl border border-white/90 shadow-xs overflow-x-auto no-scrollbar">
        {tabs.map((tItem) => {
          const Icon = tItem.icon;
          const isActive = activeTab === tItem.id;

          return (
            <button
              key={tItem.id}
              type="button"
              onClick={() => setActiveTab(tItem.id)}
              className={cn(
                "flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 select-none",
                isActive
                  ? "bg-slate-900 text-white shadow-md shadow-slate-900/15"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
              )}
            >
              <Icon className={cn("w-4 h-4", isActive ? "text-amber-400" : "text-slate-400")} />
              <span>{tItem.label}</span>
              {tItem.badge && (
                <span
                  className={cn(
                    "px-1.5 py-0.2 rounded-full text-[10px] font-black",
                    isActive ? "bg-amber-400 text-slate-950" : "bg-slate-200 text-slate-700"
                  )}
                >
                  {tItem.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* TAB 1: PENGATURAN TOKO                                                   */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      {activeTab === "store" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Kartu Profil Toko & Form Nama */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] ring-1 ring-inset ring-white/70 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-amber-400 to-amber-600 p-0.5 shadow-md shadow-amber-500/20 shrink-0 overflow-hidden">
                  <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center text-amber-600 font-black text-xl overflow-hidden">
                    {tenant?.logoUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={tenant.logoUrl}
                        alt={tenant?.name || "Logo Toko"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      (tenant?.name || "T").charAt(0).toUpperCase()
                    )}
                  </div>
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 leading-tight">
                    {tenant?.name || "Toko Omni POS"}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5 text-slate-400" />
                    <span>Slug:</span>
                    <span className="font-mono font-bold text-amber-700">
                      {tenant?.slug || "-"}
                    </span>
                  </p>
                </div>
              </div>

              <div
                className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs shadow-2xs self-start sm:self-auto ${planBadge.classes}`}
              >
                <span className={`w-2 h-2 rounded-full ${planBadge.dot} animate-pulse`} />
                <span>{planBadge.label}</span>
              </div>
            </div>

            {/* Form Ubah Nama Toko */}
            <form onSubmit={handleSaveStoreSettings} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Nama Toko / Bisnis
                </label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="Masukkan nama toko..."
                    className="flex-1 px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 text-sm font-bold text-slate-900 outline-none transition-all"
                    required
                  />
                  <button
                    type="submit"
                    disabled={isSaving || storeName.trim() === tenant?.name || !canManage}
                    className={`py-3 px-6 rounded-2xl font-extrabold text-xs shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      isSaving || storeName.trim() === tenant?.name || !canManage
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                        : "bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/15 active:scale-98"
                    }`}
                  >
                    {isSaving ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Save className="w-4 h-4 text-amber-400" />
                        <span>Simpan Perubahan</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>

            {/* Metadata Toko & Pemilik */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/60 space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  URL Publik Katalog Pelanggan
                </p>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs sm:text-sm font-mono font-bold text-amber-700 truncate">
                    {publicStoreUrl}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyUrl}
                    title="Salin URL"
                    className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200 shadow-2xs transition-colors shrink-0 cursor-pointer"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/60 space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Pemilik Akun Toko
                </p>
                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-800 truncate">
                  <User className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="truncate">{user?.name || "-"}</span>
                  <span className="text-xs font-normal text-slate-500 truncate">
                    ({user?.email || "-"})
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Kartu Logo Toko & Opsi Cetak Struk */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] ring-1 ring-inset ring-white/70 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-black shadow-2xs">
                  <ImageIcon className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 leading-tight">
                    Logo Toko & Header Struk
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Logo tersimpan di MinIO Object Storage dan otomatis dikompres ke ≤300 KB.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-slate-50/80 px-4 py-2 rounded-2xl border border-slate-200/60 self-start sm:self-auto">
                <span className="text-xs font-extrabold text-slate-700">
                  Cetak di Struk:
                </span>
                <button
                  type="button"
                  onClick={handleToggleReceiptLogo}
                  disabled={isTogglingLogo || !canManage}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-hidden cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
                    receiptShowLogo ? "bg-amber-500" : "bg-slate-300"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-xs",
                      receiptShowLogo ? "translate-x-6" : "translate-x-1"
                    )}
                  />
                </button>
                <span
                  className={cn(
                    "text-xs font-black",
                    receiptShowLogo ? "text-amber-700" : "text-slate-400"
                  )}
                >
                  {receiptShowLogo ? "AKTIF" : "NONAKTIF"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-7 space-y-4">
                <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1 leading-relaxed">
                    <p className="font-bold">Rekomendasi Format Logo:</p>
                    <p className="text-[11px] text-amber-800">
                      Gunakan logo berlatar transparan atau putih. Frontend otomatis mengompres gambar ke ≤300 KB saat diunggah.
                    </p>
                  </div>
                </div>

                <div className="relative border-2 border-dashed border-slate-200 hover:border-amber-400/80 rounded-3xl p-5 text-center transition-all bg-slate-50/50 hover:bg-amber-50/20">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleSelectLogo}
                    disabled={!canManage || isUploadingLogo}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  />
                  <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shadow-2xs">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-800">
                        Klik atau seret file gambar logo ke sini
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        PNG, JPG, atau WebP bebas ukuran awal
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  {logoFile && (
                    <button
                      type="button"
                      onClick={handleUploadLogo}
                      disabled={isUploadingLogo || !canManage}
                      className="px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black shadow-md shadow-slate-900/15 flex items-center gap-2 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                    >
                      {isUploadingLogo ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Save className="w-3.5 h-3.5 text-amber-400" />
                      )}
                      <span>Simpan Logo Baru</span>
                    </button>
                  )}

                  {logoFile && (
                    <button
                      type="button"
                      onClick={() => {
                        setLogoFile(null);
                        setLogoPreview(tenant?.logoUrl || null);
                      }}
                      disabled={isUploadingLogo}
                      className="px-3.5 py-2.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200 transition-colors cursor-pointer"
                    >
                      Batal
                    </button>
                  )}

                  {tenant?.logoUrl && !logoFile && (
                    <button
                      type="button"
                      onClick={handleDeleteLogo}
                      disabled={isDeletingLogo || !canManage}
                      className="px-4 py-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isDeletingLogo ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                      <span>Hapus Logo</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Live Thermal Receipt Simulation */}
              <div className="lg:col-span-5 bg-slate-100/80 p-4 rounded-3xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-amber-600" />
                    <span>Simulasi Header Struk</span>
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-500 font-bold">
                    {printerWidth}mm
                  </span>
                </div>

                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/70 font-mono text-black text-center space-y-2 select-none">
                  {receiptShowLogo && (logoPreview || tenant?.logoUrl) ? (
                    <div className="py-1">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={logoPreview || tenant?.logoUrl}
                        alt="Pratinjau Logo"
                        className="mx-auto max-h-12 max-w-28 object-contain filter grayscale contrast-200"
                      />
                    </div>
                  ) : (
                    <div className="py-1 text-[10px] text-slate-400 italic">
                      {!receiptShowLogo
                        ? "[Logo dinonaktifkan di struk]"
                        : "[Belum ada logo terunggah]"}
                    </div>
                  )}

                  <div className="font-bold text-xs uppercase tracking-wider">
                    {storeName || tenant?.name || "NAMA TOKO ANDA"}
                  </div>

                  <div className="text-[10px] text-slate-500 leading-tight">
                    {activeBranch?.name || "Cabang Utama"}
                  </div>

                  <div className="border-b border-dashed border-slate-400 my-1.5" />

                  <div className="text-[9px] text-slate-400">
                    --------------------------------
                    <br />
                    1x MENU CONTOH &nbsp;&nbsp;&nbsp;&nbsp; Rp 25.000
                    <br />
                    TOTAL &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Rp 25.000
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Kartu Masa Aktif Langganan */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] ring-1 ring-inset ring-white/70 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-black">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 leading-tight">
                    Masa Aktif Paket Langganan
                  </h3>
                  <p className="text-xs text-slate-500">
                    Informasi sinkron langsung dari sistem tagihan dan database.
                  </p>
                </div>
              </div>

              <Link
                href="/dashboard/upgrade"
                className="text-xs font-extrabold text-amber-700 hover:text-amber-800 flex items-center gap-1 transition-colors"
              >
                <span>Ubah Paket</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/60 space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Mulai Bergabung</span>
                </div>
                <p className="text-sm font-black text-slate-900">
                  {formatDate(tenant?.createdAt) || "-"}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/60 space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <Crown className="w-3.5 h-3.5 text-purple-500" />
                  <span>Mulai Jadi PRO / PLUS</span>
                </div>
                <div>
                  {tenant?.proJoinedAt ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-purple-900">
                        {formatDate(tenant.proJoinedAt)}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[10px] font-black uppercase">
                        PRO
                      </span>
                    </div>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 text-xs font-semibold">
                      Belum Berlangganan PRO
                    </span>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/60 space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>Tanggal Berakhir Langganan</span>
                </div>
                <div>
                  {isFreePlan ? (
                    <span className="text-sm font-black text-slate-900">
                      Permanen (Paket FREE)
                    </span>
                  ) : tenant?.subscriptionExpiresAt ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-black text-slate-900">
                        {formatDate(tenant.subscriptionExpiresAt)}
                      </span>
                      {remainingDays !== null && (
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                            remainingDays > 7
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800 animate-pulse"
                          }`}
                        >
                          Sisa {remainingDays} hari
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm font-black text-slate-700">-</span>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/60 space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  <span>Siklus Penagihan</span>
                </div>
                <p className="text-sm font-black text-slate-900">
                  {tenant?.billingCycle === "yearly"
                    ? "Tahunan (Yearly - Hemat 15%)"
                    : tenant?.billingCycle === "monthly"
                    ? "Bulanan (Monthly)"
                    : isFreePlan
                    ? "Gratis Selamanya (FREE)"
                    : "Standar"}
                </p>
              </div>
            </div>
          </div>

          {/* Kartu Aplikasi Mobile Kasir Offline */}
          <div className="p-6 sm:p-8 rounded-3xl bg-linear-to-br from-amber-500/10 via-white/80 to-amber-500/5 backdrop-blur-2xl border border-amber-300/60 shadow-lg shadow-amber-500/5 ring-1 ring-inset ring-amber-300/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/25">
                <Smartphone className="w-6 h-6" />
              </div>
              <div className="space-y-1 max-w-xl">
                <h3 className="text-base font-black text-slate-900">
                  Aplikasi Kasir Mobile POS
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                  Omni POS siap digunakan untuk transaksi kasir mobile langsung dari smartphone atau tablet kasir Anda.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDownloadApk}
              className="py-3 px-5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-md shadow-slate-900/15 flex items-center justify-center gap-2 transition-all active:scale-98 shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>Unduh APK Kasir Mobile</span>
            </button>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* TAB 2: PENGATURAN PRINTER                                                */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      {activeTab === "printer" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="p-6 sm:p-8 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] ring-1 ring-inset ring-white/70 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-black shadow-2xs">
                  <Printer className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 leading-tight">
                    Koneksi & Pengaturan Thermal Printer
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Sambungan Bluetooth printer thermal, format roll kertas struk, ukuran font, dan uji cetak.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowBtModal(true)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer self-start sm:self-auto"
              >
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span>Pindai Perangkat Bluetooth</span>
              </button>
            </div>

            {/* Status Koneksi Real-time */}
            <div
              className={cn(
                "p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3",
                isConnected
                  ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                  : isReconnecting
                  ? "bg-amber-50/80 border-amber-200 text-amber-900"
                  : "bg-slate-50/80 border-slate-200/80 text-slate-700"
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-3 h-3 rounded-full shrink-0",
                    isConnected
                      ? "bg-emerald-500 animate-pulse ring-4 ring-emerald-100"
                      : isReconnecting
                      ? "bg-amber-500 animate-pulse ring-4 ring-amber-100"
                      : "bg-slate-300 ring-4 ring-slate-100"
                  )}
                />
                <div>
                  <p className="text-xs font-black text-slate-900">
                    {isConnected
                      ? `Printer Terhubung: ${btDeviceName || "Thermal Printer"}`
                      : isReconnecting
                      ? "Menghubungkan Ulang ke Printer..."
                      : "Printer Bluetooth Belum Terhubung"}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                    {isConnected
                      ? `GATT Service: ${btServiceUuid}`
                      : "Nyalakan Bluetooth printer thermal lalu klik tombol hubungkan."}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                {isConnected ? (
                  <button
                    type="button"
                    onClick={disconnect}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-rose-50 text-rose-700 hover:text-rose-800 border border-rose-200 text-xs font-black transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>Putuskan</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowBtModal(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all active:scale-95 cursor-pointer shadow-xs flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Hubungkan Printer</span>
                  </button>
                )}
              </div>
            </div>

            {/* Parameter Format Kertas & Font */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/60 space-y-3">
                <div>
                  <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-amber-600" />
                    <span>Lebar Kertas Thermal</span>
                  </label>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Pilih ukuran roll kertas printer thermal kasir Anda.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSetPrinterWidth(58)}
                    className={cn(
                      "p-3 rounded-xl border text-left transition-all cursor-pointer",
                      printerWidth === 58
                        ? "bg-amber-500/10 border-amber-400/80 text-amber-950 font-black shadow-2xs"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black">58 mm</span>
                      {printerWidth === 58 && <Check className="w-3.5 h-3.5 text-amber-600" />}
                    </div>
                    <p className="text-[10px] text-slate-400 font-normal mt-1">
                      Standar POS Portabel (32 char)
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSetPrinterWidth(80)}
                    className={cn(
                      "p-3 rounded-xl border text-left transition-all cursor-pointer",
                      printerWidth === 80
                        ? "bg-amber-500/10 border-amber-400/80 text-amber-950 font-black shadow-2xs"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black">80 mm</span>
                      {printerWidth === 80 && <Check className="w-3.5 h-3.5 text-amber-600" />}
                    </div>
                    <p className="text-[10px] text-slate-400 font-normal mt-1">
                      Printer Kasir Resto (48 char)
                    </p>
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/60 space-y-3">
                <div>
                  <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-amber-600" />
                    <span>Ukuran Karakter Struk</span>
                  </label>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Kerapatan huruf font ESC/POS saat dicetak.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "CONDENSED", label: "Rapat", desc: "Font B" },
                    { id: "NORMAL", label: "Normal", desc: "Font A" },
                    { id: "LARGE", label: "Besar", desc: "Font 2X" },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSetReceiptFontSize(opt.id)}
                      className={cn(
                        "p-2.5 rounded-xl border text-center transition-all cursor-pointer",
                        receiptFontSize === opt.id
                          ? "bg-amber-500/10 border-amber-400/80 text-amber-950 font-black shadow-2xs"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold"
                      )}
                    >
                      <p className="text-xs font-black">{opt.label}</p>
                      <p className="text-[9px] text-slate-400 font-normal">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* BLE Profile UUID & Test Print */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-500">Profil UUID BLE:</span>
                <select
                  value={btServiceUuid}
                  onChange={(e) => setBtServiceUuid(e.target.value)}
                  className="text-xs font-mono font-bold bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 shadow-2xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden cursor-pointer"
                >
                  {BLE_PROFILES.map((p) => (
                    <option key={p.serviceUuid} value={p.serviceUuid}>
                      {p.label} ({p.serviceUuid})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleTestPrintSettings}
                disabled={isTestPrinting || !isConnected}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black shadow-md shadow-amber-500/20 transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isTestPrinting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Printer className="w-3.5 h-3.5" />
                )}
                <span>Cetak Struk Uji Coba</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* TAB 3: PEMBULATAN TRANSAKSI KASIR                                        */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      {activeTab === "rounding" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="p-6 sm:p-8 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] ring-1 ring-inset ring-white/70 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center shadow-2xs">
                <Coins className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 leading-tight">
                  Pembulatan Total Transaksi (Terminal POS)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sesuaikan total bayar kasir dengan pecahan uang tunai rupiah agar kembalian selalu bulat.
                </p>
              </div>
            </div>

            {/* Info Pecahan Rupiah */}
            <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200/80 flex flex-wrap gap-1.5 items-center">
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider shrink-0">
                Pecahan Rupiah Beredar:
              </span>
              {[100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000].map((p) => (
                <span
                  key={p}
                  className="px-2 py-0.5 rounded-md bg-white border border-amber-200 text-[10px] font-black text-amber-900"
                >
                  {new Intl.NumberFormat("id-ID").format(p)}
                </span>
              ))}
            </div>

            {/* Pilihan Pembulatan */}
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                Atur Pembulatan Total Bayar Kasir
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { value: 0, label: "Tanpa Bulatkan", desc: "Total tampil apa adanya", example: "Rp 12.350" },
                  { value: 100, label: "Ke ×100", desc: "Bulatkan ke Rp 100", example: "Rp 12.400" },
                  { value: 500, label: "Ke ×500", desc: "Bulatkan ke Rp 500", example: "Rp 12.500" },
                  { value: 1000, label: "Ke ×1.000", desc: "Bulatkan ke Rp 1.000", example: "Rp 13.000" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSetRoundingMode(opt.value)}
                    className={cn(
                      "p-3 rounded-2xl border text-left transition-all cursor-pointer space-y-1",
                      roundingMode === opt.value
                        ? "bg-amber-500/10 border-amber-400/80 shadow-2xs"
                        : "bg-white border-slate-200 hover:bg-slate-50"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-black ${roundingMode === opt.value ? "text-amber-950" : "text-slate-700"}`}>
                        {opt.label}
                      </span>
                      {roundingMode === opt.value && (
                        <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 font-normal">{opt.desc}</p>
                    <p className={`text-[10px] font-black font-mono ${roundingMode === opt.value ? "text-amber-700" : "text-slate-500"}`}>
                      {opt.example}
                    </p>
                  </button>
                ))}
              </div>

              {/* Preview live pembulatan */}
              <div className="p-3.5 rounded-xl bg-slate-900 text-white flex items-center justify-between text-xs">
                <span className="text-slate-400 font-semibold">Contoh Simulasi: Subtotal Rp 12.350</span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 line-through font-mono">Rp 12.350</span>
                  <span className="text-amber-300 font-black font-mono">
                    →{" "}
                    {roundingMode === 0
                      ? "Rp 12.350"
                      : `Rp ${new Intl.NumberFormat("id-ID").format(
                          Math.ceil(12350 / roundingMode) * roundingMode
                        )}`}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400">
                Pengaturan ini tersimpan di browser perangkat kasir ini dan diterapkan pada checkout POS kasir.
                Pembulatan ke atas menggunakan <span className="font-bold text-slate-600">Math.ceil</span> agar omzet tidak berkurang.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* TAB 4: MANAJEMEN MEDIA (MinIO OBJECT STORAGE)                            */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      {activeTab === "media" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Ringkasan Storage Card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-white/90 border border-white/80 shadow-xs space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-extrabold uppercase tracking-wider">
                <HardDrive className="w-3.5 h-3.5 text-amber-500" />
                <span>Total Media</span>
              </div>
              <p className="text-xl font-black text-slate-900">{mediaSummary.totalFiles} File</p>
            </div>

            <div className="p-4 rounded-2xl bg-white/90 border border-white/80 shadow-xs space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-extrabold uppercase tracking-wider">
                <Layers className="w-3.5 h-3.5 text-blue-500" />
                <span>Penyimpanan MinIO</span>
              </div>
              <p className="text-xl font-black text-slate-900">{formatBytes(mediaSummary.totalBytes)}</p>
            </div>

            <div className="p-4 rounded-2xl bg-white/90 border border-white/80 shadow-xs space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-extrabold uppercase tracking-wider">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Sedang Digunakan</span>
              </div>
              <p className="text-xl font-black text-emerald-700">{mediaSummary.totalUsed} Foto</p>
            </div>

            <div className="p-4 rounded-2xl bg-white/90 border border-white/80 shadow-xs space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-extrabold uppercase tracking-wider">
                <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                <span>Tidak Terpakai</span>
              </div>
              <p className="text-xl font-black text-rose-600">{mediaSummary.totalUnused} Foto</p>
            </div>
          </div>

          {/* Bar Filter & Pencarian Media */}
          <div className="p-4 rounded-3xl bg-white/80 backdrop-blur-xl border border-white/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={mediaSearch}
                  onChange={(e) => setMediaSearch(e.target.value)}
                  placeholder="Cari foto / nama menu..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 outline-none focus:border-amber-400"
                />
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
                {[
                  { id: "ALL", label: "Semua" },
                  { id: "USED", label: "Terpakai" },
                  { id: "UNUSED", label: "Tidak Terpakai" },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setMediaFilter(f.id)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer",
                      mediaFilter === f.id
                        ? "bg-white text-slate-900 shadow-2xs"
                        : "text-slate-500 hover:text-slate-900"
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <span className="text-[11px] font-bold text-slate-500">
                Cabang: <span className="text-amber-700 font-extrabold">{activeBranch?.name || "Semua Cabang"}</span>
              </span>
              <button
                type="button"
                onClick={fetchMedia}
                disabled={isMediaLoading}
                title="Muat Ulang Media"
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
              >
                <RefreshCw className={cn("w-3.5 h-3.5", isMediaLoading ? "animate-spin" : "")} />
              </button>
            </div>
          </div>

          {/* Grid Foto Media */}
          {isMediaLoading ? (
            <div className="p-16 text-center text-xs font-bold text-slate-400 bg-white/70 rounded-3xl border border-white">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-500 mb-2" />
              <span>Menghubungi MinIO Object Storage...</span>
            </div>
          ) : filteredMedia.length === 0 ? (
            <div className="p-16 text-center space-y-2 bg-white/70 rounded-3xl border border-white">
              <FileImage className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-600">
                {mediaSearch ? "Media tidak ditemukan" : "Belum ada file media di MinIO"}
              </p>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                Foto produk dan logo toko yang diunggah akan otomatis terdata di sini.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filteredMedia.map((item) => {
                const isUsed = item.usage.type !== "UNUSED";
                const isLogo = item.usage.type === "LOGO";
                const isDeleting = isDeletingMediaKey === item.key;

                return (
                  <div
                    key={item.key}
                    className="group rounded-2xl bg-white/90 border border-slate-200/80 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-all"
                  >
                    {/* Media Thumbnail & Overlay Actions */}
                    <div className="relative aspect-square bg-slate-100 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.url}
                        alt={item.filename}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect width='18' height='18' x='3' y='3' rx='2' ry='2'/%3E%3Ccircle cx='9' cy='9' r='2'/%3E%3Cpath d='m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21'/%3E%3C/svg%3E";
                        }}
                      />

                      {/* Badge Status Pemakaian */}
                      <div className="absolute top-2 left-2 z-10">
                        {isLogo ? (
                          <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white text-[9px] font-black uppercase shadow-xs">
                            Logo Toko
                          </span>
                        ) : isUsed ? (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[9px] font-black uppercase shadow-xs">
                            Terpakai
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-slate-800/80 text-white text-[9px] font-black uppercase shadow-xs backdrop-blur-xs">
                            Tidak Terpakai
                          </span>
                        )}
                      </div>

                      {/* Hover Overlay Button Actions */}
                      <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                        <button
                          type="button"
                          onClick={() => setPreviewMediaUrl(item.url)}
                          title="Lihat Pratinjau Penuh"
                          className="p-2 rounded-xl bg-white text-slate-800 hover:bg-amber-400 hover:text-slate-950 transition-colors shadow-xs cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyMediaUrl(item.url)}
                          title="Salin Link MinIO"
                          className="p-2 rounded-xl bg-white text-slate-800 hover:bg-amber-400 hover:text-slate-950 transition-colors shadow-xs cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          title="Buka File di Tab Baru"
                          className="p-2 rounded-xl bg-white text-slate-800 hover:bg-amber-400 hover:text-slate-950 transition-colors shadow-xs"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>

                    {/* Metadata Card Footer */}
                    <div className="p-3 space-y-1.5 border-t border-slate-100 bg-white">
                      <p className="text-xs font-bold text-slate-900 truncate" title={item.filename}>
                        {item.filename}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold">
                        <span>{formatBytes(item.size)}</span>
                        <span>{new Date(item.lastModified).toLocaleDateString("id-ID")}</span>
                      </div>

                      {/* Detail Penggunaan */}
                      <div className="pt-1 border-t border-slate-100 flex items-center justify-between gap-1">
                        <p
                          className="text-[10px] font-bold truncate text-slate-600 flex-1"
                          title={item.usage.label}
                        >
                          {item.usage.label}
                        </p>

                        {canManage && (
                          <button
                            type="button"
                            onClick={() => handleDeleteMedia(item)}
                            disabled={isDeleting}
                            title="Hapus dari MinIO"
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                          >
                            {isDeleting ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
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
      )}

      {/* Modal Lightbox Preview Zoom Foto */}
      {previewMediaUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setPreviewMediaUrl(null)}
        >
          <div
            className="relative max-w-3xl max-h-[85vh] rounded-3xl overflow-hidden bg-white shadow-2xl p-2 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewMediaUrl(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewMediaUrl}
              alt="Pratinjau Foto Penuh"
              className="max-h-[75vh] w-auto object-contain rounded-2xl mx-auto"
            />
          </div>
        </div>
      )}

      {/* Modal Bluetooth Printer Scanner */}
      {showBtModal && <BluetoothModal onClose={() => setShowBtModal(false)} />}
    </div>
  );
}
