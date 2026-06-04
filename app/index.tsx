import ScreenWrapper from "@/components/ScreenWrapper";
import { translations } from "@/locales/index";
import { initFrappeWithUrl } from "@/services/frappeService";
import { login } from "@/services/loginService";
import {
    isValidEmail,
    isValidPassword,
    isValidUrl,
} from "@/services/validationService";
import { useSettingsStore } from "@/stores/settingsStore";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
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

  const { language, themeColor } = useSettingsStore();
  const t = translations[language] || translations["mm"];

  const [loading, setLoading] = useState<boolean>(true);

  const [urlError, setUrlError] = useState<string>("");
  const [emailError, setEmailError] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");

  useEffect(() => {
    checkActiveSession();
  }, []);

  const checkActiveSession = async () => {
    try {
      const savedRemember = await SecureStore.getItemAsync("rememberMe");
      const savedUrl = await SecureStore.getItemAsync("siteUrl");

      if (savedUrl) {
        setSiteUrl(savedUrl);
      }

      if (savedRemember === "true" && savedUrl) {
        console.log("Remember Me active. Checking active session token...");
        setRememberMe(true);

        const app = initFrappeWithUrl(savedUrl);

        try {
          const user = await app.auth().getLoggedInUser();

          if (user) {
            console.log("Session token verified valid.");
            router.replace("/home");
            return;
          }
        } catch (sessionErr: any) {
          console.log(
            sessionErr.toString() ||
              "Active session cookie has expired or was cleared.",
          );
        }
      }
    } catch (error) {
      console.log("Session Initialization Error:", error);
    } finally {
      setLoading(false);
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
        Alert.alert(t.errorTitle, res.error || "Login Failed");
        setLoading(false);
        return;
      }

      await SecureStore.setItemAsync("siteUrl", siteUrl.trim());

      if (rememberMe) {
        await SecureStore.setItemAsync("rememberMe", "true");
      } else {
        await SecureStore.setItemAsync("rememberMe", "false");
      }

      router.replace("/home");
    } catch (error) {
      console.log("Login Error Exception caught:", error);
      Alert.alert(t.errorTitle, "Something went wrong");
      setLoading(false);
    }
  };

  const validateUrl = (value: string): boolean => {
    if (!value.trim()) {
      setUrlError(t.urlRequiredError);
      return false;
    }
    if (!isValidUrl(value)) {
      setUrlError(t.urlPrefixError);
      return false;
    }
    setUrlError("");
    return true;
  };

  const validateEmail = (value: string): boolean => {
    if (!value.trim()) {
      setEmailError(t.emailRequiredError);
      return false;
    }
    if (!isValidEmail(value)) {
      setEmailError(t.emailInvalidError);
      return false;
    }
    setEmailError("");
    return true;
  };

  const validatePassword = (value: string): boolean => {
    if (!value.trim()) {
      setPasswordError(t.passwordRequiredError);
      return false;
    }
    if (!isValidPassword(value)) {
      setPasswordError(t.passwordLengthError);
      return false;
    }
    setPasswordError("");
    return true;
  };

  if (loading && !email) {
    return (
      <View style={styles.splashCenter}>
        <ActivityIndicator size="large" color={themeColor} />
        <Text style={styles.splashText}>{t.checkingAccountOverlay}</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScreenWrapper>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ justifyContent: "center", flexGrow: 1 }}
        >
          <View style={styles.card}>
            <View style={styles.header}>
              <View style={[styles.logoBox, { backgroundColor: themeColor }]}>
                <Ionicons name="add" size={24} color="#fff" />
              </View>
              <Text style={styles.logoText}>BCN Web Portal</Text>
            </View>

            <Text style={styles.title}>{t.loginTitle}</Text>
            <Text style={styles.subtitle}>{t.loginSubtitle}</Text>

            <Text style={styles.label}>{t.siteUrlLabel}</Text>
            <View
              style={[
                styles.inputContainer,
                urlError ? styles.inputError : null,
                siteUrl.length > 0 && !urlError
                  ? { borderColor: `${themeColor}60` }
                  : null,
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

            <Text style={styles.label}>{t.emailLabel}</Text>
            <View
              style={[
                styles.inputContainer,
                emailError ? styles.inputError : null,
                email.length > 0 && !emailError
                  ? { borderColor: `${themeColor}60` }
                  : null,
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

            <Text style={styles.label}>{t.passwordLabel}</Text>
            <View
              style={[
                styles.inputContainer,
                passwordError ? styles.inputError : null,
                password.length > 0 && !passwordError
                  ? { borderColor: `${themeColor}60` }
                  : null,
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
                  style={[
                    styles.checkbox,
                    rememberMe && [
                      styles.checkboxActive,
                      { backgroundColor: themeColor, borderColor: themeColor },
                    ],
                  ]}
                >
                  {rememberMe && (
                    <Ionicons name="checkmark" size={12} color="#fff" />
                  )}
                </View>
                <Text style={styles.rememberText}>{t.rememberMeLabel}</Text>
              </TouchableOpacity>

              <TouchableOpacity>
                <Text style={[styles.forgotText, { color: themeColor }]}>
                  {t.forgotPasswordLink}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: themeColor }]}
              onPress={handleLogin}
            >
              <Text style={styles.buttonText}>{t.loginBtn}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ScreenWrapper>
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
  checkboxActive: { borderWidth: 1 },
  rememberText: { fontSize: 14, color: "#374151" },
  forgotText: { fontSize: 14, fontWeight: "500" },
  button: {
    height: 58,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "700" },

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
