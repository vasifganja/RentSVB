import React from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type Props = {
  colors: any;
  value: string;
  saving: boolean;
  onChange: (v: string) => void;
  onSave: () => void;
};

export default function CommissionSettings({
  colors,
  value,
  saving,
  onChange,
  onSave,
}: Props) {
  return (
    <>
      <Text
        style={{
          color: colors.mutedForeground,
          fontSize: 11,
          fontWeight: "700",
          letterSpacing: 0.8,
          marginBottom: 10,
        }}
      >
        KOMİSSİYA FAİZİ
      </Text>

      <View
        style={{
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: 14,
          padding: 14,
          marginBottom: 16,
        }}
      >
        <Text
          style={{
            color: colors.mutedForeground,
            marginBottom: 10,
            fontSize: 13,
          }}
        >
          Hər kirayənin hansı faizi sizə qalsın?
        </Text>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}
        >
          <TextInput
            value={value}
            onChangeText={onChange}
            keyboardType="numeric"
            maxLength={3}
            style={{
              width: 70,
              textAlign: "center",
              fontSize: 18,
              fontWeight: "700",
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.muted,
              color: colors.foreground,
            }}
          />

          <Text
            style={{
              color: colors.foreground,
              fontWeight: "700",
              fontSize: 18,
            }}
          >
            %
          </Text>

          <TouchableOpacity
            onPress={onSave}
            disabled={saving}
            style={{
              flex: 1,
              backgroundColor: colors.primary,
              paddingVertical: 11,
              borderRadius: 10,
              alignItems: "center",
              opacity: saving ? 0.7 : 1,
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontWeight: "700",
                fontSize: 14,
              }}
            >
              {saving ? "..." : "Saxla"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}