import { WarehouseType } from "@/types/warehouseType";
import { ensureAppInitialized, getDb } from "./frappeService";

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
