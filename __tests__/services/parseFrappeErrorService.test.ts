import { parseFrappeError } from "../../services/parseFrappeErrorService";

describe("parseFrappeError", () => {
  it("returns the message from _server_messages", () => {
    const error = {
      _server_messages: JSON.stringify([
        JSON.stringify({ message: "Item not found." }),
      ]),
    };

    expect(parseFrappeError(error)).toBe("Item not found.");
  });

  it("returns 'Unknown server error.' if _server_messages is valid JSON but lacks a message field", () => {
    const error = {
      _server_messages: JSON.stringify([JSON.stringify({ status: "failed" })]),
    };

    expect(parseFrappeError(error)).toBe("Unknown server error.");
  });

  it("returns the raw _server_messages string if JSON parsing fails", () => {
    const error = {
      _server_messages: "A raw, non-JSON error message from the server",
    };

    expect(parseFrappeError(error)).toBe(
      "A raw, non-JSON error message from the server",
    );
  });

  it("prefers exception over httpStatusText and message", () => {
    const error = {
      exception: "Invalid token",
      httpStatusText: "Bad Request",
      message: "Fallback message",
    };

    expect(parseFrappeError(error)).toBe("Invalid token");
  });

  it("prefers httpStatusText over message when exception is absent", () => {
    const error = {
      httpStatusText: "Bad Request",
      message: "Fallback message",
    };

    expect(parseFrappeError(error)).toBe("Bad Request");
  });

  it("uses message when no exception or httpStatusText exists", () => {
    const error = { message: "Network error" };

    expect(parseFrappeError(error)).toBe("Network error");
  });

  it("handles null and undefined values safely", () => {
    expect(parseFrappeError(null)).toBe("An unexpected error occurred.");
    expect(parseFrappeError(undefined)).toBe("An unexpected error occurred.");
  });

  it("returns httpStatusText when available", () => {
    const error = { httpStatusText: "Bad Request" };

    expect(parseFrappeError(error)).toBe("Bad Request");
  });

  it("falls back to error.message when no server message is available", () => {
    const error = { message: "Network error" };

    expect(parseFrappeError(error)).toBe("Network error");
  });

  it("returns a default message for unknown errors", () => {
    const error = {};

    expect(parseFrappeError(error)).toBe("An unexpected error occurred.");
  });
});
