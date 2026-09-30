'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Store,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  Laptop,
  Database,
  Barcode,
  CheckCircle2,
  TrendingUp,
  Boxes,
  Sparkles,
  DollarSign,
  Utensils,
  BadgePercent,
  Menu,
  X,
  CloudOff,
  Cloud,
} from 'lucide-react';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 selection:bg-indigo-500 selection:text-white relative overflow-x-hidden font-sans">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-indigo-600/15 via-purple-600/10 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute top-[800px] -left-48 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-[1600px] -right-48 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* ── Top Navigation Bar ── */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#0b0f19]/80 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-slate-100 text-lg tracking-tight">General POS</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Hybrid
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Sistem Kasir & Analitik UMKM</p>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center space-x-8 text-xs font-medium text-slate-300">
            <a href="#keunggulan" className="hover:text-indigo-400 transition-colors">
              Keunggulan
            </a>
            <a href="#ekosistem" className="hover:text-indigo-400 transition-colors">
              Ekosistem 3 Pilar
            </a>
            <a href="#fitur" className="hover:text-indigo-400 transition-colors">
              Fitur Lengkap
            </a>
            <a href="#paket" className="hover:text-indigo-400 transition-colors">
              Paket Langganan
            </a>
          </nav>

          {/* Action Buttons */}
          <div className="hidden sm:flex items-center space-x-3">
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700 transition"
            >
              Masuk
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/30 transition flex items-center space-x-1.5"
            >
              <span>Daftar Toko Gratis</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden px-4 pt-3 pb-5 border-b border-slate-800 bg-[#0d121f]/95 space-y-3 animate-in slide-in-from-top-2 duration-200">
            <a
              href="#keunggulan"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm text-slate-300 hover:text-indigo-400 py-1"
            >
              Keunggulan
            </a>
            <a
              href="#ekosistem"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm text-slate-300 hover:text-indigo-400 py-1"
            >
              Ekosistem 3 Pilar
            </a>
            <a
              href="#fitur"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm text-slate-300 hover:text-indigo-400 py-1"
            >
              Fitur Lengkap
            </a>
            <a
              href="#paket"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm text-slate-300 hover:text-indigo-400 py-1"
            >
              Paket Langganan
            </a>
            <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
              <Link
                href="/login"
                className="w-full py-2.5 text-center text-xs font-semibold text-slate-300 bg-slate-800 rounded-xl"
              >
                Masuk ke Dashboard
              </Link>
              <Link
                href="/register"
                className="w-full py-2.5 text-center text-xs font-semibold text-white bg-indigo-600 rounded-xl"
              >
                Daftar Toko Gratis
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ── 1. Hero Section ── */}
      <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center space-y-6 max-w-4xl mx-auto">
          {/* Badge pill */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-800/90 border border-slate-700/80 text-xs text-slate-300 shadow-inner">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-medium">Arsitektur Hybrid UMKM</span>
            <span className="text-slate-500">•</span>
            <span className="text-indigo-400 font-semibold">Offline-First + Cloud Sync</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-100 leading-[1.15]">
            Solusi Kasir Pintar UMKM{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-emerald-400 bg-clip-text text-transparent">
              Tangguh Tanpa Internet,
            </span>{' '}
            Kuat dengan Cloud.
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base lg:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Satu ekosistem terpadu untuk Ritel, F&B, Pakaian, dan Usaha Kecil. Kasir tetap mencatat
            transaksi kilat saat koneksi padam di aplikasi mobile, dan otomatis tersinkronisasi ke
            Web Dashboard Pro saat online.
          </p>

          {/* Hero CTAs */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link
              href="/register"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-linear-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 flex items-center justify-center space-x-2 transition transform hover:-translate-y-0.5"
            >
              <span>Daftar Toko & Coba Pro Gratis</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/login"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 font-semibold text-sm border border-slate-700/80 hover:border-slate-600 flex items-center justify-center space-x-2 transition"
            >
              <Laptop className="w-4 h-4 text-indigo-400" />
              <span>Buka Web Dashboard</span>
            </Link>
          </div>

          {/* Trust points */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-slate-400">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>100% Offline-First Kasir</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Bebas Duplikasi Transaksi (Idempotent)</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Hitung HPP Otomatis (Weighted Cost)</span>
            </div>
          </div>
        </div>

        {/* ── Visual Product Mockup / Floating Metrics Card ── */}
        <div className="mt-14 relative max-w-5xl mx-auto">
          <div className="rounded-2xl border border-slate-700/70 bg-[#101626]/90 p-4 sm:p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden">
            {/* Top Mockup Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-6">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="ml-2 text-xs font-mono text-slate-400">
                  general-pos.app/dashboard/overview
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <Cloud className="w-3 h-3" />
                  <span>Cloud Sync: Terhubung Real-Time</span>
                </span>
              </div>
            </div>

            {/* Mock Dashboard Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
                <p className="text-[11px] text-slate-400 font-medium">Omzet Hari Ini (Real-time)</p>
                <p className="text-xl sm:text-2xl font-extrabold text-emerald-400 font-mono mt-1">
                  Rp 4.850.000
                </p>
                <span className="text-[10px] text-emerald-400 font-semibold">
                  +14.2% dibanding kemarin
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
                <p className="text-[11px] text-slate-400 font-medium">Struk Transaksi Selesai</p>
                <p className="text-xl sm:text-2xl font-extrabold text-indigo-400 font-mono mt-1">
                  128 Transaksi
                </p>
                <span className="text-[10px] text-slate-400">0 struk dibatalkan (100% konsisten)</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
                <p className="text-[11px] text-slate-400 font-medium">Kanal Pembayaran Terbanyak</p>
                <p className="text-xl sm:text-2xl font-extrabold text-purple-400 font-mono mt-1">
                  QRIS (58%)
                </p>
                <span className="text-[10px] text-slate-400">Tunai 32% • Transfer 10%</span>
              </div>
            </div>

            {/* Bottom Split: Recent POS Sync & Inventory Alert */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-slate-200 flex items-center space-x-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Aktivitas Struk Kasir Mobile</span>
                  </h4>
                  <span className="text-[10px] font-mono text-slate-400">Baru Saja</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center p-2 rounded-lg bg-slate-800/50">
                    <span className="font-mono text-slate-300">TRX-2026-0929-0042</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400">
                      COMPLETED
                    </span>
                    <span className="font-mono font-bold text-slate-200">Rp 175.000</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-slate-800/50">
                    <span className="font-mono text-slate-300">TRX-2026-0929-0041</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400">
                      COMPLETED
                    </span>
                    <span className="font-mono font-bold text-slate-200">Rp 82.000</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-slate-200 flex items-center space-x-1.5">
                    <Boxes className="w-3.5 h-3.5 text-amber-400" />
                    <span>Manajemen HPP & Stok Terkendali</span>
                  </h4>
                  <span className="text-[10px] text-indigo-400 font-semibold">Weighted Avg Cost</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/50 text-xs space-y-1.5">
                  <div className="flex justify-between text-slate-300">
                    <span>Kopi Susu Gula Aren 250ml</span>
                    <span className="font-mono text-emerald-400 font-semibold">Stok: 48 botol</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    HPP Modal: <strong className="text-slate-200">Rp 8.500</strong> • Jual:{' '}
                    <strong className="text-slate-200">Rp 18.000</strong> (Margin: 52.7%)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. Keunggulan Utama Web App & Sistem ── */}
      <section id="keunggulan" className="py-20 border-t border-slate-800/80 bg-[#090d16]/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              Kelebihan Web App & Sistem Kami
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
              Mengapa UMKM Memilih General POS?
            </h2>
            <p className="text-sm text-slate-400">
              Dirancang untuk mengatasi masalah nyata pemilik toko: internet sering putus, kasir
              lambat, data stok selisih, dan laporan keuangan yang tidak transparan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Keunggulan 1 */}
            <div className="glass-card p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition relative group">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-5 group-hover:scale-110 transition-transform">
                <CloudOff className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-100 mb-2">
                Ketahanan Offline Murni (Offline-First)
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Kasir tidak pernah macet saat listrik padam atau internet mati. Seluruh transaksi
                tersimpan lokal di SQLite HP/Tablet dan tersinkronisasi otomatis saat online kembali.
              </p>
            </div>

            {/* Keunggulan 2 */}
            <div className="glass-card p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition relative group">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-5 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-100 mb-2">
                Analitik Laba Bersih & Cost Snapshot
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Setiap transaksi menyimpan harga modal saat penjualan berlangsung. Laba kotor
                historis dijamin tidak bergeser saat harga kulakan barang di masa depan berubah.
              </p>
            </div>

            {/* Keunggulan 3 */}
            <div className="glass-card p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition relative group">
              <div className="w-12 h-12 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-5 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-100 mb-2">
                Audit Trail & Integritas Transaksi
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Transaksi yang selesai bersifat permanen. Setiap pembatalan struk, refund sebagian,
                atau penyesuaian stok mencatat alasan dan jejak audit staf secara transparan.
              </p>
            </div>

            {/* Keunggulan 4 */}
            <div className="glass-card p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition relative group">
              <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-5 group-hover:scale-110 transition-transform">
                <Laptop className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-100 mb-2">
                Pusat Kendali Toko Tanpa Ganggu Kasir
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Pemilik toko dapat memantau penjualan, memperbarui harga katalog, dan melihat stok
                kapan saja dari laptop rumah tanpa perlu meminjam perangkat kasir di outlet.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Ekosistem 3 Pilar ── */}
      <section id="ekosistem" className="py-20 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
              Arsitektur Sistem Terintegrasi
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
              Sinergi 3 Pilar: Mobile, Backend & Web Dashboard
            </h2>
            <p className="text-sm text-slate-400">
              Tidak ada bagian yang berdiri sendiri. Seluruh komponen dirancang saling melengkapi
              untuk menjaga kecepatan transaksi di garda depan dan akurasi laporan di belakang meja.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Pilar 1: Mobile POS (Flutter) */}
            <div className="glass-card p-7 rounded-2xl border border-indigo-500/30 bg-[#101524]/90 space-y-5 flex flex-col justify-between">
              <div>
                <div className="inline-flex p-3 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 mb-4">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-bold text-slate-100">1. Mobile POS App</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/20 text-indigo-300">
                    Flutter
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Aplikasi kasir di meja pembayaran dengan navigasi cepat, respons sentuh kilat, dan
                  keandalan tinggi.
                </p>

                <ul className="mt-5 space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Printer Thermal Bluetooth ESC/POS (kertas 58mm & 80mm).</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Barcode scanner kamera & dukungan barcode fisik CODE 128.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Mode Resto: Dine-in, Takeaway, dan cetak Kitchen Order Ticket.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Simpan draft / parkir pesanan saat antrean menumpuk.</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-400">
                Penyimpanan lokal dengan <strong className="text-indigo-400">Drift SQLite</strong>
              </div>
            </div>

            {/* Pilar 2: Backend & Sync Engine */}
            <div className="glass-card p-7 rounded-2xl border border-purple-500/30 bg-[#101524]/90 space-y-5 flex flex-col justify-between">
              <div>
                <div className="inline-flex p-3 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30 mb-4">
                  <Database className="w-6 h-6" />
                </div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-bold text-slate-100">2. Sync Engine & REST API</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/20 text-purple-300">
                    Express & Prisma
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Mesin sinkronisasi data cerdas berbasis event unik yang menjamin data aman dan
                  tidak pernah berulang.
                </p>

                <ul className="mt-5 space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Idempotent Sync: Kirim ulang event tidak menduplikasi penjualan.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Transaksi Atomik: Pembayaran, struk, dan stok berkurang serentak.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Role-Based Access Control (RBAC): Owner, Admin, Kasir.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Pencatatan Audit Trail otomatis untuk seluruh aksi sensitif.</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-400">
                Penyimpanan cloud dengan <strong className="text-purple-400">PostgreSQL</strong>
              </div>
            </div>

            {/* Pilar 3: Web Dashboard Pro */}
            <div className="glass-card p-7 rounded-2xl border border-emerald-500/30 bg-[#101524]/90 space-y-5 flex flex-col justify-between">
              <div>
                <div className="inline-flex p-3 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 mb-4">
                  <Laptop className="w-6 h-6" />
                </div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-bold text-slate-100">3. Web Dashboard Pro</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300">
                    Next.js
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Pusat komando pemilik toko untuk melihat tren performa bisnis dan mengatur seluruh
                  operasional.
                </p>

                <ul className="mt-5 space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Ringkasan KPI omzet harian, bulanan, dan total pendapatan.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Katalog varian harga, modal, dan stok terpusat.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Laporan produk terlaris & analisis margin keuntungan per item.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Distribusi metode bayar (Tunai, QRIS, Transfer, Debit/Kredit).</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-400">
                Akses instan via browser di <strong className="text-emerald-400">PC / Laptop</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Fitur-Fitur Lengkap (Berdasarkan Spesifikasi Project) ── */}
      <section id="fitur" className="py-20 border-t border-slate-800/80 bg-[#090d16]/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Kemampuan Penuh Sistem
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
              Fitur Lengkap Sesuai Kebutuhan Nyata UMKM
            </h2>
            <p className="text-sm text-slate-400">
              Tidak ada fitur berlebihan yang membingungkan. Semua fitur dirancang fokus untuk
              kecepatan kasir, akurasi stok, dan kemudahan pemilik toko.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Fitur 1: Varian & Barcode */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Barcode className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-100">Katalog Varian & Barcode CODE 128</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Kelola produk dengan varian (ukuran, warna, panas/dingin) dengan SKU, barcode, modal,
                dan stok per varian. Barcode dapat dipindai langsung dari kamera kasir.
              </p>
            </div>

            {/* Fitur 2: Weighted Average Cost */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-100">HPP Rata-Rata Tertimbang (MAC)</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Saat ada stok masuk dengan harga kulakan berbeda, sistem menghitung rata-rata harga
                modal secara otomatis sehingga laba kotor selalu akurat.
              </p>
            </div>

            {/* Fitur 3: Mutasi & Penyesuaian Stok */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Boxes className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-100">Pencatatan Mutasi Stok</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tidak ada perubahan stok sembarangan. Setiap perubahan tercatat sebagai Stok Masuk,
                Penjualan, Penyesuaian (rusak, hilang, expired, koreksi opname), atau Pemulihan.
              </p>
            </div>

            {/* Fitur 4: Pembayaran Fleksibel & Pembulatan */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <DollarSign className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-100">Split Payment & Cash Rounding</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Mendukung split bayar (sebagian tunai, sebagian QRIS/transfer) serta pembulatan uang
                tunai ke nominal pecahan rupiah terdekat yang dapat diatur di pengaturan toko.
              </p>
            </div>

            {/* Fitur 5: Mode Resto & Antrean */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <Utensils className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-100">Dukungan Bisnis F&B / Resto</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Pilihan tipe pesanan Dine In & Takeaway, input nomor antrean manual oleh kasir, dan
                pencetakan tiket pesanan dapur (Kitchen Order Ticket) ke printer dapur terpisah.
              </p>
            </div>

            {/* Fitur 6: Promosi & Voucher */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <BadgePercent className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-100">Mesin Diskon & Promosi Berjangka</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Mulai dari diskon persen/nominal bebas (versi Free) hingga pengaturan voucher kode
                promo, syarat minimal belanja, dan periode berlaku promosi terpusat (versi Paid/Pro).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. Komparasi Paket Transparan ── */}
      <section id="paket" className="py-20 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Model Berlangganan Terbuka
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
              Pilih Paket Sesuai Skala Bisnis Anda
            </h2>
            <p className="text-sm text-slate-400">
              Tidak ada biaya tersembunyi. Mulai dari paket Free lokal selamanya hingga paket Pro
              dengan Web Dashboard analitik lengkap.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {/* Paket 1: Free (Local) */}
            <div className="glass-card p-6 sm:p-8 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="inline-block px-3 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 mb-4">
                  MODE LOKAL
                </div>
                <h3 className="text-xl font-bold text-slate-100">Paket FREE</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Untuk usaha mikro yang ingin kasir mandiri tanpa internet.
                </p>

                <div className="mt-6 mb-6">
                  <span className="text-3xl font-extrabold text-slate-100 font-mono">Rp 0</span>
                  <span className="text-xs text-slate-400 ml-1">/ selamanya</span>
                </div>

                <ul className="space-y-3 text-xs text-slate-300">
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Aplikasi POS Mobile 100% Offline</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Database SQLite lokal di perangkat</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Cetak Struk Thermal Bluetooth</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Backup & Restore database terenkripsi</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Diskon manual persen / rupiah</span>
                  </li>
                  <li className="flex items-center space-x-2 text-slate-500">
                    <X className="w-4 h-4 text-slate-600 shrink-0" />
                    <span>Tanpa sinkronisasi cloud</span>
                  </li>
                  <li className="flex items-center space-x-2 text-slate-500">
                    <X className="w-4 h-4 text-slate-600 shrink-0" />
                    <span>Tanpa akses Web Dashboard</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8">
                <Link
                  href="/register"
                  className="w-full block py-2.5 text-center text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition"
                >
                  Gunakan di Mobile
                </Link>
              </div>
            </div>

            {/* Paket 2: Paid (Cloud) */}
            <div className="glass-card p-6 sm:p-8 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="inline-block px-3 py-1 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 mb-4">
                  MODE CLOUD
                </div>
                <h3 className="text-xl font-bold text-slate-100">Paket PAID</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Untuk toko berkembang dengan multi-kasir dan sinkronisasi cloud.
                </p>

                <div className="mt-6 mb-6">
                  <span className="text-3xl font-extrabold text-slate-100 font-mono">Rp 49.000</span>
                  <span className="text-xs text-slate-400 ml-1">/ bulan</span>
                </div>

                <ul className="space-y-3 text-xs text-slate-300">
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Semua fitur paket Free</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Sinkronisasi Cloud otomatis</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Multi-kasir & Role Staf (Owner, Admin, Kasir)</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Sistem Promosi Voucher & Kupon</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Laporan penjualan cloud</span>
                  </li>
                  <li className="flex items-center space-x-2 text-slate-500">
                    <X className="w-4 h-4 text-slate-600 shrink-0" />
                    <span>Tanpa Web Dashboard browser</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8">
                <Link
                  href="/register"
                  className="w-full block py-2.5 text-center text-xs font-bold text-indigo-300 bg-indigo-500/20 hover:bg-indigo-500/30 rounded-xl border border-indigo-500/40 transition"
                >
                  Pilih Paket Paid
                </Link>
              </div>
            </div>

            {/* Paket 3: Pro (Web Dashboard) - Highlighted */}
            <div className="glass-card p-6 sm:p-8 rounded-2xl border-2 border-indigo-500/60 bg-[#121829] flex flex-col justify-between relative shadow-2xl shadow-indigo-500/10">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[10px] font-bold tracking-wider bg-linear-to-r from-amber-500 to-orange-500 text-slate-950 uppercase shadow-md">
                PALING LENGKAP & REKOMENDASI
              </div>

              <div>
                <div className="inline-block px-3 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 mb-4">
                  MODE PRO CLOUD + WEB
                </div>
                <h3 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
                  <span>Paket PRO</span>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Solusi manajemen lengkap dengan Web Dashboard & analitik finansial.
                </p>

                <div className="mt-6 mb-6">
                  <span className="text-3xl font-extrabold text-slate-100 font-mono">Rp 99.000</span>
                  <span className="text-xs text-slate-400 ml-1">/ bulan</span>
                </div>

                <ul className="space-y-3 text-xs text-slate-200">
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Semua fitur paket Free & Paid</span>
                  </li>
                  <li className="flex items-center space-x-2 font-semibold text-indigo-300">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>Akses Penuh Web Dashboard Pro</span>
                  </li>
                  <li className="flex items-center space-x-2 font-semibold text-indigo-300">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>Analitik Omzet, Laba-Rugi & HPP Real-Time</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Manajemen Katalog & Stok Terpusat</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Rekam Jejak Audit Log Lengkap (Security)</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Ekspor Laporan Finansial Toko</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8">
                <Link
                  href="/register"
                  className="w-full block py-3 text-center text-xs font-bold text-slate-950 bg-linear-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 rounded-xl shadow-lg shadow-amber-500/20 transition cursor-pointer"
                >
                  Daftar & Dapatkan Akses Pro Sekarang
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. Bottom Call to Action ── */}
      <section className="py-20 border-t border-slate-800/80 bg-gradient-to-b from-[#0b0f19] to-[#070a12] relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
          <div className="inline-flex p-3 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 mb-2">
            <Store className="w-8 h-8" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
            Siap Membawa Usaha Anda ke Level Berikutnya?
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
            Daftarkan toko Anda dalam 2 menit. Dapatkan kasir handal offline di genggaman dan
            pantauan bisnis menyeluruh di layar komputer Anda.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition flex items-center justify-center space-x-2"
            >
              <span>Daftarkan Toko Sekarang</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 transition"
            >
              <span>Sudah Punya Akun? Masuk</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── 7. Footer ── */}
      <footer className="border-t border-slate-800/80 py-12 bg-[#060910]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-400">
          <div className="flex items-center space-x-3">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-slate-200">General POS Hybrid</span>
              <p className="text-[10px] text-slate-500">Sistem Kasir & Web Dashboard UMKM Indonesia</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6">
            <a href="#keunggulan" className="hover:text-slate-200 transition">
              Keunggulan
            </a>
            <a href="#ekosistem" className="hover:text-slate-200 transition">
              Ekosistem 3 Pilar
            </a>
            <a href="#fitur" className="hover:text-slate-200 transition">
              Fitur Sistem
            </a>
            <a href="#paket" className="hover:text-slate-200 transition">
              Paket Langganan
            </a>
            <Link href="/login" className="hover:text-indigo-400 transition font-medium">
              Login Dashboard
            </Link>
            <Link href="/register" className="hover:text-indigo-400 transition font-medium">
              Register Toko
            </Link>
          </div>

          <div className="text-slate-500 text-[11px]">
            &copy; {new Date().getFullYear()} General POS. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
