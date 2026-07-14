import { supabase } from "../db/supabaseClient.js";
import { generateSectionDraft } from "../services/aiService.js";

export async function createSectionDraft(projectId, sectionType) {
  if (!sectionType) {
    throw new Error("Missing required field: section_type");
  }

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (projectError) throw new Error(projectError.message);

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
