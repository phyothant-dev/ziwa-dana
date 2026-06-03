import { ItemType } from "@/types/itemType";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface CartModalProps {
  visible: boolean;
  onClose: () => void;
  items: ItemType[];
  cart: Record<string, number>;
  selectedUoms: Record<string, string>;
  siteUrl: string;
  themeColor: string;
  submitting: boolean;
  onIncrease: (itemCode: string) => void;
  onDecrease: (itemCode: string) => void;
  onRemove: (itemCode: string) => void;
  onCheckout: () => void;
  translations: {
    cart?: string;
    addPurchase?: string;
  };
}

export const CartModal: React.FC<CartModalProps> = ({
  visible,
  onClose,
  items,
  cart,
  selectedUoms,
  siteUrl,
  themeColor,
  submitting,
  onIncrease,
  onDecrease,
  onRemove,
  onCheckout,
  translations: t,
}) => {
  const cartItems = items.filter((item) => (cart[item.name] || 0) > 0);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableOpacity
        style={styles.modalBottomOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.cartBottomSheetContainer}>
          <View style={styles.pullBarIndicator} />
          <View style={styles.cartModalHeaderRow}>
            <Text style={styles.cartModalTitleText}>🛒 {t.cart}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={cartItems}
            keyExtractor={(item) => item.name}
            contentContainerStyle={{ paddingVertical: 10 }}
            renderItem={({ item }) => {
              const currentQty = cart[item.name] || 0;
              const resolvedUom =
                selectedUoms[item.name] || item.stock_uom || "Nos";
              const imageUri = item.image
                ? item.image.startsWith("http")
                  ? item.image
                  : `${siteUrl}${item.image}`
                : null;

              return (
                <View style={styles.cartItemRow}>
                  <View style={styles.cartItemDetailsLeft}>
                    {imageUri ? (
                      <Image
                        source={{ uri: imageUri }}
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
                        {item.name} • {resolvedUom}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cartActionRowRight}>
                    <View style={styles.cartQtyControlBadge}>
                      <TouchableOpacity
                        style={styles.cartQtyActionBtn}
                        onPress={() => onDecrease(item.name)}
                      >
                        <Ionicons name="remove" size={16} color="#4B5563" />
                      </TouchableOpacity>
                      <Text style={styles.cartQtyDisplayNumberText}>
                        {currentQty}
                      </Text>
                      <TouchableOpacity
                        style={styles.cartQtyActionBtn}
                        onPress={() => onIncrease(item.name)}
                      >
                        <Ionicons name="add" size={16} color="#4B5563" />
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                      style={styles.cartTrashActionBtn}
                      onPress={() => onRemove(item.name)}
                    >
                      <Ionicons name="trash-outline" size={20} color="#EF4444" />
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
              onPress={onCheckout}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.checkoutConfirmBtnText}>
                  {t.addPurchase}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
});
