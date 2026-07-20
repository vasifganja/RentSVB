import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useLang } from "@/context/LangContext";
import { useColors } from "@/hooks/useColors";

type NotificationItem = {
  id: string;
  rental_request_id: string | null;
  type: string;

  title_az: string;
  title_en: string;
  title_ru: string;

  body_az: string;
  body_en: string;
  body_ru: string;

  is_read: boolean;
  created_at: string;
};

export default function NotificationsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { profile } = useAuth();
  const { lang, tr } = useLang();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<
    NotificationItem[]
  >([]);

  const getTitle = (item: NotificationItem) => {
    if (lang === "ru") return item.title_ru;
    if (lang === "en") return item.title_en;
    return item.title_az;
  };

  const getBody = (item: NotificationItem) => {
    if (lang === "ru") return item.body_ru;
    if (lang === "en") return item.body_en;
    return item.body_az;
  };
  const handleNotificationPress = (item: NotificationItem) => {
  switch (item.type) {
    case "request_accepted":
    case "request_rejected":
      router.push("/tenant/requests" as any);
      break;

    case "new_request":
  router.push("/owner/rental-requests" as any);
  break;
    
      case "owner_completed":
      router.push("/tenant/requests" as any);
      break;

    default:
      break;
  }
};
    const loadNotifications = useCallback(async () => {
        console.log("PROFILE ID:", profile?.id);
    if (!profile?.id) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.rpc(
  "get_my_notifications",
  {
    p_user_id: profile!.id,
  }
);
      console.log("NOTIFICATIONS:", data);
console.log("ERROR:", error);

    if (!error) {
  setNotifications(
  (data || [])
    .sort(
      (a: any, b: any) =>
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
    )
    .map((n: any) => ({
      ...n,
      is_read: true,
    }))
);
}

await supabase.rpc("mark_all_notifications_read", {
  p_user_id: profile.id,
});

    setLoading(false);
    setRefreshing(false);
  }, [profile]);

  useEffect(() => {
  if (profile?.id) {
    loadNotifications();
  }
}, [profile?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };


  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: colors.background },
      ]}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather
            name="arrow-left"
            size={22}
            color={colors.foreground}
          />
        </TouchableOpacity>

        <Text
          style={[
            styles.title,
            {
              color: colors.foreground,
            },
          ]}
        >
          {tr("notifications")}
        </Text>

        <View style={{ width: 22 }} />
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
                renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handleNotificationPress(item)}
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                opacity: item.is_read ? 0.7 : 1,
              },
            ]}
          >
            <View style={styles.cardHeader}>
              {!item.is_read && (
                <View
                  style={[
                    styles.unreadDot,
                    { backgroundColor: colors.primary },
                  ]}
                />
              )}

              <Text
                style={[
                  styles.cardTitle,
                  { color: colors.foreground },
                ]}
              >
                {getTitle(item)}
              </Text>
            </View>

            <Text
              style={[
                styles.cardBody,
                { color: colors.mutedForeground },
              ]}
            >
              {getBody(item)}
            </Text>

            <Text
              style={[
                styles.date,
                { color: colors.mutedForeground },
              ]}
            >
              {new Date(item.created_at).toLocaleString(lang, {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
})}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather
              name="bell-off"
              size={46}
              color={colors.mutedForeground}
            />

            <Text
              style={{
                marginTop: 12,
                color: colors.mutedForeground,
                fontSize: 16,
              }}
            >
              {tr("noNotifications")}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
  },

  card: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },

  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
  },

  cardBody: {
    fontSize: 14,
    lineHeight: 20,
  },

  date: {
    marginTop: 10,
    fontSize: 12,
  },

  empty: {
    flex: 1,
    marginTop: 120,
    alignItems: "center",
  },
});