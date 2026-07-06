import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRootNavigationState, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FilterBar, type Filters } from "@/components/FilterBar";
import { PropertyCard } from "@/components/PropertyCard";
import { useLang } from "@/context/LangContext";
import { useColors } from "@/hooks/useColors";
import { supabase, type Property } from "@/lib/supabase";

const DEFAULT_FILTERS: Filters = {
  rooms: null,
  maxPeople: null,
  salaryCredit: false,
  advanceCredit: false,
  maxPrice: null,
};

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navState = useRootNavigationState();
  const { tr } = useLang();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

  useEffect(() => {
    // Naviqasiya hazır olana qədər gözlə (yoxsa "This screen doesn't exist" çıxır)
    if (!navState?.key) return;
    AsyncStorage.getItem("rentsvb_welcomed").then((v) => {
      if (!v) router.replace("/welcome" as any);
    });
  }, [router, navState?.key]);

  const fetchProperties = useCallback(async () => {
    try {
      let query = supabase
        .from("properties")
        .select("*, owner:profiles!owner_id(id, full_name, phone, telegram_username)")
        .order("created_at", { ascending: false });

      if (filters.rooms !== null) query = query.eq("rooms", filters.rooms);
      if (filters.maxPeople !== null) query = query.gte("max_people", filters.maxPeople);
      if (filters.salaryCredit) query = query.eq("salary_credit", true);
      if (filters.advanceCredit) query = query.eq("advance_credit", true);
      if (filters.maxPrice !== null) query = query.lte("price_weekday", filters.maxPrice);

      const { data, error } = await query;
      if (error) throw error;
      setProperties(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProperties();
  }, [fetchProperties]);

  const filtered = properties.filter((p) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      p.address.toLowerCase().includes(s) ||
      p.district?.toLowerCase().includes(s)
    );
  });

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const available = properties.filter(p => p.status === "available").length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.logo, { color: colors.primary }]}>RentSVB</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Svobodny · Свободный
            </Text>
          </View>
          {available > 0 && (
            <View style={[styles.availableBadge, { backgroundColor: colors.available + "20" }]}>
              <View style={[styles.availableDot, { backgroundColor: colors.available }]} />
              <Text style={[styles.availableText, { color: colors.available }]}>
                {available} boş
              </Text>
            </View>
          )}
        </View>

        {/* Search */}
        <View style={[styles.searchBox, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder={tr("searchPlaceholder")}
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FilterBar filters={filters} onFiltersChange={setFilters} total={filtered.length} />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PropertyCard
              property={item}
              onPress={() => router.push(`/property/${item.id}`)}
            />
          )}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: Platform.OS === "web" ? 34 + 84 : insets.bottom + 90 },
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.muted }]}>
                <Feather name="home" size={40} color={colors.mutedForeground} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                {tr("noListings")}
              </Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                {tr("noListingsDesc")}
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: { fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
  subtitle: { fontSize: 12, marginTop: 1 },
  availableBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  availableDot: { width: 7, height: 7, borderRadius: 4 },
  availableText: { fontSize: 13, fontWeight: "700" },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 14 },
  list: { padding: 14, gap: 0 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 14 },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptyText: { fontSize: 14, textAlign: "center", paddingHorizontal: 30 },
});
