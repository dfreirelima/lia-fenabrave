import { useMemo, useState } from "react";
import { View, Text, RefreshControl, ScrollView, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useExecutions } from "@/lib/hooks/useMonitor";
import {
  formatTime,
  healthColor,
  shortId,
  statusColor,
} from "@/lib/format";
import {
  Card,
  Chip,
  EmptyState,
  ErrorBanner,
  FilterPill,
} from "@/components/ui";
import type { Domain, FenabraveExecution, Health } from "@/lib/types";

type HealthFilter = "all" | Health;
type DomainFilter = "all" | Domain;

export default function OperacoesScreen() {
  const { data, error, refreshing, refresh, loading } = useExecutions(120);
  const [healthFilter, setHealthFilter] = useState<HealthFilter>("all");
  const [domainFilter, setDomainFilter] = useState<DomainFilter>("all");

  const items = useMemo(() => {
    let list = data ?? [];
    if (healthFilter !== "all") list = list.filter((e) => e.health === healthFilter);
    if (domainFilter !== "all") list = list.filter((e) => e.domain === domainFilter);
    return list;
  }, [data, healthFilter, domainFilter]);

  const summary = useMemo(() => {
    const all = data ?? [];
    const total = all.length || 1;
    const saudavel = all.filter((e) => e.health === "saudavel").length;
    const parcial = all.filter((e) => e.health === "parcial").length;
    const falha = all.filter((e) => e.health === "falha").length;
    return {
      saudavelPct: Math.round((saudavel / total) * 100),
      parcialPct: Math.round((parcial / total) * 100),
      falhaPct: Math.round((falha / total) * 100),
      total: all.length,
    };
  }, [data]);

  return (
    <View className="flex-1 bg-bg">
      <SafeAreaView className="flex-1" edges={["top"]}>
        <View className="px-4 pt-2 pb-2">
          <Text className="text-white text-3xl font-sans-bold">Operações</Text>
          <Text className="text-muted text-sm font-sans mt-0.5 mb-3">
            Saúde das execuções em tempo real
          </Text>

          <Card className="mb-3 py-3">
            <View className="flex-row justify-between">
              <SummaryStat label="Saudável" value={`${summary.saudavelPct}%`} color="#25D366" />
              <SummaryStat label="Parcial" value={`${summary.parcialPct}%`} color="#F59E0B" />
              <SummaryStat label="Falha" value={`${summary.falhaPct}%`} color="#EF4444" />
              <SummaryStat label="Total" value={summary.total} color="#3B82F6" />
            </View>
          </Card>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
            <View className="flex-row">
              {(
                [
                  ["all", "Todas"],
                  ["saudavel", "Saudável"],
                  ["parcial", "Parcial"],
                  ["falha", "Falha"],
                ] as const
              ).map(([key, label]) => (
                <FilterPill
                  key={key}
                  label={label}
                  active={healthFilter === key}
                  onPress={() => setHealthFilter(key)}
                />
              ))}
            </View>
          </ScrollView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
            <View className="flex-row">
              {(
                [
                  ["all", "Domínios"],
                  ["Faturamento", "Faturamento"],
                  ["Pagamento", "Pagamento"],
                ] as const
              ).map(([key, label]) => (
                <FilterPill
                  key={key}
                  label={label}
                  active={domainFilter === key}
                  onPress={() => setDomainFilter(key)}
                />
              ))}
            </View>
          </ScrollView>
        </View>

        {error ? <ErrorBanner message={error} /> : null}

        <FlatList
          data={items}
          keyExtractor={(item, index) => `${item.execution_id ?? "x"}-${index}`}
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
                title="Sem execuções"
                subtitle="Filtros sem resultado ou evento ainda sem atividade."
              />
            ) : null
          }
          renderItem={({ item }) => <ExecutionCard item={item} />}
        />
      </SafeAreaView>
    </View>
  );
}

function SummaryStat({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <View className="items-center flex-1">
      <Text className="text-xl font-sans-bold" style={{ color }}>
        {value}
      </Text>
      <Text className="text-muted text-[11px] font-sans mt-0.5">{label}</Text>
    </View>
  );
}

function ExecutionCard({ item }: { item: FenabraveExecution }) {
  return (
    <Card className="mb-2.5 py-3.5">
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-2">
          <Chip
            label={item.domain}
            color={item.domain === "Pagamento" ? "#25D366" : "#3B82F6"}
          />
          <Chip label={item.health} color={healthColor(item.health)} />
        </View>
        <Text className="text-muted text-[11px] font-mono">{formatTime(item.created_at)}</Text>
      </View>
      <Text className="text-white font-sans-medium text-[15px] mb-1">
        {item.holmes_user ?? "—"}
      </Text>
      <Text className="text-muted text-xs font-mono mb-2.5">
        {shortId(item.execution_id, 14)}
      </Text>
      <View className="flex-row flex-wrap gap-2 items-center">
        <Chip
          label={`LIA · ${item.execution_status_lia ?? "—"}`}
          color={statusColor(item.execution_status_lia)}
        />
        <Chip
          label={`Meta · ${item.execution_status_meta ?? "—"}`}
          color={statusColor(item.execution_status_meta)}
        />
        <Chip
          label={
            item.delivered && item.send_wa_masked
              ? `Entregue ${item.send_wa_masked}`
              : "Sem WA"
          }
          color={item.delivered ? "#25D366" : "#8B9BB4"}
          muted={!item.delivered}
        />
      </View>
    </Card>
  );
}
