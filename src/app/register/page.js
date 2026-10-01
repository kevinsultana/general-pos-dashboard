'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Layers,
  ArrowLeft,
  Store,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    storeName: '',
    storeSlug: '',
    ownerName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [isSlugManual, setIsSlugManual] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto generate URL slug dari nama toko jika user belum mengedit manual
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
      storeSlug: isSlugManual ? prev.storeSlug : generatedSlug,
    }));

    if (errors.storeName) {
      setErrors((prev) => ({ ...prev, storeName: null }));
    }
    if (errors.storeSlug && !isSlugManual) {
      setErrors((prev) => ({ ...prev, storeSlug: null }));
    }
  };

  const handleSlugChange = (e) => {
    setIsSlugManual(true);
    const slug = e.target.value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '')
      .replace(/\s+/g, '-');

    setFormData((prev) => ({
      ...prev,
      storeSlug: slug,
    }));

    if (errors.storeSlug) {
      setErrors((prev) => ({ ...prev, storeSlug: null }));
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.storeName.trim()) {
      newErrors.storeName = 'Nama toko wajib diisi';
    }
    if (!formData.storeSlug.trim()) {
      newErrors.storeSlug = 'Slug URL toko wajib diisi';
    } else if (formData.storeSlug.length < 3) {
      newErrors.storeSlug = 'Slug minimal 3 karakter';
    }
    if (!formData.ownerName.trim()) {
      newErrors.ownerName = 'Nama lengkap pemilik wajib diisi';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Alamat email wajib diisi';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format email tidak valid';
    }
    if (!formData.password) {
      newErrors.password = 'Password wajib diisi';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password minimal 8 karakter';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Konfirmasi password tidak cocok';
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
      await register({
        storeName: formData.storeName.trim(),
        storeSlug: formData.storeSlug.trim(),
        ownerName: formData.ownerName.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });

      // Redirect langsung ke Dashboard setelah registrasi berhasil
      router.push('/dashboard');
    } catch (err) {
      if (err.status === 409) {
        setErrors({
          storeSlug: 'Slug toko sudah digunakan oleh tenant lain. Pilih slug lain.',
        });
      } else {
        setErrors({
          form: err.message || 'Terjadi kesalahan sistem saat mendaftar. Silakan coba kembali.',
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

      {/* Main Content Area: Centered Glass Card */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8">
        <div className="relative w-full max-w-xl mx-auto">
          {/* Specular Glow behind Card */}
          <div className="absolute -inset-1 rounded-[38px] bg-linear-to-r from-amber-200/50 via-rose-100/40 to-emerald-100/50 blur-2xl opacity-75 pointer-events-none" />

          {/* Main Frosted Glass Card */}
          <div className="relative max-w-xl w-full p-8 rounded-3xl border border-white/80 shadow-xl bg-white/75 backdrop-blur-2xl ring-1 ring-inset ring-white/60 transition-all duration-300">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-700 text-xs font-semibold mb-3">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Registrasi Toko Baru</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Mulai Toko Cloud POS Anda
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed">
                Buat toko baru dan akun pemilik utama untuk mengaktifkan sistem kasir pintar Anda.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Form Global Error Alert */}
              {errors.form && (
                <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{errors.form}</span>
                </div>
              )}

              {/* Section 1: Identitas Toko */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60">
                  <div className="w-5 h-5 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center text-[11px] font-bold">
                    1
                  </div>
                  <h2 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Identitas Toko
                  </h2>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nama Toko / Bisnis
                  </label>
                  <div className="relative">
                    <Store className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Contoh: Kopi Senja"
                      value={formData.storeName}
                      onChange={handleStoreNameChange}
                      className={`w-full bg-white/80 border rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all shadow-xs ${
                        errors.storeName
                          ? 'border-rose-300 focus:ring-rose-200'
                          : 'border-slate-200/80 focus:ring-amber-200/60 focus:border-amber-400'
                      }`}
                    />
                  </div>
                  {errors.storeName && (
                    <p className="text-[11px] text-rose-600 mt-1">{errors.storeName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    URL Slug Toko
                  </label>
                  <div
                    className={`flex items-center rounded-xl bg-white/80 border shadow-xs overflow-hidden focus-within:ring-2 transition-all ${
                      errors.storeSlug
                        ? 'border-rose-300 focus-within:ring-rose-200'
                        : 'border-slate-200/80 focus-within:ring-amber-200/60 focus-within:border-amber-400'
                    }`}
                  >
                    <span className="px-3 py-2.5 text-xs text-slate-400 bg-slate-100/70 border-r border-slate-200/70 select-none font-mono">
                      omnipos.app/store/
                    </span>
                    <input
                      type="text"
                      placeholder="kopi-senja"
                      value={formData.storeSlug}
                      onChange={handleSlugChange}
                      className="flex-1 bg-transparent px-3 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none font-mono"
                    />
                  </div>
                  {errors.storeSlug ? (
                    <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.storeSlug}</p>
                  ) : (
                    <p className="text-[10px] text-slate-400 mt-1">
                      Slug unik untuk subdomain dan partisi database toko Anda.
                    </p>
                  )}
                </div>
              </div>

              {/* Section 2: Akun Pemilik (First User) */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60">
                  <div className="w-5 h-5 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center text-[11px] font-bold">
                    2
                  </div>
                  <h2 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Akun Pemilik Utama (Owner)
                  </h2>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nama Lengkap Pemilik
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Contoh: Kevin"
                      value={formData.ownerName}
                      onChange={(e) => handleChange('ownerName', e.target.value)}
                      className={`w-full bg-white/80 border rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all shadow-xs ${
                        errors.ownerName
                          ? 'border-rose-300 focus:ring-rose-200'
                          : 'border-slate-200/80 focus:ring-amber-200/60 focus:border-amber-400'
                      }`}
                    />
                  </div>
                  {errors.ownerName && (
                    <p className="text-[11px] text-rose-600 mt-1">{errors.ownerName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Email Pemilik (Digunakan untuk Login)
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      placeholder="owner@kopisenja.com"
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Password (Min. 8 Karakter)
                    </label>
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

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Konfirmasi Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={(e) => handleChange('confirmPassword', e.target.value)}
                        className={`w-full bg-white/80 border rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all shadow-xs ${
                          errors.confirmPassword
                            ? 'border-rose-300 focus:ring-rose-200'
                            : 'border-slate-200/80 focus:ring-amber-200/60 focus:border-amber-400'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        aria-label="Toggle confirm password visibility"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-[11px] text-rose-600 mt-1">{errors.confirmPassword}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-4 py-3.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-slate-900 hover:bg-slate-800 shadow-md shadow-slate-900/15 transition-all duration-300 flex items-center justify-center gap-2 active:scale-98 disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Mendaftarkan Toko & Akun...</span>
                  </>
                ) : (
                  <>
                    <span>Daftarkan Toko Sekarang</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Bottom Link to Login */}
              <div className="text-center pt-2">
                <p className="text-xs text-slate-600">
                  Sudah memiliki akun toko?{' '}
                  <Link
                    href="/login"
                    className="font-bold text-slate-900 hover:text-amber-700 underline underline-offset-4 decoration-amber-400/60 transition-colors"
                  >
                    Masuk di sini
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 text-center text-xs text-slate-400">
        <p>© {new Date().getFullYear()} Omni POS Technologies. Seluruh data tenant dilindungi row-level security.</p>
      </footer>
    </div>
  );
}
