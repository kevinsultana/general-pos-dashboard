"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Settings,
  Store,
  Calendar,
  Sparkles,
  Smartphone,
  Download,
  ShieldCheck,
  Copy,
  Check,
  ArrowRight,
  Crown,
  Clock,
  User,
  Mail,
  Save,
  Layers,
  Printer,
  Power,
  Sliders,
  FileText,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  Coins,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../../contexts/AuthContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import api from "../../../lib/api";
import { showAlertNotice } from "../../../lib/alerts";
import UnauthorizedState from "../../../components/common/UnauthorizedState";
import { useBluetooth, BLE_PROFILES, buildReceiptBytes } from "../../../contexts/BluetoothPrinterContext";
import BluetoothModal from "../../../components/bluetooth/BluetoothModal";
import { cn } from "../../../lib/utils";

export default function StoreSettingsPage() {
  const { tenant, user, checkAuth, hasPermission } = useAuth();
  const { t, language } = useLanguage();

  const [storeName, setStoreName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // ─── Bluetooth Thermal Printer Context & Preferences ───────────────────────
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

  // ─── Pengaturan Pembulatan Total Transaksi ────────────────────────────────────
  // Nilai: 0 = tidak dibulatkan, 100 | 500 | 1000 = dibulatkan ke kelipatan terdekat
  const [roundingMode, setRoundingMode] = useState(0);

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
        address: "Cabang Utama",
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

  // Proteksi Hak Akses (settings:view untuk melihat, settings:manage untuk mengubah)
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

  // Sinkronkan nama toko awal dari database
  useEffect(() => {
    if (tenant?.name) {
      setStoreName(tenant.name);
    }
  }, [tenant?.name]);

  const isFreePlan = tenant?.plan === "FREE";
  const isProPlan = tenant?.plan === "PRO";
  const isPlusPlan = tenant?.plan === "PLUS";

  const publicStoreUrl = `omnipos.app/store/${tenant?.slug || "toko"}`;

  const handleCopyUrl = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(`https://${publicStoreUrl}`);
      setCopied(true);
      toast.success(
        language === "id"
          ? "URL toko disalin ke papan klip!"
          : "Store URL copied to clipboard!"
      );
      setTimeout(() => setCopied(false), 2000);
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
    const toastId = toast.loading(
      t("storeSettings.savingBtn") || "Menyimpan perubahan..."
    );

    try {
      const response = await api.put("/auth/store-settings", {
        name: storeName.trim(),
      });

      toast.dismiss(toastId);

      if (response?.success) {
        await checkAuth();
        toast.success(
          t("storeSettings.saveSuccess") || "Pengaturan toko berhasil disimpan!"
        );
      } else {
        throw new Error(
          response?.message || "Gagal memperbarui pengaturan toko."
        );
      }
    } catch (err) {
      toast.dismiss(toastId);
      toast.error(
        err.message || "Terjadi kesalahan saat menyimpan pengaturan toko."
      );
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

  // Format tanggal asli dari database
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

  // Hitung sisa hari aktif
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

  const getPlanBadge = (plan) => {
    switch (plan) {
      case "PRO":
        return {
          label: "Paket PRO",
          classes:
            "bg-purple-100 text-purple-800 border-purple-300 font-black",
          dot: "bg-purple-500",
        };
      case "PLUS":
        return {
          label: "Paket PLUS",
          classes:
            "bg-amber-100 text-amber-800 border-amber-300 font-extrabold",
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

  // Proteksi Hak Akses (settings:view)
  if (!isAllowed && user) {
    return <UnauthorizedState requiredPermission="settings:view" />;
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* 1. Header Section */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-400/40 text-amber-800 text-xs font-extrabold tracking-wide uppercase shadow-2xs backdrop-blur-md">
          <Settings className="w-3.5 h-3.5 text-amber-600" />
          <span>{t("storeSettings.badge") || "Pengaturan & Langganan"}</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          {t("storeSettings.title") || "Pengaturan Toko"}
        </h1>

        <p className="text-sm text-slate-600 leading-relaxed font-normal">
          {t("storeSettings.subtitle") ||
            "Kelola identitas toko Anda dan pantau rincian masa aktif paket langganan."}
        </p>
      </div>

      {/* 2. Kartu Pengaturan Identitas Toko & Form Ubah Nama */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] ring-1 ring-inset ring-white/70 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-amber-400 to-amber-600 p-0.5 shadow-md shadow-amber-500/20 shrink-0">
              <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center text-amber-600 font-black text-xl">
                {(tenant?.name || "T").charAt(0).toUpperCase()}
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

          {/* Active Plan Pill */}
          <div
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs shadow-2xs self-start sm:self-auto ${planBadge.classes}`}
          >
            <span
              className={`w-2 h-2 rounded-full ${planBadge.dot} animate-pulse`}
            />
            <span>{planBadge.label}</span>
          </div>
        </div>

        {/* Form Ubah Nama Toko */}
        <form onSubmit={handleSaveStoreSettings} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="storeNameInput"
              className="text-xs font-bold uppercase tracking-wider text-slate-500"
            >
              {t("storeSettings.storeName") || "Nama Toko / Bisnis"}
            </label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <input
                id="storeNameInput"
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder={
                  t("storeSettings.storeNamePlaceholder") ||
                  "Masukkan nama toko..."
                }
                className="flex-1 px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 text-sm font-bold text-slate-900 outline-none transition-all"
                required
              />
              <button
                type="submit"
                disabled={isSaving || storeName.trim() === tenant?.name || !canManage}
                title={!canManage ? "Memerlukan izin ubah pengaturan toko (settings:manage)" : undefined}
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
                    <span>
                      {t("storeSettings.saveBtn") || "Simpan Perubahan"}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Metadata Toko & Pemilik */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* URL Publik Toko */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/60 space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {t("storeSettings.storeSlug") || "URL Publik Toko"}
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

          {/* Info Pemilik Akun */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/60 space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {t("storeSettings.ownerInfo") || "Pemilik Toko"}
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

      {/* Kartu Pengaturan Koneksi Thermal Printer */}
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
                Kelola sambungan Bluetooth printer thermal, format ukuran kertas struk, dan uji cetak.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowBtModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer self-start sm:self-auto"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>Kelola Bluetooth</span>
          </button>
        </div>

        {/* Real-time Connection Status Banner */}
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
                  : "Nyalakan Bluetooth printer thermal dan klik tombol hubungkan."}
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

        {/* Setting Parameters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Lebar Kertas Struk (58mm vs 80mm) */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/60 space-y-3">
            <div>
              <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-600" />
                <span>Lebar Kertas Thermal</span>
              </label>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Pilih ukuran roll kertas printer thermal yang Anda gunakan.
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

          {/* Ukuran Font Struk */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/60 space-y-3">
            <div>
              <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-amber-600" />
                <span>Ukuran Karakter Struk</span>
              </label>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Kerapatan huruf ESC/POS yang dicetak ke struk.
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

        {/* Profil Layanan BLE & Uji Cetak */}
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

      {/* 3. Kartu Pengaturan Pembulatan Total Transaksi */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] ring-1 ring-inset ring-white/70 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center shadow-2xs">
            <Coins className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 leading-tight">
              Pembulatan Total Transaksi (Kasir POS)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Sesuaikan total bayar dengan pecahan uang rupiah yang beredar agar kembalian selalu bulat.
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
            Atur Pembulatan Total Bayar
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
          <div className="p-3 rounded-xl bg-slate-900 text-white flex items-center justify-between text-xs">
            <span className="text-slate-400 font-semibold">Contoh: Subtotal Rp 12.350</span>
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
            Pengaturan ini disimpan di perangkat kasir ini dan berlaku langsung di terminal POS.
            Pembulatan ke atas menggunakan{" "}
            <span className="font-bold text-slate-600">Math.ceil</span> agar total tidak pernah lebih
            kecil dari harga asli.
          </p>
        </div>
      </div>

      {/* 4. Kartu Rincian Langganan Toko (Data Real dari Database) */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] ring-1 ring-inset ring-white/70 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-black">
              <Sparkles className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 leading-tight">
                Rincian Masa Aktif Langganan
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
          {/* 1. Mulai Bergabung (tenant.createdAt) */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/60 space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{t("storeSettings.joinedDate") || "Mulai Bergabung"}</span>
            </div>
            <p className="text-sm font-black text-slate-900">
              {formatDate(tenant?.createdAt) || "-"}
            </p>
          </div>

          {/* 2. Mulai Bergabung Jadi PRO (tenant.proJoinedAt) */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/60 space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <Crown className="w-3.5 h-3.5 text-purple-500" />
              <span>
                {t("storeSettings.proJoinedDate") || "Mulai Bergabung Jadi PRO"}
              </span>
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
                  {t("storeSettings.notProYet") || "Belum Berlangganan PRO"}
                </span>
              )}
            </div>
          </div>

          {/* 3. Tanggal Berakhir Langganan PRO/PLUS */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/60 space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>
                {t("storeSettings.proExpiryDate") ||
                  "Tanggal Berakhir Langganan"}
              </span>
            </div>
            <div>
              {isFreePlan ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-slate-900">
                    {t("storeSettings.lifetimeFree") ||
                      "Permanen (Paket FREE)"}
                  </span>
                </div>
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
                      {t("storeSettings.daysRemaining", {
                        days: remainingDays,
                      }) || `Sisa ${remainingDays} hari`}
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-sm font-black text-slate-700">-</span>
              )}
            </div>
          </div>

          {/* 4. Siklus Penagihan */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/60 space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {t("storeSettings.billingCycleLabel") || "Siklus Penagihan"}
              </span>
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

      {/* 4. Kartu Aplikasi Mobile Kasir Offline */}
      <div className="p-6 sm:p-8 rounded-3xl bg-linear-to-br from-amber-500/10 via-white/80 to-amber-500/5 backdrop-blur-2xl border border-amber-300/60 shadow-lg shadow-amber-500/5 ring-1 ring-inset ring-amber-300/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/25">
            <Smartphone className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-xl">
            <h3 className="text-base font-black text-slate-900">
              {t("storeSettings.mobileCardTitle") ||
                "Aplikasi Kasir Mobile POS"}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              {t("storeSettings.mobileCardDesc") ||
                "Paket FREE Anda sudah siap digunakan untuk transaksi kasir offline langsung dari smartphone atau tablet kasir Anda."}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDownloadApk}
          className="py-3 px-5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-md shadow-slate-900/15 flex items-center justify-center gap-2 transition-all active:scale-98 shrink-0 cursor-pointer"
        >
          <Download className="w-4 h-4 text-amber-400" />
          <span>
            {t("storeSettings.downloadApkBtn") || "Unduh APK Kasir Mobile"}
          </span>
        </button>
      </div>

      {/* 5. Upgrade Call-to-Action Card (Khusus Paket FREE) */}
      {isFreePlan && (
        <div className="p-6 sm:p-8 rounded-3xl bg-linear-to-r from-slate-900 via-slate-850 to-slate-900 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-amber-500/10 blur-[80px] pointer-events-none" />

          <div className="relative z-10 space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-300 font-extrabold text-[10px] tracking-wide uppercase">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Buka Akses Penuh</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white">
              {t("storeSettings.upgradePromptTitle") ||
                "Ingin Membuka Web Dashboard & Multi-Cabang?"}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed font-normal">
              {t("storeSettings.upgradePromptDesc") ||
                "Tingkatkan paket ke PLUS atau PRO untuk memantau bisnis dari browser laptop Anda dan membuka laporan penjualan mendalam."}
            </p>
          </div>

          <Link
            href="/dashboard/upgrade"
            className="relative z-10 py-3.5 px-6 rounded-2xl bg-linear-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all active:scale-98 shrink-0"
          >
            <span>
              {t("storeSettings.upgradeBtn") || "Upgrade ke Paket Berbayar"}
            </span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Modal Pengaturan Bluetooth Printer */}
      <BluetoothModal
        isOpen={showBtModal}
        onClose={() => setShowBtModal(false)}
        userName={user?.name || "Kasir"}
        storeInfo={{
          name: tenant?.name || "OMNI POS",
          address: "Cabang Utama",
          printerWidth,
          receiptFontSize,
        }}
      />
    </div>
  );
}
