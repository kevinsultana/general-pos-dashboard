'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Layers,
  ArrowLeft,
  Store,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

function RegisterForm() {
  const searchParams = useSearchParams();
  const planQuery = searchParams.get('plan');

  const [formData, setFormData] = useState({
    businessName: '',
    storeSlug: '',
    ownerName: '',
    email: '',
    password: '',
    confirmPassword: '',
    selectedPlan: 'free',
  });

  const [isSlugManual, setIsSlugManual] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Sync plan from URL search parameters (?plan=plus / ?plan=pro / ?plan=free)
  useEffect(() => {
    if (planQuery && ['free', 'plus', 'pro'].includes(planQuery.toLowerCase())) {
      setFormData((prev) => ({
        ...prev,
        selectedPlan: planQuery.toLowerCase(),
      }));
    }
  }, [planQuery]);

  // Auto generate URL slug from business name
  const handleBusinessNameChange = (e) => {
    const name = e.target.value;
    const generatedSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');

    setFormData((prev) => ({
      ...prev,
      businessName: name,
      storeSlug: isSlugManual ? prev.storeSlug : generatedSlug,
    }));

    if (errors.businessName) {
      setErrors((prev) => ({ ...prev, businessName: null }));
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

    if (!formData.businessName.trim()) {
      newErrors.businessName = 'Nama bisnis/toko wajib diisi';
    }
    if (!formData.storeSlug.trim()) {
      newErrors.storeSlug = 'Slug URL toko wajib diisi';
    } else if (formData.storeSlug.length < 3) {
      newErrors.storeSlug = 'Slug minimal 3 karakter';
    }
    if (!formData.ownerName.trim()) {
      newErrors.ownerName = 'Nama pemilik wajib diisi';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email wajib diisi';
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

    try {
      // Mock call to Express backend API: POST /api/auth/register-tenant
      /*
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/register-tenant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      */

      // Simulated network latency
      await new Promise((resolve) => setTimeout(resolve, 1400));
      setSubmitSuccess(true);
    } catch (err) {
      setErrors({ form: 'Terjadi kesalahan sistem saat mendaftar. Silakan coba kembali.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const plans = [
    {
      id: 'free',
      name: 'FREE',
      tagline: 'Gratis Selamanya',
      price: 'Rp 0',
      badge: 'Starter',
    },
    {
      id: 'plus',
      name: 'PLUS',
      tagline: 'Paling Diminati',
      price: 'Rp 149.000',
      badge: 'Best Value',
    },
    {
      id: 'pro',
      name: 'PRO',
      tagline: 'Multi-Cabang',
      price: 'Rp 399.000',
      badge: 'Enterprise',
    },
  ];

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* Specular Glow behind Card */}
      <div className="absolute -inset-1 rounded-[38px] bg-linear-to-r from-amber-200/50 via-rose-100/40 to-emerald-100/50 blur-2xl opacity-75 pointer-events-none" />

      {/* Main Glass Card */}
      <div className="relative rounded-3xl bg-white/75 backdrop-blur-2xl border border-white/80 shadow-[0_16px_48px_0_rgba(31,38,135,0.08)] ring-1 ring-inset ring-white/60 p-6 sm:p-10 transition-all duration-300">
        {/* Card Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-700 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Onboarding Tenant Baru</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Daftarkan Toko & Akun Pemilik
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            Lengkapi data bisnis di bawah ini untuk mengaktifkan portal kasir Omni POS terisolasi Anda dalam 1 menit.
          </p>
        </div>

        {submitSuccess ? (
          <div className="py-10 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-inner">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
              Registrasi Toko Berhasil!
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              Tenant <span className="font-semibold text-slate-900">"{formData.businessName}"</span> telah dibuat dengan URL:{' '}
              <span className="font-mono text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                omnipos.app/store/{formData.storeSlug}
              </span>
              . Silakan masuk untuk mulai mengelola katalog & kasir.
            </p>
            <div className="pt-4">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs sm:text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-md transition-all active:scale-95"
              >
                <span>Masuk ke Dashboard Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Global Form Error Alert */}
            {errors.form && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{errors.form}</span>
              </div>
            )}

            {/* Bagian 1: Profil Bisnis / Toko */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60">
                <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold">
                  1
                </div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  Profil Bisnis / Toko
                </h2>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Toko / Bisnis
                  </label>
                  <div className="relative">
                    <Store className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Contoh: Kopi Senja Utama"
                      value={formData.businessName}
                      onChange={handleBusinessNameChange}
                      className={`w-full bg-white/80 border rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all shadow-xs ${
                        errors.businessName
                          ? 'border-rose-300 focus:ring-rose-200'
                          : 'border-slate-200/80 focus:ring-amber-200/60 focus:border-amber-400'
                      }`}
                    />
                  </div>
                  {errors.businessName && (
                    <p className="text-[11px] text-rose-600 mt-1">{errors.businessName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    URL Slug Toko (Domain Multi-Tenant)
                  </label>
                  <div className="flex items-center rounded-xl bg-white/80 border border-slate-200/80 shadow-xs overflow-hidden focus-within:ring-2 focus-within:ring-amber-200/60 focus-within:border-amber-400">
                    <span className="px-3.5 py-2.5 text-xs text-slate-400 bg-slate-100/70 border-r border-slate-200/70 select-none font-mono">
                      omnipos.app/store/
                    </span>
                    <input
                      type="text"
                      placeholder="kopi-senja-utama"
                      value={formData.storeSlug}
                      onChange={handleSlugChange}
                      className="flex-1 bg-transparent px-3 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none font-mono"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    URL publik toko Anda untuk pemesanan & identifikasi row-level isolation database.
                  </p>
                  {errors.storeSlug && (
                    <p className="text-[11px] text-rose-600 mt-1">{errors.storeSlug}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Bagian 2: Akun Pemilik (First User) */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60">
                <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold">
                  2
                </div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  Akun Pemilik Pertama (Owner)
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Lengkap Pemilik
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Contoh: Budi Santoso"
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

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Alamat Email (Digunakan untuk Login)
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      placeholder="budi@kopisenja.com"
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

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
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
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-[11px] text-rose-600 mt-1">{errors.password}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
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

            {/* Bagian 3: Pemilihan Paket Awal (Radio Pill Glass) */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60">
                <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold">
                  3
                </div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  Paket Langganan Awal
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {plans.map((p) => {
                  const isSelected = formData.selectedPlan === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleChange('selectedPlan', p.id)}
                      className={`relative p-3.5 rounded-2xl text-left transition-all duration-200 border ${
                        isSelected
                          ? 'bg-white border-amber-500 ring-2 ring-amber-400/40 shadow-sm'
                          : 'bg-white/60 hover:bg-white/90 border-slate-200/80'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-3 right-3 text-amber-600">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-xs font-bold text-slate-900">{p.name}</span>
                        <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600">
                          {p.badge}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mb-2">{p.tagline}</p>
                      <p className="text-xs font-extrabold text-amber-700">{p.price}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-slate-900 hover:bg-slate-800 shadow-md shadow-slate-900/15 transition-all duration-300 flex items-center justify-center gap-2 active:scale-98 disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Memproses Registrasi Tenant...</span>
                </>
              ) : (
                <>
                  <span>Selesaikan & Daftarkan Toko</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Bottom Link to Login */}
            <div className="text-center pt-2">
              <p className="text-xs text-slate-600">
                Sudah punya akun toko?{' '}
                <Link
                  href="/login"
                  className="font-bold text-slate-900 hover:text-amber-700 underline underline-offset-4 decoration-amber-400/60 transition-colors"
                >
                  Masuk di sini
                </Link>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function RegisterPage() {
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

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8">
        <Suspense
          fallback={
            <div className="p-8 text-center text-xs text-slate-500">
              Memuat formulir pendaftaran...
            </div>
          }
        >
          <RegisterForm />
        </Suspense>
      </main>

      {/* Subtle Bottom Footer Info */}
      <footer className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 text-center text-xs text-slate-400">
        <p>© {new Date().getFullYear()} Omni POS Technologies. Seluruh data tenant dilindungi enkripsi row-level security.</p>
      </footer>
    </div>
  );
}
