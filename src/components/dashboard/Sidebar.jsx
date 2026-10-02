'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Layers,
  LayoutDashboard,
  Store,
  Receipt,
  Clock,
  Package,
  Users,
  UserCheck,
  QrCode,
  GitBranch,
  Settings,
  LogOut,
  Lock,
  Sparkles,
  Zap,
  ArrowRight,
  Shield,
  Smartphone,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { confirmLogout, showAlertNotice } from '../../lib/alerts';

export default function Sidebar({ onCloseMobile }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, tenant, logout, hasPermission } = useAuth();
  const { t } = useLanguage();

  const isFreePlan = tenant?.plan === 'FREE';

  const handleLogout = async () => {
    const result = await confirmLogout({
      title: t('dashboard.logoutPromptTitle'),
      text: t('dashboard.logoutPromptText'),
      confirmButtonText: t('dashboard.logoutConfirm'),
      cancelButtonText: t('dashboard.logoutCancel'),
    });
    if (result.isConfirmed) {
      logout();
      toast.success(t('dashboard.logoutSuccess'));
      router.push('/login');
    }
  };

  const handleRestrictedClick = (title, minPlan) => {
    showAlertNotice({
      title: t('dashboard.sidebar.restrictedNoticeTitle', { plan: minPlan }),
      text: t('dashboard.sidebar.restrictedNoticeText', {
        title,
        plan: minPlan,
      }),
      icon: 'info',
      confirmButtonText: t('common.tutup') || 'Tutup',
    });
  };

  const handlePlaceholderClick = (e, title, href) => {
    const activeRoutes = [
      '/dashboard',
      '/dashboard/upgrade',
      '/dashboard/settings',
      '/dashboard/users',
      '/dashboard/branches',
      '/dashboard/products',
      '/dashboard/customers',
      '/dashboard/qr-menu',
      '/dashboard/pos',
      '/dashboard/shifts',
      '/dashboard/transactions',
    ];

    if (!activeRoutes.includes(href)) {
      e.preventDefault();
      toast(t('dashboard.sidebar.moduleSyncNotice', { title }), {
        icon: '⚡',
      });
      if (onCloseMobile) onCloseMobile();
    }
  };

  // Navigasi Khusus untuk Pengguna Paket FREE
  const freeNavSections = [
    {
      group: t('dashboard.sidebar.groups.freeAccount'),
      items: [
        {
          name: t('dashboard.sidebar.items.storeSettings') || t('dashboard.sidebar.items.storeProfile'),
          href: '/dashboard/settings',
          icon: Settings,
          badge: t('common.active'),
          badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          isLocked: false,
          permission: 'settings:view',
        },
        {
          name: t('dashboard.sidebar.items.upgrade'),
          href: '/dashboard/upgrade',
          icon: Sparkles,
          badge: 'PRO / PLUS',
          badgeColor: 'bg-amber-100 text-amber-800 border-amber-300 font-extrabold shadow-xs',
          isLocked: false,
          permission: 'subscriptions:view',
        },
      ],
    },
    {
      group: t('dashboard.sidebar.groups.operations'),
      items: [
        {
          name: t('dashboard.sidebar.items.pos'),
          href: '/dashboard/upgrade',
          icon: Store,
          badge: 'PLUS',
          badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
          isLocked: true,
          minPlan: 'PLUS',
          permission: 'pos:access',
        },
        {
          name: t('dashboard.sidebar.items.transactions'),
          href: '/dashboard/upgrade',
          icon: Receipt,
          badge: 'PLUS',
          badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
          isLocked: true,
          minPlan: 'PLUS',
          permission: 'reports:view',
        },
        {
          name: t('dashboard.sidebar.items.shifts'),
          href: '/dashboard/upgrade',
          icon: Clock,
          badge: 'PLUS',
          badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
          isLocked: true,
          minPlan: 'PLUS',
          permission: 'pos:shift',
        },
        {
          name: t('dashboard.sidebar.items.customers'),
          href: '/dashboard/upgrade',
          icon: UserCheck,
          badge: 'PLUS',
          badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
          isLocked: true,
          minPlan: 'PLUS',
          permission: 'customers:view',
        },
        {
          name: t('dashboard.sidebar.items.qrMenu'),
          href: '/dashboard/upgrade',
          icon: QrCode,
          badge: 'PLUS',
          badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
          isLocked: true,
          minPlan: 'PLUS',
          permission: 'settings:view',
        },
        {
          name: t('dashboard.sidebar.items.products'),
          href: '/dashboard/upgrade',
          icon: Package,
          badge: 'PLUS',
          badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
          isLocked: true,
          minPlan: 'PLUS',
          permission: 'inventory:view',
        },
        {
          name: t('dashboard.sidebar.items.users'),
          href: '/dashboard/upgrade',
          icon: Users,
          badge: 'PLUS',
          badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
          isLocked: true,
          minPlan: 'PLUS',
          permission: ['users:view', 'roles:view'],
        },
        {
          name: t('dashboard.sidebar.items.branches'),
          href: '/dashboard/upgrade',
          icon: GitBranch,
          badge: 'PRO',
          badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
          isLocked: true,
          minPlan: 'PRO',
          permission: 'branches:view',
        },
      ],
    },
  ];

  // Navigasi Standar untuk Pengguna Paket Berbayar (PLUS & PRO)
  const paidNavSections = [
    {
      group: t('dashboard.sidebar.groups.main'),
      items: [
        {
          name: t('dashboard.sidebar.items.dashboard'),
          href: '/dashboard',
          icon: LayoutDashboard,
          badge: null,
          isLocked: false,
        },
        {
          name: t('dashboard.sidebar.items.pos'),
          href: '/dashboard/pos',
          icon: Store,
          badge: t('dashboard.sidebar.activeBadge'),
          badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          isLocked: false,
          permission: 'pos:access',
        },
      ],
    },
    {
      group: t('dashboard.sidebar.groups.operations'),
      items: [
        {
          name: t('dashboard.sidebar.items.transactions'),
          href: '/dashboard/transactions',
          icon: Receipt,
          badge: null,
          isLocked: false,
          permission: 'reports:view',
        },
        {
          name: t('dashboard.sidebar.items.shifts'),
          href: '/dashboard/shifts',
          icon: Clock,
          badge: null,
          isLocked: false,
          permission: 'pos:shift',
        },
        {
          name: t('dashboard.sidebar.items.customers'),
          href: '/dashboard/customers',
          icon: UserCheck,
          badge: null,
          isLocked: false,
          permission: 'customers:view',
        },
        {
          name: t('dashboard.sidebar.items.qrMenu'),
          href: '/dashboard/qr-menu',
          icon: QrCode,
          badge: null,
          isLocked: false,
          permission: 'settings:view',
        },
      ],
    },
    {
      group: t('dashboard.sidebar.groups.inventory'),
      items: [
        {
          name: t('dashboard.sidebar.items.products'),
          href: '/dashboard/products',
          icon: Package,
          badge: null,
          isLocked: false,
          permission: 'inventory:view',
        },
      ],
    },
    {
      group: t('dashboard.sidebar.groups.admin'),
      items: [
        {
          name: t('dashboard.sidebar.items.users'),
          href: '/dashboard/users',
          icon: Users,
          badge: null,
          isLocked: false,
          permission: ['users:view', 'roles:view'],
        },
        {
          name: t('dashboard.sidebar.items.branches'),
          href: '/dashboard/branches',
          icon: GitBranch,
          badge: 'PRO',
          badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
          isLocked: false,
          permission: 'branches:view',
        },
        {
          name: t('dashboard.sidebar.items.storeSettings') || t('dashboard.sidebar.items.storeProfile'),
          href: '/dashboard/settings',
          icon: Settings,
          badge: null,
          isLocked: false,
          permission: 'settings:view',
        },
        {
          name: t('dashboard.sidebar.items.upgrade'),
          href: '/dashboard/upgrade',
          icon: Sparkles,
          badge: tenant?.plan === 'PRO' ? null : 'PRO',
          badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
          isLocked: false,
          permission: 'subscriptions:view',
        },
      ],
    },
  ];

  // Filter menu berdasarkan hak akses RBAC (hasPermission) dan Owner bypass
  const canAccessItem = (item) => {
    if (!item.permission) return true;
    if (user?.isOwner) return true;
    if (Array.isArray(item.permission)) {
      return item.permission.some((p) => hasPermission(p));
    }
    return hasPermission(item.permission);
  };

  const activeSections = (isFreePlan ? freeNavSections : paidNavSections)
    .map((section) => ({
      ...section,
      items: section.items.filter(canAccessItem),
    }))
    .filter((section) => section.items.length > 0);

  const brandHref = isFreePlan ? '/dashboard/settings' : '/dashboard';

  return (
    <aside className="w-full h-full flex flex-col justify-between p-4 sm:p-5 select-none text-slate-800">
      {/* 1. Header Sidebar: Brand & Tenant Identity */}
      <div>
        <div className="pb-4 border-b border-slate-200/60">
          <div className="flex items-center justify-between">
            <Link
              href={brandHref}
              onClick={onCloseMobile}
              className="flex items-center gap-2.5 group"
            >
              <div className="w-9 h-9 rounded-2xl bg-linear-to-br from-amber-500 to-amber-600 p-0.5 shadow-sm shadow-amber-500/25 group-hover:scale-105 transition-transform shrink-0">
                <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
                  <Layers className="w-4 h-4 text-amber-600" />
                </div>
              </div>
              <div className="leading-tight truncate">
                <p className="text-base font-extrabold tracking-tight text-slate-900 truncate">
                  Omni<span className="text-amber-600">POS</span>
                </p>
                <p className="text-[11px] font-semibold text-slate-500 truncate max-w-36">
                  {tenant?.name || t('dashboard.sidebar.brandSubtitle')}
                </p>
              </div>
            </Link>

            {/* Cloud Sync Status / Plan Status Pill */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold shadow-2xs ${
                isFreePlan
                  ? 'bg-amber-50/80 border-amber-200/70 text-amber-700'
                  : 'bg-emerald-50/80 border-emerald-200/70 text-emerald-700'
              }`}
              title={isFreePlan ? 'Paket FREE: Mobile POS Offline' : t('common.cloudSyncActive')}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isFreePlan ? 'bg-amber-500' : 'bg-emerald-500'
                } animate-pulse`}
              />
              <span className="hidden sm:inline">
                {isFreePlan ? 'FREE' : t('common.online')}
              </span>
            </div>
          </div>

          {/* Subdomain pill */}
          <div className="mt-3 flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100/70 border border-slate-200/60 text-[10px] text-slate-500 font-mono">
            <span className="text-slate-400 select-none">id:</span>
            <span className="truncate font-semibold text-slate-700">{tenant?.slug || 'omnipos'}</span>
          </div>
        </div>

        {/* Banner Khusus Paket FREE */}
        {isFreePlan && (
          <div className="mt-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-400/40 backdrop-blur-xl shadow-xs ring-1 ring-inset ring-amber-400/20 space-y-2">
            <div className="flex items-center gap-1.5 text-amber-800">
              <Smartphone className="w-4 h-4 text-amber-600 shrink-0" />
              <p className="text-[11px] font-extrabold tracking-tight">
                {t('dashboard.sidebar.freeBannerTitle')}
              </p>
            </div>
            <p className="text-[10px] text-slate-600 leading-relaxed">
              {t('dashboard.sidebar.freeBannerDesc')}
            </p>
            <Link
              href="/dashboard/upgrade"
              onClick={onCloseMobile}
              className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[11px] shadow-sm flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>{t('dashboard.sidebar.freeBannerCta')}</span>
            </Link>
          </div>
        )}

        {/* 2. Menu Navigasi */}
        <nav
          className={`space-y-5 overflow-y-auto pr-1 custom-scrollbar ${
            isFreePlan
              ? 'mt-3 max-h-[calc(100vh-390px)]'
              : 'mt-4 max-h-[calc(100vh-270px)]'
          }`}
        >
          {activeSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                {section.group}
              </p>

              <div className="space-y-0.5 pt-1">
                {section.items.map((item, itemIdx) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;

                  if (item.isLocked) {
                    return (
                      <button
                        key={itemIdx}
                        type="button"
                        onClick={() => handleRestrictedClick(item.name, item.minPlan)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:bg-slate-100/50 hover:text-slate-600 transition-all group cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                          <span className="truncate">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Lock className="w-3 h-3 text-slate-400" />
                          {item.badge && (
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded border uppercase tracking-wider ${item.badgeColor}`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  }

                  return (
                    <Link
                      key={itemIdx}
                      href={item.href}
                      onClick={(e) => {
                        handlePlaceholderClick(e, item.name, item.href);
                        if (onCloseMobile) onCloseMobile();
                      }}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all group ${
                        isActive
                          ? 'bg-slate-900 text-white shadow-sm shadow-slate-900/15'
                          : 'text-slate-600 hover:bg-white/80 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon
                          className={`w-4 h-4 transition-colors ${
                            isActive
                              ? 'text-amber-400'
                              : 'text-slate-400 group-hover:text-slate-700'
                          }`}
                        />
                        <span className="truncate">{item.name}</span>
                      </div>

                      {item.badge && (
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded border uppercase tracking-wider ${
                            isActive
                              ? 'bg-amber-400 text-slate-950 border-amber-300'
                              : item.badgeColor
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* 3. Footer Sidebar: Profile Card & Logout Button */}
      <div className="pt-3 border-t border-slate-200/60 space-y-2.5">
        {/* User Mini Glass Card */}
        <div className="p-2.5 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/90 shadow-2xs ring-1 ring-inset ring-white/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5 truncate">
            <div className="w-8 h-8 rounded-xl bg-linear-to-br from-amber-100 to-amber-200 border border-amber-300/80 flex items-center justify-center text-amber-800 font-extrabold text-xs shrink-0 shadow-2xs">
              {(user?.name || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="leading-tight truncate">
              <p className="text-xs font-bold text-slate-800 truncate">{user?.name || 'Pengguna'}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[10px] font-semibold text-slate-500 capitalize">
                  {user?.isOwner
                    ? t('dashboard.sidebar.ownerRole')
                    : user?.role || t('dashboard.sidebar.cashierRole')}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            title={t('dashboard.sidebar.endSessionBtn')}
            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Action Logout Full Button */}
        <button
          type="button"
          onClick={handleLogout}
          className="w-full py-2 px-3 rounded-xl font-bold text-xs text-rose-700 bg-rose-50/70 hover:bg-rose-100/80 border border-rose-200/60 shadow-2xs flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>{t('dashboard.sidebar.endSessionBtn')}</span>
        </button>
      </div>
    </aside>
  );
}
