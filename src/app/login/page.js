'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Layers,
  ArrowLeft,
  Store,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldAlert,
  Smartphone,
  Sparkles,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    storeSlug: '',
    email: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [planRestrictedModal, setPlanRestrictedModal] = useState(false);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.storeSlug.trim()) {
      newErrors.storeSlug = 'Slug / ID toko wajib diisi';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Alamat email wajib diisi';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format email tidak valid';
    }
    if (!formData.password) {
      newErrors.password = 'Password wajib diisi';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      await login(
        formData.storeSlug.trim(),
        formData.email.trim(),
        formData.password,
        'web'
      );

      // Redirect ke dashboard saat login sukses
      router.push('/dashboard');
    } catch (err) {
      // Periksa apakah ini restriksi paket FREE
      if (err.status === 403 && (err.code === 'PLAN_RESTRICTED' || err.data?.code === 'PLAN_RESTRICTED')) {
        setPlanRestrictedModal(true);
      } else {
        setErrors({
          form: err.message || 'Kredensial atau ID toko tidak valid. Silakan coba kembali.',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between selection:bg-amber-100 selection:text-amber-900 overflow-x-hidden">
      {/* Background Soft Liquid Aura Blobs */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        {/* Liquid Orb 1: Soft Peach */}
        <div className="absolute -top-32 -left-32 w-140 h-140 rounded-full bg-[#fed7aa]/55 blur-[120px] mix-blend-multiply" />

        {/* Liquid Orb 2: Frosted Sage */}
        <div className="absolute top-1/3 -right-32 w-130 h-130 rounded-full bg-[#bbf7d0]/45 blur-[130px] mix-blend-multiply" />

        {/* Liquid Orb 3: Cream Rose / Lavender Mist */}
        <div className="absolute top-2/3 left-1/4 w-140 h-140 rounded-full bg-[#f5d0fe]/40 blur-[130px] mix-blend-multiply" />

        {/* Liquid Orb 4: Soft Warm Amber Glow */}
        <div className="absolute -bottom-32 right-1/4 w-120 h-120 rounded-full bg-[#fed7aa]/40 blur-[120px] mix-blend-multiply" />
      </div>

      {/* Top Header / Back Navigation Bar */}
      <header className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 px-3.5 py-1.5 rounded-full bg-white/70 border border-white/80 shadow-xs backdrop-blur-xl transition-all"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500" />
          <span>Kembali ke Beranda</span>
        </Link>

        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-full bg-linear-to-br from-amber-500 to-amber-600 p-0.5 shadow-sm shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
              <Layers className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <span className="text-base font-bold tracking-tight text-slate-900">
            Omni<span className="text-amber-600">POS</span>
          </span>
        </Link>
      </header>

      {/* Main Content Area: Centered Glass Login Card */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8">
        <div className="relative w-full max-w-md mx-auto">
          {/* Specular Glow behind Card */}
          <div className="absolute -inset-1 rounded-[38px] bg-linear-to-r from-amber-200/50 via-rose-100/40 to-emerald-100/50 blur-2xl opacity-75 pointer-events-none" />

          {/* Main Frosted Glass Card */}
          <div className="relative max-w-md w-full p-8 rounded-3xl border border-white/80 shadow-xl bg-white/75 backdrop-blur-2xl ring-1 ring-inset ring-white/60 transition-all duration-300">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-amber-500 to-amber-600 p-0.5 shadow-sm shadow-amber-500/25 mx-auto mb-4">
                <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
                  <Layers className="w-6 h-6 text-amber-600" />
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Selamat Datang Kembali
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed">
                Masuk ke portal kasir & dashboard analitik toko Anda.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Form Global Error Alert */}
              {errors.form && (
                <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{errors.form}</span>
                </div>
              )}

              {/* ID / Slug Toko */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  ID / Slug Toko
                </label>
                <div className="relative">
                  <Store className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="kopi-senja"
                    value={formData.storeSlug}
                    onChange={(e) => handleChange('storeSlug', e.target.value)}
                    className={`w-full bg-white/80 border rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all shadow-xs font-mono ${
                      errors.storeSlug
                        ? 'border-rose-300 focus:ring-rose-200'
                        : 'border-slate-200/80 focus:ring-amber-200/60 focus:border-amber-400'
                    }`}
                  />
                </div>
                {errors.storeSlug && (
                  <p className="text-[11px] text-rose-600 mt-1">{errors.storeSlug}</p>
                )}
              </div>

              {/* Email Pengguna */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Alamat Email Pengguna
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    placeholder="kasir@tokomu.com"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className={`w-full bg-white/80 border rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all shadow-xs ${
                      errors.email
                        ? 'border-rose-300 focus:ring-rose-200'
                        : 'border-slate-200/80 focus:ring-amber-200/60 focus:border-amber-400'
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="text-[11px] text-rose-600 mt-1">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Kata Sandi
                  </label>
                  <a
                    href="#lupa-password"
                    onClick={(e) => {
                      e.preventDefault();
                      alert('Silakan hubungi pemilik toko (Owner) Anda untuk melakukan reset kata sandi akun.');
                    }}
                    className="text-[11px] font-semibold text-amber-700 hover:text-amber-800 transition-colors"
                  >
                    Lupa password?
                  </a>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    className={`w-full bg-white/80 border rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all shadow-xs ${
                      errors.password
                        ? 'border-rose-300 focus:ring-rose-200'
                        : 'border-slate-200/80 focus:ring-amber-200/60 focus:border-amber-400'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-[11px] text-rose-600 mt-1">{errors.password}</p>
                )}
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-slate-900 hover:bg-slate-800 shadow-md shadow-slate-900/15 transition-all duration-300 flex items-center justify-center gap-2 active:scale-98 disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Memverifikasi Akun...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk ke Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Bottom Link to Register */}
              <div className="text-center pt-3 border-t border-slate-200/60">
                <p className="text-xs text-slate-600">
                  Belum mendaftarkan tokomu?{' '}
                  <Link
                    href="/register"
                    className="font-bold text-slate-900 hover:text-amber-700 underline underline-offset-4 decoration-amber-400/60 transition-colors"
                  >
                    Mulai gratis di sini
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 text-center text-xs text-slate-400">
        <p>© {new Date().getFullYear()} Omni POS Technologies. Dilindungi enkripsi row-level tenant security.</p>
      </footer>

      {/* Modal Khusus Pembatasan Akses Paket FREE (PLAN_RESTRICTED) */}
      {planRestrictedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative max-w-md w-full bg-white/90 backdrop-blur-2xl border border-white p-7 rounded-3xl shadow-2xl ring-1 ring-inset ring-white/80">
            {/* Close Button */}
            <button
              onClick={() => setPlanRestrictedModal(false)}
              className="absolute top-5 right-5 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Icon Header */}
            <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 mb-4 shadow-xs">
              <Smartphone className="w-6 h-6" />
            </div>

            {/* Content */}
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">
              Akses Web Khusus Paket PLUS & PRO
            </h3>
            <p className="mt-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
              Toko Anda saat ini berada di paket <span className="font-bold text-slate-900">FREE</span> (Khusus Mobile POS Offline). Untuk mengakses Dashboard Backoffice Web, silakan gunakan aplikasi kasir mobile atau upgrade paket toko Anda.
            </p>

            {/* Actions */}
            <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
              <Link
                href="/#harga"
                onClick={() => setPlanRestrictedModal(false)}
                className="flex-1 py-3 px-4 rounded-xl text-center text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-sm transition-all flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Lihat Pilihan Upgrade</span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  alert('Unduhan APK Android & iOS Omni POS Mobile kasir akan segera tersedia di Google Play Store dan Apple App Store.');
                }}
                className="py-3 px-4 rounded-xl text-center text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/70 border border-slate-200/80 transition-all"
              >
                Unduh Aplikasi Mobile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
