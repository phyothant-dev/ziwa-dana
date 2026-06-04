import * as SecureStore from "expo-secure-store";

import { logout } from "../../services/logoutService";
import {
    getSystemDateFormat,
    getSystemSettings,
} from "../../services/systemService";

jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(),
}));

jest.mock("../../services/frappeService", () => {
  const logoutMock = jest.fn();
  const resetFrappeInstanceMock = jest.fn();
  const ensureAppInitializedMock = jest.fn();
  const getDbMock = jest.fn();

  return {
    frappe: { auth: () => ({ logout: logoutMock }) },
    resetFrappeInstance: resetFrappeInstanceMock,
    ensureAppInitialized: ensureAppInitializedMock,
    getDb: getDbMock,
    __mocks: {
      logoutMock,
      resetFrappeInstanceMock,
      ensureAppInitializedMock,
      getDbMock,
    },
  };
});

describe("service modules", () => {
  const mockedFrappeService = jest.requireMock(
    "../../services/frappeService",
  ) as {
    frappe: { auth: () => { logout: jest.Mock } };
    resetFrappeInstance: jest.Mock;
    ensureAppInitialized: jest.Mock;
    getDb: jest.Mock;
    __mocks: {
      logoutMock: jest.Mock;
      resetFrappeInstanceMock: jest.Mock;
      ensureAppInitializedMock: jest.Mock;
      getDbMock: jest.Mock;
    };
  };
  const setItemAsyncMock = SecureStore.setItemAsync as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("logout clears session state and resets frappe", async () => {
    const result = await logout();

    expect(mockedFrappeService.__mocks.logoutMock).toHaveBeenCalledTimes(1);
    expect(
      mockedFrappeService.__mocks.resetFrappeInstanceMock,
    ).toHaveBeenCalledTimes(1);
    expect(setItemAsyncMock).toHaveBeenCalledWith("rememberMe", "false");
    expect(result).toEqual({ success: true });
  });

  it("logout still succeeds when no frappe session is available", async () => {
    mockedFrappeService.frappe = null as any;

    const result = await logout();

    expect(
      mockedFrappeService.__mocks.resetFrappeInstanceMock,
    ).toHaveBeenCalledTimes(1);
    expect(setItemAsyncMock).toHaveBeenCalledWith("rememberMe", "false");
    expect(result).toEqual({ success: true });
  });

  it("logout swallows logout errors and still clears session state", async () => {
    mockedFrappeService.frappe = {
      auth: () => ({
        logout: jest.fn().mockRejectedValue(new Error("logout failed")),
      }),
    } as any;

    const result = await logout();

    expect(
      mockedFrappeService.__mocks.resetFrappeInstanceMock,
    ).toHaveBeenCalledTimes(1);
    expect(setItemAsyncMock).toHaveBeenCalledWith("rememberMe", "false");
    expect(result).toEqual({ success: true });
  });

  it("getSystemDateFormat returns the configured date format", async () => {
    mockedFrappeService.__mocks.getDbMock.mockReturnValue({
      getDoc: jest.fn().mockResolvedValue({ date_format: "dd/mm/yyyy" }),
    });

    await expect(getSystemDateFormat()).resolves.toBe("dd/mm/yyyy");
    expect(
      mockedFrappeService.__mocks.ensureAppInitializedMock,
    ).toHaveBeenCalledTimes(1);
  });

  it("getSystemDateFormat uses the default format when settings omit date_format", async () => {
    mockedFrappeService.__mocks.getDbMock.mockReturnValue({
      getDoc: jest.fn().mockResolvedValue({}),
    });

    await expect(getSystemDateFormat()).resolves.toBe("dd-mm-yyyy");
  });

  it("getSystemSettings returns default values when settings are missing", async () => {
    mockedFrappeService.__mocks.getDbMock.mockReturnValue({
      getDoc: jest.fn().mockResolvedValue({}),
    });

    await expect(getSystemSettings()).resolves.toEqual({
      dateFormat: "dd-mm-yyyy",
      numberFormat: "#,###.##",
    });
  });

  it("getSystemDateFormat falls back to defaults when settings lookup fails", async () => {
    mockedFrappeService.__mocks.getDbMock.mockReturnValue({
      getDoc: jest.fn().mockRejectedValue(new Error("settings failed")),
    });

    await expect(getSystemDateFormat()).resolves.toBe("dd-mm-yyyy");
  });

  it("getSystemSettings falls back to defaults when settings lookup fails", async () => {
    mockedFrappeService.__mocks.getDbMock.mockReturnValue({
      getDoc: jest.fn().mockRejectedValue(new Error("settings failed")),
    });

    await expect(getSystemSettings()).resolves.toEqual({
      dateFormat: "dd-mm-yyyy",
      numberFormat: "#,###.##",
    });
  });
});
