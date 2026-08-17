import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useAnimationControls } from "motion/react";
import { Delete } from "lucide-react";
import { usePulse } from "@/lib/store";
import { haptics } from "@/lib/haptics";
import { cx } from "@/components/primitives";
import { NexaSignature, ViewMark } from "@/components/Brand";

const PIN_LENGTH = 4;
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"] as const;

export function PinGate({ children }: { children: React.ReactNode }) {
  const unlocked = usePulse((s) => s.unlocked);
  const unlock = usePulse((s) => s.unlock);
  const expected = import.meta.env.VITE_MONITOR_PIN ?? "2580";

  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const shake = useAnimationControls();

  const submit = useCallback(
    async (value: string) => {
      if (value === expected) {
        haptics.success();
        setPin("");
        unlock();
      } else {
        haptics.error();
        setError(true);
        await shake.start({
          x: [0, -10, 10, -8, 8, -4, 0],
          transition: { duration: 0.45 },
        });
        setPin("");
      }
    },
    [expected, unlock, shake]
  );

  const press = useCallback((key: string) => {
    if (key === "del") {
      haptics.light();
      setError(false);
      setPin((p) => p.slice(0, -1));
      return;
    }
    if (!/^\d$/.test(key)) return;

    haptics.light();
    setError(false);
    setPin((p) => (p.length >= PIN_LENGTH ? p : p + key));
  }, []);

  // Validate in an effect, never inside the state updater — calling `unlock()`
  // during render would update the store while React is rendering.
  useEffect(() => {
    if (pin.length === PIN_LENGTH) void submit(pin);
  }, [pin, submit]);

  // Physical keyboards work too — handy when the monitor runs on a laptop.
  useEffect(() => {
    if (unlocked) return;
    const onKey = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) press(e.key);
      else if (e.key === "Backspace") press("del");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [press, unlocked]);

  if (unlocked) return <>{children}</>;

  return (
    <div className="relative flex h-full flex-col items-center justify-between overflow-hidden bg-ink px-8 pt-safe pb-safe">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[130%] -translate-x-1/2 opacity-40 blur-3xl"
        style={{
          background:
            "radial-gradient(ellipse at center, var(--color-brand) 0%, transparent 62%)",
        }}
      />

      {/* Brand */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative flex flex-1 flex-col items-center justify-center"
      >
        <div
          className="grid size-20 place-items-center rounded-3xl"
          style={{
            background:
              "linear-gradient(150deg, color-mix(in oklab, var(--color-brand) 16%, transparent), color-mix(in oklab, var(--color-violet) 14%, transparent))",
          }}
        >
          <ViewMark size={46} />
        </div>
        <h1 className="mt-5 text-[26px] leading-tight font-extrabold tracking-tight text-chalk">
          Nexa View
        </h1>
        <p className="mt-2 text-[13px] text-fog">Monitor ao vivo · Fenabrave</p>

        {/* PIN dots */}
        <motion.div animate={shake} className="mt-9 flex gap-3.5">
          {Array.from({ length: PIN_LENGTH }, (_, i) => {
            const filled = i < pin.length;
            return (
              <motion.span
                key={i}
                animate={{ scale: filled ? 1 : 0.72 }}
                transition={{ type: "spring", stiffness: 500, damping: 26 }}
                className="size-3.5 rounded-full"
                style={{
                  background: error
                    ? "var(--color-coral)"
                    : filled
                      ? "var(--color-brand)"
                      : "var(--color-raised)",
                }}
              />
            );
          })}
        </motion.div>

        <div className="h-6">
          <AnimatePresence>
            {error ? (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-3 text-[12px] font-semibold text-coral"
              >
                PIN incorreto
              </motion.p>
            ) : null}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Keypad */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative mb-6 grid w-full max-w-[300px] grid-cols-3 gap-3"
      >
        {KEYS.map((key, i) =>
          key === "" ? (
            <span key={`gap-${i}`} />
          ) : (
            <motion.button
              key={key}
              type="button"
              onClick={() => press(key)}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 600, damping: 28 }}
              aria-label={key === "del" ? "Apagar" : key}
              className={cx(
                "grid h-16 place-items-center rounded-3xl text-[24px] font-semibold tabular-nums text-chalk",
                key === "del" ? "text-fog" : "bg-surface hairline"
              )}
            >
              {key === "del" ? <Delete size={22} /> : key}
            </motion.button>
          )
        )}
      </motion.div>

      <NexaSignature className="relative mb-5" />
    </div>
  );
}
