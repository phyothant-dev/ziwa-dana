import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ColorPicker from "react-native-wheel-color-picker";

interface CustomColorPickerModalProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  tempColor: string;
  setTempColor: (color: string) => void;
  pendingLanguage: string;
}

export const CustomColorPickerModal: React.FC<CustomColorPickerModalProps> = ({
  isVisible,
  onClose,
  onConfirm,
  tempColor,
  setTempColor,
  pendingLanguage,
}) => {
  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* HEADER */}
          <View style={styles.modalHeader}>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={onClose}>
              <Ionicons name="close" size={22} color="#6B7280" />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>
              {pendingLanguage === "mm" ? "အရောင်ရွေးချယ်ပါ" : "Pick a Color"}
            </Text>

            <TouchableOpacity
              style={[styles.modalConfirmBtn, { backgroundColor: tempColor }]}
              onPress={onConfirm}
            >
              <Ionicons name="checkmark" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* SWATCH ROW */}
          <View style={styles.modalSwatchRow}>
            <View
              style={[styles.modalSwatch, { backgroundColor: tempColor }]}
            />
            <Text style={styles.modalHexText}>{tempColor.toUpperCase()}</Text>
          </View>

          {/* COLOR WHEEL */}
          <View style={styles.pickerWrap}>
            <ColorPicker
              color={tempColor}
              onColorChange={setTempColor}
              thumbSize={30}
              sliderSize={28}
              noSnap
              row={false}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 48,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  modalCancelBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  modalConfirmBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  modalSwatchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 14,
  },
  modalSwatch: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: "#F3F4F6",
  },
  modalHexText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1F2937",
    letterSpacing: 1,
  },
  pickerWrap: {
    height: 300,
  },
});
