import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { getAdminSession } from "../../lib/adminAuth";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useLang } from "@/context/LangContext";
import { useColors } from "@/hooks/useColors";
import { notifyApproved, notifyRejected } from "@/lib/telegram";
import { supabase } from "@/lib/supabase";

type Tab = "requests" | "stats" | "finance" | "users" | "listings";

type OwnerRequest = {
  id: string;
  full_name: string;
  phone: string;
  telegram_username: string | null;
  telegram_id: number | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
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

type Property = {
  id: string;
  address: string;
  rooms: number;
  status: "available" | "busy" | "salary_credit";
  price_weekday: number;
  created_at: string;
  owner: { full_name: string; phone: string } | null;
};

type Rental = {
  id: string;
  start_date: string;
  end_date: string;
  days: number;
  price_per_day: number;
  commission_rate: number;
  commission_amount: number;
  is_paid: boolean;
  paid_at: string | null;
  note: string | null;
  created_at: string;
  property: { address: string; rooms: number } | null;
  owner: { id: string; full_name: string; phone: string } | null;
};

type Stats = {
  totalListings: number;
  availableListings: number;
  totalOwners: number;
  totalUsers: number;
  pendingRequests: number;
  unpaidCommission: number;
};

const TABS: { key: Tab; icon: string; label: string }[] = [
  { key: "requests", icon: "inbox", label: "Müraciətlər" },
  { key: "stats", icon: "bar-chart-2", label: "Statistika" },
  { key: "finance", icon: "dollar-sign", label: "Maliyyə" },
  { key: "users", icon: "users", label: "İstifadəçilər" },
  { key: "listings", icon: "home", label: "Elanlar" },
];

export default function AdminScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile } = useAuth();
  const { tr } = useLang();
  const [tab, setTab] = useState<Tab>("requests");
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  // Guard: only admin
  const adminSession = getAdminSession();

if (!profile || (profile.role !== "admin" && !adminSession?.loggedIn)) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, flex: 1 }]}>
        <Feather name="lock" size={48} color={colors.border} />
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Giriş yoxdur</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>⚙️ Admin Panel</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* Tab Bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.tabBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}
        contentContainerStyle={styles.tabBarContent}
      >
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tabBtn, tab === t.key && { borderBottomColor: colors.primary, borderBottomWidth: 2.5 }]}
            onPress={() => setTab(t.key)}
          >
            <Feather name={t.icon as any} size={16} color={tab === t.key ? colors.primary : colors.mutedForeground} />
            <Text style={[styles.tabText, { color: tab === t.key ? colors.primary : colors.mutedForeground }]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      {tab === "requests" && <RequestsTab colors={colors} insets={insets} />}
      {tab === "stats" && <StatsTab colors={colors} insets={insets} />}
      {tab === "finance" && <FinanceTab colors={colors} insets={insets} />}
      {tab === "users" && <UsersTab colors={colors} insets={insets} />}
      {tab === "listings" && <ListingsTab colors={colors} insets={insets} />}
    </View>
  );
}

// ─── REQUESTS TAB ────────────────────────────────────────────────────────────
function RequestsTab({ colors, insets }: { colors: any; insets: any }) {
  const [requests, setRequests] = useState<OwnerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "all">("pending");

  const fetch = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("owner_requests").select("*").order("created_at", { ascending: false });
    if (filter === "pending") q = q.eq("status", "pending");
    const { data } = await q;
    setRequests(data || []);
    setLoading(false);
  }, [filter]);

  useEffect(() => { fetch(); }, [fetch]);

  const approve = async (req: OwnerRequest) => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const { error } = await supabase.from("profiles").insert({
      full_name: req.full_name,
      phone: req.phone,
      telegram_username: req.telegram_username,
      telegram_id: req.telegram_id,
      role: "owner",
      is_approved: true,
      is_blocked: false,
    });
    if (error && !error.message.includes("duplicate")) {
      Alert.alert("Xəta", error.message);
      return;
    }
    await supabase.from("owner_requests").update({ status: "approved" }).eq("id", req.id);
    setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: "approved" } : r));
    // Telegram bildirişi gönder
    if (req.telegram_id) {
      notifyApproved(req.telegram_id, req.full_name);
    }
  };

  const reject = async (req: OwnerRequest) => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    await supabase.from("owner_requests").update({ status: "rejected" }).eq("id", req.id);
    setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: "rejected" } : r));
    // Telegram bildirişi gönder
    if (req.telegram_id) {
      notifyRejected(req.telegram_id, req.full_name);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={[styles.subTabRow, { backgroundColor: colors.muted }]}>
        {(["pending", "all"] as const).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.subTab, filter === f && { backgroundColor: colors.card, borderRadius: 8 }]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.subTabText, { color: filter === f ? colors.foreground : colors.mutedForeground }]}>
              {f === "pending" ? "⏳ Gözləyənlər" : "📋 Hamısı"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={i => i.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 20 }]}
          refreshControl={<RefreshControl refreshing={false} onRefresh={fetch} tintColor={colors.primary} />}
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.cardRow}>
                <View style={[styles.ava, { backgroundColor: colors.secondary }]}>
                  <Feather name="user" size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardName, { color: colors.foreground }]}>{item.full_name}</Text>
                  <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>{item.phone}</Text>
                  {item.telegram_username && (
                    <Text style={[styles.cardSub, { color: colors.primary }]}>{item.telegram_username}</Text>
                  )}
                </View>
                <StatusBadge status={item.status} />
              </View>
              <Text style={[styles.cardDate, { color: colors.mutedForeground }]}>
                {new Date(item.created_at).toLocaleDateString("ru-RU")}
              </Text>
              {item.status === "pending" && (
                <View style={styles.actionRow}>
                  <TouchableOpacity style={[styles.rejectBtn, { borderColor: colors.destructive }]} onPress={() => reject(item)}>
                    <Feather name="x" size={15} color={colors.destructive} />
                    <Text style={[styles.rejectTxt, { color: colors.destructive }]}>Rədd et</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.approveBtn, { backgroundColor: colors.available }]} onPress={() => approve(item)}>
                    <Feather name="check" size={15} color="#fff" />
                    <Text style={styles.approveTxt}>Təsdiqlə</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <Feather name="inbox" size={44} color={colors.border} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                {filter === "pending" ? "Gözləyən müraciət yoxdur" : "Müraciət yoxdur"}
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

// ─── STATS TAB ───────────────────────────────────────────────────────────────
function StatsTab({ colors, insets }: { colors: any; insets: any }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [props, owners, users, pending, rentals] = await Promise.all([
        supabase.from("properties").select("id, status"),
        supabase.from("profiles").select("id").eq("role", "owner"),
        supabase.from("profiles").select("id").eq("role", "user"),
        supabase.from("owner_requests").select("id").eq("status", "pending"),
        supabase.from("rentals").select("commission_amount, is_paid").eq("is_paid", false),
      ]);
      const properties = props.data || [];
      const unpaid = (rentals.data || []).reduce((sum, r) => sum + r.commission_amount, 0);
      setStats({
        totalListings: properties.length,
        availableListings: properties.filter(p => p.status === "available").length,
        totalOwners: (owners.data || []).length,
        totalUsers: (users.data || []).length,
        pendingRequests: (pending.data || []).length,
        unpaidCommission: unpaid,
      });
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;

  const cards = [
    { icon: "home", label: "Ümumi elanlar", value: stats!.totalListings, color: colors.primary },
    { icon: "check-circle", label: "Boş elanlar", value: stats!.availableListings, color: colors.available },
    { icon: "key", label: "Ev sahibləri", value: stats!.totalOwners, color: "#8b5cf6" },
    { icon: "users", label: "İstifadəçilər", value: stats!.totalUsers, color: "#f59e0b" },
    { icon: "clock", label: "Gözləyən müraciət", value: stats!.pendingRequests, color: "#ef4444" },
    { icon: "dollar-sign", label: "Ödənilməmiş komissiya", value: `${stats!.unpaidCommission} ₽`, color: "#10b981" },
  ];

  return (
    <ScrollView
      contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 20 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>ÜMUMİ MƏLUMAT</Text>
      <View style={styles.statsGrid}>
        {cards.map(c => (
          <View key={c.label} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.statIcon, { backgroundColor: c.color + "20" }]}>
              <Feather name={c.icon as any} size={20} color={c.color} />
            </View>
            <Text style={[styles.statValue, { color: colors.foreground }]}>{c.value}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{c.label}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// ─── FINANCE TAB ─────────────────────────────────────────────────────────────
function FinanceTab({ colors, insets }: { colors: any; insets: any }) {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [commissionRate, setCommissionRate] = useState("10");
  const [savingRate, setSavingRate] = useState(false);
  const [showAddRental, setShowAddRental] = useState(false);
  const [filter, setFilter] = useState<"unpaid" | "all">("unpaid");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [rentalsRes, settingsRes] = await Promise.all([
      supabase
        .from("rentals")
        .select("*, property:properties(address, rooms), owner:profiles!owner_id(id, full_name, phone)")
        .order("created_at", { ascending: false }),
      supabase.from("settings").select("*").eq("key", "commission_rate").single(),
    ]);
    let data = rentalsRes.data || [];
    if (filter === "unpaid") data = data.filter(r => !r.is_paid);
    setRentals(data);
    if (settingsRes.data) setCommissionRate(settingsRes.data.value);
    setLoading(false);
  }, [filter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const saveRate = async () => {
    setSavingRate(true);
    await supabase.from("settings").upsert({ key: "commission_rate", value: commissionRate, updated_at: new Date().toISOString() });
    setSavingRate(false);
    Alert.alert("✅", `Komissiya faizi ${commissionRate}% olaraq saxlanıldı`);
  };

  const markPaid = async (id: string) => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await supabase.from("rentals").update({ is_paid: true, paid_at: new Date().toISOString() }).eq("id", id);
    setRentals(prev => prev.filter(r => r.id !== id));
  };

  const totalUnpaid = rentals.filter(r => !r.is_paid).reduce((s, r) => s + r.commission_amount, 0);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 20 }]}
        refreshControl={<RefreshControl refreshing={false} onRefresh={fetchData} tintColor={colors.primary} />}
      >
        {/* Commission Rate */}
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>KOMİSSİYA FAİZİ</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardSub, { color: colors.mutedForeground, marginBottom: 8 }]}>
            Hər kirayənin hansı faizi sizə qalsın?
          </Text>
          <View style={styles.rateRow}>
            <TextInput
              style={[styles.rateInput, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground }]}
              value={commissionRate}
              onChangeText={setCommissionRate}
              keyboardType="numeric"
              maxLength={3}
            />
            <Text style={[styles.ratePct, { color: colors.foreground }]}>%</Text>
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.primary }, savingRate && { opacity: 0.7 }]}
              onPress={saveRate}
              disabled={savingRate}
            >
              <Text style={styles.saveBtnTxt}>{savingRate ? "..." : "Saxla"}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Summary */}
        {totalUnpaid > 0 && (
          <View style={[styles.summaryCard, { backgroundColor: "#fef3c7", borderColor: "#fbbf24" }]}>
            <Feather name="alert-circle" size={20} color="#92400e" />
            <Text style={[styles.summaryTxt, { color: "#92400e" }]}>
              Ödənilməmiş komissiya: <Text style={{ fontWeight: "800" }}>{totalUnpaid} ₽</Text>
            </Text>
          </View>
        )}

        {/* Add Rental */}
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => setShowAddRental(true)}
        >
          <Feather name="plus" size={16} color="#fff" />
          <Text style={styles.addBtnTxt}>Kirayə qeydi əlavə et</Text>
        </TouchableOpacity>

        {/* Filter */}
        <View style={[styles.subTabRow, { backgroundColor: colors.muted }]}>
          {(["unpaid", "all"] as const).map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.subTab, filter === f && { backgroundColor: colors.card, borderRadius: 8 }]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.subTabText, { color: filter === f ? colors.foreground : colors.mutedForeground }]}>
                {f === "unpaid" ? "💳 Ödənilməmiş" : "📋 Hamısı"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Rentals list */}
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground, marginTop: 12 }]}>KİRAYƏ QEYDLƏRİ</Text>
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
        ) : rentals.length === 0 ? (
          <View style={[styles.center, { paddingTop: 40 }]}>
            <Feather name="dollar-sign" size={44} color={colors.border} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Qeyd yoxdur</Text>
          </View>
        ) : (
          rentals.map(r => (
            <View key={r.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.cardRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardName, { color: colors.foreground }]}>
                    {r.owner?.full_name ?? "?"} — {r.property?.address ?? "?"}
                  </Text>
                  <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
                    {r.start_date} → {r.end_date} · {r.days} gün · {r.price_per_day} ₽/gün
                  </Text>
                  <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
                    Komissiya {r.commission_rate}%: <Text style={{ color: colors.foreground, fontWeight: "700" }}>{r.commission_amount} ₽</Text>
                  </Text>
                  {r.note && <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>📝 {r.note}</Text>}
                </View>
                {r.is_paid ? (
                  <View style={[styles.badge, { backgroundColor: "#f0fdf4" }]}>
                    <Text style={{ fontSize: 11, fontWeight: "700", color: "#15803d" }}>Ödənilib</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[styles.paidBtn, { backgroundColor: colors.available }]}
                    onPress={() => markPaid(r.id)}
                  >
                    <Text style={styles.paidBtnTxt}>Ödənilib ✓</Text>
                  </TouchableOpacity>
                )}
              </View>
              <Text style={[styles.cardDate, { color: colors.mutedForeground }]}>
                {new Date(r.created_at).toLocaleDateString("ru-RU")}
              </Text>
            </View>
          ))
        )}
      </ScrollView>

      {showAddRental && (
        <AddRentalModal colors={colors} insets={insets} onClose={() => setShowAddRental(false)} onSaved={fetchData} commissionRate={commissionRate} />
      )}
    </View>
  );
}

// ─── ADD RENTAL MODAL ────────────────────────────────────────────────────────
function AddRentalModal({ colors, insets, onClose, onSaved, commissionRate }: {
  colors: any; insets: any; onClose: () => void; onSaved: () => void; commissionRate: string;
}) {
  const [owners, setOwners] = useState<{ id: string; full_name: string; phone: string }[]>([]);
  const [properties, setProperties] = useState<{ id: string; address: string; price_weekday: number }[]>([]);
  const [selectedOwner, setSelectedOwner] = useState("");
  const [selectedProperty, setSelectedProperty] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [pricePerDay, setPricePerDay] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("profiles").select("id, full_name, phone").eq("role", "owner").then(({ data }) => setOwners(data || []));
  }, []);

  useEffect(() => {
    if (!selectedOwner) return;
    supabase.from("properties").select("id, address, price_weekday").eq("owner_id", selectedOwner).then(({ data }) => {
      setProperties(data || []);
      if (data && data.length > 0) {
        setSelectedProperty(data[0].id);
        setPricePerDay(String(data[0].price_weekday));
      }
    });
  }, [selectedOwner]);

  const save = async () => {
    if (!selectedOwner || !selectedProperty || !startDate || !endDate || !pricePerDay) {
      Alert.alert("Xəta", "Bütün sahələri doldurun");
      return;
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000));
    const price = parseInt(pricePerDay);
    const rate = parseInt(commissionRate) || 10;
    const commission = Math.round(price * days * rate / 100);

    setSaving(true);
    const { error } = await supabase.from("rentals").insert({
      property_id: selectedProperty,
      owner_id: selectedOwner,
      start_date: startDate,
      end_date: endDate,
      days,
      price_per_day: price,
      commission_rate: rate,
      commission_amount: commission,
      is_paid: false,
      note: note || null,
    });
    setSaving(false);
    if (error) { Alert.alert("Xəta", error.message); return; }
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSaved();
    onClose();
  };

  return (
    <View style={[StyleSheet.absoluteFill, styles.modalOverlay]}>
      <View style={[styles.modal, { backgroundColor: colors.card, paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>Kirayə qeydi</Text>
          <TouchableOpacity onPress={onClose}><Feather name="x" size={22} color={colors.mutedForeground} /></TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Ev sahibi</Text>
          <View style={[styles.pickerWrap, { borderColor: colors.border, backgroundColor: colors.muted }]}>
            {owners.map(o => (
              <TouchableOpacity
                key={o.id}
                style={[styles.pickerItem, selectedOwner === o.id && { backgroundColor: colors.secondary }]}
                onPress={() => setSelectedOwner(o.id)}
              >
                <Text style={[styles.pickerItemTxt, { color: selectedOwner === o.id ? colors.primary : colors.foreground }]}>
                  {selectedOwner === o.id ? "✓ " : ""}{o.full_name} · {o.phone}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {properties.length > 0 && (
            <>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Mənzil</Text>
              <View style={[styles.pickerWrap, { borderColor: colors.border, backgroundColor: colors.muted }]}>
                {properties.map(p => (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.pickerItem, selectedProperty === p.id && { backgroundColor: colors.secondary }]}
                    onPress={() => { setSelectedProperty(p.id); setPricePerDay(String(p.price_weekday)); }}
                  >
                    <Text style={[styles.pickerItemTxt, { color: selectedProperty === p.id ? colors.primary : colors.foreground }]}>
                      {selectedProperty === p.id ? "✓ " : ""}{p.address}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <ModalField label="Başlama tarixi (YYYY-MM-DD)" value={startDate} onChangeText={setStartDate} placeholder="2026-07-01" colors={colors} />
          <ModalField label="Bitmə tarixi (YYYY-MM-DD)" value={endDate} onChangeText={setEndDate} placeholder="2026-07-10" colors={colors} />
          <ModalField label="Günlük qiymət (₽)" value={pricePerDay} onChangeText={setPricePerDay} placeholder="1500" keyboardType="numeric" colors={colors} />
          <ModalField label="Qeyd (istəyə bağlı)" value={note} onChangeText={setNote} placeholder="..." colors={colors} />

          {startDate && endDate && pricePerDay ? (() => {
            const s = new Date(startDate), e = new Date(endDate);
            const days = Math.max(1, Math.ceil((e.getTime() - s.getTime()) / 86400000));
            const total = parseInt(pricePerDay) * days;
            const comm = Math.round(total * (parseInt(commissionRate) || 10) / 100);
            return (
              <View style={[styles.calcBox, { backgroundColor: colors.secondary }]}>
                <Text style={[styles.calcTxt, { color: colors.secondaryForeground }]}>
                  {days} gün × {pricePerDay} ₽ = {total} ₽{"\n"}
                  Komissiya {commissionRate}%: <Text style={{ fontWeight: "800" }}>{comm} ₽</Text>
                </Text>
              </View>
            );
          })() : null}
        </ScrollView>

        <TouchableOpacity
          style={[styles.saveBtn2, { backgroundColor: colors.primary }, saving && { opacity: 0.7 }]}
          onPress={save}
          disabled={saving}
        >
          <Text style={styles.saveBtnTxt}>{saving ? "Saxlanılır..." : "Əlavə et"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── USERS TAB ───────────────────────────────────────────────────────────────
function UsersTab({ colors, insets }: { colors: any; insets: any }) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<"all" | "owner" | "user">("all");

  const fetch = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (roleFilter !== "all") q = q.eq("role", roleFilter);
    const { data } = await q;
    setUsers(data || []);
    setLoading(false);
  }, [roleFilter]);

  useEffect(() => { fetch(); }, [fetch]);

  const toggleBlock = async (user: UserProfile) => {
    const newBlocked = !user.is_blocked;
    Alert.alert(
      newBlocked ? "Blokla" : "Bloku götür",
      `${user.full_name} — ${newBlocked ? "bloklanacaq" : "bloku götürüləcək"}?`,
      [
        { text: "Ləğv et", style: "cancel" },
        {
          text: "Bəli",
          style: newBlocked ? "destructive" : "default",
          onPress: async () => {
            await supabase.from("profiles").update({ is_blocked: newBlocked }).eq("id", user.id);
            setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_blocked: newBlocked } : u));
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          },
        },
      ]
    );
  };

  const changeRole = async (user: UserProfile, newRole: "user" | "owner") => {
    await supabase.from("profiles").update({ role: newRole, is_approved: newRole === "owner" }).eq("id", user.id);
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: newRole } : u));
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={[styles.filterScroll, { borderBottomColor: colors.border }]}
        contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingVertical: 10 }}
      >
        {(["all", "owner", "user"] as const).map(r => (
          <TouchableOpacity
            key={r}
            style={[styles.filterChip, { borderColor: colors.border, backgroundColor: roleFilter === r ? colors.primary : colors.muted }]}
            onPress={() => setRoleFilter(r)}
          >
            <Text style={[styles.filterChipTxt, { color: roleFilter === r ? "#fff" : colors.foreground }]}>
              {r === "all" ? "Hamısı" : r === "owner" ? "Ev sahibi" : "İstifadəçi"}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={i => i.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 20 }]}
          refreshControl={<RefreshControl refreshing={false} onRefresh={fetch} tintColor={colors.primary} />}
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.cardRow}>
                <View style={[styles.ava, {
                  backgroundColor: item.is_blocked ? "#fef2f2" : item.role === "owner" ? colors.secondary : colors.muted
                }]}>
                  <Feather
                    name={item.is_blocked ? "slash" : item.role === "owner" ? "key" : "user"}
                    size={18}
                    color={item.is_blocked ? "#ef4444" : item.role === "owner" ? colors.primary : colors.mutedForeground}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardName, { color: item.is_blocked ? colors.destructive : colors.foreground }]}>
                    {item.full_name} {item.is_blocked ? "🚫" : ""}
                  </Text>
                  <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>{item.phone}</Text>
                  {item.telegram_username && (
                    <Text style={[styles.cardSub, { color: colors.primary }]}>{item.telegram_username}</Text>
                  )}
                  <View style={styles.roleBadgeRow}>
                    <View style={[styles.roleBadge, {
                      backgroundColor: item.role === "admin" ? "#ddd6fe" : item.role === "owner" ? colors.secondary : colors.muted
                    }]}>
                      <Text style={[styles.roleBadgeTxt, {
                        color: item.role === "admin" ? "#7c3aed" : item.role === "owner" ? colors.primary : colors.mutedForeground
                      }]}>
                        {item.role === "admin" ? "Admin" : item.role === "owner" ? "Ev sahibi" : "İstifadəçi"}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
              {item.role !== "admin" && (
                <View style={styles.actionRow}>
                  {item.role === "user" ? (
                    <TouchableOpacity
                      style={[styles.smallBtn, { borderColor: colors.primary }]}
                      onPress={() => changeRole(item, "owner")}
                    >
                      <Text style={[styles.smallBtnTxt, { color: colors.primary }]}>→ Ev sahibi et</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.smallBtn, { borderColor: colors.mutedForeground }]}
                      onPress={() => changeRole(item, "user")}
                    >
                      <Text style={[styles.smallBtnTxt, { color: colors.mutedForeground }]}>→ İstifadəçi et</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.smallBtn, { borderColor: item.is_blocked ? colors.primary : colors.destructive }]}
                    onPress={() => toggleBlock(item)}
                  >
                    <Feather name={item.is_blocked ? "unlock" : "slash"} size={13} color={item.is_blocked ? colors.primary : colors.destructive} />
                    <Text style={[styles.smallBtnTxt, { color: item.is_blocked ? colors.primary : colors.destructive }]}>
                      {item.is_blocked ? "Bloku götür" : "Blokla"}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
          ListEmptyComponent={
            <View style={[styles.center, { paddingTop: 40 }]}>
              <Feather name="users" size={44} color={colors.border} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>İstifadəçi yoxdur</Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

// ─── LISTINGS TAB ────────────────────────────────────────────────────────────
function ListingsTab({ colors, insets }: { colors: any; insets: any }) {
  const [listings, setListings] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("properties")
      .select("id, address, rooms, status, price_weekday, created_at, owner:profiles!owner_id(full_name, phone)")
      .order("created_at", { ascending: false });
    setListings((data as unknown as Property[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const deleteListing = (id: string, address: string) => {
    Alert.alert("Sil", `"${address}" elanını silmək istəyirsiniz?`, [
      { text: "Ləğv et", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: async () => {
          await supabase.from("properties").delete().eq("id", id);
          setListings(prev => prev.filter(l => l.id !== id));
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        },
      },
    ]);
  };

  const STATUS_COLORS: Record<string, string> = {
    available: "#22c55e",
    busy: "#ef4444",
    salary_credit: "#f59e0b",
  };
  const STATUS_LABELS: Record<string, string> = {
    available: "Boş",
    busy: "Dolu",
    salary_credit: "Maaşa qədər",
  };

  return (
    <FlatList
      data={listings}
      keyExtractor={i => i.id}
      contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 20 }]}
      refreshControl={<RefreshControl refreshing={false} onRefresh={fetch} tintColor={colors.primary} />}
      renderItem={({ item }) => (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardRow}>
            <View style={[styles.ava, { backgroundColor: colors.muted }]}>
              <Text style={{ fontSize: 18 }}>🏠</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardName, { color: colors.foreground }]}>{item.address}</Text>
              <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
                {item.rooms} otaq · {item.price_weekday} ₽/gün
              </Text>
              {item.owner && (
                <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
                  👤 {item.owner.full_name}
                </Text>
              )}
            </View>
            <View>
              <View style={[styles.badge, { backgroundColor: STATUS_COLORS[item.status] + "20" }]}>
                <Text style={{ fontSize: 11, fontWeight: "700", color: STATUS_COLORS[item.status] }}>
                  {STATUS_LABELS[item.status]}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.actionRow}>
            <Text style={[styles.cardDate, { color: colors.mutedForeground, flex: 1 }]}>
              {new Date(item.created_at).toLocaleDateString("ru-RU")}
            </Text>
            <TouchableOpacity
              style={[styles.smallBtn, { borderColor: colors.destructive }]}
              onPress={() => deleteListing(item.id, item.address)}
            >
              <Feather name="trash-2" size={13} color={colors.destructive} />
              <Text style={[styles.smallBtnTxt, { color: colors.destructive }]}>Sil</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      ListEmptyComponent={
        loading ? (
          <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>
        ) : (
          <View style={[styles.center, { paddingTop: 40 }]}>
            <Feather name="home" size={44} color={colors.border} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Elan yoxdur</Text>
          </View>
        )
      }
      showsVerticalScrollIndicator={false}
    />
  );
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: "#fef3c7", text: "#92400e", label: "Gözləyir" },
    approved: { bg: "#f0fdf4", text: "#15803d", label: "Təsdiqləndi" },
    rejected: { bg: "#fef2f2", text: "#b91c1c", label: "Rədd edildi" },
  };
  const c = cfg[status] ?? cfg.pending;
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={{ fontSize: 11, fontWeight: "700", color: c.text }}>{c.label}</Text>
    </View>
  );
}

function ModalField({ label, value, onChangeText, placeholder, keyboardType, colors }: any) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <TextInput
        style={[styles.modalInput, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        keyboardType={keyboardType}
      />
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { alignItems: "center", justifyContent: "center", paddingTop: 60, gap: 12 },
  header: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1,
  },
  title: { flex: 1, fontSize: 17, fontWeight: "700" },
  tabBar: { borderBottomWidth: 1, maxHeight: 50 },
  tabBarContent: { paddingHorizontal: 8 },
  tabBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: "transparent",
  },
  tabText: { fontSize: 13, fontWeight: "600" },
  subTabRow: {
    flexDirection: "row", margin: 12, borderRadius: 10, padding: 4,
  },
  subTab: { flex: 1, alignItems: "center", paddingVertical: 8 },
  subTabText: { fontSize: 13, fontWeight: "600" },
  list: { padding: 16, gap: 0 },
  card: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 12, gap: 10 },
  cardRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  ava: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  cardName: { fontSize: 15, fontWeight: "700" },
  cardSub: { fontSize: 13, marginTop: 2 },
  cardDate: { fontSize: 12 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, alignSelf: "flex-start" },
  actionRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  rejectBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 9, borderRadius: 10, borderWidth: 1.5,
  },
  rejectTxt: { fontWeight: "600", fontSize: 13 },
  approveBtn: {
    flex: 2, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 9, borderRadius: 10,
  },
  approveTxt: { color: "#fff", fontWeight: "700", fontSize: 13 },
  emptyText: { fontSize: 15 },
  sectionTitle: { fontSize: 11, fontWeight: "700", letterSpacing: 0.8, marginBottom: 10 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  statCard: {
    width: "47%", borderRadius: 14, borderWidth: 1,
    padding: 16, alignItems: "flex-start", gap: 8,
  },
  statIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  statValue: { fontSize: 26, fontWeight: "800" },
  statLabel: { fontSize: 12, lineHeight: 16 },
  rateRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  rateInput: {
    width: 70, paddingHorizontal: 12, paddingVertical: 10,
    borderRadius: 10, borderWidth: 1, fontSize: 18, fontWeight: "700", textAlign: "center",
  },
  ratePct: { fontSize: 18, fontWeight: "700" },
  saveBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  saveBtnTxt: { color: "#fff", fontWeight: "700", fontSize: 14 },
  summaryCard: {
    flexDirection: "row", alignItems: "center", gap: 10,
    padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 12,
  },
  summaryTxt: { flex: 1, fontSize: 14, fontWeight: "600" },
  addBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 12, borderRadius: 12, marginBottom: 12,
  },
  addBtnTxt: { color: "#fff", fontWeight: "700", fontSize: 14 },
  paidBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  paidBtnTxt: { color: "#fff", fontSize: 12, fontWeight: "700" },
  smallBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, borderWidth: 1.5,
  },
  smallBtnTxt: { fontSize: 12, fontWeight: "600" },
  roleBadgeRow: { flexDirection: "row", marginTop: 4 },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  roleBadgeTxt: { fontSize: 11, fontWeight: "700" },
  filterScroll: { borderBottomWidth: 1 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  filterChipTxt: { fontSize: 13, fontWeight: "600" },
  modalOverlay: { backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modal: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 16 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  modalTitle: { fontSize: 17, fontWeight: "700" },
  fieldLabel: { fontSize: 12, fontWeight: "600", marginBottom: 6 },
  modalInput: {
    paddingHorizontal: 14, paddingVertical: 11, borderRadius: 10, borderWidth: 1, fontSize: 15,
  },
  pickerWrap: { borderRadius: 10, borderWidth: 1, marginBottom: 12, overflow: "hidden" },
  pickerItem: { paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  pickerItemTxt: { fontSize: 14 },
  calcBox: { padding: 14, borderRadius: 12, marginTop: 8 },
  calcTxt: { fontSize: 14, lineHeight: 22 },
  saveBtn2: { paddingVertical: 14, borderRadius: 14, alignItems: "center", marginTop: 8 },
});
