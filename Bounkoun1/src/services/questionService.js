import {
  suggestResearchQuestion,
  selectResearchQuestion,
  validateResearchQuestion,
  getAllQuestions
} from "../controllers/questionController.js";

export async function handleSuggestResearchQuestion(projectId) {
  return await suggestResearchQuestion(projectId);
}

export async function handleSelectResearchQuestion(projectId, body) {
  return await selectResearchQuestion(projectId, body.question);
}

export async function handleValidateResearchQuestion(projectId, body) {
  return await validateResearchQuestion(projectId, body.question);
}

export async function handleGetAllQuestions(projectId) {
  return await getAllQuestions(projectId);
}

