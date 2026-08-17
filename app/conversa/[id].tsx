import { useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  type FlatList as FlatListType,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Lock } from "lucide-react-native";
import { useMessages } from "@/lib/hooks/useMonitor";
import { formatTime } from "@/lib/format";
import { Chip, EmptyState, ErrorBanner, LiveDot } from "@/components/ui";
import type { FenabraveMessage } from "@/lib/types";

export default function ConversaThreadScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id: string;
    name?: string;
    domain?: string;
    live?: string;
  }>();
  const conversationId = Array.isArray(params.id) ? params.id[0] : params.id;
  const name = Array.isArray(params.name) ? params.name[0] : params.name;
  const domain = Array.isArray(params.domain) ? params.domain[0] : params.domain;
  const live = (Array.isArray(params.live) ? params.live[0] : params.live) === "1";

  const { data, error, loading } = useMessages(conversationId);
  const listRef = useRef<FlatListType<FenabraveMessage>>(null);
  const messages = useMemo(() => data ?? [], [data]);

  useEffect(() => {
    if (messages.length === 0) return;
    const t = setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 120);
    return () => clearTimeout(t);
  }, [messages.length]);

  return (
    <View className="flex-1" style={{ backgroundColor: "#0B141A" }}>
      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        <View className="flex-row items-center px-3 py-2.5 border-b border-[#1F2C34] bg-[#1F2C34]">
          <Pressable
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center mr-1"
            hitSlop={8}
          >
            <ArrowLeft color="#E9EDEF" size={22} />
          </Pressable>
          <View className="h-10 w-10 rounded-full bg-ops/30 items-center justify-center mr-3">
            <Text className="text-ops font-sans-bold">
              {(name ?? "?").slice(0, 1).toUpperCase()}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-[#E9EDEF] font-sans-bold text-base" numberOfLines={1}>
              {name ?? "Conversa"}
            </Text>
            <View className="flex-row items-center gap-2 mt-0.5">
              {domain ? (
                <Chip
                  label={domain}
                  color={domain === "Pagamento" ? "#25D366" : "#53BDEB"}
                />
              ) : null}
              <LiveDot live={live} />
            </View>
          </View>
        </View>

        {error ? <ErrorBanner message={error} /> : null}

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.message_id}
          contentContainerStyle={{
            paddingHorizontal: 12,
            paddingVertical: 16,
            paddingBottom: 24,
            flexGrow: 1,
          }}
          ListEmptyComponent={
            !loading ? (
              <EmptyState
                title="Sem mensagens"
                subtitle="Esta conversa ainda não tem turnos registrados."
              />
            ) : null
          }
          renderItem={({ item }) => <Bubble message={item} />}
        />

        <View className="mx-3 mb-2 rounded-2xl bg-[#1F2C34] border border-[#2A3942] px-4 py-3 flex-row items-center justify-center gap-2">
          <Lock size={14} color="#8696A0" />
          <Text className="text-[#8696A0] text-xs font-sans">
            Somente leitura · o monitor não envia mensagens
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

function Bubble({ message }: { message: FenabraveMessage }) {
  const isLia = message.role === "lia";

  return (
    <View className={`mb-2 max-w-[82%] ${isLia ? "self-end" : "self-start"}`}>
      <View
        className="rounded-2xl px-3.5 py-2.5"
        style={{
          backgroundColor: isLia ? "#005C4B" : "#1F2A3A",
          borderBottomRightRadius: isLia ? 4 : 16,
          borderBottomLeftRadius: isLia ? 16 : 4,
        }}
      >
        {!isLia ? (
          <Text className="text-[#53BDEB] text-[11px] font-sans-medium mb-1">
            {message.holmes_author ?? "Usuário"}
          </Text>
        ) : (
          <Text className="text-[#25D366] text-[11px] font-sans-medium mb-1">Lia</Text>
        )}
        <Text className="text-[#E9EDEF] text-[15px] font-sans leading-5">
          {message.body}
        </Text>
        <Text
          className={`text-[10px] font-mono mt-1.5 ${
            isLia ? "text-[#A8D5CC] self-end" : "text-[#8696A0] self-end"
          }`}
        >
          {formatTime(message.created_at)}
          {isLia ? " ✓✓" : ""}
        </Text>
      </View>
    </View>
  );
}
