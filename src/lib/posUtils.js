// ─── POS Shared Utilities ──────────────────────────────────────────────────────
// Dipakai bersama oleh POSPage, CheckoutModal, HoldCartModal, dan hooks pos.

/** Format angka ke Rupiah: fmt(15000) → "Rp 15.000" */
export const fmt = (n) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(n) || 0);

/** Format angka ke ribuan tanpa simbol: formatRibuan(15000) → "15.000" */
export const formatRibuan = (val) => {
  if (val === undefined || val === null || val === "") return "";
  const clean = String(val).replace(/\D/g, "");
  if (!clean) return "";
  return new Intl.NumberFormat("id-ID").format(Number(clean));
};

/** Metode pembayaran yang tersedia di POS */
export const PAYMENT_METHODS = [
  {
    key: "CASH",
    label: "Tunai",
    color: "bg-emerald-50 border-emerald-300 text-emerald-800",
  },
  {
    key: "QRIS",
    label: "QRIS",
    color: "bg-violet-50 border-violet-300 text-violet-800",
  },
  {
    key: "TRANSFER",
    label: "Transfer",
    color: "bg-blue-50 border-blue-300 text-blue-800",
  },
];

/** Denominasi rupiah yang beredar */
const IDR_DENOMINATIONS = [
  100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000,
];

/**
 * Menghasilkan 4-5 nominal uang tunai yang paling mendekati (dan >=) total,
 * menggunakan denominasi rupiah yang beredar.
 */
export function getSmartQuickCash(total) {
  if (!total || total <= 0) return [];

  const suggestions = new Set();

  // 1. Cari denomination tunggal terkecil yang >= total
  for (const d of IDR_DENOMINATIONS) {
    if (d >= total) {
      suggestions.add(d);
      break;
    }
  }

  // 2. Cari kelipatan denomination besar yang >= total
  const bigDenoms = [100000, 50000, 20000, 10000, 5000];
  for (const d of bigDenoms) {
    if (suggestions.size >= 5) break;
    const multiple = Math.ceil(total / d) * d;
    if (multiple >= total) suggestions.add(multiple);
    if (suggestions.size < 5) {
      const nextMultiple = (Math.ceil(total / d) + 1) * d;
      suggestions.add(nextMultiple);
    }
  }

  return [...suggestions]
    .filter((v) => v >= total)
    .sort((a, b) => a - b)
    .slice(0, 5);
}
