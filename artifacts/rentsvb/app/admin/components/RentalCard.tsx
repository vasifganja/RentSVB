import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Rental } from "./types";

type Props = {
  rental: Rental;
  colors: any;
  onTogglePaid: (rental: Rental) => void;
};

export default function RentalCard({
  rental,
  colors,
  onTogglePaid,
}: Props) {
  return (
    <View
      style={[
        {
          borderRadius: 14,
          borderWidth: 1,
          padding: 14,
          marginBottom: 12,
          gap: 10,
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          gap: 12,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: colors.foreground,
              fontWeight: "700",
              fontSize: 15,
            }}
          >
            {rental.owner?.full_name ?? "?"} —{" "}
            {rental.property?.address ?? "?"}
          </Text>

          <Text
            style={{
              color: colors.mutedForeground,
              marginTop: 4,
            }}
          >
            {rental.start_date} → {rental.end_date} · {rental.days} gün ·{" "}
            {rental.price_per_day} ₽/gün
          </Text>

          <Text
            style={{
              color: colors.mutedForeground,
              marginTop: 4,
            }}
          >
            Komissiya {rental.commission_rate}%:
            <Text
              style={{
                color: colors.foreground,
                fontWeight: "700",
              }}
            >
              {" "}
              {rental.commission_amount} ₽
            </Text>
          </Text>

          {!!rental.customer_name && (
            <Text
              style={{
                color: colors.mutedForeground,
                marginTop: 4,
              }}
            >
              👤 {rental.customer_name}
            </Text>
          )}

          {!!rental.customer_phone && (
            <Text
              style={{
                color: colors.mutedForeground,
                marginTop: 2,
              }}
            >
              📞 {rental.customer_phone}
            </Text>
          )}

          {!!rental.payment_method && (
            <Text
              style={{
                color: colors.mutedForeground,
                marginTop: 4,
              }}
            >
              💳{" "}
              {rental.payment_method === "salary"
                ? "Maaşa qədər"
                : rental.payment_method === "card"
                ? "Kart"
                : "Nəğd"}
            </Text>
          )}

          {!!rental.note && (
            <Text
              style={{
                color: colors.mutedForeground,
                marginTop: 4,
              }}
            >
              📝 {rental.note}
            </Text>
          )}
        </View>

        <TouchableOpacity
          onPress={() => onTogglePaid(rental)}
          style={{
            backgroundColor: rental.is_paid
              ? "#f59e0b"
              : colors.available,
            paddingHorizontal: 12,
            paddingVertical: 7,
            borderRadius: 8,
          }}
        >
          <Text
            style={{
              color: "#fff",
              fontWeight: "700",
              fontSize: 12,
            }}
          >
            {rental.is_paid ? "↩ Geri qaytar" : "✅ Ödənildi"}
          </Text>
        </TouchableOpacity>
      </View>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text
          style={{
            color: colors.mutedForeground,
            fontSize: 12,
          }}
        >
          {new Date(rental.created_at).toLocaleDateString("ru-RU")}
        </Text>

        {rental.is_paid && rental.paid_at && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Feather
              name="check-circle"
              size={14}
              color={colors.available}
            />
            <Text
              style={{
                color: colors.available,
                fontSize: 12,
                fontWeight: "600",
              }}
            >
              Ödənilib
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}