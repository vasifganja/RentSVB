import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import * as Haptics from "expo-haptics";

import { Feather } from "@expo/vector-icons";

import { supabase } from "@/lib/supabase";

import { Rental } from "./types";

import RentalCard from "./RentalCard";
import CommissionSettings from "./CommissionSettings";
import FinanceSummary from "./FinanceSummary";
import AddRentalModal from "./AddRentalModal";

type Props = {
  colors: any;
  insets: any;
};

export default function FinanceTab({
  colors,
  insets,
}: Props) {
  const [rentals, setRentals] =
    useState<Rental[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [commissionRate, setCommissionRate] =
    useState("10");

  const [savingRate, setSavingRate] =
    useState(false);

  const [showAddRental, setShowAddRental] =
    useState(false);

  const [filter, setFilter] =
    useState<"unpaid" | "all">("unpaid");
      const fetchData = useCallback(async () => {
    setLoading(true);

    const [rentalsRes, settingsRes] = await Promise.all([
      supabase
        .from("rentals")
        .select(
          "*, property:properties(address, rooms), owner:profiles!owner_id(id, full_name, phone)"
        )
        .order("created_at", { ascending: false }),

      supabase
        .from("settings")
        .select("*")
        .eq("key", "commission_rate")
        .single(),
    ]);

    let data = rentalsRes.data || [];

    if (filter === "unpaid") {
      data = data.filter((r) => !r.is_paid);
    }

    setRentals(data);

    if (settingsRes.data) {
      setCommissionRate(settingsRes.data.value);
    }

    setLoading(false);
  }, [filter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const saveRate = async () => {
    setSavingRate(true);

    await supabase.from("settings").upsert({
      key: "commission_rate",
      value: commissionRate,
      updated_at: new Date().toISOString(),
    });

    setSavingRate(false);

    Alert.alert(
      "✅",
      `Komissiya faizi ${commissionRate}% olaraq saxlanıldı`
    );
  };

  const markPaid = async (rental: Rental) => {
    await Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Success
    );

    const newStatus = !rental.is_paid;

    await supabase
      .from("rentals")
      .update({
        is_paid: newStatus,
        paid_at: newStatus
          ? new Date().toISOString()
          : null,
      })
      .eq("id", rental.id);

    setRentals((prev) =>
      prev.map((r) =>
        r.id === rental.id
          ? {
              ...r,
              is_paid: newStatus,
              paid_at: newStatus
                ? new Date().toISOString()
                : null,
            }
          : r
      )
    );
  };

  const totalUnpaid = rentals
    .filter((r) => !r.is_paid)
    .reduce(
      (sum, r) => sum + r.commission_amount,
      0
    );
      return (
    <View style={{ flex: 1 }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 20,
        }}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={fetchData}
            tintColor={colors.primary}
          />
        }
      >
        <CommissionSettings
          colors={colors}
          value={commissionRate}
          saving={savingRate}
          onChange={setCommissionRate}
          onSave={saveRate}
        />

        <FinanceSummary total={totalUnpaid} />

        <TouchableOpacity
          style={{
            backgroundColor: colors.primary,
            borderRadius: 12,
            paddingVertical: 12,
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            gap: 8,
            marginBottom: 12,
          }}
          onPress={() => setShowAddRental(true)}
        >
          <Feather
            name="plus"
            size={16}
            color="#fff"
          />

          <Text
            style={{
              color: "#fff",
              fontWeight: "700",
            }}
          >
            Kirayə qeydi əlavə et
          </Text>
        </TouchableOpacity>

        <View
          style={{
            flexDirection: "row",
            backgroundColor: colors.muted,
            borderRadius: 10,
            padding: 4,
            marginBottom: 12,
          }}
        >
          {(["unpaid", "all"] as const).map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={{
                flex: 1,
                alignItems: "center",
                paddingVertical: 8,
                borderRadius: 8,
                backgroundColor:
                  filter === f
                    ? colors.card
                    : "transparent",
              }}
            >
              <Text
                style={{
                  color:
                    filter === f
                      ? colors.foreground
                      : colors.mutedForeground,
                  fontWeight: "600",
                }}
              >
                {f === "unpaid"
                  ? "💳 Ödənilməmiş"
                  : "📋 Hamısı"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text
          style={{
            color: colors.mutedForeground,
            fontWeight: "700",
            fontSize: 11,
            marginBottom: 10,
          }}
        >
          KİRAYƏ QEYDLƏRİ
        </Text>
                {loading ? (
          <ActivityIndicator
            color={colors.primary}
            style={{ marginTop: 20 }}
          />
        ) : rentals.length === 0 ? (
          <View
            style={{
              alignItems: "center",
              paddingTop: 40,
            }}
          >
            <Feather
              name="dollar-sign"
              size={44}
              color={colors.border}
            />

            <Text
              style={{
                color: colors.mutedForeground,
                marginTop: 12,
              }}
            >
              Qeyd yoxdur
            </Text>
          </View>
        ) : (
          rentals.map((r) => (
            <RentalCard
              key={r.id}
              rental={r}
              colors={colors}
              onTogglePaid={markPaid}
            />
          ))
        )}
      </ScrollView>

      {showAddRental && (
        <AddRentalModal
          colors={colors}
          insets={insets}
          commissionRate={commissionRate}
          onClose={() => setShowAddRental(false)}
          onSaved={fetchData}
        />
      )}
    </View>
  );
}