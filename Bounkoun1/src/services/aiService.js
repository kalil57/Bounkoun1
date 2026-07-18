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

export async function generateSectionDraft(project, sectionTitle, researchQuestion, userData, sourcePapers, stylePreference, citationStyle, formalityPreset) {
  const levelGuides = {
    Bachelor: `Use clear, accessible academic language. Favor 
moderate-length sentences and a straightforward argument structure. 
Introduce technical terms with brief definitions. Keep theoretical 
discussion light -- focus on clear description, application, and 
well-organized reasoning rather than deep critical synthesis of 
competing theories.`,
    Master: `Use sophisticated academic vocabulary and varied sentence 
structure. Engage critically with existing theory and literature 
rather than just describing it -- compare, contrast, and evaluate 
competing perspectives. Show awareness of methodological nuance.`,
    PhD: `Use precise, discipline-specific academic register with 
complex, well-controlled sentence structures. Engage deeply and 
critically with theoretical frameworks, situate the argument within 
ongoing scholarly debates, and foreground original contribution. Use 
careful academic hedging and nuance (acknowledging limitations, 
alternative interpretations) without being vague.`
  };
  const levelGuide = levelGuides[project.academic_level] || levelGuides.Bachelor;

  let citationInstruction = `You may cite these real, verified sources in-text using 
(Author Surname, Year) format when a claim genuinely draws on them.`;
  if (citationStyle) {
    citationInstruction = `You may cite these real, verified sources in-text in the specified citation_style format (${citationStyle}) when a claim genuinely draws on them. For reference, format citations as:
- APA: (Author, Year) or Author (Year)
- MLA: (Author Page) or Author (Page)
- Chicago: (Author Year, Page) or footnote style
- GBT7714: [Number] corresponding to the source, or standard Chinese GBT7714 format`;
  }

  const citationBlock = sourcePapers && sourcePapers.length > 0
    ? `${citationInstruction} 
Only cite from this exact list -- never invent a citation or reference 
any source not listed here. Not every sentence needs a citation; only 
cite when making a specific claim, comparison, or finding that is 
actually attributable to one of these works:\n\n${sourcePapers.map((p) => `- ${(p.authors && p.authors[0]) || "Unknown"}${p.authors && p.authors.length > 1 ? " et al." : ""} (${p.year || "n.d."}): "${p.title}"`).join("\n")}`
    : `No verified sources are available for this section yet. Do NOT 
include any citations, and do not reference any specific studies, 
authors, or papers by name -- write generally instead.`;

  const dataInstruction = userData
    ? `The student has provided the following real research data/notes 
for this section. Write it up clearly in formal academic prose. Do 
NOT invent, add, or embellish any findings beyond what is given:\n\n${userData}`
    : `Write this section based on standard academic conventions for 
this chapter type. Do not state specific numeric results, statistics, 
or findings as if real data exists -- this chapter does not report 
actual research results.`;

  const styleBlock = stylePreference && stylePreference.trim()
    ? `\n\nThe student has specified this personal writing style 
preference -- follow it as closely as possible while still maintaining 
academic rigor: "${stylePreference}"`
    : "";

  const formalityGuides = {
    Formal: "- Tone: Formal. Traditional academic distance, structured, passive or objective voice, highly rigorous and detached.",
    Analytical: "- Tone: Analytical. Critical and evaluative, active engagement, comparing viewpoints, probing assumptions, and evaluating evidence critically.",
    Direct: "- Tone: Direct. Clear and concise with minimal hedging, straightforward and active voice, avoiding unnecessary wordiness."
  };
  const formalityBlock = formalityPreset && formalityGuides[formalityPreset]
    ? `\n${formalityGuides[formalityPreset]}`
    : "";

  const prompt = `You are an experienced human academic author helping 
a ${project.academic_level} student write their thesis. Write the 
"${sectionTitle}" section.

Discipline: ${project.discipline}
Topic: ${project.selected_topic || "Not yet selected"}
Research Question: ${researchQuestion || "Not yet finalized"}

WRITING VOICE -- CRITICAL:
Write like an experienced human academic author, not a generic AI 
assistant. Specifically:
- Vary sentence length and structure naturally
- Avoid repetitive, formulaic openers like "Furthermore," "Moreover," 
"In conclusion," or "It is important to note that" appearing more than 
once in the section
- Avoid generic AI filler phrases and hedge-everything language
- Write with a clear point of view and specific, confident claims 
rather than vague generalities
- Do not use bullet points or numbered lists inside the prose unless 
the section genuinely calls for it
- Do not include meta-commentary about what the section will do (e.g. 
"This section will discuss...")${formalityBlock}

ACADEMIC LEVEL CALIBRATION (${project.academic_level}):
${levelGuide}

SOURCE CITATION:
${citationBlock}

${dataInstruction}

Write only the section content itself -- no title, no markdown 
headers. Aim for 2-4 well-developed paragraphs.${styleBlock}`;

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

export async function generateAbstractAndKeywords(project, sectionsContent) {
  const combinedContent = sectionsContent
    .map((s) => `${s.section_number} ${s.title}\n${s.content}`)
    .join("\n\n");

  const prompt = `You are an academic thesis advisor. Based on the 
following complete thesis content, write a proper academic abstract 
and a list of keywords.

Thesis Title/Topic: ${project.selected_topic}
Academic Level: ${project.academic_level}
Discipline: ${project.discipline}

Full thesis content:
${combinedContent}

The abstract must be 150-250 words, written so a reader understands 
the entire thesis — purpose, approach, and conclusions — from reading 
only the abstract. Do not use headers or labels within the abstract 
text itself.

Provide 4-6 relevant academic keywords.

Return ONLY a JSON object in exactly this shape, no markdown, no extra text:
{
  "abstract": "<the abstract text>",
  "keywords": ["keyword1", "keyword2", ...]
}`;

  const response = await client.models.generateContent({
    model: MODEL,
    contents: prompt
  });

  return extractJson(response.text);
}

export async function analyzeLiteratureAndRecommend(project, papers) {
  const paperSummaries = papers
    .map((p, i) => `[Paper ${i + 1}] "${p.title}" (${p.year || "n.d."})\nAuthors: ${(p.authors || []).join(", ")}\nAbstract: ${p.abstract || "No abstract available"}`)
    .join("\n\n");

  const prompt = `You are an academic research advisor. Below are 
real, published papers the student has selected as relevant to their 
thesis. Analyze ONLY these papers — do not invent or reference any 
research not shown here.

Student's Thesis Topic: ${project.selected_topic}
Academic Level: ${project.academic_level}
Discipline: ${project.discipline}

Selected Papers:
${paperSummaries}

Based STRICTLY on what these papers actually studied (their research 
questions, methods, and variables as evidenced in their abstracts), 
recommend:
1. A strong research question for the student's own thesis that builds 
on gaps or patterns you observe across these real papers
2. A rationale explaining your reasoning, explicitly referencing which 
paper numbers informed which part of your recommendation
3. Suggested variables or factors to examine, again grounded in what 
these papers actually measured or discussed

If the provided papers don't clearly support a strong recommendation, 
say so honestly rather than inventing a confident-sounding one.

Return ONLY a JSON object in exactly this shape, no markdown, no extra text:
{
  "recommended_question": "<string>",
  "rationale": "<string, must reference paper numbers like [Paper 2]>",
  "suggested_variables": [<string>, ...]
}`;

  const response = await client.models.generateContent({
    model: MODEL,
    contents: prompt
  });

  return extractJson(response.text);
}

