import { createSupplier, getSuppliers } from "@/services/frappeService";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
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

type Supplier = {
  name?: string;
  supplier_name: string;
  supplier_group: string;
  supplier_type?: string;
  default_currency?: string;
  mobile_no?: string;
};

const { width } = Dimensions.get("window");
const isSmallDevice = width < 380;

export default function SupplierScreen() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierName, setSupplierName] = useState("");
  const [supplierGroup, setSupplierGroup] = useState("Raw Material");
  const [mobileNo, setMobileNo] = useState("");
  const [currency, setCurrency] = useState("MMK");
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null,
  );
  const [buyingPriceList, setBuyingPriceList] = useState(
    "Standard Buying (MMK)",
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    const res = await getSuppliers();
    if (res.success) {
      setSuppliers(res.data || []);
    }
  };

  const saveSupplier = async () => {
    if (!supplierName) return;
    try {
      setLoading(true);
      const res = await createSupplier({
        supplier_name: supplierName,
        supplier_group: supplierGroup,
        mobile_no: mobileNo,
        default_currency: currency,
        buying_price_list: buyingPriceList,
      });

      if (res.success) {
        await loadSuppliers();
        setSupplierName("");
        setSupplierGroup("Raw Material");
        setMobileNo("");
        setShowModal(false);
      } else {
        console.log(res.error);
      }
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    return suppliers.filter((item) => {
      const searchLower = search.toLowerCase();
      const matchSearch =
        item.supplier_name?.toLowerCase().includes(search.toLowerCase()) ||
        item.mobile_no?.toLowerCase().includes(search.toLowerCase()) ||
        item.supplier_group?.toLowerCase().includes(searchLower); // 👈 Added group search matching here

      if (activeTab === "All") {
        return matchSearch;
      }
      return matchSearch && item.supplier_group === activeTab;
    });
  }, [search, suppliers, activeTab]);

  const renderItem = ({ item }: { item: Supplier }) => {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => setSelectedSupplier(item)}
      >
        <View style={styles.leftSection}>
          {/* Avatar holding 2 uppercase letters */}
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.supplier_name?.substring(0, 2).toUpperCase()}
            </Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.nameText}>{item.supplier_name}</Text>

            <View style={styles.badgeRow}>
              <View style={styles.grayBadge}>
                <Text style={styles.grayBadgeText}>{item.supplier_group}</Text>
              </View>

              <View style={styles.blueBadge}>
                <Text style={styles.blueBadgeText}>
                  {item.default_currency || "MMK"}
                </Text>
              </View>
            </View>

            {/* Added Phone row matching layout image screenshot */}
            {item.mobile_no ? (
              <View style={styles.phoneRow}>
                <Ionicons
                  name="call-outline"
                  size={14}
                  color="#6B7280"
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.phoneText}>{item.mobile_no}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <FlatList
        data={filteredData}
        keyExtractor={(item, index) => item.name || index.toString()}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* HEADER */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <TouchableOpacity onPress={() => router.back()}>
                  <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>👥 ကုန်သည်စာရင်း</Text>
              </View>

              <TouchableOpacity
                style={styles.topButton}
                onPress={() => setShowModal(true)}
              >
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={styles.topButtonText}>ထည့်မည်</Text>
              </TouchableOpacity>
            </View>

            {/* SEARCH */}
            <View style={styles.searchWrapper}>
              <View style={styles.searchBox}>
                <Ionicons name="search-outline" size={22} color="#9CA3AF" />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="အမည် / ဖုန်းနံပါတ် / အမျိုးအစား ရှာပါ..."
                  placeholderTextColor="#9CA3AF"
                  style={styles.searchInput}
                />
              </View>
            </View>

            {/* TABS */}
            <View style={styles.tabsContainer}>
              <TouchableOpacity
                style={
                  activeTab === "All" ? styles.activeTab : styles.inactiveTab
                }
                onPress={() => setActiveTab("All")}
              >
                <Text
                  style={
                    activeTab === "All"
                      ? styles.activeTabText
                      : styles.inactiveTabText
                  }
                >
                  All
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={
                  activeTab === "Raw Material"
                    ? styles.activeTab
                    : styles.inactiveTab
                }
                onPress={() => setActiveTab("Raw Material")}
              >
                <Text
                  style={
                    activeTab === "Raw Material"
                      ? styles.activeTabText
                      : styles.inactiveTabText
                  }
                >
                  Raw Material
                </Text>
              </TouchableOpacity>
            </View>

            {/* COUNT */}
            <View style={styles.countContainer}>
              <Text style={styles.countText}>
                ကုန်သည် စုစုပေါင်း: {filteredData.length} ဦး
              </Text>
            </View>
          </>
        }
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 120,
        }}
      />

      {/* FLOAT BUTTON */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setShowModal(true)}
      >
        <Ionicons name="add" size={22} color="#fff" />
        <Text style={styles.floatingButtonText}>ကုန်သည်အသစ်</Text>
      </TouchableOpacity>

      {/* ENTRY MODAL */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.handle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>ကုန်သည်အသစ် မှတ်တမ်းတင်ရန်</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={30} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>
                ကုန်သည်အမည်<Text style={{ color: "red" }}> *</Text>
              </Text>
              <TextInput
                value={supplierName}
                onChangeText={setSupplierName}
                placeholder="ကုန်သည်အမည် ထည့်ပါ"
                placeholderTextColor="#9CA3AF"
                style={styles.input}
              />

              <Text style={styles.label}>
                ကုန်သည်အမျိုးအစား<Text style={{ color: "red" }}> *</Text>
              </Text>
              <TouchableOpacity
                style={styles.selectBox}
                onPress={() => setSupplierGroup("Raw Material")}
              >
                <Text style={styles.selectText}>{supplierGroup}</Text>
              </TouchableOpacity>

              <Text style={styles.label}>ဖုန်းနံပါတ်</Text>
              <TextInput
                value={mobileNo}
                onChangeText={setMobileNo}
                placeholder="09..."
                placeholderTextColor="#9CA3AF"
                style={styles.input}
                keyboardType="phone-pad"
              />

              <Text style={styles.label}>ငွေကြေးယူနစ်</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={currency}
                  onValueChange={(itemValue) => {
                    setCurrency(itemValue);
                    if (itemValue === "MMK") {
                      setBuyingPriceList("Standard Buying (MMK)");
                    } else {
                      setBuyingPriceList("Standard Buying (USD)");
                    }
                  }}
                >
                  <Picker.Item label="MMK" value="MMK" />
                  <Picker.Item label="USD" value="USD" />
                </Picker>
              </View>

              <Text style={styles.label}>ရွေးနှုန်းအမျိုးအစား</Text>
              <TouchableOpacity style={styles.selectBox}>
                <Text style={styles.selectText}>{buyingPriceList}</Text>
              </TouchableOpacity>
              <View style={{ height: 120 }} />
            </ScrollView>

            <View style={styles.bottomArea}>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={saveSupplier}
                disabled={loading}
              >
                <Ionicons name="checkmark" size={24} color="#fff" />
                <Text style={styles.saveButtonText}>
                  {loading ? "Saving..." : "သိမ်းမည်"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* DETAIL MODAL */}
      <Modal
        visible={selectedSupplier !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedSupplier(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { height: "60%" }]}>
            <View style={styles.handle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>ကုန်သည် အချက်အလက်</Text>
              <TouchableOpacity onPress={() => setSelectedSupplier(null)}>
                <Ionicons name="close" size={30} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ alignItems: "center", marginBottom: 20 }}>
                <View
                  style={[
                    styles.avatar,
                    { width: 80, height: 80, borderRadius: 24, marginRight: 0 },
                  ]}
                >
                  <Text style={[styles.avatarText, { fontSize: 36 }]}>
                    {selectedSupplier?.supplier_name
                      ?.substring(0, 2)
                      .toUpperCase()}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.nameText,
                    { marginTop: 12, marginBottom: 4, fontSize: 24 },
                  ]}
                >
                  {selectedSupplier?.supplier_name}
                </Text>
                <Text style={{ color: "#6B7280", fontSize: 16 }}>
                  {selectedSupplier?.mobile_no || "ဖုန်းနံပါတ်မရှိပါ"}
                </Text>
              </View>

              <View
                style={{
                  borderTopWidth: 1,
                  borderTopColor: "#E5E7EB",
                  marginHorizontal: 24,
                  marginBottom: 15,
                }}
              />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>ကုန်သည်အမျိုးအစား</Text>
                <Text style={styles.detailValue}>
                  {selectedSupplier?.supplier_group}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>ငွေကြေးယူနစ်</Text>
                <Text style={styles.detailValue}>
                  {selectedSupplier?.default_currency || "MMK"}
                </Text>
              </View>
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },
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
  headerLeft: { flexDirection: "row", alignItems: "center" },
  headerTitle: {
    color: "#fff",
    fontSize: isSmallDevice ? 18 : 20,
    fontWeight: "700",
    marginLeft: 10,
  },
  topButton: {
    height: isSmallDevice ? 38 : 42,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: isSmallDevice ? 14 : 16,
    flexDirection: "row",
    alignItems: "center",
  },
  topButtonText: {
    color: "#fff",
    fontSize: isSmallDevice ? 14 : 15,
    fontWeight: "600",
    marginLeft: 4,
  },
  searchWrapper: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    marginHorizontal: -16,
  },
  searchBox: {
    height: isSmallDevice ? 48 : 52,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 26,
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: isSmallDevice ? 14 : 15,
    color: "#111827",
  },
  tabsContainer: {
    backgroundColor: "#fff",
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    marginHorizontal: -16,
  },
  activeTab: {
    height: isSmallDevice ? 40 : 44,
    borderRadius: 22,
    backgroundColor: "#18A06A",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    marginRight: 10,
  },
  activeTabText: {
    color: "#fff",
    fontSize: isSmallDevice ? 14 : 15,
    fontWeight: "700",
  },
  inactiveTab: {
    height: isSmallDevice ? 40 : 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 18,
  },
  inactiveTabText: {
    color: "#6B7280",
    fontSize: isSmallDevice ? 14 : 15,
    fontWeight: "500",
  },
  countContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#F3F4F6",
    marginHorizontal: -16,
  },
  countText: { fontSize: isSmallDevice ? 13 : 14, color: "#6B7280" },
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
    backgroundColor: "#E4F5EE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  avatarText: {
    fontSize: isSmallDevice ? 20 : 22,
    fontWeight: "700",
    color: "#159669",
  },
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
  floatingButton: {
    position: "absolute",
    right: 18,
    bottom: 24,
    height: isSmallDevice ? 50 : 54,
    borderRadius: 28,
    backgroundColor: "#18A06A",
    paddingHorizontal: isSmallDevice ? 20 : 24,
    flexDirection: "row",
    alignItems: "center",
    elevation: 6,
  },
  floatingButtonText: {
    color: "#fff",
    fontSize: isSmallDevice ? 15 : 16,
    fontWeight: "700",
    marginLeft: 6,
  },
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
    backgroundColor: "#18A06A",
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
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 18,
    marginHorizontal: 24,
    marginBottom: 10,
    overflow: "hidden",
    backgroundColor: "#fff",
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
