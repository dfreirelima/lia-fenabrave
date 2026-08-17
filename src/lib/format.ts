import type { Domain, Health } from "@/lib/types";

const timeFmt = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
});

const dateTimeFmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

const dayFmt = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "2-digit",
  month: "long",
});

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
  const d = toDate(iso);
  return d ? timeFmt.format(d) : "—";
}

export function formatDateTime(iso: string | null | undefined): string {
  const d = toDate(iso);
  return d ? dateTimeFmt.format(d) : "—";
}

export function formatDay(date: Date): string {
  return dayFmt.format(date);
}

/** "agora", "há 40s", "há 12min", "há 3h" — for the live freshness stamp. */
export function formatRelative(date: Date | null | undefined): string {
  if (!date) return "—";
  const seconds = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));
  if (seconds < 5) return "agora";
  if (seconds < 60) return `há ${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `há ${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours}h`;
  return `há ${Math.floor(hours / 24)}d`;
}

export function previewText(text: string | null | undefined, max = 68): string {
  if (!text) return "Sem mensagens";
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length <= max ? clean : `${clean.slice(0, max)}…`;
}

export function isSuccess(status: string | null | undefined): boolean {
  const s = (status ?? "").toLowerCase();
  return s === "sucesso" || s === "success" || s === "ok";
}

export function healthColor(health: Health): string {
  if (health === "saudavel") return "var(--color-mint)";
  if (health === "parcial") return "var(--color-amber)";
  return "var(--color-coral)";
}

export function healthLabel(health: Health): string {
  if (health === "saudavel") return "Saudável";
  if (health === "parcial") return "Parcial";
  return "Falha";
}

export function domainColor(domain: Domain): string {
  if (domain === "Pagamento") return "var(--color-mint)";
  if (domain === "Faturamento") return "var(--color-azure)";
  return "var(--color-violet)";
}

/** Greeting keyed to the local hour — makes the home screen feel personal. */
export function greeting(now = new Date()): string {
  const h = now.getHours();
  if (h < 5) return "Boa madrugada";
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function toDate(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

export { toDate };
