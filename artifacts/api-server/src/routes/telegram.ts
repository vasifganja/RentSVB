import { Router } from "express";

const router = Router();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

async function sendMessage(chatId: number | string, text: string) {
  if (!BOT_TOKEN) throw new Error("TELEGRAM_BOT_TOKEN not set");
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
    }),
  });
  const data = await res.json() as { ok: boolean; description?: string };
  if (!data.ok) throw new Error(data.description ?? "Telegram error");
  return data;
}

// POST /api/telegram/notify-approved
router.post("/telegram/notify-approved", async (req, res) => {
  const { telegram_id, full_name } = req.body as { telegram_id?: number; full_name?: string };
  if (!telegram_id) {
    res.status(400).json({ ok: false, error: "telegram_id required" });
    return;
  }
  try {
    await sendMessage(
      telegram_id,
      `✅ <b>Ваша заявка одобрена!</b>\n\nПривет, <b>${full_name ?? ""}!</b>\n\nТеперь вы можете размещать объявления в RentSVB. Откройте приложение и нажмите «Добавить жильё».\n\n🏠 <b>RentSVB</b> — Свободный`,
    );
    res.json({ ok: true });
  } catch (e: any) {
    req.log.error({ err: e }, "Telegram notify failed");
    res.status(500).json({ ok: false, error: e.message });
  }
});

// POST /api/telegram/notify-rejected
router.post("/telegram/notify-rejected", async (req, res) => {
  const { telegram_id, full_name } = req.body as { telegram_id?: number; full_name?: string };
  if (!telegram_id) {
    res.status(400).json({ ok: false, error: "telegram_id required" });
    return;
  }
  try {
    await sendMessage(
      telegram_id,
      `❌ <b>Ваша заявка отклонена.</b>\n\nПривет, <b>${full_name ?? ""}!</b>\n\nК сожалению, на этот раз ваша заявка на размещение жилья не была одобрена. По вопросам обращайтесь к администратору.\n\n🏠 <b>RentSVB</b>`,
    );
    res.json({ ok: true });
  } catch (e: any) {
    req.log.error({ err: e }, "Telegram notify failed");
    res.status(500).json({ ok: false, error: e.message });
  }
});

// POST /api/telegram/notify-new-listing  — admina yeni elan bildirişi
router.post("/telegram/notify-new-listing", async (req, res) => {
  const { admin_telegram_id, owner_name, rooms, address, district, price, price_type } =
    req.body as {
      admin_telegram_id?: number;
      owner_name?: string;
      rooms?: number;
      address?: string;
      district?: string;
      price?: number;
      price_type?: string;
    };
  if (!admin_telegram_id) {
    res.status(400).json({ ok: false, error: "admin_telegram_id required" });
    return;
  }
  const location = [district, address].filter(Boolean).join(", ");
  const priceText =
    price_type === "negotiable"
      ? "По договорённости"
      : price
      ? `${price.toLocaleString("ru-RU")} ₽/сут`
      : "—";
  try {
    await sendMessage(
      admin_telegram_id,
      `🏠 <b>Новое объявление!</b>\n\n👤 Хозяин: <b>${owner_name ?? "—"}</b>\n🚪 Комнат: <b>${rooms ?? "—"}</b>\n📍 Адрес: <b>${location || "—"}</b>\n💰 Цена: <b>${priceText}</b>\n\n🏠 <b>RentSVB</b> — Свободный`,
    );
    res.json({ ok: true });
  } catch (e: any) {
    req.log.error({ err: e }, "Telegram notify-new-listing failed");
    res.status(500).json({ ok: false, error: e.message });
  }
});

// POST /api/telegram/notify-custom  — admin istədiyi mesajı göndərə bilər
router.post("/telegram/notify-custom", async (req, res) => {
  const { telegram_id, message } = req.body as { telegram_id?: number; message?: string };
  if (!telegram_id || !message) {
    res.status(400).json({ ok: false, error: "telegram_id and message required" });
    return;
  }
  try {
    await sendMessage(telegram_id, message);
    res.json({ ok: true });
  } catch (e: any) {
    req.log.error({ err: e }, "Telegram notify failed");
    res.status(500).json({ ok: false, error: e.message });
  }
});

export default router;
