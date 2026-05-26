import {
    getPurchaseReceiptDetails,
    getPurchaseReceipts,
    PurchaseReceiptType,
} from "@/services/frappeService";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Modal,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const isSmallDevice = width < 380;

type GroupedSupplierData = {
  supplier_name: string;
  avatar_short: string;
  receipts_count: number;
  receipts: PurchaseReceiptType[];
};

export default function MaterialPreOrderScreen() {
  const [search, setSearch] = useState("");
  const [receipts, setReceipts] = useState<PurchaseReceiptType[]>([]);
  const [loading, setLoading] = useState(false);

  // 1. Add details states near your other useState variables
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [receiptDetails, setReceiptDetails] =
    useState<PurchaseReceiptType | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // 2. Add an explicit selection handler
  const handleSelectReceipt = async (receiptSummary: any) => {
    setSelectedReceipt(receiptSummary); // Open modal with summary info immediately
    setReceiptDetails(null); // Clear old items history data

    try {
      setLoadingDetails(true);
      const res = await getPurchaseReceiptDetails(receiptSummary.name);
      if (res.success && res.data) {
        setReceiptDetails(res.data); // Fill details state including items!
      } else {
        console.log("Failed loading child items:", res.error);
      }
    } catch (err) {
      console.log("Details loading error:", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    loadPurchaseReceipts();
  }, []);

  const loadPurchaseReceipts = async () => {
    try {
      setLoading(true);
      const res = await getPurchaseReceipts();
      if (res.success && res.data) {
        setReceipts(res.data);
      }
    } catch (err) {
      console.log("Failed to fetch receipts:", err);
    } finally {
      setLoading(false);
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
      const sName = receipt.supplier_name || "Unknown Supplier";
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
  }, [search, receipts]);

  const renderSupplierGroup = ({ item }: { item: GroupedSupplierData }) => {
    return (
      <View style={styles.supplierBlock}>
        {/* SUPPLIER HEADER */}
        <View style={styles.topRow}>
          <View style={styles.userSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.avatar_short}</Text>
            </View>
            <Text style={styles.userName}>{item.supplier_name}</Text>
          </View>

          <View style={styles.rightTop}>
            <Text style={styles.countText}>{item.receipts_count} ခု</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() =>
                router.push({
                  pathname: "/add_purchase_receipt",
                  params: {
                    supplierName: item.supplier_name,
                    // If you have a supplier ID/code separate from the display name, pass it here:
                    // supplierId: item.receipts[0]?.supplier
                  },
                })
              }
            >
              <Ionicons name="add" size={16} color="#18A06A" />
              <Text style={styles.addButtonText}>ထည့်မည်</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* INVOICE CARDS */}
        {item.receipts.map((receipt) => (
          <TouchableOpacity
            key={receipt.name}
            style={styles.card}
            onPress={() => handleSelectReceipt(receipt)}
          >
            <View style={styles.cardTop}>
              <Text style={styles.invoiceText}>{receipt.name}</Text>
              <Text style={styles.dateText}>{receipt.posting_date}</Text>
            </View>

            <View style={styles.cardBottom}>
              <View style={styles.priceBadge}>
                <Text style={styles.priceBadgeText}>
                  ငွေ {Number(receipt.grand_total).toLocaleString()} MMK
                </Text>
              </View>
              <Text style={styles.itemQuantityText}>
                ပစ္စည်းစုစုပေါင်း: {receipt.total_qty} ခု
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {loading ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color="#18A06A" />
        </View>
      ) : (
        <FlatList
          data={groupedData}
          keyExtractor={(item) => item.supplier_name}
          renderItem={renderSupplierGroup}
          showsVerticalScrollIndicator={false}
          onRefresh={loadPurchaseReceipts}
          refreshing={loading}
          ListHeaderComponent={
            <>
              {/* HEADER */}
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                  </TouchableOpacity>
                  <Text style={styles.headerTitle}>📦 ကုန်လက်ခံလွှာစာရင်း</Text>
                </View>

                <TouchableOpacity
                  style={styles.topButton}
                  onPress={() => router.push("/add_purchase_receipt")}
                >
                  <Ionicons name="add" size={18} color="#fff" />
                  <Text style={styles.topButtonText}>ထည့်မည်</Text>
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
                      placeholder="ပြေစာအမှတ် / ကုန်သည် ရှာပါ..."
                      placeholderTextColor="#9CA3AF"
                      style={styles.searchInput}
                    />
                  </View>
                </View>

                <View style={styles.countContainer}>
                  <Text style={styles.totalText}>
                    ကုန်သည် စုစုပေါင်း: {groupedData.length} ဦး
                  </Text>
                </View>
              </View>
            </>
          }
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 140,
          }}
        />
      )}

      {/* DETAIL MODAL (MATCHES SCREENSHOT 3) */}
      <Modal
        visible={selectedReceipt !== null}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setSelectedReceipt(null);
          setReceiptDetails(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* HANDLE BAR */}
            <View style={styles.handle} />

            {/* MODAL HEADER */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedReceipt?.name}</Text>
              <TouchableOpacity
                onPress={() => {
                  setSelectedReceipt(null);
                  setReceiptDetails(null);
                }}
              >
                <Ionicons name="close" size={28} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* GENERAL META INFO TABLE */}
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>ရက်စွဲ</Text>
                <Text style={styles.metaValue}>
                  {selectedReceipt?.posting_date}
                </Text>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>ကုန်သည်</Text>
                <Text style={styles.metaValue}>
                  {selectedReceipt?.supplier_name || selectedReceipt?.supplier}
                </Text>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>စုစုပေါင်းငွေ</Text>
                <Text
                  style={[
                    styles.metaValue,
                    { color: "#047857", fontWeight: "700" },
                  ]}
                >
                  {Number(selectedReceipt?.grand_total).toLocaleString()} MMK
                </Text>
              </View>

              {/* NESTED ITEMS SECTION */}
              <Text style={styles.sectionTitle}>ကုန်ပစ္စည်းများ</Text>

              {loadingDetails ? (
                /* Loading indicator displayed while fetching nested items array */
                <View style={{ paddingVertical: 20, alignItems: "center" }}>
                  <ActivityIndicator size="small" color="#18A06A" />
                  <Text
                    style={{ color: "#6B7280", fontSize: 13, marginTop: 8 }}
                  >
                    ကုန်ပစ္စည်းများ ဆွဲယူနေပါသည်...
                  </Text>
                </View>
              ) : receiptDetails?.items && receiptDetails.items.length > 0 ? (
                /* Real child item rows mapped cleanly */
                receiptDetails.items.map((item: any, index: number) => (
                  <View key={index} style={styles.itemRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemNameText}>
                        {item.item_name || item.item_code}
                      </Text>
                      <Text style={styles.itemCodeText}>{item.item_code}</Text>
                    </View>
                    <Text style={styles.itemQtyText}>
                      {item.qty} {item.uom || "Nos"}
                    </Text>
                  </View>
                ))
              ) : (
                /* Catch fallback if no rows are present */
                <View style={{ paddingVertical: 20, alignItems: "center" }}>
                  <Text style={{ color: "#9CA3AF", fontSize: 14 }}>
                    ကုန်ပစ္စည်းများ မရှိပါ။
                  </Text>
                </View>
              )}
              <View style={{ height: 60 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* FLOAT BUTTON */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => router.push("/add_purchase_receipt")}
      >
        <Ionicons name="add" size={24} color="#fff" />
        <Text style={styles.floatingButtonText}>ကုန်လက်ခံထည့်မည်</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  header: {
    backgroundColor: "#18A06A",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: -16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
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
  stickySection: {
    backgroundColor: "#F3F4F6",
    marginHorizontal: -16,
  },
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
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: "#111827",
  },
  countContainer: {
    backgroundColor: "#F3F4F6",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  totalText: {
    fontSize: 14,
    color: "#6B7280",
  },
  supplierBlock: {
    marginTop: 20,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  userSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#E8F7F0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#18A06A",
  },
  userName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#374151",
  },
  rightTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  countText: {
    fontSize: 14,
    color: "#9CA3AF",
    marginRight: 12,
  },
  addButton: {
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#86EFAC",
    paddingHorizontal: 14,
    backgroundColor: "#ECFDF5",
    flexDirection: "row",
    alignItems: "center",
  },
  addButtonText: {
    color: "#18A06A",
    fontSize: 13,
    fontWeight: "700",
    marginLeft: 2,
  },
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
  invoiceText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
    flex: 1,
  },
  dateText: {
    fontSize: 13,
    color: "#9CA3AF",
    marginLeft: 10,
  },
  cardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  priceBadge: {
    backgroundColor: "#E8F7F0",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  priceBadgeText: {
    color: "#047857",
    fontSize: 13,
    fontWeight: "700",
  },
  itemQuantityText: {
    fontSize: 13,
    color: "#6B7280",
  },
  floatingButton: {
    position: "absolute",
    right: 18,
    bottom: 24,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#18A06A",
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

  /* MODAL VIEW STYLES */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    height: "70%",
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
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  metaLabel: {
    fontSize: 15,
    color: "#6B7280",
  },
  metaValue: {
    fontSize: 15,
    color: "#111827",
    fontWeight: "500",
  },
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
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  itemNameText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  itemCodeText: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
  },
  itemQtyText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#059669",
  },
});
