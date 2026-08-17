import type { Conversation, Execution, Message, OperatorStats } from "@/lib/types";
import { toDate } from "@/lib/format";

/** Lia is the AI agent — never a human tester in rankings or conversation lists. */
export function isHumanOperator(name: string | null | undefined): boolean {
  return (name ?? "").trim().toLowerCase() !== "lia";
}

/** Ranking score: one point per conversation thread plus one per execution. */
export function operatorPoints(op: OperatorStats): number {
  return op.conversations + op.executions;
}

/**
 * Aggregate per-operator activity. Lia is the AI agent, never a human tester —
 * rows attributed to her are excluded from the ranking.
 */
export function buildOperatorStats(
  conversations: Conversation[],
  executions: Execution[]
): OperatorStats[] {
  const map = new Map<string, OperatorStats>();

  const ensure = (name: string): OperatorStats => {
    let entry = map.get(name);
    if (!entry) {
      entry = { name, conversations: 0, executions: 0, turns: 0, last_at: null, share: 0 };
      map.set(name, entry);
    }
    return entry;
  };

  const isAgent = (name: string) => !isHumanOperator(name);

  for (const c of conversations) {
    const name = c.operator_name || "Desconhecido";
    if (isAgent(name)) continue;
    const entry = ensure(name);
    entry.conversations += 1;
    entry.turns += c.turns ?? 0;
    if (c.last_at && (!entry.last_at || c.last_at > entry.last_at)) entry.last_at = c.last_at;
  }

  for (const e of executions) {
    const name = e.holmes_user || "Desconhecido";
    if (isAgent(name)) continue;
    const entry = ensure(name);
    entry.executions += 1;
    if (e.created_at && (!entry.last_at || e.created_at > entry.last_at)) {
      entry.last_at = e.created_at;
    }
  }

  const all = [...map.values()];
  const total = all.reduce((sum, o) => sum + o.conversations + o.executions, 0) || 1;
  for (const o of all) {
    o.share = Math.round(((o.conversations + o.executions) / total) * 100);
  }

  return all.sort((a, b) => b.conversations + b.executions - (a.conversations + a.executions));
}

/**
 * Bucket executions into a fixed-length series over the trailing window.
 * Used by the activity chart on the home screen.
 */
export function activitySeries(
  executions: Execution[],
  buckets = 24,
  windowMs = 60 * 60 * 1000
): number[] {
  const series = new Array<number>(buckets).fill(0);
  if (executions.length === 0) return series;

  const now = Date.now();
  const start = now - windowMs;
  const step = windowMs / buckets;

  for (const e of executions) {
    const d = toDate(e.created_at);
    if (!d) continue;
    const t = d.getTime();
    if (t < start || t > now) continue;
    const idx = Math.min(buckets - 1, Math.floor((t - start) / step));
    series[idx] += 1;
  }
  return series;
}

export type HealthSummary = {
  total: number;
  saudavel: number;
  parcial: number;
  falha: number;
  saudavelPct: number;
  parcialPct: number;
  falhaPct: number;
};

export function summarizeHealth(executions: Execution[]): HealthSummary {
  const total = executions.length;
  const saudavel = executions.filter((e) => e.health === "saudavel").length;
  const parcial = executions.filter((e) => e.health === "parcial").length;
  const falha = executions.filter((e) => e.health === "falha").length;
  const denom = total || 1;
  return {
    total,
    saudavel,
    parcial,
    falha,
    saudavelPct: Math.round((saudavel / denom) * 100),
    parcialPct: Math.round((parcial / denom) * 100),
    falhaPct: Math.round((falha / denom) * 100),
  };
}

/** Group thread messages by calendar day so the chat can show date dividers. */
export function groupByDay(messages: Message[]): { day: Date; items: Message[] }[] {
  const groups: { day: Date; items: Message[] }[] = [];
  let currentKey = "";

  for (const m of messages) {
    const d = toDate(m.created_at) ?? new Date(0);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (key !== currentKey) {
      currentKey = key;
      groups.push({ day: d, items: [m] });
    } else {
      groups[groups.length - 1].items.push(m);
    }
  }
  return groups;
}
