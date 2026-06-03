import { translations } from "@/locales/index";
import { debugGetSupplierDoc } from "@/services/frappeService";
import { getItems } from "@/services/itemService";
import { parseFrappeError } from "@/services/parseFrappeErrorService";
import { createPurchaseReceipt } from "@/services/purchaseReceiptService";
import { getSuppliers } from "@/services/supplierService";
import { getWarehouses } from "@/services/warehouseService";

import { useSettingsStore } from "@/stores/settingsStore";
import * as SecureStore from "expo-secure-store";

import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker, {
    DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Camera, CameraView } from "expo-camera";
import * as Print from "expo-print";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Image,
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

import { ItemType } from "@/types/itemType";
import { SupplierType } from "@/types/supplierType";
import { WarehouseType } from "@/types/warehouseType";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 44) / 2;

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

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
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
    if (Platform.OS === "android") setShowDatePicker(false);
    if (selectedDate) setDate(selectedDate);
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

  const handlePrintSlip = async (
    receiptId: string,
    checkoutItems: {
      item_code: string;
      qty: number;
      uom: string;
    }[],
  ) => {
    const totalQty = checkoutItems.reduce((sum, item) => sum + item.qty, 0);

    const itemRowsHtml = checkoutItems
      .map((cartItem) => {
        const masterDetails = items.find((i) => i.name === cartItem.item_code);
        const name = masterDetails?.item_name || cartItem.item_code;
        const uom = cartItem.uom || masterDetails?.stock_uom || "Nos";
        return `
  <tr>
    <td style="padding: 3px 0; font-size: 0.85rem; font-weight: bold; line-height: 1.1; text-align: left; color: #000; vertical-align: top;">
      ${name}<br/>
      <span style="color: #444; font-size: 0.7rem; font-weight: normal; letter-spacing: 0.3px;">${cartItem.item_code}</span>
    </td>
    <td style="padding: 3px 0; text-align: right; font-size: 0.85rem; font-weight: bold; vertical-align: top; white-space: nowrap; color: #000;">
      ${cartItem.qty} ${uom}
    </td>
  </tr>
`;
      })
      .join("");

    const receiptHtml = `
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <style>
      @page { size: auto; margin: 4mm; }
      html, body { margin: 0; padding: 0; background-color: #fff; color: #000; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      body { width: 100%; box-sizing: border-box; }
      .receipt-wrapper { width: 100%; max-width: 100%; padding: 0 2px; box-sizing: border-box; }
      .text-center { text-align: center; }
      .receipt-header { margin-bottom: 0.8em; border-bottom: 1.5px dashed #000; padding-bottom: 0.6em; }
      .receipt-title { font-size: 1.2rem; font-weight: bold; margin: 0 0 2px 0; text-transform: uppercase; color: #000; }
      .company-subtitle { font-size: 0.95rem; font-weight: bold; text-transform: uppercase; margin-top: 1px; color: #000; }
      .id-title { font-size: 0.85rem; font-weight: bold; margin: 4px 0 0 0; color: #000; }
      .info-table { width: 100%; border-collapse: collapse; margin-bottom: 0.6em; }
      .info-table td { font-size: 0.8rem; font-weight: normal; padding: 2px 0; color: #000; line-height: 1.2; vertical-align: top; }
      .items-table { width: 100%; border-collapse: collapse; margin-top: 0.6em; border-bottom: 1.5px dashed #000; }
      .items-table th { border-bottom: 1.5px solid #000; padding: 4px 0; text-align: left; font-size: 0.8rem; font-weight: bold; color: #000; }
      .total-table { width: 100%; border-collapse: collapse; margin-top: 0.6em; border-bottom: 2px double #000; }
      .total-table td { padding: 0.5em 0; font-size: 1rem; font-weight: bold; color: #000; }
      .footer { margin-top: 1.5em; font-size: 0.75rem; font-weight: normal; text-align: center; color: #000; padding-bottom: 0.5em; }
    </style>
  </head>
  <body>
    <div class="receipt-wrapper">
      <div class="receipt-header text-center">
        <h1 class="receipt-title">Purchase Receipt</h1>
        <div class="company-subtitle">ZIWA DANA</div>
        <div class="id-title">${receiptId}</div>
      </div>
      <table class="info-table">
        <tr>
          <td style="text-align: left; width: 50%;">ကုန်သည်: &nbsp;<b>${selectedSupplier?.supplier_name || ""}</b></td>
          <td style="text-align: right; width: 50%;">ရက်စွဲ: &nbsp;<b>${formattedDisplayDate}</b></td>
        </tr>
      </table>
      <table class="items-table">
        <thead>
          <tr>
            <th style="width: 70%;">Item Name</th>
            <th style="width: 30%; text-align: right;">Qty</th>
          </tr>
        </thead>
        <tbody>${itemRowsHtml}</tbody>
      </table>
      <table class="total-table">
        <tr>
          <td style="text-align: left;">Items Total</td>
          <td style="text-align: right;">${totalQty}</td>
        </tr>
      </table>
      <div class="footer">
        <p style="margin: 0;">Ziwa Dana Mobile App</p>
      </div>
    </div>
  </body>
</html>
`;

    try {
      await Print.printAsync({ html: receiptHtml });
    } catch (printError) {
      console.log("Printing Error:", printError);
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
        const itemMaster = items.find((i) => i.name === item_code);
        const resolvedUom =
          selectedUoms[item_code] || itemMaster?.stock_uom || "Nos";

        return {
          item_code,
          qty,
          uom: resolvedUom,
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
                  pathname: "/purchase_receipt", // your list route
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
    setHasPermission(status === "granted");
    if (status === "granted") {
      setCameraModalVisible(true);
    } else {
      Alert.alert(t.cameraPermissionDeniedTitle, t.cameraPermissionDeniedMsg);
    }
  };

  const handleBarcodeScanned = ({
    type,
    data,
  }: {
    type: string;
    data: string;
  }) => {
    setCameraModalVisible(false);
    const matchedItem = items.find(
      (product) => product.name?.toLowerCase() === data.trim().toLowerCase(),
    );
    if (matchedItem) {
      setCart((prev) => ({
        ...prev,
        [matchedItem.name]: (prev[matchedItem.name] || 0) + 1,
      }));
      Alert.alert(
        t.itemAddedAlertTitle,
        t.itemAddedAlertMsg.replace("{{name}}", matchedItem.item_name || ""),
      );
    } else {
      Alert.alert(
        t.notFoundTitle,
        t.notFoundBarcodeMsg.replace("{{code}}", data),
      );
    }
  };

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

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(
      (s) =>
        s.supplier_name?.toLowerCase().includes(supplierSearch.toLowerCase()) ||
        s.supplier_group?.toLowerCase().includes(supplierSearch.toLowerCase()),
    );
  }, [supplierSearch, suppliers]);

  const filteredWarehouses = useMemo(() => {
    return warehouses.filter(
      (w) =>
        w.warehouse_name
          ?.toLowerCase()
          .includes(warehouseSearch.toLowerCase()) ||
        w.name?.toLowerCase().includes(warehouseSearch.toLowerCase()),
    );
  }, [warehouseSearch, warehouses]);

  const totalCartCount = useMemo(() => {
    return Object.values(cart).reduce((a, b) => a + b, 0);
  }, [cart]);

  const renderItem = ({ item }: { item: ItemType }) => {
    const currentQty = cart[item.name] || 0;
    const isUomDropdownOpen = activeUomMenu === item.name;
    const currentSelectedUnit =
      selectedUoms[item.name] || item.stock_uom || "Nos";
    const availableUnitsFromFrappe = Array.from(
      new Set([item.stock_uom, ...(item.uoms?.map((u) => u.uom) || [])]),
    ).filter(Boolean);

    const imageUri = item.image
      ? item.image.startsWith("http")
        ? item.image
        : `${siteUrl}${item.image}`
      : null;

    return (
      <View
        style={[styles.card, currentQty > 0 && { borderColor: themeColor }]}
      >
        {/* ITEM IMAGE OR FALLBACK PLACEHOLDER */}
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={styles.itemImage}
            resizeMode="cover"
          />
        ) : (
          <View
            style={[
              styles.itemImagePlaceholder,
              { backgroundColor: `${themeColor}10` },
            ]}
          >
            <MaterialCommunityIcons
              name="image-off-outline"
              size={26}
              color={`${themeColor}50`}
            />
          </View>
        )}

        {/* CARD ACCORDION CONTROLLER FOR FLOATING MENUS */}
        <View style={styles.cardHeaderArea}>
          <Text style={styles.categoryText}>
            {item.item_group?.toUpperCase()}
          </Text>

          {/* FLOATING DROPDOWN FOR SELECTING UOM ALTERNATIVES */}
          {isUomDropdownOpen && (
            <View style={styles.uomFloatingDropdown}>
              {availableUnitsFromFrappe.map((unit) => (
                <TouchableOpacity
                  key={unit}
                  style={[
                    styles.uomDropdownItem,
                    currentSelectedUnit === unit && {
                      backgroundColor: themeColor,
                    },
                  ]}
                  onPress={() => {
                    setSelectedUoms((prev) => ({ ...prev, [item.name]: unit }));
                    setActiveUomMenu(null);
                  }}
                >
                  <Text
                    style={[
                      styles.uomDropdownItemText,
                      currentSelectedUnit === unit && {
                        color: "#fff",
                        fontWeight: "700",
                      },
                    ]}
                  >
                    {unit}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <Text style={styles.productName} numberOfLines={1}>
          {item.item_name}
        </Text>
        <Text style={styles.codeText}>{item.name}</Text>

        {/* UOM SELECTOR BADGE */}
        <TouchableOpacity
          style={[styles.stateBadge, { borderColor: `${themeColor}40` }]}
          onPress={() => setActiveUomMenu(isUomDropdownOpen ? null : item.name)}
        >
          <Text style={[styles.stateBadgeText, { color: themeColor }]}>
            {currentSelectedUnit}
          </Text>
          <Ionicons
            name="chevron-down"
            size={12}
            color={themeColor}
            style={{ marginLeft: 3 }}
          />
        </TouchableOpacity>

        {currentQty === 0 ? (
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: themeColor }]}
            onPress={() => handleSetQty(item.name, 1)}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addButtonText}>{t.add}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.qtyRow}>
            <TouchableOpacity
              style={styles.qtyButton}
              onPress={() => handleSetQty(item.name, currentQty - 1)}
            >
              <Ionicons name="remove" size={18} color={themeColor} />
            </TouchableOpacity>
            <TextInput
              keyboardType="numeric"
              style={styles.qtyInput}
              value={String(currentQty)}
              onChangeText={(text) => {
                const parsed = parseInt(text.replace(/[^0-9]/g, ""), 10);
                handleSetQty(item.name, isNaN(parsed) ? 0 : parsed);
              }}
              selectTextOnFocus
            />
            <TouchableOpacity
              style={styles.qtyButton}
              onPress={() => handleSetQty(item.name, currentQty + 1)}
            >
              <Ionicons name="add" size={18} color={themeColor} />
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
      <View style={[styles.header, { backgroundColor: themeColor }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t.purchaseReceipt}</Text>
        </View>
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
      </View>

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
            renderItem={renderItem}
            keyExtractor={(item) => item.name}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: "space-between" }}
            contentContainerStyle={{ padding: 14, paddingBottom: 90 }}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}

      {/* CAMERA MODAL */}
      <Modal
        visible={cameraModalVisible}
        animationType="slide"
        onRequestClose={() => setCameraModalVisible(false)}
      >
        <View style={styles.cameraScreenContainer}>
          <CameraView
            style={StyleSheet.absoluteFillObject}
            barcodeScannerSettings={{
              barcodeTypes: ["qr", "ean13", "ean8", "code128"],
            }}
            onBarcodeScanned={handleBarcodeScanned}
          />
          <View style={styles.cameraOverlayMask}>
            <View style={styles.reticleTargetFrame}>
              <View
                style={[
                  styles.cornerMarker,
                  styles.topLeftCorner,
                  { borderColor: themeColor },
                ]}
              />
              <View
                style={[
                  styles.cornerMarker,
                  styles.topRightCorner,
                  { borderColor: themeColor },
                ]}
              />
              <View
                style={[
                  styles.cornerMarker,
                  styles.bottomLeftCorner,
                  { borderColor: themeColor },
                ]}
              />
              <View
                style={[
                  styles.cornerMarker,
                  styles.bottomRightCorner,
                  { borderColor: themeColor },
                ]}
              />
            </View>
            <Text style={styles.cameraInstructionsText}>
              {t.barcodeInstructions}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.closeCameraFabButton}
            onPress={() => setCameraModalVisible(false)}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      </Modal>

      {/* SUPPLIER PICKER MODAL */}
      <Modal visible={supplierModalVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSupplierModalVisible(false)}
        >
          <View style={[styles.pickerModalContainer, { height: "70%" }]}>
            <Text style={styles.modalHeaderTitle}>
              {t.selectSupplierModalTitle}
            </Text>
            <View style={styles.modalSearchBox}>
              <Ionicons name="search-outline" size={18} color="#9CA3AF" />
              <TextInput
                style={styles.modalSearchInput}
                placeholder={t.searchSupplierPlaceholder}
                value={supplierSearch}
                onChangeText={setSupplierSearch}
              />
            </View>
            <FlatList
              data={filteredSuppliers}
              keyExtractor={(item) => item.name!}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerItem}
                  onPress={() => {
                    setSelectedSupplier(item);
                    setSupplierSearch("");
                    setSupplierModalVisible(false);
                    debugGetSupplierDoc(item.name!);
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

      {/* WAREHOUSE PICKER MODAL */}
      <Modal visible={warehouseModalVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setWarehouseModalVisible(false)}
        >
          <View style={[styles.pickerModalContainer, { height: "60%" }]}>
            <Text style={styles.modalHeaderTitle}>
              {t.selectWarehouseModalTitle}
            </Text>
            <View style={styles.modalSearchBox}>
              <Ionicons name="search-outline" size={18} color="#9CA3AF" />
              <TextInput
                style={styles.modalSearchInput}
                placeholder={t.searchWarehousePlaceholder}
                value={warehouseSearch}
                onChangeText={setWarehouseSearch}
              />
            </View>
            <FlatList
              data={filteredWarehouses}
              keyExtractor={(item) => item.name}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerItem}
                  onPress={() => {
                    setSelectedWarehouse(item);
                    setWarehouseSearch("");
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

      {/* CART BOTTOM SHEET MODAL */}
      <Modal visible={cartModalVisible} transparent animationType="slide">
        <TouchableOpacity
          style={styles.modalBottomOverlay}
          activeOpacity={1}
          onPress={() => setCartModalVisible(false)}
        >
          <View style={styles.cartBottomSheetContainer}>
            <View style={styles.pullBarIndicator} />
            <View style={styles.cartModalHeaderRow}>
              <Text style={styles.cartModalTitleText}>🛒 {t.cart}</Text>
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
                const resolvedCartUom =
                  selectedUoms[item.name] || item.stock_uom || "Nos";

                const cartImageUri = item.image
                  ? item.image.startsWith("http")
                    ? item.image
                    : `${siteUrl}${item.image}`
                  : null;

                return (
                  <View style={styles.cartItemRow}>
                    <View style={styles.cartItemDetailsLeft}>
                      {/* THUMBNAIL IN CART */}
                      {cartImageUri ? (
                        <Image
                          source={{ uri: cartImageUri }}
                          style={styles.cartItemThumbnail}
                          resizeMode="cover"
                        />
                      ) : (
                        <View
                          style={[
                            styles.itemIconContainer,
                            { backgroundColor: `${themeColor}12` },
                          ]}
                        >
                          <MaterialCommunityIcons
                            name="package-variant-closed"
                            size={22}
                            color={themeColor}
                          />
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cartItemNameText} numberOfLines={1}>
                          {item.item_name}
                        </Text>
                        <Text style={styles.cartItemCodeText}>
                          {item.name} • {resolvedCartUom}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.cartActionRowRight}>
                      <View style={styles.cartQtyControlBadge}>
                        <TouchableOpacity
                          style={styles.cartQtyActionBtn}
                          onPress={() => handleDecreaseCartQty(item.name)}
                        >
                          <Ionicons name="remove" size={16} color="#4B5563" />
                        </TouchableOpacity>
                        <Text style={styles.cartQtyDisplayNumberText}>
                          {currentQty}
                        </Text>
                        <TouchableOpacity
                          style={styles.cartQtyActionBtn}
                          onPress={() => handleIncreaseCartQty(item.name)}
                        >
                          <Ionicons name="add" size={16} color="#4B5563" />
                        </TouchableOpacity>
                      </View>
                      <TouchableOpacity
                        style={styles.cartTrashActionBtn}
                        onPress={() => handleRemoveEntireItem(item.name)}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={20}
                          color="#EF4444"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              }}
            />

            <View style={styles.cartFooterActions}>
              <TouchableOpacity
                disabled={submitting}
                style={[
                  styles.checkoutConfirmBtn,
                  { backgroundColor: themeColor },
                  submitting && { opacity: 0.7 },
                ]}
                onPress={handleSavePurchaseReceipt}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Text style={styles.checkoutConfirmBtnText}>
                      {t.addPurchase}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* FLOATING CART BUTTON */}
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
    </SafeAreaView>
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
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  cartText: { fontSize: 13, fontWeight: "600", color: "#fff", marginRight: 6 },
  cartBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: "#fff",
  },
  cartBadgeText: { fontSize: 11, fontWeight: "800" },
  formSection: {
    padding: 14,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  inputText: { fontSize: 14, color: "#9CA3AF" },
  row: { flexDirection: "row", justifyContent: "space-between" },
  storeBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    width: "58%",
  },
  storeLabel: { fontSize: 10, color: "#6B7280" },
  storeText: { fontSize: 12, fontWeight: "600", color: "#111827" },
  dateBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 12,
    width: "38%",
  },
  dateText: { fontSize: 12, fontWeight: "600", color: "#374151" },
  iosDatePickerContainer: {
    backgroundColor: "#fff",
    marginTop: 8,
    borderRadius: 8,
    paddingBottom: 10,
  },
  iosDoneButton: { alignItems: "flex-end", paddingRight: 16, paddingTop: 4 },
  iosDoneButtonText: { fontSize: 16, fontWeight: "600", color: "#007AFF" },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    marginTop: 12,
    zIndex: 99,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 24,
    paddingHorizontal: 12,
    height: 40,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  searchInput: { flex: 1, marginLeft: 6, fontSize: 14, color: "#111827" },
  scannerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  dropdownTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 40,
    marginLeft: 8,
    backgroundColor: "#fff",
  },
  dropdownTriggerText: { fontSize: 13, color: "#111827", fontWeight: "500" },
  dropdownFloatingMenu: {
    position: "absolute",
    top: 45,
    right: 0,
    backgroundColor: "#fff",
    borderRadius: 14,
    width: 145,
    paddingVertical: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  dropdownMenuItem: { paddingHorizontal: 14, paddingVertical: 10 },
  dropdownMenuText: { fontSize: 13, color: "#374151" },
  tabsContainer: { flexDirection: "row", paddingHorizontal: 14, marginTop: 12 },
  inactiveTab: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginRight: 8,
  },
  activeTab: { borderWidth: 1.5 },
  inactiveTabText: { fontSize: 13, color: "#6B7280", fontWeight: "500" },
  activeTabText: { fontWeight: "700" },

  card: {
    backgroundColor: "#fff",
    width: CARD_WIDTH,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  itemImage: {
    width: "100%",
    height: 90,
    borderRadius: 8,
    marginBottom: 8,
  },
  itemImagePlaceholder: {
    width: "100%",
    height: 90,
    borderRadius: 8,
    marginBottom: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#9CA3AF",
    marginBottom: 4,
  },
  productName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 2,
  },
  codeText: { fontSize: 11, color: "#6B7280", marginBottom: 6 },
  stateBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 12,
  },
  stateBadgeText: { fontSize: 10, fontWeight: "600", color: "#4B5563" },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 36,
    borderRadius: 8,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 4,
  },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 36,
  },
  qtyButton: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  qtyInput: {
    width: 40,
    textAlign: "center",
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    padding: 0,
  },
  cardHeaderArea: {
    position: "relative",
    zIndex: 5,
    minHeight: 18,
    justifyContent: "center",
    marginBottom: 2,
  },
  uomFloatingDropdown: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    borderRadius: 10,
    padding: 4,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    zIndex: 99,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  uomDropdownItem: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginBottom: 2,
  },
  uomDropdownItemText: { fontSize: 12, color: "#374151", textAlign: "center" },

  cameraScreenContainer: { flex: 1, backgroundColor: "#000" },
  cameraOverlayMask: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  reticleTargetFrame: { width: 240, height: 240, position: "relative" },
  cornerMarker: { position: "absolute", width: 24, height: 24, borderWidth: 4 },
  topLeftCorner: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  topRightCorner: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeftCorner: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRightCorner: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  cameraInstructionsText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 24,
    textAlign: "center",
    paddingHorizontal: 32,
  },
  closeCameraFabButton: {
    position: "absolute",
    top: 50,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  pickerModalContainer: {
    backgroundColor: "#fff",
    width: "90%",
    borderRadius: 16,
    padding: 16,
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  modalSearchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 38,
    marginBottom: 12,
  },
  modalSearchInput: { flex: 1, marginLeft: 6, fontSize: 14, color: "#111827" },
  pickerItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  pickerMainText: { fontSize: 14, fontWeight: "600", color: "#111827" },
  pickerSubText: { fontSize: 12, color: "#6B7280", marginTop: 2 },

  modalBottomOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  cartBottomSheetContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingBottom: 30,
    maxHeight: "80%",
  },
  pullBarIndicator: {
    width: 40,
    height: 4,
    backgroundColor: "#D1D5DB",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 12,
  },
  cartModalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  cartModalTitleText: { fontSize: 16, fontWeight: "700", color: "#111827" },
  cartItemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#F3F4F6",
  },
  cartItemDetailsLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 10,
  },
  cartItemThumbnail: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 12,
  },
  itemIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  cartItemNameText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 2,
  },
  cartItemCodeText: { fontSize: 12, color: "#6B7280" },
  cartActionRowRight: { flexDirection: "row", alignItems: "center" },
  cartQtyControlBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginRight: 12,
  },
  cartQtyActionBtn: {
    padding: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  cartQtyDisplayNumberText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F2937",
    paddingHorizontal: 8,
    minWidth: 24,
    textAlign: "center",
  },
  cartTrashActionBtn: {
    padding: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  cartFooterActions: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 14,
  },
  checkoutConfirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 46,
    borderRadius: 8,
  },
  checkoutConfirmBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 6,
  },

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
