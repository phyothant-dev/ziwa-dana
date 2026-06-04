import { ItemCard } from "@/components/itemComponents/ItemCard";
import { BarcodeScannerModal } from "@/components/purchaseReceiptComponents/BarcodeScannerModal";
import { CartModal } from "@/components/purchaseReceiptComponents/CartModal";
import {
    PickerItem,
    SearchablePickerModal,
} from "@/components/purchaseReceiptComponents/SearchablePickerModal";
import { ScreenHeader } from "@/components/ScreenHeader";
import ScreenWrapper from "@/components/ScreenWrapper";
import { translations } from "@/locales/index";
import { debugGetSupplierDoc } from "@/services/frappeService";
import { getItems } from "@/services/itemService";
import { parseFrappeError } from "@/services/parseFrappeErrorService";
import { createPurchaseReceipt } from "@/services/purchaseReceiptService";
import { getSuppliers } from "@/services/supplierService";
import { getWarehouses } from "@/services/warehouseService";
import { useSettingsStore } from "@/stores/settingsStore";
import { ItemType } from "@/types/itemType";
import { SupplierType } from "@/types/supplierType";
import { WarehouseType } from "@/types/warehouseType";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker, {
    DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Camera } from "expo-camera";
import * as Print from "expo-print";
import { router, useLocalSearchParams } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function PurchaseScreen() {
  const { supplierName } = useLocalSearchParams<{ supplierName?: string }>();
  const { language, themeColor, loadSettings } = useSettingsStore();
  const t = translations[language] || translations["mm"];

  const [siteUrl, setSiteUrl] = useState("");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [sortBy, setSortBy] = useState("Name A→Z");
  const [sortMenuVisible, setSortMenuVisible] = useState(false);

  const [supplierSearch, setSupplierSearch] = useState("");
  const [warehouseSearch, setWarehouseSearch] = useState("");

  const [items, setItems] = useState<ItemType[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierType[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseType[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [selectedSupplier, setSelectedSupplier] = useState<SupplierType | null>(
    null,
  );
  const [selectedWarehouse, setSelectedWarehouse] =
    useState<WarehouseType | null>(null);

  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [supplierModalVisible, setSupplierModalVisible] = useState(false);
  const [warehouseModalVisible, setWarehouseModalVisible] = useState(false);
  const [cartModalVisible, setCartModalVisible] = useState(false);
  const [cameraModalVisible, setCameraModalVisible] = useState(false);

  const [cart, setCart] = useState<Record<string, number>>({});
  const [selectedUoms, setSelectedUoms] = useState<Record<string, string>>({});
  const [activeUomMenu, setActiveUomMenu] = useState<string | null>(null);

  const sortOptions = [
    { id: "Name A→Z", label: t.sortNameAZ },
    { id: "Name Z→A", label: t.sortNameZA },
    { id: "Code A→Z", label: t.sortCodeAZ },
    { id: "Code Z→A", label: t.sortCodeZA },
    { id: "Group", label: t.sortGroup },
  ];

  useEffect(() => {
    loadSettings();
    SecureStore.getItemAsync("siteUrl").then((url) => {
      if (url) setSiteUrl(url);
    });
    loadFormMasterData();
  }, []);

  useEffect(() => {
    if (supplierName && suppliers.length > 0) {
      const matched = suppliers.find(
        (s) => s.supplier_name?.toLowerCase() === supplierName.toLowerCase(),
      );
      if (matched) setSelectedSupplier(matched);
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
        if (warehouseRes.data.length > 0)
          setSelectedWarehouse(warehouseRes.data[0]);
      }
    } catch (err) {
      console.log("Error loading master data:", err);
    } finally {
      setLoading(false);
    }
  };

  const formattedDisplayDate = useMemo(
    () => date.toISOString().split("T")[0],
    [date],
  );

  const onChangeDate = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (selectedDate) setDate(selectedDate);
  };

  // ── Cart handlers ──────────────────────────────────────────────────────────
  const handleSetQty = (itemCode: string, amount: number) => {
    setCart((prev) => ({ ...prev, [itemCode]: Math.max(0, amount) }));
  };
  const handleIncreaseCartQty = (itemCode: string) => {
    setCart((prev) => ({ ...prev, [itemCode]: (prev[itemCode] || 0) + 1 }));
  };
  const handleDecreaseCartQty = (itemCode: string) => {
    setCart((prev) => {
      const qty = prev[itemCode] || 0;
      if (qty <= 1) return prev;
      return { ...prev, [itemCode]: qty - 1 };
    });
  };
  const handleRemoveEntireItem = (itemCode: string) => {
    setCart((prev) => {
      const updated = { ...prev };
      delete updated[itemCode];
      return updated;
    });
  };

  const handlePrintSlip = async (
    receiptId: string,
    checkoutItems: { item_code: string; qty: number; uom: string }[],
  ) => {
    const totalQty = checkoutItems.reduce((sum, i) => sum + i.qty, 0);
    const itemRowsHtml = checkoutItems
      .map((ci) => {
        const master = items.find((i) => i.name === ci.item_code);
        const name = master?.item_name || ci.item_code;
        const uom = ci.uom || master?.stock_uom || "Nos";
        return `
  <tr>
    <td style="padding:3px 0;font-size:0.85rem;font-weight:bold;line-height:1.1;text-align:left;color:#000;vertical-align:top;">
      ${name}<br/>
      <span style="color:#444;font-size:0.7rem;font-weight:normal;letter-spacing:0.3px;">${ci.item_code}</span>
    </td>
    <td style="padding:3px 0;text-align:right;font-size:0.85rem;font-weight:bold;vertical-align:top;white-space:nowrap;color:#000;">
      ${ci.qty} ${uom}
    </td>
  </tr>`;
      })
      .join("");

    const html = `<html><head><meta name="viewport" content="width=device-width,initial-scale=1.0"/><style>
      @page{size:auto;margin:4mm}html,body{margin:0;padding:0;background:#fff;color:#000;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif}
      body{width:100%;box-sizing:border-box}.receipt-wrapper{width:100%;max-width:100%;padding:0 2px;box-sizing:border-box}
      .text-center{text-align:center}.receipt-header{margin-bottom:.8em;border-bottom:1.5px dashed #000;padding-bottom:.6em}
      .receipt-title{font-size:1.2rem;font-weight:bold;margin:0 0 2px 0;text-transform:uppercase;color:#000}
      .company-subtitle{font-size:.95rem;font-weight:bold;text-transform:uppercase;margin-top:1px;color:#000}
      .id-title{font-size:.85rem;font-weight:bold;margin:4px 0 0 0;color:#000}
      .info-table{width:100%;border-collapse:collapse;margin-bottom:.6em}
      .info-table td{font-size:.8rem;font-weight:normal;padding:2px 0;color:#000;line-height:1.2;vertical-align:top}
      .items-table{width:100%;border-collapse:collapse;margin-top:.6em;border-bottom:1.5px dashed #000}
      .items-table th{border-bottom:1.5px solid #000;padding:4px 0;text-align:left;font-size:.8rem;font-weight:bold;color:#000}
      .total-table{width:100%;border-collapse:collapse;margin-top:.6em;border-bottom:2px double #000}
      .total-table td{padding:.5em 0;font-size:1rem;font-weight:bold;color:#000}
      .footer{margin-top:1.5em;font-size:.75rem;font-weight:normal;text-align:center;color:#000;padding-bottom:.5em}
    </style></head><body>
    <div class="receipt-wrapper">
      <div class="receipt-header text-center">
        <h1 class="receipt-title">Purchase Receipt</h1>
        <div class="company-subtitle">ZIWA DANA</div>
        <div class="id-title">${receiptId}</div>
      </div>
      <table class="info-table">
        <tr>
          <td style="text-align:left;width:50%;">ကုန်သည်: &nbsp;<b>${selectedSupplier?.supplier_name || ""}</b></td>
          <td style="text-align:right;width:50%;">ရက်စွဲ: &nbsp;<b>${formattedDisplayDate}</b></td>
        </tr>
      </table>
      <table class="items-table"><thead><tr><th style="width:70%;">Item Name</th><th style="width:30%;text-align:right;">Qty</th></tr></thead>
      <tbody>${itemRowsHtml}</tbody></table>
      <table class="total-table"><tr><td style="text-align:left;">Items Total</td><td style="text-align:right;">${totalQty}</td></tr></table>
      <div class="footer"><p style="margin:0;">Ziwa Dana Mobile App</p></div>
    </div></body></html>`;

    try {
      await Print.printAsync({ html });
    } catch (err) {
      console.log("Printing Error:", err);
      Alert.alert(t.errorTitle, t.printErrorMsg);
    }
  };

  const handleSavePurchaseReceipt = async () => {
    if (!selectedSupplier) {
      Alert.alert(t.warningTitle, t.supplierWarningMsg);
      return;
    }
    if (!selectedWarehouse) {
      Alert.alert(t.warningTitle, t.warehouseWarningMsg);
      return;
    }
    const checkoutItems = Object.entries(cart)
      .filter(([_, qty]) => qty > 0)
      .map(([item_code, qty]) => {
        const master = items.find((i) => i.name === item_code);
        return {
          item_code,
          qty,
          uom: selectedUoms[item_code] || master?.stock_uom || "Nos",
        };
      });
    if (checkoutItems.length === 0) {
      Alert.alert(t.warningTitle, t.cartEmptyWarningMsg);
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
        const documentId = res.data?.name || "N/A";
        setCart({});
        setSelectedUoms({});
        setCartModalVisible(false);
        Alert.alert(
          t.successTitle,
          t.saveReceiptSuccessMsg,
          [
            {
              text: t.cancelBtn,
              style: "cancel",
              onPress: () => router.back(),
            },
            {
              text: t.printSlipBtn,
              onPress: async () => {
                await handlePrintSlip(documentId, checkoutItems);
                router.replace({
                  pathname: "/purchase_receipt",
                  params: { refresh: "true" },
                });
              },
            },
          ],
          { cancelable: false },
        );
      } else {
        Alert.alert(
          t.errorTitle,
          res.error || "Failed to save purchase receipt.",
        );
      }
    } catch (err: any) {
      Alert.alert(t.errorTitle, parseFrappeError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenScanner = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    if (status === "granted") {
      setCameraModalVisible(true);
    } else {
      Alert.alert(t.cameraPermissionDeniedTitle, t.cameraPermissionDeniedMsg);
    }
  };

  const handleBarcodeScanned = ({ data }: { type: string; data: string }) => {
    setCameraModalVisible(false);
    const matched = items.find(
      (p) => p.name?.toLowerCase() === data.trim().toLowerCase(),
    );
    if (matched) {
      setCart((prev) => ({
        ...prev,
        [matched.name]: (prev[matched.name] || 0) + 1,
      }));
      Alert.alert(
        t.itemAddedAlertTitle,
        t.itemAddedAlertMsg.replace("{{name}}", matched.item_name || ""),
      );
    } else {
      Alert.alert(
        t.notFoundTitle,
        t.notFoundBarcodeMsg.replace("{{code}}", data),
      );
    }
  };

  // ── Derived data ───────────────────────────────────────────────────────────
  const sortedAndFilteredData = useMemo(() => {
    let result = items.filter((item) => {
      const matchSearch =
        item.item_name?.toLowerCase().includes(search.toLowerCase()) ||
        item.name?.toLowerCase().includes(search.toLowerCase());
      const matchTab = activeTab === "All" || item.item_group === activeTab;
      return matchSearch && matchTab;
    });
    if (sortBy === "Name A→Z")
      result.sort((a, b) =>
        (a.item_name || "").localeCompare(b.item_name || ""),
      );
    else if (sortBy === "Name Z→A")
      result.sort((a, b) =>
        (b.item_name || "").localeCompare(a.item_name || ""),
      );
    else if (sortBy === "Code A→Z")
      result.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    else if (sortBy === "Code Z→A")
      result.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
    else if (sortBy === "Group")
      result.sort((a, b) =>
        (a.item_group || "").localeCompare(b.item_group || ""),
      );
    return result;
  }, [search, activeTab, items, sortBy]);

  const filteredSuppliers = useMemo(
    () =>
      suppliers.filter(
        (s) =>
          s.supplier_name
            ?.toLowerCase()
            .includes(supplierSearch.toLowerCase()) ||
          s.supplier_group
            ?.toLowerCase()
            .includes(supplierSearch.toLowerCase()),
      ),
    [supplierSearch, suppliers],
  );

  const filteredWarehouses = useMemo(
    () =>
      warehouses.filter(
        (w) =>
          w.warehouse_name
            ?.toLowerCase()
            .includes(warehouseSearch.toLowerCase()) ||
          w.name?.toLowerCase().includes(warehouseSearch.toLowerCase()),
      ),
    [warehouseSearch, warehouses],
  );

  const totalCartCount = useMemo(
    () => Object.values(cart).reduce((a, b) => a + b, 0),
    [cart],
  );

  const supplierPickerItems: PickerItem[] = filteredSuppliers.map((s) => ({
    id: s.name!,
    mainText: s.supplier_name,
    subText: s.supplier_group,
  }));

  const warehousePickerItems: PickerItem[] = filteredWarehouses.map((w) => ({
    id: w.name,
    mainText: w.warehouse_name,
    subText: w.name,
  }));

  return (
    <ScreenWrapper>
      <StatusBar barStyle="light-content" />

      {/* HEADER */}
      <ScreenHeader
        title={t.purchaseReceipt}
        themeColor={themeColor}
        rightAction={
          <TouchableOpacity
            style={styles.cartButton}
            onPress={() => setCartModalVisible(true)}
          >
            <Text style={styles.cartText}>{t.cart}</Text>
            <View style={styles.cartBadge}>
              <Text style={[styles.cartBadgeText, { color: themeColor }]}>
                {totalCartCount}
              </Text>
            </View>
          </TouchableOpacity>
        }
      />

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center" }}>
          <ActivityIndicator size="large" color={themeColor} />
        </View>
      ) : (
        <>
          {/* FORM SECTION */}
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
                  : t.selectSupplierPlaceholder}
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
                  color={themeColor}
                />
                <View style={{ marginLeft: 8, flex: 1 }}>
                  <Text style={styles.storeLabel}>{t.storesLabel}</Text>
                  <Text style={styles.storeText} numberOfLines={1}>
                    {selectedWarehouse
                      ? `- ${selectedWarehouse.warehouse_name}`
                      : t.selectWarehousePlaceholder}
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
                  Platform.OS === "ios"
                    ? styles.iosDatePickerContainer
                    : undefined
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
                    <Text style={styles.iosDoneButtonText}>{t.done}</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* SEARCH & SORT BAR */}
          <View style={styles.searchWrapper}>
            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={20} color="#9CA3AF" />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder={t.searchItemPlaceholder}
                placeholderTextColor="#9CA3AF"
                style={styles.searchInput}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.scannerIconButton,
                { backgroundColor: `${themeColor}15` },
              ]}
              onPress={handleOpenScanner}
            >
              <Ionicons name="qr-code-outline" size={22} color={themeColor} />
            </TouchableOpacity>

            <View style={{ zIndex: 999 }}>
              <TouchableOpacity
                style={[styles.dropdownTrigger, { borderColor: themeColor }]}
                onPress={() => setSortMenuVisible(!sortMenuVisible)}
              >
                <Text style={styles.dropdownTriggerText}>
                  {sortOptions.find((o) => o.id === sortBy)?.label}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={14}
                  color="#6B7280"
                  style={{ marginLeft: 4 }}
                />
              </TouchableOpacity>

              {sortMenuVisible && (
                <View style={styles.dropdownFloatingMenu}>
                  {sortOptions.map((option) => {
                    const isSelected = sortBy === option.id;
                    return (
                      <TouchableOpacity
                        key={option.id}
                        style={[
                          styles.dropdownMenuItem,
                          isSelected && { backgroundColor: themeColor },
                        ]}
                        onPress={() => {
                          setSortBy(option.id);
                          setSortMenuVisible(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.dropdownMenuText,
                            isSelected && { color: "#fff", fontWeight: "700" },
                          ]}
                        >
                          {isSelected ? `✓  ${option.label}` : option.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          </View>

          {/* TABS */}
          <View style={styles.tabsContainer}>
            {["All", "Raw Materials"].map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.inactiveTab,
                  activeTab === tab && [
                    styles.activeTab,
                    {
                      borderColor: themeColor,
                      backgroundColor: `${themeColor}12`,
                    },
                  ],
                ]}
                onPress={() => setActiveTab(tab)}
              >
                <Text
                  style={[
                    styles.inactiveTabText,
                    activeTab === tab && [
                      styles.activeTabText,
                      { color: themeColor },
                    ],
                  ]}
                >
                  {tab === "All" ? t.allTab : t.rawMaterialsTab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ITEM GRID */}
          <FlatList
            data={sortedAndFilteredData}
            keyExtractor={(item) => item.name}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: "space-between" }}
            contentContainerStyle={{ padding: 14, paddingBottom: 90 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const availableUnits = Array.from(
                new Set([
                  item.stock_uom,
                  ...(item.uoms?.map((u) => u.uom) || []),
                ]),
              ).filter(Boolean) as string[];

              return (
                <ItemCard
                  item={item}
                  siteUrl={siteUrl}
                  themeColor={themeColor}
                  currentQty={cart[item.name] || 0}
                  currentSelectedUnit={
                    selectedUoms[item.name] || item.stock_uom || "Nos"
                  }
                  isUomDropdownOpen={activeUomMenu === item.name}
                  availableUnits={availableUnits}
                  onSetQty={handleSetQty}
                  onSelectUom={(code, uom) =>
                    setSelectedUoms((prev) => ({ ...prev, [code]: uom }))
                  }
                  onToggleUomMenu={setActiveUomMenu}
                  translations={{ add: t.add }}
                />
              );
            }}
          />
        </>
      )}

      {/* BARCODE SCANNER MODAL */}
      <BarcodeScannerModal
        visible={cameraModalVisible}
        onClose={() => setCameraModalVisible(false)}
        onBarcodeScanned={handleBarcodeScanned}
        themeColor={themeColor}
        instructions={t.barcodeInstructions}
      />

      {/* SUPPLIER PICKER MODAL */}
      <SearchablePickerModal
        visible={supplierModalVisible}
        onClose={() => setSupplierModalVisible(false)}
        title={t.selectSupplierModalTitle}
        searchValue={supplierSearch}
        onSearchChange={setSupplierSearch}
        searchPlaceholder={t.searchSupplierPlaceholder}
        items={supplierPickerItems}
        height="70%"
        onSelect={(picked) => {
          const supplier = suppliers.find((s) => s.name === picked.id)!;
          setSelectedSupplier(supplier);
          setSupplierSearch("");
          setSupplierModalVisible(false);
          debugGetSupplierDoc(picked.id);
        }}
      />

      {/* WAREHOUSE PICKER MODAL */}
      <SearchablePickerModal
        visible={warehouseModalVisible}
        onClose={() => setWarehouseModalVisible(false)}
        title={t.selectWarehouseModalTitle}
        searchValue={warehouseSearch}
        onSearchChange={setWarehouseSearch}
        searchPlaceholder={t.searchWarehousePlaceholder}
        items={warehousePickerItems}
        height="60%"
        onSelect={(picked) => {
          const warehouse = warehouses.find((w) => w.name === picked.id)!;
          setSelectedWarehouse(warehouse);
          setWarehouseSearch("");
          setWarehouseModalVisible(false);
        }}
      />

      {/* CART MODAL */}
      <CartModal
        visible={cartModalVisible}
        onClose={() => setCartModalVisible(false)}
        items={items}
        cart={cart}
        selectedUoms={selectedUoms}
        siteUrl={siteUrl}
        themeColor={themeColor}
        submitting={submitting}
        onIncrease={handleIncreaseCartQty}
        onDecrease={handleDecreaseCartQty}
        onRemove={handleRemoveEntireItem}
        onCheckout={handleSavePurchaseReceipt}
        translations={{ cart: t.cart, addPurchase: t.addPurchase }}
      />

      {/* FLOATING CART FAB */}
      {totalCartCount > 0 && (
        <TouchableOpacity
          style={[styles.floatingCartFab, { backgroundColor: themeColor }]}
          onPress={() => setCartModalVisible(true)}
        >
          <Ionicons name="cart" size={20} color="#fff" />
          <Text style={styles.floatingCartText}>{t.cart}</Text>
          <View style={styles.floatingCartBadge}>
            <Text style={[styles.floatingCartBadgeText, { color: themeColor }]}>
              {totalCartCount}
            </Text>
          </View>
        </TouchableOpacity>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerLeft: { flexDirection: "row", alignItems: "center" },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    marginLeft: 12,
  },
  cartButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  cartText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  cartBadge: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginLeft: 6,
  },
  cartBadgeText: { fontSize: 12, fontWeight: "800" },
  formSection: {
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    backgroundColor: "#F9FAFB",
    marginBottom: 10,
  },
  inputText: { fontSize: 14, color: "#9CA3AF" },
  row: { flexDirection: "row", gap: 10 },
  storeBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 50,
    backgroundColor: "#F9FAFB",
  },
  storeLabel: { fontSize: 10, color: "#9CA3AF", fontWeight: "600" },
  storeText: { fontSize: 13, color: "#111827", fontWeight: "600" },
  dateBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 50,
    backgroundColor: "#F9FAFB",
    gap: 6,
  },
  dateText: { fontSize: 13, color: "#111827", fontWeight: "600" },
  iosDatePickerContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginTop: 8,
    overflow: "hidden",
  },
  iosDoneButton: {
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#F3F4F6",
  },
  iosDoneButtonText: { fontSize: 15, fontWeight: "700", color: "#2563EB" },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    gap: 8,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 38,
  },
  searchInput: { flex: 1, marginLeft: 6, fontSize: 14, color: "#111827" },
  scannerIconButton: {
    width: 38,
    height: 38,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  dropdownTrigger: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 38,
  },
  dropdownTriggerText: { fontSize: 12, color: "#374151", fontWeight: "600" },
  dropdownFloatingMenu: {
    position: "absolute",
    top: 42,
    right: 0,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    minWidth: 160,
    zIndex: 999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    padding: 4,
  },
  dropdownMenuItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 2,
  },
  dropdownMenuText: { fontSize: 13, color: "#374151" },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    gap: 8,
  },
  inactiveTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  activeTab: { borderWidth: 1.5 },
  inactiveTabText: { fontSize: 13, color: "#6B7280", fontWeight: "500" },
  activeTabText: { fontWeight: "700" },
  floatingCartFab: {
    position: "absolute",
    bottom: 24,
    alignSelf: "center",
    width: 160,
    height: 46,
    borderRadius: 23,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  floatingCartText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 6,
    marginRight: 6,
  },
  floatingCartBadge: {
    backgroundColor: "#fff",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  floatingCartBadgeText: { fontSize: 11, fontWeight: "800" },
});
