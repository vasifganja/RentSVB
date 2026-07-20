import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
} from "react-native";

import { supabase } from "@/lib/supabase";
import { tenantConfirmRental } from "@/lib/rentalFlow";
import { useLang } from "@/context/LangContext";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { Alert } from "react-native";

export default function TenantRequestsScreen() {

  const { tr } = useLang();
  const colors = useColors();
  const { profile } = useAuth();

  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingRequestId, setConfirmingRequestId] = useState<string | null>(null);
  const fetchRequests = async () => {
  if (!profile?.id) return;

  setLoading(true);

  const { data, error } = await supabase
    .from("rental_requests")
    .select(`
      *,
      property:properties(
        id,
        address,
        district,
        rooms,
        images,
        status,
        price_type,
        price_weekday,
        price_weekend
      ),
      owner:profiles!owner_id(
        full_name,
        phone
      )
    `)
    .eq("tenant_id", profile.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.log(error);
  } else {
    setRequests(data ?? []);
  }

  setLoading(false);
};

const cancelRentalRequest = async (id: string) => {
  const { error } = await supabase
    .from("rental_requests")
    .update({
      status: "cancelled",
    })
    .eq("id", id);

  if (error) {
    console.log(error);
    return;
  }

  fetchRequests();
};

const confirmRental = async (id: string) => {
  try {
    await tenantConfirmRental(id);
    fetchRequests();
  } catch (error: any) {
    console.log(error);
    alert(error?.message ?? tr("somethingWentWrong"));
  }
};
useEffect(() => {
  fetchRequests();

  if (!profile?.id) return;

  const channel = supabase
    .channel("tenant-requests")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "rental_requests",
        filter: `tenant_id=eq.${profile.id}`,
      },
      () => {
        fetchRequests();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [profile?.id]);

if (loading) {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.background,
      }}
    >
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}
  
  return (
  <>

    <FlatList
  style={{
    flex: 1,
    backgroundColor: colors.background,
  }}
  contentContainerStyle={{
    padding: 16,
    gap: 12,
  }}
  data={requests}
  keyExtractor={(item) => item.id.toString()}
  renderItem={({ item }) => (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 14,
        padding: 16,
      }}
    >
      {item.property?.images?.[0] && (
  <Image
    source={{ uri: item.property.images[0] }}
    style={{
      width: "100%",
      height: 180,
      borderRadius: 12,
      marginBottom: 12,
    }}
    resizeMode="cover"
  />
)}
<Text
        style={{
          color: colors.foreground,
          fontWeight: "700",
          fontSize: 16,
        }}
      >
        {item.property?.address || "-"}
      </Text>

      <Text
  style={{
    color: colors.mutedForeground,
    marginTop: 4,
    fontSize: 14,
  }}
>
  👤 {item.owner?.full_name || "-"}
</Text>
<Text
  style={{
    color: colors.mutedForeground,
    marginTop: 4,
    fontSize: 13,
  }}
>
  📅 {new Date(item.created_at).toLocaleDateString()}
</Text>

      <View
  style={{
    alignSelf: "flex-start",
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor:
  item.status === "active"
    ? "#3b82f6"
    : item.status === "accepted"
    ? "#22c55e"
    : item.status === "pending"
    ? "#f59e0b"
    : item.status === "cancelled"
    ? "#6b7280"
    : "#ef4444",
  }}
>
  <Text
    style={{
      color: "#fff",
      fontWeight: "700",
      fontSize: 12,
    }}
  >
    {
  item.status === "pending"
  ? tr("pending")
  : item.status === "accepted"
  ? tr("accepted")
  : item.status === "active"
  ? tr("active")
  : item.status === "declined"
  ? tr("declined")
  : item.status === "cancelled"
  ? tr("cancelled")
  : item.status
}
  </Text>
</View>


{item.owner_completed_at && (
  <View
    style={{
      marginTop: 12,
    }}
  >
    <Text
      style={{
        color: colors.foreground,
        fontWeight: "700",
      }}
    >
      {tr("agreedPrice")}
    </Text>

    <Text
      style={{
        color: colors.primary,
        fontSize: 18,
        fontWeight: "700",
        marginTop: 4,
      }}
    >
      {item.agreed_price} ₽
    </Text>
  </View>
)}

{item.status === "pending" && (
  <TouchableOpacity
    onPress={() => cancelRentalRequest(item.id)}
    style={{
      marginTop: 12,
      backgroundColor: "#ef4444",
      paddingVertical: 10,
      borderRadius: 10,
      alignItems: "center",
    }}
  >
    <Text
      style={{
        color: "#fff",
        fontWeight: "700",
      }}
    >
      {tr("cancel")}
    </Text>
  </TouchableOpacity>
)}

{item.status === "accepted" &&
  item.owner_completed_at &&
  (confirmingRequestId === item.id ? (
    <View style={{ marginTop: 12 }}>
      <Text
        style={{
          color: colors.foreground,
          marginBottom: 12,
          textAlign: "center",
        }}
      >
        {tr("confirmRentalMessage")}
      </Text>

      <TouchableOpacity
        onPress={async () => {
          await confirmRental(item.id);
          setConfirmingRequestId(null);
        }}
        style={{
          backgroundColor: "#22c55e",
          paddingVertical: 12,
          borderRadius: 10,
          alignItems: "center",
        }}
      >
        <Text
          style={{
            color: "#fff",
            fontWeight: "700",
          }}
        >
          {tr("confirm")}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => setConfirmingRequestId(null)}
        style={{
          marginTop: 10,
          alignItems: "center",
        }}
      >
        <Text
          style={{
            color: "#ef4444",
            fontWeight: "700",
          }}
        >
          {tr("cancel")}
        </Text>
      </TouchableOpacity>
    </View>
  ) : (
    <TouchableOpacity
      onPress={() => {
        setConfirmingRequestId(item.id);
      }}
      style={{
        marginTop: 12,
        backgroundColor: "#22c55e",
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: "center",
      }}
    >
      <Text
        style={{
          color: "#fff",
          fontWeight: "700",
        }}
      >
        {tr("confirmRental")}
      </Text>
        </TouchableOpacity>
  ))}
    </View>
  )}
  ListEmptyComponent={
    <View
      style={{
        alignItems: "center",
        marginTop: 80,
      }}
    >
      <Text
        style={{
          color: colors.mutedForeground,
        }}
      >
        {tr("noRentalRequests")}
      </Text>
    </View>
  }
    />
    
  </>
);
}