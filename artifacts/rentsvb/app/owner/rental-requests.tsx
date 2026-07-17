import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Alert,
  TouchableOpacity,
} from "react-native";

import { useLang } from "@/context/LangContext";
import { useColors } from "@/hooks/useColors";
import { supabase } from "@/lib/supabase";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ownerAcceptRental,
  ownerRejectRental,
} from "@/lib/rentalFlow";

export default function RentalRequestsScreen() {
  const { tr } = useLang();
  const colors = useColors();
  const router = useRouter();

  const { propertyId } = useLocalSearchParams<{
    propertyId: string;
  }>();

  const [requests, setRequests] = useState<any[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const fetchRequests = async () => {
  if (!propertyId) return;

  const { data, error } = await supabase
    .from("rental_requests")
    .select(`
      *,
      tenant:profiles!tenant_id (
        full_name,
        phone
      )
    `)
    .eq("property_id", propertyId)
    .eq("status", "pending");

  if (error) {
    console.log(error);
    return;
  }

  setRequests(data ?? []);
};

const handleAccept = async (requestId: string) => {
  try {
    setProcessingId(requestId);

    await ownerAcceptRental(requestId);

setRequests((prev) =>
  prev.filter((item) => item.id !== requestId)
);
    

    Alert.alert(
      tr("success"),
      tr("requestAccepted")
    );
  } catch (e: any) {
    Alert.alert(
      tr("error"),
      e.message ?? tr("unknownError")
    );
  } finally {
    setProcessingId(null);
  }
};

const handleReject = async (requestId: string) => {
  try {
    setProcessingId(requestId);

    await ownerRejectRental(requestId);
    console.log("REJECT OK");

setRequests((prev) =>
  prev.filter((item) => item.id !== requestId)
);

    Alert.alert(
      tr("success"),
      tr("requestRejected")
    );
  } catch (e: any) {
  console.error("REJECT ERROR:", e);

  Alert.alert(
    tr("error"),
    e.message ?? tr("unknownError")
  );
} finally {
    setProcessingId(null);
  }
};

  useEffect(() => {
  fetchRequests();
}, [propertyId]);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "flex-start",
        alignItems: "stretch",
        backgroundColor: colors.background,
        padding: 16,
      }}
    >
      <Text
        style={{
          color: colors.foreground,
          fontSize: 22,
          fontWeight: "700",
        }}
      >
        {tr("rentalRequests")}
      </Text>

      <Text
        style={{
          marginTop: 12,
          marginBottom: 16,
          color: colors.mutedForeground,
        }}
      >
        {tr("pendingRequests")}: {requests.length}
      </Text>

      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
  <View
    style={{
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.mutedForeground,
    }}
  >
    <Text
      style={{
        color: colors.foreground,
        fontSize: 16,
        fontWeight: "700",
      }}
    >
      {item.tenant?.full_name ?? "Unknown Tenant"}
    </Text>

    <Text
      style={{
        color: colors.mutedForeground,
        marginTop: 4,
      }}
    >
      {item.tenant?.phone ?? tr("noPhone")}
    </Text>

    <Text
      style={{
        color: colors.mutedForeground,
        marginTop: 4,
      }}
    >
      {tr("status")}: {tr(item.status)}
    </Text>
    <View
  style={{
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  }}
>
  <TouchableOpacity
  disabled={processingId === item.id}
  onPress={() => handleAccept(item.id)}
  style={{
    flex: 1,
    backgroundColor: "#22c55e",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    opacity: processingId === item.id ? 0.6 : 1,
  }}
>
  <Text
    style={{
      color: "#fff",
      fontWeight: "700",
    }}
  >
    {tr("accept")}
  </Text>
</TouchableOpacity>

  <TouchableOpacity
    disabled={processingId === item.id}
    onPress={() => handleReject(item.id)}
    style={{
      flex: 1,
      backgroundColor: "#ef4444",
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: "center",
      opacity: processingId === item.id ? 0.6 : 1,
    }}
  >
    <Text
      style={{
        color: "#fff",
        fontWeight: "700",
      }}
    >
      {tr("reject")}
    </Text>
  </TouchableOpacity>
</View> 
  </View>
)}
      />
    </View>
  );
}