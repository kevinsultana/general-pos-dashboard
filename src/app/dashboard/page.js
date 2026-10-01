'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Layers,
  Store,
  User,
  LogOut,
  Sparkles,
  ShoppingBag,
  TrendingUp,
  Boxes,
  Users,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function DashboardPage() {
  const router = useRouter();
  const { user, tenant, isLoading, isAuthenticated, logout } = useAuth();

  // Proteksi rute: Jika tidak terotentikasi & loading selesai, redirect ke /login
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-medium text-slate-500">Memuat sesi dashboard...</p>
        </div>
      </div>
    );
  }

  const getPlanBadge = (plan) => {
    switch (plan) {
      case 'PRO':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'PLUS':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-800 flex flex-col selection:bg-amber-100 selection:text-amber-900 overflow-x-hidden">
      {/* Background Soft Liquid Aura Blobs */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        {/* Liquid Orb 1: Soft Peach */}
        <div className="absolute -top-32 -left-32 w-140 h-140 rounded-full bg-[#fed7aa]/55 blur-[120px] mix-blend-multiply" />

        {/* Liquid Orb 2: Frosted Sage */}
        <div className="absolute top-1/3 -right-32 w-130 h-130 rounded-full bg-[#bbf7d0]/45 blur-[130px] mix-blend-multiply" />

        {/* Liquid Orb 3: Cream Rose / Lavender Mist */}
        <div className="absolute top-2/3 left-1/4 w-140 h-140 rounded-full bg-[#f5d0fe]/40 blur-[130px] mix-blend-multiply" />
      </div>

      {/* Top Navbar Dashboard */}
      <header className="sticky top-4 z-40 max-w-6xl mx-auto px-4 sm:px-6 w-full">
        <div className="bg-white/75 backdrop-blur-2xl border border-white/80 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] ring-1 ring-inset ring-white/60 rounded-full px-5 py-3 flex items-center justify-between transition-all">
          {/* Brand Logo & Store Info */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-full bg-linear-to-br from-amber-500 to-amber-600 p-0.5 shadow-xs group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                  <Layers className="w-4 h-4 text-amber-600" />
                </div>
              </div>
              <span className="text-base font-bold tracking-tight text-slate-900 hidden sm:inline-block">
                Omni<span className="text-amber-600">POS</span>
              </span>
            </Link>

            <span className="h-4 w-px bg-slate-200" />

            {/* Tenant Capsule */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100/80 border border-slate-200/60 text-xs font-semibold text-slate-800">
                <Store className="w-3.5 h-3.5 text-amber-600" />
                <span>{tenant?.name || 'Toko Saya'}</span>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${getPlanBadge(
                  tenant?.plan
                )}`}
              >
                Paket {tenant?.plan || 'FREE'}
              </span>
            </div>
          </div>

          {/* User Profile & Logout */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-right">
              <div>
                <p className="text-xs font-bold text-slate-800">{user?.name || 'Pengguna'}</p>
                <p className="text-[10px] text-slate-400 font-mono">
                  omnipos.app/store/{tenant?.slug}
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 font-bold text-xs">
                {(user?.name || 'U').charAt(0).toUpperCase()}
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 transition-all active:scale-95"
              title="Keluar dari akun"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Dashboard Area */}
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 py-8 w-full">
        {/* Welcome Banner Card */}
        <div className="relative rounded-3xl p-8 bg-white/75 backdrop-blur-2xl border border-white/80 shadow-[0_12px_40px_0_rgba(31,38,135,0.06)] ring-1 ring-inset ring-white/60 mb-8 overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold mb-3">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Multi-Tenant Row-Level Isolated</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Halo, {user?.name}! 👋
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 max-w-xl leading-relaxed">
                Selamat datang di portal manajemen toko{' '}
                <span className="font-semibold text-slate-900">{tenant?.name}</span>. Data toko Anda
                tersimpan aman dengan row-level tenant security di server PostgreSQL.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/#harga"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-slate-800 bg-white hover:bg-slate-50 border border-slate-200/80 shadow-2xs transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Kelola Paket Langganan</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="p-5 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/80 shadow-xs ring-1 ring-inset ring-white/60">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">Penjualan Hari Ini</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-xl sm:text-2xl font-extrabold text-slate-900">Rp 0</p>
            <p className="text-[11px] text-slate-400 mt-1">Shift aktif sedang berjalan</p>
          </div>

          <div className="p-5 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/80 shadow-xs ring-1 ring-inset ring-white/60">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">Total Transaksi</span>
              <ShoppingBag className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-xl sm:text-2xl font-extrabold text-slate-900">0 Order</p>
            <p className="text-[11px] text-slate-400 mt-1">Siap mencetak struk thermal</p>
          </div>

          <div className="p-5 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/80 shadow-xs ring-1 ring-inset ring-white/60">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">Katalog Produk</span>
              <Boxes className="w-4 h-4 text-slate-600" />
            </div>
            <p className="text-xl sm:text-2xl font-extrabold text-slate-900">Siap Dikelola</p>
            <p className="text-[11px] text-slate-400 mt-1">Kategori menu & SKU inventaris</p>
          </div>

          <div className="p-5 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/80 shadow-xs ring-1 ring-inset ring-white/60">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">Hak Akses (RBAC)</span>
              <Users className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-xl sm:text-2xl font-extrabold text-slate-900">
              {user?.isOwner ? 'Owner Utama' : 'Kasir'}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Izin akses penuh sistem</p>
          </div>
        </div>

        {/* Tenant Information Summary Card */}
        <div className="rounded-3xl p-6 sm:p-8 bg-white/75 backdrop-blur-2xl border border-white/80 shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] ring-1 ring-inset ring-white/60 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200/60">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Detail Multi-Tenant Toko</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Informasi konfigurasi database dan kredensial akses tenant Anda.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Database Terhubung</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-xs">
            <div>
              <p className="text-slate-400 font-medium mb-1">Nama Toko</p>
              <p className="text-sm font-bold text-slate-800">{tenant?.name}</p>
            </div>

            <div>
              <p className="text-slate-400 font-medium mb-1">Store Slug (Subdomain)</p>
              <p className="text-sm font-bold font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block">
                {tenant?.slug}
              </p>
            </div>

            <div>
              <p className="text-slate-400 font-medium mb-1">Tenant ID</p>
              <p className="text-xs font-mono text-slate-600 truncate">{tenant?.id}</p>
            </div>

            <div>
              <p className="text-slate-400 font-medium mb-1">Email Akun</p>
              <p className="text-sm font-bold text-slate-800">{user?.email}</p>
            </div>

            <div>
              <p className="text-slate-400 font-medium mb-1">Role Akun</p>
              <p className="text-sm font-bold text-slate-800">
                {user?.isOwner ? 'Owner (Pemilik Toko)' : 'Karyawan / Kasir'}
              </p>
            </div>

            <div>
              <p className="text-slate-400 font-medium mb-1">Paket Berlangganan</p>
              <p className="text-sm font-bold text-slate-800 uppercase">
                {tenant?.plan || 'FREE'}{' '}
                <span className="text-[10px] text-slate-500 font-normal">
                  ({tenant?.planStatus || 'ACTIVE'})
                </span>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 text-center text-xs text-slate-400 border-t border-slate-200/50 mt-12">
        <p>© {new Date().getFullYear()} Omni POS Technologies. Sesi aktif terenkripsi aman.</p>
      </footer>
    </div>
  );
}
