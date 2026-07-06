import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Image,
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
import { useColors } from "@/hooks/useColors";
import { notifyNewListing, showAlert } from "@/lib/telegram";
import { supabase } from "@/lib/supabase";

const STEPS = [
  "Otaq sayı",
  "Ünvan",
  "Qiymət",
  "Adam sayı",
  "Kredit",
  "Şəkillər",
  "Təsvir",
];

export default function AddPropertyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile } = useAuth();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const [rooms, setRooms] = useState<number>(1);
  const [address, setAddress] = useState("");
  const [district, setDistrict] = useState("");
  const [priceType, setPriceType] = useState<"fixed" | "weekday_weekend" | "negotiable">("fixed");
  const [priceWeekday, setPriceWeekday] = useState("");
  const [priceWeekend, setPriceWeekend] = useState("");
  const [maxPeople, setMaxPeople] = useState<number>(1);
  const [salaryCredit, setSalaryCredit] = useState(false);
  const [advanceCredit, setAdvanceCredit] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [description, setDescription] = useState("");

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const pickImage = async () => {
    if (images.length >= 5) {
      showAlert("Maksimum 5 şəkil");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  const uploadImages = async (): Promise<string[]> => {
    const urls: string[] = [];
    for (const uri of images) {
      try {
        const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpg`;
        const response = await fetch(uri);
        const blob = await response.blob();
        const { data, error } = await supabase.storage
          .from("property-images")
          .upload(fileName, blob, { contentType: "image/jpeg" });
        if (!error && data) {
          const { data: urlData } = supabase.storage
            .from("property-images")
            .getPublicUrl(data.path);
          urls.push(urlData.publicUrl);
        }
      } catch (e) {
        console.error("Image upload error:", e);
      }
    }
    return urls;
  };

  const handleSubmit = async () => {
    // İkiqat basmanın qarşısını al (state gecikməsindən asılı olmadan)
    if (submittingRef.current) return;
    if (!address) {
      showAlert("Ünvan yazın", "Xəta");
      return;
    }
    if (priceType !== "negotiable" && !priceWeekday) {
      showAlert("Qiymət yazın", "Xəta");
      return;
    }
    // Real profil UUID-i olmalıdır (yoxsa owner_id FK xətası verir)
    if (!profile || profile.id === "admin") {
      showAlert("Profil hazır deyil, tətbiqi yenidən açın", "Xəta");
      return;
    }
    submittingRef.current = true;
    setSubmitting(true);
    try {
      const uploadedUrls = images.length > 0 ? await uploadImages() : [];
      const { error } = await supabase.from("properties").insert({
        owner_id: profile!.id,
        rooms,
        address,
        district,
        price_type: priceType,
        price_weekday: priceType !== "negotiable" ? Number(priceWeekday) : null,
        price_weekend: priceType === "weekday_weekend" ? Number(priceWeekend) : null,
        max_people: maxPeople,
        salary_credit: salaryCredit,
        advance_credit: advanceCredit,
        description,
        status: "available",
        images: uploadedUrls,
      });
      if (error) throw error;
      // Admina Telegram bildirişi göndər
      notifyNewListing({
        ownerName: profile!.full_name,
        rooms,
        address,
        district,
        price: priceType !== "negotiable" ? Number(priceWeekday) : undefined,
        priceType,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Web-də Alert callback işləmir — birbaşa keçid + təsdiq bildirişi
      showAlert("Elan uğurla yerləşdirildi!");
      router.replace("/owner/my-properties");
    } catch (e: any) {
      showAlert(e.message || "Elan yaradılmadı", "Xəta");
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const canGoNext = () => {
    if (step === 1 && !address) return false;
    if (step === 2 && priceType !== "negotiable" && !priceWeekday) return false;
    return true;
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <StepContainer title="Otaq sayı neçədir?" colors={colors}>
            <View style={styles.chips}>
              {[1, 2, 3, 4, 5].map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: rooms === r ? colors.primary : colors.muted,
                      borderColor: rooms === r ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setRooms(r)}
                >
                  <Text
                    style={{
                      color: rooms === r ? "#fff" : colors.mutedForeground,
                      fontWeight: "700",
                      fontSize: 18,
                    }}
                  >
                    {r}
                  </Text>
                  <Text
                    style={{
                      color: rooms === r ? "#fff" : colors.mutedForeground,
                      fontSize: 12,
                    }}
                  >
                    otaq
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </StepContainer>
        );
      case 1:
        return (
          <StepContainer title="Ünvan məlumatları" colors={colors}>
            <FormInput label="Rayon" value={district} onChangeText={setDistrict} placeholder="Mərkəz, Mikrorayon..." colors={colors} />
            <FormInput label="Ünvan" value={address} onChangeText={setAddress} placeholder="Küçə, ev nömrəsi" colors={colors} />
          </StepContainer>
        );
      case 2:
        return (
          <StepContainer title="Qiymət" colors={colors}>
            <View style={{ gap: 8 }}>
              {[
                { value: "fixed", label: "💰 Sabit qiymət", desc: "Hər gün eyni qiymət" },
                { value: "weekday_weekend", label: "📅 Həftəiçi / Həftəsonu", desc: "İki fərqli qiymət" },
                { value: "negotiable", label: "🤝 Razılaşma yolu ilə", desc: "Qiymət söhbətlə müəyyən olunur" },
              ].map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.priceTypeCard,
                    {
                      backgroundColor: priceType === opt.value ? colors.primary + "15" : colors.muted,
                      borderColor: priceType === opt.value ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setPriceType(opt.value as any)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: priceType === opt.value ? colors.primary : colors.foreground, fontWeight: "700", fontSize: 14 }}>
                      {opt.label}
                    </Text>
                    <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 2 }}>
                      {opt.desc}
                    </Text>
                  </View>
                  {priceType === opt.value && (
                    <View style={[styles.checkDot, { backgroundColor: colors.primary }]}>
                      <Text style={{ color: "#fff", fontSize: 11, fontWeight: "800" }}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {priceType === "fixed" && (
              <FormInput
                label="Günlük qiymət (₽)"
                value={priceWeekday}
                onChangeText={setPriceWeekday}
                placeholder="3000"
                keyboardType="number-pad"
                colors={colors}
              />
            )}
            {priceType === "weekday_weekend" && (
              <>
                <FormInput
                  label="Həftəiçi qiymət (₽)"
                  value={priceWeekday}
                  onChangeText={setPriceWeekday}
                  placeholder="2500"
                  keyboardType="number-pad"
                  colors={colors}
                />
                <FormInput
                  label="Həftəsonu qiymət (₽)"
                  value={priceWeekend}
                  onChangeText={setPriceWeekend}
                  placeholder="3500"
                  keyboardType="number-pad"
                  colors={colors}
                />
              </>
            )}
            {priceType === "negotiable" && (
              <View style={[styles.negotiableNote, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                <Text style={{ fontSize: 28 }}>🤝</Text>
                <Text style={[{ color: colors.mutedForeground, fontSize: 13, flex: 1, lineHeight: 19 }]}>
                  Qiymət elanda göstərilməyəcək. Kirayəçi sizinlə birbaşa əlaqə quraraq razılaşacaq.
                </Text>
              </View>
            )}
          </StepContainer>
        );
      case 3:
        return (
          <StepContainer title="Neçə nəfər yerləşər?" colors={colors}>
            <View style={styles.chips}>
              {[1, 2, 3, 4, 5, 6].map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: maxPeople === p ? colors.primary : colors.muted,
                      borderColor: maxPeople === p ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setMaxPeople(p)}
                >
                  <Text style={{ color: maxPeople === p ? "#fff" : colors.mutedForeground, fontWeight: "700", fontSize: 18 }}>
                    {p}
                  </Text>
                  <Text style={{ color: maxPeople === p ? "#fff" : colors.mutedForeground, fontSize: 12 }}>
                    nəfər
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </StepContainer>
        );
      case 4:
        return (
          <StepContainer title="Kredit seçimi" colors={colors}>
            <ToggleCard
              label="Maaşa qədər verilir"
              description="Maaş gününə qədər nisyə"
              value={salaryCredit}
              onToggle={() => setSalaryCredit(!salaryCredit)}
              color="#f59e0b"
              colors={colors}
            />
            <ToggleCard
              label="Avansa qədər verilir"
              description="Avans gününə qədər nisyə"
              value={advanceCredit}
              onToggle={() => setAdvanceCredit(!advanceCredit)}
              color="#3b82f6"
              colors={colors}
            />
          </StepContainer>
        );
      case 5:
        return (
          <StepContainer title={`Şəkillər (${images.length}/5)`} colors={colors}>
            <Text style={[styles.hint, { color: colors.mutedForeground }]}>
              Minimum 2, maksimum 5 şəkil tövsiyə olunur
            </Text>
            <View style={styles.imageGrid}>
              {images.map((uri, i) => (
                <View key={i} style={styles.imgWrapper}>
                  <Image source={{ uri }} style={styles.thumb} />
                  <TouchableOpacity
                    style={styles.removeImg}
                    onPress={() => setImages(images.filter((_, j) => j !== i))}
                  >
                    <Feather name="x" size={12} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
              {images.length < 5 && (
                <TouchableOpacity
                  style={[styles.addImg, { backgroundColor: colors.muted, borderColor: colors.border }]}
                  onPress={pickImage}
                >
                  <Feather name="plus" size={24} color={colors.mutedForeground} />
                  <Text style={[styles.addImgText, { color: colors.mutedForeground }]}>
                    Əlavə et
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </StepContainer>
        );
      case 6:
        return (
          <StepContainer title="Qısa təsvir (istəyə bağlı)" colors={colors}>
            <TextInput
              style={[
                styles.textarea,
                {
                  backgroundColor: colors.muted,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
              value={description}
              onChangeText={setDescription}
              placeholder="Mənzil haqqında qısa məlumat yazın..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
          </StepContainer>
        );
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Top bar */}
      <View
        style={[
          styles.topBar,
          {
            paddingTop: topPad + 12,
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity onPress={() => (step > 0 ? setStep(step - 1) : router.back())}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.topTitle, { color: colors.foreground }]}>
          Yeni Mənzil
        </Text>
        <Text style={[styles.stepCount, { color: colors.mutedForeground }]}>
          {step + 1}/{STEPS.length}
        </Text>
      </View>

      {/* Progress */}
      <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
        <View
          style={[
            styles.progressFill,
            {
              backgroundColor: colors.primary,
              width: `${((step + 1) / STEPS.length) * 100}%`,
            },
          ]}
        />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {renderStep()}
      </ScrollView>

      {/* Bottom nav */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 4,
          },
        ]}
      >
        {step < STEPS.length - 1 ? (
          <TouchableOpacity
            style={[
              styles.nextBtn,
              {
                backgroundColor: canGoNext() ? colors.primary : colors.muted,
              },
            ]}
            onPress={() => canGoNext() && setStep(step + 1)}
            disabled={!canGoNext()}
          >
            <Text style={[styles.nextText, { color: canGoNext() ? "#fff" : colors.mutedForeground }]}>
              Növbəti
            </Text>
            <Feather name="arrow-right" size={18} color={canGoNext() ? "#fff" : colors.mutedForeground} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.nextBtn,
              { backgroundColor: colors.primary },
              submitting && { opacity: 0.7 },
            ]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <Feather name="check" size={18} color="#fff" />
            <Text style={styles.nextText}>
              {submitting ? "Yerləşdirilir..." : "Elanı Yerləşdir"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

function StepContainer({
  title,
  children,
  colors,
}: {
  title: string;
  children: React.ReactNode;
  colors: any;
}) {
  return (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: colors.foreground }]}>{title}</Text>
      {children}
    </View>
  );
}

function FormInput({
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
    <View style={{ gap: 6 }}>
      <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        keyboardType={keyboardType}
      />
    </View>
  );
}

function ToggleCard({
  label,
  description,
  value,
  onToggle,
  color,
  colors,
}: {
  label: string;
  description: string;
  value: boolean;
  onToggle: () => void;
  color: string;
  colors: any;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.toggleCard,
        {
          backgroundColor: value ? color + "15" : colors.card,
          borderColor: value ? color : colors.border,
        },
      ]}
      onPress={onToggle}
    >
      <View style={{ flex: 1 }}>
        <Text style={[styles.toggleLabel, { color: colors.foreground }]}>{label}</Text>
        <Text style={[styles.toggleDesc, { color: colors.mutedForeground }]}>{description}</Text>
      </View>
      <View
        style={[
          styles.toggle,
          { backgroundColor: value ? color : colors.muted },
        ]}
      >
        {value && <Feather name="check" size={14} color="#fff" />}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  topTitle: { flex: 1, fontSize: 17, fontWeight: "700" },
  stepCount: { fontSize: 13 },
  progressTrack: { height: 3 },
  progressFill: { height: 3 },
  scrollContent: { padding: 20 },
  stepContainer: { gap: 20 },
  stepTitle: { fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chip: {
    width: 80,
    height: 80,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  priceTypeRow: { flexDirection: "row", gap: 10 },
  priceTypeBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: "center",
  },
  priceTypeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  checkDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  negotiableNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  inputLabel: { fontSize: 12, fontWeight: "600" },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 16,
  },
  hint: { fontSize: 13 },
  imageGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  imgWrapper: { position: "relative" },
  thumb: { width: 90, height: 90, borderRadius: 10 },
  removeImg: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  addImg: {
    width: 90,
    height: 90,
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  addImgText: { fontSize: 11, fontWeight: "500" },
  textarea: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 15,
    minHeight: 120,
  },
  toggleCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 14,
    borderWidth: 2,
  },
  toggleLabel: { fontSize: 15, fontWeight: "600" },
  toggleDesc: { fontSize: 12, marginTop: 2 },
  toggle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomBar: {
    padding: 12,
    borderTopWidth: 1,
  },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    borderRadius: 14,
  },
  nextText: { fontWeight: "700", fontSize: 16, color: "#fff" },
});
