'use client';

import { memo } from 'react';
import {
  Zap,
  Wallet,
  ShieldCheck,
  Users,
  Network,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

function Features() {
  const { t } = useLanguage();

  const features = [
    {
      icon: Zap,
      title: t('features.f1_title'),
      subtitle: t('features.f1_sub'),
      description: t('features.f1_desc'),
      highlight: t('features.f1_tag'),
      badgeStyle: 'text-amber-700 bg-amber-50 border-amber-200',
      iconBg: 'bg-amber-50 text-amber-600 border-amber-200/80',
    },
    {
      icon: Wallet,
      title: t('features.f2_title'),
      subtitle: t('features.f2_sub'),
      description: t('features.f2_desc'),
      highlight: t('features.f2_tag'),
      badgeStyle: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200/80',
    },
    {
      icon: ShieldCheck,
      title: t('features.f3_title'),
      subtitle: t('features.f3_sub'),
      description: t('features.f3_desc'),
      highlight: t('features.f3_tag'),
      badgeStyle: 'text-amber-700 bg-amber-50 border-amber-200',
      iconBg: 'bg-amber-50 text-amber-600 border-amber-200/80',
    },
    {
      icon: Users,
      title: t('features.f4_title'),
      subtitle: t('features.f4_sub'),
      description: t('features.f4_desc'),
      highlight: t('features.f4_tag'),
      badgeStyle: 'text-indigo-700 bg-indigo-50 border-indigo-200',
      iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-200/80',
    },
    {
      icon: Network,
      title: t('features.f5_title'),
      subtitle: t('features.f5_sub'),
      description: t('features.f5_desc'),
      highlight: t('features.f5_tag'),
      badgeStyle: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200/80',
    },
  ];

  const metrics = [
    { value: t('features.m1_val'), label: t('features.m1_lbl'), note: t('features.m1_note') },
    { value: t('features.m2_val'), label: t('features.m2_lbl'), note: t('features.m2_note') },
    { value: t('features.m3_val'), label: t('features.m3_lbl'), note: t('features.m3_note') },
    { value: t('features.m4_val'), label: t('features.m4_lbl'), note: t('features.m4_note') },
  ];

  return (
    <section id="fitur" className="relative py-20 md:py-28 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/75 border border-white/90 text-amber-700 text-xs font-semibold shadow-xs mb-4">
            <Layers className="w-3.5 h-3.5 text-amber-600" />
            <span>{t('features.badge')}</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            {t('features.title')}
          </h2>
          <p className="mt-4 text-slate-600 text-sm sm:text-base leading-relaxed">
            {t('features.subtitle')}
          </p>
        </div>

        {/* Features Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className={`relative group rounded-3xl p-7 bg-white/65 hover:bg-white/90 backdrop-blur-2xl border border-white/80 hover:border-amber-200 shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] hover:shadow-[0_16px_40px_0_rgba(31,38,135,0.1)] ring-1 ring-inset ring-white/60 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between ${
                  idx === 0 ? 'md:col-span-2 lg:col-span-2' : ''
                }`}
              >
                <div>
                  {/* Top Icon & Badge */}
                  <div className="flex items-center justify-between mb-5">
                    <div
                      className={`w-12 h-12 rounded-2xl border flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform ${feat.iconBg}`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${feat.badgeStyle}`}
                    >
                      {feat.highlight}
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                    {feat.title}
                  </h3>
                  <p className="text-xs text-amber-700 font-semibold mt-1">{feat.subtitle}</p>
                  <p className="text-xs sm:text-sm text-slate-600 mt-3 leading-relaxed">
                    {feat.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 group-hover:text-slate-800 transition-colors">
                  <span className="font-medium">Omni POS Cloud System</span>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Social Proof & Value Metrics Bar */}
        <div
          id="solusi"
          className="mt-16 rounded-3xl bg-white/70 backdrop-blur-2xl border border-white/90 shadow-[0_10px_35px_rgba(31,38,135,0.06)] ring-1 ring-inset ring-white/60 p-8 sm:p-12"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-y md:divide-y-0 md:divide-x divide-slate-200/70">
            {metrics.map((metric, i) => (
              <div key={i} className={`text-center ${i > 0 ? 'pt-6 md:pt-0' : ''}`}>
                <p className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
                  {metric.value}
                </p>
                <p className="text-sm font-bold text-slate-800 mt-2">{metric.label}</p>
                <p className="text-xs text-slate-500 mt-1">{metric.note}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default memo(Features);
