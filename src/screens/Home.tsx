import { useMemo } from "react";
import { Link } from "react-router";
import { motion } from "motion/react";
import {
  ArrowUpRight,
  ChevronRight,
  Clock3,
  MessageSquareDot,
  Send,
  Sparkles,
  Zap,
} from "lucide-react";
import { useConversations, useExecutions, useKpis } from "@/lib/queries";
import { activitySeries } from "@/lib/stats";
import { usePulse } from "@/lib/store";
import {
  domainColor,
  formatRelative,
  formatTime,
  greeting,
  toDate,
} from "@/lib/format";
import { Screen, ScreenTitle } from "@/components/Screen";
import { ActivityChart, RingGauge, SplitBar } from "@/components/charts";
import { Card, Chip, ErrorNote, SectionHeader, cx } from "@/components/primitives";
import { Counter } from "@/components/Counter";
import { LiveDot, LivePill } from "@/components/LiveDot";
import { Avatar } from "@/components/Avatar";

export default function Home() {
  const kpis = useKpis();
  const executions = useExecutions(60);
  const conversations = useConversations();
  const live = usePulse((s) => s.live);

  const k = kpis.data;
  // 24 buckets over 2 hours = one bar per 5 minutes. Wide enough to show the
  // shape of a test burst, recent enough to still read as "now".
  const series = useMemo(
    () => activitySeries(executions.data ?? [], 24, 2 * 60 * 60 * 1000),
    [executions.data]
  );
  const ticker = (executions.data ?? []).slice(0, 6);
  const liveTalks = (conversations.data ?? []).filter((c) => c.is_live);
  const freshness = toDate(k?.computed_at);

  const refresh = async () => {
    await Promise.all([kpis.refetch(), executions.refetch(), conversations.refetch()]);
  };

  return (
    <Screen
      glow="var(--color-amber)"
      onRefresh={refresh}
      header={
        <ScreenTitle
          eyebrow="Nexa · Fenabrave"
          title={greeting()}
          trailing={<LivePill live={live} />}
        />
      }
    >
      {/* Freshness chip — the "weather pill" of the reference layout. */}
      <div className="mt-3 mb-4 flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-[11px] font-semibold text-fog hairline">
          <Clock3 size={12} />
          Dados de {formatRelative(freshness)}
        </span>
        {kpis.isFetching ? (
          <span className="text-[11px] font-medium text-dim">sincronizando…</span>
        ) : null}
      </div>

      {kpis.error ? <ErrorNote message={kpis.error.message} /> : null}

      {/* ---------------------------------------------------------------- *
       * Hero — live conversations, with the activity curve bleeding out.
       * ---------------------------------------------------------------- */}
      <Card
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-hero p-5"
      >
        <div
          aria-hidden
          className="absolute -top-20 -right-16 size-56 rounded-full opacity-25 blur-3xl"
          style={{ background: "var(--color-amber)" }}
        />

        <div className="relative flex items-start justify-between">
          <div>
            <p className="flex items-center gap-2 text-[12px] font-semibold text-fog">
              <LiveDot live={live && liveTalks.length > 0} size={7} />
              Conversas ao vivo
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <Counter
                value={k?.conversations_live}
                className="text-[56px] leading-none font-extrabold tracking-tighter text-chalk"
              />
              <span className="text-[15px] font-semibold text-dim">
                / {k?.conversations_total ?? 0}
              </span>
            </div>
            <p className="mt-1.5 text-[12px] text-fog">
              <Counter value={k?.messages_total} className="font-semibold text-chalk" />{" "}
              mensagens no evento
            </p>
          </div>

          <div className="text-right">
            <p className="text-[12px] font-semibold text-fog">Últimos 15 min</p>
            <div className="mt-2 flex items-center justify-end gap-1.5">
              <Zap size={20} style={{ color: "var(--color-amber)" }} fill="currentColor" />
              {/* Amber ties the number to the accent used by the chart below. */}
              <Counter
                value={k?.executions_15m}
                className="text-[34px] leading-none font-extrabold tracking-tight text-amber"
              />
            </div>
            <p className="mt-1.5 text-[12px] text-fog">
              <Counter value={k?.executions_1h} className="font-semibold text-chalk" /> na
              última hora
            </p>
          </div>
        </div>

        <div className="relative mt-5">
          <ActivityChart data={series} live={live} height={72} />
        </div>
        <p className="relative mt-2.5 text-center text-[10px] font-medium tracking-wide text-dim uppercase">
          Execuções · últimas 2 horas
        </p>
      </Card>

      {/* ---------------------------------------------------------------- *
       * Quick access — two gauge tiles.
       * ---------------------------------------------------------------- */}
      <div className="mt-6">
        <SectionHeader title="Acesso rápido" />
        <div className="grid grid-cols-2 gap-3">
          <GaugeTile
            label="Sucesso LIA"
            value={k?.success_lia_pct ?? 0}
            hint={`${k?.executions_total ?? 0} execuções`}
            color="var(--color-mint)"
            icon={<Sparkles size={16} />}
            delay={0.05}
          />
          <GaugeTile
            label="Entrega WhatsApp"
            value={k?.delivered_pct ?? 0}
            hint={`Meta ${Math.round(k?.success_meta_pct ?? 0)}%`}
            color="var(--color-azure)"
            icon={<Send size={16} />}
            delay={0.1}
          />
        </div>
      </div>

      {/* ---------------------------------------------------------------- *
       * Domain split.
       * ---------------------------------------------------------------- */}
      <div className="mt-6">
        <SectionHeader title="Domínios" />
        <Card
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="p-5"
        >
          <div className="mb-4 flex items-end justify-between">
            <DomainStat
              label="Faturamento"
              value={k?.executions_faturamento ?? 0}
              talks={k?.talks_faturamento ?? 0}
              color="var(--color-azure)"
            />
            <DomainStat
              label="Pagamento"
              value={k?.executions_pagamento ?? 0}
              talks={k?.talks_pagamento ?? 0}
              color="var(--color-mint)"
              align="right"
            />
          </div>
          <SplitBar
            left={k?.executions_faturamento ?? 0}
            right={k?.executions_pagamento ?? 0}
          />
        </Card>
      </div>

      {/* ---------------------------------------------------------------- *
       * Live conversations shortcut.
       * ---------------------------------------------------------------- */}
      {liveTalks.length > 0 ? (
        <div className="mt-6">
          <SectionHeader
            title="Acontecendo agora"
            action={
              <Link
                to="/conversas"
                className="flex items-center gap-0.5 text-[12px] font-semibold text-fog"
              >
                Ver todas <ChevronRight size={14} />
              </Link>
            }
          />
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 scroll-area">
            {liveTalks.slice(0, 6).map((c, i) => (
              <motion.div
                key={c.conversation_id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * i, duration: 0.4 }}
              >
                <Link to={`/conversa/${c.conversation_id}`}>
                  <Card className="w-56 shrink-0 p-4">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={c.operator_name} size={36} live />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-bold text-chalk">
                          {c.operator_name}
                        </p>
                        <p className="text-[11px] text-dim">{c.turns} turnos</p>
                      </div>
                    </div>
                    <p className="clamp-2 mt-3 text-[12px] leading-snug text-fog">
                      {c.last_user_msg ?? "Sem mensagens"}
                    </p>
                    <div className="mt-3">
                      <Chip label={c.domain} color={domainColor(c.domain)} />
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      ) : null}

      {/* ---------------------------------------------------------------- *
       * Execution ticker.
       * ---------------------------------------------------------------- */}
      <div className="mt-6">
        <SectionHeader
          title="Últimas execuções"
          action={
            <Link
              to="/operacoes"
              className="flex items-center gap-0.5 text-[12px] font-semibold text-fog"
            >
              Operações <ChevronRight size={14} />
            </Link>
          }
        />
        <Card className="divide-y divide-line/70 p-0">
          {ticker.length === 0 ? (
            <p className="px-4 py-8 text-center text-[13px] text-dim">
              Aguardando execuções do evento…
            </p>
          ) : (
            ticker.map((e, i) => (
              <motion.div
                key={`${e.execution_id}-${i}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.03 * i }}
                className="flex items-center gap-3 px-4 py-3"
              >
                <span
                  className="grid size-9 shrink-0 place-items-center rounded-xl"
                  style={{
                    background: `color-mix(in oklab, ${domainColor(e.domain)} 12%, transparent)`,
                    color: domainColor(e.domain),
                  }}
                >
                  <MessageSquareDot size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-bold text-chalk">
                    {e.holmes_user ?? "—"}
                  </p>
                  <p className="text-[11px] text-dim">
                    {e.domain} · {formatTime(e.created_at)}
                  </p>
                </div>
                <HealthDot health={e.health} />
              </motion.div>
            ))
          )}
        </Card>
      </div>
    </Screen>
  );
}

/* ------------------------------------------------------------------ */

function GaugeTile({
  label,
  value,
  hint,
  color,
  icon,
  delay,
}: {
  label: string;
  value: number;
  hint: string;
  color: string;
  icon: React.ReactNode;
  delay: number;
}) {
  return (
    <Card
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="p-4"
    >
      <div className="mb-3 flex items-center justify-between">
        <span
          className="grid size-8 place-items-center rounded-xl"
          style={{
            background: `color-mix(in oklab, ${color} 14%, transparent)`,
            color,
          }}
        >
          {icon}
        </span>
        <ArrowUpRight size={15} className="text-dim" />
      </div>

      {/* Label spans the full tile width so long names never get clipped. */}
      <p className="text-[13px] leading-tight font-bold text-chalk">{label}</p>

      <div className="mt-3 flex items-center gap-2.5">
        <RingGauge value={value} color={color} size={46} stroke={4.5}>
          <span className="text-[11px] font-extrabold tabular-nums" style={{ color }}>
            {Math.round(value)}
          </span>
        </RingGauge>
        <p className="min-w-0 flex-1 text-[11px] leading-tight text-dim">{hint}</p>
      </div>
    </Card>
  );
}

function DomainStat({
  label,
  value,
  talks,
  color,
  align = "left",
}: {
  label: string;
  value: number;
  talks: number;
  color: string;
  align?: "left" | "right";
}) {
  return (
    <div className={cx(align === "right" && "text-right")}>
      <span
        className="inline-flex items-center gap-1.5 text-[12px] font-semibold"
        style={{ color }}
      >
        <span className="size-2 rounded-full" style={{ background: color }} />
        {label}
      </span>
      <p className="mt-1.5 text-[26px] leading-none font-extrabold tracking-tight text-chalk">
        <Counter value={value} />
      </p>
      <p className="mt-1 text-[11px] text-dim">{talks} turnos</p>
    </div>
  );
}

function HealthDot({ health }: { health: string }) {
  const color =
    health === "saudavel"
      ? "var(--color-mint)"
      : health === "parcial"
        ? "var(--color-amber)"
        : "var(--color-coral)";
  return (
    <span
      className="size-2.5 shrink-0 rounded-full"
      style={{ background: color, boxShadow: `0 0 10px ${color}` }}
    />
  );
}
