import { NavLink, useLocation } from "react-router";
import { motion } from "motion/react";
import { Activity, MessagesSquare, Radar, Users } from "lucide-react";
import { usePulse } from "@/lib/store";
import { haptics } from "@/lib/haptics";
import { cx } from "@/components/primitives";
import { ViewMark } from "@/components/Brand";

const TABS = [
  { to: "/", icon: Activity, label: "Início", end: true },
  { to: "/conversas", icon: MessagesSquare, label: "Conversas", end: false },
  { to: "/operacoes", icon: Radar, label: "Operações", end: false },
  { to: "/equipe", icon: Users, label: "Equipe", end: false },
] as const;

export function BottomNav({ badge = 0 }: { badge?: number }) {
  const { pathname } = useLocation();
  const live = usePulse((s) => s.live);

  // The nav is chrome for the tab screens only; threads take the full height.
  if (pathname.startsWith("/conversa/")) return null;

  const [left, right] = [TABS.slice(0, 2), TABS.slice(2)];

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 pb-safe">
      <div className="relative mx-auto w-full max-w-lg px-4 pb-3">
        {/* Centre mark: app logo, raised above the bar. Pulse stays; it is not a control. */}
        <div
          aria-hidden
          className="absolute left-1/2 -top-4 z-10 grid -translate-x-1/2 place-items-center rounded-full"
          style={{
            background: live
              ? "linear-gradient(145deg, var(--color-brand-deep), var(--color-violet-deep))"
              : "var(--color-raised)",
            boxShadow: live
              ? "0 8px 28px -6px color-mix(in oklab, var(--color-violet-deep) 65%, transparent)"
              : "0 8px 24px -8px rgba(0,0,0,0.8)",
            width: 60,
            height: 60,
          }}
        >
          {live ? (
            <span
              className="absolute inset-0 rounded-full"
              style={{
                background: "var(--color-brand)",
                animation: "pulse-ring 2.4s ease-out infinite",
              }}
            />
          ) : null}
          <span className="relative">
            <ViewMark size={30} inverted />
          </span>
        </div>

        <nav className="glass pointer-events-auto flex items-center rounded-[28px] px-2 py-2 hairline">
          <TabGroup tabs={left} badgeFor="/conversas" badge={badge} />
          {/* Reserved space for the floating control. */}
          <div className="w-16 shrink-0" aria-hidden />
          <TabGroup tabs={right} badgeFor="" badge={0} />
        </nav>
      </div>
    </div>
  );
}

function TabGroup({
  tabs,
  badgeFor,
  badge,
}: {
  tabs: readonly (typeof TABS)[number][];
  badgeFor: string;
  badge: number;
}) {
  return (
    <div className="flex flex-1 items-center justify-around">
      {tabs.map(({ to, icon: Icon, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={() => haptics.light()}
          className="relative flex min-w-16 flex-col items-center gap-1 rounded-2xl px-2 py-1.5"
        >
          {({ isActive }) => (
            <>
              {isActive ? (
                <motion.span
                  layoutId="tab-glow"
                  className="absolute inset-0 rounded-2xl"
                  style={{
                    background:
                      "color-mix(in oklab, var(--color-brand) 12%, transparent)",
                  }}
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              ) : null}

              <span className="relative">
                <Icon
                  size={21}
                  strokeWidth={isActive ? 2.5 : 2}
                  style={{
                    color: isActive ? "var(--color-brand)" : "var(--color-dim)",
                    transition: "color .2s",
                  }}
                />
                {to === badgeFor && badge > 0 ? (
                  <span
                    className="absolute -top-1 -right-2 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[9px] font-extrabold tabular-nums"
                    style={{ background: "var(--color-mint)", color: "#0a0a0c" }}
                  >
                    {badge > 9 ? "9+" : badge}
                  </span>
                ) : null}
              </span>

              <span
                className={cx(
                  "relative text-[10px] leading-none font-semibold transition-colors"
                )}
                style={{ color: isActive ? "var(--color-brand)" : "var(--color-dim)" }}
              >
                {label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </div>
  );
}
