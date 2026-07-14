import { createOutline } from "../services/writingService.js";
import { isValidUuid } from "../utils/validators.js";

export async function handleCreateOutline(req, res) {
  const { projectId } = req.params;

  if (!projectId) {
    return res.status(400).json({ error: "Missing required parameter: projectId" });
  }

  // Validate UUID format if necessary (allowing mock formats but logging warnings)
  if (!isValidUuid(projectId)) {
    console.warn(`Provided projectId ${projectId} is not a valid UUID format, continuing anyway for compatibility.`);
  }

  try {
    const result = await createOutline(projectId);
    return res.status(201).json(result);
  } catch (error) {
    console.error("Outline controller error:", error);
    return res.status(500).json({ error: error.message });
  }
}
