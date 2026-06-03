import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Supplier = {
  name?: string;
  supplier_name: string;
  supplier_group: string;
  supplier_type?: string;
  default_currency?: string;
  mobile_no?: string;
  image?: string;
};

interface SupplierCardProps {
  item: Supplier;
  themeColor: string;
  baseUrl: string;
  rawMaterialLabel: string;
  onPress: (item: Supplier) => void;
  onPhoneCall: (phone: string) => void;
}

const { width } = Dimensions.get("window");
const isSmallDevice = width < 380;

export const SupplierCard: React.FC<SupplierCardProps> = ({
  item,
  themeColor,
  baseUrl,
  rawMaterialLabel,
  onPress,
  onPhoneCall,
}) => {
  const supplierImageUrl = item.image
    ? item.image.startsWith("http")
      ? item.image
      : `${baseUrl}${item.image}`
    : null;

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(item)}>
      <View style={styles.leftSection}>
        <View
          style={[
            styles.avatar,
            { backgroundColor: `${themeColor}15`, overflow: "hidden" },
          ]}
        >
          {supplierImageUrl ? (
            <Image
              source={{ uri: supplierImageUrl }}
              style={{ width: "100%", height: "100%", resizeMode: "cover" }}
            />
          ) : (
            <Text style={[styles.avatarText, { color: themeColor }]}>
              {item.supplier_name?.substring(0, 2).toUpperCase()}
            </Text>
          )}
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.nameText}>{item.supplier_name}</Text>
          <View style={styles.badgeRow}>
            <View style={styles.grayBadge}>
              <Text style={styles.grayBadgeText}>
                {item.supplier_group === "Raw Material"
                  ? rawMaterialLabel
                  : item.supplier_group}
              </Text>
            </View>
            <View style={styles.blueBadge}>
              <Text style={styles.blueBadgeText}>
                {item.default_currency || "MMK"}
              </Text>
            </View>
          </View>

          {item.mobile_no ? (
            <TouchableOpacity
              style={styles.phoneRow}
              onPress={() => onPhoneCall(item.mobile_no!)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name="call-outline"
                size={14}
                color="#6B7280"
                style={{ marginRight: 4 }}
              />
              <Text style={styles.phoneText}>{item.mobile_no}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ECECEC",
  },
  leftSection: { flexDirection: "row", alignItems: "center", flex: 1 },
  avatar: {
    width: isSmallDevice ? 52 : 58,
    height: isSmallDevice ? 52 : 58,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  avatarText: { fontSize: isSmallDevice ? 20 : 22, fontWeight: "700" },
  nameText: {
    fontSize: isSmallDevice ? 17 : 19,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: 4,
  },
  grayBadge: {
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
  },
  grayBadgeText: { color: "#6B7280", fontSize: 11, fontWeight: "700" },
  blueBadge: {
    backgroundColor: "#EEF2FF",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  blueBadgeText: { color: "#2563EB", fontSize: 11, fontWeight: "700" },
  phoneRow: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  phoneText: { color: "#6B7280", fontSize: 14, fontWeight: "500" },
});
