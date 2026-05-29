import { translations } from "@/locales";
import { useSettingsStore } from "@/stores/settingsStore";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const [email, setEmail] = useState<string>("");
  const [avatarAbbr, setAvatarAbbr] = useState<string>("??");

  // Extract values directly from store
  const { language, themeColor, loadSettings } = useSettingsStore();

  // Clean translation helper
  const t = translations[language];

  // Sync settings and metadata on mount
  useEffect(() => {
    loadSettings();

    const loadUserData = async () => {
      try {
        const storedEmail = await AsyncStorage.getItem("email");
        if (storedEmail) {
          setEmail(storedEmail);

          const cleanName = storedEmail.split("@")[0];
          if (cleanName.length >= 2) {
            setAvatarAbbr(cleanName.substring(0, 2).toUpperCase());
          } else {
            setAvatarAbbr(cleanName.toUpperCase());
          }
        }
      } catch (error) {
        console.log("Error loading user profile metadata:", error);
      }
    };

    loadUserData();
  }, []);

  const handleLogout = async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem("rememberMe");
      await AsyncStorage.removeItem("email");
      await AsyncStorage.removeItem("password");

      router.replace("/");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      <StatusBar style="dark" />

      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.logoBox, { backgroundColor: themeColor }]}>
              <Ionicons name="add" size={22} color="#fff" />
            </View>
            <Text style={styles.logoText}>BCN Web Portal</Text>
          </View>

          <View style={styles.headerRight}>
            <View
              style={[styles.avatar, { backgroundColor: `${themeColor}20` }]}
            >
              <Text style={[styles.avatarText, { color: themeColor }]}>
                {avatarAbbr}
              </Text>
            </View>

            <View style={styles.profileWrapper}>
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
              >
                <Text style={styles.logoutText}>{t.logout}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Body */}
        <View style={styles.content}>
          <Text style={styles.title}>{t.welcome}</Text>
          <Text style={styles.subtitle}>{t.subtitle}</Text>

          {/* Card 1 - Suppliers */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => {
              router.push("/supplier");
            }}
          >
            <View style={styles.cardContent}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: `${themeColor}15` },
                ]}
              >
                <Ionicons name="person-outline" size={24} color={themeColor} />
              </View>

              <View style={styles.textSection}>
                <Text style={styles.cardTitle}>{t.suppliers}</Text>
                <Text style={styles.cardDescription}>{t.suppliersDesc}</Text>
              </View>
            </View>
            <Ionicons name="arrow-forward-outline" size={16} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Card 2 - Purchase Receipts */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => {
              router.push("/purchase_receipt");
            }}
          >
            <View style={styles.cardContent}>
              <View
                style={[styles.iconContainer, { backgroundColor: "#E8F0FE" }]}
              >
                <Ionicons
                  name="checkmark-circle-outline"
                  size={24}
                  color="#1A73E8"
                />
              </View>

              <View style={styles.textSection}>
                <Text style={styles.cardTitle}>{t.receipts}</Text>
                <Text style={styles.cardDescription}>{t.receiptsDesc}</Text>
              </View>
            </View>
            <Ionicons name="arrow-forward-outline" size={16} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Card 3 - Settings */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => {
              router.push("./settings");
            }}
          >
            <View style={styles.cardContent}>
              <View
                style={[styles.iconContainer, { backgroundColor: "#F1F3F4" }]}
              >
                <Ionicons name="settings-outline" size={24} color="#5F6368" />
              </View>

              <View style={styles.textSection}>
                <Text style={styles.cardTitle}>{t.settings}</Text>
                <Text style={styles.cardDescription}>{t.settingsDesc}</Text>
              </View>
            </View>
            <Ionicons name="arrow-forward-outline" size={16} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  logoText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "600",
  },
  profileWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoutButton: {
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 14,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  logoutText: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: "#4B5563",
    marginBottom: 24,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  textSection: {
    flex: 1,
    paddingRight: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 13,
    color: "#6B7280",
  },
});
