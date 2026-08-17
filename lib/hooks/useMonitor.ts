import { useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { usePolling } from "@/lib/hooks/usePolling";
import type {
  FenabraveConversation,
  FenabraveExecution,
  FenabraveKpis,
  FenabraveMessage,
} from "@/lib/types";

export function useKpis() {
  const fetcher = useCallback(async () => {
    const { data, error } = await supabase
      .from("fenabrave_monitor_kpis")
      .select("*")
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data as FenabraveKpis | null;
  }, []);

  return usePolling({ fetcher });
}

export function useExecutions(limit = 80) {
  const fetcher = useCallback(async () => {
    const { data, error } = await supabase
      .from("fenabrave_monitor_executions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as FenabraveExecution[];
  }, [limit]);

  return usePolling({ fetcher });
}

export function useConversations() {
  const fetcher = useCallback(async () => {
    const { data, error } = await supabase
      .from("fenabrave_monitor_conversations")
      .select("*")
      .order("last_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as FenabraveConversation[];
  }, []);

  return usePolling({ fetcher });
}

export function useMessages(conversationId: string | undefined) {
  const fetcher = useCallback(async () => {
    if (!conversationId) return [] as FenabraveMessage[];
    const { data, error } = await supabase
      .from("fenabrave_monitor_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("sort_key", { ascending: true });
    if (error) throw error;
    return (data ?? []) as FenabraveMessage[];
  }, [conversationId]);

  return usePolling({ fetcher, enabled: Boolean(conversationId) });
}
