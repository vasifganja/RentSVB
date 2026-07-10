import React from "react";
import { Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";

type Props = {
  total: number;
};

export default function FinanceSummary({ total }: Props) {
  if (total <= 0) return null;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        padding: 14,
        marginBottom: 16,
        borderRadius: 12,
        borderWidth: 1,
        backgroundColor: "#fef3c7",
        borderColor: "#fbbf24",
      }}
    >
      <Feather
        name="alert-circle"
        size={20}
        color="#92400e"
      />

      <Text
        style={{
          flex: 1,
          color: "#92400e",
          fontSize: 14,
          fontWeight: "600",
        }}
      >
        Ödənilməmiş komissiya:{" "}
        <Text
          style={{
            fontWeight: "800",
          }}
        >
          {total} ₽
        </Text>
      </Text>
    </View>
  );
}