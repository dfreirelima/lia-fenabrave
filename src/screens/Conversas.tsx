import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight, MessagesSquare, Search, X } from "lucide-react";
import { useConversations } from "@/lib/queries";
import { domainColor, formatRelative, conversationPath, conversationPreview, toDate } from "@/lib/format";
import type { Conversation, Domain } from "@/lib/types";
import { Screen, ScreenTitle } from "@/components/Screen";
import { Card, Chip, EmptyState, ErrorNote, cx } from "@/components/primitives";
import { Avatar } from "@/components/Avatar";
import { LiveDot } from "@/components/LiveDot";
import { haptics } from "@/lib/haptics";
import { isHumanOperator } from "@/lib/stats";

type Filter = "all" | "live" | Domain;

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "Todas" },
  { key: "live", label: "Ao vivo · 5 min" },
  { key: "Faturamento", label: "Faturamento" },
  { key: "Pagamento", label: "Pagamento" },
];

const PAGE_SIZE = 15;

export default function Conversas() {
  const { data, error, refetch, isLoading } = useConversations();
  const [rawQuery, setRawQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(0);

  // Keeps typing responsive: the list re-filters at a lower priority.
  const query = useDeferredValue(rawQuery);

  const all = useMemo(
    () => (data ?? []).filter((c) => isHumanOperator(c.operator_name)),
    [data]
  );
  const liveCount = useMemo(() => all.filter((c) => c.is_live).length, [all]);

  const items = useMemo(() => {
    let list = all;
    if (filter === "live") list = list.filter((c) => c.is_live);
    else if (filter !== "all") list = list.filter((c) => c.domain === filter);

    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) =>
          c.operator_name?.toLowerCase().includes(q) ||
          c.last_user_msg?.toLowerCase().includes(q) ||
          c.last_lia_msg?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [all, filter, query]);

  useEffect(() => {
    setPage(0);
  }, [filter, query]);

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
          <ScreenTitle
            eyebrow={`${all.length} no evento`}
            title="Conversas"
            trailing={
              liveCount > 0 ? (
                <span className="flex items-center gap-1.5 rounded-full bg-surface px-2.5 py-1.5 text-[11px] font-bold text-mint hairline">
                  <LiveDot size={7} />
                  {liveCount}
                </span>
              ) : null
            }
          />

          {/* Search */}
          <div className="mt-4 flex items-center gap-2 rounded-2xl bg-surface px-3.5 py-3 hairline">
            <Search size={17} className="shrink-0 text-dim" />
            <input
              value={rawQuery}
              onChange={(e) => setRawQuery(e.target.value)}
              placeholder="Buscar operador ou mensagem"
              inputMode="search"
              className="min-w-0 flex-1 bg-transparent text-[14px] text-chalk placeholder:text-dim focus:outline-none"
            />
            <AnimatePresence>
              {rawQuery ? (
                <motion.button
                  type="button"
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  onClick={() => setRawQuery("")}
                  className="grid size-5 shrink-0 place-items-center rounded-full bg-raised text-fog"
                  aria-label="Limpar busca"
                >
                  <X size={12} />
                </motion.button>
              ) : null}
            </AnimatePresence>
          </div>

          {/* Filter pills */}
          <div className="scroll-area -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
            {FILTERS.map(({ key, label }) => {
              const active = filter === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    haptics.light();
                    setFilter(key);
                  }}
                  className={cx(
                    "relative shrink-0 rounded-full px-3.5 py-2 text-[12px] font-semibold whitespace-nowrap transition-colors",
                    active ? "text-ink" : "text-fog"
                  )}
                >
                  {active ? (
                    <motion.span
                      layoutId="filter-pill"
                      className="absolute inset-0 rounded-full bg-brand"
                      transition={{ type: "spring", stiffness: 450, damping: 36 }}
                    />
                  ) : (
                    <span className="absolute inset-0 rounded-full bg-surface hairline" />
                  )}
                  <span className="relative">{label}</span>
                </button>
              );
            })}
          </div>
        </>
      }
    >
      {error ? <ErrorNote message={error.message} /> : null}

      <p className="mt-3 mb-2 px-1 text-[11px] font-semibold tracking-wide text-dim uppercase">
        {items.length === 0
          ? "0 conversas"
          : `${from}–${to} de ${items.length} ${items.length === 1 ? "conversa" : "conversas"}`}
      </p>

      <div className="space-y-2">
        {items.length === 0 && !isLoading ? (
          <EmptyState
            icon={<MessagesSquare size={22} />}
            title={query || filter !== "all" ? "Nada encontrado" : "Nenhuma conversa"}
            subtitle={
              query || filter !== "all"
                ? "Ajuste a busca ou os filtros."
                : "Assim que os testes começarem, elas aparecem aqui."
            }
          />
        ) : (
          pageItems.map((c, i) => <Row key={c.conversation_id} item={c} index={i} />)
        )}
      </div>

      {items.length > PAGE_SIZE ? (
        <Pager page={safePage} pageCount={pageCount} onChange={go} />
      ) : null}
    </Screen>
  );
}

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

function Row({ item, index }: { item: Conversation; index: number }) {
  const color = domainColor(item.domain);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      // Stagger only the first screenful; later rows appear instantly.
      transition={{ delay: Math.min(index, 8) * 0.035, duration: 0.35 }}
    >
      <Link to={conversationPath(item.conversation_id)} onClick={() => haptics.light()}>
        <Card className="flex items-center gap-3 p-3.5 active:scale-[0.985] transition-transform">
          <Avatar name={item.operator_name} size={46} live={item.is_live} />

          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <p className="truncate text-[14px] font-bold text-chalk">
                {item.operator_name}
              </p>
              <time className="shrink-0 text-[11px] font-medium text-dim">
                {formatRelative(toDate(item.last_at))}
              </time>
            </div>

            <p className="clamp-1 mt-1 text-[12.5px] text-fog">
              {conversationPreview(item.last_user_msg, item.last_lia_msg, 52)}
            </p>

            <div className="mt-2 flex items-center gap-2">
              <Chip label={item.domain} color={color} />
              <span className="text-[11px] font-medium text-dim">
                {item.turns} interações · {item.executions_count} exec
              </span>
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}
