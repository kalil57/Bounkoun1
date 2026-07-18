import { supabase } from "../db/supabaseClient.js";
import { generateResearchQuestion, validateResearchQuestionAI } from "../services/aiService.js";

// Suggest research questions
export async function suggestResearchQuestion(projectId) {
  const { data: project, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (error) throw new Error(error.message);

  const question = await generateResearchQuestion(project);
  return question;
}

// Select research question
export async function selectResearchQuestion(projectId, question) {
  const { data, error } = await supabase
    .from("research_questions")
    .insert({
      project_id: projectId,
      text: question,
      is_final: true
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await supabase
    .from("projects")
    .update({ status: "literature_pending" })
    .eq("id", projectId);

  return data;
}

// Validate research question
export async function validateResearchQuestion(projectId, question) {
  const { data: project, error } = await supabase
    .from("projects")
    .select("academic_level")
    .eq("id", projectId)
    .single();

  const level = (project && !error) ? project.academic_level : "Bachelor";
  const validation = await validateResearchQuestionAI(question, level);
  return validation;
}

// Get all research questions
export async function getAllQuestions(projectId) {
  const { data, error } = await supabase
    .from("research_questions")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

