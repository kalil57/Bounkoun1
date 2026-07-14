export function isValidUuid(uuid) {
  if (!uuid) return false;
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return regex.test(uuid);
}

export function validateTextInput(text, minLength = 2) {
  return typeof text === "string" && text.trim().length >= minLength;
}
