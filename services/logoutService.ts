import * as SecureStore from "expo-secure-store";
import { frappe, resetFrappeInstance } from "./frappeService";

export const logout = async () => {
  console.log("Logout clearing secure session configurations...");
  try {
    if (frappe) {
      await frappe.auth().logout();
    }
  } catch (e) {
    console.log("SDK logout error bypass:", e);
  }

  resetFrappeInstance();

  await SecureStore.setItemAsync("rememberMe", "false");

  return { success: true };
};
