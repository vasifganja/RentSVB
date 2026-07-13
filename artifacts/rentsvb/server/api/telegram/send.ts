const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;

export async function sendTelegram(
  chatId: number | string,
  text: string
) {
  const res = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
      }),
    }
  );

  return res.json();
}