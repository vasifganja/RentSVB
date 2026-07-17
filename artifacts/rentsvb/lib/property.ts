import { supabase } from "./supabase";

export async function reserveProperty(
  propertyId: string,
  rentalRequestId: string
) {
  const { error } = await supabase
    .from("properties")
    .update({
      status: "reserved",
      current_request_id: rentalRequestId,
    })
    .eq("id", propertyId);

  if (error) {
    throw error;
  }
}

export async function makePropertyAvailable(
  propertyId: string
) {
  const { error } = await supabase
    .from("properties")
    .update({
      status: "available",
      current_request_id: null,
      reserved_until: null,
    })
    .eq("id", propertyId);

  if (error) {
    throw error;
  }
}