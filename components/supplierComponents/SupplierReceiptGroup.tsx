import { PurchaseReceiptType } from "@/types/purchaseReceiptType";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type GroupedSupplierData = {
  supplier_name: string;
  avatar_short: string;
  receipts_count: number;
  receipts: PurchaseReceiptType[];
};

interface SupplierReceiptGroupProps {
  item: GroupedSupplierData;
  themeColor: string;
  translations: any;
  dateFormat: string;
  numberFormat: string;
  applyFrappeDateFormat: (
    dateStr: string | undefined,
    format: string,
  ) => string;
  applyFrappeNumberFormat: (value: number, format: string) => string;
  onSelectReceipt: (receipt: PurchaseReceiptType) => void;
}

export const SupplierReceiptGroup: React.FC<SupplierReceiptGroupProps> = ({
  item,
  themeColor,
  translations: t,
  dateFormat,
  numberFormat,
  applyFrappeDateFormat,
  applyFrappeNumberFormat,
  onSelectReceipt,
}) => {
  return (
    <View style={styles.supplierBlock}>
      {/* SUPPLIER HEADER */}
      <View style={styles.topRow}>
        <View style={styles.userSection}>
          <View style={[styles.avatar, { backgroundColor: `${themeColor}15` }]}>
            <Text style={[styles.avatarText, { color: themeColor }]}>
              {item.avatar_short}
            </Text>
          </View>
          <Text style={styles.userName}>{item.supplier_name}</Text>
        </View>

        <View style={styles.rightTop}>
          <Text style={styles.countText}>
            {t.countWithUnit.replace(
              "{{count}}",
              item.receipts_count.toString(),
            )}
          </Text>
          <TouchableOpacity
            style={[
              styles.addButton,
              {
                borderColor: `${themeColor}60`,
                backgroundColor: `${themeColor}08`,
              },
            ]}
            onPress={() =>
              router.push({
                pathname: "/add_purchase_receipt",
                params: { supplierName: item.supplier_name },
              })
            }
          >
            <Ionicons name="add" size={16} color={themeColor} />
            <Text style={[styles.addButtonText, { color: themeColor }]}>
              {t.add}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* INVOICE CARDS */}
      {item.receipts.map((receipt) => (
        <TouchableOpacity
          key={receipt.name}
          style={styles.card}
          onPress={() => onSelectReceipt(receipt)}
        >
          <View style={styles.cardTop}>
            <Text style={styles.invoiceText}>{receipt.name}</Text>
            <Text style={styles.dateText}>
              {applyFrappeDateFormat(receipt.posting_date, dateFormat)}
            </Text>
          </View>
          <View style={styles.cardBottom}>
            <View
              style={[
                styles.priceBadge,
                { backgroundColor: `${themeColor}15` },
              ]}
            >
              <Text style={[styles.priceBadgeText, { color: themeColor }]}>
                {t.currencyFormat.replace(
                  "{{amount}}",
                  applyFrappeNumberFormat(
                    Number(receipt.grand_total),
                    numberFormat,
                  ),
                )}
              </Text>
            </View>
            <Text style={styles.itemQuantityText}>
              {t.totalItemsCount.replace(
                "{{count}}",
                receipt.total_qty?.toString() || "0",
              )}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  supplierBlock: { marginTop: 20 },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  userSection: { flexDirection: "row", alignItems: "center" },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: { fontSize: 14, fontWeight: "800" },
  userName: { fontSize: 16, fontWeight: "700", color: "#374151" },
  rightTop: { flexDirection: "row", alignItems: "center" },
  countText: { fontSize: 14, color: "#9CA3AF", marginRight: 12 },
  addButton: {
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  addButtonText: { fontSize: 13, fontWeight: "700", marginLeft: 2 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 10,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  invoiceText: { fontSize: 16, fontWeight: "800", color: "#111827", flex: 1 },
  dateText: { fontSize: 13, color: "#9CA3AF", marginLeft: 10 },
  cardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  priceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  priceBadgeText: { fontSize: 13, fontWeight: "700" },
  itemQuantityText: { fontSize: 13, color: "#6B7280" },
});
