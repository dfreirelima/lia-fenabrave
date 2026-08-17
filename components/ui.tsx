import { View, Text, Pressable, type ViewProps } from "react-native";
import type { ReactNode } from "react";

type CardProps = ViewProps & {
  children: ReactNode;
  className?: string;
};

export function Card({ children, className = "", ...props }: CardProps) {
  return (
    <View
      className={`rounded-2xl bg-card border border-border/60 p-4 ${className}`}
      {...props}
    >
      {children}
    </View>
  );
}

export function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <View className="mb-3">
      <Text className="text-white text-lg font-sans-bold">{title}</Text>
      {subtitle ? (
        <Text className="text-muted text-sm font-sans mt-0.5">{subtitle}</Text>
      ) : null}
    </View>
  );
}

export function LiveDot({ live = true }: { live?: boolean }) {
  return (
    <View className="flex-row items-center gap-2">
      <View
        className={`h-2.5 w-2.5 rounded-full ${live ? "bg-live" : "bg-muted"}`}
      />
      <Text className={`text-xs font-sans-medium ${live ? "text-live" : "text-muted"}`}>
        {live ? "AO VIVO" : "PAUSADO"}
      </Text>
    </View>
  );
}

export function Chip({
  label,
  color = "#3B82F6",
  muted = false,
}: {
  label: string;
  color?: string;
  muted?: boolean;
}) {
  return (
    <View
      className="rounded-full px-2.5 py-1"
      style={{
        backgroundColor: muted ? "#1A2332" : `${color}22`,
        borderWidth: 1,
        borderColor: muted ? "#243044" : `${color}55`,
      }}
    >
      <Text
        className="text-[11px] font-sans-medium"
        style={{ color: muted ? "#8B9BB4" : color }}
      >
        {label}
      </Text>
    </View>
  );
}

export function MetricCard({
  label,
  value,
  hint,
  accent = "#3B82F6",
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: string;
}) {
  return (
    <Card className="flex-1 min-w-[46%] p-3.5">
      <Text className="text-muted text-xs font-sans-medium mb-1">{label}</Text>
      <Text className="text-white text-2xl font-sans-bold" style={{ color: accent }}>
        {value}
      </Text>
      {hint ? <Text className="text-muted text-[11px] mt-1 font-sans">{hint}</Text> : null}
    </Card>
  );
}

export function FilterPill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-full px-3.5 py-2 mr-2 border ${
        active ? "bg-ops/20 border-ops" : "bg-cardElevated border-border"
      }`}
    >
      <Text
        className={`text-xs font-sans-medium ${active ? "text-ops" : "text-muted"}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function Avatar({ name, live }: { name: string; live?: boolean }) {
  const label = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <View className="relative">
      <View className="h-12 w-12 rounded-full bg-ops/25 items-center justify-center border border-ops/40">
        <Text className="text-ops font-sans-bold text-base">{label || "?"}</Text>
      </View>
      {live ? (
        <View className="absolute -right-0.5 -bottom-0.5 h-3.5 w-3.5 rounded-full bg-live border-2 border-bg" />
      ) : null}
    </View>
  );
}

export function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View className="items-center justify-center py-16 px-6">
      <Text className="text-white font-sans-bold text-base text-center">{title}</Text>
      {subtitle ? (
        <Text className="text-muted font-sans text-sm text-center mt-2">{subtitle}</Text>
      ) : null}
    </View>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <View className="mx-4 mb-3 rounded-xl bg-danger/15 border border-danger/40 px-3 py-2">
      <Text className="text-danger text-xs font-sans-medium">{message}</Text>
    </View>
  );
}
