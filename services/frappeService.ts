// // services/frappeService.ts

// import { FrappeApp } from "frappe-js-sdk";

// const BASE_URL = "https://erpnext-zjg-xrs.j.frappe.cloud";

// export let frappe: FrappeApp | null = null;

// // ==============================
// // INIT
// // ==============================
// const initFrappe = () => {
//   console.log("Initializing Frappe...");

//   frappe = new FrappeApp(BASE_URL);

//   return frappe;
// };

// // ==============================
// // LOGIN
// // ==============================
// export const login = async (email: string, password: string) => {
//   try {
//     console.log("Login started...");
//     console.log("Email:", email);

//     const app = initFrappe();

//     const response = await app.auth().loginWithUsernamePassword({
//       username: email,
//       password,
//     });

//     console.log("Login Success Response:", response);

//     return {
//       success: true,
//       data: response,
//     };
//   } catch (error: any) {
//     console.log("Login Error:", error);
//     console.log("Login Error Message:", error?.message);

//     return {
//       success: false,
//       error: error.message || "Login Failed",
//     };
//   }
// };

// // ==============================
// // LOGOUT
// // ==============================
// export const logout = async () => {
//   console.log("Logout...");

//   frappe = null;

//   return {
//     success: true,
//   };
// };

// // ==============================
// // GET DB
// // ==============================
// const getDb = () => {
//   console.log("Checking DB Instance...");

//   if (!frappe) {
//     console.log("Frappe is NULL");

//     throw new Error("Please login first");
//   }

//   console.log("DB Ready");

//   return frappe.db();
// };

// // ==============================
// // TYPES
// // ==============================
// export interface SupplierType {
//   name?: string;
//   supplier_name: string;
//   supplier_group: string;
//   supplier_type?: string;
//   default_currency?: string;
//   mobile_no?: string;
//   buying_price_list?: string;
// }

// // ==============================
// // CREATE SUPPLIER
// // ==============================
// export const createSupplier = async (data: SupplierType) => {
//   try {
//     console.log("Creating Supplier...");

//     console.log("Supplier Payload:", data);

//     const db = getDb();

//     const response = await db.createDoc("Supplier", {
//       supplier_name: data.supplier_name,

//       supplier_group: data.supplier_group,

//       supplier_type: data.supplier_type || "Company",

//       default_currency: data.default_currency || "MMK",

//       buying_price_list: data.buying_price_list || "Standard Buying (MMK)",

//       mobile_no: data.mobile_no || "",
//     });

//     console.log("Create Supplier Success:", response);

//     return {
//       success: true,
//       data: response,
//     };
//   } catch (error: any) {
//     console.log("Create Supplier Error:", error);

//     console.log("Create Supplier Error Message:", error?.message);

//     return {
//       success: false,
//       error: error.message,
//     };
//   }
// };

// // ==============================
// // GET SUPPLIERS
// // ==============================
// // ==============================
// // GET SUPPLIERS
// // ==============================
// export const getSuppliers = async () => {
//   try {
//     console.log("Getting Suppliers...");

//     const db = getDb();

//     console.log("DB Ready");

//     const suppliers = await db.getDocList("Supplier", {
//       fields: [
//         "name",
//         "supplier_name",
//         "supplier_group",
//         "supplier_type",
//         "default_currency",
//         "mobile_no",
//       ],

//       orderBy: {
//         field: "creation",
//         order: "desc",
//       },

//       limit: 100,
//     });

//     console.log("Suppliers Response => ", suppliers);

//     return {
//       success: true,
//       data: suppliers,
//     };
//   } catch (error: any) {
//     console.log("Get Suppliers Error:", error);
//     console.log("Get Suppliers Error Message:", error.message || error);

//     return {
//       success: false,
//       error: error.message,
//     };
//   }
// };

// // ==============================
// // TYPE FOR PURCHASE RECEIPT
// // ==============================
// export interface PurchaseReceiptItem {
//   item_code: string;
//   item_name: string;
//   qty: number;
//   uom: string;
// }

// export interface PurchaseReceiptType {
//   name: string;
//   supplier: string;
//   supplier_name: string;
//   posting_date: string;
//   grand_total: number;
//   total_qty: number;
//   items?: PurchaseReceiptItem[]; // Child items inside the purchase receipt
// }

// // ==============================
// // GET PURCHASE RECEIPTS
// // ==============================
// export const getPurchaseReceipts = async () => {
//   try {
//     console.log("Getting Purchase Receipts...");
//     const db = getDb();

//     const receipts = await db.getDocList("Purchase Receipt", {
//       fields: [
//         "name",
//         "supplier",
//         "supplier_name",
//         "posting_date",
//         "grand_total",
//         "total_qty",
//       ],
//       // REMOVE or CHANGE the filter to fetch submitted documents too:
//       filters: [
//         ["docstatus", "in", [0, 1]], // Fetches both Draft (0) and Submitted (1) documents
//       ],
//       orderBy: {
//         field: "creation",
//         order: "desc",
//       },
//       limit: 50,
//     });

//     console.log("Purchase Receipts Response => ", receipts);
//     return {
//       success: true,
//       data: receipts as PurchaseReceiptType[],
//     };
//   } catch (error: any) {
//     console.log("Get Purchase Receipts Error:", error);
//     return {
//       success: false,
//       error: error.message || "Failed to load purchase receipts",
//     };
//   }
// };

// // ==============================
// // ITEM TYPES
// // ==============================
// export interface ItemType {
//   name: string; // item_code is the primary key name in Frappe
//   item_name: string;
//   item_group: string;
//   stock_uom: string;
// }

// // ==============================
// // GET ITEMS
// // ==============================
// export const getItems = async () => {
//   try {
//     console.log("Getting Items...");
//     const db = getDb();
//     const items = await db.getDocList("Item", {
//       fields: ["name", "item_name", "item_group", "stock_uom"],
//       limit: 100,
//     });
//     console.log("Items Response => ", items);
//     return { success: true, data: items as ItemType[] };
//   } catch (error: any) {
//     console.log("Get Items Error:", error);
//     return { success: false, error: error.message };
//   }
// };

// // ==============================
// // CREATE PURCHASE RECEIPT
// // ==============================
// // ==============================
// // CREATE PURCHASE RECEIPT
// // ==============================
// export const createPurchaseReceipt = async (
//   supplier: string,
//   warehouse: string,
//   items: { item_code: string; qty: number }[],
//   postingDate: string, // 👈 Add date parameter here
// ) => {
//   try {
//     console.log("Submitting Purchase Receipt payload...");
//     const db = getDb();

//     // ERPNext Purchase Receipt item table fields: item_code, qty, warehouse
//     const itemRows = items.map((i) => ({
//       item_code: i.item_code,
//       qty: i.qty,
//       warehouse: warehouse,
//       docstatus: 0,
//     }));

//     const response = await db.createDoc("Purchase Receipt", {
//       supplier: supplier,
//       posting_date: postingDate, // 👈 Inject custom native date string
//       items: itemRows,
//     });

//     console.log("Purchase Receipt Created successfully:", response);
//     return { success: true, data: response };
//   } catch (error: any) {
//     console.log("Create Purchase Receipt Error:", error);
//     return {
//       success: false,
//       error: error.message || "Failed to submit document",
//     };
//   }
// };
// // ==============================
// // WAREHOUSE TYPES
// // ==============================
// export interface WarehouseType {
//   name: string; // Document ID (e.g., "Stores - ZDCL")
//   warehouse_name: string;
// }

// // ==============================
// // GET WAREHOUSES
// // ==============================
// export const getWarehouses = async () => {
//   try {
//     console.log("Getting Warehouses...");
//     const db = getDb();
//     const warehouses = await db.getDocList("Warehouse", {
//       fields: ["name", "warehouse_name"],
//       filters: [["is_group", "=", 0]], // Only fetch actual storage areas, not grouping folders
//       limit: 50,
//     });
//     console.log("Warehouses Response => ", warehouses);
//     return { success: true, data: warehouses as WarehouseType[] };
//   } catch (error: any) {
//     console.log("Get Warehouses Error:", error);
//     return { success: false, error: error.message };
//   }
// };
// // ==============================
// // GET SINGLE PURCHASE RECEIPT DETAILS
// // ==============================
// export const getPurchaseReceiptDetails = async (docName: string) => {
//   try {
//     console.log(`Getting Detailed Purchase Receipt for: ${docName}...`);
//     const db = getDb();

//     // getDoc automatically populates child item rows arrays
//     const response = await db.getDoc("Purchase Receipt", docName);

//     console.log("Detailed Receipt Response => ", response);
//     return { success: true, data: response as PurchaseReceiptType };
//   } catch (error: any) {
//     console.log("Get Purchase Receipt Details Error:", error);
//     return {
//       success: false,
//       error: error.message || "Failed to load receipt details",
//     };
//   }
// };

// services/frappeService.ts

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
}

export interface PurchaseReceiptItem {
  item_code: string;
  item_name: string;
  qty: number;
  uom: string;
}

export interface PurchaseReceiptType {
  name: string;
  supplier: string;
  supplier_name: string;
  posting_date: string;
  grand_total: number;
  total_qty: number;
  items?: PurchaseReceiptItem[];
}

export interface ItemType {
  name: string;
  item_name: string;
  item_group: string;
  stock_uom: string;
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
    return { success: false, error: error.message };
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
    const items = await db.getDocList("Item", {
      fields: ["name", "item_name", "item_group", "stock_uom"],
      limit: 100,
    });
    return { success: true, data: items as ItemType[] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const createPurchaseReceipt = async (
  supplier: string,
  warehouse: string,
  items: { item_code: string; qty: number }[],
  postingDate: string,
) => {
  try {
    await ensureAppInitialized();
    const db = getDb();
    const itemRows = items.map((i) => ({
      item_code: i.item_code,
      qty: i.qty,
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
    return {
      success: false,
      error: error.message || "Failed to submit document",
    };
  }
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
