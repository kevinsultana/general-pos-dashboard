"use client";

import { X, ChevronRight } from "lucide-react";
import { fmt } from "../../lib/posUtils";

/**
 * Modal pilih varian produk.
 *
 * Props:
 *   product  – objek produk dengan field `name` dan `variants[]`
 *   onSelect – (product, variant) => void  dipanggil saat varian dipilih
 *   onClose  – () => void
 */
export default function VariantPickerModal({ product, onSelect, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xs rounded-3xl bg-white/95 backdrop-blur-2xl border border-white/90 shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-black text-slate-900">Pilih Varian</h3>
            <p className="text-xs text-slate-500 mt-0.5 truncate max-w-45">
              {product.name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Daftar varian */}
        <div className="p-3 space-y-1.5 max-h-72 overflow-y-auto">
          {product.variants.map((v, vIdx) => (
            <button
              key={v.id || `variant-${vIdx}`}
              type="button"
              onClick={() => onSelect(product, v)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-amber-50 border border-transparent hover:border-amber-200 transition-all group text-left"
            >
              <div>
                <p className="text-sm font-bold text-slate-900 group-hover:text-amber-800">
                  {v.name}
                </p>
                <p className="text-[11px] text-slate-400">
                  Modal: {fmt(v.costPrice)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-emerald-700">
                  {fmt(v.price)}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-amber-500 transition-colors" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
