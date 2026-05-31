import { translations } from "@/locales/index";
import {
    createSupplier,
    getSupplierGroups,
    getSuppliers,
    parseFrappeError,
    SupplierGroupType
} from "@/services/frappeService";
import { useSettingsStore } from "@/stores/settingsStore";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Linking,
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
  const { language, themeColor } = useSettingsStore();
  const t = translations[language] || translations["mm"];

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierGroups, setSupplierGroups] = useState<SupplierGroupType[]>([]);
  const [groupSearch, setGroupSearch] = useState("");

  const [supplierName, setSupplierName] = useState("");
  const [supplierGroup, setSupplierGroup] = useState("");
  const [mobileNo, setMobileNo] = useState("");
  const [currency, setCurrency] = useState("MMK");
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null,
  );
  const [buyingPriceList, setBuyingPriceList] = useState(
    "Standard Buying (MMK)",
  );

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadMasterData();
  }, []);

  const loadMasterData = async () => {
    try {
      setLoading(true);
      const [supplierRes, groupRes] = await Promise.all([
        getSuppliers(),
        getSupplierGroups(),
      ]);

      if (supplierRes.success) setSuppliers(supplierRes.data || []);
      if (groupRes.success && groupRes.data) {
        setSupplierGroups(groupRes.data);
        if (groupRes.data.length > 0) {
          setSupplierGroup(groupRes.data[0].name);
        }
      }
    } catch (err) {
      console.log("Error bundle initialization:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadSuppliers = async () => {
    const res = await getSuppliers();
    if (res.success) {
      setSuppliers(res.data || []);
    }
  };

  const saveSupplier = async () => {
    if (!supplierName) {
      Alert.alert(
        t.warningTitle || "Warning",
        t.supplierNamePlaceholder || "Supplier Name is required",
      );
      return;
    }
    if (!supplierGroup) {
      Alert.alert(
        t.warningTitle || "Warning",
        "Please select a supplier group",
      );
      return;
    }

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
        setMobileNo("");
        if (supplierGroups.length > 0) setSupplierGroup(supplierGroups[0].name);
        setShowModal(false);
      } else {
        Alert.alert("Error", res.error);
      }
    } catch (e: any) {
      Alert.alert("Error", parseFrappeError(e)); // 👈 was just console.log(e)
    } finally {
      setLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    return suppliers.filter((item) => {
      const searchLower = search.toLowerCase();
      const matchSearch =
        item.supplier_name?.toLowerCase().includes(searchLower) ||
        item.mobile_no?.toLowerCase().includes(searchLower) ||
        item.supplier_group?.toLowerCase().includes(searchLower);

      if (activeTab === "All") {
        return matchSearch;
      }
      return matchSearch && item.supplier_group === activeTab;
    });
  }, [search, suppliers, activeTab]);

  const filteredGroups = useMemo(() => {
    return supplierGroups.filter((g) =>
      g.name.toLowerCase().includes(groupSearch.toLowerCase()),
    );
  }, [groupSearch, supplierGroups]);

  const renderItem = ({ item }: { item: Supplier }) => {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => setSelectedSupplier(item)}
      >
        <View style={styles.leftSection}>
          <View style={[styles.avatar, { backgroundColor: `${themeColor}15` }]}>
            <Text style={[styles.avatarText, { color: themeColor }]}>
              {item.supplier_name?.substring(0, 2).toUpperCase()}
            </Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.nameText}>{item.supplier_name}</Text>
            <View style={styles.badgeRow}>
              <View style={styles.grayBadge}>
                <Text style={styles.grayBadgeText}>
                  {item.supplier_group === "Raw Material"
                    ? t.rawMaterial
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
                onPress={() => Linking.openURL(`tel:${item.mobile_no}`)}
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {loading && suppliers.length === 0 ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color={themeColor} />
        </View>
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={(item, index) => item.name || index.toString()}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            await loadSuppliers();
            setRefreshing(false);
          }}
          ListHeaderComponent={
            <>
              {/* HEADER */}
              <View style={[styles.header, { backgroundColor: themeColor }]}>
                <View style={styles.headerLeft}>
                  <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                  </TouchableOpacity>
                  <Text style={styles.headerTitle}>{t.suppliersList}</Text>
                </View>

                <TouchableOpacity
                  style={styles.topButton}
                  onPress={() => setShowModal(true)}
                >
                  <Ionicons name="add" size={18} color="#fff" />
                  <Text style={styles.topButtonText}>{t.add}</Text>
                </TouchableOpacity>
              </View>

              {/* SEARCH */}
              <View style={styles.searchWrapper}>
                <View style={styles.searchBox}>
                  <Ionicons name="search-outline" size={22} color="#9CA3AF" />
                  <TextInput
                    value={search}
                    onChangeText={setSearch}
                    placeholder={t.searchPlaceholder}
                    placeholderTextColor="#9CA3AF"
                    style={styles.searchInput}
                  />
                </View>
              </View>

              {/* TABS */}
              <View style={styles.tabsContainer}>
                <TouchableOpacity
                  style={
                    activeTab === "All"
                      ? [styles.activeTab, { backgroundColor: themeColor }]
                      : styles.inactiveTab
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
                    {t.all}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={
                    activeTab === "Raw Material"
                      ? [styles.activeTab, { backgroundColor: themeColor }]
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
                    {t.rawMaterial}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* COUNT */}
              <View style={styles.countContainer}>
                <Text style={styles.countText}>
                  {t.totalSuppliers.replace(
                    "{{count}}",
                    filteredData.length.toString(),
                  )}
                </Text>
              </View>
            </>
          }
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
        />
      )}

      {/* FLOAT BUTTON */}
      <TouchableOpacity
        style={[styles.floatingButton, { backgroundColor: themeColor }]}
        onPress={() => setShowModal(true)}
      >
        <Ionicons name="add" size={22} color="#fff" />
        <Text style={styles.floatingButtonText}>{t.newSupplier}</Text>
      </TouchableOpacity>

      {/* ENTRY MODAL */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.handle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.addNewSupplierTitle}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={30} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
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

              <Text style={styles.label}>
                {t.supplierType}
                <Text style={{ color: "red" }}> *</Text>
              </Text>

              {/* MODIFIED SELECT STEP DROP DOWN INSTEAD OF STATIC CLICK TOGGLE */}
              <TouchableOpacity
                style={styles.selectBox}
                onPress={() => setShowGroupModal(true)}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text style={styles.selectText}>
                    {supplierGroup === "Raw Material"
                      ? t.rawMaterial
                      : supplierGroup || "Select Group..."}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color="#6B7280" />
                </View>
              </TouchableOpacity>

              <Text style={styles.label}>{t.phoneNumber}</Text>
              <TextInput
                value={mobileNo}
                onChangeText={setMobileNo}
                placeholder="09..."
                placeholderTextColor="#9CA3AF"
                style={styles.input}
                keyboardType="phone-pad"
              />

              <Text style={styles.label}>{t.currency}</Text>
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
                  <Picker.Item label={t.currencyMMK} value="MMK" />
                  <Picker.Item label={t.currencyUSD} value="USD" />
                </Picker>
              </View>

              <Text style={styles.label}>{t.priceListType}</Text>
              <TouchableOpacity style={styles.selectBox} disabled>
                <Text style={styles.selectText}>
                  {buyingPriceList === "Standard Buying (MMK)"
                    ? t.standardBuyingMMK
                    : t.standardBuyingUSD}
                </Text>
              </TouchableOpacity>
              <View style={{ height: 120 }} />
            </ScrollView>

            <View style={styles.bottomArea}>
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: themeColor }]}
                onPress={saveSupplier}
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

      {/* SEARCHABLE SUPPLIER GROUP PICKER DIALOG OVERLAY */}
      <Modal visible={showGroupModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowGroupModal(false)}
        >
          <View style={[styles.pickerModalContainer, { height: "60%" }]}>
            <Text style={styles.modalHeaderTitle}>Select Supplier Group</Text>

            <View style={styles.modalSearchBox}>
              <Ionicons name="search-outline" size={18} color="#9CA3AF" />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Search group..."
                value={groupSearch}
                onChangeText={setGroupSearch}
              />
            </View>

            <FlatList
              data={filteredGroups}
              keyExtractor={(item) => item.name}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerItem}
                  onPress={() => {
                    setSupplierGroup(item.name);
                    setGroupSearch("");
                    setShowGroupModal(false);
                  }}
                >
                  <Text style={styles.pickerMainText}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
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
              <Text style={styles.modalTitle}>{t.supplierInfoTitle}</Text>
              <TouchableOpacity onPress={() => setSelectedSupplier(null)}>
                <Ionicons name="close" size={30} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ alignItems: "center", marginBottom: 20 }}>
                <View
                  style={[
                    styles.avatar,
                    {
                      width: 80,
                      height: 80,
                      borderRadius: 24,
                      marginRight: 0,
                      backgroundColor: `${themeColor}15`,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.avatarText,
                      { fontSize: 36, color: themeColor },
                    ]}
                  >
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
                <TouchableOpacity
                  disabled={!selectedSupplier?.mobile_no}
                  onPress={() =>
                    Linking.openURL(`tel:${selectedSupplier?.mobile_no}`)
                  }
                >
                  <Text style={{ color: "#6B7280", fontSize: 16 }}>
                    {selectedSupplier?.mobile_no || t.noPhoneNumber}
                  </Text>
                </TouchableOpacity>
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
                <Text style={styles.detailLabel}>{t.supplierType}</Text>
                <Text style={styles.detailValue}>
                  {selectedSupplier?.supplier_group === "Raw Material"
                    ? t.rawMaterial
                    : selectedSupplier?.supplier_group}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t.currency}</Text>
                <Text style={styles.detailValue}>
                  {selectedSupplier?.default_currency === "USD"
                    ? t.currencyUSD
                    : t.currencyMMK}
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
  floatingButton: {
    position: "absolute",
    right: 18,
    bottom: 24,
    height: isSmallDevice ? 50 : 54,
    borderRadius: 28,
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

  // NEW SELECT PICKER DIALOG OVERLAY DESIGN TOKENS
  pickerModalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    width: "100%",
    elevation: 5,
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 14,
    textAlign: "center",
  },
  modalSearchBox: {
    height: 48,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    marginBottom: 14,
  },
  modalSearchInput: { flex: 1, marginLeft: 8, fontSize: 15, color: "#111827" },
  pickerItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  pickerMainText: { fontSize: 16, fontWeight: "600", color: "#111827" },
});
