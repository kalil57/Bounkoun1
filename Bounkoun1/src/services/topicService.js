import { suggestTopics, selectTopic } from "../controllers/topicController.js";

export async function handleSuggestTopics(projectId, body = {}) {
  return await suggestTopics(projectId, body.interest);
}

export async function handleSelectTopic(projectId, body) {
  return await selectTopic(projectId, body.topic);
}
