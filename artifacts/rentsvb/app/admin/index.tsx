import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

import { getAdminSession } from "../../lib/adminAuth";

import RequestsTab from "./components/RequestsTab";
import StatsTab from "./components/StatsTab";
import FinanceTab from "./components/FinanceTab";
import UsersTab from "./components/UsersTab";
import ListingsTab from "./components/ListingsTab";
type Tab =
  | "requests"
  | "stats"
  | "finance"
  | "users"
  | "listings";

const TABS = [
  {
    key: "requests",
    icon: "inbox",
    label: "Müraciətlər",
  },
  {
    key: "stats",
    icon: "bar-chart-2",
    label: "Statistika",
  },
  {
    key: "finance",
    icon: "dollar-sign",
    label: "Maliyyə",
  },
  {
    key: "users",
    icon: "users",
    label: "İstifadəçilər",
  },
  {
    key: "listings",
    icon: "home",
    label: "Elanlar",
  },
] as const;
export default function AdminScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { profile } = useAuth();

  const [tab, setTab] =
    useState<Tab>("requests");

  const topPad =
    Platform.OS === "web"
      ? 67
      : insets.top;

  const adminSession =
    getAdminSession();

  if (
    !profile &&
    !adminSession?.loggedIn
  ) {
    router.replace("/admin/login");
    return null;
  }

  if (
    profile &&
    profile.role !== "admin" &&
    !adminSession?.loggedIn
  ) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Feather
          name="lock"
          size={48}
          color={colors.border}
        />

        <Text
          style={{
            color: colors.mutedForeground,
            marginTop: 12,
          }}
        >
          Giriş yoxdur
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingTop: topPad + 12,
          paddingBottom: 14,
          backgroundColor: colors.card,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
        >
          <Feather
            name="arrow-left"
            size={22}
            color={colors.foreground}
          />
        </TouchableOpacity>

        <Text
          style={{
            flex: 1,
            textAlign: "center",
            color: colors.foreground,
            fontSize: 17,
            fontWeight: "700",
          }}
        >
          ⚙️ Admin Panel
        </Text>

        <View style={{ width: 22 }} />
      </View>
            <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 8,
        }}
        style={{
          maxHeight: 50,
          backgroundColor: colors.card,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            onPress={() => setTab(t.key as Tab)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              paddingHorizontal: 14,
              paddingVertical: 12,
              borderBottomWidth: 2,
              borderBottomColor:
                tab === t.key
                  ? colors.primary
                  : "transparent",
            }}
          >
            <Feather
              name={t.icon as any}
              size={16}
              color={
                tab === t.key
                  ? colors.primary
                  : colors.mutedForeground
              }
            />

            <Text
              style={{
                color:
                  tab === t.key
                    ? colors.primary
                    : colors.mutedForeground,
                fontWeight: "600",
                fontSize: 13,
              }}
            >
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {tab === "requests" && (
        <RequestsTab
          colors={colors}
          insets={insets}
        />
      )}

      {tab === "stats" && (
        <StatsTab
          colors={colors}
          insets={insets}
        />
      )}

      {tab === "finance" && (
        <FinanceTab
          colors={colors}
          insets={insets}
        />
      )}

      {tab === "users" && (
        <UsersTab
          colors={colors}
          insets={insets}
        />
      )}

      {tab === "listings" && (
        <ListingsTab
          colors={colors}
          insets={insets}
        />
      )}
    </View>
  );
}