import { supabase } from "../db/supabaseClient.js";

// Get workflow steps
export async function getWorkflow(projectId) {
  const { data, error } = await supabase
    .from("workflow_steps")
    .select("*")
    .eq("project_id", projectId);

  if (error) throw new Error(error.message);
  return data;
}

// Complete a workflow step
export async function completeWorkflowStep(projectId, stepName) {
  const { data, error } = await supabase
    .from("workflow_steps")
    .update({
      is_completed: true,
      completed_at: new Date()
    })
    .eq("project_id", projectId)
    .eq("step_name", stepName)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}
