import * as SecureStore from "expo-secure-store";
import { FrappeApp } from "frappe-js-sdk";
export let frappe: FrappeApp | null = null;

export const initFrappeWithUrl = (url: string) => {
  console.log("Initializing Frappe App Instance with URL:", url);
  const cleanUrl = url.replace(/\/+$/, "");
  frappe = new FrappeApp(cleanUrl);
  return frappe;
};

export const ensureAppInitialized = async () => {
  if (!frappe) {
    const savedUrl = await SecureStore.getItemAsync("siteUrl");
    if (!savedUrl) {
      throw new Error("Site configuration URL missing. Please login again.");
    }
    initFrappeWithUrl(savedUrl);
  }
};

export const getDb = () => {
  if (!frappe) {
    throw new Error("Please login first");
  }
  return frappe.db();
};

export const debugGetSupplierDoc = async (supplierName: string) => {
  try {
    await ensureAppInitialized();
    const db = getDb();
    const doc = await db.getDoc("Supplier", supplierName);
    console.log("=== SUPPLIER FULL DOC ===", JSON.stringify(doc, null, 2));
    return doc;
  } catch (error: any) {
    console.log("Debug supplier error:", error);
  }
};

export const resetFrappeInstance = () => {
  frappe = null;
};
