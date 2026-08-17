import { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useKpis, useExecutions } from "@/lib/hooks/useMonitor";
import {
  formatRelative,
  formatTime,
  shortId,
  sparklineFromExecutions,
  statusColor,
} from "@/lib/format";
import {
  Card,
  Chip,
  ErrorBanner,
  LiveDot,
  MetricCard,
  SectionTitle,
} from "@/components/ui";
import { Sparkline } from "@/components/Sparkline";
import { DualBar } from "@/components/DualBar";

export default function PulseScreen() {
  const kpis = useKpis();
  const executions = useExecutions(40);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const series = useMemo(
    () => sparklineFromExecutions(executions.data ?? []),
    [executions.data]
  );

  const kpi = kpis.data;
  const ticker = (executions.data ?? []).slice(0, 8);
  const refreshing = kpis.refreshing || executions.refreshing;

  const onRefresh = () => {
    void kpis.refresh();
    void executions.refresh();
  };

  void tick;

  return (
    <View className="flex-1 bg-bg">
      <LinearGradient
        colors={["#12201A", "#0B0F14", "#0B0F14"]}
        style={{ position: "absolute", left: 0, right: 0, top: 0, height: 280 }}
      />
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
          <View className="flex-row items-center justify-between mt-2 mb-5">
            <View>
              <Text className="text-muted text-xs font-sans-medium tracking-widest">
                NEXA · FENABRAVE
              </Text>
              <Text className="text-white text-3xl font-sans-bold mt-1">Pulse</Text>
            </View>
            <View className="items-end gap-1">
              <LiveDot live />
              <Text className="text-muted text-[11px] font-mono">
                atualizado {formatRelative(kpis.updatedAt)}
              </Text>
            </View>
          </View>

          {kpis.error ? <ErrorBanner message={kpis.error} /> : null}

          <Card className="mb-4 overflow-hidden">
            <View className="flex-row justify-between items-start mb-4">
              <View>
                <Text className="text-muted text-xs font-sans-medium">Conversas ao vivo</Text>
                <Text className="text-live text-4xl font-sans-bold mt-1">
                  {kpi?.conversations_live ?? "—"}
                </Text>
                <Text className="text-muted text-xs font-sans mt-1">
                  de {kpi?.conversations_total ?? 0} conversas no evento
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-muted text-xs font-sans-medium">Execuções 15 min</Text>
                <Text className="text-white text-3xl font-sans-bold mt-1">
                  {kpi?.executions_15m ?? "—"}
                </Text>
                <Text className="text-muted text-xs font-sans mt-1">
                  {kpi?.executions_1h ?? 0} na última hora
                </Text>
              </View>
            </View>
            <Sparkline data={series} color="#25D366" />
            <Text className="text-muted text-[10px] font-sans mt-2">
              Volume de execuções · última 1h
            </Text>
          </Card>

          <View className="flex-row flex-wrap gap-3 mb-4">
            <MetricCard
              label="Sucesso LIA"
              value={`${kpi?.success_lia_pct ?? 0}%`}
              hint={`${kpi?.executions_total ?? 0} execuções`}
              accent="#25D366"
            />
            <MetricCard
              label="Sucesso Meta"
              value={`${kpi?.success_meta_pct ?? 0}%`}
              hint="status de envio"
              accent="#3B82F6"
            />
            <MetricCard
              label="Entrega WA"
              value={`${kpi?.delivered_pct ?? 0}%`}
              hint="com ID mascarado"
              accent="#F59E0B"
            />
            <MetricCard
              label="Operadores"
              value={kpi?.operators_active ?? 0}
              hint={`${kpi?.messages_total ?? 0} msgs`}
              accent="#A78BFA"
            />
          </View>

          <Card className="mb-4">
            <SectionTitle title="Domínios" subtitle="Faturamento vs Pagamento" />
            <DualBar
              leftLabel="Faturamento"
              rightLabel="Pagamento"
              leftValue={kpi?.executions_faturamento ?? 0}
              rightValue={kpi?.executions_pagamento ?? 0}
              leftColor="#3B82F6"
              rightColor="#25D366"
            />
          </Card>

          <SectionTitle title="Ticker" subtitle="Últimas execuções" />
          <View className="gap-2">
            {ticker.map((item, index) => (
              <Pressable key={`${item.execution_id}-${index}`}>
                <Card className="py-3 px-3.5 flex-row items-center justify-between">
                  <View className="flex-1 mr-3">
                    <View className="flex-row items-center gap-2 mb-1">
                      <Chip
                        label={item.domain}
                        color={item.domain === "Pagamento" ? "#25D366" : "#3B82F6"}
                      />
                      <Text className="text-muted text-[11px] font-mono">
                        {formatTime(item.created_at)}
                      </Text>
                    </View>
                    <Text className="text-white text-sm font-sans-medium" numberOfLines={1}>
                      {item.holmes_user ?? "—"} · {shortId(item.execution_id)}
                    </Text>
                  </View>
                  <View className="items-end gap-1">
                    <Chip
                      label={`LIA ${item.execution_status_lia ?? "—"}`}
                      color={statusColor(item.execution_status_lia)}
                    />
                    <Chip
                      label={`Meta ${item.execution_status_meta ?? "—"}`}
                      color={statusColor(item.execution_status_meta)}
                    />
                  </View>
                </Card>
              </Pressable>
            ))}
            {ticker.length === 0 && !executions.loading ? (
              <Card>
                <Text className="text-muted text-sm font-sans text-center py-4">
                  Aguardando execuções do evento…
                </Text>
              </Card>
            ) : null}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
