import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft, Eye, MessagesSquare } from "lucide-react";
import { useConversation, useMessages } from "@/lib/queries";
import { groupByDay } from "@/lib/stats";
import { domainColor, formatDay, formatTime, channelLabel, parseWaBold } from "@/lib/format";
import type { Message } from "@/lib/types";
import { Avatar } from "@/components/Avatar";
import { Chip, EmptyState, ErrorNote, cx } from "@/components/primitives";
import { LiveDot } from "@/components/LiveDot";
import { ExitButton } from "@/components/Screen";
import { NexaSignature } from "@/components/Brand";
import { haptics } from "@/lib/haptics";

export default function Thread() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: messages, error, isLoading } = useMessages(id);
  const conversation = useConversation(id).data;

  const scrollRef = useRef<HTMLDivElement>(null);
  const pinnedToBottom = useRef(true);

  const groups = useMemo(() => groupByDay(messages ?? []), [messages]);
  const count = messages?.length ?? 0;

  // Track whether the reader is at the bottom, so polling never yanks them
  // away from a message they scrolled up to read.
  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    pinnedToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  // First paint: jump to the newest message without an animation.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el && count > 0) el.scrollTop = el.scrollHeight;
    // Only on the initial batch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count > 0]);

  // Later updates: glide down only if they were already following along.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !pinnedToBottom.current) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [count]);

  const name = conversation?.operator_name ?? "Conversa";
  const domain = conversation?.domain;

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="flex h-full flex-col bg-ink"
    >
      {/* ---------------------------------------------------------------- *
       * Header
       * ---------------------------------------------------------------- */}
      <header className="glass relative z-20 shrink-0 border-b border-line/60 px-3 pt-safe pb-3">
        <div className="flex items-center gap-2.5">
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              haptics.light();
              navigate(-1);
            }}
            aria-label="Voltar"
            className="grid size-10 shrink-0 place-items-center rounded-full text-chalk"
          >
            <ArrowLeft size={21} />
          </motion.button>

          <Avatar name={name} size={40} live={conversation?.is_live} />

          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-bold text-chalk">{name}</p>
            <div className="mt-0.5 flex items-center gap-2">
              {domain ? (
                <span
                  className="text-[11px] font-semibold"
                  style={{ color: domainColor(domain) }}
                >
                  {domain}
                </span>
              ) : null}
              {conversation?.is_live ? (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-mint">
                  <LiveDot size={6} /> ao vivo
                </span>
              ) : (
                <span className="text-[11px] text-dim">{count} mensagens</span>
              )}
            </div>
          </div>

          {conversation ? (
            <Chip
              label={`${conversation.turns} interações`}
              color={domain ? domainColor(domain) : "var(--color-brand)"}
            />
          ) : null}
          <ExitButton />
        </div>
      </header>

      {/* ---------------------------------------------------------------- *
       * Messages
       * ---------------------------------------------------------------- */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="scroll-area relative flex-1 px-3 py-4"
        style={{
          backgroundColor: "#121317",
          backgroundImage: "url(/chat-wallpaper-dark.svg)",
          backgroundRepeat: "repeat",
          backgroundSize: "360px 360px",
          backgroundAttachment: "local",
        }}
      >
        {error ? <ErrorNote message={error.message} /> : null}

        {count === 0 && !isLoading ? (
          <EmptyState
            icon={<MessagesSquare size={22} />}
            title="Sem mensagens"
            subtitle="Esta conversa ainda não tem interações registradas."
          />
        ) : null}

        {groups.map((group) => (
          <div key={group.day.toISOString()}>
            <div className="my-3 flex justify-center">
              <span className="rounded-full bg-surface px-3 py-1 text-[10.5px] font-semibold text-dim hairline">
                {formatDay(group.day)}
              </span>
            </div>
            {group.items.map((m, i) => {
                const prev = group.items[i - 1];
                const showAuthor =
                  prev?.role !== m.role ||
                  (m.role === "lia" && prev?.channel !== m.channel);
                return (
                  <Bubble
                    key={m.message_id}
                    message={m}
                    operatorName={name}
                    showAuthor={showAuthor}
                  />
                );
              })}
          </div>
        ))}
      </div>

      {/* ---------------------------------------------------------------- *
       * Read-only footer
       * ---------------------------------------------------------------- */}
      <div className="shrink-0 px-3 pt-1 pb-safe">
        <div className="mb-3 flex items-center justify-center gap-2 rounded-2xl bg-surface px-4 py-3 hairline">
          <Eye size={14} className="text-dim" />
          <span className="text-[11.5px] font-medium text-fog">
            Somente leitura · o monitor não envia mensagens
          </span>
        </div>
        <NexaSignature className="mb-2" />
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */

function Bubble({
  message,
  showAuthor,
  operatorName,
}: {
  message: Message;
  showAuthor: boolean;
  operatorName: string;
}) {
  const isLia = message.role === "lia";
  const firstName = operatorName.trim().split(/\s+/).filter(Boolean)[0] ?? "Cliente";
  const author = isLia ? "Lia" : firstName;
  const origin = isLia ? channelLabel(message.channel) : null;

  const face = showAuthor ? (
    isLia ? (
      <img
        src="/lia.png"
        alt=""
        className="size-8 shrink-0 rounded-full object-cover object-top"
        style={{ boxShadow: "0 0 0 2px color-mix(in oklab, var(--color-violet) 45%, transparent)" }}
      />
    ) : (
      <Avatar name={operatorName} size={32} />
    )
  ) : (
    <span className="size-8 shrink-0" aria-hidden />
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className={cx("mb-2 flex items-start gap-2", isLia ? "justify-end" : "justify-start")}
    >
      {!isLia ? face : null}
      <div
        className={cx(
          "max-w-[78%] px-3.5 py-2.5",
          isLia
            ? "rounded-2xl rounded-br-md"
            : "rounded-2xl rounded-bl-md hairline"
        )}
        style={{
          background: isLia
            ? "linear-gradient(145deg, var(--color-violet-deep), var(--color-brand-deep))"
            : "#2a2e38",
        }}
      >
        {showAuthor ? (
          <p
            className="mb-1 text-[11px] font-bold"
            style={{
              color: isLia ? "#E8E0FF" : "var(--color-brand)",
            }}
          >
            {author}
          </p>
        ) : null}
        <p className="text-[14.5px] leading-[1.45] whitespace-pre-wrap text-chalk">
          {parseWaBold(message.body).map((run, i) =>
            run.bold ? (
              <strong key={i} className="font-bold">
                {run.text}
              </strong>
            ) : (
              <span key={i}>{run.text}</span>
            )
          )}
        </p>
        <div className="mt-1.5 flex items-center justify-end gap-1.5">
          {origin ? (
            <span
              className="text-[10px] font-semibold tracking-wide uppercase"
              style={{ color: isLia ? "rgba(255,255,255,0.72)" : "var(--color-fog)" }}
            >
              {origin}
            </span>
          ) : null}
          <time
            className="text-[10px] font-medium"
            style={{ color: isLia ? "rgba(255,255,255,0.82)" : "var(--color-fog)" }}
          >
            {formatTime(message.created_at)}
          </time>
        </div>
      </div>
      {isLia ? face : null}
    </motion.div>
  );
}
