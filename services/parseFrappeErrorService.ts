export const parseFrappeError = (error: any): string => {
  if (error?._server_messages) {
    try {
      const parsed = JSON.parse(error._server_messages);
      const inner = JSON.parse(parsed[0]);
      return inner.message || "Unknown server error.";
    } catch {
      return String(error._server_messages);
    }
  }
  if (error?.exception) return error.exception;
  if (error?.httpStatusText) return error.httpStatusText;
  if (error?.message) return error.message;
  return "An unexpected error occurred.";
};
