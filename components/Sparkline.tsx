import { View } from "react-native";

type Props = {
  data: number[];
  height?: number;
  color?: string;
};

export function Sparkline({ data, height = 48, color = "#25D366" }: Props) {
  const max = Math.max(...data, 1);

  return (
    <View className="flex-row items-end gap-1" style={{ height }}>
      {data.map((value, index) => {
        const ratio = value / max;
        const barHeight = Math.max(4, Math.round(ratio * height));
        return (
          <View
            key={`${index}-${value}`}
            className="flex-1 rounded-t-md"
            style={{
              height: barHeight,
              backgroundColor: color,
              opacity: 0.35 + ratio * 0.65,
            }}
          />
        );
      })}
    </View>
  );
}
