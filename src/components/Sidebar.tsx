'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Boxes,
  ReceiptText,
  BadgePercent,
  Users,
  UserCheck,
  BarChart3,
  Crown,
  Settings,
  LogOut,
  Store as StoreIcon,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavGroup {
  groupTitle: string;
  items: Array<{
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }>;
}

const NAV_GROUPS: NavGroup[] = [
  {
    groupTitle: 'OPERASIONAL',
    items: [
      { label: 'Ringkasan KPI', href: '/', icon: LayoutDashboard },
      { label: 'Transaksi Kasir', href: '/transactions', icon: ReceiptText },
      { label: 'Stok & Inventori', href: '/inventory', icon: Boxes },
    ],
  },
  {
    groupTitle: 'KATALOG & CRM',
    items: [
      { label: 'Produk & Varian', href: '/products', icon: Package },
      { label: 'Data Pelanggan', href: '/customers', icon: UserCheck },
      { label: 'Voucher & Promosi', href: '/promotions', icon: BadgePercent },
    ],
  },
  {
    groupTitle: 'ADMINISTRASI & SISTEM',
    items: [
      { label: 'Laporan Finansial', href: '/reports', icon: BarChart3, badge: 'PRO' },
      { label: 'Pengaturan Toko', href: '/settings', icon: Settings },
      { label: 'Staf & Hak Akses', href: '/users', icon: Users },
      { label: 'Paket Langganan', href: '/subscription', icon: Crown },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, store, logout } = useAuth();
  const plan = store?.subscriptionPlan || 'PRO';

  return (
    <aside className="w-64 bg-[#0d121f] border-r border-slate-800/80 flex flex-col h-screen sticky top-0 z-20 shrink-0">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800/70 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <StoreIcon className="w-5 h-5 text-white" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#0d121f]" />
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-slate-100 text-sm tracking-tight leading-tight truncate">
              {store?.name || 'General POS'}
            </h1>
            <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-indigo-400" />
              <span>Pro Cloud Hub</span>
            </span>
          </div>
        </div>
        <span className="px-2 py-0.5 text-[9px] font-bold tracking-wider rounded-md bg-linear-to-r from-amber-500/15 to-orange-500/15 text-amber-400 border border-amber-500/30">
          {plan}
        </span>
      </div>

      {/* Grouped Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {NAV_GROUPS.map((group) => (
          <div key={group.groupTitle} className="space-y-1">
            <div className="px-3 pb-1 text-[10px] font-bold text-slate-500 tracking-wider">
              {group.groupTitle}
            </div>
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${isActive
                      ? 'bg-linear-to-r from-indigo-600/20 to-purple-600/10 text-indigo-300 border border-indigo-500/30 shadow-sm font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                >
                  <div className="flex items-center space-x-2.5">
                    {isActive && (
                      <span className="absolute left-0 w-1 h-5 bg-indigo-500 rounded-r-full shadow-sm shadow-indigo-500" />
                    )}
                    <Icon
                      className={`w-4 h-4 transition-colors ${isActive
                          ? 'text-indigo-400'
                          : 'text-slate-500 group-hover:text-slate-300'
                        }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User Footer */}
      <div className="p-3 border-t border-slate-800/70 bg-[#090d16]/80">
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800/60">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="relative">
              <div className="w-8 h-8 rounded-lg bg-linear-to-br from-slate-700 to-slate-800 border border-slate-600 flex items-center justify-center text-xs font-bold text-indigo-300">
                {user?.displayName?.charAt(0) || 'U'}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full border border-slate-900" />
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-200 truncate leading-tight">
                {user?.displayName || 'Kasir Aktif'}
              </p>
              <p className="text-[10px] text-slate-400 capitalize truncate">
                {user?.role?.name || 'Staf'}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition shrink-0"
            title="Keluar dari akun"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
