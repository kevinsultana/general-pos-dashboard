'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
  Sliders,
  Printer,
  Receipt,
  ToggleLeft,
  ToggleRight,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../contexts/AuthContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import api from '../../../lib/api';
import { showAlertNotice } from '../../../lib/alerts';
import UnauthorizedState from '../../../components/common/UnauthorizedState';

const BUSINESS_PRESET_LIST = [
  { id: 'FNB', label: 'Kuliner & Minuman (F&B)' },
  { id: 'RETAIL', label: 'Toko Ritel & Kelontong' },
  { id: 'SERVICE', label: 'Laundry & Jasa Pengerjaan' },
  { id: 'BOOKING', label: 'Barbershop & Salon (Jasa Waktu)' },
  { id: 'PHARMACY', label: 'Apotek & Toko Obat' },
  { id: 'CUSTOM', label: 'Kustom Penuh (Bebas)' },
];

export default function StoreSettingsPage() {
  const { tenant, user, checkAuth, hasPermission } = useAuth();
  const { t, language } = useLanguage();

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'config' | 'receipt'

  // Tab 1: Profile State
  const [storeName, setStoreName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Tab 2: Feature Flags / Business Config State
  const [businessPreset, setBusinessPreset] = useState('RETAIL');
  const [featureConfig, setFeatureConfig] = useState({
    enableTableManagement: false,
    enableKitchenTicket: false,
    enableModifiers: true,
    enableMultiUnit: true,
    enableServiceTracking: false,
    enableCustomerDebt: true,
    enableBarcodeFastScan: false,
  });
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Tab 3: Receipt Settings State
  const [receiptSettings, setReceiptSettings] = useState({
    paperSize: '58mm',
    headerText: 'Wi-Fi: OmniGuest / Pass: kopi1234',
    footerText: 'Terima kasih atas kunjungan Anda!\nBarang yang sudah dibeli tidak dapat ditukar.',
    showCashierName: true,
    showCustomerName: true,
    showTableNumber: true,
    showStoreLogo: false,
  });
  const [isSavingReceipt, setIsSavingReceipt] = useState(false);

  // Proteksi Hak Akses (settings:view untuk melihat, settings:manage untuk mengubah)
  const isAllowed = user?.isOwner || hasPermission('settings:view');
  const canManage = user?.isOwner || hasPermission('settings:manage');

  // Load Data Awal
  useEffect(() => {
    if (tenant?.name) {
      setStoreName(tenant.name);
    }
    if (tenant?.businessPreset) {
      setBusinessPreset(tenant.businessPreset);
    }
    if (tenant?.businessConfig && typeof tenant.businessConfig === 'object') {
      setFeatureConfig((prev) => ({ ...prev, ...tenant.businessConfig }));
    }
  }, [tenant]);

  // Load Receipt Settings
  useEffect(() => {
    const fetchReceiptSettings = async () => {
      try {
        const res = await api.get('/receipt-settings');
        if (res.data?.success && res.data?.data) {
          setReceiptSettings((prev) => ({ ...prev, ...res.data.data }));
        }
      } catch (err) {
        console.error('Failed to load receipt settings:', err);
      }
    };
    if (isAllowed) {
      fetchReceiptSettings();
    }
  }, [isAllowed]);

  const isFreePlan = tenant?.plan === 'FREE';
  const publicStoreUrl = `omnipos.app/store/${tenant?.slug || 'toko'}`;

  const handleCopyUrl = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(`https://${publicStoreUrl}`);
      setCopied(true);
      toast.success(language === 'id' ? 'URL toko disalin ke papan klip!' : 'Store URL copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // 1. Simpan Nama Toko
  const handleSaveStoreSettings = async (e) => {
    e?.preventDefault();
    if (!canManage) {
      toast.error('Akses Ditolak: Anda tidak memiliki izin untuk mengubah pengaturan toko.');
      return;
    }
    if (!storeName.trim()) {
      toast.error('Nama toko wajib diisi.');
      return;
    }

    setIsSaving(true);
    try {
      const response = await api.put('/auth/store-settings', {
        name: storeName.trim(),
      });
      if (response?.success) {
        await checkAuth();
        toast.success(t('storeSettings.saveSuccess') || 'Pengaturan toko berhasil disimpan!');
      }
    } catch (err) {
      toast.error(err.message || 'Terjadi kesalahan saat menyimpan pengaturan toko.');
    } finally {
      setIsSaving(false);
    }
  };

  // 2. Simpan Konfigurasi Fitur Usaha
  const handleSaveBusinessConfig = async () => {
    if (!canManage) {
      toast.error('Akses Ditolak: Anda tidak memiliki izin untuk mengubah konfigurasi.');
      return;
    }

    setIsSavingConfig(true);
    try {
      const res = await api.put('/business-config', {
        businessPreset,
        businessConfig: featureConfig,
      });

      if (res.data.success) {
        toast.success('Konfigurasi fitur usaha berhasil diperbarui!');
        await checkAuth();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan konfigurasi.');
    } finally {
      setIsSavingConfig(false);
    }
  };

  // 3. Simpan Desain Struk Kasir
  const handleSaveReceiptSettings = async () => {
    if (!canManage) {
      toast.error('Akses Ditolak: Anda tidak memiliki izin untuk mengubah format struk.');
      return;
    }

    setIsSavingReceipt(true);
    try {
      const res = await api.put('/receipt-settings', receiptSettings);
      if (res.data.success) {
        toast.success(t('onboarding.saveReceiptSuccess') || 'Format struk kasir berhasil disimpan!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan pengaturan struk kasir.');
    } finally {
      setIsSavingReceipt(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
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

  const getPlanBadge = (plan) => {
    switch (plan) {
      case 'PRO':
        return {
          label: 'Paket PRO',
          classes: 'bg-purple-100 text-purple-800 border-purple-300 font-black',
          dot: 'bg-purple-500',
        };
      case 'PLUS':
        return {
          label: 'Paket PLUS',
          classes: 'bg-amber-100 text-amber-800 border-amber-300 font-extrabold',
          dot: 'bg-amber-500',
        };
      default:
        return {
          label: 'Paket FREE',
          classes: 'bg-slate-100 text-slate-700 border-slate-300 font-bold',
          dot: 'bg-amber-500',
        };
    }
  };

  const planBadge = getPlanBadge(tenant?.plan);

  if (!isAllowed && user) {
    return <UnauthorizedState requiredPermission="settings:view" />;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-400/40 text-amber-800 text-xs font-extrabold tracking-wide uppercase shadow-2xs backdrop-blur-md mb-2">
            <Settings className="w-3.5 h-3.5 text-amber-600" />
            <span>{t('storeSettings.badge') || 'Pengaturan & Langganan'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {t('storeSettings.title') || 'Pengaturan Toko'}
          </h1>
          <p className="text-sm text-slate-600 font-normal">
            {t('storeSettings.subtitle') || 'Kelola identitas toko, aktifkan fitur usaha, dan kustomisasi struk kasir.'}
          </p>
        </div>

        {/* Tab Navigation Pill */}
        <div className="flex p-1 bg-white/80 backdrop-blur-xl border border-white/90 shadow-xs rounded-2xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            Profil & Akun
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'config'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            Fitur Usaha
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('receipt')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'receipt'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            Desain Struk
          </button>
        </div>
      </div>

      {/* TAB 1: PROFIL & LANGGANAN */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {/* Kartu Identitas Toko & Form Ubah Nama */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] ring-1 ring-inset ring-white/70 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-amber-400 to-amber-600 p-0.5 shadow-md shadow-amber-500/20 shrink-0">
                  <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center text-amber-600 font-black text-xl">
                    {(tenant?.name || 'T').charAt(0).toUpperCase()}
                  </div>
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 leading-tight">
                    {tenant?.name || 'Toko Omni POS'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5 text-slate-400" />
                    <span>Slug:</span>
                    <span className="font-mono font-bold text-amber-700">{tenant?.slug || '-'}</span>
                  </p>
                </div>
              </div>

              <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs shadow-2xs self-start sm:self-auto ${planBadge.classes}`}>
                <span className={`w-2 h-2 rounded-full ${planBadge.dot} animate-pulse`} />
                <span>{planBadge.label}</span>
              </div>
            </div>

            {/* Form Ubah Nama Toko */}
            <form onSubmit={handleSaveStoreSettings} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="storeNameInput" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {t('storeSettings.storeName') || 'Nama Toko / Bisnis'}
                </label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <input
                    id="storeNameInput"
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder={t('storeSettings.storeNamePlaceholder') || 'Masukkan nama toko...'}
                    className="flex-1 px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 text-sm font-bold text-slate-900 outline-none transition-all"
                    required
                  />
                  <button
                    type="submit"
                    disabled={isSaving || storeName.trim() === tenant?.name || !canManage}
                    className={`py-3 px-6 rounded-2xl font-extrabold text-xs shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      isSaving || storeName.trim() === tenant?.name || !canManage
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                        : 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/15 active:scale-98'
                    }`}
                  >
                    {isSaving ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Save className="w-4 h-4 text-amber-400" />
                        <span>{t('storeSettings.saveBtn') || 'Simpan Perubahan'}</span>
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
                  {t('storeSettings.storeSlug') || 'URL Publik Toko'}
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
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/60 space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {t('storeSettings.ownerInfo') || 'Pemilik Toko'}
                </p>
                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-800 truncate">
                  <User className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="truncate">{user?.name || '-'}</span>
                  <span className="text-xs font-normal text-slate-500 truncate">({user?.email || '-'})</span>
                </div>
              </div>
            </div>
          </div>

          {/* Rincian Masa Aktif Langganan Toko */}
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
              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/60 space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{t('storeSettings.joinedDate') || 'Mulai Bergabung'}</span>
                </div>
                <p className="text-sm font-black text-slate-900">{formatDate(tenant?.createdAt) || '-'}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/60 space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <Crown className="w-3.5 h-3.5 text-purple-500" />
                  <span>{t('storeSettings.proJoinedDate') || 'Mulai Bergabung Jadi PRO'}</span>
                </div>
                <div>
                  {tenant?.proJoinedAt ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-purple-900">{formatDate(tenant.proJoinedAt)}</span>
                      <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[10px] font-black uppercase">
                        PRO
                      </span>
                    </div>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 text-xs font-semibold">
                      {t('storeSettings.notProYet') || 'Belum Berlangganan PRO'}
                    </span>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/60 space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>{t('storeSettings.proExpiryDate') || 'Tanggal Berakhir Langganan'}</span>
                </div>
                <div>
                  {isFreePlan ? (
                    <span className="text-sm font-black text-slate-900">
                      {t('storeSettings.lifetimeFree') || 'Permanen (Paket FREE)'}
                    </span>
                  ) : tenant?.subscriptionExpiresAt ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-black text-slate-900">{formatDate(tenant.subscriptionExpiresAt)}</span>
                      {remainingDays !== null && (
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                            remainingDays > 7 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800 animate-pulse'
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
                  <span>{t('storeSettings.billingCycleLabel') || 'Siklus Penagihan'}</span>
                </div>
                <p className="text-sm font-black text-slate-900">
                  {tenant?.billingCycle === 'yearly'
                    ? 'Tahunan (Yearly - Hemat 15%)'
                    : tenant?.billingCycle === 'monthly'
                    ? 'Bulanan (Monthly)'
                    : isFreePlan
                    ? 'Gratis Selamanya (FREE)'
                    : 'Standar'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: KONFIGURASI FITUR USAHA (BUSINESS CONFIG) */}
      {activeTab === 'config' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] ring-1 ring-inset ring-white/70 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-black text-slate-900">
                {t('onboarding.businessConfigTab') || 'Konfigurasi Fitur Usaha'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Aktifkan modul kerja kasir yang sesuai dengan alur operasional toko Anda.
              </p>
            </div>

            {/* Selector Preset Cepat */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Preset Bisnis:</span>
              <select
                value={businessPreset}
                onChange={(e) => setBusinessPreset(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-amber-500"
              >
                {BUSINESS_PRESET_LIST.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sakelar Kaca (Toggle Switches) */}
          <div className="space-y-3">
            {[
              {
                key: 'enableTableManagement',
                title: 'Manajemen Nomor Meja (Table Management)',
                desc: 'Tampilkan input nomor meja dan kelola pesanan dine-in tamu.',
              },
              {
                key: 'enableKitchenTicket',
                title: 'Tiket Dapur (Kitchen Order Print)',
                desc: 'Opsi cetak struk pesanan khusus koki/barista tanpa menampilkan nominal harga.',
              },
              {
                key: 'enableModifiers',
                title: 'Sistem Varian & Topping (Modifiers)',
                desc: 'Kustomisasi menu dengan opsi tambahan gula, level pedas, atau topping berbayar.',
              },
              {
                key: 'enableMultiUnit',
                title: 'Satuan Bertingkat / UOM (Dus → Renceng → Pcs)',
                desc: 'Dukungan penjualan multi satuan bertingkat dengan rasio konversi harga otomatis.',
              },
              {
                key: 'enableServiceTracking',
                title: 'Pelacakan Status Pengerjaan (Khusus Jasa/Laundry)',
                desc: 'Lacak tahapan pesanan: Diterima → Diproses → Siap Diambil → Selesai.',
              },
              {
                key: 'enableCustomerDebt',
                title: 'Fitur Kasbon / Hutang Pelanggan (Customer Debt)',
                desc: 'Izinkan pelanggan terpercaya berbelanja dengan opsi Bayar Nanti / Kasbon.',
              },
              {
                key: 'enableBarcodeFastScan',
                title: 'Mode Barcode Scanner Cepat',
                desc: 'Optimalkan terminal kasir untuk pembacaan barcode USB/Bluetooth instan.',
              },
            ].map((toggle) => {
              const isChecked = Boolean(featureConfig[toggle.key]);

              return (
                <div
                  key={toggle.key}
                  onClick={() =>
                    setFeatureConfig((prev) => ({
                      ...prev,
                      [toggle.key]: !isChecked,
                    }))
                  }
                  className="p-4 rounded-2xl bg-slate-50/80 hover:bg-slate-50 border border-slate-200/70 flex items-center justify-between gap-4 cursor-pointer select-none transition-colors"
                >
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{toggle.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{toggle.desc}</p>
                  </div>

                  <div className="shrink-0">
                    {isChecked ? (
                      <div className="w-12 h-6 bg-emerald-500 rounded-full p-0.5 flex items-center justify-end transition-colors">
                        <div className="w-5 h-5 bg-white rounded-full shadow-xs" />
                      </div>
                    ) : (
                      <div className="w-12 h-6 bg-slate-300 rounded-full p-0.5 flex items-center justify-start transition-colors">
                        <div className="w-5 h-5 bg-white rounded-full shadow-xs" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="button"
              onClick={handleSaveBusinessConfig}
              disabled={isSavingConfig || !canManage}
              className="py-3 px-6 rounded-2xl bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-md shadow-amber-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingConfig ? 'Menyimpan...' : 'Simpan Konfigurasi Fitur'}</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: DESAIN STRUK KASIR (RECEIPT DESIGN & THERMAL MOCKUP) */}
      {activeTab === 'receipt' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Kolom Kiri: Form Konfigurasi Struk (7 Kolom) */}
          <div className="lg:col-span-7 p-6 sm:p-8 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] ring-1 ring-inset ring-white/70 space-y-5">
            <div className="pb-4 border-b border-slate-100">
              <h2 className="text-lg font-black text-slate-900">
                {t('onboarding.receiptSettingsTab') || 'Desain Struk Kasir'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Atur format cetak thermal printer portabel (58mm) atau desktop (80mm).
              </p>
            </div>

            {/* Pilihan Ukuran Kertas */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                {t('onboarding.paperSizeLabel') || 'Ukuran Kertas Thermal'}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setReceiptSettings((prev) => ({ ...prev, paperSize: '58mm' }))}
                  className={`py-3 px-4 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    receiptSettings.paperSize === '58mm'
                      ? 'bg-amber-50 border-amber-300 text-amber-900 ring-2 ring-amber-500/20 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Printer className="w-4 h-4 text-amber-600" />
                  <span>58mm (Portabel / Bluetooth)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReceiptSettings((prev) => ({ ...prev, paperSize: '80mm' }))}
                  className={`py-3 px-4 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    receiptSettings.paperSize === '80mm'
                      ? 'bg-amber-50 border-amber-300 text-amber-900 ring-2 ring-amber-500/20 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Printer className="w-4 h-4 text-blue-600" />
                  <span>80mm (Desktop Thermal)</span>
                </button>
              </div>
            </div>

            {/* Header Text Tambahan */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {t('onboarding.headerTextLabel') || 'Catatan Header Struk'}
              </label>
              <input
                type="text"
                value={receiptSettings.headerText || ''}
                onChange={(e) => setReceiptSettings((prev) => ({ ...prev, headerText: e.target.value }))}
                placeholder="Misal: Wi-Fi: OmniGuest / Password: 123"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Footer Text */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {t('onboarding.footerTextLabel') || 'Pesan Footer / Ucapan'}
              </label>
              <textarea
                rows={3}
                value={receiptSettings.footerText || ''}
                onChange={(e) => setReceiptSettings((prev) => ({ ...prev, footerText: e.target.value }))}
                placeholder="Pesan terima kasih atau syarat retur..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Toggle Tampilkan Info */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              {[
                { key: 'showCashierName', label: 'Tampilkan Nama Kasir' },
                { key: 'showCustomerName', label: 'Tampilkan Nama Pelanggan' },
                { key: 'showTableNumber', label: 'Tampilkan Nomor Meja' },
              ].map((item) => (
                <label
                  key={item.key}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/60 cursor-pointer"
                >
                  <span className="text-xs font-bold text-slate-700">{item.label}</span>
                  <input
                    type="checkbox"
                    checked={Boolean(receiptSettings[item.key])}
                    onChange={(e) =>
                      setReceiptSettings((prev) => ({
                        ...prev,
                        [item.key]: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 text-amber-600 rounded-md focus:ring-amber-500"
                  />
                </label>
              ))}
            </div>

            <div className="pt-3">
              <button
                type="button"
                onClick={handleSaveReceiptSettings}
                disabled={isSavingReceipt || !canManage}
                className="w-full py-3 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md shadow-slate-900/15 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4 text-amber-400" />
                <span>{isSavingReceipt ? 'Menyimpan...' : 'Simpan Pengaturan Struk'}</span>
              </button>
            </div>
          </div>

          {/* Kolom Kanan: Pratinjau Kertas Struk Realtime (5 Kolom) */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="mb-2 text-xs font-bold text-slate-500 flex items-center gap-1.5">
              <Receipt className="w-4 h-4 text-amber-600" />
              <span>{t('onboarding.previewReceipt') || 'Pratinjau Struk Kasir'}</span>
            </div>

            {/* Kertas Struk Thermal Mockup Monospace */}
            <div
              className={`bg-white text-slate-900 font-mono text-[11px] leading-tight p-5 shadow-2xl rounded-sm border-t-8 border-slate-800 relative transition-all duration-300 ${
                receiptSettings.paperSize === '80mm' ? 'w-80' : 'w-64'
              }`}
              style={{
                filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.12))',
              }}
            >
              {/* Header Toko */}
              <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-300">
                <p className="font-extrabold text-sm uppercase tracking-wider">{tenant?.name || 'OMNI POS CAFE'}</p>
                <p className="text-[10px] text-slate-500">{publicStoreUrl}</p>
                {receiptSettings.headerText && (
                  <p className="text-[9px] text-slate-600 font-semibold">{receiptSettings.headerText}</p>
                )}
              </div>

              {/* Meta Transaksi */}
              <div className="py-2.5 space-y-1 border-b border-dashed border-slate-300 text-[10px]">
                <div className="flex justify-between">
                  <span>No: ORD-DEMO-001</span>
                  <span>14:32</span>
                </div>
                {receiptSettings.showCashierName && (
                  <div className="flex justify-between">
                    <span>Kasir: {user?.name || 'Kasir 1'}</span>
                  </div>
                )}
                {receiptSettings.showCustomerName && (
                  <div className="flex justify-between">
                    <span>Pelanggan: Budi Santoso</span>
                  </div>
                )}
                {receiptSettings.showTableNumber && (
                  <div className="flex justify-between">
                    <span>Meja: 08 (Dine In)</span>
                  </div>
                )}
              </div>

              {/* Items Pesanan */}
              <div className="py-2.5 space-y-2 border-b border-dashed border-slate-300 text-[10px]">
                <div>
                  <div className="flex justify-between font-bold">
                    <span>1x Kopi Susu Gula Aren</span>
                    <span>18.000</span>
                  </div>
                  <div className="text-[9px] text-slate-500 pl-2">
                    + Less Sugar 50%
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-bold">
                    <span>2x Roti Bakar Coklat Keju</span>
                    <span>32.000</span>
                  </div>
                </div>
              </div>

              {/* Total & Pembayaran */}
              <div className="py-2.5 space-y-1 border-b border-dashed border-slate-300 text-[10px]">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>50.000</span>
                </div>
                <div className="flex justify-between">
                  <span>Diskon:</span>
                  <span>-0</span>
                </div>
                <div className="flex justify-between font-bold text-xs pt-1">
                  <span>TOTAL:</span>
                  <span>Rp 50.000</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span>Bayar (TUNAI):</span>
                  <span>50.000</span>
                </div>
                <div className="flex justify-between">
                  <span>Kembali:</span>
                  <span>0</span>
                </div>
              </div>

              {/* Footer Struk */}
              <div className="pt-3 text-center text-[9px] text-slate-600 whitespace-pre-line">
                {receiptSettings.footerText || 'Terima kasih atas kunjungan Anda!'}
              </div>

              {/* Efek Bergerigi Kertas Bawah */}
              <div
                className="absolute -bottom-2 left-0 right-0 h-2 bg-transparent"
                style={{
                  backgroundImage:
                    'radial-gradient(circle, transparent, transparent 50%, #ffffff 50%, #ffffff 100%)',
                  backgroundSize: '10px 10px',
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
