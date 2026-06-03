import { InlineGroupPicker } from "@/components/supplierComponents/InlineGroupPicker";
import { SupplierGroupType } from "@/types/supplierGroupType";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import React, { useMemo, useState } from "react";
import {
    Dimensions,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

interface AddSupplierModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: {
    supplierName: string;
    supplierGroup: string;
    mobileNo: string;
    currency: string;
    buyingPriceList: string;
  }) => Promise<void>;
  supplierGroups: SupplierGroupType[];
  themeColor: string;
  loading: boolean;
  translations: {
    addNewSupplierTitle?: string;
    supplierName?: string;
    supplierNamePlaceholder?: string;
    supplierType?: string;
    phoneNumber?: string;
    currency?: string;
    priceListType?: string;
    currencyMMK?: string;
    currencyUSD?: string;
    standardBuyingMMK?: string;
    standardBuyingUSD?: string;
    rawMaterial?: string;
    save?: string;
    saving?: string;
  };
  initialGroup?: string;
}

const { width } = Dimensions.get("window");
const isSmallDevice = width < 380;

export const AddSupplierModal: React.FC<AddSupplierModalProps> = ({
  visible,
  onClose,
  onSave,
  supplierGroups,
  themeColor,
  loading,
  translations: t,
  initialGroup = "",
}) => {
  const [supplierName, setSupplierName] = useState("");
  const [supplierGroup, setSupplierGroup] = useState(initialGroup);
  const [mobileNo, setMobileNo] = useState("");
  const [currency, setCurrency] = useState("MMK");
  const [buyingPriceList, setBuyingPriceList] = useState(
    "Standard Buying (MMK)",
  );
  const [showGroupPicker, setShowGroupPicker] = useState(false);
  const [groupSearch, setGroupSearch] = useState("");

  const filteredGroups = useMemo(() => {
    return supplierGroups.filter((g) =>
      g.name.toLowerCase().includes(groupSearch.toLowerCase()),
    );
  }, [groupSearch, supplierGroups]);

  const handleClose = () => {
    setSupplierName("");
    setMobileNo("");
    setGroupSearch("");
    setShowGroupPicker(false);
    setCurrency("MMK");
    setBuyingPriceList("Standard Buying (MMK)");
    setSupplierGroup(initialGroup);
    onClose();
  };

  const handleSave = async () => {
    await onSave({
      supplierName,
      supplierGroup,
      mobileNo,
      currency,
      buyingPriceList,
    });
    // Parent controls success — reset on next open via initialGroup
    setSupplierName("");
    setMobileNo("");
    setGroupSearch("");
    setShowGroupPicker(false);
    setCurrency("MMK");
    setBuyingPriceList("Standard Buying (MMK)");
    setSupplierGroup(initialGroup);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.handle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t.addNewSupplierTitle}</Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={30} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Supplier Name */}
            <Text style={styles.label}>
              {t.supplierName}
              <Text style={{ color: "red" }}> *</Text>
            </Text>
            <TextInput
              value={supplierName}
              onChangeText={setSupplierName}
              placeholder={t.supplierNamePlaceholder}
              placeholderTextColor="#9CA3AF"
              style={styles.input}
            />

            {/* Supplier Group */}
            <Text style={styles.label}>
              {t.supplierType}
              <Text style={{ color: "red" }}> *</Text>
            </Text>
            <InlineGroupPicker
              isOpen={showGroupPicker}
              onToggle={() => setShowGroupPicker((v) => !v)}
              selectedGroup={supplierGroup}
              onSelect={(name) => {
                setSupplierGroup(name);
                setShowGroupPicker(false);
              }}
              groupSearch={groupSearch}
              onSearchChange={setGroupSearch}
              filteredGroups={filteredGroups}
              themeColor={themeColor}
              translations={{ rawMaterial: t.rawMaterial }}
            />

            {/* Phone */}
            <Text style={styles.label}>{t.phoneNumber}</Text>
            <TextInput
              value={mobileNo}
              onChangeText={setMobileNo}
              placeholder="09..."
              placeholderTextColor="#9CA3AF"
              style={styles.input}
              keyboardType="phone-pad"
            />

            {/* Currency */}
            <Text style={styles.label}>{t.currency}</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={currency}
                onValueChange={(itemValue) => {
                  setCurrency(itemValue);
                  setBuyingPriceList(
                    itemValue === "MMK"
                      ? "Standard Buying (MMK)"
                      : "Standard Buying (USD)",
                  );
                }}
              >
                <Picker.Item label={t.currencyMMK} value="MMK" />
                <Picker.Item label={t.currencyUSD} value="USD" />
              </Picker>
            </View>

            {/* Price list (read-only) */}
            <Text style={styles.label}>{t.priceListType}</Text>
            <TouchableOpacity style={styles.selectBox} disabled>
              <Text style={styles.selectText}>
                {buyingPriceList === "Standard Buying (MMK)"
                  ? t.standardBuyingMMK
                  : t.standardBuyingUSD}
              </Text>
            </TouchableOpacity>

            <View style={{ height: 160 }} />
          </ScrollView>

          <View style={styles.bottomArea}>
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: themeColor }]}
              onPress={handleSave}
              disabled={loading}
            >
              <Ionicons name="checkmark" size={24} color="#fff" />
              <Text style={styles.saveButtonText}>
                {loading ? t.saving : t.save}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    height: "75%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 12,
  },
  handle: {
    width: 70,
    height: 6,
    borderRadius: 10,
    backgroundColor: "#D1D5DB",
    alignSelf: "center",
    marginBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: "700", color: "#111827", flex: 1 },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 10,
    marginHorizontal: 24,
    marginTop: 10,
  },
  input: {
    height: 58,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 18,
    paddingHorizontal: 18,
    fontSize: 16,
    color: "#111827",
    marginHorizontal: 24,
    marginBottom: 10,
  },
  selectBox: {
    height: 58,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 18,
    paddingHorizontal: 18,
    justifyContent: "center",
    marginHorizontal: 24,
    marginBottom: 10,
  },
  selectText: { fontSize: 16, color: "#111827" },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 18,
    marginHorizontal: 24,
    marginBottom: 10,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  bottomArea: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  saveButton: {
    height: 58,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 6,
  },
});
