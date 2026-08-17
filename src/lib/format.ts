import type { Domain, Health, MessageChannel } from "@/lib/types";

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

export type TextRun = { text: string; bold?: boolean };

/** WhatsApp-style `*negrito*` — unmatched asterisks stay as text. */
export function parseWaBold(text: string): TextRun[] {
  const runs: TextRun[] = [];
  const re = /\*([^*\n]+)\*/g;
  let last = 0;
  for (const match of text.matchAll(re)) {
    const start = match.index ?? 0;
    if (start > last) runs.push({ text: text.slice(last, start) });
    runs.push({ text: match[1], bold: true });
    last = start + match[0].length;
  }
  if (last < text.length) runs.push({ text: text.slice(last) });
  return runs.length > 0 ? runs : [{ text }];
}

export function stripWaMarkers(text: string): string {
  return text.replace(/\*([^*\n]+)\*/g, "$1");
}

export function previewText(text: string | null | undefined, max = 68): string {
  if (!text) return "Sem mensagens";
  const clean = stripWaMarkers(text).replace(/\s+/g, " ").trim();
  if (!clean) return "Sem mensagens";
  return clean.length <= max ? clean : `${clean.slice(0, max)}…`;
}

/** Inbox preview: last client line, or Lia's last line when the client never spoke. */
export function conversationPreview(
  userMsg: string | null | undefined,
  liaMsg: string | null | undefined,
  max = 68
): string {
  const user = userMsg?.replace(/\s+/g, " ").trim();
  return previewText(user ? userMsg : liaMsg, max);
}

export function conversationPath(id: string): string {
  return `/conversa/${encodeURIComponent(id)}`;
}

export function channelLabel(channel: MessageChannel | null | undefined): string | null {
  if (channel === "webhook") return "Automática";
  if (channel === "atendente") return "Atendimento";
  return null;
}

export function channelColor(channel: MessageChannel | null | undefined): string {
  if (channel === "webhook") return "var(--color-amber)";
  if (channel === "atendente") return "var(--color-mint)";
  return "var(--color-fog)";
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
  if (health === "saudavel") return "Sucesso";
  if (health === "parcial") return "Parcial";
  return "Falha";
}

/** Drop the Holmes product prefix so the card shows only flow + channel. */
export function workflowShort(name: string | null | undefined): string | null {
  if (!name) return null;
  const trimmed = name.replace(/^HOLMES FENABRAVE\s*[-–—]\s*/i, "").trim();
  return trimmed || name;
}

/** WhatsApp digits as a readable BR number, e.g. +55 11 4890-8964. */
export function formatPhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const d = raw.replace(/\D/g, "");
  if (!d) return null;
  if (d.length === 13 && d.startsWith("55")) {
    return `+55 ${d.slice(2, 4)} ${d.slice(4, 9)}-${d.slice(9)}`;
  }
  if (d.length === 12 && d.startsWith("55")) {
    return `+55 ${d.slice(2, 4)} ${d.slice(4, 8)}-${d.slice(8)}`;
  }
  if (d.length === 11) {
    return `${d.slice(0, 2)} ${d.slice(2, 7)}-${d.slice(7)}`;
  }
  return d;
}

/**
 * Domains borrow the two ends of the Holmes gradient, so a domain split reads
 * as the brand itself. Mint is reserved for liveness and health, never a
 * domain, otherwise a green chip would imply "healthy".
 */
export function domainColor(domain: Domain): string {
  if (domain === "Faturamento") return "var(--color-brand)";
  if (domain === "Pagamento") return "var(--color-violet)";
  return "var(--color-fog)";
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
