import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useLang } from "@/context/LangContext";
import { useColors } from "@/hooks/useColors";
import { supabase, type Property } from "@/lib/supabase";
import { showAlert } from "@/lib/telegram";

type Status = "available" | "busy" | "salary_credit";

const STATUS_OPTIONS: { value: Status; label: string; color: string }[] = [
  { value: "available", label: "Boş", color: "#22c55e" },
  { value: "busy", label: "Dolu", color: "#ef4444" },
  { value: "salary_credit", label: "Maaşa", color: "#f59e0b" },
];

export default function MyPropertiesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile } = useAuth();
  const { tr } = useLang();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const fetchMyProperties = useCallback(async () => {
    if (!profile) {
  setLoading(false);
  setRefreshing(false);
  return;
}
    try {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("owner_id", profile.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setProperties(data || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profile]);

  useEffect(() => { fetchMyProperties(); }, [fetchMyProperties]);

  const updateStatus = async (id: string, status: Status) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setUpdatingId(id);
    const { error } = await supabase
  .from("properties")
  .update({ status })
  .eq("id", id);

if (error) {
  Alert.alert("Error", error.message);
  setUpdatingId(null);
  return;
}

setProperties((prev) =>
  prev.map((p) =>
    p.id === id ? { ...p, status } : p
  )
);
    setUpdatingId(null);
  };

  const deleteProperty = async (id: string) => {
  const { error } = await supabase
    .from("properties")
    .delete()
    .eq("id", id);

  console.log("OWNER DELETE", error);

  if (error) {
    Alert.alert("Error", error.message);
    return;
  }

  setProperties((prev) =>
    prev.filter((p) => p.id !== id)
  );
};

  const priceLabel = (p: Property) => {
    if (p.price_type === "negotiable") return "Razılaşma ilə";
    if (p.price_type === "weekday_weekend" && p.price_weekend)
      return `${p.price_weekday?.toLocaleString()} / ${p.price_weekend.toLocaleString()} ₽`;
    return `${p.price_weekday?.toLocaleString()} ₽`;
  };

  const statusColor = (s: Status) =>
    s === "available" ? "#22c55e" : s === "salary_credit" ? "#f59e0b" : "#ef4444";

  const statusLabel = (s: Status) =>
  s === "available"
    ? tr("empty")
    : s === "salary_credit"
    ? tr("salary")
    : tr("occupied");

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>
          {tr("myListings")}
        </Text>
        <TouchableOpacity onPress={() => router.push("/owner/add-property")}>
          <Feather name="plus" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={properties}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: Platform.OS === "web" ? 34 + 84 : insets.bottom + 90 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchMyProperties(); }}
            tintColor={colors.primary}
          />
        }
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {/* Card header */}
            <View style={styles.cardTop}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                  {item.rooms} otaqlı · {item.district || item.address}
                </Text>
                <Text style={[styles.cardPrice, { color: colors.primary }]}>
                  {priceLabel(item)}
                </Text>
              </View>
              <View style={[styles.statusDot, { backgroundColor: statusColor(item.status) }]}>
                <Text style={styles.statusDotText}>{statusLabel(item.status)}</Text>
              </View>
            </View>

            {/* One-click status change */}
            <View style={styles.statusRow}>
              <Text style={[styles.statusRowLabel, { color: colors.mutedForeground }]}>{tr("status")}:</Text>
              <View style={styles.statusBtns}>
                {STATUS_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.statusBtn,
                      {
                        backgroundColor: item.status === opt.value ? opt.color : colors.muted,
                        borderColor: item.status === opt.value ? opt.color : colors.border,
                        opacity: updatingId === item.id ? 0.6 : 1,
                      },
                    ]}
                    onPress={() => updateStatus(item.id, opt.value)}
                    disabled={updatingId === item.id}
                  >
                    <Text style={[styles.statusBtnText, { color: item.status === opt.value ? "#fff" : colors.mutedForeground }]}>
                      {opt.value === "available"
  ? tr("empty")
  : opt.value === "busy"
  ? tr("occupied")
  : tr("salary")}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionBtn, { borderColor: colors.border }]}
                onPress={() => router.push(`/property/${item.id}`)}
              >
                <Feather name="eye" size={14} color={colors.mutedForeground} />
                <Text style={[styles.actionText, { color: colors.mutedForeground }]}>{tr("view")}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
  style={[styles.actionBtn, { borderColor: colors.available }]}
  // TODO: Open Rental Requests screen

  onPress={() =>
  router.push(`/owner/rental-requests?propertyId=${item.id}`)
}
>
  <Feather name="inbox" size={14} color={colors.available} />
  <Text style={[styles.actionText, { color: colors.available }]}>
    {tr("rentalRequests")}
  </Text>
</TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { borderColor: colors.primary, backgroundColor: colors.primary + "10" }]}
                onPress={() => router.push(`/owner/edit-property/${item.id}`)}
              >
                <Feather name="edit-2" size={14} color={colors.primary} />
                <Text style={[styles.actionText, { color: colors.primary }]}>{tr("edit")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { borderColor: colors.destructive }]}
                onPress={() => {
  console.log("BUTTON PRESSED", item.id);
  deleteProperty(item.id);
}}
              >
                <Feather name="trash-2" size={14} color={colors.destructive} />
                <Text style={[styles.actionText, { color: colors.destructive }]}>{tr("delete")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.muted }]}>
              <Feather name="home" size={40} color={colors.mutedForeground} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>{tr("noListings")}</Text>
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push("/owner/add-property")}
            >
              <Feather name="plus" size={16} color="#fff" />
              <Text style={styles.addBtnText}>Yeni Mənzil Əlavə et</Text>
            </TouchableOpacity>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  title: { flex: 1, fontSize: 17, fontWeight: "700" },
  list: { padding: 14, gap: 0 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 12,
    marginBottom: 12,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  cardTitle: { fontSize: 15, fontWeight: "700" },
  cardPrice: { fontSize: 14, fontWeight: "600", marginTop: 2 },
  statusDot: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusDotText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  statusRowLabel: { fontSize: 12, fontWeight: "600" },
  statusBtns: { flexDirection: "row", gap: 6, flex: 1 },
  statusBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: "center",
  },
  statusBtnText: { fontSize: 12, fontWeight: "700" },
  actions: {
  flexDirection: "column",
  gap: 8,
},
  actionBtn: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  actionText: { fontSize: 13, fontWeight: "600" },
  empty: { alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 16 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 18, fontWeight: "600" },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  addBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});