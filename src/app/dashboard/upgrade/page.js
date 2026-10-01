"use client";

import { useState, useEffect } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Check,
  ShieldCheck,
  ArrowRight,
  Store,
  Crown,
  Info,
  ExternalLink,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../../contexts/AuthContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import api from "../../../lib/api";
import { showAlertNotice } from "../../../lib/alerts";
import UnauthorizedState from "../../../components/common/UnauthorizedState";

export default function UpgradePage() {
  const router = useRouter();
  const { tenant, user, checkAuth, hasPermission } = useAuth();
  const { t } = useLanguage();

  const isAllowed = user?.isOwner || hasPermission("subscriptions:view");
  const canManage = user?.isOwner || hasPermission("subscriptions:manage");

  useEffect(() => {
    if (!isAllowed && user) {
      toast.error(
        t("common.accessDeniedToast") ||
          "Akses Ditolak: Anda tidak memiliki izin untuk fitur ini."
      );
    }
  }, [isAllowed, user, t]);

  const [billingCycle, setBillingCycle] = useState("yearly"); // 'monthly' | 'yearly'
  const [loadingPlan, setLoadingPlan] = useState(null); // 'PLUS' | 'PRO' | null

  const isCurrentPlan = (plan) => tenant?.plan === plan;

  const handleUpgrade = async (targetPlan) => {
    if (!canManage) {
      toast.error(
        "Akses Ditolak: Anda tidak memiliki izin untuk membeli atau upgrade paket langganan (subscriptions:manage)."
      );
      return;
    }
    if (isCurrentPlan(targetPlan)) {
      toast(t("upgrade.activeNow"), { icon: "ℹ️" });
      return;
    }

    // 1. Validasi kesiapan SDK Midtrans Snap
    if (
      typeof window === "undefined" ||
      !window.snap ||
      typeof window.snap.pay !== "function"
    ) {
      toast.error(
        "Sistem pembayaran Midtrans sedang dimuat, silakan coba beberapa detik lagi."
      );
      return;
    }

    setLoadingPlan(targetPlan);
    const toastId = toast.loading(t("upgrade.loadingSnap") || "Menyiapkan transaksi pembayaran...");

    try {
      // 2. Panggil backend Express untuk membuat transaksi Midtrans Snap resmi
      const response = await api.post("/subscriptions/create-transaction", {
        plan: targetPlan,
        billingCycle,
      });

      toast.dismiss(toastId);

      const snapToken =
        response?.data?.snapToken ||
        response?.data?.token ||
        response?.snapToken ||
        response?.token;
      const orderId = response?.data?.orderId || response?.orderId;

      if (!response || !response.success || !snapToken) {
        throw new Error(
          response?.message ||
            "Gagal membuat transaksi gerbang pembayaran Midtrans."
        );
      }

      // 3. Buka Popup Pembayaran Midtrans Snap Sandbox Resmi
      window.snap.pay(snapToken, {
        onSuccess: async (result) => {
          const verifyToastId = toast.loading(
            "Memverifikasi status pembayaran..."
          );
          try {
            // Panggil endpoint verify-payment di backend
            await api.post("/subscriptions/verify-payment", {
              plan: targetPlan,
              orderId: result.order_id || orderId,
            });

            toast.dismiss(verifyToastId);

            // Segarkan status sesi akun di AuthContext agar role/plan langsung aktif
            await checkAuth();

            await showAlertNotice({
              title: t("upgrade.paymentSuccessTitle") || "Pembayaran Berhasil!",
              text:
                t("upgrade.paymentSuccessText", { plan: targetPlan }) ||
                `Selamat, paket ${targetPlan} Anda telah aktif.`,
              icon: "success",
              confirmButtonText: t("common.ok") || "Menuju Dashboard",
            });

            router.push("/dashboard");
          } catch (err) {
            toast.dismiss(verifyToastId);
            console.error("Error verifying payment:", err);
            toast.error(
              err.message || "Gagal memverifikasi pembayaran. Silakan muat ulang halaman."
            );
            await checkAuth();
          } finally {
            setLoadingPlan(null);
          }
        },
        onPending: (result) => {
          const vaNumber =
            result?.va_numbers?.[0]?.va_number ||
            result?.bca_va_number ||
            result?.permata_va_number ||
            result?.bill_key;
          const bank = result?.va_numbers?.[0]?.bank?.toUpperCase();

          let pendingMsg =
            t("upgrade.paymentPendingText") ||
            "Pembayaran sedang menunggu transfer.";
          if (vaNumber) {
            pendingMsg += ` Nomor ${bank ? `${bank} ` : ""}Virtual Account: ${vaNumber}.`;
          } else if (result?.payment_type) {
            pendingMsg += ` Metode: ${result.payment_type}.`;
          }

          showAlertNotice({
            title: "Menunggu Pembayaran",
            text: `${pendingMsg}\nSilakan selesaikan pembayaran Anda di gerbang Midtrans atau simulator sandbox.`,
            icon: "info",
            confirmButtonText: "Mengerti",
          });
          setLoadingPlan(null);
        },
        onError: (error) => {
          console.error("Midtrans Snap error:", error);
          toast.error(
            error?.status_message ||
              t("upgrade.paymentErrorText") ||
              "Pembayaran gagal atau dibatalkan oleh Midtrans."
          );
          setLoadingPlan(null);
        },
        onClose: () => {
          setLoadingPlan(null);
        },
      });
    } catch (err) {
      toast.dismiss(toastId);
      toast.error(
        err.message || "Terjadi kesalahan saat memproses pembayaran."
      );
      setLoadingPlan(null);
    }
  };

  if (!isAllowed && user) {
    return <UnauthorizedState requiredPermission="subscriptions:view" />;
  }

  return (
    <>
      {/* Script Midtrans Snap Sandbox Resmi */}
      <Script
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
        strategy="afterInteractive"
        onLoad={() => console.log("Midtrans Snap SDK Loaded")}
      />

      <div className="space-y-8 pb-12 animate-in fade-in duration-300">
        {/* 1. Header Section */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-400/40 text-amber-800 text-xs font-extrabold tracking-wide uppercase shadow-2xs backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>{t("upgrade.badge")}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight">
            {t("upgrade.title")}
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
            {t("upgrade.subtitle")}
          </p>

          {/* 2. Billing Cycle Cyber-Glass Toggle (Bulanan vs Tahunan) */}
          <div className="pt-4 flex justify-center">
            <div className="relative inline-flex items-center p-1.5 rounded-full bg-white/70 backdrop-blur-xl border border-white/80 shadow-[0_4px_24px_rgba(0,0,0,0.06)] ring-1 ring-inset ring-white/60 select-none">
              {/* Sliding Pill Indicator */}
              <div
                className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] rounded-full bg-slate-900 shadow-md transition-all duration-300 ease-out pointer-events-none ${
                  billingCycle === "monthly"
                    ? "left-1.5"
                    : "left-[calc(50%+1.5px)]"
                }`}
              />

              {/* Monthly Option */}
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={`relative z-10 px-5 py-2 rounded-full text-xs font-extrabold transition-colors duration-200 cursor-pointer ${
                  billingCycle === "monthly"
                    ? "text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {t("upgrade.billingMonthly")}
              </button>

              {/* Yearly Option with Save Badge */}
              <button
                type="button"
                onClick={() => setBillingCycle("yearly")}
                className={`relative z-10 flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-extrabold transition-colors duration-200 cursor-pointer ${
                  billingCycle === "yearly"
                    ? "text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>{t("upgrade.billingYearly")}</span>
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-full transition-colors ${
                    billingCycle === "yearly"
                      ? "bg-amber-400 text-slate-950 shadow-2xs"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {t("upgrade.saveBadge")}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* 3. Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-4xl mx-auto items-stretch">
          {/* Plan PLUS Card */}
          <div
            className={`relative rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 ${
              isCurrentPlan("PLUS")
                ? "bg-white/95 border-2 border-amber-500 shadow-xl ring-4 ring-amber-500/10"
                : "bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] hover:shadow-xl hover:border-amber-300"
            }`}
          >
            {isCurrentPlan("PLUS") && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-amber-500 text-white font-extrabold text-[11px] shadow-sm uppercase tracking-wider">
                {t("upgrade.currentPlanBadge")}
              </div>
            )}

            <div>
              {/* Header Card */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-slate-900">
                      {t("upgrade.plusName")}
                    </h3>
                    <span className="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-800 text-[10px] font-extrabold">
                      PLUS
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {t("upgrade.plusTagline")}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600 shadow-2xs shrink-0">
                  <Store className="w-5 h-5" />
                </div>
              </div>

              {/* Price Details */}
              <div className="py-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-xs font-bold text-slate-500">Rp</span>
                  <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                    {billingCycle === "yearly" ? "20.000" : "25.000"}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    {t("upgrade.perMonth")}
                  </span>
                </div>
                <p className="text-[11px] font-semibold text-slate-400 mt-1">
                  {billingCycle === "yearly"
                    ? t("upgrade.billedYearlyNotice", { amount: "Rp 240.000" })
                    : "Fleksibel bayar bulanan, batalkan kapan saja"}
                </p>
              </div>

              {/* Features List */}
              <div className="space-y-3 pt-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {t("upgrade.featuresHeading")}
                </p>
                <ul className="space-y-2.5">
                  {(t("upgrade.plusFeatures") || []).map((feature, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2.5 text-xs text-slate-700"
                    >
                      <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-2.5 h-2.5 stroke-3" />
                      </div>
                      <span className="leading-tight">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* CTA Button */}
            <div className="pt-8">
              <button
                type="button"
                onClick={() => handleUpgrade("PLUS")}
                disabled={isCurrentPlan("PLUS") || loadingPlan !== null}
                className={`w-full py-3 px-4 rounded-2xl font-extrabold text-xs shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isCurrentPlan("PLUS")
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/15 active:scale-98"
                }`}
              >
                {loadingPlan === "PLUS" ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : isCurrentPlan("PLUS") ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>{t("upgrade.activeNow")}</span>
                  </>
                ) : (
                  <>
                    <span>{t("upgrade.upgradeNow", { plan: "PLUS" })}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Plan PRO Card (Best Value / Paling Diminati) */}
          <div
            className={`relative rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 ${
              isCurrentPlan("PRO")
                ? "bg-white/95 border-2 border-purple-500 shadow-xl ring-4 ring-purple-500/10"
                : "bg-white/90 backdrop-blur-2xl border-2 border-amber-400 shadow-[0_12px_40px_rgba(245,158,11,0.12)] hover:shadow-2xl"
            }`}
          >
            {/* Top Pill: Paling Diminati / Current Plan */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-linear-to-r from-amber-500 to-amber-600 text-white font-extrabold text-[11px] shadow-sm uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-200" />
              <span>
                {isCurrentPlan("PRO")
                  ? t("upgrade.currentPlanBadge")
                  : t("upgrade.bestValue")}
              </span>
            </div>

            <div>
              {/* Header Card */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-slate-900">
                      {t("upgrade.proName")}
                    </h3>
                    <span className="px-2 py-0.5 rounded-lg bg-purple-100 text-purple-800 text-[10px] font-extrabold">
                      PRO
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {t("upgrade.proTagline")}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-200/80 flex items-center justify-center text-purple-600 shadow-2xs shrink-0">
                  <Crown className="w-5 h-5" />
                </div>
              </div>

              {/* Price Details */}
              <div className="py-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-xs font-bold text-slate-500">Rp</span>
                  <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                    {billingCycle === "yearly" ? "50.000" : "60.000"}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    {t("upgrade.perMonth")}
                  </span>
                </div>
                <p className="text-[11px] font-semibold text-slate-400 mt-1">
                  {billingCycle === "yearly"
                    ? t("upgrade.billedYearlyNotice", { amount: "Rp 600.000" })
                    : "Fleksibel bayar bulanan, batalkan kapan saja"}
                </p>
              </div>

              {/* Features List */}
              <div className="space-y-3 pt-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {t("upgrade.featuresHeading")}
                </p>
                <ul className="space-y-2.5">
                  {(t("upgrade.proFeatures") || []).map((feature, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2.5 text-xs text-slate-700"
                    >
                      <div className="w-4 h-4 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-2.5 h-2.5 stroke-3" />
                      </div>
                      <span className="leading-tight font-medium">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* CTA Button */}
            <div className="pt-8">
              <button
                type="button"
                onClick={() => handleUpgrade("PRO")}
                disabled={isCurrentPlan("PRO") || loadingPlan !== null}
                className={`w-full py-3 px-4 rounded-2xl font-extrabold text-xs shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isCurrentPlan("PRO")
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-amber-500/20 active:scale-98"
                }`}
              >
                {loadingPlan === "PRO" ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : isCurrentPlan("PRO") ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>{t("upgrade.activeNow")}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-200" />
                    <span>{t("upgrade.upgradeNow", { plan: "PRO" })}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 4. Security & Payment Guarantee Badge */}
        <div className="max-w-xl mx-auto p-4 rounded-2xl bg-white/60 backdrop-blur-xl border border-white/80 shadow-xs flex items-center justify-center gap-2.5 text-slate-600 text-xs text-center">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{t("upgrade.securityNotice")}</span>
        </div>

        {/* 5. Catatan Pengujian Sandbox untuk Tester */}
        <div className="max-w-2xl mx-auto p-4 sm:p-5 rounded-3xl bg-amber-500/10 border border-amber-400/30 backdrop-blur-xl shadow-xs text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 shadow-2xs">
              <Info className="w-5 h-5 text-amber-700" />
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-black text-amber-900 tracking-tight">
                Mode Pengujian Sandbox Aktif
              </p>
              <p className="text-[11px] text-amber-800 leading-relaxed font-normal">
                Anda dapat menggunakan Simulator Pembayaran Midtrans (Virtual Account / QRIS) di{" "}
                <span className="font-mono font-bold text-amber-900">
                  https://simulator.sandbox.midtrans.com
                </span>{" "}
                untuk menyelesaikan tes pembayaran.
              </p>
            </div>
          </div>

          <a
            href="https://simulator.sandbox.midtrans.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white hover:bg-amber-50 text-amber-900 border border-amber-300 font-extrabold text-xs shadow-2xs transition-all active:scale-98 shrink-0 self-start sm:self-auto"
          >
            <span>Buka Simulator</span>
            <ExternalLink className="w-3.5 h-3.5 text-amber-600" />
          </a>
        </div>
      </div>
    </>
  );
}
