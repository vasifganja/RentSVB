import { useLang } from "@/context/LangContext";
import { useColors } from "@/hooks/useColors";
import { supabase } from "@/lib/supabase";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function CompleteRental() {
  const { tr } = useLang();
  const colors = useColors();
  const router = useRouter();

  const { propertyId, status } = useLocalSearchParams<{
    propertyId: string;
    status: string;
  }>();

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [note, setNote] = useState("");
  const [paymentType, setPaymentType] =
  useState<"cash" | "salary_credit">("cash");

  const saveRental = async () => {
    try {
      const { data: property } = await supabase
  .from("properties")
  .select("owner_id, price_weekday")
  .eq("id", propertyId)
  .single();
  if (!property) {
  Alert.alert(tr("error"), "Property not found");
  return;
}

const { error } = await supabase
  .from("rentals")
  .insert({
    property_id: propertyId,
    owner_id: property.owner_id,

    customer_name: customerName,
    customer_phone: customerPhone,

    payment_method: paymentType,

    start_date: new Date().toISOString().slice(0, 10),
    end_date: new Date().toISOString().slice(0, 10),

    days: 1,

    price_per_day: property.price_weekday,

    note,
  });

if (error) {
  console.log(error);
  Alert.alert("Xəta", JSON.stringify(error));
  return;
}
      await supabase
        .from("properties")
        .update({ status })
        .eq("id", propertyId);

      Alert.alert(tr("success"), tr("saveRental"));

      router.back();
    } catch (e: any) {
      Alert.alert(tr("error"), e.message);
    }
  };
    return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 20 }}
    >
      <Text
        style={{
          fontSize: 22,
          fontWeight: "700",
          color: colors.foreground,
          marginBottom: 20,
        }}
      >
        {tr("completeRental")}
      </Text>

      <TextInput
        placeholder={tr("customerName")}
        value={customerName}
        onChangeText={setCustomerName}
        style={[styles.input, { borderColor: colors.border, color: colors.foreground }]}
        placeholderTextColor={colors.mutedForeground}
      />

      <TextInput
        placeholder={tr("customerPhone")}
        value={customerPhone}
        onChangeText={setCustomerPhone}
        keyboardType="phone-pad"
        style={[styles.input, { borderColor: colors.border, color: colors.foreground }]}
        placeholderTextColor={colors.mutedForeground}
      />
      <Text
  style={{
    color: colors.foreground,
    marginBottom: 8,
    fontWeight: "600",
  }}
>
  {tr("paymentType")}
</Text>

<TouchableOpacity
  onPress={() => setPaymentType("cash")}
  style={styles.option}
>
  <Text>{tr("cash")}</Text>
</TouchableOpacity>

<TouchableOpacity
  onPress={() => setPaymentType("salary_credit")}
  style={styles.option}
>
  <Text>{tr("salaryCredit")}</Text>
</TouchableOpacity>

      <TextInput
        placeholder={tr("note")}
        value={note}
        onChangeText={setNote}
        multiline
        style={[
          styles.input,
          {
            borderColor: colors.border,
            color: colors.foreground,
            height: 120,
            textAlignVertical: "top",
          },
        ]}
        placeholderTextColor={colors.mutedForeground}
      />

      <TouchableOpacity
        onPress={saveRental}
        style={[
          styles.button,
          {
            backgroundColor: colors.primary,
          },
        ]}
      >
        <Text style={styles.buttonText}>{tr("saveRental")}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    fontSize: 16,
  },
  option: {
  borderWidth: 1,
  borderColor: "#d1d5db",
  borderRadius: 10,
  padding: 14,
  marginBottom: 10,
},
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});