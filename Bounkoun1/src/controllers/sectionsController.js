import { supabase } from "../db/supabaseClient.js";
import { generateSectionDraft } from "../services/aiService.js";
import { validateSectionAI } from "../services/aiService.js";
import { AppError } from "../utils/AppError.js";

export async function createSectionDraft(projectId, sectionType) {
  if (!sectionType) {
    throw new AppError(400, "Missing required field: section_type");
  }

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

  const draft = await generateSectionDraft(project, sectionType, questionRow?.text);

  const { data: section, error } = await supabase
    .from("sections")
    .insert({
      project_id: projectId,
      section_type: sectionType,
      content: draft,
      status: "draft"
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return section;
}

export async function getSectionsForProject(projectId) {
  const { data, error } = await supabase
    .from("sections")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

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
