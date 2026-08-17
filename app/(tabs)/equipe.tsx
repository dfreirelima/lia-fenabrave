import { useMemo } from "react";
import { View, Text, RefreshControl, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Bot, Trophy } from "lucide-react-native";
import { useConversations, useExecutions } from "@/lib/hooks/useMonitor";
import { buildOperatorStats, formatDateTime } from "@/lib/format";
import {
  Card,
  EmptyState,
  ErrorBanner,
  SectionTitle,
} from "@/components/ui";
import type { OperatorStats } from "@/lib/types";

export default function EquipeScreen() {
  const conversations = useConversations();
  const executions = useExecutions(200);

  const { humans, lia } = useMemo(
    () => buildOperatorStats(conversations.data ?? [], executions.data ?? []),
    [conversations.data, executions.data]
  );

  const refreshing = conversations.refreshing || executions.refreshing;
  const error = conversations.error || executions.error;

  const onRefresh = () => {
    void conversations.refresh();
    void executions.refresh();
  };

  return (
    <View className="flex-1 bg-bg">
      <SafeAreaView className="flex-1" edges={["top"]}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#25D366"
            />
          }
        >
          <View className="mt-2 mb-4">
            <Text className="text-white text-3xl font-sans-bold">Equipe</Text>
            <Text className="text-muted text-sm font-sans mt-0.5">
              Quem mais está testando no evento
            </Text>
          </View>

          {error ? <ErrorBanner message={error} /> : null}

          <SectionTitle
            title="Ranking de operadores"
            subtitle="Exclui a agente Lia do ranking humano"
          />

          {humans.length === 0 ? (
            <EmptyState
              title="Sem operadores ainda"
              subtitle="Assim que houver testes humanos, o ranking aparece."
            />
          ) : (
            <View className="gap-2.5 mb-5">
              {humans.map((op, index) => (
                <OperatorCard key={op.name} op={op} rank={index + 1} />
              ))}
            </View>
          )}

          {lia ? (
            <>
              <SectionTitle
                title="Agente Lia"
                subtitle="Volume do assistente — fora do ranking humano"
              />
              <Card className="border-live/30 bg-live/5">
                <View className="flex-row items-center gap-3 mb-3">
                  <View className="h-11 w-11 rounded-full bg-live/20 items-center justify-center">
                    <Bot color="#25D366" size={22} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-sans-bold text-base">Lia</Text>
                    <Text className="text-muted text-xs font-sans">
                      Última atividade {formatDateTime(lia.last_at)}
                    </Text>
                  </View>
                </View>
                <View className="flex-row justify-between">
                  <Stat label="Conversas" value={lia.conversations} />
                  <Stat label="Execuções" value={lia.executions} />
                  <Stat label="Turnos" value={lia.turns} />
                </View>
              </Card>
            </>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function OperatorCard({ op, rank }: { op: OperatorStats; rank: number }) {
  const medal =
    rank === 1 ? "#F59E0B" : rank === 2 ? "#94A3B8" : rank === 3 ? "#B45309" : "#3B82F6";

  return (
    <Card>
      <View className="flex-row items-center gap-3 mb-3">
        <View
          className="h-10 w-10 rounded-full items-center justify-center"
          style={{ backgroundColor: `${medal}22`, borderWidth: 1, borderColor: `${medal}55` }}
        >
          {rank <= 3 ? (
            <Trophy size={16} color={medal} />
          ) : (
            <Text className="font-sans-bold" style={{ color: medal }}>
              {rank}
            </Text>
          )}
        </View>
        <View className="flex-1">
          <Text className="text-white font-sans-bold text-base">{op.name}</Text>
          <Text className="text-muted text-xs font-sans">
            Última atividade {formatDateTime(op.last_at)}
          </Text>
        </View>
        <Text className="text-ops font-mono-medium text-sm">{op.share}%</Text>
      </View>

      <View className="h-2 rounded-full bg-cardElevated overflow-hidden mb-3">
        <View
          className="h-full rounded-full bg-ops"
          style={{ width: `${Math.max(op.share, 4)}%` }}
        />
      </View>

      <View className="flex-row justify-between">
        <Stat label="Conversas" value={op.conversations} />
        <Stat label="Execuções" value={op.executions} />
        <Stat label="Turnos" value={op.turns} />
      </View>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View className="items-center flex-1">
      <Text className="text-white text-lg font-sans-bold">{value}</Text>
      <Text className="text-muted text-[11px] font-sans">{label}</Text>
    </View>
  );
}
