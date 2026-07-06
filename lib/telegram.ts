// Telegram WebApp helpers

export type TelegramUser = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
};

export function getTelegramUser(): TelegramUser | null {
  if (typeof window === "undefined") return null;
  const tg = (window as any).Telegram?.WebApp;
  if (!tg) return null;
  return tg.initDataUnsafe?.user ?? null;
}

// Telegram WebApp SDK-nı dinamik yüklə və hazır olana qədər gözlə.
// Dev rejimində +html.tsx işləmədiyi üçün skripti JS-də yükləyirik.
let sdkPromise: Promise<void> | null = null;

export function ensureTelegramReady(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if ((window as any).Telegram?.WebApp) return Promise.resolve();
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise<void>((resolve) => {
    const waitForWebApp = () => {
      if ((window as any).Telegram?.WebApp) {
        resolve();
        return true;
      }
      return false;
    };

    const existing = document.querySelector<HTMLScriptElement>(
      'script[src*="telegram-web-app.js"]',
    );

    let elapsed = 0;
    const poll = () => {
      if (waitForWebApp()) return;
      elapsed += 50;
      if (elapsed >= 3000) {
        resolve(); // Telegram xaricində açılıb — davam et
        return;
      }
      setTimeout(poll, 50);
    };

    if (existing) {
      poll();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-web-app.js";
    script.async = false;
    script.onload = () => {
      if (!waitForWebApp()) poll();
    };
    script.onerror = () => resolve();
    document.head.appendChild(script);
    poll();
  });

  return sdkPromise;
}

export function isTelegramWebApp(): boolean {
  if (typeof window === "undefined") return false;
  return !!(window as any).Telegram?.WebApp?.initData;
}

// API server base URL — proxy üzərindən /api
function getApiBase(): string {
  if (typeof window !== "undefined") {
    // Eyni origin — proxy avtomatik /api-ya yönləndirir
    return `${window.location.origin}/api`;
  }
  return "/api";
}

// Admin Telegram ID — Supabase-dən oxumaq yerinə env var olaraq saxlanır
// Bu dəyər add-property.tsx-dən çağırılır
export const ADMIN_TELEGRAM_ID = 5831496354;

export async function notifyApproved(telegramId: number, fullName: string): Promise<void> {
  try {
    await fetch(`${getApiBase()}/telegram/notify-approved`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegram_id: telegramId, full_name: fullName }),
    });
  } catch {
    // bildiriş göndərilməsə də qeydiyyat işləyir
  }
}

export async function notifyRejected(telegramId: number, fullName: string): Promise<void> {
  try {
    await fetch(`${getApiBase()}/telegram/notify-rejected`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegram_id: telegramId, full_name: fullName }),
    });
  } catch {}
}

export async function notifyNewListing(params: {
  ownerName: string;
  rooms: number;
  address: string;
  district: string;
  price?: number;
  priceType?: string;
}): Promise<void> {
  try {
    await fetch(`${getApiBase()}/telegram/notify-new-listing`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        admin_telegram_id: ADMIN_TELEGRAM_ID,
        owner_name: params.ownerName,
        rooms: params.rooms,
        address: params.address,
        district: params.district,
        price: params.price,
        price_type: params.priceType,
      }),
    });
  } catch {}
}

// ─── UI helpers (Telegram Mini App-da düzgün işləyən dialoq və linklər) ───────
// React Native Web-də Alert.alert işləmir; Telegram-ın öz popup/link API-larından
// istifadə edirik, xaricdə isə brauzer fallback-i.

export function showAlert(message: string, title = ""): void {
  if (typeof window === "undefined") return;
  const tg = (window as any).Telegram?.WebApp;
  if (tg?.showPopup) {
    try {
      tg.showPopup({ title: title || "", message, buttons: [{ type: "ok" }] });
      return;
    } catch {}
  }
  if (tg?.showAlert) {
    try {
      tg.showAlert(title ? `${title}\n${message}` : message);
      return;
    } catch {}
  }
  window.alert(title ? `${title}\n${message}` : message);
}

export function openTelegramLink(url: string): void {
  if (typeof window === "undefined") return;
  const tg = (window as any).Telegram?.WebApp;
  if (tg?.openTelegramLink) {
    try {
      tg.openTelegramLink(url);
      return;
    } catch {}
  }
  window.open(url, "_blank");
}

export function openPhone(phone: string): void {
  if (typeof window === "undefined") return;
  window.location.href = `tel:${phone}`;
}
