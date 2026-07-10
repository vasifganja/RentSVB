import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import * as Haptics from "expo-haptics";

import { Feather } from "@expo/vector-icons";

import { supabase } from "@/lib/supabase";

type Props = {
  colors: any;
  insets: any;
};

type OwnerRequest = {
  id: string;
  full_name: string;
  phone: string;
  telegram_username: string | null;
  telegram_id: number | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

export default function RequestsTab({
  colors,
  insets,
}: Props) {
  const [requests, setRequests] =
    useState<OwnerRequest[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [filter, setFilter] =
    useState<"pending" | "all">("pending");
      const fetch = useCallback(async () => {
    setLoading(true);

    let q = supabase
      .from("owner_requests")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (filter === "pending") {
      q = q.eq("status", "pending");
    }

    const { data } = await q;

    setRequests(data || []);

    setLoading(false);
  }, [filter]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const approve = async (
    req: OwnerRequest
  ) => {
    await Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Success
    );

    const { error } = await supabase
      .from("profiles")
      .insert({
        full_name: req.full_name,
        phone: req.phone,
        telegram_username:
          req.telegram_username,
        telegram_id: req.telegram_id,
        role: "owner",
        is_approved: true,
        is_blocked: false,
      });

    if (
      error &&
      !error.message.includes("duplicate")
    ) {
      Alert.alert(
        "Xəta",
        error.message
      );
      return;
    }

    await supabase
      .from("owner_requests")
      .update({
        status: "approved",
      })
      .eq("id", req.id);

    setRequests((prev) =>
      prev.map((r) =>
        r.id === req.id
          ? {
              ...r,
              status: "approved",
            }
          : r
      )
    );
  };

  const reject = async (
    req: OwnerRequest
  ) => {
    await Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Error
    );

    await supabase
      .from("owner_requests")
      .update({
        status: "rejected",
      })
      .eq("id", req.id);

    setRequests((prev) =>
      prev.map((r) =>
        r.id === req.id
          ? {
              ...r,
              status: "rejected",
            }
          : r
      )
    );
  };
    return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          flexDirection: "row",
          margin: 12,
          borderRadius: 10,
          padding: 4,
          backgroundColor: colors.muted,
        }}
      >
        {(["pending", "all"] as const).map((f) => (
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
                fontWeight: "600",
                color:
                  filter === f
                    ? colors.foreground
                    : colors.mutedForeground,
              }}
            >
              {f === "pending"
                ? "⏳ Gözləyənlər"
                : "📋 Hamısı"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ActivityIndicator
            color={colors.primary}
          />
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(i) => i.id}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={fetch}
              tintColor={colors.primary}
            />
          }
          contentContainerStyle={{
            padding: 16,
            paddingBottom:
              insets.bottom + 20,
          }}
          renderItem={({ item }) => (
            <View
              style={{
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderWidth: 1,
                borderRadius: 14,
                padding: 14,
                marginBottom: 12,
              }}
            >
              <Text
                style={{
                  fontWeight: "700",
                  color: colors.foreground,
                }}
              >
                {item.full_name}
              </Text>

              <Text
                style={{
                  color:
                    colors.mutedForeground,
                  marginTop: 4,
                }}
              >
                {item.phone}
              </Text>

              {!!item.telegram_username && (
                <Text
                  style={{
                    color: colors.primary,
                    marginTop: 4,
                  }}
                >
                  {item.telegram_username}
                </Text>
              )}

              <Text
                style={{
                  marginTop: 6,
                  color:
                    colors.mutedForeground,
                  fontSize: 12,
                }}
              >
                {new Date(
                  item.created_at
                ).toLocaleDateString("ru-RU")}
              </Text>

              {item.status ===
                "pending" && (
                <View
                  style={{
                    flexDirection: "row",
                    gap: 8,
                    marginTop: 12,
                  }}
                >
                  <TouchableOpacity
                    onPress={() =>
                      reject(item)
                    }
                    style={{
                      flex: 1,
                      borderWidth: 1,
                      borderColor:
                        colors.destructive,
                      borderRadius: 10,
                      paddingVertical: 10,
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        color:
                          colors.destructive,
                        fontWeight: "700",
                      }}
                    >
                      Rədd et
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() =>
                      approve(item)
                    }
                    style={{
                      flex: 1,
                      borderRadius: 10,
                      paddingVertical: 10,
                      alignItems: "center",
                      backgroundColor:
                        colors.available,
                    }}
                  >
                    <Text
                      style={{
                        color: "#fff",
                        fontWeight: "700",
                      }}
                    >
                      Təsdiqlə
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
          ListEmptyComponent={
            <View
              style={{
                alignItems: "center",
                marginTop: 50,
              }}
            >
              <Feather
                name="inbox"
                size={42}
                color={colors.border}
              />

              <Text
                style={{
                  marginTop: 12,
                  color:
                    colors.mutedForeground,
                }}
              >
                Müraciət yoxdur
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}