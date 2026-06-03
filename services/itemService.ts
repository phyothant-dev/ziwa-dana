import { ItemType } from "@/types/itemType";
import { ensureAppInitialized, getDb } from "./frappeService";

export const getItems = async () => {
  try {
    await ensureAppInitialized();
    const db = getDb();

    const itemNames = await db.getDocList("Item", {
      fields: ["name"],
      limit: 100,
    });

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
