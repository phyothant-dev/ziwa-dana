import { PurchaseReceiptDetailModal } from "@/components/PurchaseReceiptDetailModal";
import ScreenWrapper from "@/components/ScreenWrapper";
import { SupplierReceiptGroup } from "@/components/SupplierReceiptGroup";
import { translations } from "@/locales/index";
import {
    getPurchaseReceiptDetails,
    getPurchaseReceipts,
} from "@/services/purchaseReceiptService";
import { getSystemSettings } from "@/services/systemService";
import { useSettingsStore } from "@/stores/settingsStore";
import { PurchaseReceiptType } from "@/types/purchaseReceiptType";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const { width } = Dimensions.get("window");
const isSmallDevice = width < 380;

const applyFrappeDateFormat = (
  dateStr: string | undefined,
  format: string,
): string => {
  if (!dateStr) return "-";
  const date = new Date(dateStr + "T00:00:00");
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = String(date.getFullYear());
  return format.replace("dd", dd).replace("mm", mm).replace("yyyy", yyyy);
};

const applyFrappeNumberFormat = (value: number, format: string): string => {
  const lastComma = format.lastIndexOf(",");
  const lastDot = format.lastIndexOf(".");
  const decimalSep = lastDot > lastComma ? "." : ",";
  const thousandSep = decimalSep === "." ? "," : ".";
  const decimalPart =
    decimalSep === "." ? format.split(".")[1] : format.split(",")[1];
  const decimalPlaces = decimalPart
    ? decimalPart.replace(/[^#0]/g, "").length
    : 0;
  const fixed = value.toFixed(decimalPlaces);
  const [intPart, fracPart] = fixed.split(".");
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandSep);
  return fracPart !== undefined && decimalPlaces > 0
    ? `${formattedInt}${decimalSep}${fracPart}`
    : formattedInt;
};

type GroupedSupplierData = {
  supplier_name: string;
  avatar_short: string;
  receipts_count: number;
  receipts: PurchaseReceiptType[];
};

export default function MaterialPreOrderScreen() {
  const { language, themeColor } = useSettingsStore();
  const t = translations[language] || translations["mm"];

  const [search, setSearch] = useState("");
  const [receipts, setReceipts] = useState<PurchaseReceiptType[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateFormat, setDateFormat] = useState("dd-mm-yyyy");
  const [numberFormat, setNumberFormat] = useState("#,###.##");
  const { refresh } = useLocalSearchParams<{ refresh?: string }>();

  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [receiptDetails, setReceiptDetails] =
    useState<PurchaseReceiptType | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const loadPurchaseReceipts = async () => {
    try {
      setLoading(true);
      const [res, settings] = await Promise.all([
        getPurchaseReceipts(),
        getSystemSettings(),
      ]);
      if (res.success && res.data) setReceipts(res.data);
      setDateFormat(settings.dateFormat);
      setNumberFormat(settings.numberFormat);
    } catch (err) {
      console.log("Failed to fetch receipts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (refresh) {
      loadPurchaseReceipts();
    }
  }, [refresh]);

  useEffect(() => {
    loadPurchaseReceipts();
  }, []);

  const handleSelectReceipt = async (receiptSummary: any) => {
    setSelectedReceipt(receiptSummary);
    setReceiptDetails(null);
    try {
      setLoadingDetails(true);
      const res = await getPurchaseReceiptDetails(receiptSummary.name);
      if (res.success && res.data) {
        setReceiptDetails(res.data);
      } else {
        console.log("Failed loading child items:", res.error);
      }
    } catch (err) {
      console.log("Details loading error:", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const groupedData = useMemo(() => {
    const filtered = receipts.filter(
      (item) =>
        item.supplier_name?.toLowerCase().includes(search.toLowerCase()) ||
        item.name?.toLowerCase().includes(search.toLowerCase()),
    );
    const groups: { [key: string]: GroupedSupplierData } = {};
    filtered.forEach((receipt) => {
      const sName = receipt.supplier_name || t.unknownSupplier;
      if (!groups[sName]) {
        groups[sName] = {
          supplier_name: sName,
          avatar_short: sName.substring(0, 2).toUpperCase(),
          receipts_count: 0,
          receipts: [],
        };
      }
      groups[sName].receipts.push(receipt);
      groups[sName].receipts_count += 1;
    });
    return Object.values(groups);
  }, [search, receipts, t.unknownSupplier]);

  return (
    <ScreenWrapper>
      <StatusBar barStyle="light-content" />

      {loading && receipts.length === 0 ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color={themeColor} />
        </View>
      ) : (
        <FlatList
          data={groupedData}
          keyExtractor={(item) => item.supplier_name}
          renderItem={({ item }) => (
            <SupplierReceiptGroup
              item={item}
              themeColor={themeColor}
              translations={t}
              dateFormat={dateFormat}
              numberFormat={numberFormat}
              applyFrappeDateFormat={applyFrappeDateFormat}
              applyFrappeNumberFormat={applyFrappeNumberFormat}
              onSelectReceipt={handleSelectReceipt}
            />
          )}
          showsVerticalScrollIndicator={false}
          onRefresh={loadPurchaseReceipts}
          refreshing={loading}
          ListHeaderComponent={
            <>
              {/* HEADER */}
              <View style={[styles.header, { backgroundColor: themeColor }]}>
                <View style={styles.headerLeft}>
                  <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                  </TouchableOpacity>
                  <Text style={styles.headerTitle}>
                    {t.purchaseReceiptList}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.topButton}
                  onPress={() => router.push("/add_purchase_receipt")}
                >
                  <Ionicons name="add" size={18} color="#fff" />
                  <Text style={styles.topButtonText}>{t.add}</Text>
                </TouchableOpacity>
              </View>

              {/* STICKY SECTION */}
              <View style={styles.stickySection}>
                <View style={styles.searchWrapper}>
                  <View style={styles.searchBox}>
                    <Ionicons name="search-outline" size={22} color="#9CA3AF" />
                    <TextInput
                      value={search}
                      onChangeText={setSearch}
                      placeholder={t.receiptSearchPlaceholder}
                      placeholderTextColor="#9CA3AF"
                      style={styles.searchInput}
                    />
                  </View>
                </View>
                <View style={styles.countContainer}>
                  <Text style={styles.totalText}>
                    {t.totalReceipts.replace(
                      "{{count}}",
                      receipts.length.toString(),
                    )}
                  </Text>
                </View>
              </View>
            </>
          }
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 140 }}
        />
      )}

      <PurchaseReceiptDetailModal
        isVisible={selectedReceipt !== null}
        onClose={() => {
          setSelectedReceipt(null);
          setReceiptDetails(null);
        }}
        selectedReceipt={selectedReceipt}
        receiptDetails={receiptDetails}
        loadingDetails={loadingDetails}
        themeColor={themeColor}
        translations={t}
        dateFormat={dateFormat}
        numberFormat={numberFormat}
        applyFrappeDateFormat={applyFrappeDateFormat}
        applyFrappeNumberFormat={applyFrappeNumberFormat}
      />

      {/* FLOAT BUTTON */}
      <TouchableOpacity
        style={[styles.floatingButton, { backgroundColor: themeColor }]}
        onPress={() => router.push("/add_purchase_receipt")}
      >
        <Ionicons name="add" size={24} color="#fff" />
        <Text style={styles.floatingButtonText}>{t.addPurchaseReceiptBtn}</Text>
      </TouchableOpacity>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },
  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: -16,
  },
  headerLeft: { flexDirection: "row", alignItems: "center" },
  headerTitle: {
    color: "#fff",
    fontSize: isSmallDevice ? 18 : 20,
    fontWeight: "700",
    marginLeft: 10,
  },
  topButton: {
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.20)",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  topButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 4,
  },
  stickySection: { backgroundColor: "#F3F4F6", marginHorizontal: -16 },
  searchWrapper: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  searchBox: {
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: "#111827" },
  countContainer: {
    backgroundColor: "#F3F4F6",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  totalText: { fontSize: 14, color: "#6B7280" },
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
  floatingButton: {
    position: "absolute",
    right: 18,
    bottom: 24,
    height: 56,
    borderRadius: 28,
    paddingHorizontal: 22,
    flexDirection: "row",
    alignItems: "center",
    elevation: 4,
  },
  floatingButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    marginLeft: 6,
  },
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
  itemExpressionTotal: {
    fontWeight: "700",
    color: "#111827",
  },
  itemRightCol: {
    alignItems: "flex-end",
    marginLeft: 12,
    minWidth: 80,
  },
  qtyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 6,
  },
  qtyBadgeText: { fontSize: 12, fontWeight: "700" },
  itemAmountText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
  },
  itemAmountCurrency: {
    fontSize: 10,
    color: "#9CA3AF",
    marginTop: 1,
  },

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
  totalFooterLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#374151",
  },
  totalFooterValue: {
    fontSize: 17,
    fontWeight: "800",
  },
});
