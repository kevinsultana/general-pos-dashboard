"use client";

import { memo } from "react";
import { Package } from "lucide-react";
import { fmt } from "../../lib/posUtils";
import Badge from "../ui/Badge";
import { cn } from "../../lib/utils";

/**
 * ProductCard - Kartu produk pada katalog grid kasir POS.
 *
 * Dilindungi React.memo agar tidak memicu re-render massal saat state keranjang/shift berubah.
 * Desain Modern Clean Glassmorphism dengan touch target ergonomis (min 48px).
 *
 * @param {object} props
 * @param {object} props.product - data produk ({ id, name, isActive, variants })
 * @param {Function} props.onClick - handler klik kartu (product) => void
 */
function ProductCard({ product, onClick }) {
  const firstVariant = product.variants?.[0];
  const hasMultiVariant = product.variants?.length > 1;
  const isOutOfStock = product.isActive === false;

  return (
    <button
      type="button"
      onClick={() => onClick(product)}
      disabled={isOutOfStock}
      className={cn(
        "p-4 rounded-3xl border transition-all text-left group relative overflow-hidden flex flex-col justify-between",
        "min-h-30 select-none",
        isOutOfStock
          ? "bg-slate-100/70 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800/80 opacity-60 cursor-not-allowed"
          : "bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-white/70 dark:border-white/10 shadow-xs hover:shadow-md hover:border-amber-400/60 dark:hover:border-amber-400/40 hover:-translate-y-0.5 active:scale-95 cursor-pointer"
      )}
    >
      {/* Bagian Atas: Icon & Status Badge */}
      <div className="flex items-start justify-between gap-2 mb-2.5 w-full">
        <div
          className={cn(
            "w-10 h-10 rounded-2xl flex items-center justify-center transition-colors shrink-0",
            isOutOfStock
              ? "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
              : "bg-amber-500/10 dark:bg-amber-400/10 border border-amber-300/40 dark:border-amber-500/20 text-amber-600 dark:text-amber-400 group-hover:bg-amber-500/20"
          )}
        >
          <Package className="w-5 h-5" />
        </div>

        {isOutOfStock ? (
          <Badge variant="danger" size="sm" dot>
            HABIS
          </Badge>
        ) : hasMultiVariant ? (
          <Badge variant="purple" size="sm">
            {product.variants.length} varian
          </Badge>
        ) : null}
      </div>

      {/* Bagian Tengah: Nama Produk */}
      <div className="flex-1 min-w-0">
        <h4
          className={cn(
            "text-xs sm:text-sm font-black line-clamp-2 leading-snug tracking-tight",
            isOutOfStock
              ? "text-slate-400 dark:text-slate-600 line-through decoration-slate-400"
              : "text-slate-900 dark:text-white group-hover:text-amber-800 dark:group-hover:text-amber-300 transition-colors"
          )}
        >
          {product.name}
        </h4>
      </div>

      {/* Bagian Bawah: Harga Varian Pertama */}
      <div className="mt-3 flex items-center justify-between w-full pt-1.5 border-t border-slate-100 dark:border-slate-800/80">
        <span
          className={cn(
            "text-xs font-black",
            isOutOfStock
              ? "text-slate-400 dark:text-slate-600"
              : "text-emerald-700 dark:text-emerald-400"
          )}
        >
          {firstVariant ? fmt(firstVariant.price) : "—"}
        </span>

        {hasMultiVariant && (
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
            Pilih &rarr;
          </span>
        )}
      </div>
    </button>
  );
}

// Bandingkan props secara shallow untuk performa rendering optimal
export default memo(ProductCard, (prev, next) => {
  return (
    prev.product?.id === next.product?.id &&
    prev.product?.name === next.product?.name &&
    prev.product?.isActive === next.product?.isActive &&
    prev.product?.variants?.length === next.product?.variants?.length &&
    prev.onClick === next.onClick
  );
});
