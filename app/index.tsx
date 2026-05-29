// app/index.tsx

import { initFrappeWithUrl, login } from "@/services/frappeService";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function LoginScreen() {
  const [siteUrl, setSiteUrl] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Start with global boot loading state to prevent flickering text views on autologin
  const [loading, setLoading] = useState<boolean>(true);

  // Validation errors
  const [urlError, setUrlError] = useState<string>("");
  const [emailError, setEmailError] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");

  useEffect(() => {
    checkActiveSession();
  }, []);

  // PERSISTENT SESSION MONITOR LAYER
  const checkActiveSession = async () => {
    try {
      const savedRemember = await AsyncStorage.getItem("rememberMe");
      const savedUrl = await AsyncStorage.getItem("siteUrl");
      const savedEmail = await AsyncStorage.getItem("email");
      const savedPassword = await AsyncStorage.getItem("password");

      // Always populate siteUrl if it exists for user convenience
      if (savedUrl) {
        setSiteUrl(savedUrl);
      }

      // ONLY AUTO-LOGIN IF "REMEMBER ME" WAS SAVED AS TRUE
      if (savedRemember === "true" && savedUrl && savedEmail && savedPassword) {
        console.log("Remember Me active. Auto-logging in...");
        setRememberMe(true);
        setEmail(savedEmail);
        setPassword(savedPassword);

        // Initialize and authenticate behind the scenes
        initFrappeWithUrl(savedUrl);
        const res = await login(savedUrl, savedEmail, savedPassword);

        if (res.success) {
          router.replace("/home");
          return; // Stay on the loading/splash overlay while redirecting
        } else {
          console.log("Auto-login session expired or failed.");
        }
      }
    } catch (error) {
      console.log("Session Initialization Error:", error);
    } finally {
      setLoading(false); // Dismiss loading overlay so manual user can interact
    }
  };

  const handleLogin = async (): Promise<void> => {
    const isUrlValid = validateUrl(siteUrl);
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isUrlValid || !isEmailValid || !isPasswordValid) {
      return;
    }

    try {
      setLoading(true);

      const res = await login(siteUrl.trim(), email.trim(), password);

      console.log("LOGIN RESPONSE => ", res);

      if (!res.success) {
        alert(res.error || "Login Failed");
        setLoading(false);
        return;
      }

      // Always save the Site URL so they don't have to type it again next time
      await AsyncStorage.setItem("siteUrl", siteUrl.trim());

      // SESSION CONDITION BASED ON REMEMBER ME CHECKSUM
      if (rememberMe) {
        await AsyncStorage.setItem("rememberMe", "true");
        await AsyncStorage.setItem("email", email.trim());
        await AsyncStorage.setItem("password", password); // Stored to perform background re-auth
      } else {
        // If unchecked, clear out credentials so they must re-type on next boot
        await AsyncStorage.setItem("rememberMe", "false");
        await AsyncStorage.removeItem("email");
        await AsyncStorage.removeItem("password");
      }

      router.replace("/home");
    } catch (error) {
      console.log("Login Error Exception caught:", error);
      alert("Something went wrong");
      setLoading(false);
    }
  };

  const validateUrl = (value: string): boolean => {
    if (!value.trim()) {
      setUrlError("ERPNext Site URL ထည့်ပါ");
      return false;
    }
    if (
      !value.toLowerCase().startsWith("http://") &&
      !value.toLowerCase().startsWith("https://")
    ) {
      setUrlError("URL သည် http:// သို့မဟုတ် https:// ဖြင့် စရမည်");
      return false;
    }
    setUrlError("");
    return true;
  };

  const validateEmail = (value: string): boolean => {
    const emailRegex = /\S+@\S+\.\S+/;
    if (!value.trim()) {
      setEmailError("အီးမေးလ် ထည့်ပါ");
      return false;
    }
    if (!emailRegex.test(value)) {
      setEmailError("မှန်ကန်သော အီးမေးလ် ထည့်ပါ");
      return false;
    }
    setEmailError("");
    return true;
  };

  const validatePassword = (value: string): boolean => {
    if (!value.trim()) {
      setPasswordError("စကားဝှက် ထည့်ပါ");
      return false;
    }
    if (value.length < 6) {
      setPasswordError("စကားဝှက် အနည်းဆုံး 6 လုံးရှိရမည်");
      return false;
    }
    setPasswordError("");
    return true;
  };

  // Global splash load wrapper layer
  if (loading && !email) {
    return (
      <View style={styles.splashCenter}>
        <ActivityIndicator size="large" color="#16A26A" />
        <Text style={styles.splashText}>အကောင့်စစ်ဆေးနေပါသည်...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <SafeAreaView style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ justifyContent: "center", flexGrow: 1 }}
        >
          <View style={styles.card}>
            <View style={styles.header}>
              <View style={styles.logoBox}>
                <Ionicons name="add" size={24} color="#fff" />
              </View>
              <Text style={styles.logoText}>BCN Web Portal</Text>
            </View>

            <Text style={styles.title}>ဝင်ရောက်ရန်</Text>
            <Text style={styles.subtitle}>
              BCN Web Portal သို့ ဝင်ရောက်ရန် သင်၏ Site URL နှင့်
              အကောင့်အချက်အလက်များ ထည့်သွင်းပါ။
            </Text>

            <Text style={styles.label}>Site URL</Text>
            <View
              style={[
                styles.inputContainer,
                urlError ? styles.inputError : null,
              ]}
            >
              <Ionicons name="globe-outline" size={20} color="#9CA3AF" />
              <TextInput
                value={siteUrl}
                onChangeText={(text) => {
                  setSiteUrl(text);
                  validateUrl(text);
                }}
                placeholder="https://yourcompany.frappe.cloud"
                placeholderTextColor="#9CA3AF"
                style={styles.input}
                keyboardType="url"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            {urlError ? <Text style={styles.errorText}>{urlError}</Text> : null}

            <Text style={styles.label}>အီးမေးလ်</Text>
            <View
              style={[
                styles.inputContainer,
                emailError ? styles.inputError : null,
              ]}
            >
              <Ionicons name="mail-outline" size={20} color="#9CA3AF" />
              <TextInput
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  validateEmail(text);
                }}
                placeholder="yourname@example.com"
                placeholderTextColor="#9CA3AF"
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            {emailError ? (
              <Text style={styles.errorText}>{emailError}</Text>
            ) : null}

            <Text style={styles.label}>စကားဝှက်</Text>
            <View
              style={[
                styles.inputContainer,
                passwordError ? styles.inputError : null,
              ]}
            >
              <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />
              <TextInput
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  validatePassword(text);
                }}
                placeholder="••••••••"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showPassword}
                style={styles.input}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#9CA3AF"
                />
              </TouchableOpacity>
            </View>
            {passwordError ? (
              <Text style={styles.errorText}>{passwordError}</Text>
            ) : null}

            <View style={styles.row}>
              <TouchableOpacity
                style={styles.rememberRow}
                onPress={() => setRememberMe(!rememberMe)}
              >
                <View
                  style={[styles.checkbox, rememberMe && styles.checkboxActive]}
                >
                  {rememberMe && (
                    <Ionicons name="checkmark" size={12} color="#fff" />
                  )}
                </View>
                <Text style={styles.rememberText}>မှတ်ထားပါ</Text>
              </TouchableOpacity>

              <TouchableOpacity>
                <Text style={styles.forgotText}>စကားဝှက်မေ့သလား?</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.button} onPress={handleLogin}>
              <Text style={styles.buttonText}>ဝင်ရောက်မည်</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E9ECEB",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  card: { backgroundColor: "#F7F7F7", borderRadius: 28, padding: 24 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 28 },
  logoBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#16A26A",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  logoText: { fontSize: 24, fontWeight: "700", color: "#111827" },
  title: {
    fontSize: 34,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    lineHeight: 25,
    marginBottom: 28,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 10,
  },
  inputContainer: {
    height: 58,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 16,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  inputError: { borderColor: "#EF4444" },
  input: { flex: 1, marginLeft: 10, fontSize: 16, color: "#111827" },
  errorText: {
    color: "#EF4444",
    fontSize: 13,
    marginBottom: 14,
    marginLeft: 4,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 28,
    marginTop: 8,
  },
  rememberRow: { flexDirection: "row", alignItems: "center" },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  checkboxActive: { backgroundColor: "#111827", borderWidth: 0 },
  rememberText: { fontSize: 14, color: "#374151" },
  forgotText: { fontSize: 14, color: "#16A26A", fontWeight: "500" },
  button: {
    height: 58,
    borderRadius: 16,
    backgroundColor: "#16A26A",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "700" },

  // Session splash styles
  splashCenter: {
    flex: 1,
    backgroundColor: "#E9ECEB",
    justifyContent: "center",
    alignItems: "center",
  },
  splashText: {
    marginTop: 14,
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
  },
});
