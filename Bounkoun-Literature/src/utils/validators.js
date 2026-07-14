export function isValidUuid(uuid) {
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return regex.test(uuid);
}

export function validateSearchQuery(query) {
  if (!query || typeof query !== "string") return false;
  return query.trim().length >= 2;
}
