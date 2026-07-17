import { supabase } from "./supabase";

export type ActivityLogData = {
  user_id: string;
  rental_request_id: string;

  action: string;

  details?: Record<string, unknown>;
};

export async function writeActivityLog(
  data: ActivityLogData
) {
  const { error } = await supabase
    .from("activity_logs")
    .insert(data);

  if (error) {
    throw error;
  }
}