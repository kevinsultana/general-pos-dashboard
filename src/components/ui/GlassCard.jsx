"use client";

import { cn } from "../../lib/utils";

/**
 * GlassCard - Kontainer kartu dengan estetika Modern Clean Glassmorphism.
 *
 * Mendukung dark mode, backdrop-blur, border semi-transparan, dan kontras teks tinggi (WCAG AA).
 *
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @param {string} [props.className]
 * @param {"default" | "subtle" | "elevated" | "interactive"} [props.variant="default"]
 * @param {boolean} [props.clickable=false]
 * @param {Function} [props.onClick]
 * @param {string} [props.as="div"]
 */
export default function GlassCard({
  children,
  className,
  variant = "default",
  clickable = false,
  onClick,
  as: Component = "div",
  ...rest
}) {
  const variantStyles = {
    default:
      "bg-white/75 dark:bg-slate-900/70 border-white/30 dark:border-white/10 shadow-[0_8px_32px_0_rgba(15,23,42,0.06)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]",
    subtle:
      "bg-white/50 dark:bg-slate-900/50 border-white/20 dark:border-white/5 shadow-xs",
    elevated:
      "bg-white/85 dark:bg-slate-900/80 border-white/40 dark:border-white/15 shadow-[0_12px_40px_0_rgba(15,23,42,0.1)] dark:shadow-[0_12px_40px_0_rgba(0,0,0,0.4)]",
    interactive:
      "bg-white/75 dark:bg-slate-900/70 border-white/30 dark:border-white/10 shadow-sm hover:shadow-md hover:border-amber-400/50 dark:hover:border-amber-400/40 hover:-translate-y-0.5 active:scale-[0.99] cursor-pointer",
  };

  return (
    <Component
      onClick={onClick}
      className={cn(
        "rounded-3xl backdrop-blur-xl border transition-all text-slate-900 dark:text-slate-100",
        variantStyles[variant] || variantStyles.default,
        clickable && !variant.includes("interactive") && "cursor-pointer active:scale-[0.99]",
        className
      )}
      {...rest}
    >
      {children}
    </Component>
  );
}
