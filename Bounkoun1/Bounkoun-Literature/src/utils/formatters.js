export function formatAuthors(authors) {
  if (!Array.isArray(authors) || authors.length === 0) return "Unknown Author";
  if (authors.length === 1) return authors[0];
  if (authors.length === 2) return `${authors[0]} & ${authors[1]}`;
  return `${authors[0]} et al.`;
}

export function cleanString(str) {
  if (!str) return "";
  return str.trim().replace(/\s+/g, " ");
}

export function generateSimpleId() {
  return "paper-" + Math.random().toString(36).substring(2, 11);
}
