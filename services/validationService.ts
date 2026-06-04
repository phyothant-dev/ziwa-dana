const EMAIL_REGEX = /\S+@\S+\.\S+/;

export const isValidUrl = (value: string): boolean => {
  const trimmed = value.trim();

  if (!trimmed) return false;

  return (
    trimmed.toLowerCase().startsWith("http://") ||
    trimmed.toLowerCase().startsWith("https://")
  );
};

export const isValidEmail = (value: string): boolean => {
  const trimmed = value.trim();

  if (!trimmed) return false;

  return EMAIL_REGEX.test(trimmed);
};

export const isValidPassword = (value: string): boolean => {
  return value.trim().length >= 6;
};
