import { useEffect, useState, type ReactNode } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import { Lock } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

const STORAGE_KEY = "fenabrave_monitor_unlocked";

type Props = {
  children: ReactNode;
};

async function readUnlocked(): Promise<boolean> {
  try {
    if (Platform.OS === "web") {
      return globalThis.localStorage?.getItem(STORAGE_KEY) === "1";
    }
    return (await SecureStore.getItemAsync(STORAGE_KEY)) === "1";
  } catch {
    return false;
  }
}

async function writeUnlocked(): Promise<void> {
  try {
    if (Platform.OS === "web") {
      globalThis.localStorage?.setItem(STORAGE_KEY, "1");
      return;
    }
    await SecureStore.setItemAsync(STORAGE_KEY, "1");
  } catch {
    // still unlock for session
  }
}

export function PinGate({ children }: Props) {
  const expected = process.env.EXPO_PUBLIC_MONITOR_PIN ?? "2580";
  const [ready, setReady] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ok = await readUnlocked();
      if (!cancelled && ok) setUnlocked(true);
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const submit = async () => {
    if (pin === expected) {
      setUnlocked(true);
      setError(false);
      await writeUnlocked();
    } else {
      setError(true);
      setPin("");
    }
  };

  if (!ready) {
    return <View className="flex-1 bg-bg" />;
  }

  if (unlocked) {
    return <>{children}</>;
  }

  return (
    <LinearGradient colors={["#0B0F14", "#121821", "#0B0F14"]} style={styles.fill}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 items-center justify-center px-8"
      >
        <View className="h-16 w-16 rounded-2xl bg-ops/20 border border-ops/40 items-center justify-center mb-6">
          <Lock color="#3B82F6" size={28} />
        </View>
        <Text className="text-white text-2xl font-sans-bold text-center">
          Fenabrave Monitor
        </Text>
        <Text className="text-muted text-sm font-sans text-center mt-2 mb-8">
          Digite o PIN para acompanhar o evento
        </Text>
        <TextInput
          value={pin}
          onChangeText={(t) => {
            setPin(t.replace(/\D/g, "").slice(0, 6));
            setError(false);
          }}
          keyboardType="number-pad"
          secureTextEntry
          maxLength={6}
          placeholder="••••"
          placeholderTextColor="#8B9BB4"
          className="w-full rounded-2xl bg-card border border-border px-4 py-4 text-center text-white text-2xl font-mono tracking-[8px]"
          onSubmitEditing={submit}
        />
        {error ? (
          <Text className="text-danger text-xs font-sans mt-3">PIN incorreto</Text>
        ) : null}
        <Pressable
          onPress={submit}
          className="mt-6 w-full rounded-2xl bg-ops py-4 items-center"
        >
          <Text className="text-white font-sans-bold text-base">Entrar</Text>
        </Pressable>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
