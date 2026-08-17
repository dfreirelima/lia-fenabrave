import { useMemo } from "react";
import { motion } from "motion/react";
import { Bot, Crown, Users } from "lucide-react";
import { useConversations, useExecutions, useKpis } from "@/lib/queries";
import { buildOperatorStats, operatorPoints } from "@/lib/stats";
import { formatRelative, toDate } from "@/lib/format";
import type { OperatorStats } from "@/lib/types";
import { Screen, ScreenTitle } from "@/components/Screen";
import { Card, EmptyState, ErrorNote, SectionHeader, cx } from "@/components/primitives";
import { Avatar, colorForName } from "@/components/Avatar";
import { Counter } from "@/components/Counter";

// Podium tones follow the brand gradient rather than gold/silver/bronze, so
// the ranking reads as part of the same system as everything else.
const MEDALS = ["var(--color-brand)", "var(--color-violet)", "var(--color-fog)"];

export default function Equipe() {
  const conversations = useConversations();
  const executions = useExecutions(250);
  const kpis = useKpis();

  const humans = useMemo(
    () => buildOperatorStats(conversations.data ?? [], executions.data ?? []),
    [conversations.data, executions.data]
  );

  const agentLastAt = useMemo(() => {
    const latest = (executions.data ?? [])
      .map((e) => e.created_at)
      .filter(Boolean)
      .sort()
      .at(-1);
    return latest ?? kpis.data?.computed_at ?? null;
  }, [executions.data, kpis.data?.computed_at]);

  const agentInteractions = useMemo(
    () => (kpis.data?.talks_faturamento ?? 0) + (kpis.data?.talks_pagamento ?? 0),
    [kpis.data?.talks_faturamento, kpis.data?.talks_pagamento]
  );

  const error = conversations.error ?? executions.error;
  const podium = humans.slice(0, 3);
  const rest = humans.slice(3);

  const refresh = async () => {
    await Promise.all([conversations.refetch(), executions.refetch(), kpis.refetch()]);
  };

  // Podium is ordered 2nd · 1st · 3rd so the winner sits in the centre.
  const podiumLayout = [podium[1], podium[0], podium[2]];
  const heights = [86, 112, 68];
  const ranks = [2, 1, 3];

  return (
    <Screen
      glow="var(--color-violet)"
      onRefresh={refresh}
      header={
        <ScreenTitle
          eyebrow={`${humans.length} operadores`}
          title="Equipe"
        />
      }
    >
      {error ? <ErrorNote message={error.message} /> : null}

      {humans.length === 0 ? (
        <EmptyState
          icon={<Users size={22} />}
          title="Sem operadores ainda"
          subtitle="O ranking aparece assim que houver testes humanos."
        />
      ) : (
        <>
          <Card className="mt-4 p-5 pb-4">
            <div
              aria-hidden
              className="absolute -top-16 left-1/2 size-48 -translate-x-1/2 rounded-full opacity-20 blur-3xl"
              style={{ background: "var(--color-brand)" }}
            />
            <div className="relative flex items-end justify-center gap-2.5">
              {podiumLayout.map((op, i) =>
                op ? (
                  <PodiumColumn
                    key={op.name}
                    op={op}
                    rank={ranks[i]}
                    height={heights[i]}
                    delay={0.1 + i * 0.08}
                  />
                ) : (
                  <div key={`empty-${i}`} className="flex-1" />
                )
              )}
            </div>
            <p className="relative mt-4 text-center text-[10.5px] leading-snug text-dim">
              Top 3 por pontos · cada conversa vale 1 pt + cada execução vale 1 pt
            </p>
          </Card>

          {/* ------------------------------------------------------------ *
           * Remaining ranking
           * ------------------------------------------------------------ */}
          {rest.length > 0 ? (
            <div className="mt-6">
              <SectionHeader title="Do 4º em diante" />
              <p className="-mt-2 mb-3 px-1 text-[11px] text-dim">
                Os três primeiros ficam no pódio acima.
              </p>
              <Card className="divide-y divide-line/70 p-0">
                {rest.map((op, i) => (
                  <RankRow
                    key={op.name}
                    op={op}
                    rank={i + 4}
                    index={i}
                    leaderShare={humans[0]?.share ?? 100}
                  />
                ))}
              </Card>
            </div>
          ) : null}
        </>
      )}

      {/* Lia — the AI agent, separate from human testers. */}
      <div className="mt-6">
        <SectionHeader title="Agente Lia" />
        <Card
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="p-5"
          style={{
            background:
              "linear-gradient(140deg, color-mix(in oklab, var(--color-mint) 9%, var(--color-surface)), var(--color-surface))",
          }}
        >
          <div className="flex items-center gap-3">
            <span
              className="grid size-12 place-items-center rounded-2xl"
              style={{
                background: "color-mix(in oklab, var(--color-mint) 16%, transparent)",
                color: "var(--color-mint)",
              }}
            >
              <Bot size={22} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-extrabold text-chalk">Lia</p>
              <p className="text-[11.5px] text-fog">
                Ativa {formatRelative(toDate(agentLastAt))} · agente de IA
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <AgentStat
              label="Interações WhatsApp"
              value={agentInteractions}
              hint={`${kpis.data?.talks_atendente ?? 0} atend. · ${kpis.data?.talks_webhook ?? 0} autom.`}
            />
            <AgentStat
              label="Execuções"
              value={kpis.data?.executions_total ?? 0}
              hint="processamentos no evento"
            />
          </div>
        </Card>
      </div>
    </Screen>
  );
}

/* ------------------------------------------------------------------ */

function AgentStat({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint: string;
}) {
  return (
    <div className="rounded-xl bg-raised/60 px-3 py-3">
      <p className="text-[11px] font-bold leading-tight text-chalk">{label}</p>
      <p className="mt-2 text-[28px] leading-none font-extrabold tabular-nums text-chalk">
        <Counter value={value} />
      </p>
      <p className="mt-1.5 text-[10px] leading-tight text-dim">{hint}</p>
    </div>
  );
}

function PodiumColumn({
  op,
  rank,
  height,
  delay,
}: {
  op: OperatorStats;
  rank: number;
  height: number;
  delay: number;
}) {
  const medal = MEDALS[rank - 1];
  const isFirst = rank === 1;
  const points = operatorPoints(op);

  return (
    <div className="flex flex-1 flex-col items-center">
      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.85 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay, type: "spring", stiffness: 320, damping: 24 }}
        className="flex flex-col items-center"
      >
        {isFirst ? (
          <Crown
            size={18}
            className="mb-1"
            style={{ color: medal }}
            fill="currentColor"
          />
        ) : null}
        <Avatar name={op.name} size={isFirst ? 54 : 44} />
        <p
          className={cx(
            "mt-2 max-w-[86px] truncate text-center font-bold text-chalk",
            isFirst ? "text-[13px]" : "text-[12px]"
          )}
        >
          {op.name}
        </p>
        <p className="text-[11px] font-semibold" style={{ color: medal }}>
          {op.share}%
        </p>
      </motion.div>

      {/* Column */}
      <motion.div
        initial={{ height: 0 }}
        animate={{ height }}
        transition={{ delay: delay + 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="mt-2.5 flex w-full flex-col items-center justify-start rounded-t-2xl px-1 pt-2.5 pb-1"
        style={{
          background: `linear-gradient(180deg, color-mix(in oklab, ${medal} 22%, transparent), transparent)`,
          boxShadow: `inset 0 1px 0 0 color-mix(in oklab, ${medal} 45%, transparent)`,
        }}
      >
        <span
          className="text-[20px] leading-none font-extrabold"
          style={{ color: medal }}
        >
          {rank}
        </span>
        <span className="mt-1 text-[12px] font-bold tabular-nums text-chalk">
          {points} pts
        </span>
        <span className="mt-0.5 text-center text-[9px] leading-tight font-medium text-dim">
          {op.conversations} conv + {op.executions} exec
        </span>
      </motion.div>
    </div>
  );
}

function RankRow({
  op,
  rank,
  index,
  leaderShare,
}: {
  op: OperatorStats;
  rank: number;
  index: number;
  leaderShare: number;
}) {
  const color = colorForName(op.name);
  const points = operatorPoints(op);
  // Scale against the leader, not against 100 — otherwise a 9% share renders
  // as a 6px nub and the whole column reads as empty.
  const fill = Math.max(6, (op.share / Math.max(leaderShare, 1)) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index, 8) * 0.04, duration: 0.35 }}
      className="flex items-center gap-3 px-4 py-3"
    >
      <span className="w-5 shrink-0 text-center text-[13px] font-bold tabular-nums text-dim">
        {rank}
      </span>
      <Avatar name={op.name} size={36} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13.5px] font-bold text-chalk">{op.name}</p>
        <p className="text-[11px] text-dim">
          {points} pts · {op.conversations} conv · {op.executions} exec
        </p>
      </div>
      <div className="w-16 shrink-0">
        <div className="h-1.5 overflow-hidden rounded-full bg-raised">
          <motion.div
            className="h-full rounded-full"
            style={{ background: color }}
            initial={{ width: 0 }}
            animate={{ width: `${fill}%` }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
        <p className="mt-1 text-right text-[10px] font-semibold tabular-nums text-dim">
          {op.share}%
        </p>
      </div>
    </motion.div>
  );
}