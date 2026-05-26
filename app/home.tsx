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

  // Load user data on mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedEmail = await AsyncStorage.getItem("email");
        if (storedEmail) {
          setEmail(storedEmail);

          // Generate 2-letter abbreviation from email address
          // e.g., "aprilzaw@gmail.com" -> "AP"
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
            <View style={styles.logoBox}>
              <Ionicons name="add" size={22} color="#fff" />
            </View>
            <Text style={styles.logoText}>BCN Web Portal</Text>
          </View>

          <View style={styles.headerRight}>
            {/* Dynamic Avatar Initials */}
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{avatarAbbr}</Text>
            </View>

            {/* User Profile Info Wrap Container */}
            <View style={styles.profileWrapper}>
              {/* {email ? (
                <Text style={styles.emailText} numberOfLines={1}>
                  {email}
                </Text>
              ) : null} */}

              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
              >
                <Text style={styles.logoutText}>ထွက်မည်</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Body */}
        <View style={styles.content}>
          <Text style={styles.title}>မင်္ဂလာပါ 👋</Text>
          <Text style={styles.subtitle}>ဘာလုပ်မယ်ဆိုတာ ရွေးချယ်ပါ</Text>

          {/* Card 1 */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => {
              router.push("/supplier");
            }}
          >
            <View style={styles.cardContent}>
              <View
                style={[styles.iconContainer, { backgroundColor: "#CFF3DD" }]}
              >
                <Ionicons name="person-outline" size={24} color="#065F46" />
              </View>

              <View style={styles.textSection}>
                <Text style={styles.cardTitle}>ကုန်သည်စာရင်း</Text>
                <Text style={styles.cardDescription}>
                  ကုန်သည်စာရင်း ကြည့်အသစ်မှတ််တမ်းတင်ရန်
                </Text>
              </View>
            </View>
            <Ionicons name="arrow-forward-outline" size={20} color="#D1D5DB" />
          </TouchableOpacity>

          {/* Card 2 */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => {
              router.push("/purchase_receipt");
            }}
          >
            <View style={styles.cardContent}>
              <View
                style={[styles.iconContainer, { backgroundColor: "#D9E9FF" }]}
              >
                <Ionicons
                  name="checkmark-circle-outline"
                  size={24}
                  color="#2563EB"
                />
              </View>

              <View style={styles.textSection}>
                <Text style={styles.cardTitle}>ကုန်လက်ခံလွှာ</Text>
                <Text style={styles.cardDescription}>
                  ကုန်လက်ခံစာရင်းကြည့် ထည့်မည်တင်ရန်
                </Text>
              </View>
            </View>
            <Ionicons name="arrow-forward-outline" size={20} color="#D1D5DB" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E9ECEB",
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
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#10B26C",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  logoText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#CFF3DD",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  avatarText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#065F46",
  },
  /* Added to align email inline right beside the button */
  profileWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  emailText: {
    fontSize: 13,
    color: "#6B7280",
    marginRight: 10,
    fontWeight: "500",
    maxWidth: 120, // Prevents layout breakages on small devices
  },
  logoutButton: {
    height: 38,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  logoutText: {
    fontSize: 14,
    color: "#4B5563",
    fontWeight: "500",
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 20,
  },
  title: {
    fontSize: 31,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 28,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    padding: 22,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  cardContent: {
    flexDirection: "row",
    flex: 1,
  },
  iconContainer: {
    width: 58,
    height: 58,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  textSection: {
    flex: 1,
    paddingRight: 8,
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 15,
    color: "#6B7280",
    lineHeight: 22,
  },
});
