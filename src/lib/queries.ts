import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { select, selectOne } from "@/lib/rest";
import { usePulse } from "@/lib/store";
import type { Conversation, Execution, Kpis, Message } from "@/lib/types";

/** How often each view is re-read while the monitor is live. */
const TICK = {
  kpis: 3_000,
  executions: 4_000,
  conversations: 4_000,
  messages: 2_500,
} as const;

/**
 * Shared options: keep the previous data on screen while refetching (no
 * flicker), retry transient network blips, and let the `live` switch turn
 * the interval off entirely.
 */
function pollOptions(interval: number, live: boolean) {
  return {
    refetchInterval: live ? interval : (false as const),
    // Never poll a hidden tab — saves battery on the event floor.
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    staleTime: interval / 2,
    retry: 2,
    placeholderData: keepPreviousData,
  };
}

export function useKpis() {
  const live = usePulse((s) => s.live);
  return useQuery({
    queryKey: ["kpis"],
    queryFn: ({ signal }) => selectOne<Kpis>("fenabrave_monitor_kpis", { signal }),
    ...pollOptions(TICK.kpis, live),
  });
}

export function useExecutions(limit = 80) {
  const live = usePulse((s) => s.live);
  return useQuery({
    queryKey: ["executions", limit],
    queryFn: ({ signal }) =>
      select<Execution>("fenabrave_monitor_executions", {
        order: { column: "created_at", ascending: false },
        limit,
        signal,
      }),
    ...pollOptions(TICK.executions, live),
  });
}

export function useConversations() {
  const live = usePulse((s) => s.live);
  return useQuery({
    queryKey: ["conversations"],
    queryFn: ({ signal }) =>
      select<Conversation>("fenabrave_monitor_conversations", {
        order: { column: "last_at", ascending: false },
        signal,
      }),
    ...pollOptions(TICK.conversations, live),
  });
}

export function useMessages(conversationId: string | undefined) {
  const live = usePulse((s) => s.live);
  const id = conversationId ? decodeURIComponent(conversationId) : undefined;
  return useQuery({
    queryKey: ["messages", id],
    enabled: Boolean(id),
    queryFn: ({ signal }) =>
      select<Message>("fenabrave_monitor_messages", {
        eq: { conversation_id: id! },
        order: { column: "sort_key", ascending: true },
        signal,
      }),
    ...pollOptions(TICK.messages, live),
  });
}

/** Single conversation header data, served from the already-cached list. */
export function useConversation(conversationId: string | undefined) {
  const { data, ...rest } = useConversations();
  const id = conversationId ? decodeURIComponent(conversationId) : undefined;
  return {
    ...rest,
    data: id ? data?.find((c) => c.conversation_id === id) : undefined,
  };
}
