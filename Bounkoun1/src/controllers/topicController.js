import { supabase } from "../db/supabaseClient.js";
import { generateTopicSuggestions } from "../services/aiService.js";

export async function suggestTopics(projectId, interest) {
  const { data: project, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (error) throw new Error(error.message);

  const suggestions = await generateTopicSuggestions(project, interest);
  return suggestions;
}

// Select a topic
export async function selectTopic(projectId, topic) {
  const { data, error } = await supabase
    .from("projects")
    .update({ selected_topic: topic, status: "question_pending" })
    .eq("id", projectId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}
