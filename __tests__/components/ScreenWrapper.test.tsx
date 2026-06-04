import { render } from "@testing-library/react-native";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ScreenWrapper from "../../components/ScreenWrapper";

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: jest.fn(),
}));

describe("ScreenWrapper", () => {
  beforeEach(() => {
    (useSafeAreaInsets as jest.Mock).mockReturnValue({ top: 24 });
  });

  it("renders its children and applies safe-area padding", () => {
    const { toJSON } = render(
      <ScreenWrapper bg="#FFFFFF">Screen content</ScreenWrapper>,
    );

    expect(toJSON()).toBeTruthy();
    expect(toJSON()).toMatchObject({
      props: { style: expect.objectContaining({ backgroundColor: "#FFFFFF" }) },
    });
  });

  it("falls back to the default top padding when the inset is zero", () => {
    (useSafeAreaInsets as jest.Mock).mockReturnValue({ top: 0 });

    const { toJSON } = render(
      <ScreenWrapper bg="#FFFFFF">Screen content</ScreenWrapper>,
    );

    expect(toJSON()).toMatchObject({
      props: {
        style: expect.objectContaining({
          paddingTop: 30,
          backgroundColor: "#FFFFFF",
        }),
      },
    });
  });
});
