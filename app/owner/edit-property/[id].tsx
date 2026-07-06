import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { supabase } from "@/lib/supabase";

type PriceType = "fixed" | "weekday_weekend" | "negotiable";
type Status = "available" | "busy" | "salary_credit";

const STATUS_OPTIONS: { value: Status; label: string; color: string; icon: string }[] = [
  { value: "available", label: "Boşdur", color: "#22c55e", icon: "check-circle" },
  { value: "busy", label: "Doludur", color: "#ef4444", icon: "x-circle" },
  { value: "salary_credit", label: "Maaşa qədər", color: "#f59e0b", icon: "clock" },
];

export default function EditPropertyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [status, setStatus] = useState<Status>("available");
  const [rooms, setRooms] = useState(1);
  const [district, setDistrict] = useState("");
  const [address, setAddress] = useState("");
  const [priceType, setPriceType] = useState<PriceType>("fixed");
  const [priceWeekday, setPriceWeekday] = useState("");
  const [priceWeekend, setPriceWeekend] = useState("");
  const [maxPeople, setMaxPeople] = useState(1);
  const [salaryCredit, setSalaryCredit] = useState(false);
  const [advanceCredit, setAdvanceCredit] = useState(false);
  const [description, setDescription] = useState("");

  useEffect(() => {
    supabase
      .from("properties")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) { router.back(); return; }
        setStatus(data.status);
        setRooms(data.rooms);
        setDistrict(data.district || "");
        setAddress(data.address || "");
        setPriceType(data.price_type as PriceType);
        setPriceWeekday(data.price_weekday?.toString() || "");
        setPriceWeekend(data.price_weekend?.toString() || "");
        setMaxPeople(data.max_people);
        setSalaryCredit(data.salary_credit);
        setAdvanceCredit(data.advance_credit);
        setDescription(data.description || "");
        setLoading(false);
      });
  }, [id]);

  const handleSave = async () => {
    if (!address.trim()) { Alert.alert("Xəta", "Ünvan yazın"); return; }
    if (priceType !== "negotiable" && !priceWeekday) { Alert.alert("Xəta", "Qiymət yazın"); return; }

    setSaving(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const { error } = await supabase
      .from("properties")
      .update({
        status,
        rooms,
        district: district.trim(),
        address: address.trim(),
        price_type: priceType,
        price_weekday: priceType !== "negotiable" ? Number(priceWeekday) : null,
        price_weekend: priceType === "weekday_weekend" ? Number(priceWeekend) : null,
        max_people: maxPeople,
        salary_credit: salaryCredit,
        advance_credit: advanceCredit,
        description: description.trim(),
      })
      .eq("id", id);
    setSaving(false);

    if (error) { Alert.alert("Xəta", error.message); return; }
    router.back();
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Elanı Redaktə Et</Text>
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: saving ? colors.muted : colors.primary }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator size="small" color={colors.mutedForeground} />
            : <Text style={styles.saveBtnText}>Saxla</Text>
          }
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Status */}
        <Section title="Status" colors={colors}>
          <View style={styles.statusRow}>
            {STATUS_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.statusBtn,
                  {
                    backgroundColor: status === opt.value ? opt.color : colors.muted,
                    borderColor: status === opt.value ? opt.color : colors.border,
                    flex: 1,
                  },
                ]}
                onPress={async () => {
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setStatus(opt.value);
                }}
              >
                <Feather name={opt.icon as any} size={15} color={status === opt.value ? "#fff" : colors.mutedForeground} />
                <Text style={[styles.statusLabel, { color: status === opt.value ? "#fff" : colors.mutedForeground }]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Section>

        {/* Rooms */}
        <Section title="Otaq sayı" colors={colors}>
          <View style={styles.chips}>
            {[1, 2, 3, 4, 5].map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.chip, { backgroundColor: rooms === r ? colors.primary : colors.muted, borderColor: rooms === r ? colors.primary : colors.border }]}
                onPress={() => setRooms(r)}
              >
                <Text style={{ color: rooms === r ? "#fff" : colors.mutedForeground, fontWeight: "700", fontSize: 17 }}>{r}</Text>
                <Text style={{ color: rooms === r ? "#fff" : colors.mutedForeground, fontSize: 11 }}>otaq</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Section>

        {/* Address */}
        <Section title="Ünvan" colors={colors}>
          <Field label="Rayon" value={district} onChange={setDistrict} placeholder="Mərkəz, Mikrorayon..." colors={colors} />
          <Field label="Ünvan" value={address} onChange={setAddress} placeholder="Küçə, ev nömrəsi" colors={colors} />
        </Section>

        {/* Price */}
        <Section title="Qiymət" colors={colors}>
          <View style={{ gap: 8 }}>
            {[
              { value: "fixed", label: "💰 Sabit qiymət" },
              { value: "weekday_weekend", label: "📅 Həftəiçi / Həftəsonu" },
              { value: "negotiable", label: "🤝 Razılaşma yolu ilə" },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.priceCard, { backgroundColor: priceType === opt.value ? colors.primary + "15" : colors.muted, borderColor: priceType === opt.value ? colors.primary : colors.border }]}
                onPress={() => setPriceType(opt.value as PriceType)}
              >
                <Text style={{ color: priceType === opt.value ? colors.primary : colors.foreground, fontWeight: "600", fontSize: 14 }}>{opt.label}</Text>
                {priceType === opt.value && (
                  <View style={[styles.checkDot, { backgroundColor: colors.primary }]}>
                    <Text style={{ color: "#fff", fontSize: 11, fontWeight: "800" }}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {priceType === "fixed" && (
            <Field label="Günlük qiymət (₽)" value={priceWeekday} onChange={setPriceWeekday} placeholder="3000" keyboardType="number-pad" colors={colors} />
          )}
          {priceType === "weekday_weekend" && (
            <>
              <Field label="Həftəiçi qiymət (₽)" value={priceWeekday} onChange={setPriceWeekday} placeholder="2500" keyboardType="number-pad" colors={colors} />
              <Field label="Həftəsonu qiymət (₽)" value={priceWeekend} onChange={setPriceWeekend} placeholder="3500" keyboardType="number-pad" colors={colors} />
            </>
          )}
          {priceType === "negotiable" && (
            <View style={[styles.note, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>Qiymət elanda göstərilməyəcək. Kirayəçi sizinlə birbaşa razılaşacaq.</Text>
            </View>
          )}
        </Section>

        {/* Max people */}
        <Section title="Neçə nəfər yerləşər?" colors={colors}>
          <View style={styles.chips}>
            {[1, 2, 3, 4, 5, 6].map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.chip, { backgroundColor: maxPeople === p ? colors.primary : colors.muted, borderColor: maxPeople === p ? colors.primary : colors.border }]}
                onPress={() => setMaxPeople(p)}
              >
                <Text style={{ color: maxPeople === p ? "#fff" : colors.mutedForeground, fontWeight: "700", fontSize: 17 }}>{p}</Text>
                <Text style={{ color: maxPeople === p ? "#fff" : colors.mutedForeground, fontSize: 11 }}>nəfər</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Section>

        {/* Credit */}
        <Section title="Kredit seçimləri" colors={colors}>
          <Toggle label="Maaşa qədər verilir" description="Maaş gününə qədər nisyə" value={salaryCredit} onToggle={() => setSalaryCredit(!salaryCredit)} color="#f59e0b" colors={colors} />
          <Toggle label="Avansa qədər verilir" description="Avans gününə qədər nisyə" value={advanceCredit} onToggle={() => setAdvanceCredit(!advanceCredit)} color="#3b82f6" colors={colors} />
        </Section>

        {/* Description */}
        <Section title="Açıqlama (istəyə bağlı)" colors={colors}>
          <TextInput
            style={[styles.textarea, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Mənzil haqqında qısa məlumat..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </Section>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Section({ title, children, colors }: { title: string; children: React.ReactNode; colors: any }) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>{title.toUpperCase()}</Text>
      <View style={[styles.sectionBody, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {children}
      </View>
    </View>
  );
}

function Field({ label, value, onChange, placeholder, keyboardType, colors }: {
  label: string; value: string; onChange: (t: string) => void;
  placeholder: string; keyboardType?: any; colors: any;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground }]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        keyboardType={keyboardType}
      />
    </View>
  );
}

function Toggle({ label, description, value, onToggle, color, colors }: {
  label: string; description: string; value: boolean;
  onToggle: () => void; color: string; colors: any;
}) {
  return (
    <TouchableOpacity
      style={[styles.toggle, { backgroundColor: value ? color + "15" : "transparent", borderColor: value ? color : colors.border }]}
      onPress={onToggle}
    >
      <View style={{ flex: 1 }}>
        <Text style={[styles.toggleLabel, { color: colors.foreground }]}>{label}</Text>
        <Text style={[styles.toggleDesc, { color: colors.mutedForeground }]}>{description}</Text>
      </View>
      <View style={[styles.toggleDot, { backgroundColor: value ? color : colors.muted }]}>
        {value && <Feather name="check" size={14} color="#fff" />}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: "700" },
  saveBtn: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 10, minWidth: 70, alignItems: "center" },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  scroll: { padding: 16, gap: 6 },
  section: { gap: 8, marginBottom: 16 },
  sectionTitle: { fontSize: 11, fontWeight: "700", letterSpacing: 0.8, paddingLeft: 4 },
  sectionBody: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 12 },
  statusRow: { flexDirection: "row", gap: 8 },
  statusBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  statusLabel: { fontSize: 12, fontWeight: "700" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chip: {
    width: 72,
    height: 72,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  fieldLabel: { fontSize: 12, fontWeight: "600" },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 15,
  },
  priceCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 13,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  checkDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  note: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  toggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 13,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  toggleLabel: { fontSize: 14, fontWeight: "600" },
  toggleDesc: { fontSize: 12, marginTop: 2 },
  toggleDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  textarea: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 14,
    minHeight: 100,
  },
});
