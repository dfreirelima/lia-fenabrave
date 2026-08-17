import { useCallback, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { motion, useMotionValue, animate, useTransform } from "motion/react";
import { LogOut, RefreshCw } from "lucide-react";
import { cx } from "@/components/primitives";
import { haptics } from "@/lib/haptics";
import { usePulse } from "@/lib/store";
import { NexaSignature } from "@/components/Brand";

const PULL_TRIGGER = 72;
const PULL_MAX = 120;

/**
 * Screen shell: ambient glow, sticky header, scroll body and pull-to-refresh.
 * Every route renders inside one so the chrome stays identical.
 */
export function Screen({
  header,
  glow = "var(--color-brand)",
  onRefresh,
  children,
  padded = true,
}: {
  header?: ReactNode;
  glow?: string;
  onRefresh?: () => Promise<unknown> | void;
  children: ReactNode;
  padded?: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const pull = useMotionValue(0);

  const indicatorOpacity = useTransform(pull, [0, PULL_TRIGGER * 0.5], [0, 1]);
  const indicatorRotate = useTransform(pull, [0, PULL_MAX], [0, 300]);
  const indicatorScale = useTransform(pull, [0, PULL_TRIGGER], [0.6, 1]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    // Only arm the gesture when already at the very top of the list.
    startY.current = (scrollRef.current?.scrollTop ?? 0) <= 0 ? e.touches[0].clientY : null;
  }, []);

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (startY.current === null || refreshing || !onRefresh) return;
      const delta = e.touches[0].clientY - startY.current;
      if (delta <= 0) {
        pull.set(0);
        return;
      }
      // Rubber-band: each extra pixel of finger travel moves less content.
      pull.set(Math.min(PULL_MAX, delta * 0.45));
    },
    [pull, refreshing, onRefresh]
  );

  const onTouchEnd = useCallback(async () => {
    const value = pull.get();
    startY.current = null;
    if (!onRefresh || refreshing) {
      animate(pull, 0, { type: "spring", stiffness: 400, damping: 34 });
      return;
    }
    if (value >= PULL_TRIGGER * 0.8) {
      haptics.success();
      setRefreshing(true);
      animate(pull, 44, { type: "spring", stiffness: 400, damping: 34 });
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        animate(pull, 0, { type: "spring", stiffness: 400, damping: 34 });
      }
    } else {
      animate(pull, 0, { type: "spring", stiffness: 400, damping: 34 });
    }
  }, [pull, onRefresh, refreshing]);

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      {/* Ambient glow — a soft wash of the screen's accent behind the header. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 h-80 w-[140%] -translate-x-1/2 opacity-45 blur-3xl"
        style={{
          background: `radial-gradient(ellipse at center, ${glow} 0%, transparent 62%)`,
        }}
      />

      {header ? (
        <header className="relative z-20 shrink-0 px-4 pt-safe pb-2">{header}</header>
      ) : null}

      {/* Pull-to-refresh indicator, revealed as the content slides down. */}
      {onRefresh ? (
        <motion.div
          className="pointer-events-none absolute inset-x-0 z-10 flex justify-center"
          style={{ top: 92, opacity: indicatorOpacity }}
        >
          <motion.span
            className="grid size-9 place-items-center rounded-full glass hairline"
            style={{ scale: indicatorScale }}
          >
            <motion.span
              style={{ rotate: refreshing ? undefined : indicatorRotate }}
              className={cx(refreshing && "animate-spin")}
            >
              <RefreshCw size={15} style={{ color: "var(--color-brand)" }} />
            </motion.span>
          </motion.span>
        </motion.div>
      ) : null}

      <motion.div
        ref={scrollRef}
        className={cx("scroll-area relative z-10 flex-1", padded && "px-4")}
        style={{ y: pull }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
      >
        {children}
        <NexaSignature className="mt-8 mb-2" />
        {/* Clears the floating bottom nav. */}
        <div className="h-28" aria-hidden />
      </motion.div>
    </div>
  );
}

/** Standard screen title block. */
export function ScreenTitle({
  eyebrow,
  title,
  trailing,
}: {
  eyebrow?: string;
  title: string;
  trailing?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-[11px] font-bold tracking-[0.14em] text-dim uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-1 truncate text-[28px] leading-tight font-extrabold tracking-tight text-chalk">
          {title}
        </h1>
      </div>
      <div className="flex shrink-0 items-center gap-2 pt-1">
        {trailing}
        <ExitButton />
      </div>
    </div>
  );
}

/** Returns to the PIN screen and forgets the session. */
export function ExitButton() {
  const lock = usePulse((s) => s.lock);
  const navigate = useNavigate();

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.92 }}
      onClick={() => {
        haptics.medium();
        navigate("/", { replace: true });
        lock();
      }}
      aria-label="Sair"
      className="inline-flex items-center gap-1.5 rounded-full bg-raised px-3 py-1.5 text-[11px] font-bold text-fog hairline"
    >
      <LogOut size={13} strokeWidth={2.4} />
      Sair
    </motion.button>
  );
}
