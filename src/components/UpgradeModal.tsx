'use client';

import React, { useState } from 'react';
import { X, Sparkles, Check, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
}

export function UpgradeModal({ isOpen, onClose, featureName }: UpgradeModalProps) {
  const { refreshSubscription } = useAuth();
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSimulateUpgrade = async () => {
    setIsUpgrading(true);
    setError(null);
    try {
      await api.upgradeSubscription('PRO');
      await refreshSubscription();
      setSuccessMessage('Selamat! Akun toko Anda telah berhasil di-upgrade ke Paket PRO.');
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err?.message || 'Gagal melakukan upgrade. Silakan coba lagi.');
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg glass-card bg-[#121829] border border-indigo-500/40 shadow-2xl shadow-indigo-500/20 z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-linear-to-r from-amber-400 to-orange-500 text-slate-950 shadow-sm">
                FITUR EKSKLUSIF PRO
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-3">
            <h3 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
              <span>Buka Akses Web Dashboard PRO</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {featureName
                ? `Modul "${featureName}" dan sinkronisasi cloud memerlukan langganan General POS PRO.`
                : 'Kelola seluruh operasional toko Anda di mana saja dengan sinkronisasi cloud dan analitik lengkap.'}
            </p>
          </div>

          {successMessage ? (
            <div className="my-6 p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center space-x-3 text-emerald-400 text-sm animate-in fade-in duration-200">
              <Check className="w-5 h-5 shrink-0" />
              <span>{successMessage}</span>
            </div>
          ) : (
            <>
              {error && (
                <div className="my-3 p-3 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs">
                  {error}
                </div>
              )}

              {/* Feature Benefits List */}
              <div className="my-5 p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5">
                <div className="flex items-start space-x-2.5 text-xs text-slate-300">
                  <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3" />
                  </div>
                  <span>
                    <strong className="text-slate-100">Sinkronisasi Cloud Real-time:</strong> Data transaksi, stok, dan kasir sinkron otomatis ke server cloud.
                  </span>
                </div>
                <div className="flex items-start space-x-2.5 text-xs text-slate-300">
                  <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3" />
                  </div>
                  <span>
                    <strong className="text-slate-100">Web Dashboard & Manajemen Terpusat:</strong> Kelola katalog produk, harga, pelanggan, dan promosi langsung lewat browser.
                  </span>
                </div>
                <div className="flex items-start space-x-2.5 text-xs text-slate-300">
                  <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3" />
                  </div>
                  <span>
                    <strong className="text-slate-100">Laporan Keuangan Komprehensif:</strong> Omzet, HPP otomatis, valuasi stok, margin laba kotor & bersih per periode.
                  </span>
                </div>
                <div className="flex items-start space-x-2.5 text-xs text-slate-300">
                  <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3" />
                  </div>
                  <span>
                    <strong className="text-slate-100">Multi-Perangkat & Multi-Kasir:</strong> Tambah akun kasir/admin dengan sistem role & hak akses fleksibel.
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5">
                <button
                  type="button"
                  disabled={isUpgrading}
                  onClick={handleSimulateUpgrade}
                  className="w-full py-3 px-4 rounded-xl bg-linear-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isUpgrading ? 'Mengaktifkan PRO...' : 'Upgrade ke PRO Sekarang (Simulasi)'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <p className="text-[11px] text-center text-slate-500">
                  Mode Simulasi: Anda dapat mencoba paket PRO langsung tanpa biaya untuk pengujian fitur.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
