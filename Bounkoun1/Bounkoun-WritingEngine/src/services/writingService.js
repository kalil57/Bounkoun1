import { supabase } from "../db/supabaseClient.js";
import { 
  generateOutline, 
  generateSection, 
  generateChapter, 
  polishText,
  bilingualOutput 
} from "./aiService.js";

// Helper to fetch project details with safe fallback
async function getProjectDetails(projectId) {
  try {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (error || !data) {
      console.warn(`Project with ID ${projectId} not found in database. Using defaults.`);
      return {
        id: projectId,
        title: "Advanced Research Study",
        description: "An intensive academic study on modern technological paradigms.",
        academicLevel: "Master/PhD level"
      };
    }
    return data;
  } catch (err) {
    console.warn(`Error getting project details: ${err.message}. Using defaults.`);
    return {
      id: projectId,
      title: "Advanced Research Study",
      description: "An intensive academic study on modern technological paradigms.",
      academicLevel: "Master/PhD level"
    };
  }
}

// Helper to fetch papers/literature associated with this project for academic referencing
async function getProjectLiterature(projectId) {
  try {
    const { data, error } = await supabase
      .from("papers")
      .select("*")
      .eq("project_id", projectId);

    if (error || !data) {
      console.warn(`No papers found for project ${projectId}.`);
      return [];
    }
    return data;
  } catch (err) {
    console.warn(`Error getting project literature: ${err.message}.`);
    return [];
  }
}

export async function createOutline(projectId) {
  // 1. Fetch project meta & literature
  const project = await getProjectDetails(projectId);
  const literature = await getProjectLiterature(projectId);

  // 2. Request AI Outline
  const structure = await generateOutline(project, literature);

  // 3. Save to database
  try {
    const { data, error } = await supabase
      .from("outlines")
      .insert({
        project_id: projectId,
        structure: structure
      })
      .select()
      .single();

    if (error) {
      console.warn("Could not save outline to database:", error.message);
      return {
        id: "temp-outline-" + Math.random().toString(36).substring(2, 11),
        project_id: projectId,
        structure,
        created_at: new Date().toISOString()
      };
    }
    return data;
  } catch (err) {
    console.warn("Database error saving outline:", err.message);
    return {
      id: "temp-outline-" + Math.random().toString(36).substring(2, 11),
      project_id: projectId,
      structure,
      created_at: new Date().toISOString()
    };
  }
}

export async function writeSection(projectId, sectionName) {
  // 1. Fetch project meta, literature & outline (for context)
  const project = await getProjectDetails(projectId);
  const literature = await getProjectLiterature(projectId);

  let outlineId = null;
  try {
    const { data: outline } = await supabase
      .from("outlines")
      .select("id")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    
    if (outline) outlineId = outline.id;
  } catch (e) {
    console.warn("No outline found for section writing context:", e.message);
  }

  // 2. Request AI Section
  const content = await generateSection(sectionName, project, literature);

  // 3. Save section to database
  try {
    const { data, error } = await supabase
      .from("sections")
      .insert({
        project_id: projectId,
        outline_id: outlineId,
        section_name: sectionName,
        content: content
      })
      .select()
      .single();

    if (error) {
      console.warn("Could not save section to database:", error.message);
      return {
        id: "temp-section-" + Math.random().toString(36).substring(2, 11),
        project_id: projectId,
        outline_id: outlineId,
        section_name: sectionName,
        content,
        created_at: new Date().toISOString()
      };
    }
    return data;
  } catch (err) {
    console.warn("Database error saving section:", err.message);
    return {
      id: "temp-section-" + Math.random().toString(36).substring(2, 11),
      project_id: projectId,
      outline_id: outlineId,
      section_name: sectionName,
      content,
      created_at: new Date().toISOString()
    };
  }
}

export async function writeChapter(projectId, chapterTitle) {
  // 1. Fetch project meta & literature
  const project = await getProjectDetails(projectId);
  const literature = await getProjectLiterature(projectId);

  // 2. Request AI Chapter
  const content = await generateChapter(chapterTitle, project, literature);

  // 3. Save chapter to database
  try {
    const { data, error } = await supabase
      .from("chapters")
      .insert({
        project_id: projectId,
        chapter_title: chapterTitle,
        content: content
      })
      .select()
      .single();

    if (error) {
      console.warn("Could not save chapter to database:", error.message);
      return {
        id: "temp-chapter-" + Math.random().toString(36).substring(2, 11),
        project_id: projectId,
        chapter_title: chapterTitle,
        content,
        created_at: new Date().toISOString()
      };
    }
    return data;
  } catch (err) {
    console.warn("Database error saving chapter:", err.message);
    return {
      id: "temp-chapter-" + Math.random().toString(36).substring(2, 11),
      project_id: projectId,
      chapter_title: chapterTitle,
      content,
      created_at: new Date().toISOString()
    };
  }
}

export async function polish(projectId, text, requestBilingual = false) {
  // 1. Request AI Polish
  const polishedText = await polishText(text);

  let bilingual = null;
  if (requestBilingual) {
    try {
      bilingual = await bilingualOutput(polishedText);
    } catch (err) {
      console.warn("Bilingual translation failed during polish:", err.message);
    }
  }

  // 2. Save polished output to database
  try {
    const { data, error } = await supabase
      .from("polished_output")
      .insert({
        project_id: projectId,
        input_text: text,
        polished_text: polishedText
      })
      .select()
      .single();

    const result = data || {
      id: "temp-polished-" + Math.random().toString(36).substring(2, 11),
      project_id: projectId,
      input_text: text,
      polished_text: polishedText,
      created_at: new Date().toISOString()
    };

    if (bilingual) {
      result.bilingual = bilingual;
    }
    
    return result;
  } catch (err) {
    console.warn("Database error saving polished text:", err.message);
    const result = {
      id: "temp-polished-" + Math.random().toString(36).substring(2, 11),
      project_id: projectId,
      input_text: text,
      polished_text: polishedText,
      created_at: new Date().toISOString()
    };
    if (bilingual) {
      result.bilingual = bilingual;
    }
    return result;
  }
}
