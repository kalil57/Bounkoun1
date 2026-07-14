import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";
import { cleanMarkdownJson } from "../utils/formatters.js";

dotenv.config();

let anthropicClient = null;

function getAnthropicClient() {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.warn("⚠️ Warning: ANTHROPIC_API_KEY is not defined in the environment. AI generation requests will fail.");
    }
    anthropicClient = new Anthropic({
      apiKey: apiKey || "dummy-key-to-prevent-constructor-crash"
    });
  }
  return anthropicClient;
}

export async function generateOutline(project, literature = []) {
  const client = getAnthropicClient();
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // Return a rich mockup outline to prevent absolute failure if key is missing
    return {
      title: project.title || "Academic Thesis",
      description: project.description || "",
      chapters: [
        {
          chapter_title: "Chapter 1: Introduction",
          sections: [
            "1.1 Background of the Study",
            "1.2 Statement of the Problem",
            "1.3 Research Questions and Hypotheses",
            "1.4 Significance of the Study"
          ]
        },
        {
          chapter_title: "Chapter 2: Literature Review",
          sections: [
            "2.1 Theoretical Framework",
            "2.2 Review of Relevant Empirical Research",
            "2.3 Identification of Knowledge Gaps"
          ]
        },
        {
          chapter_title: "Chapter 3: Methodology",
          sections: [
            "3.1 Research Design",
            "3.2 Data Collection Protocols",
            "3.3 Data Analysis Procedures"
          ]
        }
      ]
    };
  }

  const literatureContext = literature.length > 0 
    ? literature.map((p, idx) => `[Paper ${idx + 1}] Title: ${p.title || "Untitled"}, Authors: ${(p.authors || []).join(", ")}, Year: ${p.year || "n.d."}\nAbstract: ${p.abstract || "N/A"}`).join("\n\n")
    : "No supporting literature papers provided.";

  const prompt = `
You are an elite academic writing assistant. Generate a highly structured, comprehensive academic thesis outline for the following project.

PROJECT DETAILS:
Title: ${project.title || "Untitled Project"}
Description: ${project.description || "No description provided."}
Academic Level: ${project.academicLevel || "Master/PhD level"}

LITERATURE FOUNDATION:
${literatureContext}

Generate a clear, nested academic outline. The output MUST be a valid JSON object matching the following structure:
{
  "title": "A highly refined, academically rigorous title for the thesis",
  "description": "A summary of the conceptual scope",
  "chapters": [
    {
      "chapter_title": "Chapter title (e.g. Chapter 1: Introduction)",
      "sections": [
        "Section title (e.g. 1.1 Research Context)",
        "Section title (e.g. 1.2 Problem Statement)"
      ]
    }
  ]
}

Return ONLY valid JSON. Do not include any explanations, introductory text, markdown code blocks, or postambles.
`;

  try {
    const response = await client.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    });

    const text = cleanMarkdownJson(response.content[0].text);
    return JSON.parse(text);
  } catch (error) {
    console.error("Error in generateOutline AI service:", error.message);
    throw new Error(`Outline generation failed: ${error.message}`);
  }
}

export async function generateSection(sectionName, project, literature = []) {
  const client = getAnthropicClient();
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return `[Mock AI Content] This is a placeholder for section "${sectionName}". To generate real academic prose, please configure ANTHROPIC_API_KEY in your environment. This section would synthesize the research context for "${project.title || 'the project'}".`;
  }

  const literatureContext = literature.length > 0 
    ? literature.map((p, idx) => `[Paper ${idx + 1}] Title: ${p.title || "Untitled"}, Authors: ${(p.authors || []).join(", ")}, Year: ${p.year || "n.d."}\nAbstract: ${p.abstract || "N/A"}`).join("\n\n")
    : "No supporting literature papers provided.";

  const prompt = `
You are an elite academic writer. Write an extensive, rigorous academic section titled "${sectionName}" for the following project.

PROJECT DETAILS:
Title: ${project.title || "Untitled Project"}
Description: ${project.description || "No description provided."}
Academic Level: ${project.academicLevel || "Advanced Academic"}

LITERATURE FOUNDATION (Integrate and cite these where conceptually relevant, using APA parenthetical style):
${literatureContext}

REQUIREMENTS:
1. Write in a formal, highly scholarly academic style.
2. Formulate clear academic arguments with logical flow and high-density terminology.
3. Integrate relevant citations from the provided literature using standard APA in-text format (e.g., Smith et al., 2021).
4. Do not include any meta-commentary, placeholders, introductory pleasantries, or conclusions of your own. Just write the section prose.
`;

  try {
    const response = await client.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    });

    return response.content[0].text.trim();
  } catch (error) {
    console.error("Error in generateSection AI service:", error.message);
    throw new Error(`Section generation failed: ${error.message}`);
  }
}

export async function generateChapter(chapterTitle, project, literature = []) {
  const client = getAnthropicClient();
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return `[Mock AI Content] This is a placeholder for chapter "${chapterTitle}". To generate real full chapters, please configure ANTHROPIC_API_KEY in your environment. This chapter would provide a complete discourse for "${project.title || 'the project'}".`;
  }

  const literatureContext = literature.length > 0 
    ? literature.map((p, idx) => `[Paper ${idx + 1}] Title: ${p.title || "Untitled"}, Authors: ${(p.authors || []).join(", ")}, Year: ${p.year || "n.d."}\nAbstract: ${p.abstract || "N/A"}`).join("\n\n")
    : "No supporting literature papers provided.";

  const prompt = `
You are an elite academic professor. Write an entire, extensive academic chapter titled "${chapterTitle}" for the following project.

PROJECT DETAILS:
Title: ${project.title || "Untitled Project"}
Description: ${project.description || "No description provided."}
Academic Level: ${project.academicLevel || "Doctoral Level"}

LITERATURE FOUNDATION:
${literatureContext}

REQUIREMENTS:
1. Provide a comprehensive, full-length academic chapter. Break it down logically with clean structural subtitles (e.g., introduction, deep review, synthesis, summary).
2. Synthesize critical themes and arguments with maximum logical cohesion and high academic rigor.
3. Incorporate relevant APA in-text citations referencing the provided literature.
4. Output must be raw prose ready for publishing. Do not include any preambles, chatty opening notes, or post-generation questions.
`;

  try {
    const response = await client.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 3000,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    });

    return response.content[0].text.trim();
  } catch (error) {
    console.error("Error in generateChapter AI service:", error.message);
    throw new Error(`Chapter generation failed: ${error.message}`);
  }
}

export async function polishText(text) {
  const client = getAnthropicClient();
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return `${text}\n\n[Note: This text was not polished because ANTHROPIC_API_KEY is not configured in the environment.]`;
  }

  const prompt = `
You are an elite academic copyeditor. Rewrite the following text to maximize academic rigor, professional syntax, lexical diversity, clarity, and structural cohesion. 

INPUT TEXT:
"${text}"

INSTRUCTIONS:
1. Maintain the original core meaning, findings, and arguments, but significantly elevate the prose style and flow.
2. Remove conversational phrasing, passive verb chains, or redundant wording. Use clear, active, scholarly terminology.
3. Return only the revised polished text. Do not include any introductory remarks, revision notes, bullet lists of changes, or formatting boxes.
`;

  try {
    const response = await client.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 2500,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    });

    return response.content[0].text.trim();
  } catch (error) {
    console.error("Error in polishText AI service:", error.message);
    throw new Error(`Text polishing failed: ${error.message}`);
  }
}

export async function bilingualOutput(text) {
  const client = getAnthropicClient();
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      english: text,
      french: `[Mock Translation] (French translation of: "${text.substring(0, 50)}...")`
    };
  }

  const prompt = `
You are an academic translator. Given the following academic text, return both the English and French versions. If the input is in English, translate it to high-level academic French. If the input is in French, translate it to high-level academic English. Return both versions.

INPUT TEXT:
"${text}"

Your output MUST be a valid JSON object with the following structure:
{
  "english": "Complete, polished academic English text",
  "french": "Complete, polished academic French text"
}

Do not include any explanations, markdown code blocks, or preamble. Return ONLY the valid JSON object.
`;

  try {
    const response = await client.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 3000,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    });

    const jsonText = cleanMarkdownJson(response.content[0].text);
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Error in bilingualOutput AI service:", error.message);
    // Return graceful fallback
    return {
      english: text,
      french: `Failed to translate due to API error: ${error.message}`
    };
  }
}
