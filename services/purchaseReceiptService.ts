import { PurchaseReceiptType } from "@/types/purchaseReceiptType";
import { ensureAppInitialized, getDb } from "./frappeService";

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
    let message = "Failed to submit document.";

    if (error?._server_messages) {
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
