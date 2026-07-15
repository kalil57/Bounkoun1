import { GoogleGenAI } from "@google/genai";

const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
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

export async function generateSectionDraft(project, sectionTitle, researchQuestion, userData) {
  const dataInstruction = userData
    ? `The student has provided the following real research data/notes 
for this section. Write it up clearly in formal academic prose. Do 
NOT invent, add, or embellish any findings beyond what is given:\n\n${userData}`
    : `Write this section based on standard academic conventions for 
this chapter type. Do not state specific numeric results, statistics, 
or findings as if real data exists — this chapter does not report 
actual research results.`;

  const prompt = `You are an academic thesis-writing assistant. Write 
the "${sectionTitle}" section of a ${project.academic_level}-level 
thesis.

Discipline: ${project.discipline}
Topic: ${project.selected_topic || "Not yet selected"}
Research Question: ${researchQuestion || "Not yet finalized"}

${dataInstruction}

Match the depth and tone to the academic level. Write only the section 
content itself — no title, no markdown headers, no meta-commentary. 
Aim for 2-4 well-developed paragraphs.`;

  const response = await client.models.generateContent({
    model: MODEL,
    contents: prompt
  });

  return response.text.trim();
}

export async function generateOutline(project, researchQuestion) {
  const prompt = `You are an academic thesis advisor. Create a 
complete, numbered thesis outline for a ${project.academic_level}-level 
${project.discipline} thesis.

Topic: ${project.selected_topic}
Research Question: ${researchQuestion || "Not yet finalized"}

Structure it as standard academic thesis chapters with numbered 
subsections (e.g. 1, 1.1, 1.2, 1.2.1). Include these top-level 
chapters in order: Introduction, Literature Review, Methodology, 
Findings, Discussion, Conclusion. Give each chapter 2-4 meaningful 
subsections appropriate to the topic (not generic placeholders).

For the Findings chapter specifically, mark requires_user_data as true 
for its subsections, since real research data must come from the 
student, not be invented.

Return ONLY a JSON array, no markdown, no extra text, in exactly this 
shape:
[
  {"section_number": "1", "title": "Introduction", "level": 1, "requires_user_data": false},
  {"section_number": "1.1", "title": "Background of the Study", "level": 2, "requires_user_data": false},
  ...
]`;

  const response = await client.models.generateContent({
    model: MODEL,
    contents: prompt
  });

  return extractJson(response.text);
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
