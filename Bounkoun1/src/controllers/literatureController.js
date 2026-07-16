import { supabase } from "../db/supabaseClient.js";
import { analyzeLiteratureAndRecommend } from "../services/aiService.js";
import { AppError } from "../utils/AppError.js";

export async function generateRecommendation(projectId) {
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (projectError || !project) throw new AppError(404, "Project not found");

  const { data: papers, error: papersError } = await supabase
    .from("papers")
    .select("*")
    .eq("project_id", projectId)
    .eq("is_selected", true);

  if (papersError) throw new Error(papersError.message);

  if (!papers || papers.length === 0) {
    throw new AppError(400, "No papers selected yet. Select at least a few real papers before requesting a recommendation.");
  }

  const result = await analyzeLiteratureAndRecommend(project, papers);

  const { data: saved, error: saveError } = await supabase
    .from("literature_recommendations")
    .insert({
      project_id: projectId,
      recommended_question: result.recommended_question,
      rationale: result.rationale,
      suggested_variables: result.suggested_variables,
      supporting_paper_ids: papers.map((p) => p.id)
    })
    .select()
    .single();

  if (saveError) throw new Error(saveError.message);
  return saved;
}

export async function getRecommendation(projectId) {
  const { data, error } = await supabase
    .from("literature_recommendations")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}
