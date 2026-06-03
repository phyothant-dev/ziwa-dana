import { PurchaseReceiptItem } from "./purchaseReceiptItemType";

export type PurchaseReceiptType = {
  name: string;
  supplier: string;
  supplier_name: string;
  posting_date: string;
  grand_total: number;
  total_qty: number;
  set_warehouse?: string;
  items?: PurchaseReceiptItem[];
};
