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
  // Rental request-i tap
  const { data: rental, error } = await supabase
    .from("rental_requests")
    .select("*")
    .eq("id", rentalId)
    .single();

  if (error || !rental) {
    throw new Error("Rental request not found.");
  }

  // Yalnız accepted request tamamlana bilər
  if (rental.status !== "accepted") {
    throw new Error("Only accepted rentals can be completed.");
  }


  // Razılaşdırılmış qiyməti yaz
  const { data, error: updateError } = await supabase
    .from("rental_requests")
    .update({
  agreed_price: agreedPrice,
  status: "accepted",
  owner_completed_at: now(),
  completed_at: now(),
})
    .eq("id", rentalId)
    .select()
    .single();

  if (updateError) {
    throw updateError;
  }await writeActivityLog({
  user_id: rental.owner_id,
  rental_request_id: rentalId,

  action: "owner_completed",

  details: {
    agreed_price: agreedPrice,
  },
});
await createNotification({
  user_id: rental.tenant_id,
  rental_request_id: rentalId,

  ...getOwnerCompletedNotification(),
});
  return data;
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
  // Rental request-i tap
  const { data: request, error } = await supabase
    .from("rental_requests")
    .select("*")
    .eq("id", rentalRequestId)
    .single();

  if (error || !request) {
    throw new Error("Rental request not found.");
  }

  // Yalnız tenant tərəfindən təsdiqlənmiş icarə tamamlana bilər
  if (!request.tenant_confirmed_at) {
    throw new Error("Rental has not been confirmed by the tenant.");
  }
  const { error: requestError } = await supabase
  .from("rental_requests")
  .update({
    status: "completed",
  })
  .eq("id", rentalRequestId);

if (requestError) {
  throw requestError;
}
  // Rental statusunu completed et
const { error: rentalError } = await supabase
  .from("rentals")
  .update({
    status: "completed",
  })
  .eq("rental_request_id", rentalRequestId);

if (rentalError) {
  throw rentalError;
}
await makePropertyAvailable(
  request.property_id
);
await writeActivityLog({
  user_id: request.owner_id,
  rental_request_id: rentalRequestId,

  action: "rental_completed",

  details: {},
});
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
  // Rental request-i tap
  const { data: request, error } = await supabase
    .from("rental_requests")
    .select("*")
    .eq("id", rentalRequestId)
    .single();

  if (error || !request) {
    throw new Error("Rental request not found.");
  }

  // Yalnız tenant tərəfindən təsdiqlənmiş aktiv icarə ləğv edilə bilər
  if (!request.tenant_confirmed_at) {
    throw new Error("Rental is not active.");
  }
  // Rental request statusunu cancelled et
const { error: requestError } = await supabase
  .from("rental_requests")
  .update({
    status: "cancelled",
  })
  .eq("id", rentalRequestId);

if (requestError) {
  throw requestError;
}

// Rental statusunu cancelled et
const { error: rentalError } = await supabase
  .from("rentals")
  .update({
    status: "cancelled",
  })
  .eq("rental_request_id", rentalRequestId);

if (rentalError) {
  throw rentalError;
}
await makePropertyAvailable(
  request.property_id
);

await writeActivityLog({
  user_id: request.owner_id,
  rental_request_id: rentalRequestId,

  action: "rental_cancelled",

  details: {},
});

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

  const { data, error } = await supabase
    .from("rental_requests")
    .insert({
      property_id: propertyId,
      owner_id: ownerId,
      tenant_id: tenantId,
      status: "pending",
      created_at: now(),
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function ownerAcceptRental(
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

  if (request.status !== "pending") {
    throw new Error("Only pending requests can be accepted.");
  }

  const { data, error: updateError } = await supabase
    .from("rental_requests")
    .update({
      status: "accepted",
      accepted_at: now(),
    })
    .eq("id", rentalRequestId)
    .select()
    .single();

  if (updateError) {
    throw updateError;
  }

  await reserveProperty(
    request.property_id,
    rentalRequestId
  );

  const { error: rejectError } = await supabase
    .from("rental_requests")
    .update({
      status: "declined",
      rejected_at: now(),
    })
    .eq("property_id", request.property_id)
    .eq("status", "pending")
    .neq("id", rentalRequestId);

  if (rejectError) {
    throw rejectError;
  }

  await createNotification({
    user_id: request.tenant_id,
    rental_request_id: rentalRequestId,
    ...getRequestAcceptedNotification(),
  });

  await writeActivityLog({
    user_id: request.owner_id,
    rental_request_id: rentalRequestId,
    action: "request_accepted",
    details: {},
  });

  return data;
}