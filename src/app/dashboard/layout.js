'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from '../../components/dashboard/Sidebar';
import TopNavbar from '../../components/dashboard/TopNavbar';

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const { isLoading, isAuthenticated } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Proteksi Rute: Jika belum login dan proses validasi selesai, tendang ke /login
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Kunci scroll halaman ketika drawer mudah alih terbuka
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-3 border-amber-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">
            Mengesahkan sesi kerja Omni POS...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-800 flex overflow-hidden selection:bg-amber-100 selection:text-amber-900">
      {/* Background Soft Liquid Aura Blobs (Kekal konsisten di seluruh aplikasi) */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        {/* Liquid Orb 1: Soft Peach */}
        <div className="absolute -top-32 -left-32 w-140 h-140 rounded-full bg-[#fed7aa]/50 blur-[130px] mix-blend-multiply" />

        {/* Liquid Orb 2: Frosted Sage */}
        <div className="absolute top-1/3 -right-32 w-140 h-140 rounded-full bg-[#bbf7d0]/40 blur-[140px] mix-blend-multiply" />

        {/* Liquid Orb 3: Cream Rose / Lavender Mist */}
        <div className="absolute top-2/3 left-1/4 w-140 h-140 rounded-full bg-[#f5d0fe]/35 blur-[130px] mix-blend-multiply" />

        {/* Liquid Orb 4: Soft Warm Amber */}
        <div className="absolute -bottom-32 right-1/4 w-120 h-120 rounded-full bg-[#fed7aa]/35 blur-[120px] mix-blend-multiply" />
      </div>

      {/* 1. Bar Sisi Tetap untuk Paparan Desktop (Fixed/Sticky Sidebar) */}
      <div className="hidden lg:flex flex-col w-72 shrink-0 p-4 h-screen sticky top-0">
        <div className="w-full h-full rounded-3xl bg-white/75 backdrop-blur-2xl border border-white/80 shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] ring-1 ring-inset ring-white/60 overflow-hidden">
          <Sidebar />
        </div>
      </div>

      {/* 2. Drawer Bar Sisi untuk Paparan Mudah Alih (Responsive Mobile Slide-in Drawer) */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex animate-in fade-in duration-200">
          {/* Latar Belakang Kelabu Kaca (Backdrop) */}
          <div
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs transition-opacity"
            aria-hidden="true"
          />

          {/* Drawer Kaca Gelongsor */}
          <div className="relative w-80 max-w-[85vw] h-full bg-white/95 backdrop-blur-2xl border-r border-white/90 shadow-2xl p-2 z-10 flex flex-col justify-between animate-in slide-in-from-left duration-300">
            {/* Butang Tutup Drawer */}
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors z-20"
              aria-label="Tutup Menu"
            >
              <X className="w-5 h-5" />
            </button>

            <Sidebar onCloseMobile={() => setIsMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* 3. Kawasan Kandungan Utama (Main Content Area) */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto custom-scrollbar">
        <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-4 flex-1 flex flex-col">
          {/* Bar Atas Dashboard Terapung */}
          <TopNavbar onToggleMobile={() => setIsMobileMenuOpen(true)} />

          {/* Paparan Kandungan Halaman Dinamik */}
          <main className="flex-1 pb-10">{children}</main>
        </div>
      </div>
    </div>
  );
}
