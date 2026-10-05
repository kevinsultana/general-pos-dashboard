"use client";

import { cn } from "../../lib/utils";

/**
 * Badge - Label status dengan gaya Clean Glassmorphism.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @param {"default" | "primary" | "success" | "warning" | "danger" | "purple" | "neutral"} [props.variant="default"]
 * @param {"sm" | "md" | "lg"} [props.size="md"]
 * @param {boolean} [props.dot=false] - tampilkan titik indikator status
 * @param {boolean} [props.pulse=false] - animasi pulse pada titik indikator
 * @param {string} [props.className]
 */
export default function Badge({
  children,
  variant = "default",
  size = "md",
  dot = false,
  pulse = false,
  className,
  ...rest
}) {
  const variantStyles = {
    default:
      "bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-700/80",
    primary:
      "bg-amber-100/80 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border-amber-300/80 dark:border-amber-800/50",
    success:
      "bg-emerald-100/80 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 border-emerald-300/80 dark:border-emerald-800/50",
    warning:
      "bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/40",
    danger:
      "bg-rose-100/80 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-300/80 dark:border-rose-800/50",
    purple:
      "bg-violet-100/80 dark:bg-violet-950/40 text-violet-800 dark:text-violet-300 border-violet-300/80 dark:border-violet-800/50",
    neutral:
      "bg-white/70 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200/60 dark:border-slate-700/60",
  };

  const dotColors = {
    default: "bg-slate-500",
    primary: "bg-amber-500",
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    danger: "bg-rose-500",
    purple: "bg-violet-500",
    neutral: "bg-slate-400",
  };

  const sizeStyles = {
    sm: "px-1.5 py-0.5 text-[10px] gap-1",
    md: "px-2 py-0.5 text-[11px] gap-1.5",
    lg: "px-2.5 py-1 text-xs gap-1.5",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-extrabold rounded-lg border backdrop-blur-xs select-none tracking-tight",
        sizeStyles[size] || sizeStyles.md,
        variantStyles[variant] || variantStyles.default,
        className
      )}
      {...rest}
    >
      {dot && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full shrink-0",
            dotColors[variant] || dotColors.default,
            pulse && "animate-pulse"
          )}
        />
      )}
      {children}
    </span>
  );
}
