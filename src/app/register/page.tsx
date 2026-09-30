'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Store,
  User,
  KeyRound,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
  AlertCircle,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function RegisterPage() {
  const router = useRouter();
  const { user, isLoading, register } = useAuth();
  const [storeName, setStoreName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      router.push('/overview');
    }
  }, [user, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!storeName || !username || !password) {
      setError('Harap lengkapi Nama Toko, Username, dan Password');
      return;
    }

    if (username.length < 3) {
      setError('Username minimal harus 3 karakter');
      return;
    }

    if (password.length < 6) {
      setError('Password minimal harus 6 karakter');
      return;
    }

    if (storeName.length < 2) {
      setError('Nama toko minimal harus 2 karakter');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await register({
        storeName: storeName.trim(),
        ownerName: ownerName.trim() || undefined,
        username: username.trim(),
        password,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
      });
    } catch (err: any) {
      setError(err.message || 'Gagal mendaftarkan toko. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 py-12 bg-[#0b0f19] relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-150 h-150 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-xl relative z-10">
        {/* Back Link */}
        <div className="mb-4">
          <Link
            href="/"
            className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-slate-200 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>

        {/* Header Title */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-linear-to-tr from-indigo-600 to-purple-600 shadow-xl shadow-indigo-500/25 mb-4">
            <Store className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Daftarkan Toko Baru</h1>
          <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
            Mulai kelola bisnis UMKM Anda dengan sistem POS terintegrasi cloud & Web Dashboard PRO
          </p>
        </div>

        {/* Registration Glass Card */}
        <div className="glass-card p-6 sm:p-8 shadow-2xl border border-slate-700/60 bg-[#121829]/80 backdrop-blur-xl">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-start space-x-3 text-rose-400 text-xs animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Store Name */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Nama Toko / Usaha <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Store className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="Contoh: Toko Berkah Mandiri"
                    className="pos-input pl-10 pr-4 py-2.5"
                    required
                  />
                </div>
              </div>

              {/* Owner Name */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Nama Pemilik
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="Nama lengkap Anda"
                    className="pos-input pl-10 pr-4 py-2.5"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  No. Telepon / WhatsApp
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="08123456789"
                    className="pos-input pl-10 pr-4 py-2.5"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Email Toko
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="toko@bisnis.com"
                    className="pos-input pl-10 pr-4 py-2.5"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Alamat Usaha
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Alamat fisik toko / cabang"
                    className="pos-input pl-10 pr-4 py-2.5"
                  />
                </div>
              </div>
            </div>

            {/* Account Credentials Section */}
            <div className="pt-3 border-t border-slate-800">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">
                Akun Pemilik (Owner Login)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Username */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Username <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Username untuk login"
                      className="pos-input pl-10 pr-4 py-2.5"
                      required
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Minimal 3 karakter tanpa spasi</p>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Password <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      className="pos-input pl-10 pr-4 py-2.5"
                      required
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Gunakan password yang aman</p>
                </div>
              </div>
            </div>

            {/* Included Benefits Card */}
            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 flex items-center space-x-2.5 mt-2">
              <Sparkles className="w-4 h-4 shrink-0 text-indigo-400" />
              <span>
                Pendaftaran langsung mengaktifkan <strong>Paket PRO</strong> dengan akses Web Dashboard lengkap.
              </span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-4 py-3 px-4 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/25 flex items-center justify-center space-x-2 transition disabled:opacity-50 cursor-pointer"
            >
              <span>{isSubmitting ? 'Mendaftarkan Toko...' : 'Daftarkan Toko Sekarang'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Bottom Login Link */}
          <div className="mt-6 pt-5 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-400">
              Sudah memiliki akun toko terdaftar?{' '}
              <Link
                href="/login"
                className="text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-2 transition"
              >
                Masuk ke Dashboard
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
