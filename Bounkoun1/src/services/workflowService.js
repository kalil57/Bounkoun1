import { getWorkflow, completeWorkflowStep } from "../controllers/workflowController.js";

export async function handleGetWorkflow(projectId) {
  return await getWorkflow(projectId);
}

export async function handleCompleteWorkflowStep(projectId, body) {
  return await completeWorkflowStep(projectId, body.step_name);
}
