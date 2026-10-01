"use client";

import Link from "next/link";
import { ShieldAlert, ArrowLeft, Store, Lock } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";

export default function UnauthorizedState({
  title,
  description,
  requiredPermission,
  backUrl,
}) {
  const { t } = useLanguage();
  const { user, tenant } = useAuth();

  const isFreePlan = tenant?.plan === "FREE";
  const defaultBackUrl = isFreePlan ? "/dashboard/settings" : "/dashboard";
  const targetUrl = backUrl || defaultBackUrl;

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-md p-8 sm:p-10 rounded-3xl bg-white/85 backdrop-blur-2xl border border-white/90 shadow-[0_12px_40px_rgba(0,0,0,0.08)] ring-1 ring-inset ring-white/70 text-center space-y-6">
        {/* Lock / Shield Icon Aura */}
        <div className="relative mx-auto w-20 h-20 rounded-3xl bg-linear-to-br from-rose-100 to-amber-100 border border-rose-200/80 text-rose-600 flex items-center justify-center shadow-md shadow-rose-500/10">
          <div className="absolute inset-0 rounded-3xl bg-rose-500/10 blur-xl -z-10" />
          <ShieldAlert className="w-10 h-10 text-rose-600" />
        </div>

        {/* Text Details */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-bold tracking-wide uppercase">
            <Lock className="w-3 h-3 text-rose-500" />
            <span>403 - Forbidden</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {title || t("common.accessDeniedTitle") || "Akses Dibatasi"}
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
            {description ||
              t("common.accessDeniedDesc") ||
              "Akun Anda tidak memiliki hak akses untuk membuka halaman ini. Silakan hubungi pemilik toko untuk penyesuaian peran."}
          </p>

          {requiredPermission && (
            <div className="pt-2">
              <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-mono text-[11px] font-semibold border border-slate-200">
                Izin dibutuhkan: {requiredPermission}
              </span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <Link
            href={targetUrl}
            className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-md shadow-slate-900/15 transition-all active:scale-98"
          >
            <ArrowLeft className="w-4 h-4 text-amber-400" />
            <span>{t("common.backToDashboard") || "Kembali ke Dashboard"}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
