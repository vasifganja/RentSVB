import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLang } from "@/context/LangContext";
import { LANGUAGES, type Lang } from "@/lib/i18n";

const FEATURES: { icon: string; ru: string; en: string; az: string; tr: string }[] = [
  { icon: "🏠", ru: "Посуточная аренда", en: "Daily rentals", az: "Günlük kirayə", tr: "Günlük kiralık" },
  { icon: "⚡", ru: "Быстрый поиск", en: "Fast search", az: "Sürətli axtarış", tr: "Hızlı arama" },
  { icon: "📍", ru: "Свободный", en: "Svobodny city", az: "Svobodny şəhəri", tr: "Svobodny şehri" },
];

export default function WelcomeScreen() {
  const { lang, setLang, tr } = useLang();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [selected, setSelected] = useState<Lang>(lang);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    const native = Platform.OS !== "web";
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: native }),
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 8, useNativeDriver: native }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: native }),
    ]).start();
  }, []);

  const handleContinue = async () => {
    setLang(selected);
    await AsyncStorage.setItem("rentsvb_welcomed", "1");
    router.replace("/(tabs)");
  };

  const descText = {
    ru: "Посуточная аренда жилья в Свободном — быстро и удобно",
    en: "Daily housing rentals in Svobodny — fast and easy",
    az: "Svobodnuda günlük mənzil kirayəsi — sürətli və rahat",
    tr: "Svobodny'de günlük konut kiralama — hızlı ve kolay",
  }[selected];

  const chooseLangText = {
    ru: "Выберите язык",
    en: "Choose language",
    az: "Dil seçin",
    tr: "Dil seçin",
  }[selected];

  const continueText = {
    ru: "Продолжить",
    en: "Continue",
    az: "Davam et",
    tr: "Devam et",
  }[selected];

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 16 }]}>
      {/* Background circles */}
      <View style={[styles.circle1, { backgroundColor: "#38bdf820" }]} />
      <View style={[styles.circle2, { backgroundColor: "#0ea5e910" }]} />

      {/* Logo area */}
      <Animated.View style={[styles.top, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <Animated.View style={[styles.iconWrap, { transform: [{ scale: scaleAnim }] }]}>
          <Text style={styles.icon}>🏙️</Text>
        </Animated.View>
        <Text style={styles.appName}>RentSVB</Text>
        <Text style={styles.appSub}>Svobodny · Свободный</Text>
        <Text style={styles.desc}>{descText}</Text>

        {/* Feature pills */}
        <View style={styles.features}>
          {FEATURES.map((f) => (
            <View key={f.icon} style={styles.featurePill}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <Text style={styles.featureText}>{f[selected]}</Text>
            </View>
          ))}
        </View>
      </Animated.View>

      {/* Language section */}
      <Animated.View style={[styles.langSection, { opacity: fadeAnim }]}>
        <Text style={styles.langTitle}>{chooseLangText}</Text>
        <View style={styles.langGrid}>
          {LANGUAGES.map((l) => (
            <TouchableOpacity
              key={l.code}
              style={[styles.langBtn, selected === l.code && styles.langBtnActive]}
              onPress={() => setSelected(l.code)}
              activeOpacity={0.8}
            >
              <Text style={styles.flag}>{l.flag}</Text>
              <Text style={[styles.langLabel, selected === l.code && styles.langLabelActive]}>
                {l.label}
              </Text>
              {selected === l.code && (
                <View style={styles.checkCircle}>
                  <Text style={styles.check}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

      {/* Continue button */}
      <Animated.View style={{ opacity: fadeAnim }}>
        <TouchableOpacity style={styles.continueBtn} onPress={handleContinue} activeOpacity={0.85}>
          <Text style={styles.continueBtnText}>{continueText}</Text>
          <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>
        <Text style={styles.hint}>
          {selected === "ru" ? "Бесплатно · Быстро · Удобно" :
           selected === "en" ? "Free · Fast · Easy" :
           selected === "az" ? "Pulsuz · Sürətli · Rahat" :
           "Ücretsiz · Hızlı · Kolay"}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0c1220",
    paddingHorizontal: 22,
    justifyContent: "space-between",
    overflow: "hidden",
  },
  circle1: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    top: -80,
    right: -80,
  },
  circle2: {
    position: "absolute",
    width: 250,
    height: 250,
    borderRadius: 125,
    bottom: 100,
    left: -100,
  },
  top: {
    alignItems: "center",
    gap: 10,
    paddingTop: 30,
  },
  iconWrap: {
    width: 90,
    height: 90,
    borderRadius: 28,
    backgroundColor: "#161e2e",
    borderWidth: 1.5,
    borderColor: "#1e3148",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
    shadowColor: "#38bdf8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  icon: { fontSize: 44 },
  appName: {
    fontSize: 40,
    fontWeight: "800",
    color: "#38bdf8",
    letterSpacing: -1.5,
  },
  appSub: {
    fontSize: 13,
    color: "#475569",
    letterSpacing: 1,
  },
  desc: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 21,
    marginTop: 4,
    paddingHorizontal: 10,
  },
  features: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  featurePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#161e2e",
    borderWidth: 1,
    borderColor: "#1e3148",
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 20,
  },
  featureIcon: { fontSize: 13 },
  featureText: { fontSize: 12, color: "#7dd3fc", fontWeight: "600" },
  langSection: { gap: 14 },
  langTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#475569",
    textAlign: "center",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  langGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
  },
  langBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "#161e2e",
    borderWidth: 1.5,
    borderColor: "#1e3148",
    minWidth: 148,
  },
  langBtnActive: {
    borderColor: "#38bdf8",
    backgroundColor: "#0c2a3e",
  },
  flag: { fontSize: 20 },
  langLabel: { flex: 1, fontSize: 14, color: "#64748b", fontWeight: "500" },
  langLabelActive: { color: "#38bdf8", fontWeight: "700" },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#38bdf8",
    alignItems: "center",
    justifyContent: "center",
  },
  check: { fontSize: 11, color: "#fff", fontWeight: "800" },
  continueBtn: {
    backgroundColor: "#0ea5e9",
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#0ea5e9",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  continueBtnText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  arrow: { fontSize: 18, color: "#fff" },
  hint: {
    textAlign: "center",
    fontSize: 12,
    color: "#334155",
    marginTop: 12,
    fontWeight: "500",
  },
});
