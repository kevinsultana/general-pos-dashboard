'use client';

import React, { useEffect, useState } from 'react';
import {
  Settings,
  Store as StoreIcon,
  UtensilsCrossed,
  Printer,
  Users,
  Bookmark,
  CreditCard,
  RotateCcw,
  Coins,
  CheckCircle,
  Save,
  ShieldCheck,
  Cloud,
  RefreshCw,
  Laptop,
  Activity,
  Plus,
  Trash2,
  X,
  Crown,
  Sparkles,
  Lock,
  Copy,
  UserCheck,
  Key,
  Globe,
  Database,
  GitBranch,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { Topbar } from '../../../components/Topbar';
import { UpgradeModal } from '../../../components/UpgradeModal';
import { api } from '../../../lib/api';
import { Store, PaymentMethod, SyncStatusData, Printer as PrinterType } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { formatDate } from '../../../lib/formatters';

type TabType = 'profile' | 'pos' | 'cloud';

export default function SettingsPage() {
  const toast = useToast();
  const { user, store: authStore, plan, isFree, refreshUser, refreshSubscription } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('profile');

  // Gating & Modal State
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<string | undefined>();

  // Data State
  const [store, setStore] = useState<Store | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [printers, setPrinters] = useState<PrinterType[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatusData | null>(null);
  const [isRefreshingSync, setIsRefreshingSync] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingStore, setIsSavingStore] = useState(false);
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // 1. Profil Toko Form (Universal)
  const [profileForm, setProfileForm] = useState({
    name: '',
    ownerName: '',
    phone: '',
    email: '',
    address: '',
    receiptFooter: 'Terima kasih atas kunjungan Anda!',
    currency: 'IDR',
    timezone: 'Asia/Jakarta',
  });

  // 2. Keamanan Akun Form (Universal)
  const [accountForm, setAccountForm] = useState({
    username: '',
    displayName: '',
    newPassword: '',
    confirmPassword: '',
  });

  // 3. POS Operasional Toggles (Universal)
  const [toggles, setToggles] = useState({
    restaurantEnabled: false,
    kitchenPrintingEnabled: false,
    customerEnabled: false,
    draftEnabled: true,
    splitPaymentEnabled: false,
    refundEnabled: true,
    cashRoundingEnabled: false,
    cashRoundingIncrement: 100,
    cashRoundingMode: 'ROUND_NEAREST' as 'ROUND_NEAREST' | 'ROUND_UP' | 'ROUND_DOWN',
  });

  // 4. Cloud PRO Configuration (Gated PRO)
  const [webhookConfig, setWebhookConfig] = useState({
    url: 'https://api.toko-anda.com/v1/webhook',
    secretKey: 'whsec_••••••••••••••••••••••••',
    orderCreated: true,
    stockLow: true,
    refundIssued: false,
  });

  const [multiOutletConfig, setMultiOutletConfig] = useState({
    centralizedInventory: true,
    allowInterBranchTransfer: true,
    autoRebalanceStock: false,
  });

  const [backupConfig, setBackupConfig] = useState({
    autoDailyBackup: true,
    retainDays: 30,
    encryptedAtRest: true,
  });

  // Printer Management Modal State
  const [showPrinterModal, setShowPrinterModal] = useState(false);
  const [isSavingPrinter, setIsSavingPrinter] = useState(false);
  const [printerForm, setPrinterForm] = useState({
    name: '',
    connectionType: 'BLUETOOTH' as 'BLUETOOTH' | 'USB' | 'NETWORK',
    addressReference: '',
    paperSize: 'PAPER_58MM' as 'PAPER_58MM' | 'PAPER_80MM',
    role: 'RECEIPT' as 'RECEIPT' | 'KITCHEN' | 'BOTH',
    receiptCopies: 1,
    kitchenCopies: 1,
    autoPrint: false,
    active: true,
  });

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const [storeData, pmData, syncData, printersData] = await Promise.all([
        api.getStore(),
        api.getPaymentMethods().catch(() => []),
        api.getSyncStatus().catch(() => null),
        api.getPrinters().catch(() => []),
      ]);

      if (storeData) {
        setStore(storeData);
        const storedFooter = typeof window !== 'undefined'
          ? localStorage.getItem(`pos_receipt_footer_${storeData.id}`)
          : null;

        setProfileForm({
          name: storeData.name || '',
          ownerName: storeData.ownerName || '',
          phone: storeData.phone || '',
          email: storeData.email || '',
          address: storeData.address || '',
          receiptFooter: storedFooter || 'Terima kasih telah berbelanja!',
          currency: storeData.currency || 'IDR',
          timezone: storeData.timezone || 'Asia/Jakarta',
        });

        setToggles({
          restaurantEnabled: storeData.restaurantEnabled ?? false,
          kitchenPrintingEnabled: storeData.kitchenPrintingEnabled ?? false,
          customerEnabled: storeData.customerEnabled ?? false,
          draftEnabled: storeData.draftEnabled ?? true,
          splitPaymentEnabled: storeData.splitPaymentEnabled ?? false,
          refundEnabled: storeData.refundEnabled ?? true,
          cashRoundingEnabled: storeData.cashRoundingEnabled ?? false,
          cashRoundingIncrement: storeData.cashRoundingIncrement || 100,
          cashRoundingMode: storeData.cashRoundingMode || 'ROUND_NEAREST',
        });
      }

      if (user) {
        setAccountForm({
          username: user.username || '',
          displayName: user.displayName || '',
          newPassword: '',
          confirmPassword: '',
        });
      }

      setPaymentMethods(pmData || []);
      setPrinters(printersData || []);
      if (syncData) setSyncStatus(syncData);
    } catch (err) {
      console.error('Failed to load store settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSyncData = async () => {
    setIsRefreshingSync(true);
    try {
      const data = await api.getSyncStatus();
      setSyncStatus(data);
      toast.info('Status sinkronisasi diperbarui');
    } catch (err) {
      console.error('Failed to load sync status:', err);
    } finally {
      setIsRefreshingSync(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, [user]);

  // Handler: Simpan Profil Toko (Universal)
  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingStore(true);
    setSaveSuccess(false);

    try {
      // Simpan receipt footer ke localStorage untuk struk kasir
      if (store?.id && typeof window !== 'undefined') {
        localStorage.setItem(`pos_receipt_footer_${store.id}`, profileForm.receiptFooter);
      }

      await api.updateStore({
        name: profileForm.name,
        ownerName: profileForm.ownerName,
        phone: profileForm.phone,
        email: profileForm.email || undefined,
        address: profileForm.address,
        currency: profileForm.currency,
        timezone: profileForm.timezone,
        ...toggles,
      });

      setSaveSuccess(true);
      await refreshUser();
      toast.success('Pengaturan profil toko berhasil diperbarui!');
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan pengaturan toko');
    } finally {
      setIsSavingStore(false);
    }
  };

  // Handler: Simpan Keamanan Akun (Universal)
  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      toast.error('Sesi pengguna tidak valid');
      return;
    }

    if (accountForm.newPassword) {
      if (accountForm.newPassword.length < 6) {
        toast.error('Password baru minimal harus 6 karakter');
        return;
      }
      if (accountForm.newPassword !== accountForm.confirmPassword) {
        toast.error('Konfirmasi password tidak cocok');
        return;
      }
    }

    setIsSavingAccount(true);
    try {
      const payload: any = {
        username: accountForm.username,
        displayName: accountForm.displayName,
      };

      if (accountForm.newPassword) {
        payload.password = accountForm.newPassword;
      }

      await api.updateUser(user.id, payload);
      await refreshUser();
      setAccountForm((prev) => ({ ...prev, newPassword: '', confirmPassword: '' }));
      toast.success('Informasi keamanan akun berhasil diperbarui!');
    } catch (err: any) {
      toast.error(err.message || 'Gagal memperbarui akun');
    } finally {
      setIsSavingAccount(false);
    }
  };

  // Handler: Intersepsi Fitur PRO
  const handleProFeatureClick = (featureTitle: string) => {
    if (isFree) {
      setSelectedFeature(featureTitle);
      setShowUpgradeModal(true);
    } else {
      toast.info(`Konfigurasi ${featureTitle} aktif.`);
    }
  };

  const handleCopyStoreId = () => {
    if (store?.id) {
      navigator.clipboard.writeText(store.id);
      toast.success('ID Toko disalin ke clipboard');
    }
  };

  const handleTogglePayment = async (pm: PaymentMethod) => {
    try {
      const isCurrentlyActive = pm.enabled ?? pm.active ?? false;
      const updated = !isCurrentlyActive;
      await api.updatePaymentMethod(pm.id, { enabled: updated });
      setPaymentMethods((prev) =>
        prev.map((item) =>
          item.id === pm.id ? { ...item, enabled: updated, active: updated } : item
        )
      );
      toast.info(`Metode ${pm.name} kini ${updated ? 'Aktif' : 'Nonaktif'}`);
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengubah status metode pembayaran');
    }
  };

  const handleCreatePrinter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!printerForm.name) {
      toast.error('Nama printer wajib diisi');
      return;
    }
    setIsSavingPrinter(true);
    try {
      const newPrinter = await api.createPrinter(printerForm);
      setPrinters((prev) => [...prev, newPrinter]);
      toast.success(`Printer ${newPrinter.name} berhasil ditambahkan`);
      setShowPrinterModal(false);
      setPrinterForm({
        name: '',
        connectionType: 'BLUETOOTH',
        addressReference: '',
        paperSize: 'PAPER_58MM',
        role: 'RECEIPT',
        receiptCopies: 1,
        kitchenCopies: 1,
        autoPrint: false,
        active: true,
      });
    } catch (err: any) {
      toast.error(err.message || 'Gagal menambahkan printer');
    } finally {
      setIsSavingPrinter(false);
    }
  };

  const handleDeletePrinter = async (printerId: string, printerName: string) => {
    if (!window.confirm(`Yakin ingin menghapus konfigurasi printer ${printerName}?`)) return;
    try {
      await api.deletePrinter(printerId);
      setPrinters((prev) => prev.filter((p) => p.id !== printerId));
      toast.info(`Printer ${printerName} telah dihapus`);
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus printer');
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <Topbar
        title="Pengaturan Toko & Akun"
        description="Kelola profil usaha, kredensial keamanan akun, konfigurasi POS, serta integrasi cloud"
      />

      <main className="p-6 space-y-6 flex-1 max-w-5xl">
        {/* Navigation Tabs Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
                activeTab === 'profile'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <StoreIcon className="w-4 h-4" />
              <span>Profil & Akun Toko</span>
            </button>

            <button
              onClick={() => setActiveTab('pos')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
                activeTab === 'pos'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Operasional & POS</span>
            </button>

            <button
              onClick={() => setActiveTab('cloud')}
              className={`relative px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
                activeTab === 'cloud'
                  ? 'bg-linear-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-amber-600/25'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Cloud className="w-4 h-4" />
              <span>Cloud PRO & Integrasi</span>
              {isFree && (
                <span className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <Lock className="w-2.5 h-2.5" />
                  <span>PRO</span>
                </span>
              )}
            </button>
          </div>

          {/* Quick Plan Badge */}
          <div className="hidden sm:flex items-center gap-2">
            <span
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wider uppercase border flex items-center gap-1.5 ${
                isFree
                  ? 'bg-slate-800/80 text-slate-300 border-slate-700'
                  : 'bg-linear-to-r from-amber-500/15 to-orange-500/15 text-amber-400 border-amber-500/30'
              }`}
            >
              <Crown className="w-3 h-3 text-amber-400" />
              <span>Tier: {plan}</span>
            </span>
          </div>
        </div>

        {saveSuccess && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>Perubahan data toko berhasil disimpan!</span>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 1: PROFIL & KEAMANAN AKUN (AKSES UNIVERSAL FREE & PRO)     */}
        {/* ============================================================== */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Status & Informasi Langganan Card */}
            <div className="glass-card p-5 relative overflow-hidden border-indigo-500/20 bg-linear-to-br from-[#111728] via-[#0e1424] to-[#0a0e1a]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-semibold text-slate-400">Informasi Status Langganan Toko</span>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase border ${
                        isFree
                          ? 'bg-slate-800 text-slate-300 border-slate-700'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}
                    >
                      {plan} TIER
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <span>{store?.name || 'Toko Anda'}</span>
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                    <span>Store ID:</span>
                    <span className="text-indigo-300">{store?.id || 'Memuat...'}</span>
                    {store?.id && (
                      <button
                        type="button"
                        onClick={handleCopyStoreId}
                        className="p-1 hover:text-slate-100 text-slate-500 transition cursor-pointer"
                        title="Salin ID Toko"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 pt-1">
                    {isFree
                      ? 'Mode Bebas / Offline-First: Berjalan mandiri tanpa sinkronisasi cloud. Seluruh database transaksi tersimpan aman di perangkat POS kasir.'
                      : 'Mode Enterprise Cloud: Sinkronisasi cloud multi-kasir aktif, dashboard analitik real-time, dan audit trail terpusat.'}
                  </p>
                </div>

                {isFree && (
                  <div className="shrink-0 flex sm:flex-col items-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFeature('Akses Penuh Cloud & Multi-Kasir');
                        setShowUpgradeModal(true);
                      }}
                      className="pos-btn-primary px-4 py-2 text-xs flex items-center gap-2 bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 border-0 shadow-lg shadow-amber-500/25"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Upgrade ke PRO</span>
                    </button>
                    <span className="text-[10px] text-amber-400/80">Simulasi instan 1-klik</span>
                  </div>
                )}
              </div>
            </div>

            {/* Form Profil Toko Dasar */}
            <form onSubmit={handleSaveStore} className="glass-card p-6 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <StoreIcon className="w-5 h-5 text-indigo-400" />
                  <div>
                    <h3 className="font-semibold text-slate-100 text-sm">Profil Toko Dasar</h3>
                    <p className="text-[11px] text-slate-400">
                      Informasi fisik toko yang ditampilkan di struk pembelian pelanggan
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Universal (Free & Pro)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Nama Toko / Usaha *
                  </label>
                  <input
                    type="text"
                    required
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="pos-input px-3 py-2 text-xs"
                    placeholder="Contoh: Kopi Kenangan Senja"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Nama Pemilik Toko
                  </label>
                  <input
                    type="text"
                    value={profileForm.ownerName}
                    onChange={(e) => setProfileForm({ ...profileForm, ownerName: e.target.value })}
                    className="pos-input px-3 py-2 text-xs"
                    placeholder="Contoh: Kevin Sultana"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    No. Telepon / WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="pos-input px-3 py-2 text-xs"
                    placeholder="Contoh: 081234567890"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Email Kontak Toko
                  </label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="pos-input px-3 py-2 text-xs"
                    placeholder="toko@example.com"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Alamat Fisik Toko
                  </label>
                  <textarea
                    rows={2}
                    value={profileForm.address}
                    onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                    className="pos-input px-3 py-2 text-xs"
                    placeholder="Jl. Jendral Sudirman No. 45, Jakarta Pusat"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Catatan Footer Struk Cetak
                  </label>
                  <input
                    type="text"
                    value={profileForm.receiptFooter}
                    onChange={(e) => setProfileForm({ ...profileForm, receiptFooter: e.target.value })}
                    className="pos-input px-3 py-2 text-xs"
                    placeholder="Contoh: Terima kasih atas kunjungan Anda! Barang yang dibeli tidak dapat ditukar."
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Teks ini akan dicetak di bagian paling bawah struk kasir thermal 58mm/80mm.
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-800">
                <button
                  type="submit"
                  disabled={isSavingStore}
                  className="pos-btn-primary px-5 py-2 text-xs flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingStore ? 'Menyimpan Profil...' : 'Simpan Profil Toko'}</span>
                </button>
              </div>
            </form>

            {/* Form Keamanan Akun & Kredensial */}
            <form onSubmit={handleSaveAccount} className="glass-card p-6 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <Key className="w-5 h-5 text-indigo-400" />
                  <div>
                    <h3 className="font-semibold text-slate-100 text-sm">Keamanan Akun & Kredensial</h3>
                    <p className="text-[11px] text-slate-400">
                      Ubah username login dan password administrator pemilik toko
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Universal (Free & Pro)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Username Akun *
                  </label>
                  <input
                    type="text"
                    required
                    value={accountForm.username}
                    onChange={(e) => setAccountForm({ ...accountForm, username: e.target.value })}
                    className="pos-input px-3 py-2 text-xs font-mono"
                    placeholder="admin_toko"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Digunakan untuk login ke Web Dashboard dan Cloud POS Mobile.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Nama Tampilan Akun *
                  </label>
                  <input
                    type="text"
                    required
                    value={accountForm.displayName}
                    onChange={(e) => setAccountForm({ ...accountForm, displayName: e.target.value })}
                    className="pos-input px-3 py-2 text-xs"
                    placeholder="Nama Anda"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Ganti Password Baru (Opsional)
                  </label>
                  <input
                    type="password"
                    value={accountForm.newPassword}
                    onChange={(e) => setAccountForm({ ...accountForm, newPassword: e.target.value })}
                    className="pos-input px-3 py-2 text-xs"
                    placeholder="Kosongkan jika tidak ingin mengubah"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Konfirmasi Password Baru
                  </label>
                  <input
                    type="password"
                    value={accountForm.confirmPassword}
                    onChange={(e) => setAccountForm({ ...accountForm, confirmPassword: e.target.value })}
                    className="pos-input px-3 py-2 text-xs"
                    placeholder="Ketik ulang password baru"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-800">
                <button
                  type="submit"
                  disabled={isSavingAccount}
                  className="pos-btn-primary px-5 py-2 text-xs flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingAccount ? 'Menyimpan Kredensial...' : 'Perbarui Kredensial Akun'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: OPERASIONAL & POS (AKSES UNIVERSAL FREE & PRO)          */}
        {/* ============================================================== */}
        {activeTab === 'pos' && (
          <form onSubmit={handleSaveStore} className="space-y-6">
            {/* Feature Toggles */}
            <div className="glass-card p-6 space-y-4">
              <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
                <Settings className="w-5 h-5 text-indigo-400" />
                <h3 className="font-semibold text-slate-100 text-sm">Fitur Operasional & Modul POS</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Mode Restoran */}
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-1.5 text-slate-200 text-xs font-semibold">
                      <UtensilsCrossed className="w-4 h-4 text-amber-400" />
                      <span>Mode Restoran / F&B</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Aktifkan opsi Dine In (Makan di Tempat) dan Takeaway (Bungkus) saat membuat pesanan.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={toggles.restaurantEnabled}
                    onChange={(e) => setToggles({ ...toggles, restaurantEnabled: e.target.checked })}
                    className="mt-1 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-800 border-slate-700 cursor-pointer"
                  />
                </div>

                {/* Kitchen Printing */}
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-1.5 text-slate-200 text-xs font-semibold">
                      <Printer className="w-4 h-4 text-cyan-400" />
                      <span>Cetak Tiket Dapur (Kitchen)</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Otomatis cetak salinan tiket pesanan ke printer dapur untuk pesanan Dine In.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={toggles.kitchenPrintingEnabled}
                    onChange={(e) => setToggles({ ...toggles, kitchenPrintingEnabled: e.target.checked })}
                    className="mt-1 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-800 border-slate-700 cursor-pointer"
                  />
                </div>

                {/* Customer Module */}
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-1.5 text-slate-200 text-xs font-semibold">
                      <Users className="w-4 h-4 text-emerald-400" />
                      <span>Modul Pelanggan</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Izinkan kasir memilih nama pelanggan saat transaksi untuk mencatat riwayat belanja.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={toggles.customerEnabled}
                    onChange={(e) => setToggles({ ...toggles, customerEnabled: e.target.checked })}
                    className="mt-1 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-800 border-slate-700 cursor-pointer"
                  />
                </div>

                {/* Draft / Hold Orders */}
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-1.5 text-slate-200 text-xs font-semibold">
                      <Bookmark className="w-4 h-4 text-indigo-400" />
                      <span>Simpan Pesanan (Draft / Hold)</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Bisa menahan keranjang belanja pelanggan sementara waktu tanpa memotong stok fisik.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={toggles.draftEnabled}
                    onChange={(e) => setToggles({ ...toggles, draftEnabled: e.target.checked })}
                    className="mt-1 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-800 border-slate-700 cursor-pointer"
                  />
                </div>

                {/* Split Payment */}
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-1.5 text-slate-200 text-xs font-semibold">
                      <CreditCard className="w-4 h-4 text-purple-400" />
                      <span>Pisah Pembayaran (Split Payment)</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Pelanggan dapat membayar dengan kombinasi tunai + QRIS atau kartu debit sekaligus.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={toggles.splitPaymentEnabled}
                    onChange={(e) => setToggles({ ...toggles, splitPaymentEnabled: e.target.checked })}
                    className="mt-1 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-800 border-slate-700 cursor-pointer"
                  />
                </div>

                {/* Refund Policy */}
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-1.5 text-slate-200 text-xs font-semibold">
                      <RotateCcw className="w-4 h-4 text-rose-400" />
                      <span>Fitur Refund Transaksi</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Izinkan pengembalian uang dan pemulihan stok baik secara penuh maupun sebagian.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={toggles.refundEnabled}
                    onChange={(e) => setToggles({ ...toggles, refundEnabled: e.target.checked })}
                    className="mt-1 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-800 border-slate-700 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Cash Rounding */}
            <div className="glass-card p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <Coins className="w-5 h-5 text-amber-400" />
                  <h3 className="font-semibold text-slate-100 text-sm">Pembulatan Kas (Cash Rounding)</h3>
                </div>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <span className="text-xs text-slate-400">Status Pembulatan</span>
                  <input
                    type="checkbox"
                    checked={toggles.cashRoundingEnabled}
                    onChange={(e) => setToggles({ ...toggles, cashRoundingEnabled: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-800 border-slate-700 cursor-pointer"
                  />
                </label>
              </div>

              {toggles.cashRoundingEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Mode Pembulatan</label>
                    <select
                      value={toggles.cashRoundingMode}
                      onChange={(e: any) => setToggles({ ...toggles, cashRoundingMode: e.target.value })}
                      className="pos-select w-full px-3 py-2 text-xs"
                    >
                      <option value="ROUND_NEAREST">Ke Nilai Terdekat (Round Nearest)</option>
                      <option value="ROUND_UP">Selalu Bulatkan ke Atas (Round Up / Ceiling)</option>
                      <option value="ROUND_DOWN">Selalu Bulatkan ke Bawah (Round Down / Floor)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Kelipatan Nominal (Rupiah)</label>
                    <select
                      value={toggles.cashRoundingIncrement}
                      onChange={(e) => setToggles({ ...toggles, cashRoundingIncrement: parseInt(e.target.value, 10) })}
                      className="pos-select w-full px-3 py-2 text-xs"
                    >
                      <option value={100}>Kelipatan Rp 100</option>
                      <option value={500}>Kelipatan Rp 500</option>
                      <option value={1000}>Kelipatan Rp 1.000</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Metode Pembayaran */}
            <div className="glass-card p-6 space-y-4">
              <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
                <CreditCard className="w-5 h-5 text-indigo-400" />
                <h3 className="font-semibold text-slate-100 text-sm">Metode Pembayaran Kasir</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {paymentMethods.map((pm) => {
                  const isEnabled = pm.enabled ?? pm.active ?? false;
                  return (
                    <div
                      key={pm.id}
                      className={`p-3 rounded-xl border transition flex items-center justify-between ${
                        isEnabled
                          ? 'bg-slate-900/80 border-indigo-500/40 text-slate-200'
                          : 'bg-slate-900/30 border-slate-800/80 text-slate-500'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold">{pm.name}</p>
                        <p className="text-[10px] font-mono text-slate-400">{pm.type}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleTogglePayment(pm)}
                        className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                          isEnabled
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        {isEnabled ? 'Aktif' : 'Nonaktif'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Perangkat Printer Thermal */}
            <div className="glass-card p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <Printer className="w-5 h-5 text-cyan-400" />
                  <div>
                    <h3 className="font-semibold text-slate-100 text-sm">Perangkat Printer & Format Struk</h3>
                    <p className="text-[11px] text-slate-400">
                      Printer kasir, dapur, dan konfigurasi cetak struk (ESC/POS Thermal 58mm / 80mm)
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-xs text-slate-400 font-mono">{printers.length} printer</span>
                  <button
                    type="button"
                    onClick={() => setShowPrinterModal(true)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition shadow-md shadow-indigo-600/20 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Printer</span>
                  </button>
                </div>
              </div>

              {printers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {printers.map((p) => (
                    <div
                      key={p.id}
                      className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80 space-y-2.5"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-slate-100">{p.name}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              p.role === 'BOTH'
                                ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                : p.role === 'KITCHEN'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            }`}>
                              {p.role === 'BOTH' ? 'Kasir & Dapur' : p.role === 'KITCHEN' ? 'Dapur' : 'Struk Kasir'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                            {p.connectionType} • {p.addressReference || 'Default Port'}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {p.active ? 'Aktif' : 'Nonaktif'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeletePrinter(p.id, p.name)}
                            className="p-1 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                            title="Hapus printer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-300 pt-1 border-t border-slate-800/60">
                        <span>Lebar Kertas: <strong className="text-slate-100 font-mono">{p.paperSize === 'PAPER_80MM' ? '80mm' : '58mm'}</strong></span>
                        <span>Salinan: <strong className="text-slate-100 font-mono">{p.receiptCopies}x</strong></span>
                        {p.autoPrint && (
                          <span className="text-cyan-400 text-[10px] font-medium">Auto-Print</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-500 bg-slate-900/30 rounded-xl border border-slate-800/60">
                  Belum ada printer tersimpan. Tambahkan printer kasir untuk cetak struk otomatis.
                </div>
              )}
            </div>

            {/* Simpan Pengaturan Operasional */}
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="submit"
                disabled={isSavingStore}
                className="pos-btn-primary px-6 py-2.5 disabled:opacity-50 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingStore ? 'Menyimpan Pengaturan...' : 'Simpan Pengaturan Operasional'}</span>
              </button>
            </div>
          </form>
        )}

        {/* ============================================================== */}
        {/* TAB 3: CLOUD PRO & INTEGRASI (AKSES GATING PRO EXCLUSIVE)       */}
        {/* ============================================================== */}
        {activeTab === 'cloud' && (
          <div className="space-y-6">
            {/* Banner Gating untuk Pengguna Free */}
            {isFree && (
              <div className="p-5 rounded-2xl bg-linear-to-r from-amber-500/15 via-orange-500/10 to-transparent border border-amber-500/30 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        <span>PRO EXCLUSIVE</span>
                      </span>
                      <h4 className="text-sm font-bold text-slate-100">
                        Fitur Integrasi Cloud & Multi-Branch Memerlukan Lisensi PRO
                      </h4>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                      Akun Anda saat ini berada pada tier <strong>FREE</strong>. Untuk membuka integrasi Webhook API, pengelolaan multi-outlet, sinkronisasi cloud real-time, dan backup otomatis terpusat, silakan lakukan upgrade akun toko ke paket <strong>PRO</strong>.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFeature('Cloud PRO & Integrasi API');
                      setShowUpgradeModal(true);
                    }}
                    className="pos-btn-primary px-4 py-2 text-xs flex items-center gap-2 bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 border-0 shadow-lg shadow-amber-500/25 shrink-0"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Buka Akses PRO</span>
                  </button>
                </div>
              </div>
            )}

            {/* 1. Cloud Webhook API Integrations */}
            <div className={`glass-card p-6 space-y-4 relative ${isFree ? 'opacity-90' : ''}`}>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <Globe className="w-5 h-5 text-indigo-400" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-100 text-sm">Cloud Integrations / Webhook API</h3>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" />
                        <span>PRO</span>
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Kirimkan webhook payload otomatis saat transaksi sukses atau stok menipis ke sistem backend Anda
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleProFeatureClick('Webhook API & Cloud Integrations')}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition border border-slate-700 cursor-pointer flex items-center gap-1.5"
                >
                  {isFree && <Lock className="w-3 h-3 text-amber-400" />}
                  <span>{isFree ? 'Buka Kunci' : 'Simpan Webhook'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Webhook Endpoint URL</label>
                  <input
                    type="url"
                    disabled={isFree}
                    value={webhookConfig.url}
                    onChange={(e) => setWebhookConfig({ ...webhookConfig, url: e.target.value })}
                    className="pos-input px-3 py-2 text-xs font-mono disabled:bg-slate-900/60 disabled:cursor-not-allowed"
                    placeholder="https://domain.com/webhook/pos"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Signing Secret Key</label>
                  <input
                    type="text"
                    disabled
                    value={webhookConfig.secretKey}
                    className="pos-input px-3 py-2 text-xs font-mono bg-slate-900/60 cursor-not-allowed text-slate-400"
                  />
                </div>

                <div className="md:col-span-2 pt-2 border-t border-slate-800/80">
                  <p className="text-xs font-medium text-slate-300 mb-2">Langganan Event Triggers</p>
                  <div className="flex flex-wrap gap-4">
                    <label
                      onClick={() => isFree && handleProFeatureClick('Webhook Triggers')}
                      className={`flex items-center space-x-2 text-xs text-slate-300 ${isFree ? 'cursor-pointer' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={webhookConfig.orderCreated}
                        readOnly={isFree}
                        onChange={(e) => !isFree && setWebhookConfig({ ...webhookConfig, orderCreated: e.target.checked })}
                        className="rounded text-indigo-600 bg-slate-800 border-slate-700"
                      />
                      <span>order.created (Transaksi Selesai)</span>
                    </label>

                    <label
                      onClick={() => isFree && handleProFeatureClick('Webhook Triggers')}
                      className={`flex items-center space-x-2 text-xs text-slate-300 ${isFree ? 'cursor-pointer' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={webhookConfig.stockLow}
                        readOnly={isFree}
                        onChange={(e) => !isFree && setWebhookConfig({ ...webhookConfig, stockLow: e.target.checked })}
                        className="rounded text-indigo-600 bg-slate-800 border-slate-700"
                      />
                      <span>inventory.low_stock (Stok Menipis)</span>
                    </label>

                    <label
                      onClick={() => isFree && handleProFeatureClick('Webhook Triggers')}
                      className={`flex items-center space-x-2 text-xs text-slate-300 ${isFree ? 'cursor-pointer' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={webhookConfig.refundIssued}
                        readOnly={isFree}
                        onChange={(e) => !isFree && setWebhookConfig({ ...webhookConfig, refundIssued: e.target.checked })}
                        className="rounded text-indigo-600 bg-slate-800 border-slate-700"
                      />
                      <span>order.refunded (Transaksi Direfund)</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Multi-Outlet / Multi-Branch Management */}
            <div className={`glass-card p-6 space-y-4 relative ${isFree ? 'opacity-90' : ''}`}>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <GitBranch className="w-5 h-5 text-indigo-400" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-100 text-sm">Multi-Outlet / Multi-Branch Management</h3>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" />
                        <span>PRO</span>
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Manajemen terpusat untuk cabang toko fisik, transfer stok antar-outlet, dan konsolidasi laporan
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleProFeatureClick('Multi-Outlet / Multi-Branch Management')}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition border border-slate-700 cursor-pointer flex items-center gap-1.5"
                >
                  {isFree && <Lock className="w-3 h-3 text-amber-400" />}
                  <span>{isFree ? 'Buka Kunci' : 'Tambah Outlet'}</span>
                </button>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-slate-200">Outlet Utama (Pusat)</p>
                    <p className="text-[11px] text-slate-400">{store?.name || 'Toko Utama'} • {profileForm.address || 'Alamat Pusat'}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    Aktif (Headquarters)
                  </span>
                </div>

                <div
                  onClick={() => isFree && handleProFeatureClick('Multi-Branch Outlet')}
                  className={`p-4 rounded-xl border border-dashed border-slate-800 hover:border-slate-700 bg-slate-900/30 text-center space-y-1 transition ${isFree ? 'cursor-pointer' : ''}`}
                >
                  <p className="text-xs font-semibold text-slate-300">Hubungkan Outlet Tambahan (Cabang)</p>
                  <p className="text-[11px] text-slate-500">
                    Mendukung sinkronisasi katalog global dengan inventori per-cabang secara independen.
                  </p>
                </div>
              </div>
            </div>

            {/* 3. Backup Cloud Otomatis & Log Audit Sistem */}
            <div className={`glass-card p-6 space-y-5 relative ${isFree ? 'opacity-90' : ''}`}>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <Database className="w-5 h-5 text-indigo-400" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-100 text-sm">Backup Cloud Otomatis & Log Audit Sistem</h3>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" />
                        <span>PRO</span>
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Pencadangan database otomatis harian ke cloud server dengan retensi data 30 hari
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleProFeatureClick('Backup Cloud Otomatis')}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition border border-slate-700 cursor-pointer flex items-center gap-1.5"
                >
                  {isFree && <Lock className="w-3 h-3 text-amber-400" />}
                  <span>{isFree ? 'Buka Kunci' : 'Cadangkan Sekarang'}</span>
                </button>
              </div>

              {/* Status Sinkronisasi Real-Time Stream */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Cloud className="w-4 h-4 text-indigo-400" />
                    <span>Status Aliran Data Sinkronisasi Cloud POS</span>
                  </h4>
                  <button
                    type="button"
                    onClick={loadSyncData}
                    disabled={isRefreshingSync}
                    className="flex items-center space-x-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] transition disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${isRefreshingSync ? 'animate-spin' : ''}`} />
                    <span>Perbarui Data</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-xs">Layanan Sinkronisasi</span>
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                    </div>
                    <p className="text-sm font-bold text-emerald-400">Online & Aktif</p>
                    <p className="text-[10px] text-slate-500">Event push & pull terpusat</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                    <span className="text-slate-400 text-xs">Perangkat POS Terdaftar</span>
                    <p className="text-sm font-bold text-slate-100">
                      {syncStatus?.deviceCount ?? 0} Perangkat
                    </p>
                    <p className="text-[10px] text-slate-500">Memiliki cursor sinkronisasi cloud</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                    <span className="text-slate-400 text-xs">Total Event Sinkron</span>
                    <p className="text-sm font-bold text-indigo-400 font-mono">
                      {syncStatus?.totalEvents ?? 0} Rekaman
                    </p>
                    <p className="text-[10px] text-slate-500">Tercatat di server cloud</p>
                  </div>
                </div>

                {/* Perangkat POS Terhubung Table */}
                <div className="rounded-xl overflow-hidden border border-slate-800 mt-3">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-900/60 border-b border-slate-800 text-slate-400">
                        <th className="py-2.5 px-3 font-semibold">Device ID</th>
                        <th className="py-2.5 px-3 font-semibold">Posisi Cursor</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Sinkronisasi Terakhir</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {syncStatus?.devices && syncStatus.devices.length > 0 ? (
                        syncStatus.devices.map((d, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/20">
                            <td className="py-2 px-3 font-mono text-slate-200 text-[11px]">
                              {d.deviceId}
                            </td>
                            <td className="py-2 px-3 font-mono text-indigo-300 text-[11px]">
                              #{d.cursor}
                            </td>
                            <td className="py-2 px-3 text-right text-slate-400 text-[11px]">
                              {formatDate(d.updatedAt)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="py-5 text-center text-slate-500 text-xs">
                            Belum ada perangkat POS yang melakukan sinkronisasi
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Tambah Printer */}
        {showPrinterModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="glass-card w-full max-w-lg p-6 space-y-5 border-slate-700 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <Printer className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-semibold text-slate-100 text-sm">
                    Tambah Perangkat Printer Baru
                  </h3>
                </div>
                <button
                  onClick={() => setShowPrinterModal(false)}
                  className="text-slate-400 hover:text-slate-200 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreatePrinter} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Nama Printer / Lokasi *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Printer Kasir Depan, Printer Dapur"
                    value={printerForm.name}
                    onChange={(e) => setPrinterForm({ ...printerForm, name: e.target.value })}
                    className="pos-input px-3 py-2 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Tipe Koneksi
                    </label>
                    <select
                      value={printerForm.connectionType}
                      onChange={(e: any) =>
                        setPrinterForm({ ...printerForm, connectionType: e.target.value })
                      }
                      className="pos-select w-full px-3 py-2 text-xs"
                    >
                      <option value="BLUETOOTH">Bluetooth Thermal</option>
                      <option value="USB">USB Cable</option>
                      <option value="NETWORK">LAN / WiFi Network</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Alamat / IP / MAC (Opsional)
                    </label>
                    <input
                      type="text"
                      placeholder="00:11:22:33:44:55 / 192.168.1.100"
                      value={printerForm.addressReference}
                      onChange={(e) =>
                        setPrinterForm({ ...printerForm, addressReference: e.target.value })
                      }
                      className="pos-input px-3 py-2 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Peruntukan Printer (Role)
                    </label>
                    <select
                      value={printerForm.role}
                      onChange={(e: any) =>
                        setPrinterForm({ ...printerForm, role: e.target.value })
                      }
                      className="pos-select w-full px-3 py-2 text-xs"
                    >
                      <option value="RECEIPT">Struk Kasir (Pelanggan)</option>
                      <option value="KITCHEN">Tiket Dapur (Pesanan)</option>
                      <option value="BOTH">Keduanya (Kasir & Dapur)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Ukuran Kertas Thermal
                    </label>
                    <select
                      value={printerForm.paperSize}
                      onChange={(e: any) =>
                        setPrinterForm({ ...printerForm, paperSize: e.target.value })
                      }
                      className="pos-select w-full px-3 py-2 text-xs"
                    >
                      <option value="PAPER_58MM">58 mm (Standar POS Mobile)</option>
                      <option value="PAPER_80MM">80 mm (Besar / Desktop)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Jumlah Salinan Struk Kasir
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={printerForm.receiptCopies}
                      onChange={(e) =>
                        setPrinterForm({
                          ...printerForm,
                          receiptCopies: Math.max(1, parseInt(e.target.value, 10) || 1),
                        })
                      }
                      className="pos-input px-3 py-2 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Jumlah Salinan Tiket Dapur
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={printerForm.kitchenCopies}
                      onChange={(e) =>
                        setPrinterForm({
                          ...printerForm,
                          kitchenCopies: Math.max(1, parseInt(e.target.value, 10) || 1),
                        })
                      }
                      className="pos-input px-3 py-2 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={printerForm.autoPrint}
                      onChange={(e) =>
                        setPrinterForm({ ...printerForm, autoPrint: e.target.checked })
                      }
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-800 border-slate-700"
                    />
                    <span className="text-xs text-slate-300">
                      Otomatis cetak segera setelah transaksi dibayar selesai (Auto-Print)
                    </span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={printerForm.active}
                      onChange={(e) =>
                        setPrinterForm({ ...printerForm, active: e.target.checked })
                      }
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-800 border-slate-700"
                    />
                    <span className="text-xs text-slate-300">
                      Printer aktif dan siap menerima antrean cetak
                    </span>
                  </label>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowPrinterModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingPrinter}
                    className="pos-btn-primary px-5 py-2 text-xs disabled:opacity-50 cursor-pointer"
                  >
                    {isSavingPrinter ? 'Menyimpan...' : 'Simpan Printer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Global Upgrade Modal Trigger */}
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          featureName={selectedFeature}
        />
      </main>
    </div>
  );
}
