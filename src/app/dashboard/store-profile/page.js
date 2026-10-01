'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Store,
  Globe,
  Calendar,
  Sparkles,
  Smartphone,
  Download,
  ShieldCheck,
  Copy,
  Check,
  ArrowRight,
  Zap,
  Info,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../contexts/AuthContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { showAlertNotice } from '../../../lib/alerts';

export default function StoreProfilePage() {
  const { tenant, user } = useAuth();
  const { t, language } = useLanguage();
  const [copied, setCopied] = useState(false);

  const isFreePlan = tenant?.plan === 'FREE';
  const publicStoreUrl = `omnipos.app/store/${tenant?.slug || 'toko'}`;

  const handleCopyUrl = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(`https://${publicStoreUrl}`);
      setCopied(true);
      toast.success(
        language === 'id' ? 'URL toko disalin ke papan klip!' : 'Store URL copied to clipboard!'
      );
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadApk = () => {
    showAlertNotice({
      title: t('storeProfile.downloadApkBtn'),
      text: t('storeProfile.downloadAlert'),
      icon: 'info',
      confirmButtonText: t('common.faham') || 'Mengerti',
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) {
      return language === 'id' ? '1 Januari 2026' : 'January 1, 2026';
    }
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const getPlanBadge = (plan) => {
    switch (plan) {
      case 'PRO':
        return {
          label: 'Paket PRO',
          classes: 'bg-purple-100 text-purple-800 border-purple-300 font-extrabold',
          dot: 'bg-purple-500',
        };
      case 'PLUS':
        return {
          label: 'Paket PLUS',
          classes: 'bg-amber-100 text-amber-800 border-amber-300 font-extrabold',
          dot: 'bg-amber-500',
        };
      default:
        return {
          label: 'Paket FREE',
          classes: 'bg-slate-100 text-slate-700 border-slate-300 font-bold',
          dot: 'bg-amber-500',
        };
    }
  };

  const planBadge = getPlanBadge(tenant?.plan);

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* 1. Header Section */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-400/40 text-amber-800 text-xs font-extrabold tracking-wide uppercase shadow-2xs backdrop-blur-md">
          <Store className="w-3.5 h-3.5 text-amber-600" />
          <span>{t('storeProfile.badge')}</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          {t('storeProfile.title')}
        </h1>

        <p className="text-sm text-slate-600 leading-relaxed font-normal">
          {t('storeProfile.subtitle')}
        </p>
      </div>

      {/* 2. Main Store Information Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] ring-1 ring-inset ring-white/70 space-y-6">
        {/* Brand & Plan Status Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-amber-400 to-amber-600 p-0.5 shadow-md shadow-amber-500/20 shrink-0">
              <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center text-amber-600 font-black text-xl">
                {(tenant?.name || 'T').charAt(0).toUpperCase()}
              </div>
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 leading-tight">
                {tenant?.name || 'Toko Omni POS'}
              </h2>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                <span>Pemilik:</span>
                <span className="font-semibold text-slate-700">{user?.name || '-'}</span>
                <span>({user?.email || '-'})</span>
              </p>
            </div>
          </div>

          {/* Active Plan Pill */}
          <div
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs shadow-2xs self-start sm:self-auto ${planBadge.classes}`}
          >
            <span className={`w-2 h-2 rounded-full ${planBadge.dot} animate-pulse`} />
            <span>{planBadge.label}</span>
          </div>
        </div>

        {/* Store Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
          {/* Item 1: Nama Toko */}
          <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/60 space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {t('storeProfile.storeName')}
            </p>
            <p className="text-sm font-extrabold text-slate-900">{tenant?.name || '-'}</p>
          </div>

          {/* Item 2: URL Publik Toko */}
          <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/60 space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {t('storeProfile.storeSlug')}
            </p>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs sm:text-sm font-mono font-bold text-amber-700 truncate">
                {publicStoreUrl}
              </span>
              <button
                type="button"
                onClick={handleCopyUrl}
                title="Salin URL"
                className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200 shadow-2xs transition-colors shrink-0"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Item 3: Tanggal Bergabung */}
          <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/60 space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {t('storeProfile.joinedDate')}
            </p>
            <div className="flex items-center gap-2 text-slate-800 font-semibold text-xs sm:text-sm">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>{formatDate(tenant?.createdAt)}</span>
            </div>
          </div>

          {/* Item 4: Status Layanan */}
          <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/60 space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {t('storeProfile.planStatus')}
            </p>
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs sm:text-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{t('storeProfile.activeStatus')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Mobile POS Application Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-linear-to-br from-amber-500/10 via-white/80 to-amber-500/5 backdrop-blur-2xl border border-amber-300/60 shadow-lg shadow-amber-500/5 ring-1 ring-inset ring-amber-300/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/25">
            <Smartphone className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-xl">
            <h3 className="text-base font-black text-slate-900">
              {t('storeProfile.mobileCardTitle')}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {t('storeProfile.mobileCardDesc')}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDownloadApk}
          className="py-3 px-5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-md shadow-slate-900/15 flex items-center justify-center gap-2 transition-all active:scale-98 shrink-0 cursor-pointer"
        >
          <Download className="w-4 h-4 text-amber-400" />
          <span>{t('storeProfile.downloadApkBtn')}</span>
        </button>
      </div>

      {/* 4. Upgrade Call-to-Action Card */}
      {isFreePlan && (
        <div className="p-6 sm:p-8 rounded-3xl bg-linear-to-r from-slate-900 via-slate-850 to-slate-900 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Subtle Glow Aura */}
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-amber-500/10 blur-[80px] pointer-events-none" />

          <div className="relative z-10 space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-300 font-extrabold text-[10px] tracking-wide uppercase">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Buka Akses Penuh</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white">
              {t('storeProfile.upgradePromptTitle')}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed font-normal">
              {t('storeProfile.upgradePromptDesc')}
            </p>
          </div>

          <Link
            href="/dashboard/upgrade"
            className="relative z-10 py-3.5 px-6 rounded-2xl bg-linear-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all active:scale-98 shrink-0"
          >
            <span>{t('storeProfile.upgradeBtn')}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
