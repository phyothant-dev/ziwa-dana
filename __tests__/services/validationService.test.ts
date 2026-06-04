import {
    isValidEmail,
    isValidPassword,
    isValidUrl,
} from "../../services/validationService";

describe("validation helpers", () => {
  describe("isValidUrl", () => {
    it("accepts https urls", () => {
      expect(isValidUrl("https://example.com")).toBe(true);
    });

    it("rejects urls without a scheme", () => {
      expect(isValidUrl("example.com")).toBe(false);
    });

    it("rejects blank values", () => {
      expect(isValidUrl("   ")).toBe(false);
    });
  });

  describe("isValidEmail", () => {
    it("accepts standard email format", () => {
      expect(isValidEmail("user@example.com")).toBe(true);
    });

    it("rejects missing domain", () => {
      expect(isValidEmail("user@localhost")).toBe(false);
    });

    it("rejects blank values", () => {
      expect(isValidEmail("   ")).toBe(false);
    });
  });

  describe("isValidPassword", () => {
    it("accepts passwords with at least 6 characters", () => {
      expect(isValidPassword("abcdef")).toBe(true);
    });

    it("rejects passwords shorter than 6 characters", () => {
      expect(isValidPassword("abc12")).toBe(false);
    });

    it("rejects blank passwords", () => {
      expect(isValidPassword("   ")).toBe(false);
    });
  });
});
