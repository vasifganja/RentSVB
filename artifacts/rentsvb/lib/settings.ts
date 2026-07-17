import { supabase } from "./supabase";

export async function getSetting(key: string) {
  const { data, error } = await supabase
    .from("settings")
    .select("value")
    .eq("key", key)
    .single();

  if (error) {
    throw error;
  }

  return data.value;
}