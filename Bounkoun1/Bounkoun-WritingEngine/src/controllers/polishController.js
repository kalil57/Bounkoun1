import { polish } from "../services/writingService.js";
import { validateTextInput } from "../utils/validators.js";

export async function handlePolishText(req, res) {
  const { projectId } = req.params;
  const { text, bilingual } = req.body;

  if (!projectId) {
    return res.status(400).json({ error: "Missing required parameter: projectId" });
  }

  if (!validateTextInput(text, 5)) {
    return res.status(400).json({ error: "Missing or invalid body parameter: text. Must be at least 5 characters." });
  }

  try {
    const requestBilingual = bilingual === true || bilingual === "true";
    const result = await polish(projectId, text, requestBilingual);
    return res.status(201).json(result);
  } catch (error) {
    console.error("Polish controller error:", error);
    return res.status(500).json({ error: error.message });
  }
}
