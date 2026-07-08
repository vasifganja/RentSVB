import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, usePathname, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { LogBox } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider } from "@/context/AuthContext";
import { LangProvider, useLang } from "@/context/LangContext";
import {
  ensureTelegramReady,
  getTelegramUser,
  isTelegramWebApp,
} from "@/lib/telegram";

SplashScreen.preventAutoHideAsync();

// İstifadəçiyə ingilis dilində developer xəbərdarlıqları (LogBox) görünməsin
LogBox.ignoreAllLogs();

const queryClient = new QueryClient();

// Telegram Mini App açılanda istifadəçi məlumatlarını oxu və saxla
// Telegram UI qurğuları: ready/expand + dil. Profil AuthContext-də həll olunur.
function TelegramInit() {
  const { setLang } = useLang();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      await ensureTelegramReady();
      if (cancelled) return;

      const tg = (window as any).Telegram?.WebApp;
      if (tg) {
        try {
          tg.ready();
          tg.expand();
        } catch {}
      }

      if (!isTelegramWebApp()) return;
      const tgUser = getTelegramUser();
      if (!tgUser) return;

      // Dil seçimi: yalnız istifadəçi hələ dil seçməyibsə Telegram dilini tətbiq et
      const savedLang = await AsyncStorage.getItem("rentsvb_lang");
      if (!savedLang && tgUser.language_code) {
        const code = tgUser.language_code.toLowerCase();
        if (code.startsWith("ru")) setLang("ru");
        else if (code.startsWith("az")) setLang("az");
        else if (code.startsWith("tr")) setLang("tr");
        else setLang("en");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [setLang]);

  return null;
}

// Telegram-ın doğma "Geri" düyməsi — alt ekranlarda göstərilir
function TelegramBackButton() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const tg = (window as any)?.Telegram?.WebApp;
    if (!tg?.BackButton) return;

    // Kök tablar: geri düyməsi lazım deyil
    const isRoot =
      pathname === "/" ||
      pathname === "/profile" ||
      pathname === "/welcome";

    const handler = () => {
      if (router.canGoBack()) router.back();
      else router.replace("/(tabs)" as any);
    };

    if (isRoot) {
      try {
        tg.BackButton.offClick(handler);
        tg.BackButton.hide();
      } catch {}
    } else {
      try {
        tg.BackButton.onClick(handler);
        tg.BackButton.show();
      } catch {}
    }

    return () => {
      try {
        tg.BackButton.offClick(handler);
      } catch {}
    };
  }, [pathname, router]);

  return null;
}

function RootLayoutNav() {
  return (
    <>
      <TelegramInit />
      <TelegramBackButton />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="property/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="owner/add-property" options={{ headerShown: false }} />
        <Stack.Screen name="owner/my-properties" options={{ headerShown: false }} />
        <Stack.Screen name="admin/login" options={{ headerShown: false }} />
        <Stack.Screen name="admin/index" options={{ headerShown: false }} />
        <Stack.Screen name="owner/edit-property/[id]" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <LangProvider>
                <AuthProvider>
                  <RootLayoutNav />
                </AuthProvider>
              </LangProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
