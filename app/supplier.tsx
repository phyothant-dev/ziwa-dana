import { AddSupplierModal } from "@/components/AddSupplierModal";
import ScreenWrapper from "@/components/ScreenWrapper";
import { SupplierCard } from "@/components/SupplierCard";
import { SupplierDetailModal } from "@/components/SupplierDetailModal";
import { translations } from "@/locales/index";
import { parseFrappeError } from "@/services/parseFrappeErrorService";
import {
    createSupplier,
    getSupplierGroups,
    getSuppliers,
} from "@/services/supplierService";
import { useSettingsStore } from "@/stores/settingsStore";
import { SupplierGroupType } from "@/types/supplierGroupType";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Linking,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
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

const { width } = Dimensions.get("window");
const isSmallDevice = width < 380;

export default function SupplierScreen() {
  const { language, themeColor } = useSettingsStore();
  const t = translations[language] || translations["mm"];

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [showModal, setShowModal] = useState(false);

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierGroups, setSupplierGroups] = useState<SupplierGroupType[]>([]);
  const [baseUrl, setBaseUrl] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null,
  );

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const getSiteUrl = async () => {
      const savedUrl = await AsyncStorage.getItem("siteUrl");
      if (savedUrl) setBaseUrl(savedUrl.replace(/\/+$/, ""));
    };
    getSiteUrl();
  }, []);

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
      if (groupRes.success && groupRes.data) setSupplierGroups(groupRes.data);
    } catch (err) {
      console.log("Error loading master data:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadSuppliers = async () => {
    const res = await getSuppliers();
    if (res.success) setSuppliers(res.data || []);
  };

  const handlePhoneCall = async (phoneNumber: string) => {
    const url = `tel:${phoneNumber}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Not Supported", "This device cannot make phone calls.");
      }
    } catch (error) {
      console.error("Failed to open phone URL:", error);
    }
  };

  const handleSaveSupplier = async (data: {
    supplierName: string;
    supplierGroup: string;
    mobileNo: string;
    currency: string;
    buyingPriceList: string;
  }) => {
    if (!data.supplierName) {
      Alert.alert(
        t.warningTitle || "Warning",
        t.supplierNamePlaceholder || "Supplier Name is required",
      );
      return;
    }
    if (!data.supplierGroup) {
      Alert.alert(
        t.warningTitle || "Warning",
        "Please select a supplier group",
      );
      return;
    }
    try {
      setLoading(true);
      const res = await createSupplier({
        supplier_name: data.supplierName,
        supplier_group: data.supplierGroup,
        mobile_no: data.mobileNo,
        default_currency: data.currency,
        buying_price_list: data.buyingPriceList,
      });
      if (res.success) {
        await loadSuppliers();
        setShowModal(false);
      } else {
        Alert.alert("Error", res.error);
      }
    } catch (e: any) {
      Alert.alert("Error", parseFrappeError(e));
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
      if (activeTab === "All") return matchSearch;
      return matchSearch && item.supplier_group === activeTab;
    });
  }, [search, suppliers, activeTab]);

  return (
    <ScreenWrapper>
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
          renderItem={({ item }) => (
            <SupplierCard
              item={item}
              themeColor={themeColor}
              baseUrl={baseUrl}
              rawMaterialLabel={t.rawMaterial}
              onPress={setSelectedSupplier}
              onPhoneCall={handlePhoneCall}
            />
          )}
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
                {["All", "Raw Material"].map((tab) => (
                  <TouchableOpacity
                    key={tab}
                    style={
                      activeTab === tab
                        ? [styles.activeTab, { backgroundColor: themeColor }]
                        : styles.inactiveTab
                    }
                    onPress={() => setActiveTab(tab)}
                  >
                    <Text
                      style={
                        activeTab === tab
                          ? styles.activeTabText
                          : styles.inactiveTabText
                      }
                    >
                      {tab === "All" ? t.all : t.rawMaterial}
                    </Text>
                  </TouchableOpacity>
                ))}
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

      {/* FLOATING BUTTON */}
      <TouchableOpacity
        style={[styles.floatingButton, { backgroundColor: themeColor }]}
        onPress={() => setShowModal(true)}
      >
        <Ionicons name="add" size={22} color="#fff" />
        <Text style={styles.floatingButtonText}>{t.newSupplier}</Text>
      </TouchableOpacity>

      {/* ADD SUPPLIER MODAL */}
      <AddSupplierModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSaveSupplier}
        supplierGroups={supplierGroups}
        themeColor={themeColor}
        loading={loading}
        translations={t}
        initialGroup={supplierGroups[0]?.name ?? ""}
      />

      {/* DETAIL MODAL */}
      <SupplierDetailModal
        supplier={selectedSupplier}
        onClose={() => setSelectedSupplier(null)}
        baseUrl={baseUrl}
        themeColor={themeColor}
        onPhoneCall={handlePhoneCall}
        translations={t}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
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
    marginRight: 10,
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
});
