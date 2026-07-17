import { supabase } from "./supabase";

export type NotificationData = {
  user_id: string;
  rental_request_id: string;

  type: string;

  title_az: string;
  title_en: string;
  title_ru: string;

  body_az: string;
  body_en: string;
  body_ru: string;
};

export async function createNotification(
  data: NotificationData
) {
  console.log("NOTIFICATION DATA:", data);

  try {
    const { error } = await supabase
      .from("notifications")
      .insert({
        ...data,
        created_at: new Date().toISOString(),
      });

    console.log("NOTIFICATION ERROR:", error);

    if (error) {
      throw error;
    }

    console.log("NOTIFICATION CREATED");
  } catch (e) {
    console.error("NOTIFICATION EXCEPTION:", e);
    throw e;
  }
}