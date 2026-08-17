import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { CheckCheck, Radar, ShieldAlert } from "lucide-react";
import { useExecutions } from "@/lib/queries";
import { summarizeHealth } from "@/lib/stats";
import {
  domainColor,
  formatTime,
  healthColor,
  healthLabel,
  isSuccess,
  shortId,
} from "@/lib/format";
import type { Domain, Execution, Health } from "@/lib/types";
import { Screen, ScreenTitle } from "@/components/Screen";
import { Card, Chip, EmptyState, ErrorNote, cx } from "@/components/primitives";
import { Counter } from "@/components/Counter";
import { haptics } from "@/lib/haptics";

type HealthFilter = "all" | Health;
type DomainFilter = "all" | Domain;

export default function Operacoes() {
  const { data, error, refetch, isLoading } = useExecutions(150);
  const [health, setHealth] = useState<HealthFilter>("all");
  const [domain, setDomain] = useState<DomainFilter>("all");

  const all = useMemo(() => data ?? [], [data]);
  const summary = useMemo(() => summarizeHealth(all), [all]);

  const items = useMemo(() => {
    let list = all;
    if (health !== "all") list = list.filter((e) => e.health === health);
    if (domain !== "all") list = list.filter((e) => e.domain === domain);
    return list;
  }, [all, health, domain]);

  return (
    <Screen
      glow="var(--color-violet)"
      onRefresh={refetch}
      header={
        <>
          <ScreenTitle eyebrow="Saúde em tempo real" title="Operações" />

          {/* Health summary strip */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            <HealthTile
              label="Saudável"
              value={summary.saudavel}
              pct={summary.saudavelPct}
              color="var(--color-mint)"
              active={health === "saudavel"}
              onClick={() => {
                haptics.light();
                setHealth((h) => (h === "saudavel" ? "all" : "saudavel"));
              }}
            />
            <HealthTile
              label="Parcial"
              value={summary.parcial}
              pct={summary.parcialPct}
              color="var(--color-amber)"
              active={health === "parcial"}
              onClick={() => {
                haptics.light();
                setHealth((h) => (h === "parcial" ? "all" : "parcial"));
              }}
            />
            <HealthTile
              label="Falha"
              value={summary.falha}
              pct={summary.falhaPct}
              color="var(--color-coral)"
              active={health === "falha"}
              onClick={() => {
                haptics.light();
                setHealth((h) => (h === "falha" ? "all" : "falha"));
              }}
            />
          </div>

          {/* Domain segmented control */}
          <div className="mt-3 flex gap-1 rounded-2xl bg-surface p-1 hairline">
            {(
              [
                ["all", "Todos"],
                ["Faturamento", "Faturamento"],
                ["Pagamento", "Pagamento"],
              ] as const
            ).map(([key, label]) => {
              const active = domain === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    haptics.light();
                    setDomain(key);
                  }}
                  className={cx(
                    "relative flex-1 rounded-xl px-2 py-2 text-[12px] font-semibold transition-colors",
                    active ? "text-chalk" : "text-dim"
                  )}
                >
                  {active ? (
                    <motion.span
                      layoutId="domain-seg"
                      className="absolute inset-0 rounded-xl bg-raised"
                      transition={{ type: "spring", stiffness: 450, damping: 36 }}
                    />
                  ) : null}
                  <span className="relative">{label}</span>
                </button>
              );
            })}
          </div>
        </>
      }
    >
      {error ? <ErrorNote message={error.message} /> : null}

      <p className="mt-4 mb-2 px-1 text-[11px] font-semibold tracking-wide text-dim uppercase">
        {items.length} {items.length === 1 ? "execução" : "execuções"}
      </p>

      <div className="space-y-2.5">
        {items.length === 0 && !isLoading ? (
          <EmptyState
            icon={<Radar size={22} />}
            title="Sem execuções"
            subtitle="Nenhum resultado para os filtros atuais."
          />
        ) : (
          items.map((e, i) => (
            <ExecutionCard key={`${e.execution_id}-${i}`} item={e} index={i} />
          ))
        )}
      </div>
    </Screen>
  );
}

/* ------------------------------------------------------------------ */

function HealthTile({
  label,
  value,
  pct,
  color,
  active,
  onClick,
}: {
  label: string;
  value: number;
  pct: number;
  color: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      className="relative overflow-hidden rounded-tile p-3 text-left transition-colors"
      style={{
        background: active
          ? `color-mix(in oklab, ${color} 16%, var(--color-surface))`
          : "var(--color-surface)",
        boxShadow: active
          ? `inset 0 0 0 1px color-mix(in oklab, ${color} 45%, transparent)`
          : "inset 0 0 0 1px var(--color-line)",
      }}
    >
      <p className="text-[11px] font-semibold" style={{ color }}>
        {label}
      </p>
      <p className="mt-1 text-[22px] leading-none font-extrabold text-chalk">
        <Counter value={value} />
      </p>
      <p className="mt-1 text-[10px] font-medium text-dim">{pct}%</p>

      {/* Proportion bar pinned to the tile's base. */}
      <motion.span
        className="absolute inset-x-0 bottom-0 h-0.5 origin-left"
        style={{ background: color }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: pct / 100 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      />
    </motion.button>
  );
}

function ExecutionCard({ item, index }: { item: Execution; index: number }) {
  const hColor = healthColor(item.health);
  const dColor = domainColor(item.domain);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 8) * 0.03, duration: 0.35 }}
    >
      <Card className="p-4">
        {/* Health accent rail down the left edge. */}
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 w-1"
          style={{ background: hColor }}
        />

        <div className="flex items-start justify-between gap-3 pl-1">
          <div className="min-w-0">
            <p className="truncate text-[14px] font-bold text-chalk">
              {item.holmes_user ?? "—"}
            </p>
            <p className="mt-0.5 truncate text-[11px] text-dim">
              {item.workflow_name ?? shortId(item.execution_id, 14)}
            </p>
          </div>
          <time className="shrink-0 text-[11px] font-medium text-dim">
            {formatTime(item.created_at)}
          </time>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5 pl-1">
          <Chip label={item.domain} color={dColor} />
          <Chip label={healthLabel(item.health)} color={hColor} />
          <Chip
            label={`LIA ${item.execution_status_lia ?? "—"}`}
            color={isSuccess(item.execution_status_lia) ? "var(--color-mint)" : "var(--color-coral)"}
            icon={
              isSuccess(item.execution_status_lia) ? (
                <CheckCheck size={11} />
              ) : (
                <ShieldAlert size={11} />
              )
            }
          />
          <Chip
            label={`Meta ${item.execution_status_meta ?? "—"}`}
            color={
              isSuccess(item.execution_status_meta)
                ? "var(--color-mint)"
                : "var(--color-coral)"
            }
          />
          {item.delivered && item.send_wa_masked ? (
            <Chip label={item.send_wa_masked} color="var(--color-azure)" />
          ) : (
            <Chip label="Sem WA" muted />
          )}
        </div>
      </Card>
    </motion.div>
  );
}
