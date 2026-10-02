"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  QrCode,
  Printer,
  Copy,
  ExternalLink,
  Layers,
  Store,
  Check,
  Palette,
  FileText,
  Eye,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../../contexts/AuthContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import QrCodeSvg from "../../../components/common/QrCodeSvg";
import UnauthorizedState from "../../../components/common/UnauthorizedState";

// ─── Pilihan Tema Standee ────────────────────────────────────────────────────────
const THEMES = [
  {
    id: "amber",
    name: "Amber Signature",
    cardBg: "bg-white",
    border: "border-amber-500",
    headerBg: "bg-linear-to-r from-amber-500 to-amber-600 text-white",
    qrBg: "#ffffff",
    qrFg: "#0f172a",
    accentText: "text-amber-600",
    badgeBg: "bg-amber-50 text-amber-800 border-amber-200",
  },
  {
    id: "slate",
    name: "Modern Slate",
    cardBg: "bg-white",
    border: "border-slate-900",
    headerBg: "bg-slate-900 text-white",
    qrBg: "#ffffff",
    qrFg: "#0f172a",
    accentText: "text-slate-900",
    badgeBg: "bg-slate-100 text-slate-800 border-slate-300",
  },
  {
    id: "emerald",
    name: "Fresh Cafe",
    cardBg: "bg-white",
    border: "border-emerald-500",
    headerBg: "bg-linear-to-r from-emerald-600 to-teal-600 text-white",
    qrBg: "#ffffff",
    qrFg: "#064e3b",
    accentText: "text-emerald-700",
    badgeBg: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  {
    id: "mono",
    name: "Hemat Tinta (B&W)",
    cardBg: "bg-white",
    border: "border-slate-300",
    headerBg: "bg-white text-slate-900 border-b border-slate-200",
    qrBg: "#ffffff",
    qrFg: "#000000",
    accentText: "text-slate-800",
    badgeBg: "bg-slate-50 text-slate-700 border-slate-200",
  },
];

export default function QrMenuPage() {
  const { user, tenant, activeBranch, activeBranchId, branches } = useAuth();
  const { t } = useLanguage();

  // Pengaturan Teks & Desain
  const [selectedThemeId, setSelectedThemeId] = useState("amber");
  const [title, setTitle] = useState("SCAN UNTUK PESAN");
  const [subtitle, setSubtitle] = useState(
    "Lihat menu & pesan langsung dari smartphone Anda",
  );
  const [footerNote, setFooterNote] = useState(
    "Tunjukkan barcode pesanan ke kasir saat membayar",
  );

  const [hasCopied, setHasCopied] = useState(false);

  const selectedTheme =
    THEMES.find((th) => th.id === selectedThemeId) || THEMES[0];

  // Base URL domain saat ini
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const tenantSlug = tenant?.slug || "store";

  // Ambil ID dan nama cabang aktif secara otomatis dari AuthContext (sinkron Navbar)
  const currentBranchId = activeBranchId || activeBranch?.id || "";
  const currentBranchName =
    activeBranch?.name ||
    branches?.find((b) => b.id === currentBranchId)?.name ||
    tenant?.name ||
    "Toko Kami";

  // URL Target QR Code (mengikuti cabang aktif navbar)
  const getOrderUrl = () => {
    let url = `${origin}/order/${tenantSlug}`;
    if (currentBranchId) {
      url += `?branch=${currentBranchId}`;
    }
    return url;
  };

  const previewUrl = useMemo(
    () => getOrderUrl(),
    [origin, tenantSlug, currentBranchId],
  );

  // Handle Salin URL
  const handleCopyLink = () => {
    navigator.clipboard.writeText(previewUrl);
    setHasCopied(true);
    toast.success("Link menu berhasil disalin ke papan klip!");
    setTimeout(() => setHasCopied(false), 2000);
  };

  // Handle Cetak Standee
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Header Halaman (Disembunyikan saat Print) */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-amber-500 to-amber-600 p-0.5 shadow-md shadow-amber-500/20">
              <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center text-amber-600">
                <QrCode className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                Desainer & Cetak QR Menu Meja
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Kustomisasi kartu standee meja toko Anda dan cetak untuk
                pemesanan mandiri pelanggan
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm transition-all shadow-xs active:scale-98"
          >
            {hasCopied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Tersalin</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-500" />
                <span>Salin Link</span>
              </>
            )}
          </button>

          <Link
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm transition-all shadow-xs active:scale-98"
          >
            <ExternalLink className="w-4 h-4 text-slate-500" />
            <span>Tes Menu</span>
          </Link>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs sm:text-sm shadow-md transition-all active:scale-98"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Standee Meja</span>
          </button>
        </div>
      </div>

      {/* 2. Grid Pengaturan (Kiri) & Live Preview (Kanan) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:hidden">
        {/* Kolom Kiri: Panel Kustomisasi (5 Kolom) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Card 1: Pilihan Tema Visual */}
          <div className="p-5 rounded-3xl bg-white/80 backdrop-blur-xl border border-white/90 shadow-xs space-y-3.5">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Palette className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                Pilih Gaya Tema Standee
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {THEMES.map((theme) => {
                const isSelected = selectedThemeId === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => setSelectedThemeId(theme.id)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? "border-amber-500 bg-amber-50/50 shadow-xs ring-2 ring-amber-500/20"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <p className="text-xs font-black text-slate-900">
                      {theme.name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="w-4 h-4 rounded-full border border-black/10 shadow-2xs inline-block bg-white" />
                      <span
                        className={`w-4 h-4 rounded-full border border-black/10 shadow-2xs inline-block ${
                          theme.id === "amber"
                            ? "bg-amber-500"
                            : theme.id === "slate"
                              ? "bg-slate-900"
                              : theme.id === "emerald"
                                ? "bg-emerald-600"
                                : "bg-slate-400"
                        }`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card 2: Informasi Cabang Aktif (Sinkron Navbar) */}
          <div className="p-5 rounded-3xl bg-white/80 backdrop-blur-xl border border-white/90 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Store className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                Cabang Toko Terpilih
              </h3>
            </div>
            <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/70 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-900">{currentBranchName}</p>
                  <p className="text-[11px] text-slate-500">
                    Otomatis mengikuti cabang aktif di navbar
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-[10px] font-black text-emerald-800 border border-emerald-200 uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Aktif</span>
              </span>
            </div>
          </div>

          {/* Card 3: Edit Teks Standee */}
          <div className="p-5 rounded-3xl bg-white/80 backdrop-blur-xl border border-white/90 shadow-xs space-y-3.5">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <FileText className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                Kustomisasi Tulisan Standee
              </h3>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase">
                Judul Utama
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="SCAN UNTUK PESAN"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-xs text-slate-900 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase">
                Subjudul / Ajakan
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Lihat menu & pesan langsung dari meja Anda"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-xs text-slate-900 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase">
                Catatan Kaki Kasir
              </label>
              <input
                type="text"
                value={footerNote}
                onChange={(e) => setFooterNote(e.target.value)}
                placeholder="Tunjukkan barcode pesanan ke kasir saat membayar"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-xs text-slate-900 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Live Preview Standee Meja (7 Kolom) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2 text-xs font-black text-slate-600 uppercase tracking-wider">
              <Eye className="w-4 h-4 text-amber-500" />
              <span>
                Pratinjau Hasil Cetak Standee (Ukuran Asli Kartu Meja)
              </span>
            </div>
            <span className="text-[11px] font-bold text-slate-400">
              Format Siap Potong & Lipat
            </span>
          </div>

          {/* Wrapper Standee Mockup */}
          <div className="flex justify-center p-6 sm:p-10 rounded-3xl bg-slate-100/70 border border-slate-200/70">
            <div
              className={`w-full max-w-85 rounded-3xl shadow-xl border-4 ${selectedTheme.cardBg} ${selectedTheme.border} overflow-hidden transition-all duration-200 text-center flex flex-col justify-between`}
            >
              {/* Header Kartu */}
              <div className={`p-4 sm:p-5 ${selectedTheme.headerBg}`}>
                <div className="flex items-center justify-center gap-2 mb-1 opacity-90">
                  <Layers className="w-4 h-4" />
                  <span className="text-xs font-extrabold uppercase tracking-widest">
                    {currentBranchName}
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-black tracking-tight leading-tight">
                  {title}
                </h2>
                <p className="text-[11px] opacity-80 mt-0.5 leading-snug">
                  {subtitle}
                </p>
              </div>

              {/* Badan Kartu (QR Code) */}
              <div className="p-6 flex flex-col items-center justify-center space-y-4">
                {/* Vektor SVG QR Code */}
                <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-md">
                  <QrCodeSvg
                    value={previewUrl}
                    size={170}
                    fgColor={selectedTheme.qrFg}
                    bgColor={selectedTheme.qrBg}
                  />
                </div>

                {/* 3 Langkah Cepat */}
                <div className="w-full grid grid-cols-3 gap-1 pt-2 border-t border-slate-100 text-[10px] text-slate-500">
                  <div className="space-y-0.5">
                    <span className="font-extrabold text-slate-800 block text-xs">
                      1. Scan
                    </span>
                    <span>Buka kamera HP</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="font-extrabold text-slate-800 block text-xs">
                      2. Pesan
                    </span>
                    <span>Pilih menu favorit</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="font-extrabold text-slate-800 block text-xs">
                      3. Kasir
                    </span>
                    <span>Bayar pesanan</span>
                  </div>
                </div>
              </div>

              {/* Footer Kartu */}
              <div className="p-3 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 font-medium">
                <p className="font-bold text-slate-600 mb-0.5">{footerNote}</p>
                <p className="text-[9px] text-slate-400">
                  Powered by OmniPOS Self-Order System
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. TAMPILAN KHUSUS CETAK (PRINT-ONLY) */}
      {/* Bagian ini otomatis aktif saat tombol "Cetak" ditekan atau Ctrl+P */}
      <div className="hidden print:grid print:grid-cols-2 print:gap-6 print:p-4 bg-white text-slate-900">
        {[1, 2].map((cardIdx) => (
          <div
            key={cardIdx}
            className={`w-full max-w-85 mx-auto rounded-3xl border-4 ${selectedTheme.border} overflow-hidden text-center flex flex-col justify-between break-inside-avoid page-break-inside-avoid my-4`}
            style={{ minHeight: "460px" }}
          >
            {/* Header Kartu */}
            <div className={`p-4 ${selectedTheme.headerBg}`}>
              <div className="flex items-center justify-center gap-1.5 mb-1 opacity-90">
                <span className="text-xs font-extrabold uppercase tracking-widest">
                  {currentBranchName}
                </span>
              </div>
              <h2 className="text-base font-black tracking-tight leading-tight">
                {title}
              </h2>
              <p className="text-[10px] opacity-80 mt-0.5 leading-snug">
                {subtitle}
              </p>
            </div>

            {/* Badan Kartu */}
            <div className="p-4 flex flex-col items-center justify-center space-y-3 flex-1">
              <div className="p-3 rounded-2xl bg-white border border-slate-200">
                <QrCodeSvg
                  value={previewUrl}
                  size={180}
                  fgColor={selectedTheme.qrFg}
                  bgColor={selectedTheme.qrBg}
                />
              </div>

              <div className="w-full grid grid-cols-3 gap-1 pt-2 border-t border-slate-100 text-[9px] text-slate-600">
                <div>
                  <span className="font-extrabold text-slate-900 block text-[11px]">
                    1. Scan
                  </span>
                  <span>Buka kamera HP</span>
                </div>
                <div>
                  <span className="font-extrabold text-slate-900 block text-[11px]">
                    2. Pesan
                  </span>
                  <span>Pilih menu favorit</span>
                </div>
                <div>
                  <span className="font-extrabold text-slate-900 block text-[11px]">
                    3. Kasir
                  </span>
                  <span>Bayar pesanan</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-[9px] text-slate-500">
              <p className="font-bold text-slate-700">{footerNote}</p>
              <p className="text-[8px] text-slate-400 mt-0.5">
                OmniPOS Self-Order
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
