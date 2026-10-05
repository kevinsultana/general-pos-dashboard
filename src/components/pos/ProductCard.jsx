"use client";

import { Package } from "lucide-react";
import { fmt } from "../../lib/posUtils";

/**
 * Kartu produk di grid POS.
 *
 * Props:
 *   product – objek produk: { id, name, isActive, variants: [{ id, price, costPrice, name }] }
 *   onClick – (product) => void  dipanggil saat kartu diklik
 */
export default function ProductCard({ product, onClick }) {
  const firstVariant = product.variants?.[0];
  const hasMultiVariant = product.variants?.length > 1;
  const isOutOfStock = product.isActive === false;

  return (
    <button
      type="button"
      onClick={() => onClick(product)}
      className={`p-4 rounded-2xl border transition-all text-left group relative overflow-hidden ${
        isOutOfStock
          ? "bg-slate-100/90 border-slate-200/90 opacity-70 cursor-not-allowed hover:border-slate-300"
          : "bg-white/80 backdrop-blur-xl border-white/90 shadow-sm hover:shadow-md hover:border-amber-200 hover:-translate-y-0.5 active:scale-95 cursor-pointer"
      }`}
    >
      {/* Icon produk & badge habis */}
      <div className="flex items-start justify-between mb-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
            isOutOfStock
              ? "bg-slate-200 text-slate-400"
              : "bg-amber-50 border border-amber-100 text-amber-600 group-hover:bg-amber-100"
          }`}
        >
          <Package className="w-5 h-5" />
        </div>
        {isOutOfStock && (
          <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 text-[10px] font-black tracking-wide border border-rose-200">
            HABIS
          </span>
        )}
      </div>

      {/* Nama produk */}
      <p
        className={`text-xs font-black line-clamp-2 leading-snug ${
          isOutOfStock
            ? "text-slate-500 line-through decoration-slate-400"
            : "text-slate-900"
        }`}
      >
        {product.name}
      </p>

      {/* Harga & badge varian */}
      <div className="mt-2 flex items-center justify-between gap-1">
        <span
          className={`text-xs font-extrabold ${
            isOutOfStock ? "text-slate-400" : "text-emerald-700"
          }`}
        >
          {firstVariant ? fmt(firstVariant.price) : "—"}
        </span>
        {hasMultiVariant && (
          <span className="px-1.5 py-0.5 rounded-md bg-violet-100 text-violet-700 text-[10px] font-bold border border-violet-200">
            {product.variants.length} varian
          </span>
        )}
      </div>
    </button>
  );
}
