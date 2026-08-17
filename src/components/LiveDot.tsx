import { cx } from "@/components/primitives";

/** Status dot with an expanding ring while live. */
export function LiveDot({
  live = true,
  size = 8,
  color = "var(--color-mint)",
}: {
  live?: boolean;
  size?: number;
  color?: string;
}) {
  const tone = live ? color : "var(--color-dim)";
  return (
    <span
      className="relative inline-flex shrink-0"
      style={{ width: size, height: size }}
    >
      {live ? (
        <span
          className="absolute inset-0 rounded-full"
          style={{ background: tone, animation: "pulse-ring 2s ease-out infinite" }}
        />
      ) : null}
      <span
        className="relative inline-block size-full rounded-full"
        style={{ background: tone }}
      />
    </span>
  );
}

/** Dot + label, used in headers. */
export function LivePill({ live, label }: { live: boolean; label?: string }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-2 rounded-full px-2.5 py-1.5 text-[11px] font-bold tracking-wide uppercase"
      )}
      style={{
        background: live
          ? "color-mix(in oklab, var(--color-mint) 12%, transparent)"
          : "var(--color-raised)",
        color: live ? "var(--color-mint)" : "var(--color-fog)",
      }}
    >
      <LiveDot live={live} size={7} />
      {label ?? (live ? "Ao vivo" : "Pausado")}
    </span>
  );
}
