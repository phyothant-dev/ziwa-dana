import { fireEvent, render } from "@testing-library/react-native";
import { router } from "expo-router";
import React from "react";
import { SupplierReceiptGroup } from "../../components/supplierComponents/SupplierReceiptGroup";

jest.mock("expo-router", () => ({
  router: {
    push: jest.fn(),
  },
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
}));

describe("SupplierReceiptGroup", () => {
  const item = {
    supplier_name: "ABC Traders",
    avatar_short: "AT",
    receipts_count: 2,
    receipts: [
      {
        name: "RCP-1001",
        supplier: "SUP-001",
        supplier_name: "ABC Traders",
        posting_date: "2026-06-01",
        grand_total: 1250,
        total_qty: 5, // Branch Path 1: Testing a real quantity value
      },
    ],
  };

  const baseProps = {
    item,
    themeColor: "#2563EB",
    translations: {
      countWithUnit: "{{count}} receipts",
      add: "Add",
      currencyFormat: "MMK {{amount}}",
      totalItemsCount: "{{count}} items",
    },
    dateFormat: "dd-mm-yyyy",
    numberFormat: "#,###.##",
    applyFrappeDateFormat: jest.fn(
      (dateStr: string | undefined) => `formatted:${dateStr}`,
    ),
    applyFrappeNumberFormat: jest.fn(() => `1,250.00`),
    onSelectReceipt: jest.fn(),
  };

  it("renders supplier details, receipt summary, and formatted values", () => {
    const { getByText } = render(
      React.createElement(SupplierReceiptGroup, baseProps),
    );

    expect(getByText("ABC Traders")).toBeTruthy();
    expect(getByText("RCP-1001")).toBeTruthy();
    expect(getByText("2 receipts")).toBeTruthy();
    expect(getByText("MMK 1,250.00")).toBeTruthy();
    expect(getByText("5 items")).toBeTruthy();
  });

  it("calls onSelectReceipt when a receipt card is pressed", () => {
    const onSelectReceipt = jest.fn();
    const { getByText } = render(
      React.createElement(SupplierReceiptGroup, {
        ...baseProps,
        onSelectReceipt,
      }),
    );

    fireEvent.press(getByText("RCP-1001"));

    expect(onSelectReceipt).toHaveBeenCalledWith(item.receipts[0]);
  });

  it("navigates to add purchase receipt for the supplier when add button is pressed", () => {
    const { getByText } = render(
      React.createElement(SupplierReceiptGroup, baseProps),
    );

    fireEvent.press(getByText("Add"));

    expect(router.push).toHaveBeenCalledWith({
      pathname: "/add_purchase_receipt",
      params: { supplierName: "ABC Traders" },
    });
  });

  it("shows 0 items when total_qty is missing", () => {
    const { getByText } = render(
      React.createElement(SupplierReceiptGroup, {
        ...baseProps,
        item: {
          ...item,
          receipts: [{ ...item.receipts[0], total_qty: undefined }],
        },
      }),
    );

    expect(getByText("0 items")).toBeTruthy();
  });
});
