import {
    createPurchaseReceipt,
    getItems,
    getSuppliers,
    getWarehouses,
    ItemType,
    SupplierType,
    WarehouseType,
} from "@/services/frappeService";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker, {
    DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
// 1. IMPORT EXPO CAMERA TOOLS
import { Camera, CameraView } from "expo-camera";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Modal,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 44) / 2;

export default function PurchaseScreen() {
  const { supplierName } = useLocalSearchParams<{ supplierName?: string }>();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("All");

  // Master Lists State
  const [items, setItems] = useState<ItemType[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierType[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseType[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form Field Selections
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierType | null>(
    null,
  );
  const [selectedWarehouse, setSelectedWarehouse] =
    useState<WarehouseType | null>(null);

  // Native Date Picker States
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Modal Toggles (Added camera control interface flag)
  const [supplierModalVisible, setSupplierModalVisible] = useState(false);
  const [warehouseModalVisible, setWarehouseModalVisible] = useState(false);
  const [cartModalVisible, setCartModalVisible] = useState(false);
  const [cameraModalVisible, setCameraModalVisible] = useState(false);

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  // Cart State (Keyed by item code -> quantity)
  const [cart, setCart] = useState<Record<string, number>>({});

  useEffect(() => {
    loadFormMasterData();
  }, []);

  useEffect(() => {
    if (supplierName && suppliers.length > 0) {
      const matchedSupplier = suppliers.find(
        (s) => s.supplier_name?.toLowerCase() === supplierName.toLowerCase(),
      );
      if (matchedSupplier) {
        setSelectedSupplier(matchedSupplier);
      }
    }
  }, [supplierName, suppliers]);

  const loadFormMasterData = async () => {
    try {
      setLoading(true);
      const [itemRes, supplierRes, warehouseRes] = await Promise.all([
        getItems(),
        getSuppliers(),
        getWarehouses(),
      ]);

      if (itemRes.success && itemRes.data) setItems(itemRes.data);
      if (supplierRes.success && supplierRes.data)
        setSuppliers(supplierRes.data);
      if (warehouseRes.success && warehouseRes.data) {
        setWarehouses(warehouseRes.data);
        if (warehouseRes.data.length > 0) {
          setSelectedWarehouse(warehouseRes.data[0]);
        }
      }
    } catch (err) {
      console.log("Error filling data bundles:", err);
    } finally {
      setLoading(false);
    }
  };

  const formattedDisplayDate = useMemo(() => {
    return date.toISOString().split("T")[0];
  }, [date]);

  const onChangeDate = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleSetQty = (itemCode: string, amount: number) => {
    setCart((prev) => ({ ...prev, [itemCode]: Math.max(0, amount) }));
  };

  const handleIncreaseCartQty = (itemCode: string) => {
    setCart((prev) => ({ ...prev, [itemCode]: (prev[itemCode] || 0) + 1 }));
  };

  const handleDecreaseCartQty = (itemCode: string) => {
    setCart((prev) => {
      const currentQty = prev[itemCode] || 0;
      if (currentQty <= 1) return prev;
      return { ...prev, [itemCode]: currentQty - 1 };
    });
  };

  const handleRemoveEntireItem = (itemCode: string) => {
    setCart((prev) => {
      const updatedCart = { ...prev };
      delete updatedCart[itemCode];
      return updatedCart;
    });
  };

  const handleSavePurchaseReceipt = async () => {
    if (!selectedSupplier) {
      Alert.alert("သတိပေးချက်", "ကျေးဇူးပြု၍ ကုန်သည် အရင်ရွေးချယ်ပေးပါဦး။");
      return;
    }
    if (!selectedWarehouse) {
      Alert.alert("သတိပေးချက်", "ကျေးဇူးပြု၍ သိုလှောင်ရုံ ရွေးချယ်ပေးပါဦး။");
      return;
    }

    const checkoutItems = Object.entries(cart)
      .filter(([_, qty]) => qty > 0)
      .map(([item_code, qty]) => ({ item_code, qty }));

    if (checkoutItems.length === 0) {
      Alert.alert("သတိပေးချက်", "ဝယ်ယူရန် ပစ္စည်းအနည်းဆုံး ၁ ခုထည့်ပေးပါ။");
      return;
    }

    try {
      setSubmitting(true);
      const res = await createPurchaseReceipt(
        selectedSupplier.name!,
        selectedWarehouse.name,
        checkoutItems,
        formattedDisplayDate,
      );
      if (res.success) {
        Alert.alert("အောင်မြင်ပါသည်", "ကုန်လက်ခံလွှာ သိမ်းဆည်းပြီးပါပြီ။");
        setCart({});
        setCartModalVisible(false);
        router.back();
      } else {
        Alert.alert("အမှားအယွင်း", res.error);
      }
    } catch (err: any) {
      Alert.alert("အမှားအယွင်း", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // 2. LIVE NATIVE SCANNER ACTIVATION OVERRIDE
  const handleOpenScanner = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === "granted");

    if (status === "granted") {
      setCameraModalVisible(true);
    } else {
      Alert.alert(
        "Permission Denied",
        "ကျေးဇူးပြု၍ ကင်မရာအသုံးပြုခွင့်ကို Settings တွင် ဖွင့်ပေးပါ။",
      );
    }
  };

  // 3. BARCODE/QR CODE SCANNED RESPONSE HANDLING ROUTINE
  const handleBarcodeScanned = ({
    type,
    data,
  }: {
    type: string;
    data: string;
  }) => {
    setCameraModalVisible(false); // Close camera modal right away

    // Look for matching `name` (item_code) or `item_name` in the master items array
    const matchedItem = items.find(
      (product) => product.name?.toLowerCase() === data.trim().toLowerCase(),
    );

    if (matchedItem) {
      // Append item or bump up its quantity in the cart
      setCart((prev) => ({
        ...prev,
        [matchedItem.name]: (prev[matchedItem.name] || 0) + 1,
      }));

      Alert.alert(
        "Item Added",
        `"${matchedItem.item_name}" ကို Cartထဲသို့ ထည့်ပြီးပါပြီ။`,
      );
    } else {
      Alert.alert(
        "ရှာမတွေ့ပါ",
        `ကုဒ် "${data}" နှင့် ကိုက်ညီသော ပစ္စည်း စာရင်းထဲတွင် မရှိပါ။`,
      );
    }
  };

  const filteredData = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        item.item_name?.toLowerCase().includes(search.toLowerCase()) ||
        item.name?.toLowerCase().includes(search.toLowerCase());
      const matchTab = activeTab === "All" || item.item_group === activeTab;
      return matchSearch && matchTab;
    });
  }, [search, activeTab, items]);

  const totalCartCount = useMemo(() => {
    return Object.values(cart).reduce((a, b) => a + b, 0);
  }, [cart]);

  const renderItem = ({ item }: { item: ItemType }) => {
    const currentQty = cart[item.name] || 0;

    return (
      <View style={[styles.card, currentQty > 0 && styles.activeCardBorder]}>
        <Text style={styles.categoryText}>
          {item.item_group?.toUpperCase()}
        </Text>
        <Text style={styles.productName} numberOfLines={1}>
          {item.item_name}
        </Text>
        <Text style={styles.codeText}>{item.name}</Text>
        <View style={styles.stateBadge}>
          <Text style={styles.stateBadgeText}>{item.stock_uom || "Nos"}</Text>
        </View>

        {currentQty === 0 ? (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => handleSetQty(item.name, 1)}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addButtonText}>ထည့်မည်</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.qtyRow}>
            <TouchableOpacity
              style={styles.qtyButton}
              onPress={() => handleSetQty(item.name, currentQty - 1)}
            >
              <Ionicons name="remove" size={22} color="#18A06A" />
            </TouchableOpacity>
            <Text style={styles.qtyText}>{currentQty}</Text>
            <TouchableOpacity
              style={styles.qtyButton}
              onPress={() => handleSetQty(item.name, currentQty + 1)}
            >
              <Ionicons name="add" size={22} color="#18A06A" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* HEADER ROW */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>📦 ကုန်လက်ခံလွှာ</Text>
        </View>

        <TouchableOpacity
          style={styles.cartButton}
          onPress={() => setCartModalVisible(true)}
        >
          <Text style={styles.cartText}>Cart</Text>
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>{totalCartCount}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center" }}>
          <ActivityIndicator size="large" color="#18A06A" />
        </View>
      ) : (
        <>
          {/* SELECTION CONFIGURATION BOXES */}
          <View style={styles.formSection}>
            <TouchableOpacity
              style={styles.inputBox}
              onPress={() => setSupplierModalVisible(true)}
            >
              <Text
                style={[
                  styles.inputText,
                  selectedSupplier && { color: "#111827", fontWeight: "600" },
                ]}
              >
                {selectedSupplier
                  ? selectedSupplier.supplier_name
                  : "-- Supplier ရွေးပါ --"}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#6B7280" />
            </TouchableOpacity>

            <View style={styles.row}>
              <TouchableOpacity
                style={styles.storeBox}
                onPress={() => setWarehouseModalVisible(true)}
              >
                <MaterialCommunityIcons
                  name="store-outline"
                  size={22}
                  color="#18A06A"
                />
                <View style={{ marginLeft: 8, flex: 1 }}>
                  <Text style={styles.storeLabel}>Stores</Text>
                  <Text style={styles.storeText} numberOfLines={1}>
                    {selectedWarehouse
                      ? `- ${selectedWarehouse.warehouse_name}`
                      : "- ရွေးချယ်ရန်"}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={16} color="#6B7280" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dateBox}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateText}>{formattedDisplayDate}</Text>
                <Ionicons name="calendar-outline" size={18} color="#4B5563" />
              </TouchableOpacity>
            </View>

            {showDatePicker && (
              <View
                style={
                  Platform.OS === "ios" ? styles.iosDatePickerContainer : null
                }
              >
                <DateTimePicker
                  value={date}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={onChangeDate}
                />
                {Platform.OS === "ios" && (
                  <TouchableOpacity
                    style={styles.iosDoneButton}
                    onPress={() => setShowDatePicker(false)}
                  >
                    <Text style={styles.iosDoneButtonText}>Done</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* SEARCH COMPONENT ROW */}
          <View style={styles.searchWrapper}>
            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={22} color="#9CA3AF" />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Item ရှာ..."
                placeholderTextColor="#9CA3AF"
                style={styles.searchInput}
              />
            </View>
            {/* LINKED LIVE SCANNER METHOD LINK HERE */}
            <TouchableOpacity
              style={styles.filterButton}
              onPress={handleOpenScanner}
            >
              <Ionicons name="qr-code-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* CLASSIFICATION TABS */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[
                styles.inactiveTab,
                activeTab === "All" && styles.activeTab,
              ]}
              onPress={() => setActiveTab("All")}
            >
              <Text
                style={[
                  styles.inactiveTabText,
                  activeTab === "All" && styles.activeTabText,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.inactiveTab,
                activeTab === "Raw Materials" && styles.activeTab,
              ]}
              onPress={() => setActiveTab("Raw Materials")}
            >
              <Text
                style={[
                  styles.inactiveTabText,
                  activeTab === "Raw Materials" && styles.activeTabText,
                ]}
              >
                Raw Materials
              </Text>
            </TouchableOpacity>
          </View>

          {/* MAIN ITEM COMPONENT GRID */}
          <FlatList
            data={filteredData}
            renderItem={renderItem}
            keyExtractor={(item) => item.name}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: "space-between" }}
            contentContainerStyle={{ padding: 14, paddingBottom: 60 }}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}

      {/* 4. REAL CAMERA VIEW SCANNER MODAL OVERLAY SHEET */}
      <Modal
        visible={cameraModalVisible}
        animationType="slide"
        onRequestClose={() => setCameraModalVisible(false)}
      >
        <View style={styles.cameraScreenContainer}>
          <CameraView
            style={StyleSheet.absoluteFillObject}
            barcodeScannerSettings={{
              barcodeTypes: ["qr", "ean13", "ean8", "code128"], // Scan QR codes and standard barcodes
            }}
            onBarcodeScanned={handleBarcodeScanned}
          />

          {/* Transparent Overlay with Scanner Reticle Target Mask */}
          <View style={styles.cameraOverlayMask}>
            <View style={styles.reticleTargetFrame}>
              <View style={[styles.cornerMarker, styles.topLeftCorner]} />
              <View style={[styles.cornerMarker, styles.topRightCorner]} />
              <View style={[styles.cornerMarker, styles.bottomLeftCorner]} />
              <View style={[styles.cornerMarker, styles.bottomRightCorner]} />
            </View>
            <Text style={styles.cameraInstructionsText}>
              ပစ္စည်းပေါ်ရှိ Barcode / QR Code ကို စတုရန်းကွက်အတွင်း ထားပေးပါ
            </Text>
          </View>

          {/* Floating Exit Close Button */}
          <TouchableOpacity
            style={styles.closeCameraFabButton}
            onPress={() => setCameraModalVisible(false)}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      </Modal>

      {/* SUPPLIER DROPDOWN PICKER */}
      <Modal visible={supplierModalVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSupplierModalVisible(false)}
        >
          <View style={[styles.pickerModalContainer, { height: "60%" }]}>
            <Text style={styles.modalHeaderTitle}>ကုန်သည် ရွေးချယ်ရန်</Text>
            <FlatList
              data={suppliers}
              keyExtractor={(item) => item.name!}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerItem}
                  onPress={() => {
                    setSelectedSupplier(item);
                    setSupplierModalVisible(false);
                  }}
                >
                  <Text style={styles.pickerMainText}>
                    {item.supplier_name}
                  </Text>
                  <Text style={styles.pickerSubText}>
                    {item.supplier_group}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* WAREHOUSE DROPDOWN PICKER */}
      <Modal visible={warehouseModalVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setWarehouseModalVisible(false)}
        >
          <View style={styles.pickerModalContainer}>
            <Text style={styles.modalHeaderTitle}>
              သိုလှောင်ရုံ ရွေးချယ်ရန်
            </Text>
            <FlatList
              data={warehouses}
              keyExtractor={(item) => item.name}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerItem}
                  onPress={() => {
                    setSelectedWarehouse(item);
                    setWarehouseModalVisible(false);
                  }}
                >
                  <Text style={styles.pickerMainText}>
                    {item.warehouse_name}
                  </Text>
                  <Text style={styles.pickerSubText}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* BOTTOM SHEET CART DETAILED MODAL */}
      <Modal visible={cartModalVisible} transparent animationType="slide">
        <TouchableOpacity
          style={styles.modalBottomOverlay}
          activeOpacity={1}
          onPress={() => setCartModalVisible(false)}
        >
          <View style={styles.cartBottomSheetContainer}>
            <View style={styles.pullBarIndicator} />
            <View style={styles.cartModalHeaderRow}>
              <Text style={styles.cartModalTitleText}>🛒 Cart</Text>
              <TouchableOpacity onPress={() => setCartModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={items.filter((item) => (cart[item.name] || 0) > 0)}
              keyExtractor={(item) => item.name}
              contentContainerStyle={{ paddingVertical: 10 }}
              renderItem={({ item }) => {
                const currentQty = cart[item.name] || 0;
                return (
                  <View style={styles.cartItemRow}>
                    <View style={styles.cartItemDetailsLeft}>
                      <View style={styles.itemIconContainer}>
                        <MaterialCommunityIcons
                          name="package-variant-closed"
                          size={22}
                          color="#18A06A"
                        />
                      </View>
                      <View style={{ marginLeft: 12, flex: 1 }}>
                        <Text style={styles.cartItemNameText}>
                          {item.item_name}
                        </Text>
                        <Text style={styles.cartItemSubText}>
                          {item.name} · {item.stock_uom || "Nos"}
                        </Text>
                      </View>

                      <TouchableOpacity
                        onPress={() => handleRemoveEntireItem(item.name)}
                        style={styles.trashIconWrapper}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={20}
                          color="#EF4444"
                        />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.cartQuantityStepperContainer}>
                      <TouchableOpacity
                        style={styles.stepperButton}
                        onPress={() => handleDecreaseCartQty(item.name)}
                      >
                        <Ionicons name="remove" size={20} color="#18A06A" />
                      </TouchableOpacity>
                      <Text style={styles.cartQuantityValueText}>
                        {currentQty}
                      </Text>
                      <TouchableOpacity
                        style={styles.stepperButton}
                        onPress={() => handleIncreaseCartQty(item.name)}
                      >
                        <Ionicons name="add" size={20} color="#18A06A" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              }}
            />

            <TouchableOpacity
              style={styles.submitReceiptButton}
              onPress={handleSavePurchaseReceipt}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitReceiptText}>Submit Receipt</Text>
              )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },
  header: {
    backgroundColor: "#18A06A",
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: { flexDirection: "row", alignItems: "center" },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 10,
  },
  cartButton: {
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.22)",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  cartText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  cartBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 6,
  },
  cartBadgeText: { color: "#18A06A", fontSize: 13, fontWeight: "800" },
  formSection: {
    backgroundColor: "#fff",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  inputBox: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#F9FAFB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  inputText: { fontSize: 15, color: "#9CA3AF" },
  row: {
    flexDirection: "row",
    marginTop: 14,
    alignItems: "center",
    justifyContent: "space-between",
  },
  storeBox: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 8,
    marginRight: 8,
    backgroundColor: "#FAFAFA",
  },
  storeLabel: { fontSize: 12, fontWeight: "700", color: "#6B7280" },
  storeText: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "600",
    marginTop: 1,
  },
  dateBox: {
    width: 140,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateText: { fontSize: 13, color: "#111827", fontWeight: "600" },
  searchWrapper: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  searchBox: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15, color: "#111827" },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#18A06A",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  tabsContainer: {
    backgroundColor: "#fff",
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  activeTab: { backgroundColor: "#18A06A", borderColor: "#18A06A" },
  activeTabText: { color: "#fff", fontWeight: "700" },
  inactiveTab: {
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 18,
    marginRight: 8,
  },
  inactiveTabText: { color: "#6B7280", fontSize: 14, fontWeight: "600" },
  card: {
    width: CARD_WIDTH,
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 12,
  },
  activeCardBorder: { borderColor: "#18A06A", borderWidth: 1.5 },
  categoryText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9CA3AF",
    marginBottom: 6,
  },
  productName: { fontSize: 15, fontWeight: "800", color: "#111827" },
  codeText: { fontSize: 12, color: "#9CA3AF", marginTop: 4, marginBottom: 10 },
  stateBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#E8F7F0",
    marginBottom: 12,
  },
  stateBadgeText: { color: "#18A06A", fontSize: 11, fontWeight: "700" },
  addButton: {
    height: 38,
    borderRadius: 10,
    backgroundColor: "#18A06A",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 4,
  },
  qtyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  qtyButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#18A06A",
    justifyContent: "center",
    alignItems: "center",
  },
  qtyText: { fontSize: 16, fontWeight: "800", color: "#111827" },

  /* OVERLAY SELECTIONS DECORATIONS */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  pickerModalContainer: {
    width: "85%",
    maxHeight: "60%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 14,
  },
  pickerItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  pickerMainText: { fontSize: 15, color: "#111827", fontWeight: "600" },
  pickerSubText: { fontSize: 12, color: "#6B7280", marginTop: 2 },

  /* NATIVE IOS DATE PICKER STYLE SETS */
  iosDatePickerContainer: {
    backgroundColor: "#f9f9f9",
    marginTop: 10,
    borderRadius: 12,
    paddingBottom: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  iosDoneButton: {
    alignSelf: "flex-end",
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginRight: 10,
    backgroundColor: "#18A06A",
    borderRadius: 8,
  },
  iosDoneButtonText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  /* CART BOTTOM SHEET LAYOUT DESIGN ELEMENTS */
  modalBottomOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  cartBottomSheetContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 34,
    maxHeight: "80%",
  },
  pullBarIndicator: {
    width: 50,
    height: 5,
    backgroundColor: "#E5E7EB",
    borderRadius: 3,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 14,
  },
  cartModalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  cartModalTitleText: { fontSize: 18, fontWeight: "700", color: "#111827" },
  cartItemRow: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  cartItemDetailsLeft: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  itemIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#E8F7F0",
    justifyContent: "center",
    alignItems: "center",
  },
  cartItemNameText: { fontSize: 15, fontWeight: "700", color: "#111827" },
  cartItemSubText: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  trashIconWrapper: { padding: 6 },
  cartQuantityStepperContainer: {
    flexDirection: "row",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    height: 48,
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  stepperButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  cartQuantityValueText: { fontSize: 16, fontWeight: "700", color: "#111827" },
  submitReceiptButton: {
    backgroundColor: "#18A06A",
    height: 50,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  submitReceiptText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  /* 5. ADDED CUSTOM STYLES FOR THE LIVE CAMERA SCANNER MODAL WINDOW */
  cameraScreenContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  cameraOverlayMask: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  reticleTargetFrame: {
    width: 260,
    height: 260,
    position: "relative",
    backgroundColor: "transparent",
  },
  cornerMarker: {
    position: "absolute",
    width: 32,
    height: 32,
    borderColor: "#18A06A",
  },
  topLeftCorner: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 },
  topRightCorner: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 },
  bottomLeftCorner: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRightCorner: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  cameraInstructionsText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 30,
    paddingHorizontal: 30,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 4,
  },
  closeCameraFabButton: {
    position: "absolute",
    top: 50,
    right: 20,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
});
