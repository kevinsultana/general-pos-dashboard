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
} from 'lucide-react';
import { Topbar } from '../../../components/Topbar';
import { api } from '../../../lib/api';
import { Store, PaymentMethod } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';

export default function SettingsPage() {
  const toast = useToast();
  const { store: authStore, refreshUser } = useAuth();
  const [store, setStore] = useState<Store | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
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
      const [storeData, pmData] = await Promise.all([
        api.getStore(),
        api.getPaymentMethods().catch(() => []),
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
    } catch (err) {
      console.error('Failed to load store settings:', err);
    } finally {
      setIsLoading(false);
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
                  className={`p-3 rounded-xl border transition flex items-center justify-between ${
                    pm.active
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
                    className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition ${
                      pm.active
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
