import {
    createPurchaseReceipt,
    getPurchaseReceiptDetails,
} from "../../services/purchaseReceiptService";
import {
    createSupplier,
    getSupplierGroups,
} from "../../services/supplierService";

jest.mock("../../services/frappeService", () => ({
  ensureAppInitialized: jest.fn(),
  getDb: jest.fn(),
}));

const ensureAppInitializedMock = require("../../services/frappeService")
  .ensureAppInitialized as jest.Mock;
const getDbMock = require("../../services/frappeService").getDb as jest.Mock;

describe("supplier and receipt service behavior", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("createSupplier returns parsed supplier creation errors", async () => {
    ensureAppInitializedMock.mockResolvedValue(undefined);
    getDbMock.mockReturnValue({
      createDoc: jest.fn().mockRejectedValue({
        _server_messages: JSON.stringify([
          JSON.stringify({ message: "Supplier already exists." }),
        ]),
      }),
    });

    await expect(
      createSupplier({
        supplier_name: "ABC Traders",
        supplier_group: "All Supplier Groups",
      } as any),
    ).resolves.toEqual({
      success: false,
      error: "Supplier already exists.",
    });
  });

  it("createSupplier returns success with the created supplier data", async () => {
    ensureAppInitializedMock.mockResolvedValue(undefined);
    getDbMock.mockReturnValue({
      createDoc: jest.fn().mockResolvedValue({ name: "SUP-001" }),
    });

    await expect(
      createSupplier({
        supplier_name: "ABC Traders",
        supplier_group: "All Supplier Groups",
      } as any),
    ).resolves.toEqual({
      success: true,
      data: { name: "SUP-001" },
    });
  });

  it("getSupplierGroups returns supplier groups from db", async () => {
    getDbMock.mockReturnValue({
      getDocList: jest.fn().mockResolvedValue([{ name: "Group A" }]),
    });

    await expect(getSupplierGroups()).resolves.toEqual({
      success: true,
      data: [{ name: "Group A" }],
    });
  });

  it("createPurchaseReceipt returns success with created doc data", async () => {
    ensureAppInitializedMock.mockResolvedValue(undefined);
    getDbMock.mockReturnValue({
      createDoc: jest.fn().mockResolvedValue({ name: "RCP-001" }),
    });

    await expect(
      createPurchaseReceipt(
        "SUP-001",
        "WH-1",
        [{ item_code: "ITEM-1", qty: 2, uom: "Nos" }],
        "2026-06-03",
      ),
    ).resolves.toEqual({
      success: true,
      data: { name: "RCP-001" },
    });
  });

  it("getPurchaseReceiptDetails returns receipt details", async () => {
    ensureAppInitializedMock.mockResolvedValue(undefined);
    getDbMock.mockReturnValue({
      getDoc: jest.fn().mockResolvedValue({ name: "RCP-001" }),
    });

    await expect(getPurchaseReceiptDetails("RCP-001")).resolves.toEqual({
      success: true,
      data: { name: "RCP-001" },
    });
  });

  it("createPurchaseReceipt returns parsed server error messages", async () => {
    ensureAppInitializedMock.mockResolvedValue(undefined);
    getDbMock.mockReturnValue({
      createDoc: jest.fn().mockRejectedValue({
        _server_messages: JSON.stringify([
          JSON.stringify({ message: "Receipt creation failed." }),
        ]),
      }),
    });

    await expect(
      createPurchaseReceipt("SUP-001", "WH-1", [], "2026-06-03"),
    ).resolves.toEqual({
      success: false,
      error: "Receipt creation failed.",
    });
  });

  it("createPurchaseReceipt uses the nested inner message from _server_messages", async () => {
    ensureAppInitializedMock.mockResolvedValue(undefined);
    getDbMock.mockReturnValue({
      createDoc: jest.fn().mockRejectedValue({
        _server_messages: JSON.stringify([
          JSON.stringify({ message: "Nested receipt error" }),
        ]),
      }),
    });

    await expect(
      createPurchaseReceipt("SUP-001", "WH-1", [], "2026-06-03"),
    ).resolves.toEqual({
      success: false,
      error: "Nested receipt error",
    });
  });

  it("createPurchaseReceipt falls back to the default message when parsed server payload has no message", async () => {
    ensureAppInitializedMock.mockResolvedValue(undefined);
    getDbMock.mockReturnValue({
      createDoc: jest.fn().mockRejectedValue({
        _server_messages: JSON.stringify([JSON.stringify({})]),
      }),
    });

    await expect(
      createPurchaseReceipt("SUP-001", "WH-1", [], "2026-06-03"),
    ).resolves.toEqual({
      success: false,
      error: "Failed to submit document.",
    });
  });

  it("createPurchaseReceipt falls back to exception text", async () => {
    ensureAppInitializedMock.mockResolvedValue(undefined);
    getDbMock.mockReturnValue({
      createDoc: jest
        .fn()
        .mockRejectedValue({ exception: "Invalid receipt payload" }),
    });

    await expect(
      createPurchaseReceipt("SUP-001", "WH-1", [], "2026-06-03"),
    ).resolves.toEqual({
      success: false,
      error: "Invalid receipt payload",
    });
  });

  it("createPurchaseReceipt falls back to raw server message if JSON parsing fails", async () => {
    ensureAppInitializedMock.mockResolvedValue(undefined);
    getDbMock.mockReturnValue({
      createDoc: jest
        .fn()
        .mockRejectedValue({ _server_messages: "not-valid-json" }),
    });

    await expect(
      createPurchaseReceipt("SUP-001", "WH-1", [], "2026-06-03"),
    ).resolves.toEqual({
      success: false,
      error: "not-valid-json",
    });
  });

  it("createPurchaseReceipt falls back to the message field when no server details exist", async () => {
    ensureAppInitializedMock.mockResolvedValue(undefined);
    getDbMock.mockReturnValue({
      createDoc: jest.fn().mockRejectedValue({ message: "Bad request" }),
    });

    await expect(
      createPurchaseReceipt("SUP-001", "WH-1", [], "2026-06-03"),
    ).resolves.toEqual({
      success: false,
      error: "Bad request",
    });
  });

  it("createPurchaseReceipt falls back to the default message when no error details exist", async () => {
    ensureAppInitializedMock.mockResolvedValue(undefined);
    getDbMock.mockReturnValue({
      createDoc: jest.fn().mockRejectedValue({}),
    });

    await expect(
      createPurchaseReceipt("SUP-001", "WH-1", [], "2026-06-03"),
    ).resolves.toEqual({
      success: false,
      error: "Failed to submit document.",
    });
  });

  it("getPurchaseReceiptDetails returns a failure message when DB lookup fails", async () => {
    ensureAppInitializedMock.mockResolvedValue(undefined);
    getDbMock.mockReturnValue({
      getDoc: jest.fn().mockRejectedValue(new Error("Receipt details failed")),
    });

    await expect(getPurchaseReceiptDetails("RCP-001")).resolves.toEqual({
      success: false,
      error: "Receipt details failed",
    });
  });

  it("getPurchaseReceiptDetails falls back to the default message when the DB error has no message", async () => {
    ensureAppInitializedMock.mockResolvedValue(undefined);
    getDbMock.mockReturnValue({
      getDoc: jest.fn().mockRejectedValue({}),
    });

    await expect(getPurchaseReceiptDetails("RCP-001")).resolves.toEqual({
      success: false,
      error: "Failed to load receipt details",
    });
  });

  it("getSupplierGroups returns parsed supplier-group errors", async () => {
    getDbMock.mockReturnValue({
      getDocList: jest.fn().mockRejectedValue({
        _server_messages: JSON.stringify([
          JSON.stringify({ message: "Supplier group fetch failed." }),
        ]),
      }),
    });

    await expect(getSupplierGroups()).resolves.toEqual({
      success: false,
      error: "Supplier group fetch failed.",
    });
  });
});
