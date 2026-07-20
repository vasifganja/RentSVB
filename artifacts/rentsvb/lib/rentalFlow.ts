import { supabase } from "./supabase";
import { createNotification } from "./notifications";
import { writeActivityLog } from "./activityLogs";
import { createCommissionEntry } from "./wallet";

import {
  reserveProperty,
  makePropertyAvailable,
} from "./property";
import {
  getRequestAcceptedNotification,
  getRequestRejectedNotification,
  getOwnerCompletedNotification,
  getTenantConfirmedNotification,
  getRentalCompletedNotification,
  getOwnerRentalCompletedNotification,
  getRentalCancelledNotification,
  getOwnerRentalCancelledNotification,
} from "./notificationTemplates";


const now = () => new Date().toISOString();

/*
Rental Flow v2

Request
↓

Owner accepts

↓

Owner completes rental

↓

Tenant confirms

↓

Rental Active

*/



export async function ownerCompleteRental(
  rentalId: string,
  agreedPrice: number
) {
  const { data: request, error } = await supabase
    .from("rental_requests")
    .select("*")
    .eq("id", rentalId)
    .single();

  if (error || !request) {
    throw new Error("Rental request not found.");
  }

  const { error: rpcError } = await supabase.rpc(
    "complete_owner_rental",
    {
      p_request_id: rentalId,
      p_agreed_price: agreedPrice,
    }
  );

  if (rpcError) {
    throw rpcError;
  }

  await createNotification({
    user_id: request.tenant_id,
    rental_request_id: rentalId,
    ...getOwnerCompletedNotification(),
  });

  return true;
}

export async function ownerRejectRental(
  rentalRequestId: string
) {
  // Sorğunu tap
  const { data: request, error } = await supabase
    .from("rental_requests")
    .select("*")
    .eq("id", rentalRequestId)
    .single();

  if (error || !request) {
    throw new Error("Rental request not found.");
  }

  // Yalnız pending sorğu rədd edilə bilər
  if (request.status !== "pending") {
    throw new Error("Only pending requests can be rejected.");
  }

  const { data, error: updateError } = await supabase
    .from("rental_requests")
    .update({
      status: "declined",
      rejected_at: now(),
    })
    .eq("id", rentalRequestId)
    .select()
    .single();

  if (updateError) {
    throw updateError;
  }


await createNotification({
  user_id: request.tenant_id,
  rental_request_id: rentalRequestId,

  ...getRequestRejectedNotification(),
});

await writeActivityLog({
  user_id: request.owner_id,
  rental_request_id: rentalRequestId,
  action: "request_rejected",
  details: {},
});

return data;
}

export async function tenantConfirmRental(
  requestId: string
) {
  // Rental request-i tap
  const { data: request, error } = await supabase
    .from("rental_requests")
    .select("*")
    .eq("id", requestId)
    .single();

  if (error || !request) {
    throw new Error("Rental request not found.");
  }

  // Owner əvvəl tamamlamalıdır
  if (!request.owner_completed_at) {
    throw new Error("Owner has not completed this rental yet.");
  }

  const { error: requestError } = await supabase.rpc(
  "confirm_rental",
  {
    p_request_id: requestId,
  }
);

if (requestError) {
  throw requestError;
}

  // Rentals cədvəlini yenilə
  const { error: rentalError } = await supabase
    .from("rentals")
    .update({
      status: "active",
    })
    .eq("rental_request_id", requestId);

  if (rentalError) {
    throw rentalError;
  }
  /*
await createCommissionEntry(
  request.owner_id,
  requestId,
  request.agreed_price
);

await reserveProperty(
  request.property_id,
  requestId
);

await writeActivityLog({
  ...
});

await createNotification({
  ...
});
*/

  return true;
}



export async function completeRental(
  rentalRequestId: string
) {
  const { data: request, error } = await supabase
    .from("rental_requests")
    .select("*")
    .eq("id", rentalRequestId)
    .single();

  if (error || !request) {
    throw new Error("Rental request not found.");
  }

  const { error: rpcError } = await supabase.rpc(
    "complete_rental",
    {
      p_request_id: rentalRequestId,
    }
  );

  if (rpcError) {
    throw rpcError;
  }

  // Hələlik notification frontend-də qalır
  await createNotification({
    user_id: request.tenant_id,
    rental_request_id: rentalRequestId,
    ...getRentalCompletedNotification(),
  });

  await createNotification({
    user_id: request.owner_id,
    rental_request_id: rentalRequestId,
    ...getOwnerRentalCompletedNotification(),
  });

  return true;
}
export async function cancelActiveRental(
  rentalRequestId: string
) {
  const { data: request, error } = await supabase
    .from("rental_requests")
    .select("*")
    .eq("id", rentalRequestId)
    .single();

  if (error || !request) {
    throw new Error("Rental request not found.");
  }

  const { error: rpcError } = await supabase.rpc(
    "cancel_rental",
    {
      p_request_id: rentalRequestId,
    }
  );

  if (rpcError) {
    throw rpcError;
  }

  await createNotification({
    user_id: request.tenant_id,
    rental_request_id: rentalRequestId,
    ...getRentalCancelledNotification(),
  });

  await createNotification({
    user_id: request.owner_id,
    rental_request_id: rentalRequestId,
    ...getOwnerRentalCancelledNotification(),
  });

  return true;
}


export async function createRentalRequest(
  propertyId: string,
  ownerId: string,
  tenantId: string
) {
  
  const { data: property, error: propertyError } = await supabase
  .from("properties")
  .select("status")
  .eq("id", propertyId)
  .single();

if (propertyError) {
  throw propertyError;
}

if (property.status !== "available") {
  throw new Error("PROPERTY_NOT_AVAILABLE");
}

  const { data: existingRequests, error: checkError } = await supabase
  .from("rental_requests")
  .select("id")
  .eq("property_id", propertyId)
  .eq("tenant_id", tenantId)
  .eq("status", "pending");
  
  if (checkError) {
  throw checkError;
}

if (existingRequests && existingRequests.length > 0) {
  throw new Error("PENDING_REQUEST_EXISTS");
}

  const { data, error } = await supabase.rpc(
  "create_rental_request",
  {
    p_property_id: propertyId,
    p_owner_id: ownerId,
    p_tenant_id: tenantId,
  }
);

  if (error) {
    throw error;
  }

  return data;
}

export async function ownerAcceptRental(
  rentalRequestId: string
) {
  // Request-i tap (notification üçün lazımdır)
  const { data: request, error } = await supabase
    .from("rental_requests")
    .select("*")
    .eq("id", rentalRequestId)
    .single();

  if (error || !request) {
    throw new Error("Rental request not found.");
  }

  // Bütün əsas işi artıq SQL Function edir
  const { error: rpcError } = await supabase.rpc(
    "accept_rental",
    {
      p_request_id: rentalRequestId,
    }
  );

  if (rpcError) {
    throw rpcError;
  }

  // Hələlik notification frontend-də qalır
  await createNotification({
    user_id: request.tenant_id,
    rental_request_id: rentalRequestId,
    ...getRequestAcceptedNotification(),
  });

  return true;
}