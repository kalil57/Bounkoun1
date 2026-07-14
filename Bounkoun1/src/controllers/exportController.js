import { supabase } from "../db/supabaseClient.js";
import { Document, Packer, Paragraph, HeadingLevel } from "docx";

async function getProjectWithSections(projectId) {
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (projectError) throw new Error(projectError.message);

  const { data: sections, error: sectionsError } = await supabase
    .from("sections")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (sectionsError) throw new Error(sectionsError.message);

  return { project, sections: sections || [] };
}

function sectionTitle(sectionType) {
  return sectionType
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

export async function exportMarkdown(projectId) {
  const { project, sections } = await getProjectWithSections(projectId);

  let md = `# ${project.title}\n\n`;
  md += `**Discipline:** ${project.discipline}  \n`;
  md += `**Academic Level:** ${project.academic_level}\n\n`;

  if (project.selected_topic) {
    md += `**Topic:** ${project.selected_topic}\n\n`;
  }

  if (sections.length === 0) {
    md += `_No sections have been drafted yet._\n`;
  }

  for (const section of sections) {
    md += `## ${sectionTitle(section.section_type)}\n\n`;
    md += `${section.content}\n\n`;
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

  if (project.selected_topic) {
    children.push(new Paragraph({ text: `Topic: ${project.selected_topic}` }));
  }

  for (const section of sections) {
    children.push(
      new Paragraph({ text: sectionTitle(section.section_type), heading: HeadingLevel.HEADING_1 })
    );
    const paragraphs = section.content.split("\n\n").filter(Boolean);
    for (const p of paragraphs) {
      children.push(new Paragraph({ text: p }));
    }
  }

  const doc = new Document({ sections: [{ children }] });
  return await Packer.toBuffer(doc);
}
