import { writeChapter } from "../services/writingService.js";
import { validateTextInput } from "../utils/validators.js";

export async function handleWriteChapter(req, res) {
  const { projectId } = req.params;
  const { chapterTitle } = req.body;

  if (!projectId) {
    return res.status(400).json({ error: "Missing required parameter: projectId" });
  }

  if (!validateTextInput(chapterTitle, 2)) {
    return res.status(400).json({ error: "Missing or invalid body parameter: chapterTitle. Must be at least 2 characters." });
  }

  try {
    const result = await writeChapter(projectId, chapterTitle);
    return res.status(201).json(result);
  } catch (error) {
    console.error("Chapters controller error:", error);
    return res.status(500).json({ error: error.message });
  }
}
