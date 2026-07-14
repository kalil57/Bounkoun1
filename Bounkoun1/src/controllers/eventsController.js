import { supabase } from "../db/supabaseClient.js";

export async function logEvent(projectId, body) {
  const { event_type, payload } = body;

  if (!event_type) {
    throw new Error("Missing required field: event_type");
  }

  const { data, error } = await supabase
    .from("events")
    .insert({
      project_id: projectId,
      event_type: event_type,
      payload: payload || {}
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getEventsForProject(projectId) {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
