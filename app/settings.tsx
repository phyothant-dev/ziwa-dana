import { ScreenHeader } from "@/components/ScreenHeader";
import ScreenWrapper from "@/components/ScreenWrapper";
import { CustomColorPickerModal } from "@/components/settingsComponents/CustomColorPickerModal";
import { themeColors } from "@/constants/themeColors";
import { translations } from "@/locales";
import { useSettingsStore } from "@/stores/settingsStore";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    Alert,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function SettingsScreen() {
  const themeColor = useSettingsStore((state) => state.themeColor);
  const setThemeColor = useSettingsStore((state) => state.setThemeColor);
  const language = useSettingsStore((state) => state.language);
  const setLanguage = useSettingsStore((state) => state.setLanguage);
  const textColorMode = useSettingsStore((state) => state.textColorMode);
  const setTextColorMode = useSettingsStore((state) => state.setTextColorMode);

  const [pendingColor, setPendingColor] = useState(themeColor);
  const [pendingLanguage, setPendingLanguage] = useState(language);
  const [pendingTextColorMode, setPendingTextColorMode] =
    useState(textColorMode);

  const synced = useRef(false);
  useEffect(() => {
    if (!synced.current) {
      synced.current = true;
      setPendingColor(themeColor);
      setPendingLanguage(language);
      setPendingTextColorMode(textColorMode);
    }
  }, [themeColor, language, textColorMode]);

  const t = translations[pendingLanguage];

  const previewTextColor =
    pendingTextColorMode === "dark" ? "#111827" : "#FFFFFF";

  const [showPicker, setShowPicker] = useState(false);
  const [tempColor, setTempColor] = useState(pendingColor);

  const openPicker = () => {
    setTempColor(pendingColor);
    setShowPicker(true);
  };

  const confirmColor = () => {
    setPendingColor(tempColor);
    setShowPicker(false);
  };

  const cancelPicker = () => {
    setShowPicker(false);
  };

  const handleSave = () => {
    setThemeColor(pendingColor);
    setLanguage(pendingLanguage);
    setTextColorMode(pendingTextColorMode);

    Alert.alert(
      pendingLanguage === "mm" ? "သိမ်းပြီးပါပြီ" : "Settings Saved",
      pendingLanguage === "mm"
        ? "ဘာသာစကား၊ အရောင်နှင့် စာလုံးအရောင်ကို သိမ်းပြီးပါပြီ"
        : "Language, theme color and text color updated successfully",
      [{ text: "OK", onPress: () => router.back() }],
    );
  };

  return (
    <>
      <StatusBar barStyle="light-content" />

      <ScreenWrapper>
        <ScreenHeader
          title={t.settings} // or t.settings
          themeColor={themeColor}
        />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* ── Language ── */}
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {t.language.toUpperCase()}
              </Text>
            </View>

            <View style={styles.row}>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  pendingLanguage === "mm" && {
                    borderColor: pendingColor,
                    backgroundColor: "#EEF8F4",
                  },
                ]}
                onPress={() => setPendingLanguage("mm")}
              >
                <Text style={styles.flag}>🇲🇲</Text>
                <Text style={styles.optionText}>Myanmar</Text>
                {pendingLanguage === "mm" && (
                  <Ionicons name="checkmark" size={22} color={pendingColor} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.optionButton,
                  pendingLanguage === "en" && {
                    borderColor: pendingColor,
                    backgroundColor: "#EEF8F4",
                  },
                ]}
                onPress={() => setPendingLanguage("en")}
              >
                <Text style={styles.flag}>🇬🇧</Text>
                <Text style={styles.optionText}>English</Text>
                {pendingLanguage === "en" && (
                  <Ionicons name="checkmark" size={22} color={pendingColor} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Theme ── */}
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {pendingLanguage === "mm" ? "အရောင်" : "THEME"}
              </Text>
              <Text style={styles.sectionDescription}>
                {pendingLanguage === "mm"
                  ? "ရွေးချယ်နိုင်သော အရောင်များ"
                  : "Available Colors"}
              </Text>
            </View>

            <View style={styles.colorGrid}>
              {themeColors.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorBox,
                    { backgroundColor: color },
                    pendingColor === color && styles.selectedColorBox,
                  ]}
                  onPress={() => setPendingColor(color)}
                >
                  {pendingColor === color && (
                    <Ionicons name="checkmark" size={22} color="#fff" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Selected Color → tappable color picker */}
            <Text style={styles.label}>
              {pendingLanguage === "mm" ? "ကိုယ်တိုင်ရွေးရန်" : "Custom Color"}
            </Text>

            <TouchableOpacity
              style={styles.selectedPreview}
              onPress={openPicker}
              activeOpacity={0.8}
            >
              <View
                style={[styles.previewColor, { backgroundColor: pendingColor }]}
              />
              <View>
                <Text style={styles.hexText}>{pendingColor.toUpperCase()}</Text>
                <Text style={styles.tapHint}>
                  {pendingLanguage === "mm"
                    ? "နှိပ်၍ ပြောင်းရန်"
                    : "Tap to change"}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Text Color */}
            <Text style={[styles.label, { marginTop: 24 }]}>
              {pendingLanguage === "mm" ? "စာလုံးအရောင်" : "Text Color"}
            </Text>

            <View style={styles.row}>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  pendingTextColorMode === "light" && {
                    borderColor: pendingColor,
                    backgroundColor: "#EEF8F4",
                  },
                ]}
                onPress={() => setPendingTextColorMode("light")}
              >
                <View style={styles.whiteColorBox} />
                <Text style={styles.optionText}>
                  {pendingLanguage === "mm" ? "အဖြူ" : "White"}
                </Text>
                {pendingTextColorMode === "light" && (
                  <Ionicons name="checkmark" size={22} color={pendingColor} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.optionButton,
                  pendingTextColorMode === "dark" && {
                    borderColor: pendingColor,
                    backgroundColor: "#EEF8F4",
                  },
                ]}
                onPress={() => setPendingTextColorMode("dark")}
              >
                <View style={styles.blackColorBox} />
                <Text style={styles.optionText}>
                  {pendingLanguage === "mm" ? "အမည်း" : "Black"}
                </Text>
                {pendingTextColorMode === "dark" && (
                  <Ionicons name="checkmark" size={22} color={pendingColor} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Preview — uses pending values ── */}
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {pendingLanguage === "mm" ? "နမူနာပုံ" : "PREVIEW"}
              </Text>
            </View>

            <View style={styles.previewBox}>
              <View
                style={[
                  styles.previewHeader,
                  { backgroundColor: pendingColor },
                ]}
              >
                <Text
                  style={[
                    styles.previewHeaderText,
                    { color: previewTextColor },
                  ]}
                >
                  📦{" "}
                  {pendingLanguage === "mm"
                    ? "ကုန်လက်ခံလွှာ"
                    : "Purchase Receipt"}
                </Text>
              </View>

              <View style={styles.previewContent}>
                <TouchableOpacity
                  style={[
                    styles.previewButton,
                    { backgroundColor: pendingColor },
                  ]}
                >
                  <Text
                    style={[
                      styles.previewButtonText,
                      { color: previewTextColor },
                    ]}
                  >
                    {pendingLanguage === "mm" ? "ထည့်မည်" : "Add"}
                  </Text>
                </TouchableOpacity>

                <View
                  style={[
                    styles.previewBadge,
                    { borderColor: `${pendingColor}55` },
                  ]}
                >
                  <Text
                    style={[styles.previewBadgeText, { color: pendingColor }]}
                  >
                    {pendingLanguage === "mm" ? "နမူနာ Badge" : "Sample Badge"}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* ── Save ── */}
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: pendingColor }]}
            onPress={handleSave}
          >
            <Text style={[styles.saveText, { color: previewTextColor }]}>
              {t.save}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </ScreenWrapper>

      <CustomColorPickerModal
        isVisible={showPicker}
        onClose={cancelPicker}
        onConfirm={confirmColor}
        tempColor={tempColor}
        setTempColor={setTempColor}
        pendingLanguage={pendingLanguage}
      />
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 90,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
  },
  headerTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 14,
  },
  headerIcon: {
    fontSize: 22,
    marginRight: 8,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: "#F7F7F7",
    borderRadius: 26,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#E2E5E9",
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#6B7280",
    letterSpacing: 0.8,
  },
  sectionDescription: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 6,
    lineHeight: 20,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  optionButton: {
    width: "48%",
    height: 60,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#D9DCE1",
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
  },
  flag: {
    fontSize: 20,
  },
  optionText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#111827",
  },
  label: {
    fontSize: 15,
    color: "#9CA3AF",
    marginBottom: 16,
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  colorBox: {
    width: 62,
    height: 62,
    borderRadius: 16,
    marginBottom: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedColorBox: {
    borderWidth: 4,
    borderColor: "#111827",
  },
  selectedPreview: {
    flexDirection: "row",
    alignItems: "center",
  },
  previewColor: {
    width: 74,
    height: 74,
    borderRadius: 18,
    marginRight: 16,
    borderWidth: 4,
    borderColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  hexText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#4B5563",
  },
  tapHint: {
    fontSize: 13,
    color: "#9CA3AF",
    marginTop: 4,
  },
  whiteColorBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#D1D5DB",
  },
  blackColorBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#0F172A",
  },
  previewBox: {
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E5E9",
  },
  previewHeader: {
    padding: 22,
  },
  previewHeaderText: {
    fontSize: 18,
    fontWeight: "700",
  },
  previewContent: {
    backgroundColor: "#fff",
    padding: 22,
    flexDirection: "row",
    alignItems: "center",
  },
  previewButton: {
    height: 66,
    paddingHorizontal: 32,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  previewButtonText: {
    fontSize: 18,
    fontWeight: "700",
  },
  previewBadge: {
    borderWidth: 2,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#EEF8F4",
  },
  previewBadgeText: {
    fontSize: 16,
    fontWeight: "700",
  },
  saveButton: {
    height: 84,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  saveText: {
    fontSize: 22,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 48,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  modalCancelBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  modalConfirmBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  modalSwatchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 14,
  },
  modalSwatch: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: "#F3F4F6",
  },
  modalHexText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1F2937",
    letterSpacing: 1,
  },
  pickerWrap: {
    height: 300,
  },
});
