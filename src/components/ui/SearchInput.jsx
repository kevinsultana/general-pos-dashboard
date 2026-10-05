"use client";

import { forwardRef } from "react";
import { Search, X } from "lucide-react";
import { cn } from "../../lib/utils";

/**
 * SearchInput - Input pencarian reusable bergaya clean glassmorphism.
 *
 * Dilengkapi icon pencarian, tombol hapus teks instan, dan kompatibilitas dark mode.
 *
 * @param {object} props
 * @param {string} props.value - nilai input
 * @param {Function} props.onChange - callback saat nilai berubah (e) => void
 * @param {Function} [props.onClear] - callback saat tombol clear diklik
 * @param {string} [props.placeholder="Cari..."]
 * @param {string} [props.className]
 */
const SearchInput = forwardRef(function SearchInput(
  {
    value = "",
    onChange,
    onClear,
    placeholder = "Cari...",
    className,
    disabled = false,
    ...rest
  },
  ref
) {
  const handleClear = () => {
    if (onClear) {
      onClear();
    } else if (onChange) {
      onChange({ target: { value: "" } });
    }
  };

  return (
    <div className={cn("relative flex items-center w-full", className)}>
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none shrink-0" />
      <input
        ref={ref}
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "w-full pl-10 pr-9 py-2.5 rounded-2xl text-xs font-semibold outline-none transition-all",
          "bg-white/80 backdrop-blur-xl",
          "border border-white/80",
          "text-slate-900 placeholder:text-slate-400",
          "focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400/60",
          "shadow-xs disabled:opacity-60 disabled:cursor-not-allowed"
        )}
        {...rest}
      />
      {value && !disabled && (
        <button
          type="button"
          onClick={handleClear}
          title="Hapus teks"
          className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
});

export default SearchInput;
