import { writeSection } from "../services/writingService.js";
import { validateTextInput } from "../utils/validators.js";

export async function handleWriteSection(req, res) {
  const { projectId } = req.params;
  const { sectionName } = req.body;

  if (!projectId) {
    return res.status(400).json({ error: "Missing required parameter: projectId" });
  }

  if (!validateTextInput(sectionName, 2)) {
    return res.status(400).json({ error: "Missing or invalid body parameter: sectionName. Must be at least 2 characters." });
  }

  try {
    const result = await writeSection(projectId, sectionName);
    return res.status(201).json(result);
  } catch (error) {
    console.error("Sections controller error:", error);
    return res.status(500).json({ error: error.message });
  }
}
