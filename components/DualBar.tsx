import { View, Text } from "react-native";

type Props = {
  leftLabel: string;
  rightLabel: string;
  leftValue: number;
  rightValue: number;
  leftColor?: string;
  rightColor?: string;
};

export function DualBar({
  leftLabel,
  rightLabel,
  leftValue,
  rightValue,
  leftColor = "#3B82F6",
  rightColor = "#25D366",
}: Props) {
  const total = leftValue + rightValue || 1;
  const leftPct = Math.round((leftValue / total) * 100);
  const rightPct = 100 - leftPct;

  return (
    <View>
      <View className="flex-row justify-between mb-2">
        <Text className="text-muted text-xs font-sans">
          {leftLabel} · {leftValue}
        </Text>
        <Text className="text-muted text-xs font-sans">
          {rightLabel} · {rightValue}
        </Text>
      </View>
      <View className="h-3 rounded-full overflow-hidden flex-row bg-cardElevated">
        <View style={{ width: `${leftPct}%`, backgroundColor: leftColor }} />
        <View style={{ width: `${rightPct}%`, backgroundColor: rightColor }} />
      </View>
      <View className="flex-row justify-between mt-1.5">
        <Text className="text-white text-xs font-mono-medium">{leftPct}%</Text>
        <Text className="text-white text-xs font-mono-medium">{rightPct}%</Text>
      </View>
    </View>
  );
}
