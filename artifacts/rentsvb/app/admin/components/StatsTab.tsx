import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  View,
} from "react-native";

import { Feather } from "@expo/vector-icons";

import { supabase } from "@/lib/supabase";

type Props = {
  colors: any;
  insets: any;
};

type Stats = {
  totalListings: number;
  availableListings: number;
  totalOwners: number;
  totalUsers: number;
  pendingRequests: number;
  unpaidCommission: number;
  activeUsers: number;
  todayOpens: number;
  monthOpens: number;
  totalOpens: number;
};

export default function StatsTab({
  colors,
  insets,
}: Props) {
  const [stats, setStats] =
    useState<Stats | null>(null);

  const [loading, setLoading] =
    useState(true);
      useEffect(() => {
    const load = async () => {
      const [
        props,
        owners,
        users,
        pending,
        rentals,
        appEvents,
        appEventsUsers,
      ] = await Promise.all([
        supabase.from("properties").select("id,status"),

        supabase
          .from("profiles")
          .select("id")
          .eq("role", "owner"),

        supabase
          .from("profiles")
          .select("id,last_seen")
          .neq("role", "admin"),

        supabase
          .from("owner_requests")
          .select("id")
          .eq("status", "pending"),

        supabase
          .from("rentals")
          .select("commission_amount,is_paid")
          .eq("is_paid", false),

        supabase
          .from("app_events")
          .select("id", {
            count: "exact",
            head: true,
          }),

        supabase
          .from("app_events")
          .select("telegram_id,created_at"),
      ]);

      const properties = props.data || [];

      const unpaid = (rentals.data || []).reduce(
        (sum: number, r: any) =>
          sum + r.commission_amount,
        0
      );

      const today = new Date()
        .toISOString()
        .slice(0, 10);

      const month = new Date()
        .toISOString()
        .slice(0, 7);

      const monthOpens = (
        appEventsUsers.data || []
      ).filter(
        (x: any) =>
          x.created_at?.slice(0, 7) === month
      ).length;

      const totalOpens =
        appEvents.count || 0;

      const activeUsers = (
        users.data || []
      ).filter(
        (u: any) =>
          u.last_seen?.startsWith(today)
      ).length;

      const todayOpens = (
        appEventsUsers.data || []
      ).filter(
        (x: any) =>
          x.created_at?.startsWith(today)
      ).length;

      setStats({
        totalListings: properties.length,
        availableListings:
          properties.filter(
            (p: any) =>
              p.status === "available"
          ).length,

        totalOwners:
          (owners.data || []).length,

        totalUsers:
          (users.data || []).length,

        pendingRequests:
          (pending.data || []).length,

        unpaidCommission: unpaid,

        activeUsers,

        todayOpens,

        monthOpens,

        totalOpens,
      });

      setLoading(false);
    };

    load();
  }, []);
    if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const cards = [
    {
      icon: "home",
      label: "Ümumi elanlar",
      value: stats!.totalListings,
      color: colors.primary,
    },
    {
      icon: "check-circle",
      label: "Boş elanlar",
      value: stats!.availableListings,
      color: colors.available,
    },
    {
      icon: "key",
      label: "Ev sahibləri",
      value: stats!.totalOwners,
      color: "#8b5cf6",
    },
    {
      icon: "users",
      label: "İstifadəçilər",
      value: stats!.totalUsers,
      color: "#f59e0b",
    },
    {
      icon: "clock",
      label: "Gözləyən müraciət",
      value: stats!.pendingRequests,
      color: "#ef4444",
    },
    {
      icon: "dollar-sign",
      label: "Ödənilməmiş komissiya",
      value: `${stats!.unpaidCommission} ₽`,
      color: "#10b981",
    },
    {
      icon: "activity",
      label: "Aktiv istifadəçilər",
      value: stats!.activeUsers,
      color: "#22c55e",
    },
    {
      icon: "calendar",
      label: "Bugünkü girişlər",
      value: stats!.todayOpens,
      color: "#3b82f6",
    },
    {
      icon: "bar-chart",
      label: "Aylıq girişlər",
      value: stats!.monthOpens,
      color: "#8b5cf6",
    },
    {
      icon: "trending-up",
      label: "Ümumi girişlər",
      value: stats!.totalOpens,
      color: "#f97316",
    },
  ];

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        padding: 16,
        paddingBottom: insets.bottom + 20,
      }}
    >
      <Text
        style={{
          color: colors.mutedForeground,
          fontWeight: "700",
          fontSize: 11,
          marginBottom: 12,
        }}
      >
        ÜMUMİ MƏLUMAT
      </Text>

      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "space-between",
        }}
      >
        {cards.map((c) => (
          <View
            key={c.label}
            style={{
              width: "48%",
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: 14,
              padding: 16,
              marginBottom: 12,
            }}
          >
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: 21,
                backgroundColor: `${c.color}20`,
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <Feather
                name={c.icon as any}
                size={20}
                color={c.color}
              />
            </View>

            <Text
              style={{
                color: colors.foreground,
                fontSize: 24,
                fontWeight: "800",
              }}
            >
              {c.value}
            </Text>

            <Text
              style={{
                color: colors.mutedForeground,
                marginTop: 4,
                fontSize: 12,
              }}
            >
              {c.label}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}