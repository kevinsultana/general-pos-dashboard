'use client';

import {
  Menu,
  Store,
  Sparkles,
  LogOut,
  Bell,
  RefreshCw,
  Search,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { confirmLogout } from '../../lib/alerts';

export default function TopNavbar({ onToggleMobile }) {
  const router = useRouter();
  const { user, tenant, logout } = useAuth();

  const handleLogout = async () => {
    const result = await confirmLogout();
    if (result.isConfirmed) {
      logout();
      toast.success('Anda telah berjaya log keluar.');
      router.push('/login');
    }
  };

  const handleSync = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1200)),
      {
        loading: 'Menyelaraskan data pesanan dengan pelayan cloud...',
        success: 'Semua rekod transaksi berjaya disegerakkan!',
        error: 'Ralat penyegerakan pelayan.',
      }
    );
  };

  const getPlanBadge = (plan) => {
    switch (plan) {
      case 'PRO':
        return {
          label: 'Pelan PRO',
          classes: 'bg-purple-50 text-purple-700 border-purple-200 shadow-purple-500/10',
          dot: 'bg-purple-500',
        };
      case 'PLUS':
        return {
          label: 'Pelan PLUS',
          classes: 'bg-amber-50 text-amber-700 border-amber-200 shadow-amber-500/10',
          dot: 'bg-amber-500',
        };
      default:
        return {
          label: 'Pelan FREE',
          classes: 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-emerald-500/10',
          dot: 'bg-emerald-500',
        };
    }
  };

  const planBadge = getPlanBadge(tenant?.plan);

  return (
    <header className="sticky top-4 z-30 w-full mb-6">
      <div className="bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] ring-1 ring-inset ring-white/70 rounded-2xl sm:rounded-full px-4 sm:px-6 py-2.5 flex items-center justify-between transition-all">
        {/* Left Side: Mobile Hamburger & Branch Info */}
        <div className="flex items-center gap-3">
          {/* Mobile Toggle Button */}
          <button
            type="button"
            onClick={onToggleMobile}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition-colors"
            aria-label="Buka Menu Navigasi"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Active Branch Pill */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100/80 border border-slate-200/70 text-xs font-semibold text-slate-800 shadow-2xs">
              <Store className="w-3.5 h-3.5 text-amber-600" />
              <span>Cabang Utama</span>
            </div>

            {/* Plan Badge Pill */}
            <div
              className={`hidden sm:flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full border uppercase tracking-wider shadow-2xs ${planBadge.classes}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${planBadge.dot} animate-pulse`} />
              <span>{planBadge.label}</span>
            </div>
          </div>
        </div>

        {/* Right Side: Quick Action Utilities & User Avatar */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Cloud Sync Button */}
          <button
            type="button"
            onClick={handleSync}
            title="Segerakkan data terkini"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-white/80 border border-transparent hover:border-slate-200/60 transition-all active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Notifications Trigger */}
          <button
            type="button"
            onClick={() => toast('Tiada pemberitahuan sistem baharu.', { icon: '🔔' })}
            title="Pemberitahuan"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-white/80 border border-transparent hover:border-slate-200/60 transition-all active:scale-95 relative"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white" />
          </button>

          <span className="h-4 w-px bg-slate-200/80 mx-1 hidden sm:inline-block" />

          {/* User Profile Capsule */}
          <div className="flex items-center gap-2.5 pl-1">
            <div className="hidden md:block text-right leading-tight">
              <p className="text-xs font-extrabold text-slate-900 truncate max-w-[130px]">
                {user?.name || 'Pengguna'}
              </p>
              <p className="text-[10px] font-medium text-slate-400 capitalize">
                {user?.isOwner ? 'Pemilik Toko' : user?.role || 'Kasir'}
              </p>
            </div>

            <div className="w-8 h-8 rounded-full bg-linear-to-br from-amber-400 to-amber-600 p-0.5 shadow-2xs">
              <div className="w-full h-full bg-white rounded-full flex items-center justify-center text-amber-700 font-extrabold text-xs">
                {(user?.name || 'U').charAt(0).toUpperCase()}
              </div>
            </div>

            {/* Quick Logout Button */}
            <button
              type="button"
              onClick={handleLogout}
              title="Log Keluar"
              className="p-2 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
