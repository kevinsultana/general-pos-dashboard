'use client';

import { useState } from 'react';
import {
  Coffee,
  ShoppingCart,
  Shirt,
  Scissors,
  Pill,
  Sliders,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Layers,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import api from '../../lib/api';

const PRESET_OPTIONS = [
  {
    id: 'FNB',
    title: 'Kuliner & Minuman (F&B)',
    icon: Coffee,
    color: 'from-amber-500 to-orange-500',
    lightBg: 'bg-amber-50/80 border-amber-200/80 text-amber-900',
    accent: 'text-amber-600',
    description: 'Restoran, Kafe, Kedai Kopi, Food Court, dan Warung Makan.',
    features: [
      'Manajemen Meja (Table Map)',
      'Nomor Antrean Pelanggan',
      'Cetak Tiket Dapur (Kitchen Ticket)',
      'Sistem Topping & Modifiers',
    ],
  },
  {
    id: 'RETAIL',
    title: 'Toko Ritel & Kelontong',
    icon: ShoppingCart,
    color: 'from-blue-500 to-indigo-500',
    lightBg: 'bg-blue-50/80 border-blue-200/80 text-blue-900',
    accent: 'text-blue-600',
    description: 'Minimarket, Toko Kelontong, Fashion, Toko Bangunan, dan Grosir.',
    features: [
      'Mode Barcode Scan Cepat',
      'Satuan Bertingkat (Dus → Pcs)',
      'Buku Kasbon / Piutang Pelanggan',
      'Harga Bertingkat / Grosir',
    ],
  },
  {
    id: 'SERVICE',
    title: 'Laundry & Jasa Pengerjaan',
    icon: Shirt,
    color: 'from-cyan-500 to-teal-500',
    lightBg: 'bg-cyan-50/80 border-cyan-200/80 text-cyan-900',
    accent: 'text-cyan-600',
    description: 'Laundry Kiloan/Satuan, Servis Elektronik, Cuci Sepatu, dan Bengkel.',
    features: [
      'Cetak Resi Nota Pengambilan',
      'Pelacakan Status Pengerjaan',
      'Estimasi Tanggal Selesai',
      'Kasbon & Uang Muka (DP)',
    ],
  },
  {
    id: 'BOOKING',
    title: 'Barbershop & Salon (Jasa Waktu)',
    icon: Scissors,
    color: 'from-purple-500 to-pink-500',
    lightBg: 'bg-purple-50/80 border-purple-200/80 text-purple-900',
    accent: 'text-purple-600',
    description: 'Barbershop, Salon Kecantikan, Spa/Refleksi, dan Pet Grooming.',
    features: [
      'Pemilihan Kapster / Staf Layanan',
      'Perhitungan Komisi Staf Otomatis',
      'Penjadwalan Slot Antrean',
      'Kombinasi Jasa & Produk Ritel',
    ],
  },
  {
    id: 'PHARMACY',
    title: 'Apotek & Toko Obat',
    icon: Pill,
    color: 'from-emerald-500 to-teal-600',
    lightBg: 'bg-emerald-50/80 border-emerald-200/80 text-emerald-900',
    accent: 'text-emerald-600',
    description: 'Apotek, Klinik Pratama, Toko Herbal, dan Depot Farmasi.',
    features: [
      'Pelacakan Batch & Kedaluwarsa',
      'Konversi Satuan Obat (Strip/Box)',
      'Scan Barcode Kode BPOM',
      'Kasbon Pelanggan Terdaftar',
    ],
  },
  {
    id: 'CUSTOM',
    title: 'Kustom Penuh (Bebas)',
    icon: Sliders,
    color: 'from-slate-700 to-slate-900',
    lightBg: 'bg-slate-50/80 border-slate-200/80 text-slate-900',
    accent: 'text-slate-700',
    description: 'Bebas nyalakan atau matikan semua modul sesuai kebutuhan unik Anda.',
    features: [
      'Akses Seluruh Sakelar Fitur',
      'Disesuaikan Kapan Saja di Pengaturan',
      'Dukungan Multi-Unit & Modifiers',
      'Fleksibilitas Alur Kerja Kasir',
    ],
  },
];

export default function OnboardingWizardModal() {
  const { tenant, checkAuth } = useAuth();
  const { t } = useLanguage();
  const [selectedPreset, setSelectedPreset] = useState(tenant?.businessPreset || 'RETAIL');
  const [loading, setLoading] = useState(false);

  // Jika onboarding sudah selesai, jangan render modal
  if (tenant?.isOnboardingCompleted) {
    return null;
  }

  const handleApplyPreset = async () => {
    setLoading(true);
    try {
      const res = await api.put('/business-config', {
        businessPreset: selectedPreset,
        isOnboardingCompleted: true,
      });

      if (res.data.success) {
        toast.success(
          `Alur kerja berhasil disesuaikan untuk ${
            PRESET_OPTIONS.find((p) => p.id === selectedPreset)?.title
          }!`,
          { duration: 4000 }
        );
        await checkAuth();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan konfigurasi model usaha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl my-auto bg-white/95 backdrop-blur-2xl border border-white/70 shadow-2xl rounded-3xl overflow-hidden text-slate-800">
        {/* Glow Ambient Decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl -z-10 pointer-events-none" />

        {/* Modal Header */}
        <div className="p-6 sm:p-8 text-center border-b border-slate-100 bg-linear-to-b from-slate-50/70 to-transparent">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-700 text-xs font-bold mb-3 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            <span>Wizard Model Bisnis Baru</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {t('onboarding.onboardingTitle') || 'Pilih Jenis Usaha Anda'}
          </h2>
          <p className="mt-2 text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
            {t('onboarding.onboardingSubtitle') ||
              'Omni POS akan otomatis menyesuaikan fitur, tampilan kasir, dan alur kerja sesuai tipe bisnis Anda.'}
          </p>
        </div>

        {/* 6 Grid Kartu Preset */}
        <div className="p-6 sm:p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {PRESET_OPTIONS.map((item) => {
              const Icon = item.icon;
              const isSelected = selectedPreset === item.id;

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedPreset(item.id)}
                  className={`relative p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between select-none ${
                    isSelected
                      ? 'bg-white shadow-xl shadow-amber-500/10 border-amber-500 ring-2 ring-amber-500/20 scale-[1.02]'
                      : 'bg-white/70 hover:bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs hover:shadow-md'
                  }`}
                >
                  <div>
                    {/* Header Card */}
                    <div className="flex items-center justify-between mb-3">
                      <div
                        className={`w-11 h-11 rounded-2xl bg-linear-to-br ${item.color} p-0.5 shadow-sm text-white flex items-center justify-center`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      {isSelected ? (
                        <CheckCircle2 className="w-6 h-6 text-amber-500 fill-amber-100" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                      {item.description}
                    </p>

                    {/* Fitur Utama */}
                    <div className="mt-3.5 pt-3 border-t border-slate-100 space-y-1.5">
                      {item.features.map((feat, fIdx) => (
                        <div
                          key={fIdx}
                          className="flex items-center gap-2 text-[11px] font-medium text-slate-700"
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isSelected ? 'bg-amber-500' : 'bg-slate-400'
                            }`}
                          />
                          <span className="truncate">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 text-center sm:text-left">
            <Layers className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Fitur ini dapat diubah atau disesuaikan sewaktu-waktu di menu Pengaturan Toko.</span>
          </div>

          <button
            type="button"
            onClick={handleApplyPreset}
            disabled={loading}
            className="w-full sm:w-auto py-3 px-7 rounded-2xl bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-sm shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <span>{loading ? 'Menerapkan...' : t('onboarding.savePresetBtn') || 'Terapkan & Mulai Berjualan'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
