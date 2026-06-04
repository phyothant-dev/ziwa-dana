import { SupplierType } from "@/types/supplierType";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import {
    Dimensions,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface SupplierDetailModalProps {
  supplier: SupplierType | null;
  onClose: () => void;
  baseUrl: string;
  themeColor: string;
  onPhoneCall: (phone: string) => void;
  translations: {
    supplierInfoTitle?: string;
    supplierType?: string;
    currency?: string;
    currencyMMK?: string;
    currencyUSD?: string;
    rawMaterial?: string;
    noPhoneNumber?: string;
  };
}

const { width } = Dimensions.get("window");
const isSmallDevice = width < 380;

export const SupplierDetailModal: React.FC<SupplierDetailModalProps> = ({
  supplier,
  onClose,
  baseUrl,
  themeColor,
  onPhoneCall,
  translations: t,
}) => {
  return (
    <Modal
      visible={supplier !== null}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { height: "60%" }]}>
          <View style={styles.handle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t.supplierInfoTitle}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={30} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Avatar + name */}
            <View style={{ alignItems: "center", marginBottom: 20 }}>
              <View
                style={[
                  styles.avatar,
                  {
                    backgroundColor: `${themeColor}15`,
                    overflow: "hidden",
                  },
                ]}
              >
                {supplier?.image ? (
                  <Image
                    source={{
                      uri: supplier.image.startsWith("http")
                        ? supplier.image
                        : `${baseUrl}${supplier.image}`,
                    }}
                    style={{
                      width: "100%",
                      height: "100%",
                      resizeMode: "cover",
                    }}
                  />
                ) : (
                  <Text style={[styles.avatarText, { color: themeColor }]}>
                    {supplier?.supplier_name?.substring(0, 2).toUpperCase()}
                  </Text>
                )}
              </View>
              <Text style={styles.nameText}>{supplier?.supplier_name}</Text>
              <TouchableOpacity
                disabled={!supplier?.mobile_no}
                onPress={() =>
                  supplier?.mobile_no && onPhoneCall(supplier.mobile_no)
                }
              >
                <Text style={{ color: "#6B7280", fontSize: 16 }}>
                  {supplier?.mobile_no || t.noPhoneNumber}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t.supplierType}</Text>
              <Text style={styles.detailValue}>
                {supplier?.supplier_group === "Raw Material"
                  ? t.rawMaterial
                  : supplier?.supplier_group}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t.currency}</Text>
              <Text style={styles.detailValue}>
                {supplier?.default_currency === "USD"
                  ? t.currencyUSD
                  : t.currencyMMK}
              </Text>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
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
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarText: { fontSize: 36, fontWeight: "700" },
  nameText: {
    fontSize: isSmallDevice ? 20 : 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
    marginTop: 12,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    marginHorizontal: 24,
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    marginHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  detailLabel: { fontSize: 16, color: "#6B7280", fontWeight: "500" },
  detailValue: { fontSize: 16, color: "#111827", fontWeight: "600" },
});
