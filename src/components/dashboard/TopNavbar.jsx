"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Menu,
  Store,
  Sparkles,
  LogOut,
  Bell,
  RefreshCw,
  ChevronDown,
  Check,
  GitBranch,
  Printer,
} from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import LanguageSwitcher from "../common/LanguageSwitcher";
import { useBluetooth } from "../../contexts/BluetoothPrinterContext";
import BluetoothModal from "../bluetooth/BluetoothModal";
import { confirmLogout } from "../../lib/alerts";
import api from "../../lib/api";

export default function TopNavbar({ onToggleMobile }) {
  const router = useRouter();
  const {
    user,
    tenant,
    logout,
    activeBranchId,
    activeBranch,
    branches,
    switchBranch,
    hasPermission,
  } = useAuth();
  const { t } = useLanguage();
  const { isConnected, isReconnecting, btDeviceName } = useBluetooth();

  const [isPrinterModalOpen, setIsPrinterModalOpen] = useState(false);
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [branchList, setBranchList] = useState([]);
  const branchDropdownRef = useRef(null);

  // Ambil daftar cabang terkini jika user memiliki hak akses atau owner
  const canViewBranches = user?.isOwner || hasPermission("branches:view");

  useEffect(() => {
    if (branches && branches.length > 0) {
      setBranchList(branches);
    }
  }, [branches]);

  // Muat ulang daftar cabang dari API jika dibuka untuk memastikan data terupdate
  const handleOpenDropdown = async () => {
    setIsBranchDropdownOpen((prev) => !prev);
    if (!isBranchDropdownOpen && canViewBranches) {
      try {
        const res = await api.get("/branches");
        if (res?.success && Array.isArray(res.data)) {
          setBranchList(res.data);
        }
      } catch (err) {
        // Fallback memakai branches dari context
      }
    }
  };

  // Close dropdown saat klik di luar
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        branchDropdownRef.current &&
        !branchDropdownRef.current.contains(e.target)
      ) {
        setIsBranchDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Eksekusi ganti cabang aktif
  const handleSelectBranch = async (branchItem) => {
    if (branchItem.id === (activeBranchId || activeBranch?.id)) {
      setIsBranchDropdownOpen(false);
      return;
    }

    try {
      setIsSwitching(true);
      await switchBranch(branchItem.id);
      toast.success(
        t("branches.switchBranchSuccess", { branchName: branchItem.name }) ||
          `Berhasil beralih ke ${branchItem.name}`,
      );
      setIsBranchDropdownOpen(false);
    } catch (err) {
      toast.error(err.message || "Gagal berpindah cabang.");
    } finally {
      setIsSwitching(false);
    }
  };

  const currentBranchName =
    activeBranch?.name ||
    branchList.find((b) => b.id === activeBranchId)?.name ||
    t("dashboard.mainBranch") ||
    "Cabang Utama";

  const handleLogout = async () => {
    const result = await confirmLogout({
      title: t("dashboard.logoutPromptTitle"),
      text: t("dashboard.logoutPromptText"),
      confirmButtonText: t("dashboard.logoutConfirm"),
      cancelButtonText: t("dashboard.logoutCancel"),
    });
    if (result.isConfirmed) {
      logout();
      toast.success(t("dashboard.logoutSuccess"));
      router.push("/login");
    }
  };

  const handleSync = () => {
    toast.promise(new Promise((resolve) => setTimeout(resolve, 1200)), {
      loading: t("dashboard.cloudSyncToast"),
      success: t("dashboard.cloudSyncSuccess"),
      error: "Sync error",
    });
  };

  return (
    <header className="sticky top-4 z-30 w-full mb-6">
      <div className="bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] ring-1 ring-inset ring-white/70 rounded-2xl sm:rounded-full px-4 sm:px-6 py-2.5 flex items-center justify-between transition-all">
        {/* Left Side: Mobile Hamburger & Branch Switcher Dropdown */}
        <div className="flex items-center gap-3">
          {/* Mobile Toggle Button */}
          <button
            type="button"
            onClick={onToggleMobile}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition-colors"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Active Branch Switcher Capsule */}
          <div className="flex items-center gap-2">
            <div className="relative" ref={branchDropdownRef}>
              <button
                type="button"
                onClick={handleOpenDropdown}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100/80 hover:bg-slate-200/80 border border-slate-200/70 text-xs font-bold text-slate-800 shadow-2xs transition-all active:scale-98 cursor-pointer group"
                title="Ganti Cabang Aktif"
              >
                <div className="w-5 h-5 rounded-full bg-amber-500/15 flex items-center justify-center text-amber-700">
                  <Store className="w-3 h-3 text-amber-600 group-hover:scale-110 transition-transform" />
                </div>
                <span className="truncate max-w-28 sm:max-w-40 font-extrabold text-slate-900">
                  {currentBranchName}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition-transform duration-200 ${
                    isBranchDropdownOpen ? "rotate-180 text-slate-900" : ""
                  }`}
                />
              </button>

              {/* Dropdown Menu Cabang */}
              {isBranchDropdownOpen && (
                <div className="absolute left-0 mt-2 w-64 sm:w-72 rounded-2xl bg-white/95 backdrop-blur-2xl border border-white/90 shadow-[0_12px_40px_0_rgba(31,38,135,0.12)] ring-1 ring-inset ring-white/80 p-2 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-1">
                  <div className="px-3 py-2 flex items-center justify-between border-b border-slate-100">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      {t("branches.allBranches") || "Pilih Cabang Aktif"}
                    </p>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
                      {branchList.length} Cabang
                    </span>
                  </div>

                  <div className="max-h-56 overflow-y-auto space-y-0.5 custom-scrollbar p-0.5">
                    {branchList.length === 0 ? (
                      <div className="p-3 text-center text-xs text-slate-500">
                        Memuat data cabang...
                      </div>
                    ) : (
                      branchList.map((branchItem) => {
                        const isActive =
                          branchItem.id ===
                          (activeBranchId || activeBranch?.id);

                        return (
                          <button
                            key={branchItem.id}
                            type="button"
                            onClick={() => handleSelectBranch(branchItem)}
                            disabled={isSwitching || isActive}
                            className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition-all cursor-pointer ${
                              isActive
                                ? "bg-amber-500/10 text-amber-950 font-black border border-amber-300/70 shadow-2xs"
                                : "text-slate-700 hover:bg-slate-100/80 font-medium"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              <div
                                className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                                  isActive
                                    ? "bg-amber-500 text-white shadow-xs"
                                    : "bg-slate-100 text-slate-500"
                                }`}
                              >
                                <Store className="w-3.5 h-3.5" />
                              </div>
                              <div className="truncate leading-tight">
                                <p className="truncate text-xs font-bold text-slate-900">
                                  {branchItem.name}
                                </p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  {branchItem.isMain && (
                                    <span className="text-[9px] font-black text-amber-700 uppercase tracking-wider">
                                      {t("branches.mainBranchBadge") || "Utama"}
                                    </span>
                                  )}
                                  {branchItem.address && (
                                    <span className="text-[10px] text-slate-400 truncate max-w-28">
                                      {branchItem.address}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {isActive && (
                              <Check className="w-4 h-4 text-amber-600 shrink-0" />
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>

                  {/* Link ke Halaman Kelola Cabang */}
                  {canViewBranches && (
                    <div className="pt-1.5 border-t border-slate-100">
                      <Link
                        href="/dashboard/branches"
                        onClick={() => setIsBranchDropdownOpen(false)}
                        className="flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-xl bg-slate-100/80 hover:bg-slate-200/80 text-[11px] font-extrabold text-slate-800 transition-colors"
                      >
                        <GitBranch className="w-3.5 h-3.5 text-purple-600" />
                        <span>
                          {t("branches.branchesTitle") || "Kelola Semua Cabang"}
                        </span>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Printer Shortcut, Language Switcher, Cloud Sync, User Profile */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Thermal Printer Bluetooth Shortcut Button */}
          <button
            type="button"
            onClick={() => setIsPrinterModalOpen(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-2xs ${
              isConnected
                ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                : isReconnecting
                  ? "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100"
                  : "bg-white/70 text-slate-600 hover:text-slate-900 border-slate-200/70 hover:bg-white/95"
            }`}
            title={
              isConnected
                ? `Printer Terhubung: ${btDeviceName || "Bluetooth Printer"}`
                : "Koneksi Thermal Printer Bluetooth"
            }
          >
            <Printer
              className={`w-3.5 h-3.5 ${
                isConnected
                  ? "text-emerald-600"
                  : isReconnecting
                    ? "text-amber-600 animate-spin"
                    : "text-slate-500"
              }`}
            />
            <span className="hidden xl:inline text-[11px] font-extrabold truncate max-w-28">
              {isConnected ? btDeviceName || "Printer Siap" : "Printer"}
            </span>
            {isConnected ? (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            ) : isReconnecting ? (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            ) : null}
          </button>

          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Cloud Sync Button */}
          <button
            type="button"
            onClick={handleSync}
            title="Sync data"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-white/80 border border-transparent hover:border-slate-200/60 transition-all active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Notifications Trigger */}
          <button
            type="button"
            onClick={() =>
              toast(t("dashboard.noNotifications"), { icon: "🔔" })
            }
            title="Notifications"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-white/80 border border-transparent hover:border-slate-200/60 transition-all active:scale-95 relative"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white" />
          </button>

          <span className="h-4 w-px bg-slate-200/80 mx-1 hidden sm:inline-block" />

          {/* User Profile Capsule */}
          <div className="flex items-center gap-2.5 pl-1">
            <div className="hidden md:block text-right leading-tight">
              <p className="text-xs font-extrabold text-slate-900 truncate max-w-32.5">
                {user?.name || "Pengguna"}
              </p>
              <p className="text-[10px] font-medium text-slate-400 capitalize">
                {user?.isOwner
                  ? t("dashboard.sidebar.ownerRole")
                  : user?.role || t("dashboard.sidebar.cashierRole")}
              </p>
            </div>

            <div className="w-8 h-8 rounded-full bg-linear-to-br from-amber-400 to-amber-600 p-0.5 shadow-2xs">
              <div className="w-full h-full bg-white rounded-full flex items-center justify-center text-amber-700 font-extrabold text-xs">
                {(user?.name || "U").charAt(0).toUpperCase()}
              </div>
            </div>

            {/* Quick Logout Button */}
            <button
              type="button"
              onClick={handleLogout}
              title={t("dashboard.sidebar.endSessionBtn")}
              className="p-2 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Koneksi Thermal Printer Bluetooth Global */}
      <BluetoothModal
        isOpen={isPrinterModalOpen}
        onClose={() => setIsPrinterModalOpen(false)}
        userName={user?.name || "Kasir"}
        storeInfo={{
          name: tenant?.name || activeBranch?.name || "OMNI POS",
          address: activeBranch?.address || "Cabang Utama",
          phone: activeBranch?.phone || "",
          printerWidth: 58,
          branchName: activeBranch?.name,
        }}
      />
    </header>
  );
}
