export type PurchaseReceiptItem = {
  item_code: string;
  item_name: string;
  qty: number;
  uom: string;
  rate?: number;
  amount?: number;
  warehouse?: string;
};
