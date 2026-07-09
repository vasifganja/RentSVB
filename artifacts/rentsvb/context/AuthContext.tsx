import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { ADMIN_TELEGRAM_ID, ensureTelegramReady, getTelegramUser } from "@/lib/telegram";
import { supabase } from "@/lib/supabase";

type Profile = {
  id: string;
  full_name: string;
  phone: string;
  telegram_username: string | null;
  telegram_id: number | null;
  role: "user" | "owner" | "admin";
  is_approved: boolean;
  is_blocked: boolean;
};

type AuthContextType = {
  profile: Profile | null;
  isLoading: boolean;
  isAdmin: boolean;
  isOwner: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setGuestProfile: (p: Profile) => void;
};

const AuthContext = createContext<AuthContextType>({
  profile: null,
  isLoading: true,
  isAdmin: false,
  isOwner: false,
  signOut: async () => {},
  refreshProfile: async () => {},
  setGuestProfile: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      // Telegram SDK hazır olana qədər gözlə (dinamik yüklənir)
      await ensureTelegramReady();
      const tgUser = getTelegramUser();

      if (tgUser) {
        const isAdmin = Number(tgUser.id) === ADMIN_TELEGRAM_ID;

        // Real profili DB-dən telegram_id ilə oxu — real UUID lazımdır (elan owner_id üçün)
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("telegram_id", tgUser.id)
          .maybeSingle();

        if (data) {
          // Admin isə rolu məcburi admin et (DB-də rol düzgün olmasa belə)
          const resolved: Profile = isAdmin ? { ...data, role: "admin" } : data;
          await supabase
          .from("profiles")
          .update({
          last_seen: new Date().toISOString(),
  })
          .eq("id", data.id);
          setProfile(resolved);
          await AsyncStorage.setItem("rentsvb_profile", JSON.stringify(resolved));
          return;
        }

        // DB-də sətir yoxdur, amma admin — yaddaşda müvəqqəti profil (yalnız baxış)
        if (isAdmin) {
          const adminProfile: Profile = {
            id: "admin",
            full_name: tgUser.first_name + (tgUser.last_name ? " " + tgUser.last_name : ""),
            phone: "",
            telegram_username: tgUser.username ?? null,
            telegram_id: tgUser.id,
            role: "admin",
            is_approved: true,
            is_blocked: false,
          };
          setProfile(adminProfile);
          await AsyncStorage.setItem("rentsvb_profile", JSON.stringify(adminProfile));
          return;
        }
      }

      // Telegram xarici / tapılmadı — cache-dən oxu
      const stored = await AsyncStorage.getItem("rentsvb_profile");
      if (stored) {
        setProfile(JSON.parse(stored));
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const refreshProfile = useCallback(async () => {
    if (!profile) return;
    try {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", profile.id)
        .single();
      if (data) {
        setProfile(data);
        await AsyncStorage.setItem("rentsvb_profile", JSON.stringify(data));
      }
    } catch {
      // ignore
    }
  }, [profile]);

  const setGuestProfile = useCallback(async (p: Profile) => {
    setProfile(p);
    await AsyncStorage.setItem("rentsvb_profile", JSON.stringify(p));
  }, []);

  const signOut = useCallback(async () => {
    await AsyncStorage.removeItem("rentsvb_profile");
    setProfile(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        profile,
        isLoading,
        isAdmin: profile?.role === "admin",
        isOwner: profile?.role === "owner" || profile?.role === "admin",
        signOut,
        refreshProfile,
        setGuestProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
