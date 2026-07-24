import { supabase } from "../db/supabaseClient.js";
import { initializeDefaultWorkflowSteps } from "../services/workflowInit.js";
import { AppError } from "../utils/AppError.js";

// Create a new project
export async function createProject(data, userId) {
  const { title, discipline, academic_level } = data;
  if (!title || !discipline || !academic_level) {
    throw new AppError(400, "Missing required fields: title, discipline, academic_level");
  }

  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      title,
      discipline,
      academic_level,
      user_id: userId,
      status: "topic_pending"
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await initializeDefaultWorkflowSteps(project.id);
  return project;
}

// Get project by ID
export async function getProjectById(id) {
  const { data: project, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !project) throw new AppError(404, "Project not found");
  return project;
}

// Get all projects
export async function getAllProjects(userId) {
  const { data: projects, error } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
  return projects;
}

export async function updateStylePreference(projectId, { style_preference, citation_style, formality_preset, writing_language, font_family, font_size } = {}) {
  const updateData = {};

  if (style_preference !== undefined) updateData.style_preference = style_preference;

  if (citation_style !== undefined) {
    const validStyles = ["APA", "MLA", "Chicago", "GBT7714"];
    if (citation_style !== null && citation_style !== "" && !validStyles.includes(citation_style)) {
      throw new AppError(400, `Invalid citation style. Must be one of: ${validStyles.join(", ")}`);
    }
    updateData.citation_style = citation_style;
  }

  if (formality_preset !== undefined) {
    const validPresets = ["Formal", "Analytical", "Direct"];
    if (formality_preset !== null && formality_preset !== "" && !validPresets.includes(formality_preset)) {
      throw new AppError(400, `Invalid formality preset. Must be one of: ${validPresets.join(", ")}`);
    }
    updateData.formality_preset = formality_preset;
  }

  if (writing_language !== undefined) {
    const validLanguages = ["English", "Chinese"];
    if (writing_language !== null && writing_language !== "" && !validLanguages.includes(writing_language)) {
      throw new AppError(400, `Invalid writing language. Must be one of: ${validLanguages.join(", ")}`);
    }
    updateData.writing_language = writing_language;
  }

  if (font_family !== undefined) {
    const validFamilies = ["Times New Roman", "Arial", "Calibri", "Cambria", "Georgia"];
    if (font_family !== null && font_family !== "" && !validFamilies.includes(font_family)) {
      throw new AppError(400, `Invalid font family. Must be one of: ${validFamilies.join(", ")}`);
    }
    updateData.font_family = font_family;
  }

  if (font_size !== undefined) {
    const validSizes = [10, 11, 12, 14, 16];
    const sizeNum = Number(font_size);
    if (font_size !== null && font_size !== "" && !validSizes.includes(sizeNum)) {
      throw new AppError(400, `Invalid font size. Must be one of: ${validSizes.join(", ")}`);
    }
    updateData.font_size = font_size !== null && font_size !== "" ? sizeNum : font_size;
  }

  const { data, error } = await supabase
    .from("projects")
    .update(updateData)
    .eq("id", projectId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}
