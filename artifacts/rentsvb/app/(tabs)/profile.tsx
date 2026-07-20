import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
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
import { useAuth } from "@/context/AuthContext";
import { useLang } from "@/context/LangContext";
import { useColors } from "@/hooks/useColors";
import { LANGUAGES, type Lang } from "@/lib/i18n";
import { getTelegramUser, showAlert } from "@/lib/telegram";
import { supabase } from "@/lib/supabase";

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, signOut, setGuestProfile } = useAuth();
  const { lang, setLang, tr } = useLang();
  const [showOwnerForm, setShowOwnerForm] = useState(false);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [telegram, setTelegram] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ownerStats, setOwnerStats] = useState({
  active: 0,
  rentedThisMonth: 0,
  incomeThisMonth: 0,
  debt: 0,
});
const [salaryDebts, setSalaryDebts] = useState<any[]>([]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

useEffect(() => {
  if (profile?.role !== "owner" || !profile?.id) return;

  const loadOwnerStats = async () => {
    const month = new Date().toISOString().slice(0, 7);

    const { data: properties } = await supabase
      .from("properties")
      .select("id,status")
      .eq("owner_id", profile.id);

    const { data: rentals } = await supabase
  .from("rentals")
  .select(`
  commission_amount,
  created_at,
  paid_at,
  is_paid,
  payment_method,
  customer_name,
  property:properties(address)
`)
  .eq("owner_id", profile.id);

    const active = (properties || []).filter(
      (p) => p.status === "available"
    ).length;

    const rentedThisMonth = (rentals || []).filter(
  (r) => r.paid_at?.startsWith(month)
).length;

    const incomeThisMonth = (rentals || [])
  .filter((r) => r.paid_at?.startsWith(month))
      .reduce((sum, r) => sum + r.commission_amount, 0);
      const debt = (rentals || [])
  .filter(
    (r) =>
      !r.is_paid &&
      r.payment_method === "salary"
  )
  .reduce(
    (sum, r) => sum + r.commission_amount,
    0
  );

  setOwnerStats({
  active,
  rentedThisMonth,
  incomeThisMonth,
  debt,
});

setSalaryDebts(
  (rentals || []).filter(
    (r) =>
      !r.is_paid &&
      r.payment_method === "salary"
  )
);
}; // <-- bunu əlavə et

loadOwnerStats();
}, [profile]);

  const handleOwnerRequest = async () => {
    if (!name.trim()) { showAlert(tr("nameRequired"), tr("error")); return; }
    if (!phone.trim()) { showAlert(tr("phoneRequired"), tr("error")); return; }
    setSubmitting(true);
    try {
      const tgUser = getTelegramUser();
      const { error } = await supabase.from("owner_requests").insert({
  profile_id: profile?.id,
  full_name: name.trim(),
  phone: phone.trim(),
  telegram_username: telegram.trim() || (tgUser?.username ? `@${tgUser.username}` : null),
  telegram_id: tgUser?.id ?? null,
  status: "pending",
});
      if (error) throw error;
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSubmitted(true);
      setShowOwnerForm(false);
    } catch (e: any) {
      showAlert(e.message || "Xəta baş verdi", tr("error"));
    } finally {
      setSubmitting(false);
    }
  };

  const roleLabel = () => {
    if (profile?.role === "admin") return tr("admin");
    if (profile?.role === "owner") return tr("ownerRole");
    return tr("user");
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 34 + 84 : insets.bottom + 90 }}
        showsVerticalScrollIndicator={false}
      >
        {profile?.role === "owner" && (
  <View style={{ marginBottom: 20 }}>
    <Text
      style={{
        color: colors.mutedForeground,
        fontWeight: "700",
        marginBottom: 10,
      }}
    >
      {tr("statistics")}
    </Text>

    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>

      <View
        style={{
          width: "48%",
          backgroundColor: colors.card,
          borderRadius: 14,
          padding: 14,
        }}
      >
        <Text style={{ color: colors.mutedForeground }}>
          🏠 {tr("activeListings")}
        </Text>
        <Text style={{ color: colors.foreground, fontSize: 22, fontWeight: "700" }}>
          {ownerStats.active}
        </Text>
      </View>

      <View
        style={{
          width: "48%",
          backgroundColor: colors.card,
          borderRadius: 14,
          padding: 14,
        }}
      >
        <Text style={{ color: colors.mutedForeground }}>
          ✅ {tr("rentedThisMonth")}
        </Text>
        <Text style={{ color: colors.foreground, fontSize: 22, fontWeight: "700" }}>
          {ownerStats.rentedThisMonth}
        </Text>
      </View>

      <View
        style={{
          width: "48%",
          backgroundColor: colors.card,
          borderRadius: 14,
          padding: 14,
        }}
      >
        <Text style={{ color: colors.mutedForeground }}>
          💰 {tr("incomeThisMonth")}
        </Text>
        <Text style={{ color: colors.foreground, fontSize: 22, fontWeight: "700" }}>
          {ownerStats.incomeThisMonth} ₽
        </Text>
      </View>

      <View
        style={{
          width: "48%",
          backgroundColor: colors.card,
          borderRadius: 14,
          padding: 14,
        }}
      >
        <Text style={{ color: colors.mutedForeground }}>
          🧾 {tr("commissionDebt")}
        </Text>
        <Text style={{ color: colors.foreground, fontSize: 22, fontWeight: "700" }}>
          {ownerStats.debt} ₽
        </Text>
      </View>

    </View>

{salaryDebts.length > 0 && (
  <View
    style={{
      marginTop: 20,
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 14,
    }}
  >
    <Text
      style={{
        color: colors.foreground,
        fontWeight: "700",
        fontSize: 16,
        marginBottom: 12,
      }}
    >
      🧾 {tr("salaryDebts")}
    </Text>

    {salaryDebts.map((r, i) => (
      <View
        key={i}
        style={{
          paddingVertical: 10,
          borderBottomWidth: i === salaryDebts.length - 1 ? 0 : 1,
          borderBottomColor: colors.border,
        }}
      >
        <Text style={{ color: colors.foreground, fontWeight: "600" }}>
          👤 {r.customer_name || tr("unknownCustomer")}
        </Text>

        <Text style={{ color: colors.mutedForeground }}>
          🏠 {r.property?.address || "-"}
        </Text>

        <Text
          style={{
            color: "#ef4444",
            fontWeight: "700",
            marginTop: 4,
          }}
        >
          💰 {r.commission_amount} ₽
        </Text>
      </View>
    ))}
  </View>
)}
  </View>

)}
        {/* Header */}
        <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Feather name="user" size={28} color="#fff" />
          </View>
          <Text style={[styles.name, { color: colors.foreground }]}>
            {profile?.full_name ?? tr("guest")}
          </Text>
          {profile && (
            <Text style={[styles.roleTag, { backgroundColor: colors.secondary, color: colors.secondaryForeground }]}>
              {roleLabel()}
            </Text>
          )}
        </View>

        <View style={styles.body}>
          {/* Owner / Admin Panel */}
          {(profile?.role === "owner" || profile?.role === "admin") && (
            <Section title={tr("ownerPanel")} colors={colors}>
              <MenuRow icon="plus-circle" label={tr("addListing")} colors={colors} onPress={() => router.push("/owner/add-property")} />
              <MenuRow icon="list" label={tr("myListings")} colors={colors} onPress={() => router.push("/owner/my-properties")} last />
              {profile.role === "admin" && (
                <MenuRow icon="shield" label={tr("adminPanel")} colors={colors} onPress={() => router.push("/admin")} last />
              )}
            </Section>
          )}

          {/* Become owner */}
          {(!profile || profile.role === "user") && !submitted && (
            <Section title={tr("becomeOwner")} colors={colors}>
              {showOwnerForm ? (
                <View style={styles.form}>
                  <Text style={[styles.formDesc, { color: colors.mutedForeground }]}>
                    {tr("becomeOwnerDesc")}
                  </Text>
                  <Text>{tr("fullName")}</Text>

<TextInput
  value={name}
  onChangeText={setName}
  placeholder="Rəşad Əliyev"
  style={styles.input}
  placeholderTextColor={colors.mutedForeground}
/>

<Text>{tr("phone")}</Text>

<TextInput
  value={phone}
  onChangeText={setPhone}
  placeholder="+7 999 123 45 67"
  keyboardType="phone-pad"
  style={styles.input}
  placeholderTextColor={colors.mutedForeground}
/>
                  <InputField label={tr("telegramUsername")} value={telegram} onChangeText={setTelegram} placeholder="@username" colors={colors} />
                  <TouchableOpacity
                    style={[styles.submitBtn, { backgroundColor: colors.primary }, submitting && { opacity: 0.7 }]}
                    onPress={handleOwnerRequest}
                    disabled={submitting}
                  >
                    <Feather name="send" size={16} color="#fff" />
                    <Text style={styles.submitText}>{submitting ? tr("sending") : tr("sendRequest")}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setShowOwnerForm(false)} style={styles.cancelBtn}>
                    <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>{tr("cancel")}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <MenuRow icon="home" label={tr("becomeOwner")} colors={colors} onPress={() => setShowOwnerForm(true)} last />
              )}
            </Section>
          )}

          {submitted && (
            <View style={[styles.successBox, { backgroundColor: "#f0fdf4", borderColor: "#86efac" }]}>
              <Feather name="check-circle" size={20} color="#22c55e" />
              <Text style={[styles.successText, { color: "#15803d" }]}>{tr("requestSent")}</Text>
            </View>
          )}
          {profile?.role === "user" && (
  <Section title={tr("rentals")} colors={colors}>
  <MenuRow
    icon="file-text"
    label={tr("myRentalRequests")}
    colors={colors}
    onPress={() => router.push("/tenant/requests" as any)}
    last
  />
</Section>
)}

          {/* App settings */}
          <Section title={tr("app")} colors={colors}>
            <MenuRow
              icon="globe"
              label={`${tr("language")}: ${LANGUAGES.find(l => l.code === lang)?.flag} ${LANGUAGES.find(l => l.code === lang)?.label}`}
              colors={colors}
              onPress={() => setShowLangPicker(!showLangPicker)}
            />
            {showLangPicker && (
              <View style={[styles.langPicker, { borderTopColor: colors.border }]}>
                {LANGUAGES.map((l) => (
                  <TouchableOpacity
                    key={l.code}
                    style={[styles.langRow, { borderBottomColor: colors.border }, lang === l.code && { backgroundColor: colors.secondary }]}
                    onPress={() => { setLang(l.code as Lang); setShowLangPicker(false); }}
                  >
                    <Text style={styles.langFlag}>{l.flag}</Text>
                    <Text style={[styles.langLabel, { color: colors.foreground }, lang === l.code && { fontWeight: "700" }]}>{l.label}</Text>
                    {lang === l.code && <Feather name="check" size={16} color={colors.primary} />}
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <MenuRow icon="info" label={tr("about")} colors={colors} onPress={() => {}} last />
          </Section>

          {profile && (
            <TouchableOpacity
              style={[styles.signOutBtn, { borderColor: colors.destructive }]}
              onPress={async () => { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); await signOut(); }}
            >
              <Feather name="log-out" size={16} color={colors.destructive} />
              <Text style={[styles.signOutText, { color: colors.destructive }]}>{tr("signOut")}</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Section({ title, children, colors }: { title: string; children: React.ReactNode; colors: any }) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>{title.toUpperCase()}</Text>
      <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {children}
      </View>
    </View>
  );
}

function MenuRow({ icon, label, colors, onPress, last }: { icon: string; label: string; colors: any; onPress: () => void; last?: boolean }) {
  return (
    <TouchableOpacity
      style={[styles.row, { borderBottomColor: colors.border }, last && { borderBottomWidth: 0 }]}
      onPress={onPress}
    >
      <Feather name={icon as any} size={18} color={colors.primary} />
      <Text style={[styles.rowLabel, { color: colors.foreground }]}>{label}</Text>
      <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
}

function InputField({ label, value, onChangeText, placeholder, keyboardType, colors }: {
  label: string; value: string; onChangeText: (t: string) => void;
  placeholder: string; keyboardType?: any; colors: any;
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        keyboardType={keyboardType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: "center", paddingBottom: 24, borderBottomWidth: 1, gap: 6 },
  avatar: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  name: { fontSize: 20, fontWeight: "700" },
  roleTag: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, fontSize: 12, fontWeight: "600" },
  body: { padding: 16, gap: 4 },
  section: { marginTop: 20, gap: 6 },
  sectionTitle: { fontSize: 11, fontWeight: "700", letterSpacing: 0.8, marginLeft: 4 },
  sectionCard: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  rowLabel: { flex: 1, fontSize: 15, fontWeight: "500" },
  form: { padding: 16, gap: 12 },
  formDesc: { fontSize: 13, lineHeight: 19 },
  inputGroup: { gap: 6 },
  inputLabel: { fontSize: 12, fontWeight: "600" },
  input: { paddingHorizontal: 14, paddingVertical: 11, borderRadius: 10, borderWidth: 1, fontSize: 15 },
  submitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 13, borderRadius: 12, marginTop: 4 },
  submitText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  cancelBtn: { alignItems: "center", paddingVertical: 8 },
  cancelText: { fontSize: 14 },
  successBox: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderRadius: 12, borderWidth: 1, marginTop: 16 },
  successText: { flex: 1, fontSize: 13, lineHeight: 19, fontWeight: "500" },
  signOutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, marginTop: 24 },
  signOutText: { fontWeight: "700", fontSize: 15 },
  langPicker: { borderTopWidth: 1 },
  langRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  langFlag: { fontSize: 20 },
  langLabel: { flex: 1, fontSize: 15 },
});
