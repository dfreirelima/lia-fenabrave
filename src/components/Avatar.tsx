import { useMemo } from "react";
import { initials } from "@/lib/format";
import { cx } from "@/components/primitives";

/** Deterministic hue per name, so an operator keeps the same colour anywhere. */
const PALETTE = [
  "var(--color-azure)",
  "var(--color-mint)",
  "var(--color-violet)",
  "var(--color-amber)",
  "var(--color-coral)",
];

export function colorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

export function Avatar({
  name,
  size = 48,
  live = false,
  className,
}: {
  name: string;
  size?: number;
  live?: boolean;
  className?: string;
}) {
  const color = useMemo(() => colorForName(name || "?"), [name]);

  return (
    <div className={cx("relative shrink-0", className)} style={{ width: size, height: size }}>
      <div
        className="grid size-full place-items-center rounded-full font-extrabold"
        style={{
          background: `color-mix(in oklab, ${color} 16%, transparent)`,
          color,
          fontSize: size * 0.34,
        }}
      >
        {initials(name)}
      </div>
      {live ? (
        <span
          className="absolute -right-0.5 -bottom-0.5 block rounded-full"
          style={{
            width: size * 0.28,
            height: size * 0.28,
            background: "var(--color-mint)",
            // Punches a hole in the avatar so the dot reads as separate.
            boxShadow: "0 0 0 3px var(--color-surface)",
          }}
        />
      ) : null}
    </div>
  );
}
