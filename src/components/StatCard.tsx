'use client';

import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'indigo' | 'emerald' | 'amber' | 'purple' | 'rose' | 'cyan';
  trend?: {
    value: string;
    isPositive: boolean;
  };
  badge?: string;
}

const COLOR_MAP = {
  indigo: {
    bg: 'bg-indigo-500/15',
    border: 'border-indigo-500/30',
    text: 'text-indigo-400',
    gradient: 'from-indigo-500/10 via-transparent to-transparent',
    glow: 'hover:border-indigo-500/40 hover:shadow-indigo-500/10',
  },
  emerald: {
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    gradient: 'from-emerald-500/10 via-transparent to-transparent',
    glow: 'hover:border-emerald-500/40 hover:shadow-emerald-500/10',
  },
  amber: {
    bg: 'bg-amber-500/15',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    gradient: 'from-amber-500/10 via-transparent to-transparent',
    glow: 'hover:border-amber-500/40 hover:shadow-amber-500/10',
  },
  purple: {
    bg: 'bg-purple-500/15',
    border: 'border-purple-500/30',
    text: 'text-purple-400',
    gradient: 'from-purple-500/10 via-transparent to-transparent',
    glow: 'hover:border-purple-500/40 hover:shadow-purple-500/10',
  },
  rose: {
    bg: 'bg-rose-500/15',
    border: 'border-rose-500/30',
    text: 'text-rose-400',
    gradient: 'from-rose-500/10 via-transparent to-transparent',
    glow: 'hover:border-rose-500/40 hover:shadow-rose-500/10',
  },
  cyan: {
    bg: 'bg-cyan-500/15',
    border: 'border-cyan-500/30',
    text: 'text-cyan-400',
    gradient: 'from-cyan-500/10 via-transparent to-transparent',
    glow: 'hover:border-cyan-500/40 hover:shadow-cyan-500/10',
  },
};

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'indigo',
  trend,
  badge,
}: StatCardProps) {
  const c = COLOR_MAP[color];

  return (
    <div
      className={`relative overflow-hidden glass-card p-5 transition-all duration-300 ${c.glow} hover:-translate-y-0.5 hover:shadow-xl`}
    >
      {/* Subtle background ambient gradient */}
      <div
        className={`absolute inset-0 bg-linear-to-br ${c.gradient} pointer-events-none opacity-50`}
      />

      <div className="relative z-10 flex items-start justify-between">
        <div>
          <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
            {title}
          </span>
          {badge && (
            <span className="ml-2 px-1.5 py-0.5 text-[9px] font-bold rounded bg-slate-800 text-slate-300 border border-slate-700">
              {badge}
            </span>
          )}
        </div>
        <div
          className={`p-2.5 rounded-xl ${c.bg} ${c.text} border ${c.border} shadow-sm shadow-black/20`}
        >
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="relative z-10 mt-3">
        <p className="text-2xl font-extrabold text-slate-100 tracking-tight font-mono">
          {value}
        </p>

        <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-800/40">
          {subtitle && (
            <p className="text-[11px] text-slate-400 font-medium truncate">{subtitle}</p>
          )}

          {trend && (
            <div
              className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${trend.isPositive
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/25'
                }`}
            >
              {trend.isPositive ? (
                <TrendingUp className="w-2.5 h-2.5" />
              ) : (
                <TrendingDown className="w-2.5 h-2.5" />
              )}
              <span>{trend.value}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
