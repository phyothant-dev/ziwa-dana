import AsyncStorage from "@react-native-async-storage/async-storage";
import { FrappeApp } from "frappe-js-sdk";

export let frappe: FrappeApp | null = null;

// ==============================
// INITIALIZE FRAPPE DYNAMICALLY
// ==============================
export const initFrappeWithUrl = (url: string) => {
  console.log("Initializing Frappe App Instance with URL:", url);
  // Cleans trailing slashes if accidentally provided by user input
  const cleanUrl = url.replace(/\/+$/, "");
  frappe = new FrappeApp(cleanUrl);
  return frappe;
};

// Internal fallback helper to ensure database calls work seamlessly after cold boot
const ensureAppInitialized = async () => {
  if (!frappe) {
    const savedUrl = await AsyncStorage.getItem("siteUrl");
    if (!savedUrl) {
      throw new Error("Site configuration URL missing. Please login again.");
    }
    initFrappeWithUrl(savedUrl);
  }
};

// ==============================
// LOGIN SERVICE
// ==============================
export const login = async (
  siteUrl: string,
  email: string,
  password: string,
) => {
  try {
    console.log("Login started for site:", siteUrl);

    // Initialize instance dynamically based on user parameter input
    const app = initFrappeWithUrl(siteUrl);

    const response = await app.auth().loginWithUsernamePassword({
      username: email,
      password,
    });

    console.log("Login Success Response:", response);

    // Save site URL to persistence storage on successful authorization validation
    await AsyncStorage.setItem("siteUrl", siteUrl.replace(/\/+$/, ""));

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

// ==============================
// LOGOUT
// ==============================
// Update this specific chunk inside your services/frappeService.ts file

export const logout = async () => {
  console.log("Logout clearing configuration memory layers...");
  try {
    if (frappe) {
      await frappe.auth().logout();
    }
  } catch (e) {
    console.log("SDK logout error wrapper bypass:", e);
  }
  frappe = null;

  // Clear all security session tokens cleanly
  await AsyncStorage.setItem("rememberMe", "false");
  await AsyncStorage.removeItem("email");
  await AsyncStorage.removeItem("password");
  // Note: We leave "siteUrl" intact here so the text field stays pre-filled on the login screen.

  return { success: true };
};

// ==============================
// INTERNAL DATABASE WRAPPER CONTEXT GETTER
// ==============================
const getDb = () => {
  if (!frappe) {
    throw new Error("Please login first");
  }
  return frappe.db();
};

// ==============================
// TYPES & MODEL SCHEMAS
// ==============================
export interface SupplierType {
  name?: string;
  supplier_name: string;
  supplier_group: string;
  supplier_type?: string;
  default_currency?: string;
  mobile_no?: string;
  buying_price_list?: string;
  image?: string; // 👈 Add this line
}

export interface PurchaseReceiptItem {
  item_code: string;
  item_name: string;
  qty: number;
  uom: string;
  rate?: number; // add
  amount?: number; // add
  warehouse?: string; // add
}

export interface PurchaseReceiptType {
  name: string;
  supplier: string;
  supplier_name: string;
  posting_date: string;
  grand_total: number;
  total_qty: number;
  set_warehouse?: string; // add
  items?: PurchaseReceiptItem[];
}
export interface ItemUOMType {
  uom: string;
  conversion_factor: number;
}

export interface ItemType {
  name: string;
  item_name: string;
  item_group: string;
  stock_uom: string;
  image?: string; // 👈 add this

  uoms?: ItemUOMType[]; // 👈 Add the UOM child table array here
}

export interface WarehouseType {
  name: string;
  warehouse_name: string;
}

// ==============================
// DATA FETCH ACTIONS (With Async Boot Safety checks added)
// ==============================
export const createSupplier = async (data: SupplierType) => {
  try {
    await ensureAppInitialized();
    const db = getDb();
    const response = await db.createDoc("Supplier", {
      supplier_name: data.supplier_name,
      supplier_group: data.supplier_group,
      supplier_type: data.supplier_type || "Company",
      default_currency: data.default_currency || "MMK",
      buying_price_list: data.buying_price_list || "Standard Buying (MMK)",
      mobile_no: data.mobile_no || "",
    });
    return { success: true, data: response };
  } catch (error: any) {
    return { success: false, error: parseFrappeError(error) };
  }
};

export const getSuppliers = async () => {
  try {
    await ensureAppInitialized();
    const db = getDb();
    const suppliers = await db.getDocList("Supplier", {
      fields: [
        "name",
        "supplier_name",
        "supplier_group",
        "supplier_type",
        "default_currency",
        "mobile_no",
        "image", // 👈 Add "image" to the requested fields
      ],
      orderBy: { field: "creation", order: "desc" },
      limit: 100,
    });
    return { success: true, data: suppliers };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getPurchaseReceipts = async () => {
  try {
    await ensureAppInitialized();
    const db = getDb();
    const receipts = await db.getDocList("Purchase Receipt", {
      fields: [
        "name",
        "supplier",
        "supplier_name",
        "posting_date",
        "grand_total",
        "total_qty",
      ],
      filters: [["docstatus", "in", [0, 1]]],
      orderBy: { field: "creation", order: "desc" },
      limit: 50,
    });
    return { success: true, data: receipts as PurchaseReceiptType[] };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to load purchase receipts",
    };
  }
};

export const getItems = async () => {
  try {
    await ensureAppInitialized();
    const db = getDb();

    // First, get the list of item names
    const itemNames = await db.getDocList("Item", {
      fields: ["name"],
      limit: 100,
    });

    // Then, fetch the full details for each to get the child table 'uoms'
    const items = await Promise.all(
      itemNames.map(async (i) => await db.getDoc("Item", i.name)),
    );

    console.log("Items with UOM details => ", items);
    return { success: true, data: items as ItemType[] };
  } catch (error: any) {
    console.log("Get Items Error:", error);
    return { success: false, error: error.message };
  }
};
export const createPurchaseReceipt = async (
  supplier: string,
  warehouse: string,
  items: { item_code: string; qty: number; uom: string }[],
  postingDate: string,
) => {
  try {
    await ensureAppInitialized();
    const db = getDb();
    const itemRows = items.map((i) => ({
      item_code: i.item_code,
      qty: i.qty,
      uom: i.uom,
      warehouse: warehouse,
      docstatus: 0,
    }));
    const response = await db.createDoc("Purchase Receipt", {
      supplier: supplier,
      posting_date: postingDate,
      items: itemRows,
    });
    return { success: true, data: response };
  } catch (error: any) {
    // ✅ Frappe SDK nests the real error in these fields
    let message = "Failed to submit document.";

    if (error?._server_messages) {
      // Frappe returns _server_messages as a JSON string array
      try {
        const parsed = JSON.parse(error._server_messages);
        const inner = JSON.parse(parsed[0]);
        message = inner.message || message;
      } catch {
        message = error._server_messages;
      }
    } else if (error?.exception) {
      message = error.exception;
    } else if (error?.message) {
      message = error.message;
    }

    return { success: false, error: message };
  }
};
// ==============================
// FRAPPE ERROR PARSER HELPER
// ==============================
export const parseFrappeError = (error: any): string => {
  if (error?._server_messages) {
    try {
      const parsed = JSON.parse(error._server_messages);
      const inner = JSON.parse(parsed[0]);
      return inner.message || "Unknown server error.";
    } catch {
      return String(error._server_messages);
    }
  }
  if (error?.exception) return error.exception;
  if (error?.httpStatusText) return error.httpStatusText;
  if (error?.message) return error.message;
  return "An unexpected error occurred.";
};

export const getWarehouses = async () => {
  try {
    await ensureAppInitialized();
    const db = getDb();
    const warehouses = await db.getDocList("Warehouse", {
      fields: ["name", "warehouse_name"],
      filters: [["is_group", "=", 0]],
      limit: 50,
    });
    return { success: true, data: warehouses as WarehouseType[] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getPurchaseReceiptDetails = async (docName: string) => {
  try {
    await ensureAppInitialized();
    const db = getDb();
    const response = await db.getDoc("Purchase Receipt", docName);
    return { success: true, data: response as PurchaseReceiptType };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to load receipt details",
    };
  }
};

// Add this interface along with your other types
export interface SupplierGroupType {
  name: string;
}

// Add this function at the bottom of your services/frappeService.ts file
// ==============================
// GET SUPPLIER GROUPS
// ==============================
export const getSupplierGroups = async () => {
  try {
    console.log("Getting Supplier Groups...");
    const db = getDb();

    const groups = await db.getDocList("Supplier Group", {
      fields: ["name"],
      filters: [["is_group", "=", 0]], // Filters out main folder layout structures if necessary
      limit: 50,
    });

    console.log("Supplier Groups Response => ", groups);
    return { success: true, data: groups as SupplierGroupType[] };
  } catch (error: any) {
    console.log("Get Supplier Groups Error:", error);
    return { success: false, error: parseFrappeError(error) };
  }
};

// ==============================
// GET SYSTEM DATE FORMAT
// ==============================
export const getSystemDateFormat = async (): Promise<string> => {
  try {
    await ensureAppInitialized();
    const db = getDb();
    const settings = await db.getDoc("System Settings", "System Settings");
    // Frappe stores e.g. "dd-mm-yyyy" or "mm/dd/yyyy" or "yyyy-mm-dd"
    return (settings as any).date_format || "dd-mm-yyyy";
  } catch (error) {
    return "dd-mm-yyyy"; // safe fallback
  }
};

// ==============================
// GET SYSTEM SETTINGS
// ==============================
export const getSystemSettings = async (): Promise<{
  dateFormat: string;
  numberFormat: string;
}> => {
  try {
    await ensureAppInitialized();
    const db = getDb();
    const settings = await db.getDoc("System Settings", "System Settings");
    return {
      dateFormat: (settings as any).date_format || "dd-mm-yyyy",
      numberFormat: (settings as any).number_format || "#,###.##",
    };
  } catch (error) {
    return { dateFormat: "dd-mm-yyyy", numberFormat: "#,###.##" };
  }
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
