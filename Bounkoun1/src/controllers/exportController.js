import { supabase } from "../db/supabaseClient.js";
import { Document, Packer, Paragraph, HeadingLevel } from "docx";
import { AppError } from "../utils/AppError.js";

async function getProjectWithSections(projectId) {
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (projectError || !project) throw new AppError(404, "Project not found");

  const { data: sections, error: sectionsError } = await supabase
    .from("sections")
    .select("*")
    .eq("project_id", projectId)
    .order("order_index", { ascending: true });

  if (sectionsError) throw new Error(sectionsError.message);

  return { project, sections: sections || [] };
}

export async function exportMarkdown(projectId) {
  const { project, sections } = await getProjectWithSections(projectId);

  let md = `# ${project.title}\n\n`;
  md += `**Discipline:** ${project.discipline}  \n`;
  md += `**Academic Level:** ${project.academic_level}\n\n`;

  if (project.selected_topic) {
    md += `**Topic:** ${project.selected_topic}\n\n`;
  }

  if (project.abstract) {
    md += `## Abstract\n\n${project.abstract}\n\n`;
  }
  if (project.keywords && project.keywords.length > 0) {
    md += `**Keywords:** ${project.keywords.join(", ")}\n\n`;
  }

  if (sections.length === 0) {
    md += `_No sections have been drafted yet._\n`;
  }

  for (const section of sections) {
    const heading = "#".repeat(Math.min(section.level + 1, 6));
    md += `${heading} ${section.section_number}. ${section.title}\n\n`;
    md += section.content ? `${section.content}\n\n` : `_Not yet drafted._\n\n`;
  }

  return md;
}

export async function exportDocx(projectId) {
  const { project, sections } = await getProjectWithSections(projectId);

  const children = [
    new Paragraph({ text: project.title, heading: HeadingLevel.TITLE }),
    new Paragraph({ text: `Discipline: ${project.discipline}` }),
    new Paragraph({ text: `Academic Level: ${project.academic_level}` })
  ];

  if (project.abstract) {
    children.push(new Paragraph({ text: "Abstract", heading: HeadingLevel.HEADING_1 }));
    children.push(new Paragraph({ text: project.abstract }));
  }
  if (project.keywords && project.keywords.length > 0) {
    children.push(new Paragraph({ text: `Keywords: ${project.keywords.join(", ")}` }));
  }

  for (const section of sections) {
    const headingLevel = section.level === 1 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2;
    children.push(
      new Paragraph({ text: `${section.section_number}. ${section.title}`, heading: headingLevel })
    );
    const content = section.content || "Not yet drafted.";
    const paragraphs = content.split("\n\n").filter(Boolean);
    for (const p of paragraphs) {
      children.push(new Paragraph({ text: p }));
    }
  }

  const doc = new Document({ sections: [{ children }] });
  return await Packer.toBuffer(doc);
}

