import { SupplierDetailModal } from "@/components/supplierComponents/SupplierDetailModal";
import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";
import { TouchableOpacity } from "react-native";

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
}));

jest.mock("expo-image", () => ({
  Image: "Image",
}));

describe("SupplierDetailModal", () => {
  const mockSupplierBase = {
    name: "SUP-001",
    supplier_name: "Golden Supply",
    supplier_group: "Local Vendor",
    default_currency: "MMK",
    mobile_no: "+95912345678",
  };

  const mockTranslations = {
    supplierInfoTitle: "Supplier Details",
    supplierType: "Type",
    currency: "Currency",
    currencyMMK: "Myanmar Kyat (MMK)",
    currencyUSD: "United States Dollar (USD)",
    rawMaterial: "Raw Material Items",
    noPhoneNumber: "No Phone Number Available",
  };

  const baseProps = {
    supplier: mockSupplierBase,
    onClose: jest.fn(),
    baseUrl: "https://demo.frappe.cloud",
    themeColor: "#2563EB",
    onPhoneCall: jest.fn(),
    translations: mockTranslations,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- Visibility check ---
  it("does not render modal content when supplier prop is null", () => {
    render(
      React.createElement(SupplierDetailModal, {
        ...baseProps,
        supplier: null,
      }),
    );

    // screen.queryByText က text မရှိရင် error မတက်ဘဲ null ပြန်ပေးလို့ visibility check ဖို့ သုံးပါတယ်
    expect(screen.queryByText("Supplier Details")).toBeNull();
  });

  // --- Main Render & Text Initials Avatar Check ---
  it("renders supplier details, initials avatar, and translation values", () => {
    render(React.createElement(SupplierDetailModal, baseProps));

    expect(screen.getByText("Supplier Details")).toBeTruthy();
    expect(screen.getByText("Golden Supply")).toBeTruthy();
    expect(screen.getByText("GO")).toBeTruthy(); // Substring text avatar check
    expect(screen.getByText("+95912345678")).toBeTruthy();
  });

  // --- Image Rendering Logic Paths (Branches) ---
  it("renders absolute image URLs directly", () => {
    const absoluteImageSupplier = {
      ...mockSupplierBase,
      image: "https://images.unsplash.com/avatar.png",
    };

    const { UNSAFE_getByType } = render(
      React.createElement(SupplierDetailModal, {
        ...baseProps,
        supplier: absoluteImageSupplier,
      }),
    );

    const imageComponent = UNSAFE_getByType("Image");
    expect(imageComponent.props.source.uri).toBe(
      "https://images.unsplash.com/avatar.png",
    );
  });

  it("prefixes relative image paths with baseUrl", () => {
    const relativeImageSupplier = {
      ...mockSupplierBase,
      image: "/files/avatar.png",
    };

    const { UNSAFE_getByType } = render(
      React.createElement(SupplierDetailModal, {
        ...baseProps,
        supplier: relativeImageSupplier,
      }),
    );

    const imageComponent = UNSAFE_getByType("Image");
    expect(imageComponent.props.source.uri).toBe(
      "https://demo.frappe.cloud/files/avatar.png",
    );
  });

  // --- Dynamic Translation Fallbacks ---
  it("translates Raw Material groups and USD currencies cleanly", () => {
    const alternativeSupplier = {
      ...mockSupplierBase,
      supplier_group: "Raw Material",
      default_currency: "USD",
    };

    render(
      React.createElement(SupplierDetailModal, {
        ...baseProps,
        supplier: alternativeSupplier,
      }),
    );

    expect(screen.getByText("Raw Material Items")).toBeTruthy();
    expect(screen.getByText("United States Dollar (USD)")).toBeTruthy();
  });

  // --- User Interactions (Events) ---
  it("calls onPhoneCall when phone button text is pressed", () => {
    const onPhoneCall = jest.fn();
    render(
      React.createElement(SupplierDetailModal, { ...baseProps, onPhoneCall }),
    );

    const phoneButton = screen.getByText("+95912345678");
    fireEvent.press(phoneButton);

    expect(onPhoneCall).toHaveBeenCalledWith("+95912345678");
  });

  it("calls onClose when the close icon wrapper is pressed", () => {
    const onClose = jest.fn();
    const { UNSAFE_getByProps } = render(
      React.createElement(SupplierDetailModal, { ...baseProps, onClose }),
    );

    // Ionicons 'close' ရဲ့ အပြင်က TouchableOpacity ကို ရှာပြီး press အလုပ်လုပ်ခိုင်းတာဖြစ်ပါတယ်
    const closeIconButton = UNSAFE_getByProps({ name: "close" }).parent;
    fireEvent.press(closeIconButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // --- 100% Branch Coverage Strategy Trick ---
  it("shows fallback placeholder options when phone number is missing", () => {
    render(
      React.createElement(SupplierDetailModal, {
        ...baseProps,
        supplier: {
          ...mockSupplierBase,
          mobile_no: undefined as any, // 100% branch coverage ရဖို့အတွက် မင်းရဲ့ အကြိုက်ဆုံး style ဖြစ်တဲ့ 'as any' ကို ဆက်သုံးပေးထားပါတယ်
        },
      }),
    );

    expect(screen.getByText("No Phone Number Available")).toBeTruthy();
  });

  it("executes onClose handler when modal triggers onRequestClose property boundary event", () => {
    const onClose = jest.fn();
    const { UNSAFE_getByType } = render(
      React.createElement(SupplierDetailModal, { ...baseProps, onClose }),
    );

    const modalComponent = UNSAFE_getByType("Modal");
    modalComponent.props.onRequestClose();

    expect(onClose).toHaveBeenCalled();
  });

  it("renders cleanly without throwing even when optional fields are completely blank", () => {
    const sparseSupplier = {
      name: "SUP-999",
      supplier_name: "Sparse Co",
      avatar_short: "SC",
      image: null,
      supplier_group: "Local Vendor",
      mobile_no: "", // Force line 170 fallback rendering option
    };

    render(
      React.createElement(SupplierDetailModal, {
        supplier: sparseSupplier,
        onClose: jest.fn(),
        baseUrl: "https://demo.frappe.cloud",
        themeColor: "#2563EB",
        onPhoneCall: jest.fn(),
        translations: { noPhoneNumber: "No Phone Number Provided" },
      }),
    );

    expect(screen.getByText("No Phone Number Provided")).toBeTruthy();
  });
  // Covers line 170 branch: mobile_no falsy so onPhoneCall must NOT be called
  it("does not call onPhoneCall when mobile_no is empty and phone TouchableOpacity is pressed", () => {
    const onPhoneCall = jest.fn();
    const { UNSAFE_getAllByType } = render(
      React.createElement(SupplierDetailModal, {
        ...baseProps,
        onPhoneCall,
        supplier: { ...mockSupplierBase, mobile_no: "" },
      }),
    );

    const touchables = UNSAFE_getAllByType(TouchableOpacity);
    const phoneTouchable = touchables.find(
      (t: any) => t.props.disabled === true,
    );

    // Directly invoke onPress to execute the && short-circuit branch
    // phoneTouchable.props.onPress() executes: "" && onPhoneCall(...) -> short-circuits
    phoneTouchable!.props.onPress();

    expect(onPhoneCall).not.toHaveBeenCalled();
  });
});
