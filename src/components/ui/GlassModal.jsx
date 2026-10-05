"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

/**
 * GlassModal - Dialog modal shell dengan estetika Modern Clean Glassmorphism.
 *
 * Mendukung dark mode, escape key, focus lock ringkas, dan backdrop blur.
 *
 * @param {object} props
 * @param {boolean} props.isOpen - status buka/tutup modal
 * @param {Function} props.onClose - handler saat modal ditutup
 * @param {string} [props.title] - judul modal (opsional)
 * @param {string} [props.description] - deskripsi singkat di bawah judul (opsional)
 * @param {React.ReactNode} [props.icon] - icon pendamping judul (opsional)
 * @param {React.ReactNode} props.children - konten modal
 * @param {React.ReactNode} [props.footer] - konten footer tombol aksi (opsional)
 * @param {"sm" | "md" | "lg" | "xl" | "2xl"} [props.size="md"] - lebar modal
 * @param {string} [props.className] - custom class untuk wrapper konten
 * @param {boolean} [props.hideCloseButton=false] - sembunyikan tombol close 'X'
 */
export default function GlassModal({
  isOpen,
  onClose,
  title,
  description,
  icon,
  children,
  footer,
  size = "md",
  className,
  hideCloseButton = false,
}) {
  const modalRef = useRef(null);

  // Tangani tombol ESC untuk menutup modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Kunci scrolling body saat modal terbuka
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "glass-modal-title" : undefined}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose?.();
        }
      }}
    >
      <div
        ref={modalRef}
        className={cn(
          "w-full rounded-3xl overflow-hidden flex flex-col",
          "bg-white/95 backdrop-blur-2xl",
          "border border-white/90",
          "shadow-2xl",
          "animate-in zoom-in-95 duration-200",
          "max-h-[90vh]",
          sizeClasses[size] || sizeClasses.md,
          className
        )}
      >
        {/* Header Modal */}
        {(title || !hideCloseButton) && (
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 shrink-0 bg-slate-50/80">
            <div className="flex items-center gap-3 min-w-0 pr-2">
              {icon && (
                <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-300 text-amber-700 flex items-center justify-center shrink-0">
                  {icon}
                </div>
              )}
              <div className="min-w-0">
                {title && (
                  <h3
                    id="glass-modal-title"
                    className="text-base font-black text-slate-900 truncate tracking-tight"
                  >
                    {title}
                  </h3>
                )}
                {description && (
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {description}
                  </p>
                )}
              </div>
            </div>

            {!hideCloseButton && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup modal"
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Body Modal (Scrollable) */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-6 text-slate-800">
          {children}
        </div>

        {/* Footer Modal (Opsional) */}
        {footer && (
          <div className="px-5 sm:px-6 py-4 bg-slate-50/80 border-t border-slate-100 shrink-0 flex items-center justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
