import { ensureAppInitialized, getDb } from "./frappeService";

export const getSystemDateFormat = async (): Promise<string> => {
  try {
    await ensureAppInitialized();
    const db = getDb();
    const settings = await db.getDoc("System Settings", "System Settings");
    return (settings as any).date_format || "dd-mm-yyyy";
  } catch (error) {
    return "dd-mm-yyyy";
  }
};

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
