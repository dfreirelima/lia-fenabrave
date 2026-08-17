import { cx } from "@/components/primitives";

/**
 * App mark — Nexa View logo used across login and navigation.
 */
export function ViewMark({
  size = 40,
  className,
  inverted = false,
}: {
  size?: number;
  className?: string;
  /** Solid white mark for coloured surfaces. */
  inverted?: boolean;
}) {
  return (
    <img
      src="/logo.svg"
      alt="Nexa View"
      width={size}
      height={size}
      draggable={false}
      className={cx("select-none", className)}
      style={{
        width: size,
        height: size,
        filter: inverted ? "brightness(0) invert(1)" : undefined,
      }}
    />
  );
}

/** @deprecated Use ViewMark — kept for legacy assets only. */
export function HolmesMark({
  size = 40,
  className,
  inverted = false,
}: {
  size?: number;
  className?: string;
  /** Solid white mark for coloured surfaces. Login keeps the official gradient. */
  inverted?: boolean;
}) {
  return (
    <img
      src="/holmes-mark.png"
      alt="Holmes"
      width={size}
      height={size}
      draggable={false}
      className={cx("select-none", className)}
      style={{
        width: size,
        height: size,
        filter: inverted ? "brightness(0) invert(1)" : undefined,
      }}
    />
  );
}

/**
 * Authorship signature. Deliberately quiet: the monitor belongs to the event,
 * the credit sits underneath it rather than competing with the data.
 *
 * To reword the credit, change `label` — "by", "desenvolvido por" and
 * "uma solução" all read correctly ahead of the logo.
 */
export function NexaSignature({
  label = "desenvolvido por",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "flex items-center justify-center gap-2 opacity-45 transition-opacity hover:opacity-80",
        className
      )}
    >
      <span className="text-[10px] font-medium tracking-wide text-fog">
        {label}
      </span>
      {/* The light variant is the white wordmark, made for dark surfaces. */}
      <img src="/nexa.svg" alt="Nexa" className="h-3.5 w-auto" />
    </div>
  );
}
