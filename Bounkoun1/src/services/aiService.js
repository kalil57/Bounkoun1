import { GoogleGenAI } from "@google/genai";

const client = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});
const MODEL = "gemini-3.1-flash-lite";

function extractJson(text) {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "");
  const start = cleaned.search(/[[{]/);
  const end = Math.max(cleaned.lastIndexOf("]"), cleaned.lastIndexOf("}"));
  const jsonSlice = start !== -1 && end !== -1 ? cleaned.slice(start, end + 1) : cleaned;
  return JSON.parse(jsonSlice);
}

export async function generateTopicSuggestions(project, interest) {
  const interestLine = interest
    ? `The student is specifically interested in: ${interest}. Try to tailor topics toward this interest where academically sound.`
    : "";

  const prompt = `You are an academic thesis advisor. Suggest 5 thesis topics for a ${project.academic_level}-level student.

Discipline: ${project.discipline}
${interestLine}

Match the depth and rigor of each topic to the academic level:
- Bachelor: simple, descriptive, clearly scoped
- Master: analytical, integrates existing theory
- PhD: rigorous, theoretically deep, aims for an original contribution

Return ONLY a JSON array of 5 strings (the topic titles). No markdown, no extra text.`;

  const response = await client.models.generateContent({
    model: MODEL,
    contents: prompt
  });

  return extractJson(response.text);
}

export async function generateResearchQuestion(project) {
  const prompt = `You are an academic thesis advisor. Generate one strong academic research question for a ${project.academic_level}-level student.

Discipline: ${project.discipline}
Selected Topic: ${project.selected_topic}

Return ONLY the question text, nothing else.`;

  const response = await client.models.generateContent({
    model: MODEL,
    contents: prompt
  });

  return response.text.trim();
}

export async function validateResearchQuestionAI(question, academicLevel = "Bachelor") {
  const prompt = `Evaluate the following ${academicLevel}-level academic research question:

"${question}"

Check for: clarity, feasibility, academic rigor, scope, and alignment with the ${academicLevel} academic level.

Return ONLY a JSON object in exactly this shape, no markdown, no extra text:
{
  "score": <number 0-100>,
  "strengths": [<string>, ...],
  "weaknesses": [<string>, ...],
  "recommendations": [<string>, ...]
}`;

  const response = await client.models.generateContent({
    model: MODEL,
    contents: prompt
  });

  return extractJson(response.text);
}

export async function generateSectionDraft(project, sectionType, researchQuestion) {
  const prompt = `You are an academic thesis-writing assistant. Write 
the "${sectionType}" section of a ${project.academic_level}-level 
thesis.

Discipline: ${project.discipline}
Topic: ${project.selected_topic || "Not yet selected"}
Research Question: ${researchQuestion || "Not yet finalized"}

Match the depth and tone to the academic level:
- Bachelor: clear, descriptive, straightforward structure
- Master: analytical, integrates existing theory and literature
- PhD: rigorous, theoretically deep, original contribution framing

Write only the section content itself — no title, no markdown headers, 
no meta-commentary. Aim for 3-5 well-developed paragraphs.`;

  const response = await client.models.generateContent({
    model: MODEL,
    contents: prompt
  });

  return response.text.trim();
}

export async function validateSectionAI(content, sectionType, academicLevel) {
  const prompt = `Evaluate the following "${sectionType}" section of a 
${academicLevel}-level academic thesis:

"${content}"

Check for: clarity, logical structure, academic tone, depth appropriate 
to the ${academicLevel} level, and whether it fulfills the typical 
purpose of a ${sectionType} section.

Return ONLY a JSON object in exactly this shape, no markdown, no extra text:
{
  "score": <number 0-100>,
  "strengths": [<string>, ...],
  "weaknesses": [<string>, ...],
  "recommendations": [<string>, ...]
}`;

  const response = await client.models.generateContent({
    model: MODEL,
    contents: prompt
  });

  return extractJson(response.text);
}
