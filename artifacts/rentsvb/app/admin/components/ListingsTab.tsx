import { useLang } from "@/context/LangContext";
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

type Property = {
  id: string;
  address: string;
  rooms: number;
  status: "available" | "busy" | "salary_credit";
  price_weekday: number;
  created_at: string;

  owner: {
    full_name: string;
    phone: string;
  } | null;
};

type Props = {
  colors: any;
  insets: any;
};

export default function ListingsTab({
  colors,
  insets,
}: Props) {

  const { tr } = useLang();

  const [loading, setLoading] =
    useState(true);

  const [listings, setListings] =
    useState<Property[]>([]);

  const fetch = useCallback(async () => {

    setLoading(true);

    const { data } = await supabase
      .from("properties")
      .select(`
        id,
        address,
        rooms,
        status,
        price_weekday,
        created_at,
        owner:profiles!owner_id(
          full_name,
          phone
        )
      `)
      .order("created_at", {
        ascending: false,
      });

    setListings(
      (data as Property[]) || []
    );

    setLoading(false);

  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const deleteListing = (
    id: string,
    address: string
  ) => {

    Alert.alert(
  tr("delete"),
  tr("confirmDelete"),
      [
        {
          text: tr("cancel"),
          style: "cancel",
        },

        {
          text: tr("delete"),
          style: "destructive",

          onPress: async () => {

            await supabase
              .from("properties")
              .delete()
              .eq("id", id);

            setListings(prev =>
              prev.filter(
                x => x.id !== id
              )
            );

            await Haptics.impactAsync(
              Haptics.ImpactFeedbackStyle.Heavy
            );

          },
        },
      ]
    );

  };

  const STATUS_COLORS = {
    available: "#22c55e",
    busy: "#ef4444",
    salary_credit: "#f59e0b",
  };

  const STATUS_LABELS = {
  available: tr("empty"),
  busy: tr("occupied"),
  salary_credit: tr("salary"),
};

  return (
        <FlatList
      data={listings}
      keyExtractor={(item) => item.id}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={fetch}
          tintColor={colors.primary}
        />
      }
      contentContainerStyle={{
        padding: 16,
        paddingBottom: insets.bottom + 24,
        gap: 12,
      }}
      ListEmptyComponent={() =>
        loading ? (
          <ActivityIndicator
            color={colors.primary}
            style={{ marginTop: 40 }}
          />
        ) : (
          <Text
            style={{
              color: colors.mutedForeground,
              textAlign: "center",
              marginTop: 50,
            }}
          >
            {tr("noListings")}
          </Text>
        )
      }
      renderItem={({ item }) => (
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 16,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: colors.foreground,
                  fontSize: 17,
                  fontWeight: "700",
                }}
              >
                {item.address}
              </Text>

              <Text
                style={{
                  color: colors.mutedForeground,
                  marginTop: 6,
                }}
              >
                👤 {item.owner?.full_name ?? "-"}
              </Text>

              <Text
                style={{
                  color: colors.mutedForeground,
                }}
              >
                📞 {item.owner?.phone ?? "-"}
              </Text>

              <Text
                style={{
                  color: colors.mutedForeground,
                }}
              >
                🏠 {item.rooms} {tr("room")}
              </Text>

              <Text
                style={{
                  color: colors.primary,
                  fontWeight: "700",
                  marginTop: 4,
                }}
              >
                {item.price_weekday} ₽
              </Text>
            </View>

            <View
              style={{
                alignItems: "flex-end",
              }}
            >
              <View
                style={{
                  backgroundColor:
                    STATUS_COLORS[item.status],
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 999,
                }}
              >
                <Text
                  style={{
                    color: "#fff",
                    fontWeight: "700",
                    fontSize: 12,
                  }}
                >
                  {STATUS_LABELS[item.status]}
                </Text>
              </View>
                            <TouchableOpacity
                onPress={() =>
                  deleteListing(
                    item.id,
                    item.address
                  )
                }
                style={{
                  marginTop: 16,
                  backgroundColor: "#ef4444",
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 10,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <Feather
                  name="trash-2"
                  size={16}
                  color="#fff"
                />

                <Text
                  style={{
                    color: "#fff",
                    marginLeft: 8,
                    fontWeight: "700",
                  }}
                >
                  {tr("delete")}
                </Text>
              </TouchableOpacity>

            </View>
          </View>
        </View>
      )}
    />
  );
}