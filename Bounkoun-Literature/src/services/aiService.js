import { GoogleGenAI } from "@google/genai";

const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL = "gemini-2.5-flash";

export async function summarizeAbstract(abstract) {
  if (!abstract || abstract.trim() === "") {
    return "No abstract available to summarize.";
  }

  try {
    const response = await client.models.generateContent({
      model: MODEL,
      contents: `Summarize the following academic abstract concisely and clearly. Focus on the main objective, methodology, key findings, and implications:\n\n${abstract}`
    });
    return response.text.trim();
  } catch (error) {
    console.error("Error summarizing abstract via AI:", error.message);
    throw new Error(`AI summarization failed: ${error.message}`);
  }
}

export async function extractCitations(text) {
  if (!text || text.trim() === "") {
    return [];
  }

  try {
    const prompt = `
Analyze the following academic text and extract all citations or generate formal citations based on it.
Text:
"${text}"

Return ONLY a JSON array of citations. Each citation in the array should be a string (e.g., APA style, containing authors, year, title, and source).
Do not return any explanations, markdown code blocks, or preamble. Return just the JSON array.
`;

    const response = await client.models.generateContent({
      model: MODEL,
      contents: prompt
    });

    let jsonText = response.text.trim();
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.replace(/^```json/, "").replace(/```$/, "").trim();
    } else if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```/, "").replace(/```$/, "").trim();
    }

    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Error extracting citations via AI:", error.message);
    throw new Error(`AI citation extraction failed: ${error.message}`);
  }
}
