import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export interface PickerItem {
  id: string;
  mainText: string;
  subText?: string;
}

interface SearchablePickerModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  searchValue: string;
  onSearchChange: (text: string) => void;
  searchPlaceholder: string;
  items: PickerItem[];
  onSelect: (item: PickerItem) => void;
  height?: string;
}

export const SearchablePickerModal: React.FC<SearchablePickerModalProps> = ({
  visible,
  onClose,
  title,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  items,
  onSelect,
  height = "65%",
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={[styles.pickerModalContainer, { height: height as any }]}>
          <Text style={styles.modalHeaderTitle}>{title}</Text>
          <View style={styles.modalSearchBox}>
            <Ionicons name="search-outline" size={18} color="#9CA3AF" />
            <TextInput
              style={styles.modalSearchInput}
              placeholder={searchPlaceholder}
              value={searchValue}
              onChangeText={onSearchChange}
            />
          </View>
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.pickerItem}
                onPress={() => onSelect(item)}
              >
                <Text style={styles.pickerMainText}>{item.mainText}</Text>
                {item.subText ? (
                  <Text style={styles.pickerSubText}>{item.subText}</Text>
                ) : null}
              </TouchableOpacity>
            )}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  pickerModalContainer: {
    backgroundColor: "#fff",
    width: "90%",
    borderRadius: 16,
    padding: 16,
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  modalSearchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 38,
    marginBottom: 12,
  },
  modalSearchInput: { flex: 1, marginLeft: 6, fontSize: 14, color: "#111827" },
  pickerItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  pickerMainText: { fontSize: 14, fontWeight: "600", color: "#111827" },
  pickerSubText: { fontSize: 12, color: "#6B7280", marginTop: 2 },
});
