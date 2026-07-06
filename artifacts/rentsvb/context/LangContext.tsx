import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { t, type Lang } from "@/lib/i18n";

type LangContextType = {
  lang: Lang;
  setLang: (l: Lang) => void;
  tr: (key: string) => string;
};

const LangContext = createContext<LangContextType>({
  lang: "ru",
  setLang: () => {},
  tr: (k) => k,
});

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ru");

  useEffect(() => {
    AsyncStorage.getItem("rentsvb_lang").then((v) => {
      if (v === "ru" || v === "en" || v === "az" || v === "tr") setLangState(v);
    });
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    AsyncStorage.setItem("rentsvb_lang", l);
  }, []);

  const tr = useCallback((key: string) => t[lang][key] ?? key, [lang]);

  return (
    <LangContext.Provider value={{ lang, setLang, tr }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);
