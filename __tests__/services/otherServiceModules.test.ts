import * as SecureStore from "expo-secure-store";

import {
    ensureAppInitialized,
    getDb,
    initFrappeWithUrl,
} from "../../services/frappeService";
import { login } from "../../services/loginService";
import { getPurchaseReceipts } from "../../services/purchaseReceiptService";
import { getSuppliers } from "../../services/supplierService";

jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(),
}));

jest.mock("../../services/frappeService", () => ({
  initFrappeWithUrl: jest.fn(),
  ensureAppInitialized: jest.fn(),
  getDb: jest.fn(),
}));

describe("other service modules", () => {
  const setItemAsyncMock = SecureStore.setItemAsync as jest.Mock;
  const initFrappeWithUrlMock = initFrappeWithUrl as jest.Mock;
  const getDbMock = getDb as jest.Mock;
  const ensureAppInitializedMock = ensureAppInitialized as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("login stores the site URL and remember-me flag on success", async () => {
    initFrappeWithUrlMock.mockReturnValue({
      auth: () => ({
        loginWithUsernamePassword: jest.fn().mockResolvedValue({ ok: true }),
      }),
    });

    const result = await login(
      "https://demo.frappe.cloud/",
      "user@example.com",
      "secret123",
    );

    expect(initFrappeWithUrlMock).toHaveBeenCalledWith(
      "https://demo.frappe.cloud/",
    );
    expect(setItemAsyncMock).toHaveBeenNthCalledWith(
      1,
      "siteUrl",
      "https://demo.frappe.cloud",
    );
    expect(setItemAsyncMock).toHaveBeenNthCalledWith(2, "rememberMe", "true");
    expect(result).toEqual({ success: true, data: { ok: true } });
  });

  it("getSuppliers returns supplier data from the DB", async () => {
    ensureAppInitializedMock.mockResolvedValue(undefined);
    getDbMock.mockReturnValue({
      getDocList: jest.fn().mockResolvedValue([{ name: "SUP-1" }]),
    });

    await expect(getSuppliers()).resolves.toEqual({
      success: true,
      data: [{ name: "SUP-1" }],
    });
    expect(ensureAppInitializedMock).toHaveBeenCalledTimes(1);
  });

  it("getPurchaseReceipts returns receipt data from the DB", async () => {
    ensureAppInitializedMock.mockResolvedValue(undefined);
    getDbMock.mockReturnValue({
      getDocList: jest.fn().mockResolvedValue([{ name: "RCP-1" }]),
    });

    await expect(getPurchaseReceipts()).resolves.toEqual({
      success: true,
      data: [{ name: "RCP-1" }],
    });
    expect(ensureAppInitializedMock).toHaveBeenCalledTimes(1);
  });

  it("login returns a failure message when authentication fails", async () => {
    initFrappeWithUrlMock.mockReturnValue({
      auth: () => ({
        loginWithUsernamePassword: jest
          .fn()
          .mockRejectedValue({ message: "Invalid credentials" }),
      }),
    });

    await expect(
      login("https://demo.frappe.cloud/", "bad@example.com", "wrongpass"),
    ).resolves.toEqual({ success: false, error: "Invalid credentials" });
  });

  it("login falls back to the default error message when auth error has no message", async () => {
    initFrappeWithUrlMock.mockReturnValue({
      auth: () => ({
        loginWithUsernamePassword: jest.fn().mockRejectedValue({}),
      }),
    });

    await expect(
      login("https://demo.frappe.cloud/", "bad@example.com", "wrongpass"),
    ).resolves.toEqual({ success: false, error: "Login Failed" });
  });

  it("getPurchaseReceipts returns an error message when the DB call fails", async () => {
    ensureAppInitializedMock.mockResolvedValue(undefined);
    getDbMock.mockReturnValue({
      getDocList: jest
        .fn()
        .mockRejectedValue(new Error("Receipt fetch failed")),
    });

    await expect(getPurchaseReceipts()).resolves.toEqual({
      success: false,
      error: "Receipt fetch failed",
    });
  });

  it("getPurchaseReceipts falls back to the default message when the DB error has no message", async () => {
    ensureAppInitializedMock.mockResolvedValue(undefined);
    getDbMock.mockReturnValue({
      getDocList: jest.fn().mockRejectedValue({}),
    });

    await expect(getPurchaseReceipts()).resolves.toEqual({
      success: false,
      error: "Failed to load purchase receipts",
    });
  });

  it("getSuppliers returns an error message when the DB call fails", async () => {
    ensureAppInitializedMock.mockResolvedValue(undefined);
    getDbMock.mockReturnValue({
      getDocList: jest
        .fn()
        .mockRejectedValue(new Error("Supplier fetch failed")),
    });

    await expect(getSuppliers()).resolves.toEqual({
      success: false,
      error: "Supplier fetch failed",
    });
  });
});
