import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusButton } from "@/components/StatusButton";
import { useAuth } from "@/context/AuthContext";
import { useLang } from "@/context/LangContext";
import { useColors } from "@/hooks/useColors";
import { supabase, type Property } from "@/lib/supabase";
import { openPhone, openTelegramLink, showAlert } from "@/lib/telegram";

const { width } = Dimensions.get("window");

export default function PropertyDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const { tr } = useLang();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, isOwner } = useAuth();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    fetchProperty();
  }, [id]);

  const fetchProperty = async () => {
    try {
      const { data, error } = await supabase
        .from("properties")
        .select("*, owner:profiles!owner_id(id, full_name, phone, telegram_username)")
        .eq("id", id)
        .single();
      if (error) throw error;
      setProperty(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: "available" | "busy" | "salary_credit") => {
    if (!property) return;
    setUpdating(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const { error } = await supabase
      .from("properties")
      .update({ status: newStatus })
      .eq("id", property.id);
    if (!error) {
      setProperty({ ...property, status: newStatus });
    }
    setUpdating(false);
  };

  const callOwner = () => {
    const phone = property?.owner?.phone;
    if (!phone) {
      showAlert("Bu elan üçün telefon nömrəsi qeyd olunmayıb");
      return;
    }
    openPhone(phone);
  };

  const telegramOwner = () => {
    const username = property?.owner?.telegram_username?.replace("@", "");
    if (!username) {
      showAlert("Bu elan üçün Telegram hesabı qeyd olunmayıb");
      return;
    }
    openTelegramLink(`https://t.me/${username}`);
  };

  const isMyProperty =
    property?.owner_id === profile?.id || profile?.role === "admin";

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!property) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.mutedForeground }}>Mənzil tapılmadı</Text>
      </View>
    );
  }

  const statusColor =
    property.status === "available"
      ? colors.available
      : property.status === "salary_credit"
        ? colors.warning
        : colors.busy;

  const statusLabel =
    property.status === "available"
      ? tr("available")
      : property.status === "salary_credit"
        ? tr("salary_credit")
        : tr("busy");

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} bounces>
        {/* Images */}
        {property.images && property.images.length > 0 ? (
          <View>
            <FlatList
              data={property.images}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(_, i) => String(i)}
              onMomentumScrollEnd={(e) =>
                setActiveImg(
                  Math.round(e.nativeEvent.contentOffset.x / width)
                )
              }
              renderItem={({ item }) => (
                <Image
                  source={{ uri: item }}
                  style={{ width, height: 260 }}
                  resizeMode="cover"
                />
              )}
            />
            {property.images.length > 1 && (
              <View style={styles.dots}>
                {property.images.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.dot,
                      {
                        backgroundColor:
                          i === activeImg ? "#fff" : "rgba(255,255,255,0.5)",
                      },
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={[styles.noImg, { backgroundColor: colors.muted }]}>
            <Feather name="home" size={48} color={colors.mutedForeground} />
          </View>
        )}

        <View style={styles.content}>
          {/* Status */}
          <View style={styles.statusRow}>
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <View style={[styles.dot2, { backgroundColor: "#fff" }]} />
              <Text style={styles.statusLabel}>{statusLabel}</Text>
            </View>
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.foreground }]}>
            {property.rooms}{tr("roomApartment")}
          </Text>
          <View style={styles.addressRow}>
            <Feather name="map-pin" size={14} color={colors.mutedForeground} />
            <Text style={[styles.address, { color: colors.mutedForeground }]}>
              {property.district ? `${property.district}, ` : ""}
              {property.address}
            </Text>
          </View>

          {/* Price */}
          <View style={[styles.priceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {property.price_type === "negotiable" || property.price_weekday == null ? (
              <View style={styles.priceItem}>
                <Text style={[styles.priceLabel, { color: colors.mutedForeground }]}>
                  {tr("priceInfo")}
                </Text>
                <Text style={[styles.priceValue, { color: colors.primary }]}>
                  {tr("negotiable")}
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.priceItem}>
                  <Text style={[styles.priceLabel, { color: colors.mutedForeground }]}>
                    {tr("weekday")}
                  </Text>
                  <Text style={[styles.priceValue, { color: colors.primary }]}>
                    {property.price_weekday.toLocaleString()} ₽
                  </Text>
                </View>
                {property.price_type === "weekday_weekend" && property.price_weekend && (
                  <>
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    <View style={styles.priceItem}>
                      <Text style={[styles.priceLabel, { color: colors.mutedForeground }]}>
                        {tr("weekend")}
                      </Text>
                      <Text style={[styles.priceValue, { color: colors.primary }]}>
                        {property.price_weekend.toLocaleString()} ₽
                      </Text>
                    </View>
                  </>
                )}
              </>
            )}
          </View>

          {/* Details */}
          <View style={[styles.detailGrid, { borderColor: colors.border }]}>
            <DetailItem icon="users" label={tr("maxPeople")} value={`${property.max_people} ${tr("people")}`} colors={colors} />
            {property.salary_credit && (
              <DetailItem icon="clock" label={tr("credit")} value={tr("salaryCredit")} valueColor="#f59e0b" colors={colors} />
            )}
            {property.advance_credit && (
              <DetailItem icon="credit-card" label={tr("credit")} value={tr("advanceCredit")} valueColor="#3b82f6" colors={colors} />
            )}
          </View>

          {/* Description */}
          {property.description ? (
            <View style={styles.descSection}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                {tr("description")}
              </Text>
              <Text style={[styles.desc, { color: colors.mutedForeground }]}>
                {property.description}
              </Text>
            </View>
          ) : null}

          {/* Owner status control */}
          {isMyProperty && (
            <View style={styles.ownerSection}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                {tr("statusChange")}
              </Text>
              <StatusButton
                status={property.status}
                onStatusChange={handleStatusChange}
                loading={updating}
              />
            </View>
          )}
        </View>

        <View style={{ height: Platform.OS === "web" ? 34 + 100 : insets.bottom + 100 }} />
      </ScrollView>

      {/* Back button */}
      <TouchableOpacity
        style={[
          styles.backBtn,
          {
            top: Platform.OS === "web" ? 67 + 12 : insets.top + 12,
            backgroundColor: "rgba(0,0,0,0.4)",
          },
        ]}
        onPress={() => router.back()}
      >
        <Feather name="arrow-left" size={20} color="#fff" />
      </TouchableOpacity>

      {/* Contact buttons */}
      {!isMyProperty && (
        <View
          style={[
            styles.contactBar,
            {
              backgroundColor: colors.card,
              borderTopColor: colors.border,
              paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 4,
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.callBtn, { backgroundColor: colors.primary }]}
            onPress={callOwner}
          >
            <Feather name="phone" size={18} color="#fff" />
            <Text style={styles.callText}>Zəng et</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tgBtn, { backgroundColor: "#229ED9" }]}
            onPress={telegramOwner}
          >
            <Feather name="send" size={18} color="#fff" />
            <Text style={styles.callText}>Telegram</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function DetailItem({
  icon,
  label,
  value,
  valueColor,
  colors,
}: {
  icon: string;
  label: string;
  value: string;
  valueColor?: string;
  colors: any;
}) {
  return (
    <View style={[detailStyles.item, { borderColor: colors.border }]}>
      <Feather name={icon as any} size={16} color={colors.mutedForeground} />
      <Text style={[detailStyles.label, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[detailStyles.value, { color: valueColor || colors.foreground }]}>
        {value}
      </Text>
    </View>
  );
}

const detailStyles = StyleSheet.create({
  item: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    gap: 4,
    borderRightWidth: 1,
  },
  label: { fontSize: 11, fontWeight: "500" },
  value: { fontSize: 13, fontWeight: "700" },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  noImg: {
    width: "100%",
    height: 260,
    alignItems: "center",
    justifyContent: "center",
  },
  dots: {
    position: "absolute",
    bottom: 10,
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    gap: 4,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dot2: { width: 7, height: 7, borderRadius: 3.5 },
  backBtn: {
    position: "absolute",
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  content: { padding: 16, gap: 16 },
  statusRow: { flexDirection: "row" },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusLabel: { color: "#fff", fontWeight: "700", fontSize: 13 },
  title: { fontSize: 24, fontWeight: "800", letterSpacing: -0.5 },
  addressRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  address: { fontSize: 14 },
  priceCard: {
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
  },
  priceItem: { flex: 1, alignItems: "center", padding: 16, gap: 4 },
  priceLabel: { fontSize: 12, fontWeight: "500" },
  priceValue: { fontSize: 22, fontWeight: "800" },
  divider: { width: 1, marginVertical: 12 },
  detailGrid: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 14,
    overflow: "hidden",
  },
  descSection: { gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: "700" },
  desc: { fontSize: 14, lineHeight: 21 },
  ownerSection: { gap: 10 },
  contactBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    flexDirection: "row",
    gap: 10,
    borderTopWidth: 1,
  },
  callBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  tgBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  callText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
