import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Alert,
  TouchableOpacity,
  Modal,
  TextInput,
} from "react-native";

import { useLang } from "@/context/LangContext";
import { useColors } from "@/hooks/useColors";
import { supabase } from "@/lib/supabase";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ownerAcceptRental,
  ownerRejectRental,
  ownerCompleteRental,
} from "@/lib/rentalFlow";
import { useAuth } from "@/context/AuthContext";

export default function RentalRequestsScreen() {
  const { tr } = useLang();
  const colors = useColors();
  const router = useRouter();
  const { profile } = useAuth();

  const { propertyId } = useLocalSearchParams<{
    propertyId: string;
  }>();

  const [requests, setRequests] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<
  "pending" | "accepted" | "declined" | "all"
>("all");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);

const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

const [agreedPrice, setAgreedPrice] = useState("");
  const fetchRequests = async () => {

  let query = supabase
    .from("rental_requests")
    .select(`
  *,
  tenant:profiles!tenant_id(
    full_name,
    phone
  ),
  property:properties!property_id(
    address
  )
`)
    if (propertyId) {
  query = query.eq("property_id", propertyId);
} else {
  query = query.eq("owner_id", profile?.id);
}

  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const { data, error } = await query;

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

  if (!propertyId) return;

  const channel = supabase
    .channel(`owner-rental-requests-${propertyId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "rental_requests",
        filter: `property_id=eq.${propertyId}`,
      },
      () => {
        fetchRequests();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [propertyId, statusFilter]);

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
  {statusFilter === "pending" &&
    `${tr("pendingRequests")}: ${requests.length}`}

  {statusFilter === "accepted" &&
    `${tr("accepted")}: ${requests.length}`}

  {statusFilter === "declined" &&
    `${tr("declined")}: ${requests.length}`}

  {statusFilter === "all" &&
    `${tr("all")}: ${requests.length}`}
</Text>
      <View
  style={{
    flexDirection: "row",
    marginBottom: 16,
    gap: 8,
  }}
>
  {[
  { key: "all", label: tr("all") },
  { key: "pending", label: tr("pending") },
  { key: "accepted", label: tr("accepted") },
  { key: "declined", label: tr("declined") },
].map((item) => (
    <TouchableOpacity
      key={item.key}
      onPress={() => setStatusFilter(item.key as any)}
      style={{
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor:
          statusFilter === item.key
            ? colors.primary
            : colors.card,
      }}
    >
      <Text
        style={{
          color:
            statusFilter === item.key
              ? "#fff"
              : colors.foreground,
          fontWeight: "700",
        }}
      >
        {item.label}
      </Text>
    </TouchableOpacity>
  ))}
</View>

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
    fontSize: 12,
  }}
>
  {new Date(item.created_at).toLocaleDateString()}
</Text>

    <View
  style={{
    alignSelf: "flex-start",
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor:
      item.status === "pending"
        ? "#facc15"
        : item.status === "accepted"
        ? "#22c55e"
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
    {tr(item.status)}
  </Text>
</View>
    {item.status === "pending" && (
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
</View> )}
{item.status === "accepted" && (
  <TouchableOpacity
    onPress={() => {
      setSelectedRequestId(item.id);
      setAgreedPrice("");
      setShowCompleteModal(true);
    }}
    style={{
      marginTop: 14,
      backgroundColor: colors.primary,
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
      {tr("completeRental")}
    </Text>
  </TouchableOpacity>
)}
  </View>
)}
            />

      <Modal
        visible={showCompleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCompleteModal(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 14,
              padding: 20,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: colors.foreground,
                marginBottom: 16,
              }}
            >
              {tr("completeRental")}
            </Text>

            <TextInput
              value={agreedPrice}
              onChangeText={setAgreedPrice}
              keyboardType="numeric"
              placeholder={tr("price")}
              placeholderTextColor={colors.mutedForeground}
              style={{
                borderWidth: 1,
                borderColor: colors.mutedForeground,
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 12,
                color: colors.foreground,
                marginBottom: 20,
              }}
            />

            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-end",
                gap: 10,
              }}
            >
              <TouchableOpacity
                onPress={() => {
                  setShowCompleteModal(false);
                  setAgreedPrice("");
                  setSelectedRequestId(null);
                }}
              >
                <Text
                  style={{
                    color: colors.mutedForeground,
                    fontWeight: "600",
                  }}
                >
                  {tr("cancel")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
  onPress={async () => {
  try {
    if (!selectedRequestId) return;

    if (!agreedPrice.trim()) {
      Alert.alert(tr("error"), tr("enterPrice"));
      return;
    }

    await ownerCompleteRental(
      selectedRequestId,
      Number(agreedPrice)
    );

    setShowCompleteModal(false);
    setSelectedRequestId(null);
    setAgreedPrice("");
  } catch (error: any) {
    Alert.alert(
      tr("error"),
      error?.message ?? tr("somethingWentWrong")
    );
  }
}}
  style={{
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  }}
>
                <Text
                  style={{
                    color: "#fff",
                    fontWeight: "700",
                  }}
                >
                  {tr("save")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}