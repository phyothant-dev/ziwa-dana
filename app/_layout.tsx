import { Stack } from "expo-router";
import React from "react";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="home" />
      <Stack.Screen name="supplier" />
      <Stack.Screen name="add_purchase_receipt" />
      <Stack.Screen name="purchase_receipt" />
    </Stack>
  );
}
