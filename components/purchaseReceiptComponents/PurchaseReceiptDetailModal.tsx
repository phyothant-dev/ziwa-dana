import { PurchaseReceiptType } from "@/types/purchaseReceiptType";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface PurchaseReceiptDetailModalProps {
  isVisible: boolean;
  onClose: () => void;
  selectedReceipt: any;
  receiptDetails: PurchaseReceiptType | null;
  loadingDetails: boolean;
  themeColor: string;
  translations: any;
  dateFormat: string;
  numberFormat: string;
  applyFrappeDateFormat: (
    dateStr: string | undefined,
    format: string,
  ) => string;
  applyFrappeNumberFormat: (value: number, format: string) => string;
}

export const PurchaseReceiptDetailModal: React.FC<
  PurchaseReceiptDetailModalProps
> = ({
  isVisible,
  onClose,
  selectedReceipt,
  receiptDetails,
  loadingDetails,
  themeColor,
  translations: t,
  dateFormat,
  numberFormat,
  applyFrappeDateFormat,
  applyFrappeNumberFormat,
}) => {
  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.handle} />

          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {selectedReceipt?.name || t.receiptDetailTitle}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* META ROWS */}
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>{t.dateLabel}</Text>
              <Text style={styles.metaValue}>
                {applyFrappeDateFormat(
                  selectedReceipt?.posting_date,
                  dateFormat,
                )}
              </Text>
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>{t.supplierLabel}</Text>
              <Text style={styles.metaValue}>
                {selectedReceipt?.supplier_name || selectedReceipt?.supplier}
              </Text>
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>{t.warehouseLabel}</Text>
              <Text style={styles.metaValue}>
                {receiptDetails?.set_warehouse ||
                  receiptDetails?.items?.[0]?.warehouse ||
                  "-"}
              </Text>
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>{t.grandTotalLabel}</Text>
              <Text
                style={[
                  styles.metaValue,
                  { color: themeColor, fontWeight: "700" },
                ]}
              >
                {applyFrappeNumberFormat(
                  Number(selectedReceipt?.grand_total),
                  numberFormat,
                )}{" "}
                MMK
              </Text>
            </View>

            {/* ITEMS SECTION */}
            <Text style={styles.sectionTitle}>{t.itemsSectionTitle}</Text>
            <View style={styles.itemsTableHeader}>
              <Text style={styles.tableHeaderTexts}>{t.itemsSectionTitle}</Text>
              <Text style={styles.tableHeaderTexts}>{t.qtyLabel}</Text>
            </View>

            {loadingDetails ? (
              <View style={styles.centerPadding}>
                <ActivityIndicator size="small" color={themeColor} />
                <Text style={styles.loadingText}>{t.loadingItemsText}</Text>
              </View>
            ) : receiptDetails?.items && receiptDetails.items.length > 0 ? (
              <>
                {receiptDetails.items.map((item: any, index: number) => (
                  <View key={index} style={styles.itemRow}>
                    {/* LEFT: name, code, qty x rate expression */}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemNameText}>
                        {item.item_name || item.item_code}
                      </Text>
                      <Text style={styles.itemCodeText}>{item.item_code}</Text>
                      <Text style={styles.itemExpressionText}>
                        {item.qty} {item.uom || "Nos"}
                        {"  ×  "}
                        {applyFrappeNumberFormat(
                          Number(item.rate || 0),
                          numberFormat,
                        )}
                        {"  =  "}
                        <Text style={styles.itemExpressionTotal}>
                          {applyFrappeNumberFormat(
                            Number(item.amount || 0),
                            numberFormat,
                          )}{" "}
                          MMK
                        </Text>
                      </Text>
                    </View>

                    {/* RIGHT: qty badge + line total */}
                    <View style={styles.itemRightCol}>
                      <View
                        style={[
                          styles.qtyBadge,
                          { backgroundColor: `${themeColor}12` },
                        ]}
                      >
                        <Text
                          style={[styles.qtyBadgeText, { color: themeColor }]}
                        >
                          {item.qty} {item.uom || "Nos"}
                        </Text>
                      </View>
                      <Text style={styles.itemAmountText}>
                        {applyFrappeNumberFormat(
                          Number(item.amount || 0),
                          numberFormat,
                        )}
                      </Text>
                      <Text style={styles.itemAmountCurrency}>MMK</Text>
                    </View>
                  </View>
                ))}

                {/* GRAND TOTAL FOOTER ROW */}
                <View style={styles.totalFooterRow}>
                  <Text style={styles.totalFooterLabel}>
                    {t.grandTotalLabel}
                  </Text>
                  <Text
                    style={[styles.totalFooterValue, { color: themeColor }]}
                  >
                    {applyFrappeNumberFormat(
                      receiptDetails.items.reduce(
                        (sum, i: any) => sum + Number(i.amount || 0),
                        0,
                      ),
                      numberFormat,
                    )}{" "}
                    MMK
                  </Text>
                </View>
              </>
            ) : (
              <View style={styles.centerPadding}>
                <Text style={styles.noItemsText}>{t.noItemsText}</Text>
              </View>
            )}

            <View style={{ height: 60 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    height: "75%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
  },
  handle: {
    width: 50,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#D1D5DB",
    alignSelf: "center",
    marginBottom: 14,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#111827" },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  metaLabel: { fontSize: 15, color: "#6B7280" },
  metaValue: { fontSize: 15, color: "#111827", fontWeight: "500" },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  itemsTableHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  tableHeaderTexts: { fontSize: 13, fontWeight: "600", color: "#9CA3AF" },
  centerPadding: { paddingVertical: 20, alignItems: "center" },
  loadingText: { color: "#6B7280", fontSize: 13, marginTop: 8 },
  noItemsText: { color: "#9CA3AF", fontSize: 14 },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  itemNameText: { fontSize: 15, fontWeight: "600", color: "#111827" },
  itemCodeText: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },
  itemExpressionText: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 5,
    lineHeight: 18,
  },
  itemExpressionTotal: { fontWeight: "700", color: "#111827" },
  itemRightCol: { alignItems: "flex-end", marginLeft: 12, minWidth: 80 },
  qtyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 6,
  },
  qtyBadgeText: { fontSize: 12, fontWeight: "700" },
  itemAmountText: { fontSize: 15, fontWeight: "800", color: "#111827" },
  itemAmountCurrency: { fontSize: 10, color: "#9CA3AF", marginTop: 1 },
  totalFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginTop: 4,
    borderTopWidth: 2,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  totalFooterLabel: { fontSize: 15, fontWeight: "700", color: "#374151" },
  totalFooterValue: { fontSize: 17, fontWeight: "800" },
});
