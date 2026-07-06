import * as Haptics from "expo-haptics";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { useLang } from "@/context/LangContext";

type Status = "available" | "busy" | "salary_credit";

type Props = {
  status: Status;
  onStatusChange: (s: Status) => void;
  loading?: boolean;
};

const STATUS_OPTIONS: { value: Status; labelKey: string; color: string; bg: string }[] = [
  { value: "available", labelKey: "available", color: "#22c55e", bg: "#f0fdf4" },
  { value: "busy", labelKey: "busy", color: "#ef4444", bg: "#fef2f2" },
  { value: "salary_credit", labelKey: "salary_credit", color: "#f59e0b", bg: "#fffbeb" },
];

export function StatusButton({ status, onStatusChange, loading }: Props) {
  const colors = useColors();
  const { tr } = useLang();

  return (
    <View style={styles.container}>
      {STATUS_OPTIONS.map((opt) => (
        <TouchableOpacity
          key={opt.value}
          style={[
            styles.btn,
            {
              backgroundColor: status === opt.value ? opt.color : colors.muted,
              borderColor: status === opt.value ? opt.color : colors.border,
            },
          ]}
          onPress={async () => {
            if (loading) return;
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onStatusChange(opt.value);
          }}
        >
          <View
            style={[
              styles.dot,
              { backgroundColor: status === opt.value ? "#fff" : opt.color },
            ]}
          />
          <Text
            style={[
              styles.label,
              { color: status === opt.value ? "#fff" : colors.mutedForeground },
            ]}
          >
            {tr(opt.labelKey)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
  },
});
