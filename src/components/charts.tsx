import type { ReactNode } from "react";
import { useMemo } from "react";
import { motion } from "motion/react";

/* ------------------------------------------------------------------ *
 * ActivityChart — histogram of executions per time bucket.
 *
 * Bars, not an area curve: event traffic is bursty, so most buckets are
 * legitimately zero. A smoothed line turns that into a misleading plateau,
 * while bars read correctly whether the data is sparse or dense.
 * ------------------------------------------------------------------ */
export function ActivityChart({
  data,
  color = "var(--color-amber)",
  height = 88,
  live = false,
}: {
  data: number[];
  color?: string;
  height?: number;
  live?: boolean;
}) {
  const { bars, max, empty } = useMemo(() => {
    const values = data.length > 0 ? data : [0];
    const max = Math.max(...values, 1);
    return {
      bars: values,
      max,
      empty: values.every((v) => v === 0),
    };
  }, [data]);

  const lastIndex = bars.length - 1;

  return (
    <div className="relative flex w-full items-end gap-[3px]" style={{ height }}>
      {bars.map((value, i) => {
        const ratio = value / max;
        // Empty buckets keep a 3px stub so the time axis stays readable.
        const barHeight = value === 0 ? 3 : Math.max(6, ratio * height);
        const isLast = i === lastIndex;
        const recency = i / Math.max(1, lastIndex);

        return (
          <motion.div
            key={i}
            className="flex-1 rounded-full"
            initial={{ height: 3, opacity: 0 }}
            animate={{ height: barHeight, opacity: 1 }}
            transition={{
              delay: i * 0.012,
              duration: 0.5,
              ease: [0.22, 1, 0.36, 1],
            }}
            style={{
              background: value === 0 ? "var(--color-line)" : color,
              // Older buckets fade back so the eye lands on recent activity.
              opacity: value === 0 ? 1 : 0.35 + recency * 0.65,
              boxShadow:
                isLast && value > 0 && live ? `0 0 12px ${color}` : undefined,
            }}
          />
        );
      })}

      {empty ? (
        <span className="absolute inset-0 grid place-items-center text-[11px] font-medium text-dim">
          Sem execuções na janela
        </span>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * RingGauge — circular percentage.
 * ------------------------------------------------------------------ */
export function RingGauge({
  value,
  size = 62,
  stroke = 6,
  color = "var(--color-mint)",
  children,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value)) / 100;

  return (
    <div
      className="relative grid shrink-0 place-items-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-raised)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - pct) }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * SplitBar — two-segment proportional bar.
 * ------------------------------------------------------------------ */
export function SplitBar({
  left,
  right,
  leftColor = "var(--color-azure)",
  rightColor = "var(--color-mint)",
}: {
  left: number;
  right: number;
  leftColor?: string;
  rightColor?: string;
}) {
  const total = left + right || 1;
  const leftPct = (left / total) * 100;

  return (
    <div className="flex h-2.5 w-full gap-1 overflow-hidden rounded-full">
      <motion.div
        className="h-full rounded-full"
        style={{ background: leftColor }}
        initial={{ width: "50%" }}
        animate={{ width: `${leftPct}%` }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.div
        className="h-full flex-1 rounded-full"
        style={{ background: rightColor }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}
