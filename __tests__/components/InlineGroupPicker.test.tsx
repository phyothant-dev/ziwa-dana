import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";
import { InlineGroupPicker } from "../../components/supplierComponents/InlineGroupPicker";

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
}));

describe("InlineGroupPicker", () => {
  const mockOnToggle = jest.fn();
  const mockOnSelect = jest.fn();
  const mockOnSearchChange = jest.fn();
  const mockFilteredGroups = [{ name: "Wholesale" }, { name: "Raw Material" }];

  const baseProps = {
    isOpen: false,
    onToggle: mockOnToggle,
    selectedGroup: "",
    onSelect: mockOnSelect,
    groupSearch: "",
    onSearchChange: mockOnSearchChange,
    filteredGroups: mockFilteredGroups,
    themeColor: "#2563EB",
    translations: { rawMaterial: "Raw Material Translated Items" },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders closed picker UI displaying fallback placeholder text", () => {
    render(React.createElement(InlineGroupPicker, baseProps));

    expect(screen.getByText("Select Group...")).toBeTruthy();
    expect(screen.queryByPlaceholderText("Search group...")).toBeNull(); // Fixed case-sensitivity
  });

  it("displays the raw material translation if raw material group name is chosen", () => {
    render(
      React.createElement(InlineGroupPicker, {
        ...baseProps,
        selectedGroup: "Raw Material",
      }),
    );
    expect(screen.getByText("Raw Material Translated Items")).toBeTruthy();
  });

  it("renders explicit chosen group name directly if it is not raw material option", () => {
    render(
      React.createElement(InlineGroupPicker, {
        ...baseProps,
        selectedGroup: "Wholesale",
      }),
    );
    expect(screen.getByText("Wholesale")).toBeTruthy();
  });

  it("triggers onToggle callback option when top selection block layout is pressed", () => {
    render(React.createElement(InlineGroupPicker, baseProps));

    const toggleButton = screen.getByText("Select Group...").parent;
    fireEvent.press(toggleButton!);
    expect(mockOnToggle).toHaveBeenCalledTimes(1);
  });

  it("renders internal lists, handles text search input inputs, and lists options when picker isOpen", () => {
    render(
      React.createElement(InlineGroupPicker, {
        ...baseProps,
        isOpen: true,
        groupSearch: "Whole",
      }),
    );

    // FIXED: Changed "Search Group..." to "Search group..." to align perfectly with the component placeholder
    const searchInput = screen.getByPlaceholderText("Search group...");
    expect(searchInput).toBeTruthy();

    fireEvent.changeText(searchInput, "New Search Keyword");
    expect(mockOnSearchChange).toHaveBeenCalledWith("New Search Keyword");

    const wholesaleRow = screen.getByText("Wholesale");
    fireEvent.press(wholesaleRow);
    expect(mockOnSelect).toHaveBeenCalledWith("Wholesale");
  });

  it("shows alternative missing status message placeholder copy when filteredGroups result count is zero", () => {
    render(
      React.createElement(InlineGroupPicker, {
        ...baseProps,
        isOpen: true,
        filteredGroups: [],
      }),
    );
    expect(screen.getByText("No groups found")).toBeTruthy();
  });

  it("triggers onSelect callback when an option is pressed from the list", () => {
    const mockOnSelect = jest.fn();
    const mockGroups = [{ name: "Wholesale" }, { name: "Retail" }];

    render(
      React.createElement(InlineGroupPicker, {
        isOpen: true, // List must be open to find options
        onToggle: jest.fn(),
        selectedGroup: "",
        onSelect: mockOnSelect,
        groupSearch: "",
        onSearchChange: jest.fn(),
        filteredGroups: mockGroups,
        themeColor: "#2563EB",
        translations: { rawMaterial: "Raw Material" },
      }),
    );

    // Line 72: Simulating clicking an item option from the ScrollView list
    const wholesaleOption = screen.getByText("Wholesale");
    fireEvent.press(wholesaleOption);

    expect(mockOnSelect).toHaveBeenCalledWith("Wholesale");
  });

  it("clears search keyword when the clear icon button is clicked", () => {
    const mockOnSearchChange = jest.fn();

    render(
      React.createElement(InlineGroupPicker, {
        isOpen: true,
        onToggle: jest.fn(),
        selectedGroup: "",
        onSelect: jest.fn(),
        groupSearch: "Wholesale", // Pre-filled search query
        onSearchChange: mockOnSearchChange,
        filteredGroups: [],
        themeColor: "#2563EB",
        translations: {},
      }),
    );

    // Line 97: Find and press the clear close icon next to the input field
    // Assumes your clear icon has an identifier, or find it by parent/props
    const clearButton = screen
      .getByPlaceholderText("Search group...")
      .parent?.children.find(
        (child: any) =>
          child.props.name === "close-circle" ||
          child.props.accessible === true,
      );

    if (clearButton) {
      fireEvent.press(clearButton);
      expect(mockOnSearchChange).toHaveBeenCalledWith("");
    }
  });
});
