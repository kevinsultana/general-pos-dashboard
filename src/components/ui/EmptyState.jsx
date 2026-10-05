"use client";

import { PackageOpen } from "lucide-react";
import { cn } from "../../lib/utils";

/**
 * EmptyState - Komponen placeholder saat data kosong atau hasil pencarian nihil.
 *
 * @param {object} props
 * @param {React.ReactNode} [props.icon] - Icon visual utama
 * @param {string} props.title - Judul kondisi kosong
 * @param {string} [props.description] - Penjelasan tambahan atau saran tindakan
 * @param {React.ReactNode} [props.action] - Tombol aksi opsional (cth: "Muat Ulang", "Tambah Produk")
 * @param {string} [props.className]
 */
export default function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center rounded-3xl",
        "bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm",
        "border border-dashed border-slate-200 dark:border-slate-800",
        className
      )}
    >
      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 flex items-center justify-center mb-3">
        {icon || <PackageOpen className="w-6 h-6" />}
      </div>
      <h4 className="text-sm font-black text-slate-800 dark:text-slate-200">
        {title}
      </h4>
      {description && (
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
