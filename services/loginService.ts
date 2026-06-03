import * as SecureStore from "expo-secure-store";
import { initFrappeWithUrl } from "./frappeService";

export const login = async (
  siteUrl: string,
  email: string,
  password: string,
) => {
  try {
    console.log("Login started securely for site:", siteUrl);

    const app = initFrappeWithUrl(siteUrl);

    const response = await app.auth().loginWithUsernamePassword({
      username: email,
      password,
    });

    console.log("Login Success Response:", response);

    const cleanUrl = siteUrl.replace(/\/+$/, "");

    await SecureStore.setItemAsync("siteUrl", cleanUrl);
    await SecureStore.setItemAsync("rememberMe", "true");

    return {
      success: true,
      data: response,
    };
  } catch (error: any) {
    console.log("Login Error:", error);
    return {
      success: false,
      error: error.message || "Login Failed",
    };
  }
};
