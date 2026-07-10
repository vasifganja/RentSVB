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
  ScrollView,
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

type UserProfile = {
  id: string;
  full_name: string;
  phone: string;
  telegram_username: string | null;
  role: "user" | "owner" | "admin";
  is_approved: boolean;
  is_blocked: boolean;
  created_at: string;
};

export default function UsersTab({
  colors,
  insets,
}: Props) {
  const [users, setUsers] =
    useState<UserProfile[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [roleFilter, setRoleFilter] =
    useState<"all" | "owner" | "user">(
      "all"
    );
      const fetch = useCallback(async () => {
    setLoading(true);

    let q = supabase
      .from("profiles")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (roleFilter !== "all") {
      q = q.eq("role", roleFilter);
    }

    const { data } = await q;

    setUsers(data || []);

    setLoading(false);
  }, [roleFilter]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const toggleBlock = async (
    user: UserProfile
  ) => {
    const newBlocked =
      !user.is_blocked;

    Alert.alert(
      newBlocked
        ? "Blokla"
        : "Bloku götür",
      `${user.full_name} ${
        newBlocked
          ? "bloklanacaq"
          : "bloku götürüləcək"
      }`,
      [
        {
          text: "Ləğv et",
          style: "cancel",
        },
        {
          text: "Bəli",
          onPress: async () => {
            await supabase
              .from("profiles")
              .update({
                is_blocked:
                  newBlocked,
              })
              .eq("id", user.id);

            setUsers((prev) =>
              prev.map((u) =>
                u.id === user.id
                  ? {
                      ...u,
                      is_blocked:
                        newBlocked,
                    }
                  : u
              )
            );

            await Haptics.impactAsync(
              Haptics.ImpactFeedbackStyle
                .Medium
            );
          },
        },
      ]
    );
  };

  const changeRole = async (
    user: UserProfile,
    newRole: "user" | "owner"
  ) => {
    await supabase
      .from("profiles")
      .update({
        role: newRole,
        is_approved:
          newRole === "owner",
      })
      .eq("id", user.id);

    setUsers((prev) =>
      prev.map((u) =>
        u.id === user.id
          ? {
              ...u,
              role: newRole,
            }
          : u
      )
    );
  };
    return (
    <View style={{ flex: 1 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          gap: 8,
          paddingHorizontal: 16,
          paddingVertical: 10,
        }}
      >
        {(["all", "owner", "user"] as const).map(
          (r) => (
            <TouchableOpacity
              key={r}
              onPress={() =>
                setRoleFilter(r)
              }
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor:
                  roleFilter === r
                    ? colors.primary
                    : colors.muted,
              }}
            >
              <Text
                style={{
                  color:
                    roleFilter === r
                      ? "#fff"
                      : colors.foreground,
                  fontWeight: "600",
                }}
              >
                {r === "all"
                  ? "Hamısı"
                  : r === "owner"
                  ? "Ev sahibi"
                  : "İstifadəçi"}
              </Text>
            </TouchableOpacity>
          )
        )}
      </ScrollView>

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
          data={users}
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
                  color: item.is_blocked
                    ? colors.destructive
                    : colors.foreground,
                  fontWeight: "700",
                  fontSize: 15,
                }}
              >
                {item.full_name}
                {item.is_blocked ? " 🚫" : ""}
              </Text>

              <Text
                style={{
                  color: colors.mutedForeground,
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
                  color: colors.mutedForeground,
                  fontSize: 12,
                }}
              >
                {item.role === "admin"
                  ? "Admin"
                  : item.role === "owner"
                  ? "Ev sahibi"
                  : "İstifadəçi"}
              </Text>

              {item.role !== "admin" && (
                <View
                  style={{
                    flexDirection: "row",
                    gap: 8,
                    marginTop: 12,
                  }}
                >
                  {item.role === "user" ? (
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        borderWidth: 1,
                        borderColor: colors.primary,
                        borderRadius: 10,
                        paddingVertical: 10,
                        alignItems: "center",
                      }}
                      onPress={() =>
                        changeRole(item, "owner")
                      }
                    >
                      <Text
                        style={{
                          color: colors.primary,
                          fontWeight: "700",
                        }}
                      >
                        Ev sahibi et
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        borderWidth: 1,
                        borderColor:
                          colors.mutedForeground,
                        borderRadius: 10,
                        paddingVertical: 10,
                        alignItems: "center",
                      }}
                      onPress={() =>
                        changeRole(item, "user")
                      }
                    >
                      <Text
                        style={{
                          color:
                            colors.mutedForeground,
                          fontWeight: "700",
                        }}
                      >
                        İstifadəçi et
                      </Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={{
                      flex: 1,
                      borderWidth: 1,
                      borderColor: item.is_blocked
                        ? colors.primary
                        : colors.destructive,
                      borderRadius: 10,
                      paddingVertical: 10,
                      alignItems: "center",
                    }}
                    onPress={() =>
                      toggleBlock(item)
                    }
                  >
                    <Text
                      style={{
                        color: item.is_blocked
                          ? colors.primary
                          : colors.destructive,
                        fontWeight: "700",
                      }}
                    >
                      {item.is_blocked
                        ? "Bloku götür"
                        : "Blokla"}
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
                marginTop: 40,
              }}
            >
              <Feather
                name="users"
                size={44}
                color={colors.border}
              />
              <Text
                style={{
                  marginTop: 12,
                  color: colors.mutedForeground,
                }}
              >
                İstifadəçi yoxdur
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}