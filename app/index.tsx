import { login } from "@/services/frappeService";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function LoginScreen() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);

  // validation errors
  const [emailError, setEmailError] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");

  useEffect(() => {
    loadSavedLogin();
  }, []);

  const loadSavedLogin = async (): Promise<void> => {
    try {
      const savedRemember = await AsyncStorage.getItem("rememberMe");
      const savedEmail = await AsyncStorage.getItem("email");
      const savedPassword = await AsyncStorage.getItem("password");

      if (savedRemember === "true") {
        setRememberMe(true);
        setEmail(savedEmail || "");
        setPassword(savedPassword || "");
      }
    } catch (error) {
      console.log("Load Error:", error);
    }
  };

  // email validation
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

  // password validation
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

  const handleLogin = async (): Promise<void> => {
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    try {
      setLoading(true);

      // LOGIN API
      const res = await login(email, password);

      console.log("LOGIN RESPONSE => ", res);

      if (!res.success) {
        alert(res.error || "Login Failed");
        return;
      }

      // REMEMBER ME
      if (rememberMe) {
        await AsyncStorage.setItem("rememberMe", "true");
        await AsyncStorage.setItem("email", email);
        await AsyncStorage.setItem("password", password);
      } else {
        await AsyncStorage.removeItem("rememberMe");
        await AsyncStorage.removeItem("email");
        await AsyncStorage.removeItem("password");
      }

      // GO HOME
      router.replace("/home");
    } catch (error) {
      console.log("Login Error:", error);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Ionicons name="add" size={24} color="#fff" />
          </View>

          <Text style={styles.logoText}>BCN Web Portal</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>ဝင်ရောက်ရန်</Text>

        <Text style={styles.subtitle}>
          BCN Web Portal သို့ ဝင်ရောက်ရန် အကောင့်ဖြင့် လော့ဂ်အင် ဝင်ပါ။
        </Text>

        {/* Email */}
        <Text style={styles.label}>အီးမေးလ်</Text>

        <View
          style={[styles.inputContainer, emailError ? styles.inputError : null]}
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
          />
        </View>

        {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

        {/* Password */}
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

        {/* Remember Me */}
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

        {/* Login Button */}
        <TouchableOpacity
          style={styles.button}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>ဝင်ရောက်မည်</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E9ECEB",
    justifyContent: "center",
    paddingHorizontal: 16,
  },

  card: {
    backgroundColor: "#F7F7F7",
    borderRadius: 28,
    padding: 24,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 28,
  },

  logoBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#16A26A",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  logoText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },

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

  inputError: {
    borderColor: "#EF4444",
  },

  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: "#111827",
  },

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

  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
  },

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

  checkboxActive: {
    backgroundColor: "#111827",
    borderWidth: 0,
  },

  rememberText: {
    fontSize: 14,
    color: "#374151",
  },

  forgotText: {
    fontSize: 14,
    color: "#16A26A",
    fontWeight: "500",
  },

  button: {
    height: 58,
    borderRadius: 16,
    backgroundColor: "#16A26A",
    alignItems: "center",
    justifyContent: "center",
  },

  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
});
