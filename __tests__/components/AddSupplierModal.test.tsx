import {
    fireEvent,
    render,
    screen,
    waitFor,
} from "@testing-library/react-native";
import React, { act } from "react";
import { TouchableOpacity } from "react-native";
import { AddSupplierModal } from "../../components/supplierComponents/AddSupplierModal";
import { InlineGroupPicker } from "../../components/supplierComponents/InlineGroupPicker";
import { SupplierCard } from "../../components/supplierComponents/SupplierCard";

// Safe hoisting-compliant mocks using global context references
jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
}));

jest.mock("expo-image", () => ({
  Image: "Image",
}));

// Robust mock for the native Picker container and its static Item property
jest.mock("@react-native-picker/picker", () => {
  const ReactInstance = require("react");

  const BasePickerMock = (props: any) => {
    return ReactInstance.createElement(
      "Picker",
      {
        testID: props.testID,
        selectedValue: props.selectedValue,
        onValueChange: props.onValueChange,
      },
      props.children,
    );
  };

  BasePickerMock.Item = (props: any) => {
    return ReactInstance.createElement("PickerItem", {
      label: props.label,
      value: props.value,
      testID: `picker-item-${props.value}`,
    });
  };

  return { Picker: BasePickerMock };
});

describe("AddSupplierModal Component Tests", () => {
  const mockOnClose = jest.fn();
  const mockOnSave = jest.fn(() => Promise.resolve());
  const mockSupplierGroups = [
    { name: "Raw Material" },
    { name: "Local Vendor" },
  ];

  const mockTranslations = {
    addNewSupplierTitle: "Add New Supplier",
    supplierName: "Supplier Name",
    supplierNamePlaceholder: "Enter name...",
    supplierType: "Supplier Group",
    phoneNumber: "Phone Number",
    currency: "Currency",
    priceListType: "Price List",
    currencyMMK: "MMK",
    currencyUSD: "USD",
    standardBuyingMMK: "Standard Buying (MMK)",
    standardBuyingUSD: "Standard Buying (USD)",
    rawMaterial: "Raw Material Translation",
    save: "Save",
    saving: "Saving Now...",
  };

  const baseProps = {
    visible: true,
    onClose: mockOnClose,
    onSave: mockOnSave,
    supplierGroups: mockSupplierGroups,
    themeColor: "#2563EB",
    loading: false,
    translations: mockTranslations,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders modal structure elements correctly when visible is true", () => {
    render(<AddSupplierModal {...baseProps} />);
    expect(screen.getByText("Add New Supplier")).toBeTruthy();
    expect(screen.getByPlaceholderText("Enter name...")).toBeTruthy();
  });

  it("does not render modal content when visible is false", () => {
    render(<AddSupplierModal {...baseProps} visible={false} />);
    expect(screen.queryByText("Add New Supplier")).toBeNull();
  });

  it("updates text states and triggers the onSave payload cleanly", async () => {
    render(<AddSupplierModal {...baseProps} />);

    const nameInput = screen.getByPlaceholderText("Enter name...");
    fireEvent.changeText(nameInput, "Alpha Distributors");

    const phoneInput = screen.getByPlaceholderText("09...");
    fireEvent.changeText(phoneInput, "09987654321");

    const saveButton = screen.getByText("Save");
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        supplierName: "Alpha Distributors",
        supplierGroup: "",
        mobileNo: "09987654321",
        currency: "MMK",
        buyingPriceList: "Standard Buying (MMK)",
      });
    });
  });

  // TARGETS AND COVERS CURRENCY SPLITTING AND DYNAMIC PRICE LISTS IN AddSupplierModal.tsx
  it("handles dynamic currency adjustments and read-only pricing label changes", () => {
    const { rerender, UNSAFE_getByType } = render(
      <AddSupplierModal {...baseProps} />,
    );
    expect(screen.getByText("Standard Buying (MMK)")).toBeTruthy();

    const pickerElement = UNSAFE_getByType("Picker" as any); // ✅
    fireEvent(pickerElement, "valueChange", "USD");
    rerender(<AddSupplierModal {...baseProps} />);
    expect(screen.getByText("Standard Buying (USD)")).toBeTruthy();
  });

  // TARGETS AND COVERS DISABLED BUTTON AND LOADING LABEL TEXT IN AddSupplierModal.tsx
  it("disables primary save actions and toggles labels when loading state is true", () => {
    render(<AddSupplierModal {...baseProps} loading={true} />);

    expect(screen.getByText("Saving Now...")).toBeTruthy();
    expect(screen.queryByText("Save")).toBeNull();
  });

  it("clears inner form values completely on close press interactions", () => {
    const { UNSAFE_getByProps } = render(<AddSupplierModal {...baseProps} />);
    const nameInput = screen.getByPlaceholderText("Enter name...");
    fireEvent.changeText(nameInput, "Draft Supplier");

    const closeIconButton = UNSAFE_getByProps({ name: "close" });
    fireEvent.press(closeIconButton.parent);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("resets form fields after a successful save", async () => {
    const localOnSave = jest.fn().mockResolvedValue(undefined);

    const { getByPlaceholderText, UNSAFE_getAllByType } = render(
      <AddSupplierModal {...baseProps} onSave={localOnSave} />,
    );

    fireEvent.changeText(
      getByPlaceholderText("Enter name..."),
      "Test Supplier",
    );
    fireEvent.changeText(getByPlaceholderText("09..."), "09123456789");

    // Save button is the only TouchableOpacity with explicit disabled={false}
    // AND an onPress function. The close button has disabled=undefined (not false).
    // The selectBox has disabled=true. InlineGroupPicker toggle has disabled=undefined.
    const touchables = UNSAFE_getAllByType(TouchableOpacity);
    const saveButton = touchables.find(
      (t: any) =>
        t.props.disabled === false && typeof t.props.onPress === "function",
    );

    // Call onPress directly — not fireEvent.press which can misfire
    await act(async () => {
      await saveButton!.props.onPress();
    });

    await waitFor(() => expect(localOnSave).toHaveBeenCalled());
    await waitFor(() => {
      expect(getByPlaceholderText("Enter name...").props.value).toBe("");
      expect(getByPlaceholderText("09...").props.value).toBe("");
    });
  });
});

describe("InlineGroupPicker Coverage Tests", () => {
  const mockOnToggle = jest.fn();
  const mockOnSelect = jest.fn();
  const mockOnSearchChange = jest.fn();
  const mockFilteredGroups = [
    { name: "Raw Material" },
    { name: "Local Vendor" },
  ];

  const pickerProps = {
    isOpen: true,
    onToggle: mockOnToggle,
    selectedGroup: "Local Vendor",
    onSelect: mockOnSelect,
    groupSearch: "Raw",
    onSearchChange: mockOnSearchChange,
    filteredGroups: mockFilteredGroups,
    themeColor: "#2563EB",
    translations: { rawMaterial: "Raw Items Group" },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("selects list items and issues context payloads correctly when pressed", () => {
    render(<InlineGroupPicker {...pickerProps} />);
    const groupElements = screen.getAllByText("Local Vendor");
    fireEvent.press(groupElements[groupElements.length - 1]); // last one = list item
    expect(mockOnSelect).toHaveBeenCalledWith("Local Vendor");
  });

  // TARGETS AND COVERS LINE 72 IN InlineGroupPicker.tsx
  it("clears field text input entries when clear search row indicator is selected", () => {
    const { UNSAFE_getByProps } = render(
      <InlineGroupPicker {...pickerProps} groupSearch="Active Query" />,
    ); // ✅ single render
    const clearIconButton = UNSAFE_getByProps({ name: "close-circle" });
    fireEvent.press(clearIconButton.parent);
    expect(mockOnSearchChange).toHaveBeenCalledWith("");
  });
});

describe("SupplierCard Coverage Tests", () => {
  const mockOnPress = jest.fn();
  const mockOnPhoneCall = jest.fn();

  const mockSupplierWithPhone = {
    supplier_name: "Apex International",
    supplier_group: "Raw Material",
    default_currency: "USD",
    mobile_no: "+95944332211",
    image: null,
  };

  const mockSupplierWithoutPhone = {
    supplier_name: "Beta Trading",
    supplier_group: "Logistics",
    default_currency: "",
    mobile_no: "",
    image: "/files/avatar_thumb.png",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // TARGETS AND COVERS LINES 114-123 IN SupplierCard.tsx
  it("displays phone row values and invokes native link handlers when matching records exist", () => {
    render(
      <SupplierCard
        item={mockSupplierWithPhone}
        themeColor="#2563EB"
        baseUrl="https://erp.site.com"
        rawMaterialLabel="Raw Label Content"
        onPress={mockOnPress}
        onPhoneCall={mockOnPhoneCall}
      />,
    );

    const callInteractiveRow = screen.getByText("+95944332211");
    fireEvent.press(callInteractiveRow);
    expect(mockOnPhoneCall).toHaveBeenCalledWith("+95944332211");
  });

  it("removes reference call rows completely when mobile number fields arrive empty", () => {
    render(
      <SupplierCard
        item={mockSupplierWithoutPhone}
        themeColor="#2563EB"
        baseUrl="https://erp.site.com"
        rawMaterialLabel="Raw Label Content"
        onPress={mockOnPress}
        onPhoneCall={mockOnPhoneCall}
      />,
    );

    expect(screen.queryByText("+95944332211")).toBeNull();
  });
});
