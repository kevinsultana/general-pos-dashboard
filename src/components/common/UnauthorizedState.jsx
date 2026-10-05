"use client";

import Link from "next/link";
import { ShieldAlert, ArrowLeft, Lock } from "lucide-react";
import GlassCard from "../ui/GlassCard";

/**
 * UnauthorizedState - Tampilan 403 Forbidden ketika user tidak memiliki izin akses.
 *
 * Murni komponen presentasi berbasis props (decoupled dari AuthContext & LanguageContext)
 * untuk mencegah over-subscription dan unnecessary re-render. Mendukung Modern Clean Glassmorphism & dark mode.
 *
 * @param {object} props
 * @param {string} [props.title="Akses Dibatasi"] - Judul pesan error
 * @param {string} [props.description] - Deskripsi detail penyebab akses dibatasi
 * @param {string} [props.requiredPermission] - Nama permission yang dibutuhkan (opsional)
 * @param {string} [props.backUrl="/dashboard"] - URL tombol kembali
 * @param {string} [props.backText="Kembali ke Dashboard"] - Label tombol kembali
 */
export default function UnauthorizedState({
  title = "Akses Dibatasi",
  description = "Akun Anda tidak memiliki hak akses untuk membuka halaman ini. Silakan hubungi pemilik toko untuk penyesuaian peran.",
  requiredPermission,
  backUrl = "/dashboard",
  backText = "Kembali ke Dashboard",
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <GlassCard className="w-full max-w-md p-8 sm:p-10 text-center space-y-6">
        {/* Aura & Icon Shield */}
        <div className="relative mx-auto w-20 h-20 rounded-3xl bg-linear-to-br from-rose-100 to-amber-100 border border-rose-200/80 text-rose-600 flex items-center justify-center shadow-md shadow-rose-500/10">
          <div className="absolute inset-0 rounded-3xl bg-rose-500/10 blur-xl -z-10" />
          <ShieldAlert className="w-10 h-10 text-rose-600" />
        </div>

        {/* Detail Pesan */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-bold tracking-wide uppercase">
            <Lock className="w-3 h-3 text-rose-500" />
            <span>403 - Forbidden</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {title}
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
            {description}
          </p>

          {requiredPermission && (
            <div className="pt-2">
              <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-mono text-[11px] font-semibold border border-slate-200">
                Izin dibutuhkan: {requiredPermission}
              </span>
            </div>
          )}
        </div>

        {/* Tombol Aksi */}
        <div className="pt-2">
          <Link
            href={backUrl}
            className="inline-flex items-center justify-center gap-2 w-full min-h-12 py-3.5 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-md transition-all active:scale-98 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-amber-400" />
            <span>{backText}</span>
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}
