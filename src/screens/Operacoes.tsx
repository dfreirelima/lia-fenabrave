import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { AlertTriangle, Check, CheckCircle2, ChevronLeft, ChevronRight, Radar, X, XCircle } from "lucide-react";
import { useExecutions } from "@/lib/queries";
import { summarizeHealth } from "@/lib/stats";
import {
  domainColor,
  formatPhone,
  formatTime,
  healthColor,
  healthLabel,
  isSuccess,
} from "@/lib/format";
import type { Domain, Execution, Health } from "@/lib/types";
import { Screen, ScreenTitle } from "@/components/Screen";
import { Card, Chip, EmptyState, ErrorNote, cx } from "@/components/primitives";
import { Counter } from "@/components/Counter";
import { haptics } from "@/lib/haptics";

type HealthFilter = "all" | Health;
type DomainFilter = "all" | Domain;

const PAGE_SIZE = 15;

export default function Operacoes() {
  const { data, error, refetch, isLoading } = useExecutions(150);
  const [health, setHealth] = useState<HealthFilter>("all");
  const [domain, setDomain] = useState<DomainFilter>("all");
  const [page, setPage] = useState(0);

  const all = useMemo(() => data ?? [], [data]);
  const summary = useMemo(() => summarizeHealth(all), [all]);

  const items = useMemo(() => {
    let list = all;
    if (health !== "all") list = list.filter((e) => e.health === health);
    if (domain !== "all") list = list.filter((e) => e.domain === domain);
    return list;
  }, [all, health, domain]);

  useEffect(() => {
    setPage(0);
  }, [health, domain]);

  const pageCount = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageItems = items.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);
  const from = items.length === 0 ? 0 : safePage * PAGE_SIZE + 1;
  const to = Math.min(items.length, safePage * PAGE_SIZE + pageItems.length);

  const go = (next: number) => {
    haptics.light();
    setPage(Math.max(0, Math.min(pageCount - 1, next)));
  };

  return (
    <Screen
      glow="var(--color-violet)"
      onRefresh={refetch}
      header={
        <>
          <ScreenTitle eyebrow="Saúde em tempo real" title="Operações" />

          {/* Health summary strip */}
          <div className="mt-4 grid grid-cols-3 gap-2.5 pl-1.5">
            <HealthTile
              label="Sucesso"
              value={summary.saudavel}
              pct={summary.saudavelPct}
              color="var(--color-mint)"
              icon={<CheckCircle2 size={16} strokeWidth={2.25} />}
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
              icon={<AlertTriangle size={16} strokeWidth={2.25} />}
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
              icon={<XCircle size={16} strokeWidth={2.25} />}
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
        {items.length === 0
          ? "0 execuções"
          : `${from}–${to} de ${items.length} ${items.length === 1 ? "execução" : "execuções"}`}
      </p>

      <div className="space-y-2.5">
        {items.length === 0 && !isLoading ? (
          <EmptyState
            icon={<Radar size={22} />}
            title="Sem execuções"
            subtitle="Nenhum resultado para os filtros atuais."
          />
        ) : (
          pageItems.map((e, i) => (
            <ExecutionCard key={`${e.execution_id}-${i}`} item={e} index={i} />
          ))
        )}
      </div>

      {items.length > PAGE_SIZE ? (
        <Pager page={safePage} pageCount={pageCount} onChange={go} />
      ) : null}
    </Screen>
  );
}

/* ------------------------------------------------------------------ */

function Pager({
  page,
  pageCount,
  onChange,
}: {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
}) {
  return (
    <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-surface px-2 py-2 hairline">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 0}
        aria-label="Página anterior"
        className="grid size-10 place-items-center rounded-xl text-chalk disabled:text-dim"
      >
        <ChevronLeft size={20} />
      </button>
      <p className="text-[12px] font-semibold tabular-nums text-fog">
        Página {page + 1} de {pageCount}
      </p>
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= pageCount - 1}
        aria-label="Próxima página"
        className="grid size-10 place-items-center rounded-xl text-chalk disabled:text-dim"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}

function HealthTile({
  label,
  value,
  pct,
  color,
  icon,
  active,
  onClick,
}: {
  label: string;
  value: number;
  pct: number;
  color: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      className="relative overflow-hidden rounded-tile px-3.5 py-3 text-left transition-colors"
      style={{
        background: active
          ? `color-mix(in oklab, ${color} 16%, var(--color-surface))`
          : "var(--color-surface)",
        boxShadow: active
          ? `inset 0 0 0 1px color-mix(in oklab, ${color} 45%, transparent)`
          : "inset 0 0 0 1px var(--color-line)",
      }}
    >
      <div className="flex items-center gap-2">
        <span
          className="grid size-7 shrink-0 place-items-center rounded-lg"
          style={{
            background: `color-mix(in oklab, ${color} 14%, transparent)`,
            color,
          }}
        >
          {icon}
        </span>
        <p className="text-[11px] font-semibold" style={{ color }}>
          {label}
        </p>
      </div>
      <p className="mt-2 pl-9 text-[22px] leading-none font-extrabold text-chalk">
        <Counter value={value} />
      </p>
      <p className="mt-1 pl-9 text-[10px] font-medium text-dim">{pct}%</p>
    </motion.button>
  );
}

function HealthDot({ health }: { health: Health }) {
  const color = healthColor(health);
  return (
    <span
      aria-hidden
      className="size-2.5 shrink-0 rounded-full"
      style={{ background: color, boxShadow: `0 0 8px ${color}` }}
    />
  );
}

function StatusMark({ ok }: { ok: boolean }) {
  return ok ? <Check size={11} strokeWidth={2.75} /> : <X size={11} strokeWidth={2.75} />;
}

function ExecutionCard({ item, index }: { item: Execution; index: number }) {
  const hColor = healthColor(item.health);
  const dColor = domainColor(item.domain);
  const liaOk = isSuccess(item.execution_status_lia);
  const waOk = isSuccess(item.execution_status_meta);
  const phone = formatPhone(item.send_wa_masked);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 8) * 0.03, duration: 0.35 }}
    >
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <HealthDot health={item.health} />
          <p className="min-w-0 flex-1 truncate text-[14px] font-bold text-chalk">
            {item.holmes_user ?? "—"}
          </p>
          <Chip label={item.domain} color={dColor} compact className="shrink-0" />
          <time className="shrink-0 text-[11px] font-medium text-dim">
            {formatTime(item.created_at)}
          </time>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5 pl-[18px]">
          <Chip label={healthLabel(item.health)} color={hColor} />
          <Chip
            label="Lia"
            color={liaOk ? "var(--color-mint)" : "var(--color-coral)"}
            icon={<StatusMark ok={liaOk} />}
            compact
          />
          <Chip
            label="WhatsApp"
            color={waOk ? "var(--color-mint)" : "var(--color-coral)"}
            icon={<StatusMark ok={waOk} />}
            compact
          />
          {item.delivered && phone ? (
            <Chip label={phone} color="var(--color-brand)" />
          ) : (
            <Chip label="Não entregue" muted />
          )}
        </div>
      </Card>
    </motion.div>
  );
}
