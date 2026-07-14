export function cleanMarkdownJson(text) {
  if (!text) return "";
  let cleaned = text.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json/, "").replace(/```$/, "").trim();
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```/, "").replace(/```$/, "").trim();
  }
  return cleaned;
}

export function formatBilingualOutput(englishText, frenchText) {
  return {
    english: englishText,
    french: frenchText
  };
}
