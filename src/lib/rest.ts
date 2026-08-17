/**
 * Minimal read-only PostgREST client.
 *
 * The monitor only ever issues `GET` against four Supabase views — no auth,
 * no realtime, no storage, no writes. Talking to PostgREST directly instead of
 * pulling in `@supabase/supabase-js` removes ~250 KB (~67 KB gzipped) from the
 * initial download, which is the single largest cost on a phone at an event.
 */

const BASE = (import.meta.env.VITE_SUPABASE_URL ?? "").replace(/\/+$/, "");
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

if (!BASE || !KEY) {
  console.warn("[pulse] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY ausentes");
}

export type Order = { column: string; ascending?: boolean };

export type SelectOptions = {
  /** Column list; defaults to every column. */
  select?: string;
  order?: Order;
  limit?: number;
  /** Equality filters, e.g. `{ conversation_id: "abc" }`. */
  eq?: Record<string, string | number | boolean>;
  signal?: AbortSignal;
};

export class RestError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "RestError";
    this.status = status;
  }
}

/** Run a `SELECT` against a view and return the rows. */
export async function select<T>(view: string, options: SelectOptions = {}): Promise<T[]> {
  const params = new URLSearchParams();
  params.set("select", options.select ?? "*");

  if (options.order) {
    const dir = options.order.ascending === false ? "desc" : "asc";
    params.set("order", `${options.order.column}.${dir}`);
  }
  if (options.limit !== undefined) params.set("limit", String(options.limit));
  for (const [column, value] of Object.entries(options.eq ?? {})) {
    params.set(column, `eq.${value}`);
  }

  const res = await fetch(`${BASE}/rest/v1/${view}?${params}`, {
    method: "GET",
    signal: options.signal,
    headers: {
      apikey: KEY,
      authorization: `Bearer ${KEY}`,
      accept: "application/json",
      // Skip the exact row count — the monitor never paginates.
      prefer: "count=none",
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new RestError(
      parseError(body) ?? `Falha ao carregar ${view} (${res.status})`,
      res.status
    );
  }

  return (await res.json()) as T[];
}

/** Same as `select`, but returns the first row (or `null`). */
export async function selectOne<T>(
  view: string,
  options: SelectOptions = {}
): Promise<T | null> {
  const rows = await select<T>(view, { ...options, limit: 1 });
  return rows[0] ?? null;
}

function parseError(body: string): string | null {
  try {
    const parsed = JSON.parse(body) as { message?: string; hint?: string };
    return parsed.message ?? parsed.hint ?? null;
  } catch {
    return null;
  }
}
