import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";

dotenv.config();

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

export async function summarizeAbstract(abstract) {
  if (!abstract || abstract.trim() === "") {
    return "No abstract available to summarize.";
  }

  try {
    const response = await client.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: `Summarize the following academic abstract concisely and clearly. Focus on the main objective, methodology, key findings, and implications:\n\n${abstract}`
        }
      ]
    });
    return response.content[0].text.trim();
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

    const response = await client.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    });

    let jsonText = response.content[0].text.trim();
    // Clean any accidental markdown code blocks
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
