import { supabase } from "../db/supabaseClient.js";

export async function selectPapers(projectId, paperIds) {
  if (!Array.isArray(paperIds) || paperIds.length === 0) {
    throw new Error("Missing required field: paper_ids (array)");
  }

  const { data, error } = await supabase
    .from("papers")
    .update({ is_selected: true, selected_at: new Date().toISOString() })
    .eq("project_id", projectId)
    .in("id", paperIds)
    .select();

  if (error) throw new Error(error.message);
  return data;
}

export async function deselectPaper(projectId, paperId) {
  const { data, error } = await supabase
    .from("papers")
    .update({ is_selected: false, selected_at: null })
    .eq("project_id", projectId)
    .eq("id", paperId)
    .select();

  if (error) throw new Error(error.message);
  return data;
}

export async function getSelectedPapers(projectId) {
  const { data, error } = await supabase
    .from("papers")
    .select("*")
    .eq("project_id", projectId)
    .eq("is_selected", true);

  if (error) throw new Error(error.message);
  return data;
}
