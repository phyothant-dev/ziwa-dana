import { useSettingsStore } from "@/stores/settingsStore"; // Added to respond to theme state changes
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
    Dimensions,
    GestureResponderEvent,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const { width } = Dimensions.get("window");
const isSmallDevice = width < 380;

interface ScreenHeaderProps {
  title: string;
  themeColor: string;
  showBackButton?: boolean;
  onBackPress?: (event: GestureResponderEvent) => void;
  rightAction?: React.ReactNode;
  ignoreWrapperPadding?: boolean; // Toggle this if a screen wrapper forces unwanted padding
}

export function ScreenHeader({
  title,
  themeColor,
  showBackButton = true,
  onBackPress,
  rightAction,
  ignoreWrapperPadding = false,
}: ScreenHeaderProps) {
  // Pull the responsive text color mode directly from your state manager
  const textColorMode = useSettingsStore((state) => state.textColorMode);
  const contentColor = textColorMode === "dark" ? "#111827" : "#FFFFFF";

  const handleBack = (event: GestureResponderEvent) => {
    if (onBackPress) {
      onBackPress(event);
    } else {
      router.back();
    }
  };

  return (
    <View
      style={[
        styles.outerContainer,
        { backgroundColor: themeColor },
        ignoreWrapperPadding && styles.breakoutMargins, // Dynamically breaks out of padding if needed
      ]}
    >
      <View style={styles.headerInner}>
        <View style={styles.headerLeft}>
          {showBackButton ? (
            <TouchableOpacity
              onPress={handleBack}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color={contentColor} />
            </TouchableOpacity>
          ) : (
            <View style={styles.noBackButtonSpacer} />
          )}
          <Text
            style={[styles.headerTitle, { color: contentColor }]}
            numberOfLines={1}
          >
            {title}
          </Text>
        </View>

        {rightAction && <View style={styles.headerRight}>{rightAction}</View>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    paddingHorizontal: 16,
  },
  breakoutMargins: {
    marginHorizontal: -18, // Adjusts dynamically for screens wrapped in paddings (like settings_2.tsx layout)
  },
  headerInner: {
    height: isSmallDevice ? 56 : 64,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    height: "100%",
  },
  backButton: {
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    paddingRight: 12,
  },
  noBackButtonSpacer: {
    width: 4,
  },
  headerTitle: {
    fontSize: isSmallDevice ? 18 : 20,
    fontWeight: "700",
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    height: "100%",
  },
});
