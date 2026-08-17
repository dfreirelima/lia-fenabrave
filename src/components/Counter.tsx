import { useEffect, useRef } from "react";
import { animate, useMotionValue } from "motion/react";

/**
 * A number that springs to its new value instead of snapping.
 * Writes straight to the DOM node so a 3s poll never re-renders the tree.
 */
export function Counter({
  value,
  decimals = 0,
  suffix = "",
  className,
}: {
  value: number | null | undefined;
  decimals?: number;
  suffix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const mv = useMotionValue(0);
  const target = value ?? 0;

  useEffect(() => {
    const controls = animate(mv, target, {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = v.toFixed(decimals);
      },
    });
    return () => controls.stop();
  }, [target, decimals, mv]);

  if (value === null || value === undefined) {
    return <span className={className}>—</span>;
  }

  return (
    <span className={className} data-metric>
      <span ref={ref}>0</span>
      {suffix}
    </span>
  );
}
