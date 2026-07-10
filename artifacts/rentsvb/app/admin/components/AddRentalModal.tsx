import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";

import { supabase } from "@/lib/supabase";

type Props = {
  colors: any;
  insets: any;
  commissionRate: string;
  onClose: () => void;
  onSaved: () => void;
};

export default function AddRentalModal({
  colors,
  insets,
  commissionRate,
  onClose,
  onSaved,
}: Props) {
  const [owners, setOwners] = useState<
    { id: string; full_name: string; phone: string }[]
  >([]);

  const [properties, setProperties] = useState<
    { id: string; address: string; price_weekday: number }[]
  >([]);

  const [selectedOwner, setSelectedOwner] = useState("");
  const [selectedProperty, setSelectedProperty] = useState("");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [pricePerDay, setPricePerDay] = useState("");

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const [paymentMethod, setPaymentMethod] =
    useState<"cash" | "card" | "salary">("cash");

  const [note, setNote] = useState("");

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("id, full_name, phone")
      .eq("role", "owner")
      .then(({ data }) => {
        setOwners(data || []);
      });
  }, []);

  useEffect(() => {
    if (!selectedOwner) return;

    supabase
      .from("properties")
      .select("id,address,price_weekday")
      .eq("owner_id", selectedOwner)
      .then(({ data }) => {
        setProperties(data || []);

        if (data?.length) {
          setSelectedProperty(data[0].id);
          setPricePerDay(String(data[0].price_weekday));
        }
      });
  }, [selectedOwner]);
    const save = async () => {
    if (
      !selectedOwner ||
      !selectedProperty ||
      !startDate ||
      !endDate ||
      !pricePerDay
    ) {
      Alert.alert("Xəta", "Bütün sahələri doldurun");
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    const days = Math.max(
      1,
      Math.ceil((end.getTime() - start.getTime()) / 86400000)
    );

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

      customer_name: customerName || null,
      customer_phone: customerPhone || null,

      payment_method: paymentMethod,
      payment_status:
        paymentMethod === "salary" ? "pending" : "paid",

      is_paid: false,
      paid_at: new Date().toISOString(),

      note: note || null,
    });

    setSaving(false);

    if (error) {
  console.log(error);
  Alert.alert("Xəta", JSON.stringify(error));
  return;
}
    await Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Success
    );

    onSaved();
    onClose();
  };
    return (
    <View style={[StyleSheet.absoluteFill, styles.modalOverlay]}>
      <View
        style={[
          styles.modal,
          {
            backgroundColor: colors.card,
            paddingBottom: insets.bottom + 16,
          },
        ]}
      >
        <View style={styles.modalHeader}>
          <Text
            style={[
              styles.modalTitle,
              { color: colors.foreground },
            ]}
          >
            Kirayə qeydi
          </Text>

          <TouchableOpacity onPress={onClose}>
            <Feather
              name="x"
              size={22}
              color={colors.mutedForeground}
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{ maxHeight: 420 }}
        >

          {/* Owner */}
          <Text
            style={[
              styles.fieldLabel,
              { color: colors.mutedForeground },
            ]}
          >
            Ev sahibi
          </Text>

          <View
            style={[
              styles.pickerWrap,
              {
                backgroundColor: colors.muted,
                borderColor: colors.border,
              },
            ]}
          >
            {owners.map((o) => (
              <TouchableOpacity
                key={o.id}
                style={[
                  styles.pickerItem,
                  selectedOwner === o.id && {
                    backgroundColor: colors.secondary,
                  },
                ]}
                onPress={() => setSelectedOwner(o.id)}
              >
                <Text
                  style={[
                    styles.pickerItemTxt,
                    {
                      color:
                        selectedOwner === o.id
                          ? colors.primary
                          : colors.foreground,
                    },
                  ]}
                >
                  {selectedOwner === o.id ? "✓ " : ""}
                  {o.full_name} · {o.phone}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Property */}
          {properties.length > 0 && (
            <>
              <Text
                style={[
                  styles.fieldLabel,
                  { color: colors.mutedForeground },
                ]}
              >
                Mənzil
              </Text>

              <View
                style={[
                  styles.pickerWrap,
                  {
                    backgroundColor: colors.muted,
                    borderColor: colors.border,
                  },
                ]}
              >
                {properties.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={[
                      styles.pickerItem,
                      selectedProperty === p.id && {
                        backgroundColor: colors.secondary,
                      },
                    ]}
                    onPress={() => {
                      setSelectedProperty(p.id);
                      setPricePerDay(
                        String(p.price_weekday)
                      );
                    }}
                  >
                    <Text
                      style={[
                        styles.pickerItemTxt,
                        {
                          color:
                            selectedProperty === p.id
                              ? colors.primary
                              : colors.foreground,
                        },
                      ]}
                    >
                      {selectedProperty === p.id
                        ? "✓ "
                        : ""}
                      {p.address}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* Burada sənin əvvəlki ModalField-lərin qalır */}

          <ModalField
            label="Başlama tarixi (YYYY-MM-DD)"
            value={startDate}
            onChangeText={setStartDate}
            placeholder="2026-07-01"
            colors={colors}
          />

          <ModalField
            label="Bitmə tarixi (YYYY-MM-DD)"
            value={endDate}
            onChangeText={setEndDate}
            placeholder="2026-07-10"
            colors={colors}
          />

          <ModalField
            label="Günlük qiymət (₽)"
            value={pricePerDay}
            onChangeText={setPricePerDay}
            placeholder="1500"
            keyboardType="numeric"
            colors={colors}
          />

          <ModalField
            label="Müştərinin adı"
            value={customerName}
            onChangeText={setCustomerName}
            placeholder="Ad Soyad"
            colors={colors}
          />

          <ModalField
            label="Telefon"
            value={customerPhone}
            onChangeText={setCustomerPhone}
            placeholder="+7..."
            keyboardType="phone-pad"
            colors={colors}
          />

          <Text
  style={{
    marginTop: 14,
    marginBottom: 8,
    color: colors.mutedForeground,
    fontWeight: "600",
  }}
>
  Ödəniş üsulu
</Text>

<View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
  {[
    { key: "cash", label: "💵 Nəğd" },
    { key: "card", label: "💳 Kart" },
    { key: "salary", label: "🕒 Maaşa qədər" },
  ].map((item) => (
    <TouchableOpacity
      key={item.key}
      onPress={() => setPaymentMethod(item.key as any)}
      style={{
        flex: 1,
        height: 46,
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor:
          paymentMethod === item.key
            ? colors.primary
            : colors.muted,
        borderWidth: 1,
        borderColor:
          paymentMethod === item.key
            ? colors.primary
            : colors.border,
      }}
    >
      <Text
        style={{
          color:
            paymentMethod === item.key
              ? "#fff"
              : colors.foreground,
          fontWeight: "700",
          fontSize: 13,
        }}
      >
        {item.label}
      </Text>
    </TouchableOpacity>
  ))}
</View>

          <ModalField
            label="Qeyd"
            value={note}
            onChangeText={setNote}
            placeholder="..."
            colors={colors}
          />
        </ScrollView>

        <TouchableOpacity
          style={[
            styles.saveBtn2,
            {
              backgroundColor: colors.primary,
              opacity: saving ? 0.7 : 1,
            },
          ]}
          disabled={saving}
          onPress={save}
        >
          <Text style={styles.saveBtnTxt}>
            {saving
              ? "Saxlanılır..."
              : "Əlavə et"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
function ModalField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  colors,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  keyboardType?: any;
  colors: any;
}) {
  return (
    <View style={{ marginTop: 12 }}>
      <Text
        style={{
          color: colors.mutedForeground,
          marginBottom: 6,
          fontSize: 13,
          fontWeight: "600",
        }}
      >
        {label}
      </Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        keyboardType={keyboardType}
        style={{
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.muted,
          color: colors.foreground,
          borderRadius: 12,
          paddingHorizontal: 14,
          height: 48,
        }}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },

  modal: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 16,
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },

  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 14,
    marginBottom: 6,
  },

  pickerWrap: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
  },

  pickerItem: {
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#444",
  },

  pickerItemTxt: {
    fontSize: 15,
    fontWeight: "600",
  },

  saveBtn2: {
    height: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },

  saveBtnTxt: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});