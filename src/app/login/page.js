'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Layers,
  ArrowLeft,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = 'Email wajib diisi';
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

    try {
      // Mock call to Express backend API: POST /api/auth/login
      /*
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      */

      // Simulated network latency
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setLoginSuccess(true);
    } catch (err) {
      setErrors({ form: 'Email atau password salah. Silakan periksa kembali akun Anda.' });
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

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8">
        <div className="relative w-full max-w-md mx-auto">
          {/* Specular Glow behind Card */}
          <div className="absolute -inset-1 rounded-[38px] bg-linear-to-r from-amber-200/50 via-rose-100/40 to-emerald-100/50 blur-2xl opacity-75 pointer-events-none" />

          {/* Main Glass Card */}
          <div className="relative rounded-3xl bg-white/75 backdrop-blur-2xl border border-white/80 shadow-[0_16px_48px_0_rgba(31,38,135,0.08)] ring-1 ring-inset ring-white/60 p-6 sm:p-10 transition-all duration-300">
            {/* Card Header */}
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
                Masuk ke portal kasir & dashboard analitik tokomu.
              </p>
            </div>

            {loginSuccess ? (
              <div className="py-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-inner">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  Login Berhasil!
                </h3>
                <p className="text-xs sm:text-sm text-slate-600">
                  Mengalihkan ke dashboard toko Anda...
                </p>
                <div className="pt-2">
                  <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Global Error Alert */}
                {errors.form && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>{errors.form}</span>
                  </div>
                )}

                {/* Email Field */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Alamat Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      placeholder="nama@tokomu.com"
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

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Password
                    </label>
                    <a
                      href="#forgot-password"
                      onClick={(e) => {
                        e.preventDefault();
                        alert('Silakan hubungi administrator toko Anda atau customer support untuk reset kata sandi.');
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
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-[11px] text-rose-600 mt-1">{errors.password}</p>
                  )}
                </div>

                {/* Remember Me Checkbox */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    checked={formData.rememberMe}
                    onChange={(e) => handleChange('rememberMe', e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-400/40 border-slate-300"
                  />
                  <label htmlFor="rememberMe" className="text-xs text-slate-600 select-none cursor-pointer">
                    Ingat sesi saya di perangkat ini
                  </label>
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
                      <span>Memverifikasi Akun...</span>
                    </>
                  ) : (
                    <>
                      <span>Masuk ke Akun</span>
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
            )}
          </div>
        </div>
      </main>

      {/* Subtle Bottom Footer Info */}
      <footer className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 text-center text-xs text-slate-400">
        <p>© {new Date().getFullYear()} Omni POS Technologies. Dilindungi enkripsi row-level tenant security.</p>
      </footer>
    </div>
  );
}
