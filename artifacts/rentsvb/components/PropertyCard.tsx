import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import { useLang } from "@/context/LangContext";
import type { Property } from "@/lib/supabase";

type Props = {
  property: Property;
  onPress: () => void;
};

export function PropertyCard({ property, onPress }: Props) {
  const colors = useColors();
  const { tr } = useLang();

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

  const statusIcon =
    property.status === "available" ? "check-circle" :
    property.status === "salary_credit" ? "clock" : "x-circle";

  const priceDisplay = () => {
    if (property.price_type === "negotiable") return tr("negotiable");
    if (!property.price_weekday) return "—";
    return `${property.price_weekday.toLocaleString()}₽`;
  };

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.foreground }]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* Image */}
      <View style={styles.imageContainer}>
        {property.images && property.images.length > 0 ? (
          <Image
            source={{ uri: property.images[0] }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: colors.muted }]}>
            <Feather name="home" size={36} color={colors.mutedForeground} />
            <Text style={[styles.noImgText, { color: colors.mutedForeground }]}>{tr("noImage")}</Text>
          </View>
        )}

        {/* Gradient overlay bottom */}
        <View style={styles.imgOverlay} />

        {/* Status badge */}
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Feather name={statusIcon as any} size={11} color="#fff" />
          <Text style={styles.statusText}>{statusLabel}</Text>
        </View>

        {/* Image count */}
        {property.images && property.images.length > 1 && (
          <View style={[styles.imgCount, { backgroundColor: "rgba(0,0,0,0.55)" }]}>
            <Feather name="image" size={11} color="#fff" />
            <Text style={styles.imgCountText}>{property.images.length}</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        {/* Title row */}
        <View style={styles.titleRow}>
          <Text style={[styles.rooms, { color: colors.foreground }]}>
            {property.rooms}{tr("roomApartment")}
          </Text>
          <View style={styles.priceRow}>
            <Text style={[styles.price, { color: property.price_type === "negotiable" ? colors.warning : colors.primary }]}>
              {priceDisplay()}
            </Text>
            {property.price_type !== "negotiable" && (
              <Text style={[styles.perDay, { color: colors.mutedForeground }]}>{tr("perDaySuffix")}</Text>
            )}
          </View>
        </View>

        {/* Address */}
        <View style={styles.addressRow}>
          <Feather name="map-pin" size={12} color={colors.mutedForeground} />
          <Text style={[styles.district, { color: colors.mutedForeground }]} numberOfLines={1}>
            {[property.district, property.address].filter(Boolean).join(", ")}
          </Text>
        </View>

        {/* Tags */}
        <View style={styles.tags}>
          <View style={[styles.tag, { backgroundColor: colors.muted }]}>
            <Feather name="users" size={11} color={colors.mutedForeground} />
            <Text style={[styles.tagText, { color: colors.mutedForeground }]}>
              {property.max_people} {tr("people")}
            </Text>
          </View>
          {property.price_type === "weekday_weekend" && property.price_weekend && (
            <View style={[styles.tag, { backgroundColor: colors.secondary }]}>
              <Feather name="calendar" size={11} color={colors.secondaryForeground} />
              <Text style={[styles.tagText, { color: colors.secondaryForeground }]}>
                {tr("weekendShort")} {property.price_weekend.toLocaleString()}₽
              </Text>
            </View>
          )}
          {property.salary_credit && (
            <View style={[styles.tag, { backgroundColor: "#fef3c7" }]}>
              <Feather name="clock" size={11} color="#92400e" />
              <Text style={[styles.tagText, { color: "#92400e" }]}>{tr("salaryTag")}</Text>
            </View>
          )}
          {property.advance_credit && (
            <View style={[styles.tag, { backgroundColor: "#dbeafe" }]}>
              <Feather name="credit-card" size={11} color="#1e40af" />
              <Text style={[styles.tagText, { color: "#1e40af" }]}>{tr("advanceTag")}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    marginBottom: 14,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    position: "relative",
  },
  image: {
    width: "100%",
    height: 190,
  },
  imagePlaceholder: {
    width: "100%",
    height: 190,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  noImgText: { fontSize: 13 },
  imgOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: "transparent",
  },
  statusBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  imgCount: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imgCountText: { color: "#fff", fontSize: 11, fontWeight: "600" },
  info: {
    padding: 14,
    gap: 8,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rooms: {
    fontSize: 15,
    fontWeight: "700",
    flex: 1,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  district: {
    fontSize: 13,
    flex: 1,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 1,
  },
  price: {
    fontSize: 19,
    fontWeight: "800",
  },
  perDay: {
    fontSize: 12,
  },
  tags: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 11,
    fontWeight: "600",
  },
});
