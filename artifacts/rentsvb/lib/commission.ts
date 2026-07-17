import { supabase } from "./supabase";
import { getSetting } from "./settings";

export async function getCommissionRate() {
  return Number(
    await getSetting("commission_rate")
  );
}

export async function calculateCommission(
  agreedPrice: number
) {
  const rate = await getCommissionRate();

  return (agreedPrice * rate) / 100;
}