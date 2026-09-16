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
} from 'lucide-react';
import { Topbar } from '../../../components/Topbar';
import { api } from '../../../lib/api';
import { Store, PaymentMethod, SyncStatusData, Printer as PrinterType } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { formatDate } from '../../../lib/formatters';

export default function SettingsPage() {
  const toast = useToast();
  const { store: authStore, refreshUser } = useAuth();
  const [store, setStore] = useState<Store | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [printers, setPrinters] = useState<PrinterType[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatusData | null>(null);
  const [isRefreshingSync, setIsRefreshingSync] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form State
  const [profileForm, setProfileForm] = useState({
    name: '',
    ownerName: '',
    phone: '',
    email: '',
    address: '',
    currency: 'IDR',
    timezone: 'Asia/Jakarta',
  });

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
        setProfileForm({
          name: storeData.name || '',
          ownerName: storeData.ownerName || '',
          phone: storeData.phone || '',
          email: storeData.email || '',
          address: storeData.address || '',
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
  }, []);

  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      await api.updateStore({
        ...profileForm,
        ...toggles,
      });
      setSaveSuccess(true);
      await refreshUser();
      toast.success('Pengaturan toko dan fitur operasional berhasil disimpan!');
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan pengaturan toko');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePayment = async (pm: PaymentMethod) => {
    try {
      const updated = !pm.active;
      await api.updatePaymentMethod(pm.id, { active: updated });
      setPaymentMethods((prev) =>
        prev.map((item) => (item.id === pm.id ? { ...item, active: updated } : item))
      );
      toast.info(`Metode ${pm.name} kini ${updated ? 'Aktif' : 'Nonaktif'}`);
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengubah status metode pembayaran');
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <Topbar
        title="Pengaturan Toko"
        description="Konfigurasi identitas toko, metode pembayaran, dan toggle fitur operasional POS"
      />

      <main className="p-6 space-y-6 flex-1 max-w-5xl">
        {saveSuccess && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>Pengaturan toko dan fitur operasional berhasil disimpan!</span>
          </div>
        )}

        <form onSubmit={handleSaveStore} className="space-y-6">
          {/* Section 1: Profil Toko */}
          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
              <StoreIcon className="w-5 h-5 text-indigo-400" />
              <h3 className="font-semibold text-slate-100 text-sm">Profil & Identitas Usaha</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Nama Toko / Usaha *</label>
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
                <label className="block text-xs font-medium text-slate-300 mb-1">Nama Pemilik Toko</label>
                <input
                  type="text"
                  value={profileForm.ownerName}
                  onChange={(e) => setProfileForm({ ...profileForm, ownerName: e.target.value })}
                  className="pos-input px-3 py-2 text-xs"
                  placeholder="Contoh: Kevin Sultana"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">No. Kontak / WhatsApp</label>
                <input
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="pos-input px-3 py-2 text-xs"
                  placeholder="08123456789"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Email Toko</label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  className="pos-input px-3 py-2 text-xs"
                  placeholder="toko@example.com"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-300 mb-1">Alamat Fisik Toko</label>
                <textarea
                  rows={2}
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  className="pos-input px-3 py-2 text-xs"
                  placeholder="Jl. Sudirman No. 45, Jakarta Pusat"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Feature Toggles */}
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

          {/* Section 3: Pembulatan Kas */}
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

          {/* Section 4: Metode Pembayaran */}
          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
              <CreditCard className="w-5 h-5 text-indigo-400" />
              <h3 className="font-semibold text-slate-100 text-sm">Metode Pembayaran Kasir</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {paymentMethods.map((pm) => (
                <div
                  key={pm.id}
                  className={`p-3 rounded-xl border transition flex items-center justify-between ${pm.active
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
                    className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition ${pm.active
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                  >
                    {pm.active ? 'Aktif' : 'Nonaktif'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Section 5: Perangkat Printer & Konfigurasi JSON */}
          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Printer className="w-5 h-5 text-cyan-400" />
                <div>
                  <h3 className="font-semibold text-slate-100 text-sm">Perangkat Printer & Format Struk</h3>
                  <p className="text-[11px] text-slate-400">
                    Printer kasir, dapur, dan kompatibilitas konfigurasi JSON yang tersinkronisasi
                  </p>
                </div>
              </div>
              <span className="text-xs text-slate-400 font-mono">{printers.length} printer terdaftar</span>
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
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {p.active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-300 pt-1 border-t border-slate-800/60">
                      <span>Lebar Kertas: <strong className="text-slate-100 font-mono">{p.paperSize === 'PAPER_80MM' ? '80mm' : '58mm'}</strong></span>
                      <span>Salinan: <strong className="text-slate-100 font-mono">{p.receiptCopies}x</strong></span>
                      {p.autoPrint && (
                        <span className="text-cyan-400 text-[10px] font-medium">Auto-Print</span>
                      )}
                    </div>

                    {p.configuration && Object.keys(p.configuration).length > 0 && (
                      <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/60 font-mono text-[10px] text-slate-400 break-all">
                        <span className="text-slate-500 block mb-0.5">Konfigurasi JSON:</span>
                        {JSON.stringify(p.configuration)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-500 bg-slate-900/30 rounded-xl border border-slate-800/60">
                Belum ada printer cloud yang tersimpan. Hubungkan printer melalui aplikasi Mobile POS kasir.
              </div>
            )}
          </div>

          {/* Section 5: Status Sinkronisasi Cloud & Perangkat POS */}
          <div className="glass-card p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Cloud className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="font-semibold text-slate-100 text-sm">
                    Status Sinkronisasi Cloud & Perangkat POS
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Pemantauan status data offline-first dan sinkronisasi cloud real-time
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={loadSyncData}
                disabled={isRefreshingSync}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs transition disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingSync ? 'animate-spin' : ''}`} />
                <span>Perbarui Status</span>
              </button>
            </div>

            {/* KPI Cards */}
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
                <p className="text-[10px] text-slate-500">Sinkronisasi push/pull dua arah aktif</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <span className="text-slate-400 text-xs">Perangkat POS Terhubung</span>
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
                <p className="text-[10px] text-slate-500">Tercatat di server pusat</p>
              </div>
            </div>

            {/* Devices Table */}
            <div>
              <h4 className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                <Laptop className="w-3.5 h-3.5 text-slate-400" />
                <span>Daftar Perangkat POS Terdaftar</span>
              </h4>
              <div className="rounded-xl overflow-hidden border border-slate-800">
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
                          <td className="py-2.5 px-3 font-mono text-slate-200 text-[11px]">
                            {d.deviceId}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-indigo-300 text-[11px]">
                            #{d.cursor}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-400 text-[11px]">
                            {formatDate(d.updatedAt)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="py-6 text-center text-slate-500 text-xs">
                          Belum ada perangkat POS yang melakukan sinkronisasi
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Sync Events Stream */}
            <div>
              <h4 className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-slate-400" />
                <span>Riwayat Aktivitas Sinkronisasi Terkini</span>
              </h4>
              <div className="rounded-xl overflow-hidden border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-900/60 border-b border-slate-800 text-slate-400">
                      <th className="py-2.5 px-3 font-semibold">Waktu</th>
                      <th className="py-2.5 px-3 font-semibold">Operasi</th>
                      <th className="py-2.5 px-3 font-semibold">Entitas</th>
                      <th className="py-2.5 px-3 font-semibold">Device ID</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {syncStatus?.recentEvents && syncStatus.recentEvents.length > 0 ? (
                      syncStatus.recentEvents.slice(0, 10).map((ev) => (
                        <tr key={ev.id} className="hover:bg-slate-800/20">
                          <td className="py-2 px-3 text-slate-400 text-[11px]">
                            {formatDate(ev.createdAt)}
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-slate-200 text-[10px]">
                            {ev.operation}
                          </td>
                          <td className="py-2 px-3 text-slate-300 text-[11px]">{ev.entityType}</td>
                          <td className="py-2 px-3 font-mono text-slate-400 text-[10px] truncate max-w-30">
                            {ev.deviceId}
                          </td>
                          <td className="py-2 px-3 text-right">
                            <span
                              className={`px-2 py-0.5 rounded text-[9px] font-bold ${ev.status === 'SYNCED'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : ev.status === 'FAILED'
                                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                    : ev.status === 'CONFLICT'
                                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                      : 'bg-slate-800 text-slate-400'
                                }`}
                            >
                              {ev.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-500 text-xs">
                          Belum ada riwayat aktivitas sinkronisasi
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Action Save Bar */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="pos-btn-primary px-6 py-2.5 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Menyimpan Pengaturan...' : 'Simpan Semua Pengaturan'}</span>
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
