import { Tabs } from "expo-router";
import { View, Text, Platform } from "react-native";
import { BlurView } from "expo-blur";
import {
  Activity,
  MessageCircle,
  Radar,
  Users,
} from "lucide-react-native";
import { useConversations } from "@/lib/hooks/useMonitor";

function TabIcon({
  icon: Icon,
  color,
  label,
  badge,
}: {
  icon: typeof Activity;
  color: string;
  label: string;
  badge?: number;
}) {
  return (
    <View className="items-center justify-center pt-1 min-w-[64px]">
      <View>
        <Icon size={22} color={color} strokeWidth={2.2} />
        {badge && badge > 0 ? (
          <View className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 rounded-full bg-live items-center justify-center px-1">
            <Text className="text-[9px] text-bg font-sans-bold">{badge > 9 ? "9+" : badge}</Text>
          </View>
        ) : null}
      </View>
      <Text
        className="text-[10px] mt-1 font-sans-medium"
        style={{ color }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  const { data: conversations } = useConversations();
  const liveCount = conversations?.filter((c) => c.is_live).length ?? 0;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: "absolute",
          left: 16,
          right: 16,
          bottom: Platform.OS === "ios" ? 24 : 16,
          height: 68,
          borderRadius: 24,
          backgroundColor: Platform.OS === "ios" ? "transparent" : "#121821EE",
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: "#243044",
          elevation: 0,
          paddingBottom: 0,
          overflow: "hidden",
        },
        tabBarBackground: () =>
          Platform.OS === "ios" ? (
            <BlurView intensity={40} tint="dark" style={{ flex: 1 }} />
          ) : (
            <View style={{ flex: 1, backgroundColor: "#121821F2" }} />
          ),
        tabBarActiveTintColor: "#25D366",
        tabBarInactiveTintColor: "#8B9BB4",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Pulse",
          tabBarIcon: ({ color }) => (
            <TabIcon icon={Activity} color={color} label="Pulse" />
          ),
        }}
      />
      <Tabs.Screen
        name="conversas"
        options={{
          title: "Conversas",
          tabBarIcon: ({ color }) => (
            <TabIcon
              icon={MessageCircle}
              color={color}
              label="Conversas"
              badge={liveCount}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="operacoes"
        options={{
          title: "Operações",
          tabBarIcon: ({ color }) => (
            <TabIcon icon={Radar} color={color} label="Operações" />
          ),
        }}
      />
      <Tabs.Screen
        name="equipe"
        options={{
          title: "Equipe",
          tabBarIcon: ({ color }) => (
            <TabIcon icon={Users} color={color} label="Equipe" />
          ),
        }}
      />
    </Tabs>
  );
}
