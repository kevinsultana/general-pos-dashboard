'use client';

import { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Store,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  Globe,
} from 'lucide-react';

export default function RegisterModal({
  isOpen,
  onClose,
  initialMode = 'register',
  selectedTier = 'FREE',
}) {
  const [mode, setMode] = useState(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    storeName: '',
    slug: '',
    ownerName: '',
    email: '',
    password: '',
  });

  useEffect(() => {
    setMode(initialMode);
    setSubmitted(false);
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  const handleStoreNameChange = (e) => {
    const name = e.target.value;
    const generatedSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');

    setFormData((prev) => ({
      ...prev,
      storeName: name,
      slug: generatedSlug,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Soft dark blur backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Card (Light Acrylic Glass) */}
      <div className="relative w-full max-w-lg rounded-3xl bg-white/95 border border-white/90 backdrop-blur-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.2)] ring-1 ring-inset ring-white/80 p-6 sm:p-8 z-10 text-left my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
          aria-label="Tutup modal"
        >
          <X className="w-4 h-4" />
        </button>

        {submitted ? (
          /* Success Screen */
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 mx-auto flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Toko Berhasil Didaftarkan!</h3>
            <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
              Selamat datang di Omni POS. Tenant{' '}
              <span className="text-amber-700 font-semibold">{formData.storeName || 'Toko Anda'}</span>{' '}
              siap digunakan dengan domain akses:
            </p>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-mono text-slate-800">
              https://omnipos.id/store/{formData.slug || 'demo-outlet'}
            </div>
            <p className="text-[11px] text-slate-500">
              Form ini siap diintegrasikan langsung dengan Express backend Prisma.
            </p>
            <div className="pt-3">
              <button
                onClick={onClose}
                className="w-full py-3 rounded-full font-bold text-xs bg-slate-900 text-white hover:bg-slate-800 shadow-md transition-all"
              >
                Tutup & Mulai Eksplorasi
              </button>
            </div>
          </div>
        ) : (
          /* Form Screen */
          <div>
            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>
                  {mode === 'register' ? `Pendaftaran Tenant (${selectedTier})` : 'Akses Akun Tenant'}
                </span>
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {mode === 'register' ? 'Buka Toko Multi-Tenant Baru' : 'Masuk ke Dashboard POS'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                {mode === 'register'
                  ? 'Siapkan akun owner dan sistem isolasi database untuk tokomu dalam 1 menit.'
                  : 'Gunakan kredensial owner atau kasir untuk melanjutkan operasional.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Nama Toko / Brand F&B
                    </label>
                    <div className="relative">
                      <Store className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={formData.storeName}
                        onChange={handleStoreNameChange}
                        placeholder="Contoh: Kopi Karsa Sudirman"
                        className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none transition-colors shadow-2xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      URL Toko / Tenant Slug
                    </label>
                    <div className="relative">
                      <Globe className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={formData.slug}
                        onChange={(e) =>
                          setFormData({ ...formData, slug: e.target.value.toLowerCase() })
                        }
                        placeholder="kopi-karsa-sudirman"
                        className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-amber-700 font-mono placeholder-slate-400 focus:bg-white focus:outline-none transition-colors shadow-2xs"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Domain tenant: omnipos.id/store/{formData.slug || 'slug-tokomu'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Nama Lengkap Pemilik / Owner
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={formData.ownerName}
                        onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                        placeholder="Contoh: Hendra Wijaya"
                        className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none transition-colors shadow-2xs"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Alamat Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="owner@tokomu.com"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none transition-colors shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Kata Sandi</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Minimal 8 karakter aman"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none transition-colors shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-full font-bold text-xs sm:text-sm text-white bg-slate-900 hover:bg-slate-800 shadow-md active:scale-98 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span className="animate-pulse">Menghubungkan ke Cloud Engine...</span>
                  ) : (
                    <>
                      <span>{mode === 'register' ? 'Buat Toko & Mulai POS' : 'Masuk Sekarang'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-5 pt-4 border-t border-slate-100 text-center">
              {mode === 'register' ? (
                <p className="text-xs text-slate-500">
                  Sudah memiliki akun toko?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-amber-700 font-bold hover:underline ml-1"
                  >
                    Masuk ke Dashboard
                  </button>
                </p>
              ) : (
                <p className="text-xs text-slate-500">
                  Belum memiliki toko?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('register')}
                    className="text-amber-700 font-bold hover:underline ml-1"
                  >
                    Daftar Tenant Baru
                  </button>
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
