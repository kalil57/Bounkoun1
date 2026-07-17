import { supabase } from "../db/supabaseClient.js";
import { generateSectionDraft, validateSectionAI, generateOutline, generateAbstractAndKeywords } from "../services/aiService.js";
import { AppError } from "../utils/AppError.js";

export async function createOutline(projectId) {
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (projectError || !project) throw new AppError(404, "Project not found");

  const { data: questionRow } = await supabase
    .from("research_questions")
    .select("text")
    .eq("project_id", projectId)
    .eq("is_final", true)
    .single();

  const outlineItems = await generateOutline(project, questionRow?.text);

  const rows = outlineItems.map((item, index) => ({
    project_id: projectId,
    section_type: item.title.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
    section_number: item.section_number,
    title: item.title,
    level: item.level,
    order_index: index,
    requires_user_data: item.requires_user_data || false,
    status: "outlined"
  }));

  const { data: sections, error } = await supabase
    .from("sections")
    .insert(rows)
    .select();

  if (error) throw new Error(error.message);
  return sections;
}

export async function getOutline(projectId) {
  const { data, error } = await supabase
    .from("sections")
    .select("*")
    .eq("project_id", projectId)
    .order("order_index", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function generateDraftForOutlineItem(sectionId) {
  const { data: section, error } = await supabase
    .from("sections")
    .select("*, projects(*)")
    .eq("id", sectionId)
    .single();

  if (error || !section) throw new AppError(404, "Section not found");

  if (section.requires_user_data && !section.user_data) {
    throw new AppError(400, "This section requires real research data before it can be drafted. Submit your data first via /sections/:sectionId/submit-data");
  }

  const { data: questionRow } = await supabase
    .from("research_questions")
    .select("text")
    .eq("project_id", section.project_id)
    .eq("is_final", true)
    .single();

  const { data: sourcePapers } = await supabase
    .from("papers")
    .select("title, authors, year")
    .eq("project_id", section.project_id)
    .eq("is_selected", true);

  const draft = await generateSectionDraft(
    section.projects,
    section.title,
    questionRow?.text,
    section.user_data,
    sourcePapers || [],
    section.projects.style_preference
  );

  const { data: updated, error: updateError } = await supabase
    .from("sections")
    .update({ content: draft, status: "draft" })
    .eq("id", sectionId)
    .select()
    .single();

  if (updateError) throw new Error(updateError.message);
  return updated;
}

export async function submitSectionData(sectionId, userData) {
  if (!userData || userData.trim() === "") {
    throw new AppError(400, "Missing required field: user_data");
  }

  const { data, error } = await supabase
    .from("sections")
    .update({ user_data: userData, status: "data_submitted" })
    .eq("id", sectionId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function validateSection(sectionId) {
  const { data: section, error } = await supabase
    .from("sections")
    .select("*, projects(academic_level)")
    .eq("id", sectionId)
    .single();

  if (error || !section) throw new AppError(404, "Section not found");

  const validation = await validateSectionAI(
    section.content,
    section.section_type,
    section.projects.academic_level
  );

  return validation;
}

export async function generateAbstract(projectId) {
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (projectError || !project) throw new AppError(404, "Project not found");

  const { data: chapters, error } = await supabase
    .from("sections")
    .select("*")
    .eq("project_id", projectId)
    .eq("level", 1)
    .order("order_index", { ascending: true });

  if (error) throw new Error(error.message);

  const incomplete = chapters.filter((c) => !c.content);
  if (chapters.length === 0 || incomplete.length > 0) {
    throw new AppError(400, `Cannot generate abstract yet — these chapters still need drafts: ${incomplete.map((c) => c.title).join(", ") || "no outline exists yet"}`);
  }

  const result = await generateAbstractAndKeywords(project, chapters);

  const { data: updated, error: updateError } = await supabase
    .from("projects")
    .update({ abstract: result.abstract, keywords: result.keywords })
    .eq("id", projectId)
    .select()
    .single();

  if (updateError) throw new Error(updateError.message);
  return updated;
}

export async function editSectionContent(sectionId, content) {
  if (typeof content !== "string" || content.trim() === "") {
    throw new AppError(400, "Missing required field: content");
  }

  const { data, error } = await supabase
    .from("sections")
    .update({ content, status: "manually_edited" })
    .eq("id", sectionId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}
