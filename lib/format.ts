import type { FenabraveConversation, FenabraveExecution, OperatorStats } from "@/lib/types";

export function initials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function shortId(id: string | null | undefined, size = 8): string {
  if (!id) return "—";
  return id.length <= size ? id : `${id.slice(0, size)}…`;
}

export function formatTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRelative(date: Date | null): string {
  if (!date) return "—";
  const seconds = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));
  if (seconds < 5) return "agora";
  if (seconds < 60) return `há ${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `há ${minutes}min`;
  return `há ${Math.floor(minutes / 60)}h`;
}

export function previewText(text: string | null | undefined, max = 72): string {
  if (!text) return "Sem mensagens";
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max)}…`;
}

export function isSuccessStatus(status: string | null | undefined): boolean {
  const s = (status ?? "").toLowerCase();
  return s === "sucesso" || s === "success" || s === "ok";
}

export function healthColor(health: string): string {
  if (health === "saudavel") return "#25D366";
  if (health === "parcial") return "#F59E0B";
  return "#EF4444";
}

export function statusColor(status: string | null | undefined): string {
  return isSuccessStatus(status) ? "#25D366" : "#EF4444";
}

export function buildOperatorStats(
  conversations: FenabraveConversation[],
  executions: FenabraveExecution[]
): { humans: OperatorStats[]; lia: OperatorStats | null } {
  const map = new Map<string, OperatorStats>();

  for (const c of conversations) {
    const name = c.operator_name || "Desconhecido";
    const current = map.get(name) ?? {
      name,
      conversations: 0,
      executions: 0,
      turns: 0,
      last_at: null,
      share: 0,
    };
    current.conversations += 1;
    current.turns += c.turns ?? 0;
    if (!current.last_at || (c.last_at && c.last_at > current.last_at)) {
      current.last_at = c.last_at;
    }
    map.set(name, current);
  }

  for (const e of executions) {
    const name = e.holmes_user || "Desconhecido";
    const current = map.get(name) ?? {
      name,
      conversations: 0,
      executions: 0,
      turns: 0,
      last_at: null,
      share: 0,
    };
    current.executions += 1;
    if (!current.last_at || (e.created_at && e.created_at > current.last_at)) {
      current.last_at = e.created_at;
    }
    map.set(name, current);
  }

  const all = Array.from(map.values());
  const totalActivity = all.reduce((sum, o) => sum + o.conversations + o.executions, 0) || 1;
  for (const o of all) {
    o.share = Math.round(((o.conversations + o.executions) / totalActivity) * 100);
  }

  const lia = all.find((o) => o.name.toLowerCase() === "lia") ?? null;
  const humans = all
    .filter((o) => o.name.toLowerCase() !== "lia")
    .sort((a, b) => b.conversations + b.executions - (a.conversations + a.executions));

  return { humans, lia };
}

/** Build a simple sparkline series from recent executions (count per bucket). */
export function sparklineFromExecutions(
  executions: FenabraveExecution[],
  buckets = 12
): number[] {
  if (!executions.length) return Array.from({ length: buckets }, () => 0);
  const now = Date.now();
  const windowMs = 60 * 60 * 1000;
  const step = windowMs / buckets;
  const series = Array.from({ length: buckets }, () => 0);

  for (const e of executions) {
    if (!e.created_at) continue;
    const t = new Date(e.created_at).getTime();
    if (Number.isNaN(t) || t < now - windowMs) continue;
    const idx = Math.min(buckets - 1, Math.floor((t - (now - windowMs)) / step));
    series[idx] += 1;
  }
  return series;
}
