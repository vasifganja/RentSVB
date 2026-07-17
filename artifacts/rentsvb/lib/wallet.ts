import { supabase } from "./supabase";
import { calculateCommission } from "./commission";

export type WalletEntryData = {
  owner_id: string;
  rental_request_id: string;

  type: string;

  amount: number;

  balance_after?: number;

  note?: string;
};

export async function getOwnerBalance(
  ownerId: string
): Promise<number> {
  const { data, error } = await supabase
    .from("owner_wallet")
    .select("amount")
    .eq("owner_id", ownerId);

  if (error) {
    throw error;
  }

  return (
    data?.reduce(
      (total, entry) => total + Number(entry.amount),
      0
    ) ?? 0
  );
}

export async function createWalletEntry(
  data: WalletEntryData
) {
  const balance =
    await getOwnerBalance(data.owner_id);

  const balanceAfter =
    balance + data.amount;

  const { error } = await supabase
    .from("owner_wallet")
    .insert({
      ...data,
      balance_after: balanceAfter,
    });

  if (error) {
    throw error;
  }
}
export async function createCommissionEntry(
  ownerId: string,
  rentalRequestId: string,
  agreedPrice: number
) {
  const commission =
    await calculateCommission(agreedPrice);

  await createWalletEntry({
    owner_id: ownerId,
    rental_request_id: rentalRequestId,
    type: "commission",
    amount: commission,
    note: "Rental commission",
  });

  return commission;
}