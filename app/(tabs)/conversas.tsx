import { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  RefreshControl,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Search } from "lucide-react-native";
import { useConversations } from "@/lib/hooks/useMonitor";
import { formatTime, previewText } from "@/lib/format";
import {
  Avatar,
  Chip,
  EmptyState,
  ErrorBanner,
  FilterPill,
  LiveDot,
} from "@/components/ui";
import type { Domain, FenabraveConversation } from "@/lib/types";

type Filter = "all" | "live" | Domain;

export default function ConversasScreen() {
  const router = useRouter();
  const { data, error, refreshing, refresh, loading } = useConversations();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const items = useMemo(() => {
    let list = data ?? [];
    if (filter === "live") list = list.filter((c) => c.is_live);
    if (filter === "Faturamento" || filter === "Pagamento") {
      list = list.filter((c) => c.domain === filter);
    }
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
  }, [data, filter, query]);

  const liveCount = (data ?? []).filter((c) => c.is_live).length;

  return (
    <View className="flex-1 bg-bg">
      <SafeAreaView className="flex-1" edges={["top"]}>
        <View className="px-4 pt-2 pb-3">
          <View className="flex-row items-center justify-between mb-3">
            <View>
              <Text className="text-white text-3xl font-sans-bold">Conversas</Text>
              <Text className="text-muted text-sm font-sans mt-0.5">
                {liveCount} ao vivo · {(data ?? []).length} no total
              </Text>
            </View>
            <LiveDot live={liveCount > 0} />
          </View>

          <View className="flex-row items-center rounded-2xl bg-card border border-border px-3 mb-3">
            <Search size={18} color="#8B9BB4" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Buscar operador ou mensagem"
              placeholderTextColor="#8B9BB4"
              className="flex-1 px-2 py-3 text-white font-sans text-sm"
            />
          </View>

          <View className="flex-row">
            {(
              [
                ["all", "Todas"],
                ["live", "Ao vivo"],
                ["Faturamento", "Faturamento"],
                ["Pagamento", "Pagamento"],
              ] as const
            ).map(([key, label]) => (
              <FilterPill
                key={key}
                label={label}
                active={filter === key}
                onPress={() => setFilter(key)}
              />
            ))}
          </View>
        </View>

        {error ? <ErrorBanner message={error} /> : null}

        <FlatList
          data={items}
          keyExtractor={(item) => item.conversation_id}
          contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void refresh()}
              tintColor="#25D366"
            />
          }
          ListEmptyComponent={
            !loading ? (
              <EmptyState
                title="Nenhuma conversa"
                subtitle="Assim que os testes começarem, elas aparecem aqui."
              />
            ) : null
          }
          renderItem={({ item }) => (
            <ConversationRow
              item={item}
              onPress={() =>
                router.push({
                  pathname: "/conversa/[id]",
                  params: {
                    id: item.conversation_id,
                    name: item.operator_name,
                    domain: item.domain,
                    live: item.is_live ? "1" : "0",
                  },
                })
              }
            />
          )}
        />
      </SafeAreaView>
    </View>
  );
}

function ConversationRow({
  item,
  onPress,
}: {
  item: FenabraveConversation;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center py-3 border-b border-border/50"
    >
      <Avatar name={item.operator_name} live={item.is_live} />
      <View className="flex-1 ml-3 mr-2">
        <View className="flex-row items-center justify-between mb-0.5">
          <Text className="text-white font-sans-bold text-[15px]" numberOfLines={1}>
            {item.operator_name}
          </Text>
          <Text className="text-muted text-[11px] font-mono ml-2">
            {formatTime(item.last_at)}
          </Text>
        </View>
        <Text className="text-muted text-sm font-sans" numberOfLines={1}>
          {previewText(item.last_user_msg)}
        </Text>
        <View className="flex-row items-center gap-2 mt-1.5">
          <Chip
            label={item.domain}
            color={item.domain === "Pagamento" ? "#25D366" : "#3B82F6"}
          />
          <Text className="text-muted text-[11px] font-sans">
            {item.turns} turnos
          </Text>
        </View>
      </View>
      <View className="rounded-full bg-cardElevated min-w-[24px] h-6 items-center justify-center px-1.5">
        <Text className="text-live text-[11px] font-sans-bold">{item.turns}</Text>
      </View>
    </Pressable>
  );
}
