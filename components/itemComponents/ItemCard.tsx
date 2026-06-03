import { ItemType } from "@/types/itemType";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 44) / 2;

interface ItemCardProps {
  item: ItemType;
  siteUrl: string;
  themeColor: string;
  currentQty: number;
  currentSelectedUnit: string;
  isUomDropdownOpen: boolean;
  availableUnits: string[];
  onSetQty: (itemCode: string, qty: number) => void;
  onSelectUom: (itemCode: string, uom: string) => void;
  onToggleUomMenu: (itemCode: string | null) => void;
  translations: {
    add?: string;
  };
}

export const ItemCard: React.FC<ItemCardProps> = ({
  item,
  siteUrl,
  themeColor,
  currentQty,
  currentSelectedUnit,
  isUomDropdownOpen,
  availableUnits,
  onSetQty,
  onSelectUom,
  onToggleUomMenu,
  translations: t,
}) => {
  const imageUri = item.image
    ? item.image.startsWith("http")
      ? item.image
      : `${siteUrl}${item.image}`
    : null;

  return (
    <View style={[styles.card, currentQty > 0 && { borderColor: themeColor }]}>
      {/* IMAGE OR PLACEHOLDER */}
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

      {/* HEADER AREA — hosts the floating UOM dropdown */}
      <View style={styles.cardHeaderArea}>
        <Text style={styles.categoryText}>
          {item.item_group?.toUpperCase()}
        </Text>

        {isUomDropdownOpen && (
          <View style={styles.uomFloatingDropdown}>
            {availableUnits.map((unit) => (
              <TouchableOpacity
                key={unit}
                style={[
                  styles.uomDropdownItem,
                  currentSelectedUnit === unit && {
                    backgroundColor: themeColor,
                  },
                ]}
                onPress={() => {
                  onSelectUom(item.name, unit);
                  onToggleUomMenu(null);
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
        onPress={() =>
          onToggleUomMenu(isUomDropdownOpen ? null : item.name)
        }
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

      {/* ADD / QTY CONTROLS */}
      {currentQty === 0 ? (
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: themeColor }]}
          onPress={() => onSetQty(item.name, 1)}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addButtonText}>{t.add}</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.qtyRow}>
          <TouchableOpacity
            style={styles.qtyButton}
            onPress={() => onSetQty(item.name, currentQty - 1)}
          >
            <Ionicons name="remove" size={18} color={themeColor} />
          </TouchableOpacity>
          <TextInput
            keyboardType="numeric"
            style={styles.qtyInput}
            value={String(currentQty)}
            onChangeText={(text) => {
              const parsed = parseInt(text.replace(/[^0-9]/g, ""), 10);
              onSetQty(item.name, isNaN(parsed) ? 0 : parsed);
            }}
            selectTextOnFocus
          />
          <TouchableOpacity
            style={styles.qtyButton}
            onPress={() => onSetQty(item.name, currentQty + 1)}
          >
            <Ionicons name="add" size={18} color={themeColor} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 10,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
  },
  itemImage: {
    width: "100%",
    height: 100,
    borderRadius: 10,
    marginBottom: 8,
  },
  itemImagePlaceholder: {
    width: "100%",
    height: 100,
    borderRadius: 10,
    marginBottom: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  cardHeaderArea: {
    position: "relative",
    zIndex: 5,
    minHeight: 18,
    justifyContent: "center",
    marginBottom: 2,
  },
  categoryText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#9CA3AF",
    letterSpacing: 0.5,
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
  productName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
    padding: 0,
  },
  codeText: { fontSize: 11, color: "#6B7280", marginTop: 1, marginBottom: 6 },
  stateBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 8,
  },
  stateBadgeText: { fontSize: 11, fontWeight: "600" },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 34,
    borderRadius: 8,
    marginTop: 4,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
    marginLeft: 4,
  },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  qtyButton: {
    width: 34,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  qtyInput: {
    flex: 1,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    padding: 0,
  },
});
