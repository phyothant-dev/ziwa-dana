import { SupplierGroupType } from "@/types/supplierGroupType";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

interface InlineGroupPickerProps {
  isOpen: boolean;
  onToggle: () => void;
  selectedGroup: string;
  onSelect: (groupName: string) => void;
  groupSearch: string;
  onSearchChange: (text: string) => void;
  filteredGroups: SupplierGroupType[];
  themeColor: string;
  translations: {
    rawMaterial?: string;
  };
}

export const InlineGroupPicker: React.FC<InlineGroupPickerProps> = ({
  isOpen,
  onToggle,
  selectedGroup,
  onSelect,
  groupSearch,
  onSearchChange,
  filteredGroups,
  themeColor,
  translations,
}) => {
  return (
    <>
      <TouchableOpacity
        style={[styles.selectBox, isOpen && styles.selectBoxActive]}
        onPress={onToggle}
      >
        <View style={styles.selectBoxInner}>
          <Text style={styles.selectText}>
            {selectedGroup === "Raw Material"
              ? translations.rawMaterial
              : selectedGroup || "Select Group..."}
          </Text>
          <Ionicons
            name={isOpen ? "chevron-up" : "chevron-down"}
            size={18}
            color="#6B7280"
          />
        </View>
      </TouchableOpacity>

      {isOpen && (
        <View style={styles.inlinePickerContainer}>
          <View style={styles.inlineSearchBox}>
            <Ionicons name="search-outline" size={16} color="#9CA3AF" />
            <TextInput
              style={styles.inlineSearchInput}
              placeholder="Search group..."
              placeholderTextColor="#9CA3AF"
              value={groupSearch}
              onChangeText={onSearchChange}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {groupSearch.length > 0 && (
              <TouchableOpacity onPress={() => onSearchChange("")}>
                <Ionicons name="close-circle" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            style={styles.pickerScrollView}
            showsVerticalScrollIndicator={true}
          >
            {filteredGroups.length === 0 ? (
              <Text style={styles.noResultsText}>No groups found</Text>
            ) : (
              filteredGroups.map((item, index) => (
                <TouchableOpacity
                  key={item.name}
                  style={[
                    styles.inlinePickerItem,
                    index === filteredGroups.length - 1 &&
                      styles.borderBottomZero,
                    selectedGroup === item.name &&
                      styles.inlinePickerItemSelected,
                  ]}
                  onPress={() => onSelect(item.name)}
                >
                  <Text
                    style={[
                      styles.inlinePickerItemText,
                      selectedGroup === item.name && {
                        color: themeColor,
                        fontWeight: "700",
                      },
                    ]}
                  >
                    {item.name === "Raw Material"
                      ? translations.rawMaterial
                      : item.name}
                  </Text>
                  {selectedGroup === item.name && (
                    <Ionicons name="checkmark" size={18} color={themeColor} />
                  )}
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  selectBox: {
    height: 58,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 18,
    paddingHorizontal: 18,
    justifyContent: "center",
    marginHorizontal: 24,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  selectBoxActive: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomColor: "transparent",
    marginBottom: 0,
  },
  selectBoxInner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectText: { fontSize: 16, color: "#111827" },
  inlinePickerContainer: {
    marginHorizontal: 24,
    marginBottom: 10,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: "#D1D5DB",
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  inlineSearchBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    backgroundColor: "#F9FAFB",
  },
  inlineSearchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: "#111827" },
  pickerScrollView: { maxHeight: 200 },
  noResultsText: {
    textAlign: "center",
    color: "#9CA3AF",
    fontSize: 14,
    paddingVertical: 20,
  },
  inlinePickerItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  borderBottomZero: { borderBottomWidth: 0 },
  inlinePickerItemSelected: { backgroundColor: "#F9FAFB" },
  inlinePickerItemText: { fontSize: 15, fontWeight: "500", color: "#111827" },
});
