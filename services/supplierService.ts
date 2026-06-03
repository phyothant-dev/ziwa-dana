import { SupplierGroupType } from "@/types/supplierGroupType";
import { SupplierType } from "@/types/supplierType";
import { ensureAppInitialized, getDb } from "./frappeService";
import { parseFrappeError } from "./parseFrappeErrorService";

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
        "image",
      ],
      orderBy: { field: "creation", order: "desc" },
      limit: 100,
    });
    return { success: true, data: suppliers };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

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

export const getSupplierGroups = async () => {
  try {
    console.log("Getting Supplier Groups...");
    const db = getDb();

    const groups = await db.getDocList("Supplier Group", {
      fields: ["name"],
      filters: [["is_group", "=", 0]],
      limit: 50,
    });

    console.log("Supplier Groups Response => ", groups);
    return { success: true, data: groups as SupplierGroupType[] };
  } catch (error: any) {
    console.log("Get Supplier Groups Error:", error);
    return { success: false, error: parseFrappeError(error) };
  }
};
