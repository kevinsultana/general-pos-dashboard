"use client";

import { ChevronRight } from "lucide-react";
import { fmt } from "../../lib/posUtils";
import GlassModal from "../ui/GlassModal";

/**
 * VariantPickerModal - Modal pemilihan varian produk kasir.
 *
 * Menggunakan GlassModal dengan estetika Modern Clean Glassmorphism.
 *
 * @param {object} props
 * @param {object|null} props.product - produk dengan variants[]
 * @param {Function} props.onSelect - (product, variant) => void
 * @param {Function} props.onClose - () => void
 */
export default function VariantPickerModal({ product, onSelect, onClose }) {
  if (!product) return null;

  return (
    <GlassModal
      isOpen={Boolean(product)}
      onClose={onClose}
      title="Pilih Varian"
      description={product.name}
      size="sm"
    >
      <div className="space-y-2 py-1 max-h-80 overflow-y-auto custom-scrollbar">
        {product.variants?.map((v, vIdx) => (
          <button
            key={v.id || `variant-${vIdx}`}
            type="button"
            onClick={() => {
              onSelect(product, v);
              onClose();
            }}
            className="w-full min-h-12 flex items-center justify-between p-3.5 rounded-2xl bg-white/70 border border-slate-200/80 hover:bg-amber-50/80 hover:border-amber-400/60 transition-all group text-left cursor-pointer active:scale-[0.99]"
          >
            <div className="min-w-0 pr-2">
              <p className="text-sm font-black text-slate-900 group-hover:text-amber-800 truncate">
                {v.name}
              </p>
              {v.costPrice ? (
                <p className="text-[11px] text-slate-400 mt-0.5">
                  HPP: {fmt(v.costPrice)}
                </p>
              ) : null}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-sm font-black text-emerald-700">
                {fmt(v.price)}
              </span>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-amber-500 transition-colors" />
            </div>
          </button>
        ))}
      </div>
    </GlassModal>
  );
}
