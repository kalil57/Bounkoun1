import { supabase } from "../db/supabaseClient.js";

export async function initializeDefaultWorkflowSteps(projectId) {
  const steps = [
    { project_id: projectId, step_name: "Topic", is_completed: false },
    { project_id: projectId, step_name: "ResearchQuestion", is_completed: false },
    { project_id: projectId, step_name: "Literature", is_completed: false },
    { project_id: projectId, step_name: "Writing", is_completed: false },
    { project_id: projectId, step_name: "Validation", is_completed: false },
    { project_id: projectId, step_name: "Conclusion", is_completed: false }
  ];

  const { data, error } = await supabase
    .from("workflow_steps")
    .insert(steps)
    .select();

  if (error) {
    throw new Error(`Failed to initialize workflow steps: ${error.message}`);
  }
  return data;
}
