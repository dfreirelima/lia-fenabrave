import type { ComponentProps, ReactNode } from "react";
import { motion } from "motion/react";

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

/* ------------------------------------------------------------------ *
 * Card — the base surface. Large radius + hairline, no heavy borders.
 * ------------------------------------------------------------------ */
export function Card({
  className,
  children,
  ...props
}: ComponentProps<typeof motion.div>) {
  return (
    <motion.div
      className={cx(
        "rounded-card bg-surface hairline relative overflow-hidden",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ *
 * Chip — compact status pill, tinted from a single colour token.
 * ------------------------------------------------------------------ */
export function Chip({
  label,
  color = "var(--color-brand)",
  muted = false,
  icon,
  compact = false,
  className,
}: {
  label: ReactNode;
  color?: string;
  muted?: boolean;
  icon?: ReactNode;
  compact?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full font-semibold leading-none whitespace-nowrap",
        compact ? "gap-1 px-1.5 py-0.5 text-[10px]" : "gap-1.5 px-2.5 py-1 text-[11px]",
        className
      )}
      style={
        muted
          ? { background: "var(--color-raised)", color: "var(--color-fog)" }
          : {
              background: `color-mix(in oklab, ${color} 14%, transparent)`,
              color,
            }
      }
    >
      {icon}
      {label}
    </span>
  );
}

/* ------------------------------------------------------------------ *
 * SectionHeader — title + optional trailing action.
 * ------------------------------------------------------------------ */
export function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-baseline justify-between px-1">
      <h2 className="text-[17px] font-bold tracking-tight text-chalk">{title}</h2>
      {action}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Pressable — a button with a physical spring press.
 * ------------------------------------------------------------------ */
export function Pressable({
  className,
  children,
  ...props
}: ComponentProps<typeof motion.button>) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={cx("select-none text-left", className)}
      {...props}
    >
      {children}
    </motion.button>
  );
}

/* ------------------------------------------------------------------ *
 * EmptyState / ErrorNote
 * ------------------------------------------------------------------ */
export function EmptyState({
  icon,
  title,
  subtitle,
}: {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center px-8 py-16 text-center"
    >
      {icon ? (
        <div className="mb-4 grid size-14 place-items-center rounded-2xl bg-raised text-dim">
          {icon}
        </div>
      ) : null}
      <p className="text-[15px] font-bold text-chalk">{title}</p>
      {subtitle ? <p className="mt-1.5 text-[13px] text-fog">{subtitle}</p> : null}
    </motion.div>
  );
}

export function ErrorNote({ message }: { message: string }) {
  return (
    <div
      className="mb-3 rounded-2xl px-4 py-3 text-[12px] font-medium"
      style={{
        background: "color-mix(in oklab, var(--color-coral) 12%, transparent)",
        color: "var(--color-coral)",
      }}
    >
      {message}
    </div>
  );
}
