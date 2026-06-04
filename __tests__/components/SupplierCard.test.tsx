import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";
import { TouchableOpacity } from "react-native";
import { SupplierCard } from "../../components/supplierComponents/SupplierCard";

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
}));

jest.mock("expo-image", () => ({
  Image: "Image",
}));

describe("SupplierCard", () => {
  const mockOnPress = jest.fn();
  const mockOnPhoneCall = jest.fn();

  const mockSupplierBase = {
    name: "SUP-999",
    supplier_name: "Yangon Retail Co",
    supplier_group: "Local Vendor",
    default_currency: "MMK",
  };

  const baseProps = {
    item: mockSupplierBase,
    themeColor: "#2563EB",
    baseUrl: "https://demo.frappe.cloud",
    rawMaterialLabel: "Raw Materials",
    onPress: mockOnPress,
    onPhoneCall: mockOnPhoneCall,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders initials avatar text and name information without an active image field link", () => {
    render(React.createElement(SupplierCard, baseProps));

    expect(screen.getByText("Yangon Retail Co")).toBeTruthy();
    expect(screen.getByText("Local Vendor")).toBeTruthy();
    expect(screen.getByText("YA")).toBeTruthy();
  });

  it("appends baseUrl correctly if target image property utilizes a relative route path", () => {
    const itemWithRelativeImg = {
      ...mockSupplierBase,
      image: "/files/supplier_profile.jpg",
    };
    const { UNSAFE_getByType } = render(
      React.createElement(SupplierCard, {
        ...baseProps,
        item: itemWithRelativeImg,
      }),
    );

    const imgNode = UNSAFE_getByType("Image");
    expect(imgNode.props.source.uri).toBe(
      "https://demo.frappe.cloud/files/supplier_profile.jpg",
    );
  });

  it("utilizes image path immediately without modification if it maps out as an absolute HTTP prefix link", () => {
    const itemWithAbsoluteImg = {
      ...mockSupplierBase,
      image: "https://externalwebsite.com/logo.png",
    };
    const { UNSAFE_getByType } = render(
      React.createElement(SupplierCard, {
        ...baseProps,
        item: itemWithAbsoluteImg,
      }),
    );

    const imgNode = UNSAFE_getByType("Image");
    expect(imgNode.props.source.uri).toBe(
      "https://externalwebsite.com/logo.png",
    );
  });

  it("renders designated localized translation row labels when group matches Raw Material string criteria", () => {
    const rawMaterialItem = {
      ...mockSupplierBase,
      supplier_group: "Raw Material",
    };
    render(
      React.createElement(SupplierCard, {
        ...baseProps,
        item: rawMaterialItem,
      }),
    );

    expect(screen.getByText("Raw Materials")).toBeTruthy();
  });

  it("executes onPress row function callback parameters successfully when entire card body area is selected", () => {
    render(React.createElement(SupplierCard, baseProps));

    const cardContainerButton =
      screen.getByText("Yangon Retail Co").parent?.parent?.parent;
    fireEvent.press(cardContainerButton!);
    expect(mockOnPress).toHaveBeenCalledWith(mockSupplierBase);
  });

  it("omits the visual telephone option layout wrapper elements completely if mobile_no field matches undefined parameters", () => {
    const { UNSAFE_queryByProps } = render(
      React.createElement(SupplierCard, {
        ...baseProps,
        item: { ...mockSupplierBase, mobile_no: undefined as any },
      }),
    );

    expect(UNSAFE_queryByProps({ name: "call" })).toBeNull();
  });

  // FIXED: Changed expectation locator from "AA" to "AU" to reflect component extraction logic
  it("renders text avatar fallback when supplier image is not provided", () => {
    const supplierWithoutImage = {
      name: "SUP-002",
      supplier_name: "Aung Aung",
      image: null,
      supplier_group: "Local Vendor",
      mobile_no: "09111222",
    };

    const { getByText } = render(
      React.createElement(SupplierCard, {
        item: supplierWithoutImage,
        themeColor: "#2563EB",
        baseUrl: "https://demo.frappe.cloud",
        rawMaterialLabel: "Raw Material",
        onPress: jest.fn(),
        onPhoneCall: jest.fn(),
      }),
    );

    // Evaluates "Aung Aung".substring(0, 2).toUpperCase() -> "AU"
    expect(getByText("AU")).toBeTruthy();
  });

  // Covers lines 114-123: pressing the phone TouchableOpacity directly
  it("fires onPhoneCall triggers smoothly if an user clicks active phone icon action wrappers while mobile_no details are loaded", () => {
    const onPhoneCall = jest.fn();
    const supplierWithPhone = { ...mockSupplierBase, mobile_no: "099876543" };
    const { UNSAFE_getAllByType } = render(
      React.createElement(SupplierCard, {
        ...baseProps,
        item: supplierWithPhone,
        onPhoneCall,
      }),
    );

    const touchables = UNSAFE_getAllByType(TouchableOpacity);
    // Call onPress directly — fireEvent.press on UNSAFE instances doesn't invoke onPress
    touchables[1].props.onPress();
    expect(onPhoneCall).toHaveBeenCalledWith("099876543");
  });

  // Covers lines 114-123: direct invocation of the arrow function body
  it("calls onPhoneCall when the phone row TouchableOpacity is pressed directly", () => {
    const onPhoneCall = jest.fn();
    const { UNSAFE_getAllByType } = render(
      React.createElement(SupplierCard, {
        ...baseProps,
        item: { ...mockSupplierBase, mobile_no: "099876543" },
        onPhoneCall,
      }),
    );

    const touchables = UNSAFE_getAllByType(TouchableOpacity);
    touchables[1].props.onPress();
    expect(onPhoneCall).toHaveBeenCalledWith("099876543");
  });
});
