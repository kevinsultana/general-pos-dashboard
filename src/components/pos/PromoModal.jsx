"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Tag,
  Search,
  CheckCircle2,
  AlertCircle,
  Percent,
  Banknote,
  ArrowRight,
  Ticket,
  ExternalLink,
  RefreshCw,
  Plus,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../lib/api";

const fmt = (n) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(n) || 0);

export default function PromoModal({
  isOpen,
  onClose,
  promotions: initialPromotions,
  cart = [],
  subtotal = 0,
  appliedPromo = null,
  onSelectPromo,
  onRemovePromo,
}) {
  const router = useRouter();
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("ALL"); // 'ALL' | 'ELIGIBLE' | 'INELIGIBLE'
  const [manualCode, setManualCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);

  // Ambil daftar promo aktif langsung dari database saat modal dibuka
  const fetchActivePromotions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/promotions?activeOnly=true");
      if (res?.success && Array.isArray(res.data)) {
        setPromotions(res.data);
      } else {
        setPromotions([]);
      }
    } catch {
      // Jika endpoint belum siap atau offline, gunakan initialPromotions jika ada
      if (Array.isArray(initialPromotions)) {
        setPromotions(initialPromotions);
      } else {
        setPromotions([]);
      }
    } finally {
      setLoading(false);
    }
  }, [initialPromotions]);

  useEffect(() => {
    if (isOpen) {
      if (Array.isArray(initialPromotions) && initialPromotions.length > 0) {
        setPromotions(initialPromotions);
      }
      fetchActivePromotions();
      setManualCode("");
      setSearchQuery("");
      setFilterType("ALL");
    }
  }, [isOpen, initialPromotions, fetchActivePromotions]);

  // Evaluasi setiap promosi dari database terhadap kondisi keranjang POS saat ini
  const evaluatedPromotions = useMemo(() => {
    return (promotions || []).map((promo) => {
      const missingRequirements = [];

      const dType = promo.discountType || "PERCENTAGE";
      const dVal = Number(promo.discountValue) || 0;
      const dMax = promo.maxDiscount ? Number(promo.maxDiscount) : null;
      const minReq = Number(promo.minPurchase) || 0;
      const promoScope = promo.scope || "ALL";
      const scopeVariantIds = Array.isArray(promo.scopeVariantIds) ? promo.scopeVariantIds : [];

      // 1. Cek apakah keranjang kosong
      if (!cart || cart.length === 0) {
        missingRequirements.push("Keranjang belanja masih kosong. Tambahkan menu terlebih dahulu.");
      }

      // 2. Cek Limit Kuota Penggunaan Promo dari DB
      if (promo.usageLimit !== null && promo.usageLimit !== undefined && promo.usageCount >= promo.usageLimit) {
        missingRequirements.push("Kuota penggunaan kupon promo ini sudah habis.");
      }

      // 3. Cek Syarat Minimum Pembelian (minPurchase)
      if (minReq > 0 && subtotal < minReq) {
        const shortage = minReq - subtotal;
        missingRequirements.push(
          `Kurang belanja ${fmt(shortage)} lagi (Minimal belanja ${fmt(minReq)}).`
        );
      }

      // 4. Cek Cakupan Produk (scope PRODUCT vs ALL)
      let eligibleSubtotal = subtotal;
      let targetProductInfo = null;

      if (promoScope === "PRODUCT" && scopeVariantIds.length > 0) {
        const matchingItems = cart.filter(
          (it) => scopeVariantIds.includes(it.variantId) || scopeVariantIds.includes(it.productId)
        );
        if (matchingItems.length === 0) {
          missingRequirements.push("Wajib menambahkan produk promo tertentu ke dalam keranjang.");
          eligibleSubtotal = 0;
        } else {
          eligibleSubtotal = matchingItems.reduce(
            (sum, it) => sum + (Number(it.price) || 0) * (Number(it.qty) || 1),
            0
          );
        }
      }

      // Hitung Estimasi Penghematan (jika eligible)
      let estimatedSavings = 0;
      const isEligible = missingRequirements.length === 0;

      if (isEligible) {
        if (dType === "PERCENTAGE") {
          estimatedSavings = eligibleSubtotal * (dVal / 100);
        } else {
          estimatedSavings = Math.min(eligibleSubtotal, dVal);
        }

        if (dMax && dMax > 0 && estimatedSavings > dMax) {
          estimatedSavings = dMax;
        }
        estimatedSavings = Math.round(estimatedSavings);
      }

      const isCurrentlyApplied = appliedPromo?.code === promo.code;

      return {
        ...promo,
        discountType: dType,
        discountValue: dVal,
        maxDiscount: dMax,
        minPurchase: minReq,
        scope: promoScope,
        isEligible,
        isCurrentlyApplied,
        missingRequirements,
        estimatedSavings,
        targetProductInfo,
      };
    });
  }, [promotions, cart, subtotal, appliedPromo]);

  // Filter berdasarkan pencarian dan tab status
  const filteredPromotions = useMemo(() => {
    return evaluatedPromotions.filter((p) => {
      const matchSearch =
        !searchQuery.trim() ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description || "").toLowerCase().includes(searchQuery.toLowerCase());

      const matchTab =
        filterType === "ALL" ||
        (filterType === "ELIGIBLE" && p.isEligible) ||
        (filterType === "INELIGIBLE" && !p.isEligible);

      return matchSearch && matchTab;
    });
  }, [evaluatedPromotions, searchQuery, filterType]);

  const eligibleCount = evaluatedPromotions.filter((p) => p.isEligible).length;
  const ineligibleCount = evaluatedPromotions.filter((p) => !p.isEligible).length;

  // Handler Submit Kupon Manual
  const handleManualCodeSubmit = (e) => {
    e.preventDefault();
    const cleanCode = manualCode.trim().toUpperCase().replace(/\s+/g, "");
    if (!cleanCode) return;

    setIsValidating(true);
    const matched = evaluatedPromotions.find((p) => p.code.toUpperCase() === cleanCode);

    if (!matched) {
      toast.error(`Kode kupon "${cleanCode}" tidak ditemukan di database atau sudah tidak aktif.`, {
        icon: "❌",
      });
      setIsValidating(false);
      return;
    }

    if (!matched.isEligible) {
      toast.error(
        matched.missingRequirements[0] ||
          `Kupon "${matched.code}" belum memenuhi syarat transaksi saat ini.`,
        { icon: "⚠️" }
      );
      setIsValidating(false);
      return;
    }

    if (onSelectPromo) {
      onSelectPromo(matched);
      onClose();
      toast.success(
        `Kupon "${matched.code}" berhasil diterapkan! Hemat ${fmt(matched.estimatedSavings)}`,
        { icon: "🎉" }
      );
    }
    setIsValidating(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="w-full max-w-xl rounded-3xl bg-white/95 backdrop-blur-2xl border border-white/90 shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col my-6 max-h-[90vh]">
        {/* Header Modal */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-300 text-amber-700 flex items-center justify-center font-bold shadow-2xs">
              <Ticket className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-tight text-slate-900">
                  Promo & Voucher Diskon
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Database
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Pilih kupon diskon aktif untuk memotong total transaksi kasir
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={fetchActivePromotions}
              title="Segarkan data promo dari DB"
              disabled={loading}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-amber-600" : ""}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Banner Promo Sedang Aktif di Keranjang */}
        {appliedPromo && (
          <div className="mx-5 mt-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 flex items-center justify-between gap-3 text-xs shadow-2xs animate-in fade-in">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="px-2.5 py-1 rounded-xl bg-emerald-600 text-white font-mono font-black text-xs shrink-0 tracking-wider">
                {appliedPromo.code}
              </span>
              <div className="min-w-0">
                <p className="font-extrabold text-slate-900 truncate">
                  Promo Digunakan: {appliedPromo.name || appliedPromo.code}
                </p>
                <p className="text-[11px] text-emerald-700 font-bold">
                  Hemat {fmt(appliedPromo.estimatedSavings || appliedPromo.discountValue || 0)}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (onRemovePromo) onRemovePromo();
                onClose();
              }}
              className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-700 hover:text-rose-800 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 active:scale-95"
            >
              <X className="w-3.5 h-3.5" />
              <span>Lepas Promo</span>
            </button>
          </div>
        )}

        {/* Filter Bar & Search */}
        <div className="p-4 border-b border-slate-100 bg-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          {/* Tabs Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit">
            <button
              type="button"
              onClick={() => setFilterType("ALL")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterType === "ALL"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Semua ({evaluatedPromotions.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType("ELIGIBLE")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                filterType === "ELIGIBLE"
                  ? "bg-white text-emerald-700 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>Bisa Dipakai</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-extrabold">
                {eligibleCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setFilterType("INELIGIBLE")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                filterType === "INELIGIBLE"
                  ? "bg-white text-amber-700 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>Belum Memenuhi</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700 font-bold">
                {ineligibleCount}
              </span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kode promo..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-amber-400 font-semibold"
            />
          </div>
        </div>

        {/* Daftar Kartu Promo dari Database */}
        <div className="flex-1 p-5 overflow-y-auto space-y-3 min-h-60 custom-scrollbar">
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-28 rounded-2xl bg-slate-100 animate-pulse border border-slate-200/60" />
              ))}
            </div>
          ) : evaluatedPromotions.length === 0 ? (
            /* State Jika DB Masih Belum Punya Promo Aktif */
            <div className="text-center py-10 px-4 space-y-3 bg-slate-50/70 border border-dashed border-slate-200 rounded-2xl">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
                <Ticket className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-black text-slate-800">
                  Belum Ada Promo Aktif di Database
                </p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Belum ada promo yang terdaftar atau sedang aktif. Anda dapat menambahkan promo dan voucher baru di menu manajemen promo.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  router.push("/dashboard/promotions");
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white font-extrabold text-xs shadow-md shadow-slate-900/15 hover:bg-slate-800 transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-amber-400" />
                <span>Buat Promo di Menu Promo & Diskon</span>
                <ExternalLink className="w-3 h-3 text-slate-400 ml-0.5" />
              </button>
            </div>
          ) : filteredPromotions.length === 0 ? (
            <div className="text-center py-10 text-slate-400 space-y-2">
              <Tag className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs font-bold text-slate-600">
                Tidak ada promo yang sesuai dengan filter
              </p>
              <p className="text-[11px] text-slate-400">
                {searchQuery
                  ? "Coba ubah kata kunci pencarian kode promo Anda."
                  : "Ubah tab filter untuk melihat promo lainnya."}
              </p>
            </div>
          ) : (
            filteredPromotions.map((promo) => {
              const isEligible = promo.isEligible;
              const isApplied = promo.isCurrentlyApplied;

              return (
                <div
                  key={promo.id}
                  onClick={() => {
                    if (isEligible && !isApplied && onSelectPromo) {
                      onSelectPromo(promo);
                      onClose();
                    }
                  }}
                  className={`p-4 rounded-2xl border-2 transition-all flex flex-col justify-between gap-3 relative select-none ${
                    isApplied
                      ? "border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20 shadow-md"
                      : isEligible
                      ? "border-slate-200 hover:border-amber-400 hover:shadow-md bg-white cursor-pointer group active:scale-[0.99]"
                      : "border-slate-200 bg-slate-50/70 opacity-75 cursor-not-allowed"
                  }`}
                >
                  {/* Top Bar: Name, Code & Status Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-black text-xs px-2.5 py-1 rounded-lg bg-amber-100 text-amber-950 border border-amber-300 shadow-2xs uppercase tracking-wider">
                          {promo.code}
                        </span>
                        <h3 className="font-bold text-sm text-slate-900 truncate">
                          {promo.name}
                        </h3>
                      </div>
                      {promo.description && (
                        <p className="text-xs text-slate-500 line-clamp-2">
                          {promo.description}
                        </p>
                      )}
                    </div>

                    {/* Eligibility Badge */}
                    <div className="shrink-0">
                      {isApplied ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Aktif</span>
                        </span>
                      ) : isEligible ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-100/90 text-emerald-800 border border-emerald-200 shadow-2xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Bisa Dipakai</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                          <span>Belum Memenuhi</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Detail Diskon & Ketentuan */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-2 text-slate-600 flex-wrap">
                      <span className="font-bold flex items-center gap-1 text-slate-900">
                        {promo.discountType === "PERCENTAGE" ? (
                          <Percent className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                        )}
                        <span>
                          {promo.discountType === "PERCENTAGE"
                            ? `Diskon ${promo.discountValue}%`
                            : `Potongan ${fmt(promo.discountValue)}`}
                        </span>
                      </span>

                      {promo.maxDiscount && (
                        <span className="text-[11px] text-slate-400 font-medium">
                          (Maks. {fmt(promo.maxDiscount)})
                        </span>
                      )}

                      {promo.minPurchase > 0 && (
                        <span className="text-[11px] text-slate-600 font-medium bg-slate-100 px-2 py-0.5 rounded-md">
                          Min. {fmt(promo.minPurchase)}
                        </span>
                      )}

                      {promo.scope === "PRODUCT" && (
                        <span className="text-[11px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md font-bold">
                          Produk Khusus
                        </span>
                      )}
                    </div>

                    {/* Estimasi Nilai Hemat */}
                    {isEligible && promo.estimatedSavings > 0 && (
                      <span className="font-mono font-black text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        Hemat {fmt(promo.estimatedSavings)}
                      </span>
                    )}
                  </div>

                  {/* Missing Requirements Alert Box (Jika belum eligible) */}
                  {!isEligible && promo.missingRequirements.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs space-y-1">
                      <p className="font-bold flex items-center gap-1.5 text-amber-950">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        Syarat Belum Terpenuhi:
                      </p>
                      <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-amber-800 font-medium">
                        {promo.missingRequirements.map((req, idx) => (
                          <li key={idx}>{req}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="pt-1 flex items-center justify-end gap-2">
                    {isApplied ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onRemovePromo) onRemovePromo();
                          onClose();
                        }}
                        className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Batal Gunakan</span>
                      </button>
                    ) : isEligible ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectPromo) {
                            onSelectPromo(promo);
                            onClose();
                          }
                        }}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white rounded-xl text-xs font-extrabold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>Gunakan Promo Ini</span>
                        <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="px-3 py-1.5 bg-slate-100 text-slate-400 border border-slate-200 rounded-xl text-xs font-semibold cursor-not-allowed"
                      >
                        Belum Memenuhi Syarat
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer: Input Kupon Manual dari DB */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0 space-y-2">
          <form onSubmit={handleManualCodeSubmit} className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                placeholder="Punya kode kupon voucher? Ketik di sini..."
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-400 uppercase"
              />
            </div>
            <button
              type="submit"
              disabled={isValidating || !manualCode.trim()}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white rounded-xl text-xs font-extrabold transition-all disabled:opacity-50 cursor-pointer shrink-0"
            >
              {isValidating ? "Memeriksa..." : "Terapkan Kupon"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
