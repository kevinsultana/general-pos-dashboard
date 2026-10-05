"use client";

import { Delete, RotateCcw } from "lucide-react";
import { cn } from "../../lib/utils";

/**
 * NumericKeypad - Numpad sentuh kasir ergonomis untuk tablet/desktop POS.
 *
 * Touch target tombol >= 48px, ramah sentuhan kasir, mendukung dark mode.
 *
 * @param {object} props
 * @param {string|number} props.value - nilai input saat ini (string atau angka)
 * @param {Function} props.onChange - callback saat nilai berubah (newValue: string) => void
 * @param {Array<number>} [props.quickAmounts] - tombol nominal cepat opsional (cth: [10000, 20000, 50000, 100000])
 * @param {Function} [props.onExactAmount] - handler tombol "Uang Pas" (opsional)
 * @param {string} [props.className]
 * @param {number} [props.maxDigits=12] - batas maksimal digit
 */
export default function NumericKeypad({
  value = "",
  onChange,
  quickAmounts = [],
  onExactAmount,
  className,
  maxDigits = 12,
}) {
  const strVal = String(value || "").replace(/\D/g, "");

  const handleDigit = (digit) => {
    if (strVal.length >= maxDigits) return;
    if (strVal === "0" && (digit === "0" || digit === "00" || digit === "000")) return;
    const nextVal = strVal === "0" ? digit : strVal + digit;
    onChange?.(nextVal);
  };

  const handleBackspace = () => {
    if (!strVal || strVal.length <= 1) {
      onChange?.("");
    } else {
      onChange?.(strVal.slice(0, -1));
    }
  };

  const handleClear = () => {
    onChange?.("");
  };

  const buttons = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["00", "0", "000"],
  ];

  return (
    <div className={cn("space-y-2.5 select-none", className)}>
      {/* Quick Amount Chips (jika ada) */}
      {(quickAmounts.length > 0 || onExactAmount) && (
        <div className="flex flex-wrap items-center gap-1.5 pb-1">
          {onExactAmount && (
            <button
              type="button"
              onClick={onExactAmount}
              className="min-h-11 px-3.5 py-2 rounded-xl bg-amber-500/15 border border-amber-400/40 text-amber-900 text-xs font-black hover:bg-amber-500/25 active:scale-95 transition-all cursor-pointer"
            >
              Uang Pas
            </button>
          )}
          {quickAmounts.map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => onChange?.(String(amt))}
              className="min-h-11 px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-200 active:scale-95 transition-all cursor-pointer"
            >
              +{Number(amt).toLocaleString("id-ID")}
            </button>
          ))}
        </div>
      )}

      {/* Grid Keypad */}
      <div className="grid grid-cols-4 gap-2">
        {/* Kolom 1-3: Angka */}
        <div className="col-span-3 grid grid-cols-3 gap-2">
          {buttons.flat().map((btn) => (
            <button
              key={btn}
              type="button"
              onClick={() => handleDigit(btn)}
              className="min-h-12 h-12 sm:h-14 rounded-2xl bg-white border border-slate-200 hover:bg-amber-50 hover:border-amber-400/60 active:scale-95 font-black text-base sm:text-lg text-slate-800 shadow-2xs transition-all flex items-center justify-center cursor-pointer"
            >
              {btn}
            </button>
          ))}
        </div>

        {/* Kolom 4: Action (Clear & Backspace) */}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={handleClear}
            title="Bersihkan"
            className="flex-1 min-h-12 rounded-2xl bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 active:scale-95 font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs"
          >
            <RotateCcw className="w-4 h-4" />
            <span>C</span>
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            title="Hapus satu angka"
            className="flex-1 min-h-12 rounded-2xl bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 active:scale-95 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
