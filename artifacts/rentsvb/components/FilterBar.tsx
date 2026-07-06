import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useLang } from "@/context/LangContext";
import { useColors } from "@/hooks/useColors";

export type Filters = {
  rooms: number | null;
  maxPeople: number | null;
  salaryCredit: boolean;
  advanceCredit: boolean;
  maxPrice: number | null;
};

type Props = {
  filters: Filters;
  onFiltersChange: (f: Filters) => void;
  total: number;
};

export function FilterBar({ filters, onFiltersChange, total }: Props) {
  const colors = useColors();
  const { tr } = useLang();
  const [visible, setVisible] = useState(false);
  const [temp, setTemp] = useState<Filters>(filters);

  const activeCount = [
    filters.rooms !== null,
    filters.maxPeople !== null,
    filters.salaryCredit,
    filters.advanceCredit,
    filters.maxPrice !== null,
  ].filter(Boolean).length;

  const apply = () => {
    onFiltersChange(temp);
    setVisible(false);
  };

  const reset = () => {
    const empty: Filters = {
      rooms: null,
      maxPeople: null,
      salaryCredit: false,
      advanceCredit: false,
      maxPrice: null,
    };
    setTemp(empty);
    onFiltersChange(empty);
    setVisible(false);
  };

  return (
    <>
      <View style={[styles.bar, { borderBottomColor: colors.border }]}>
        <Text style={[styles.total, { color: colors.mutedForeground }]}>
          {total} {tr("listings_count")}
        </Text>
        <TouchableOpacity
          style={[
            styles.filterBtn,
            {
              backgroundColor: activeCount > 0 ? colors.primary : colors.muted,
              borderColor: colors.border,
            },
          ]}
          onPress={() => {
            setTemp(filters);
            setVisible(true);
          }}
        >
          <Feather
            name="sliders"
            size={14}
            color={activeCount > 0 ? "#fff" : colors.mutedForeground}
          />
          <Text
            style={[
              styles.filterText,
              { color: activeCount > 0 ? "#fff" : colors.mutedForeground },
            ]}
          >
            {tr("filter")} {activeCount > 0 ? `(${activeCount})` : ""}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={[styles.sheet, { backgroundColor: colors.card }]}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <Text style={[styles.title, { color: colors.foreground }]}>
              {tr("filters")}
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>
                {tr("rooms")}
              </Text>
              <View style={styles.chips}>
                {[null, 1, 2, 3, 4].map((r) => (
                  <TouchableOpacity
                    key={r ?? "any"}
                    style={[
                      styles.chip,
                      {
                        backgroundColor:
                          temp.rooms === r ? colors.primary : colors.muted,
                        borderColor:
                          temp.rooms === r ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setTemp({ ...temp, rooms: r })}
                  >
                    <Text
                      style={{
                        color:
                          temp.rooms === r ? "#fff" : colors.mutedForeground,
                        fontWeight: "600",
                        fontSize: 13,
                      }}
                    >
                      {r === null ? tr("any") : `${r} ${tr("room")}`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.label, { color: colors.mutedForeground }]}>
                {tr("maxPeople")}
              </Text>
              <View style={styles.chips}>
                {[null, 1, 2, 3, 4].map((p) => (
                  <TouchableOpacity
                    key={p ?? "any"}
                    style={[
                      styles.chip,
                      {
                        backgroundColor:
                          temp.maxPeople === p ? colors.primary : colors.muted,
                        borderColor:
                          temp.maxPeople === p ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setTemp({ ...temp, maxPeople: p })}
                  >
                    <Text
                      style={{
                        color:
                          temp.maxPeople === p ? "#fff" : colors.mutedForeground,
                        fontWeight: "600",
                        fontSize: 13,
                      }}
                    >
                      {p === null ? tr("any") : `${p} ${tr("people")}`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.label, { color: colors.mutedForeground }]}>
                {tr("salaryCredit")}
              </Text>
              <View style={styles.chips}>
                <TouchableOpacity
                  style={[
                    styles.chip,
                    {
                      backgroundColor: temp.salaryCredit ? "#f59e0b" : colors.muted,
                      borderColor: temp.salaryCredit ? "#f59e0b" : colors.border,
                    },
                  ]}
                  onPress={() => setTemp({ ...temp, salaryCredit: !temp.salaryCredit })}
                >
                  <Text
                    style={{
                      color: temp.salaryCredit ? "#fff" : colors.mutedForeground,
                      fontWeight: "600",
                      fontSize: 13,
                    }}
                  >
                    {tr("salaryCredit")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.chip,
                    {
                      backgroundColor: temp.advanceCredit ? "#3b82f6" : colors.muted,
                      borderColor: temp.advanceCredit ? "#3b82f6" : colors.border,
                    },
                  ]}
                  onPress={() => setTemp({ ...temp, advanceCredit: !temp.advanceCredit })}
                >
                  <Text
                    style={{
                      color: temp.advanceCredit ? "#fff" : colors.mutedForeground,
                      fontWeight: "600",
                      fontSize: 13,
                    }}
                  >
                    {tr("advanceCredit")}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.resetBtn, { borderColor: colors.border }]}
                onPress={reset}
              >
                <Text style={[styles.resetText, { color: colors.mutedForeground }]}>
                  {tr("reset")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.applyBtn, { backgroundColor: colors.primary }]}
                onPress={apply}
              >
                <Text style={styles.applyText}>{tr("apply")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  total: {
    fontSize: 13,
    fontWeight: "500",
  },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 13,
    fontWeight: "600",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "80%",
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 16,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
    paddingTop: 16,
  },
  resetBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  resetText: {
    fontWeight: "600",
    fontSize: 15,
  },
  applyBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  applyText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});
